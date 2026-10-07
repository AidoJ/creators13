import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronDown, Copy, Download, Loader2, Mail, MessageSquare, Plus, Upload } from "lucide-react";
import { choiceLink, firstName, render, settingsVars } from "@/lib/migrationText";

const REQUIRED = ["cut_off_date", "retention_period", "non_responder_period", "non_responder_text", "backup_days", "privacy_phone", "privacy_email", "privacy_link", "link_base_url", "email_provider_name", "ai_disclosure_text"];
const SHORT = ["test_email", "cut_off_date", "cooling_off_days", "retention_period", "non_responder_period", "backup_days", "privacy_phone", "privacy_email", "privacy_link", "link_base_url", "hosting_region_text", "email_provider_name", "email_from_name", "email_reply_to", "option1_label", "option2_label", "option3_label", "option1_title", "option2_title", "option3_title", "invite_subject", "reminder_subject", "final_reminder_subject", "confirmation_subject"];
const HIDDEN = ["enabled", "email_mode", "send_confirmation_email"];

type Row = Record<string, any>;
const FILTERS: [string, string][] = [
  ["all", "Everyone"], ["not_answered", "Not answered"], ["answered", "Answered"], ["c1", "Option 1"], ["c2", "Option 2"], ["c3", "Option 3"],
  ["needs_admin", "Needs admin"], ["not_sent", "Not sent"], ["bounced", "Bounced"], ["opened_na", "Opened, not answered"], ["test", "Test rows"],
];

const csv = (rows: (string | number | null | undefined)[][]) =>
  rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
const download = (name: string, text: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  a.download = name; a.click();
};
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—");
const flagged = (r: Row) => r.needs_admin && !r.admin_cleared_at;

