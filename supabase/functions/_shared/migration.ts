// Shared helpers for the case study migration choice feature.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

export type Settings = Record<string, string>;

export async function loadSettings(db: ReturnType<typeof admin>): Promise<Settings> {
  const { data } = await db.from("migration_settings").select("key, value");
  const s: Settings = {};
  for (const r of data || []) s[r.key] = r.value ?? "";
  return s;
}

/** "2026-11-30" -> "30 November 2026" */
export function formatDate(d: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || "")) return d || "";
  const [y, m, day] = d.split("-").map(Number);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${day} ${months[m - 1]} ${y}`;
}

/** Cut-off closes at 11:59 pm Brisbane time (UTC+10, no daylight saving). */
export function isClosed(cut: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cut || "")) return false;
  return Date.now() > Date.parse(`${cut}T23:59:59.999+10:00`);
}

/**
 * Replace {tokens}. Empty tokens vanish; a sentence (or line) left with only
 * punctuation/whitespace is dropped. Runs twice so settings can contain tokens.
 */
export function render(text: string, vars: Record<string, string | undefined>): string {
  let out = text || "";
  for (let pass = 0; pass < 3; pass++) {
    out = out.replace(/\{([a-z0-9_]+)\}/g, (_, k) => (vars[k] ?? ""));
  }
  return out
    .split("\n")
    .map((line) =>
      line
        .split(/(?<=[.!?])\s+/)
        .filter((s) => /[\p{L}\p{N}]/u.test(s) || s.trim() === "")
        .join(" ")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\s+([.,!?])/g, "$1")
        .trimEnd(),
    )
    .filter((line, i, arr) => !(line.trim() === "" && (arr[i - 1] ?? "").trim() === ""))
    .join("\n")
    .trim();
}

export function baseVars(s: Settings): Record<string, string> {
  const v: Record<string, string> = { ...s };
  v.cut_off_date = formatDate(s.cut_off_date);
  for (const n of [1, 2, 3]) v[`option${n}_text`] = s[`option${n}_text`] || "";
  return v;
}

export const firstName = (name: string) => (name || "").trim().split(/\s+/)[0] || "";

const NO_HEALTH = new Set(["", "n/a", "na", "none", "nil", "no", "nothing"]);
export function healthFlags(raw: string | null | undefined) {
  const t = (raw || "").trim().toLowerCase();
  const has = !NO_HEALTH.has(t);
  return { has, check: t.length > 0 && t.length < 4 };
}

const COUNTRY: [string, string][] = [
  ["+61", "Australia"], ["+64", "New Zealand"], ["+44", "United Kingdom"], ["+1", "USA / Canada"],
  ["+353", "Ireland"], ["+65", "Singapore"], ["+852", "Hong Kong"], ["+91", "India"], ["+49", "Germany"],
  ["+33", "France"], ["+34", "Spain"], ["+39", "Italy"], ["+31", "Netherlands"], ["+27", "South Africa"],
  ["+977", "Nepal"], ["+63", "Philippines"], ["+62", "Indonesia"], ["+81", "Japan"], ["+86", "China"],
  ["+66", "Thailand"], ["+60", "Malaysia"], ["+971", "UAE"], ["+41", "Switzerland"], ["+46", "Sweden"],
];

/** Accepts Australian 04xx local numbers and any international +number. */
export function normalisePhone(raw: string | null | undefined): { e164: string; country: string } | null {
  if (!raw) return null;
  let p = raw.replace(/[\s\-().]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  if (/^04\d{8}$/.test(p)) p = "+61" + p.slice(1);
  if (/^614\d{8}$/.test(p)) p = "+" + p;
  if (!/^\+[1-9]\d{7,14}$/.test(p)) return null;
  if (p.startsWith("+61") && !/^\+614\d{8}$/.test(p)) return null; // AU must be a mobile
  const c = COUNTRY.sort((a, b) => b[0].length - a[0].length).find(([pre]) => p.startsWith(pre));
  return { e164: p, country: c ? c[1] : "Other" };
}

export const validEmail = (e: string | null | undefined) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export function textToHtml(text: string): string {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222">` +
    text.split(/\n{2,}/).map((p) =>
      `<p>${esc(p).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>').replace(/\n/g, "<br>")}</p>`
    ).join("") + `</div>`;
}

export async function sendEmail(s: Settings, to: string, subject: string, text: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("Email is not configured");
  const body: Record<string, unknown> = {
    from: `${(s.email_from_name || "13 Creators").replace(/[<>"]/g, "")} <noreply@connect.13creators.com>`,
    to: [to], subject, text, html: textToHtml(text),
  };
  if (validEmail(s.email_reply_to)) body.reply_to = s.email_reply_to.trim();
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Email failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
}

export function choiceLink(s: Settings, code: string) {
  const base = (s.link_base_url || "https://creators13.lovable.app").replace(/\/+$/, "");
  return `${base}/choose/${code}`;
}
