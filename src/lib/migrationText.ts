// Client copy of the token renderer used by the migration choice feature.
// Must behave the same as supabase/functions/_shared/migration.ts.

export function formatDate(d: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || "")) return d || "";
  const [y, m, day] = d.split("-").map(Number);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${day} ${months[m - 1]} ${y}`;
}

const EMPTY = "\u0000";

/** Any sentence (or line) containing an empty token is dropped cleanly. */
export function render(text: string, vars: Record<string, string | undefined | null>): string {
  let out = text || "";
  for (let pass = 0; pass < 3; pass++) out = out.replace(/\{([a-z0-9_]+)\}/g, (_, k) => {
    const val = vars[k];
    return val && val.trim() ? val : EMPTY;
  });
  return out
    .split("\n")
    .map((line) =>
      line.split(/(?<=[.!?])\s+/).filter((s) => !s.includes(EMPTY) && (/[\p{L}\p{N}]/u.test(s) || s.trim() === "")).join(" ")
        .replace(/[ \t]{2,}/g, " ").replace(/\s+([.,!?])/g, "$1").trimEnd(),
    )
    .filter((line, i, arr) => !(line.trim() === "" && (arr[i - 1] ?? "").trim() === ""))
    .join("\n")
    .trim();
}

export type ChoiceKey = "keep_all" | "keep_account" | "delete_all";
export const numberFor = (s: Record<string, string>, key: string | null | undefined) =>
  [1, 2, 3].find((n) => s[`option${n}_key`] === key) ?? null;
export const keyFor = (s: Record<string, string>, n: number) => (s[`option${n}_key`] || null) as ChoiceKey | null;
export const labelFor = (s: Record<string, string>, key: string | null | undefined) => {
  const n = numberFor(s, key);
  return n ? s[`option${n}_label`] || `Option ${n}` : key || "";
};

export const firstName = (name: string) => (name || "").trim().split(/\s+/)[0] || "";

export function settingsVars(s: Record<string, string>) {
  return { ...s, cut_off_date: formatDate(s.cut_off_date) };
}

export function personVars(s: Record<string, string>, name: string, practitionerName: string | null | undefined) {
  const p = (practitionerName || "").trim();
  return { ...settingsVars(s), first_name: firstName(name), practitioner_name: p,
    practitioner_phrase: p ? `${p}, who has now completed their training!` : "13 Creators." };
}

export function choiceLink(s: Record<string, string>, code: string) {
  const base = (s.link_base_url || "https://creators13.lovable.app").replace(/\/+$/, "");
  return `${base}/choose/${code}`;
}

/** Renders "**Heading**" lines as headings and blank-line separated paragraphs. */
export function paragraphs(text: string): { heading?: string; body: string }[] {
  const out: { heading?: string; body: string }[] = [];
  for (const block of (text || "").split(/\n{2,}/)) {
    const lines = block.split("\n");
    const m = lines[0].match(/^\*\*(.+)\*\*$/);
    if (m) out.push({ heading: m[1], body: lines.slice(1).join("\n") });
    else out.push({ body: block });
  }
  return out;
}