export default function MigrationAdmin() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [pracs, setPracs] = useState<{ id: string; name: string }[]>([]);
  const [filter, setFilter] = useState("all");
  const [pracFilter, setPracFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [includeTest, setIncludeTest] = useState(false);
  const [detail, setDetail] = useState<Row | null>(null);
  const [busy, setBusy] = useState("");
  const [liveConfirm, setLiveConfirm] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [importConfirm, setImportConfirm] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    const [{ data: s }, { data: r }] = await Promise.all([
      supabase.from("migration_settings" as any).select("key, value"),
      supabase.from("migration_choices" as any).select("*").order("name"),
    ]);
    const m: Record<string, string> = {};
    for (const x of (s as any[]) || []) m[x.key] = x.value;
    setSettings(m); setDraft(m); setRows((r as any[]) || []);
  }, []);

  useEffect(() => {
    document.title = "Case study migration choice — Admin";
    load();
    (async () => {
      const { data: ur } = await supabase.from("user_roles").select("user_id").in("role", ["practitioner", "trainee", "trainer"]);
      const ids = [...new Set((ur || []).map((x) => x.user_id))];
      if (!ids.length) return;
      const { data: p } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", ids);
      setPracs((p || []).map((x) => ({ id: x.user_id, name: `${x.first_name ?? ""} ${x.last_name ?? ""}`.trim() })).filter((x) => x.name).sort((a, b) => a.name.localeCompare(b.name)));
    })();
  }, [load]);

  useEffect(() => { if (detail) setDetail(rows.find((r) => r.id === detail.id) ?? null); }, [rows]); // eslint-disable-line

  const missing = REQUIRED.filter((k) => !(settings[k] || "").trim());
  const linkProblem = settings.link_base_url && (!/^https:\/\//i.test(settings.link_base_url) || /lovable\.app/i.test(settings.link_base_url));

  const saveSetting = async (key: string, value: string) => {
    const { error } = await supabase.from("migration_settings" as any).upsert({ key, value, updated_by: user?.id } as any);
    if (error) { toast({ title: "Not saved", description: error.message, variant: "destructive" }); return false; }
    setSettings((s) => ({ ...s, [key]: value })); setDraft((s) => ({ ...s, [key]: value }));
    return true;
  };
  const saveDrafts = async () => {
    const changed = Object.keys(draft).filter((k) => draft[k] !== settings[k] && !HIDDEN.includes(k));
    for (const k of changed) if (!(await saveSetting(k, draft[k]))) return;
    toast({ title: changed.length ? `Saved ${changed.length} setting(s)` : "Nothing changed" });
  };

  const update = async (id: string, patch: Row, msg?: string) => {
    const { error } = await supabase.from("migration_choices" as any).update(patch as any).eq("id", id);
    if (error) { toast({ title: "Not saved", description: error.message, variant: "destructive" }); return false; }
    if (msg) toast({ title: msg });
    await load(); return true;
  };

  const call = async (body: Row) => {
    const { data, error } = await supabase.functions.invoke("migration-admin", { body });
    if (error || data?.error) throw new Error(data?.error || (await (error as any)?.context?.json?.().catch(() => null))?.error || error?.message);
    return data;
  };

  const send = async (kind: "invite" | "reminder" | "final", ids?: string[]) => {
    setBusy(kind);
    try {
      let sent = 0, failed = 0, skipped = 0;
      for (let i = 0; i < 40; i++) {
        const r = await call({ action: "send", kind, ids, include_test: includeTest || (ids?.length ? rows.filter((x) => ids.includes(x.id)).some((x) => x.is_test) : false) });
        sent += r.sent.length; failed += r.failed.length; skipped = r.skipped.length;
        if (r.failed.length) console.warn(r.failed);
        if (!r.remaining || ids?.length || r.sent.length === 0) break;
      }
      toast({ title: `Sent ${sent}`, description: `${failed} failed, ${skipped} skipped (needs admin, no email, or switched off).` });
    } catch (e: any) { toast({ title: "Not sent", description: e.message, variant: "destructive" }); }
    setBusy(""); load();
  };

  const vars = (r: Row) => ({ ...settingsVars(settings), first_name: firstName(r.name), practitioner_name: r.practitioner_name || "", link: choiceLink(settings, r.code) });
  const copy = async (text: string, msg: string) => { await navigator.clipboard.writeText(text); toast({ title: msg }); };
  const textLink = async (r: Row) => {
    const msg = render(settings.sms_template, vars(r));
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
    if (mobile && r.phone) window.location.href = `sms:${r.phone}?&body=${encodeURIComponent(msg)}`;
    else await copy(msg, "Text message copied — paste it into your messaging app");
    await update(r.id, { texted_by: user?.id, texted_at: new Date().toISOString() });
  };

  const visible = useMemo(() => rows.filter((r) => {
    if (filter !== "test" && r.is_test && !includeTest) return false;
    if (pracFilter !== "all" && r.practitioner_id !== pracFilter) return false;
    if (search && !`${r.name} ${r.email ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    switch (filter) {
      case "not_answered": return r.status === "not_answered";
      case "answered": return r.status !== "not_answered";
      case "c1": case "c2": case "c3": return r.choice === Number(filter[1]);
      case "needs_admin": return flagged(r);
      case "not_sent": return r.contact_status === "not_sent";
      case "bounced": return r.contact_status === "bounced";
      case "opened_na": return !!r.link_opened_at && r.status === "not_answered";
      case "test": return r.is_test;
      default: return true;
    }
  }), [rows, filter, pracFilter, search, includeTest]);

  const real = rows.filter((r) => !r.is_test || includeTest);
  const counts = {
    total: real.length, notAnswered: real.filter((r) => r.status === "not_answered").length,
    o1: real.filter((r) => r.choice === 1).length, o2: real.filter((r) => r.choice === 2).length, o3: real.filter((r) => r.choice === 3).length,
    answered: real.filter((r) => r.status === "answered").length, confirmed: real.filter((r) => r.status === "confirmed").length,
    actioned: real.filter((r) => r.status === "actioned").length, needsAdmin: real.filter(flagged).length,
  };
  const pracOptions = [...new Map(rows.filter((r) => r.practitioner_id).map((r) => [r.practitioner_id, r.practitioner_name || "Unknown"])).entries()];

  const exportAll = () => download("migration-choices.csv", csv([
    ["Name", "Email", "Phone", "Country", "Practitioner", "Contact", "Opened", "Choice", "Option 3 tick", "Status", "Answered", "By", "Responder", "Needs admin", "Reason", "Notes", "Test"],
    ...real.map((r) => [r.name, r.email, r.phone, r.phone_country, r.practitioner_name, r.contact_status, r.link_opened_at, r.choice, r.option3_consent, r.status, r.answered_at, r.answered_by, r.responder_type, flagged(r), r.needs_admin_reason, r.notes, r.is_test]),
  ]));
  const exportChase = () => download("not-answered-by-practitioner.csv", csv([
    ["Practitioner", "Name", "Phone"],
    ...rows.filter((r) => !r.is_test && r.status === "not_answered").sort((a, b) => (a.practitioner_name || "").localeCompare(b.practitioner_name || "") || a.name.localeCompare(b.name)).map((r) => [r.practitioner_name || "No practitioner", r.name, r.phone]),
  ]));

  const runPreview = async () => {
    setBusy("import");
    try { setImportData(await call({ action: "import_preview" })); } catch (e: any) { toast({ title: "Preview failed", description: e.message, variant: "destructive" }); }
    setBusy("");
  };
  const runImport = async () => {
    setBusy("import");
    try { const r = await call({ action: "import_commit", approved: true }); toast({ title: `Imported ${r.inserted} people` }); setImportData(null); load(); }
    catch (e: any) { toast({ title: "Import failed", description: e.message, variant: "destructive" }); }
    setBusy(""); setImportConfirm(false);
  };

  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <main className="min-h-screen bg-background px-3 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground underline"><ArrowLeft className="h-4 w-4" />Admin</Link>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl">Case study migration choice</h1>
            <p className="text-sm text-muted-foreground">Records answers only. Nothing here deletes or moves anyone's data.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={settings.enabled === "true" ? "default" : "secondary"}>{settings.enabled === "true" ? "Switched on" : "Switched off"}</Badge>
            <Badge variant={settings.email_mode === "live" ? "destructive" : "outline"}>Email: {settings.email_mode}</Badge>
          </div>
        </div>

        {/* Settings */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg">Switch and email mode</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(missing.length > 0 || linkProblem) && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
                <p className="font-semibold">It can't be switched on yet.</p>
                {missing.length > 0 && <p>Missing: {missing.join(", ")}</p>}
                {linkProblem && <p>link_base_url must be an https address on your own connected domain (not lovable.app).</p>}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch id="en" checked={settings.enabled === "true"} disabled={settings.enabled !== "true" && (missing.length > 0 || !!linkProblem)}
                  onCheckedChange={(v) => saveSetting("enabled", v ? "true" : "false")} />
                <Label htmlFor="en">Switched on</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label>Email mode</Label>
                <Select value={settings.email_mode || "off"} onValueChange={(v) => v === "live" ? setLiveConfirm(true) : saveSetting("email_mode", v)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="off">Off</SelectItem><SelectItem value="test">Test</SelectItem><SelectItem value="live">Live</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="conf" checked={settings.send_confirmation_email === "true"} onCheckedChange={(v) => saveSetting("send_confirmation_email", v ? "true" : "false")} />
                <Label htmlFor="conf">Send confirmation email</Label>
              </div>
            </div>
            <Collapsible>
              <CollapsibleTrigger asChild><Button variant="outline" size="sm"><ChevronDown className="mr-1 h-4 w-4" />All settings and wording</Button></CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <p className="text-xs text-muted-foreground">Tokens like {"{first_name}"} and {"{cut_off_date}"} are filled in when shown. Dates as YYYY-MM-DD. The cut-off closes at 11:59 pm Brisbane time.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.keys(draft).filter((k) => !HIDDEN.includes(k)).sort((a, b) => Number(REQUIRED.includes(b)) - Number(REQUIRED.includes(a)) || Number(SHORT.includes(b)) - Number(SHORT.includes(a))).map((k) => (
                    <div key={k} className={SHORT.includes(k) ? "space-y-1" : "space-y-1 md:col-span-2"}>
                      <Label className="text-xs">{k}{REQUIRED.includes(k) && <span className="text-destructive"> *</span>}</Label>
                      {SHORT.includes(k)
                        ? <Input value={draft[k] ?? ""} type={k === "cut_off_date" ? "date" : "text"} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
                        : <Textarea rows={k.endsWith("_body") || k === "privacy_page_text" ? 10 : 3} value={draft[k] ?? ""} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />}
                    </div>
                  ))}
                </div>
                <Button onClick={saveDrafts}>Save settings</Button>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Counts */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          {[["People", counts.total], ["Not answered", counts.notAnswered], ["Option 1", counts.o1], ["Option 2", counts.o2], ["Option 3", counts.o3],
            ["Answered", counts.answered], ["Confirmed", counts.confirmed], ["Actioned", counts.actioned], ["Needs admin", counts.needsAdmin]].map(([l, n]) => (
            <Card key={l as string}><CardContent className="p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-semibold">{n}</p></CardContent></Card>
          ))}
        </div>

        {/* Page actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={!!busy} onClick={() => send("invite", selected.size ? [...selected] : undefined)}>
            {busy === "invite" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Mail className="mr-1 h-4 w-4" />}
            Send invitation {selected.size ? `(${selected.size} selected)` : "(everyone not yet sent)"}
          </Button>
          <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => send("reminder")}>Send reminder</Button>
          <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => send("final")}>Send final reminder</Button>
          <Button size="sm" variant="outline" disabled={!!busy} onClick={runPreview}><Upload className="mr-1 h-4 w-4" />Import existing case-study subjects</Button>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Plus className="mr-1 h-4 w-4" />Add person</Button>
          <Button size="sm" variant="outline" onClick={exportAll}><Download className="mr-1 h-4 w-4" />CSV export</Button>
          <Button size="sm" variant="outline" onClick={exportChase}><Download className="mr-1 h-4 w-4" />Not answered, by practitioner</Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>{FILTERS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={pracFilter} onValueChange={setPracFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Practitioner" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All practitioners</SelectItem>{pracOptions.map(([id, n]) => <SelectItem key={id} value={id}>{n}</SelectItem>)}</SelectContent>
          </Select>
          <Input className="w-56" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex items-center gap-2"><Switch id="it" checked={includeTest} onCheckedChange={setIncludeTest} /><Label htmlFor="it" className="text-sm">Include test rows</Label></div>
        </div>

        {/* Table */}
        <Card><CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3"><Checkbox checked={visible.length > 0 && visible.every((r) => selected.has(r.id))} onCheckedChange={(v) => setSelected(v ? new Set(visible.map((r) => r.id)) : new Set())} /></th>
                <th className="p-3">Name</th><th className="p-3">Practitioner</th><th className="p-3">Contact</th><th className="p-3">Opened</th>
                <th className="p-3">Choice</th><th className="p-3">Status</th><th className="p-3">Needs admin</th><th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No one here yet.</td></tr>}
              {visible.map((r) => (
                <tr key={r.id} className="cursor-pointer border-b border-border/50 hover:bg-muted/40" onClick={() => setDetail(r)}>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSel(r.id)} /></td>
                  <td className="p-3">
                    <span className="font-medium">{r.name}</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.is_test && <Badge variant="outline">test</Badge>}
                      {r.phone_country && <Badge variant="outline">{r.phone_country}</Badge>}
                      {r.health_check && <Badge variant="secondary">check health entry</Badge>}
                      {r.name_mismatch && <Badge variant="destructive">name mismatch</Badge>}
                      {r.protect_account && <Badge variant="secondary">keep account</Badge>}
                      {r.revoked_at && <Badge variant="destructive">link revoked</Badge>}
                    </div>
                  </td>
                  <td className="p-3">{r.practitioner_name || "—"}</td>
                  <td className="p-3">{r.contact_status.replace(/_/g, " ")}</td>
                  <td className="p-3">{fmt(r.link_opened_at)}</td>
                  <td className="p-3">{r.choice ? `Option ${r.choice}` : "—"}</td>
                  <td className="p-3">{r.status.replace(/_/g, " ")}</td>
                  <td className="p-3">{flagged(r) ? <Badge variant="destructive">yes</Badge> : r.admin_cleared_at ? "cleared" : "—"}</td>
                  <td className="max-w-[200px] truncate p-3 text-muted-foreground">{r.notes || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      </div>

      {detail && (
        <PersonSheet row={detail} settings={settings} pracs={pracs} onClose={() => setDetail(null)} update={update} call={call}
          reload={load} send={send} copy={copy} textLink={textLink} vars={vars} userId={user?.id} />
      )}

      <AlertDialog open={liveConfirm} onOpenChange={setLiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Switch email to live?</AlertDialogTitle>
            <AlertDialogDescription>Emails will go to real people's addresses. Test rows still only go to the test address.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => saveSetting("email_mode", "live")}>Switch to live</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!importData} onOpenChange={(o) => !o && setImportData(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Import preview — nothing has been written</DialogTitle></DialogHeader>
          {importData && (
            <div className="space-y-3 text-sm">
              <p>{importData.total} people would be added. {importData.needs_admin} would be flagged "needs admin".</p>
              <div className="overflow-x-auto"><table className="w-full text-xs">
                <thead className="text-left text-muted-foreground"><tr><th className="p-1">Name</th><th className="p-1">Practitioner</th><th className="p-1">Email</th><th className="p-1">Mobile</th><th className="p-1">Needs admin because</th></tr></thead>
                <tbody>{importData.rows.map((r: any, i: number) => (
                  <tr key={i} className="border-t border-border/50"><td className="p-1">{r.name}</td><td className="p-1">{r.practitioner_name}</td><td className="p-1">{r.has_email ? "yes" : "no"}</td><td className="p-1">{r.phone_country || "no"}</td><td className="p-1">{r.needs_admin_reason || ""}</td></tr>
                ))}</tbody>
              </table></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setImportData(null)}>Close</Button>
            <Button disabled={!importData?.total || !!busy} onClick={() => setImportConfirm(true)}>Approve and import</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={importConfirm} onOpenChange={setImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Import {importData?.total} real people?</AlertDialogTitle>
            <AlertDialogDescription>This creates their rows and personal links. No one is emailed. Existing data is only read.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={runImport}>Import</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddPerson open={addOpen} onOpenChange={setAddOpen} pracs={pracs} onAdded={load} />
    </main>
  );
}

function AddPerson({ open, onOpenChange, pracs, onAdded }: { open: boolean; onOpenChange: (o: boolean) => void; pracs: { id: string; name: string }[]; onAdded: () => void }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", practitioner_id: "", is_test: true });
  const save = async () => {
    const p = pracs.find((x) => x.id === f.practitioner_id);
    const { error } = await supabase.from("migration_choices" as any).insert({
      name: f.name.trim(), email: f.email.trim() || null, phone: f.phone.trim() || null,
      practitioner_id: p?.id ?? null, practitioner_name: p?.name ?? null, is_test: f.is_test,
    } as any);
    if (error) { toast({ title: "Not added", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Added" }); onOpenChange(false); setF({ name: "", email: "", phone: "", practitioner_id: "", is_test: true }); onAdded();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add person</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Full name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label>Mobile (international format)</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div><Label>Practitioner</Label>
            <Select value={f.practitioner_id} onValueChange={(v) => setF({ ...f, practitioner_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>{pracs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="flex items-center gap-2"><Checkbox id="t" checked={f.is_test} onCheckedChange={(v) => setF({ ...f, is_test: v === true })} /><Label htmlFor="t">Test row (emails only ever go to the test address)</Label></div>
        </div>
        <DialogFooter><Button disabled={f.name.trim().length < 2} onClick={save}>Add</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PersonSheet({ row: r, settings, pracs, onClose, update, call, reload, send, copy, textLink, vars, userId }: any) {
  const [ans, setAns] = useState({ choice: "", tick: false, responder: "subject", method: "phone", note: "" });
  const [clearNote, setClearNote] = useState("");
  const [notes, setNotes] = useState(r.notes || "");
  useEffect(() => setNotes(r.notes || ""), [r.id]); // eslint-disable-line
  const link = choiceLink(settings, r.code);
  const under18 = /under 18/.test(r.needs_admin_reason || "");
  const history = [...(r.history || [])].reverse();

  const record = async () => {
    try {
      await call({ action: "record_answer", id: r.id, choice: Number(ans.choice), option3_consent: ans.tick, responder_type: ans.responder, method: ans.method, note: ans.note });
      toast({ title: "Answer recorded" }); setAns({ choice: "", tick: false, responder: "subject", method: "phone", note: "" }); reload();
    } catch (e: any) { toast({ title: "Not recorded", description: e.message, variant: "destructive" }); }
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader><SheetTitle>{r.name}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <p className="text-muted-foreground">Email</p><p className="break-all">{r.email || "—"}</p>
            <p className="text-muted-foreground">Mobile</p><p>{r.phone || "—"} {r.phone_country && `(${r.phone_country})`}</p>
            <p className="text-muted-foreground">Contact</p><p>{r.contact_status.replace(/_/g, " ")} · {r.emails_sent} email(s){r.invite_sent_at && ` · invited ${fmt(r.invite_sent_at)}`}</p>
            <p className="text-muted-foreground">Texted</p><p>{fmt(r.texted_at)}</p>
            <p className="text-muted-foreground">Health info</p><p>{r.health_info == null ? "—" : r.health_info ? "yes" : "no"}{r.health_check && " — check entry"}</p>
          </div>

          {r.protect_account && <p className="rounded-md bg-accent/40 p-3">Also a practitioner / trainer / paid member. Option 1 means delete case study information only — never the account, a role or a membership.</p>}
          {r.needs_admin && (
            <div className="space-y-2 rounded-md border border-destructive/40 p-3">
              <p><strong>Needs admin:</strong> {r.needs_admin_reason}</p>
              {r.admin_cleared_at ? <p className="text-muted-foreground">Cleared {fmt(r.admin_cleared_at)}: {r.admin_cleared_note}</p> : (
                <div className="space-y-2">
                  <Textarea rows={2} placeholder="Note (required), e.g. confirmed adult by phone" value={clearNote} onChange={(e) => setClearNote(e.target.value)} />
                  <Button size="sm" variant="outline" disabled={!clearNote.trim()} onClick={() => update(r.id, { admin_cleared_at: new Date().toISOString(), admin_cleared_by: userId, admin_cleared_note: clearNote.trim() }, "Flag cleared")}>Clear flag (confirmed adult)</Button>
                </div>
              )}
              {under18 && (
                <Button size="sm" variant="outline" onClick={() => copy(render(settings.guardian_message_text, { ...settingsVars(settings), guardian_first_name: r.guardian_first_name || "", young_person_name: firstName(r.name) }), "Guardian message copied")}>
                  <Copy className="mr-1 h-4 w-4" />Copy guardian message{r.guardian_first_name && ` (${r.guardian_first_name} ${r.guardian_last_name ?? ""}${r.guardian_phone ? `, ${r.guardian_phone}` : ""})`}
                </Button>
              )}
            </div>
          )}
          {r.name_mismatch && <p className="rounded-md bg-destructive/10 p-3">Typed name "{r.typed_name}" doesn't match the name on file.</p>}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => copy(link, "Link copied")}><Copy className="mr-1 h-4 w-4" />Copy link</Button>
            <Button size="sm" variant="outline" onClick={() => send("invite", [r.id])}><Mail className="mr-1 h-4 w-4" />Send email</Button>
            <Button size="sm" variant="outline" onClick={() => textLink(r)}><MessageSquare className="mr-1 h-4 w-4" />Text this link</Button>
            {r.contact_status !== "do_not_contact"
              ? <Button size="sm" variant="outline" onClick={() => update(r.id, { contact_status: "do_not_contact" }, "Contact stopped")}>Stop contact</Button>
              : <Button size="sm" variant="outline" onClick={() => update(r.id, { contact_status: r.invite_sent_at ? "sent" : "not_sent" }, "Contact resumed")}>Resume contact</Button>}
            {r.contact_status !== "bounced" && <Button size="sm" variant="outline" onClick={() => update(r.id, { contact_status: "bounced" }, "Marked bounced")}>Mark bounced</Button>}
            {!r.revoked_at
              ? <Button size="sm" variant="outline" onClick={() => update(r.id, { revoked_at: new Date().toISOString() }, "Link revoked")}>Revoke link</Button>
              : null}
            <Button size="sm" variant="outline" onClick={async () => { await call({ action: "new_link", id: r.id }); toast({ title: "New link issued — the old one no longer works" }); reload(); }}>Issue new link</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Practitioner</Label>
              <Select value={r.practitioner_id || ""} onValueChange={(v) => { const p = pracs.find((x: any) => x.id === v); update(r.id, { practitioner_id: v, practitioner_name: p?.name }, "Practitioner changed"); }}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{pracs.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Status</Label>
              <Select value={r.status} onValueChange={(v) => update(r.id, { status: v }, "Status changed")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["not_answered", "answered", "confirmed", "actioned"].map((s) => <SelectItem key={s} value={s} disabled={s === "not_answered" && !!r.choice}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>

          <div className="space-y-2"><Label>Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button size="sm" variant="outline" disabled={notes === (r.notes || "")} onClick={() => update(r.id, { notes }, "Notes saved")}>Save notes</Button></div>

          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="font-semibold">Record an answer received by phone or paper</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <Select value={ans.choice} onValueChange={(v) => setAns({ ...ans, choice: v, tick: v === "3" ? ans.tick : false })}>
                <SelectTrigger><SelectValue placeholder="Option" /></SelectTrigger>
                <SelectContent>{[1, 2, 3].map((n) => <SelectItem key={n} value={String(n)}>{settings[`option${n}_label`]}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={ans.responder} onValueChange={(v) => setAns({ ...ans, responder: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="subject">From the person</SelectItem><SelectItem value="guardian">From a guardian</SelectItem></SelectContent>
              </Select>
              <Select value={ans.method} onValueChange={(v) => setAns({ ...ans, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="phone">By phone</SelectItem><SelectItem value="paper">On paper</SelectItem></SelectContent>
              </Select>
            </div>
            {ans.choice === "3" && <div className="flex items-start gap-2"><Checkbox id="at" checked={ans.tick} onCheckedChange={(v) => setAns({ ...ans, tick: v === true })} /><Label htmlFor="at" className="text-xs font-normal">{render(settings.option3_tick_text, settingsVars(settings))}</Label></div>}
            <Textarea rows={2} placeholder="Note" value={ans.note} onChange={(e) => setAns({ ...ans, note: e.target.value })} />
            <Button size="sm" disabled={!ans.choice || (ans.choice === "3" && !ans.tick)} onClick={record}>Record answer</Button>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">History</p>
            {!r.choice && history.length === 0 && <p className="text-muted-foreground">No answer yet.</p>}
            {r.choice && <HistoryItem h={r} current />}
            {history.map((h: any, i: number) => <HistoryItem key={i} h={h} />)}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HistoryItem({ h, current }: { h: any; current?: boolean }) {
  return (
    <div className={`rounded-md border border-border p-3 ${current ? "" : "opacity-60"}`}>
      <p className="font-medium">{current ? "Current: " : ""}{h.wording_shown?.option_label || `Option ${h.choice}`}</p>
      <p className="text-xs text-muted-foreground">{fmt(h.answered_at)} · by {h.answered_by} · {h.responder_type}{h.typed_name && ` · typed "${h.typed_name}"`}{h.replaced_at && ` · replaced ${fmt(h.replaced_at)}`}</p>
      {h.wording_shown && (
        <details className="mt-2 text-xs"><summary className="cursor-pointer">Wording shown</summary>
          <p className="mt-1 whitespace-pre-line">{h.wording_shown.option_text}</p>
          {h.wording_shown.option3_tick_text && <p className="mt-1 italic">Tick: {h.wording_shown.option3_tick_text}</p>}
          {h.wording_shown.protected_warning && <p className="mt-1">{h.wording_shown.protected_warning}</p>}
        </details>
      )}
    </div>
  );
}
