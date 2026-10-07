// Admin-only actions for the case study migration choice feature.
// Reads existing data read-only; writes only to migration_choices.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  admin, baseVars, choiceLink, corsHeaders, firstName, healthFlags, json, loadSettings, normalisePhone, render,
  sendEmail, validEmail,
} from "../_shared/migration.ts";

const BATCH = 25;
const norm = (t: string) => (t || "").toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
const newCode = () => {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const SPECIAL: Record<string, string> = {
  suzicollins: "no consent record",
  cathymccarthy: "separate typed consent date may conflict with the consent flag",
  kirktabalotny: "separate typed consent date may conflict with the consent flag",
};

function ageOn(dob: string): number {
  const d = new Date(dob + "T00:00:00Z"), n = new Date();
  let a = n.getUTCFullYear() - d.getUTCFullYear();
  if (n.getUTCMonth() < d.getUTCMonth() || (n.getUTCMonth() === d.getUTCMonth() && n.getUTCDate() < d.getUTCDate())) a--;
  return a;
}

async function buildImport(db: ReturnType<typeof admin>) {
  const { data: cs } = await db.from("case_studies").select("subject_user_id, practitioner_id, created_at")
    .not("subject_user_id", "is", null).order("created_at", { ascending: false });
  const latest = new Map<string, string>();
  for (const c of cs || []) if (!latest.has(c.subject_user_id!)) latest.set(c.subject_user_id!, c.practitioner_id);
  const ids = [...latest.keys()];
  const pracIds = [...new Set(latest.values())];
  const [{ data: profs }, { data: pracs }, { data: roles }, { data: subs }, { data: existing }] = await Promise.all([
    db.from("profiles").select("user_id, first_name, last_name, email, phone, date_of_birth, medical_history, guardian_first_name, guardian_last_name, guardian_phone, guardian_email").in("user_id", ids),
    db.from("profiles").select("user_id, first_name, last_name").in("user_id", pracIds),
    db.from("user_roles").select("user_id, role").in("user_id", ids),
    db.from("subscriptions").select("user_id, tier, stripe_subscription_id").in("user_id", ids).in("status", ["active", "trialing", "past_due"]),
    db.from("migration_choices").select("user_id").eq("is_test", false),
  ]);
  const pracName = new Map((pracs || []).map((p) => [p.user_id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()]));
  const roleMap = new Map<string, string[]>();
  for (const r of roles || []) roleMap.set(r.user_id, [...(roleMap.get(r.user_id) || []), r.role]);
  // Paid = a paid tier or a Stripe subscription. Free Wren case-study access does not count.
  const paid = new Set((subs || []).filter((s) => s.tier !== "wren" || s.stripe_subscription_id).map((s) => s.user_id));
  const already = new Set((existing || []).map((e) => e.user_id));

  const rows = [];
  for (const p of profs || []) {
    if (already.has(p.user_id)) continue;
    const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || (p.email ?? "Unknown");
    const reasons: string[] = [];
    const phone = normalisePhone(p.phone);
    const r = roleMap.get(p.user_id) || [];
    const protect = r.some((x) => ["practitioner", "trainee", "trainer", "admin"].includes(x)) || paid.has(p.user_id);
    let under18 = false;
    if (!p.date_of_birth) reasons.push("no DOB");
    else {
      const a = ageOn(p.date_of_birth);
      if (a < 5 || a > 110) reasons.push("date of birth missing, in the future or implausible");
      else if (a < 18) { reasons.push("under 18"); under18 = true; }
    }
    if (!validEmail(p.email) && !phone) reasons.push("no valid email or mobile");
    if (protect) reasons.push("also a practitioner / trainer / paid member");
    const special = SPECIAL[norm(name)];
    if (special) reasons.push(special);
    const h = healthFlags(p.medical_history);
    rows.push({
      user_id: p.user_id, name, email: validEmail(p.email) ? p.email!.trim() : null,
      phone: phone?.e164 ?? (p.phone || null), phone_country: phone?.country ?? null,
      practitioner_id: latest.get(p.user_id) ?? null, practitioner_name: pracName.get(latest.get(p.user_id)!) || null,
      needs_admin: reasons.length > 0, needs_admin_reason: reasons.join("; ") || null, protect_account: protect,
      guardian_first_name: under18 ? p.guardian_first_name : null, guardian_last_name: under18 ? p.guardian_last_name : null,
      guardian_phone: under18 ? p.guardian_phone : null, guardian_email: under18 ? p.guardian_email : null,
      health_info: h.has, health_check: h.check, is_test: false, _why: { r, paid: paid.has(p.user_id) },
    });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Not signed in" }, 401);
    const db = admin();
    const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admins only" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const s = await loadSettings(db);

    if (action === "import_preview") {
      const rows = await buildImport(db);
      return json({
        total: rows.length,
        needs_admin: rows.filter((r) => r.needs_admin).length,
        rows: rows.map((r) => ({ name: r.name, practitioner_name: r.practitioner_name, has_email: !!r.email,
          phone_country: r.phone_country, needs_admin_reason: r.needs_admin_reason, why: (r as any)._why })),
      });
    }

    if (action === "import_commit") {
      if (body.approved !== true) return json({ error: "Import needs explicit approval" }, 400);
      const rows = await buildImport(db);
      if (rows.length === 0) return json({ inserted: 0 });
      const { error } = await db.from("migration_choices").insert(rows.map(({ _why, ...r }: any) => ({ ...r, code: newCode() })));
      if (error) throw error;
      return json({ inserted: rows.length });
    }

    if (action === "new_link") {
      const { error } = await db.from("migration_choices").update({ code: newCode(), revoked_at: null }).eq("id", body.id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "record_answer") {
      const { data: row } = await db.from("migration_choices").select("*").eq("id", body.id).single();
      const choice = Number(body.choice);
      if (![1, 2, 3].includes(choice)) return json({ error: "Choose an option" }, 400);
      if (choice === 3 && body.option3_consent !== true) return json({ error: "Option 3 needs the consent tick" }, 400);
      const responder = body.responder_type === "guardian" ? "guardian" : "subject";
      const v = { ...baseVars(s), first_name: firstName(row.name), practitioner_name: row.practitioner_name || "" };
      const now = new Date().toISOString();
      const history = Array.isArray(row.history) ? [...row.history] : [];
      if (row.choice) history.push({
        choice: row.choice, option3_consent: row.option3_consent, typed_name: row.typed_name,
        responder_type: row.responder_type, answered_at: row.answered_at, answered_by: row.answered_by,
        wording_shown: row.wording_shown, replaced_at: now,
      });
      const wording = {
        option_label: render(s[`option${choice}_label`], v), option_title: render(s[`option${choice}_title`], v),
        option_text: render(s[`option${choice}_text`], v),
        option3_tick_text: choice === 3 ? render(s.option3_tick_text, v) : null,
        recorded_by_admin: { by: user.id, method: String(body.method || "phone"), note: String(body.note || "") },
      };
      const notes = body.note ? [row.notes, `${now.slice(0, 10)} (${body.method || "phone"}): ${body.note}`].filter(Boolean).join("\n") : row.notes;
      const { error } = await db.from("migration_choices").update({
        choice, option3_consent: choice === 3, typed_name: body.typed_name || null, responder_type: responder,
        answered_at: now, answered_by: "admin", wording_shown: wording, history, status: "answered", notes,
        name_mismatch: false,
      }).eq("id", row.id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "send") {
      const kind = String(body.kind);
      if (!["invite", "reminder", "final"].includes(kind)) return json({ error: "Unknown email type" }, 400);
      const mode = s.email_mode;
      if (mode !== "test" && mode !== "live") return json({ error: "Email mode is off. Switch it to test or live first." }, 400);
      if (mode === "test" && !validEmail(s.test_email)) return json({ error: "Set a test email address first." }, 400);
      const includeTest = body.include_test === true;

      let q = db.from("migration_choices").select("*").is("revoked_at", null).neq("contact_status", "do_not_contact")
        .eq("status", "not_answered").order("name");
      if (Array.isArray(body.ids) && body.ids.length) q = q.in("id", body.ids);
      else if (kind === "invite") q = q.is("invite_sent_at", null);
      if (kind !== "invite") q = q.not("invite_sent_at", "is", null);
      if (!includeTest) q = q.eq("is_test", false);
      const { data: all, error } = await q;
      if (error) throw error;

      const skipped: { name: string; reason: string }[] = [];
      const eligible = (all || []).filter((r) => {
        if (r.needs_admin && !r.admin_cleared_at) { skipped.push({ name: r.name, reason: "needs admin" }); return false; }
        if (!r.is_test && mode === "live" && s.enabled !== "true") { skipped.push({ name: r.name, reason: "feature is switched off" }); return false; }
        if (!r.is_test && mode === "live" && !validEmail(r.email)) { skipped.push({ name: r.name, reason: "no valid email" }); return false; }
        if (r.is_test && !validEmail(s.test_email)) { skipped.push({ name: r.name, reason: "test row needs a test email address" }); return false; }
        return true;
      });
      const batch = eligible.slice(0, BATCH);
      const sent: string[] = [], failed: { name: string; error: string }[] = [];
      const subjKey = kind === "invite" ? "invite_subject" : kind === "reminder" ? "reminder_subject" : "final_reminder_subject";
      const bodyKey = kind === "invite" ? "invite_body" : kind === "reminder" ? "reminder_body" : "final_reminder_body";
      for (const r of batch) {
        const v = { ...baseVars(s), first_name: firstName(r.name), practitioner_name: r.practitioner_name || "", link: choiceLink(s, r.code) };
        const toTest = mode === "test" || r.is_test;
        const to = toTest ? s.test_email.trim() : r.email!.trim();
        try {
          await sendEmail(s, to, (toTest ? `[TEST for ${r.name}] ` : "") + render(s[subjKey], v), render(s[bodyKey], v));
          const now = new Date().toISOString();
          await db.from("migration_choices").update({
            emails_sent: (r.emails_sent || 0) + 1,
            invite_sent_at: r.invite_sent_at ?? now,
            last_reminder_at: kind === "invite" ? r.last_reminder_at : now,
            contact_status: r.contact_status === "not_sent" ? "sent" : r.contact_status,
          }).eq("id", r.id);
          sent.push(r.name);
        } catch (e) {
          failed.push({ name: r.name, error: e instanceof Error ? e.message : String(e) });
        }
        await new Promise((res) => setTimeout(res, 600));
      }
      return json({ sent, failed, skipped, remaining: Math.max(0, eligible.length - batch.length), mode });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("migration-admin error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
