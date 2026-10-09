// Public endpoint for /choose/:code. Records answers only; never deletes or moves data.
import {
  admin, baseVars, choiceLink, corsHeaders, healthFlags, isClosed, json, keyFor, loadSettings, personVars, render,
  sendEmail, validEmail, type Settings,
} from "../_shared/migration.ts";

const WINDOW_MS = 10 * 60 * 1000;
const LIMITS = { ip: 60, bad: 15, submit: 12 };

async function limited(db: ReturnType<typeof admin>, bucket: string, max: number) {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await db.from("migration_attempts").select("id", { count: "exact", head: true })
    .eq("bucket", bucket).gte("created_at", since);
  return (count ?? 0) >= max;
}
const record = (db: ReturnType<typeof admin>, bucket: string) => db.from("migration_attempts").insert({ bucket });

const norm = (t: string) => (t || "").toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");

function optionsFor(s: Settings, v: Record<string, string>) {
  return [1, 2, 3].map((n) => ({
    value: n,
    key: keyFor(s, n),
    label: render(s[`option${n}_label`], v),
    title: render(s[`option${n}_title`], v),
    text: render(s[`option${n}_text`], v),
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const db = admin();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "view");
    const s = await loadSettings(db);
    const v = baseVars(s);
    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();

    if (action === "privacy") {
      return json({ text: render(s.privacy_page_text, v) });
    }

    const invalid = () => json({ state: "invalid", message: render(s.invalid_link_text, v) });

    if (await limited(db, `ip:${ip}`, LIMITS.ip) || await limited(db, `bad:${ip}`, LIMITS.bad)) {
      return json({ state: "invalid", message: render(s.invalid_link_text, v), limited: true }, 429);
    }
    await record(db, `ip:${ip}`);
    // Occasional cleanup of old attempts
    if (Math.random() < 0.05) await db.from("migration_attempts").delete().lt("created_at", new Date(Date.now() - 86400000).toISOString());

    const code = String(body.code || "");
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(code)) { await record(db, `bad:${ip}`); return invalid(); }

    const { data: row } = await db.from("migration_choices").select("*").eq("code", code).maybeSingle();
    if (!row || row.revoked_at) { await record(db, `bad:${ip}`); return invalid(); }

    // Test rows (pilot) work while the feature is switched off; real rows do not.
    if (s.enabled !== "true" && !row.is_test) return json({ state: "not_open", message: render(s.not_open_text, v) });
    if (row.needs_admin && !row.admin_cleared_at) return json({ state: "needs_admin", message: render(s.needs_admin_text, v) });
    if (isClosed(s.cut_off_date)) return json({ state: "closed", message: render(s.closed_text, v) });

    const pv = personVars(s, row.name, row.practitioner_name);
    const options = optionsFor(s, pv);
    const tick = render(s.keep_all_tick_text, pv);
    const protectedWarning = row.protect_account ? render(s.protected_delete_warning, pv) : "";

    if (action === "view") {
      if (!row.link_opened_at) {
        await db.from("migration_choices").update({
          link_opened_at: new Date().toISOString(),
          contact_status: ["not_sent", "sent"].includes(row.contact_status) ? "opened" : row.contact_status,
        }).eq("id", row.id);
      }
      // Counts only. Never images, paths or file names.
      const counts = { creator_types: 0, case_studies: 0, photos: 0, session_images: 0, paper_assessments: 0, health: false };
      if (row.user_id) {
        const [ct, cs, ph, si, pr] = await Promise.all([
          db.from("creator_type_profiles").select("primary_type, secondary_type, type_3, type_4").eq("user_id", row.user_id).maybeSingle(),
          db.from("case_studies").select("form_data").eq("subject_user_id", row.user_id),
          db.from("profiling_photos").select("id", { count: "exact", head: true }).eq("user_id", row.user_id),
          db.from("client_session_images").select("id", { count: "exact", head: true }).eq("client_id", row.user_id),
          db.from("profiles").select("medical_history").eq("user_id", row.user_id).maybeSingle(),
        ]);
        const t = ct.data;
        counts.creator_types = t ? [t.primary_type, t.secondary_type, t.type_3, t.type_4].filter(Boolean).length : 0;
        counts.case_studies = cs.data?.length ?? 0;
        counts.paper_assessments = (cs.data || []).reduce((n, c: any) =>
          n + (Array.isArray(c.form_data?.attachments) ? c.form_data.attachments.length : 0), 0);
        counts.photos = ph.count ?? 0;
        counts.session_images = si.count ?? 0;
        counts.health = healthFlags(pr.data?.medical_history).has;
      }
      const current = row.choice_key ? options.find((o) => o.key === row.choice_key) : null;
      return json({
        state: row.choice_key ? "answered" : "open",
        first_name: pv.first_name,
        intro: render(s.page_intro, pv),
        photos_note: render(s.page_photos_note, pv),
        hosting_line: render(s.page_hosting_line, pv),
        confirm_helper: render(s.confirm_helper, pv),
        already_chosen: current ? render(s.already_chosen_text, { ...pv, option_label: current.label }) : "",
        counts, options, tick, protected_warning: protectedWarning,
        is_test: row.is_test,
      });
    }

    if (action === "submit") {
      if (await limited(db, `submit:${code}`, LIMITS.submit)) return json({ error: "Too many attempts. Please try again later." }, 429);
      await record(db, `submit:${code}`);
      const choice = Number(body.choice);
      const typed = String(body.typed_name || "").trim().slice(0, 200);
      const consent = body.option3_consent === true;
      const key = [1, 2, 3].includes(choice) ? keyFor(s, choice) : null;
      if (!key) return json({ error: "Please choose an option." }, 400);
      if (key === "keep_all" && !consent) return json({ error: "Please tick the consent box to keep everything." }, 400);
      if (typed.replace(/\s/g, "").length < 3) return json({ error: "Please type your full name." }, 400);
      if (row.status === "actioned") return json({ error: "This choice has already been acted on. Please contact A'Hara." }, 409);

      const opt = options.find((o) => o.key === key)!;
      const now = new Date().toISOString();
      const history = Array.isArray(row.history) ? [...row.history] : [];
      if (row.choice_key) {
        history.push({
          choice_key: row.choice_key, choice_number_shown: row.wording_shown?.option_number ?? null, option3_consent: row.option3_consent, typed_name: row.typed_name,
          responder_type: row.responder_type, answered_at: row.answered_at, answered_by: row.answered_by,
          wording_shown: row.wording_shown, replaced_at: now,
        });
      }
      const wording = {
        option_key: key, option_number: choice,
        option_label: opt.label, option_title: opt.title, option_text: opt.text,
        tick_text: key === "keep_all" ? tick : null,
        protected_warning: key === "delete_all" && protectedWarning ? protectedWarning : null,
        confirm_helper: render(s.confirm_helper, pv),
      };
      const parts = (row.name || "").trim().split(/\s+/);
      const t = norm(typed);
      const mismatch = !(t.includes(norm(parts[0])) && t.includes(norm(parts[parts.length - 1])));
      const { error } = await db.from("migration_choices").update({
        choice_key: key, choice: null, option3_consent: key === "keep_all", typed_name: typed, responder_type: "subject",
        answered_at: now, answered_by: "self", wording_shown: wording, history, status: "answered",
        name_mismatch: mismatch,
      }).eq("id", row.id);
      if (error) throw error;

      // Confirmation email
      const mode = s.email_mode;
      if (s.send_confirmation_email === "true" && (mode === "test" || mode === "live")) {
        const to = mode === "test" || row.is_test ? s.test_email : row.email;
        if (validEmail(to)) {
          const ev = { ...pv, option_label: opt.label, link: choiceLink(s, row.code) };
          const subj = (mode === "test" || row.is_test ? `[TEST for ${row.name}] ` : "") + render(s.confirmation_subject, ev);
          try {
            await sendEmail(s, to!, subj, render(s.confirmation_body, ev));
            await db.from("migration_choices").update({ emails_sent: (row.emails_sent || 0) + 1 }).eq("id", row.id);
          } catch (e) { console.error("confirmation email failed", e); }
        }
      }
      return json({
        state: "thankyou",
        thankyou: render(s.thankyou_text, { ...pv, option_label: opt.label }),
        delete_note: key === "delete_all" ? render(s.delete_all_note, pv) : "",
        option_key: key, option_number: choice, option_label: opt.label,
      });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("migration-choice error", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
