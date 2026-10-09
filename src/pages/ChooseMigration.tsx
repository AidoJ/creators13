import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option { value: number; key: "keep_all" | "keep_account" | "delete_all" | null; label: string; title: string; text: string }
interface ViewData {
  state: string; message?: string; first_name?: string; intro?: string; photos_note?: string; hosting_line?: string;
  confirm_helper?: string; already_chosen?: string; tick?: string; protected_warning?: string; is_test?: boolean;
  counts?: { creator_types: number; case_studies: number; photos: number; session_images: number; paper_assessments: number; health: boolean };
  options?: Option[];
}

type Step = "hold" | "choose" | "confirm" | "thankyou" | "answered";

export default function ChooseMigration() {
  const { code = "" } = useParams();
  const [data, setData] = useState<ViewData | null>(null);
  const [step, setStep] = useState<Step>("hold");
  const [choice, setChoice] = useState<number | null>(null);
  const [tick, setTick] = useState(false);
  const [typed, setTyped] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const needsTick = data?.options?.find((o) => o.value === choice)?.key === "keep_all";
  const [thanks, setThanks] = useState<{ thankyou: string; delete_note: string } | null>(null);

  useEffect(() => {
    document.title = "Your case study choice — 13 Creators";
    const saved = sessionStorage.getItem(`choose-step-${code}`);
    supabase.functions.invoke("migration-choice", { body: { action: "view", code } }).then(({ data, error }) => {
      const d: ViewData = data ?? (error as any)?.context?.body ?? { state: "invalid", message: "This link isn't working." };
      setData(d);
      if (d.state === "answered") setStep(saved === "choose" ? "choose" : "answered");
      else if (saved === "choose") setStep("choose");
    });
  }, [code]);

  useEffect(() => { sessionStorage.setItem(`choose-step-${code}`, step === "choose" ? "choose" : ""); }, [step, code]);

  const submit = async () => {
    setSaving(true); setError("");
    const { data: res, error } = await supabase.functions.invoke("migration-choice", {
      body: { action: "submit", code, choice, option3_consent: needsTick ? tick : false, typed_name: typed },
    });
    setSaving(false);
    if (error || res?.error) { setError(res?.error || "Something went wrong. Please try again."); return; }
    setThanks(res); setStep("thankyou");
  };

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <p className="text-center font-display text-lg text-primary">13 Creators</p>
        {data?.is_test && <p className="text-center text-xs text-muted-foreground">Test link</p>}
        {children}
      </div>
    </main>
  );

  if (!data) return shell(<div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>);

  if (["invalid", "not_open", "needs_admin", "closed"].includes(data.state)) {
    return shell(<Card><CardContent className="p-6"><p className="text-base leading-relaxed">{data.message}</p></CardContent></Card>);
  }

  const opt = data.options?.find((o) => o.value === choice);
  const readMore = <Link to={`/choose/privacy?back=${encodeURIComponent(code)}`} className="text-primary underline underline-offset-4">Read more</Link>;
  const c = data.counts!;
  const held: [string, string][] = [
    ["Account details", "Yes"],
    ["Creator Type results", String(c.creator_types)],
    ["Practitioner notes", `${c.case_studies} case ${c.case_studies === 1 ? "study" : "studies"}`],
    ["Profiling photos", String(c.photos)],
    ["Session images", String(c.session_images)],
    ["Paper assessments", String(c.paper_assessments)],
    ["Health information", c.health ? "Yes" : "No"],
  ];

  if (step === "thankyou" && thanks) {
    return shell(
      <Card><CardContent className="space-y-4 p-6">
        <h1 className="font-display text-2xl">Thank you</h1>
        <p className="leading-relaxed">{thanks.thankyou}</p>
        {thanks.delete_note && <p className="leading-relaxed text-muted-foreground">{thanks.delete_note}</p>}
      </CardContent></Card>,
    );
  }

  if (step === "answered") {
    return shell(
      <Card><CardContent className="space-y-5 p-6">
        <p className="leading-relaxed">{data.already_chosen}</p>
        <Button onClick={() => { setChoice(null); setTick(false); setTyped(""); setStep("choose"); }}>Change my choice</Button>
      </CardContent></Card>,
    );
  }

  if (step === "hold") {
    return shell(
      <Card><CardContent className="space-y-5 p-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Step 1 of 3</p>
        <h1 className="font-display text-2xl">What we hold about you</h1>
        <p className="leading-relaxed">{data.intro}</p>
        <ul className="divide-y divide-border rounded-md border border-border">
          {held.map(([k, v]) => (
            <li key={k} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span>{k}</span><span className="font-semibold">{v}</span>
            </li>
          ))}
        </ul>
        {data.photos_note && <p className="text-sm text-muted-foreground">{data.photos_note}</p>}
        {data.hosting_line && <p className="text-sm text-muted-foreground">{data.hosting_line}</p>}
        <p className="text-sm text-muted-foreground">{readMore}</p>
        <Button className="w-full" onClick={() => setStep("choose")}>Continue</Button>
      </CardContent></Card>,
    );
  }

  if (step === "choose") {
    return shell(
      <Card><CardContent className="space-y-5 p-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Step 2 of 3</p>
        <h1 className="font-display text-2xl">What would you like us to do?</h1>
        <div className="space-y-3" role="radiogroup">
          {data.options!.map((o) => (
            <button key={o.value} type="button" role="radio" aria-checked={choice === o.value}
              onClick={() => { setChoice(o.value); if (o.value !== 3) setTick(false); }}
              className={cn("w-full rounded-lg border p-4 text-left transition-colors",
                choice === o.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}>
              <p className="font-semibold">{o.value}. {o.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{o.text}</p>
              {o.value === 1 && data.protected_warning && (
                <p className="mt-2 rounded-md bg-accent/40 p-2 text-sm">{data.protected_warning}</p>
              )}
            </button>
          ))}
        </div>
        {needsTick && (
          <div className="flex items-start gap-3 rounded-lg border border-primary/40 p-4">
            <Checkbox id="tick" checked={tick} onCheckedChange={(v) => setTick(v === true)} className="mt-1" />
            <Label htmlFor="tick" className="text-sm font-normal leading-relaxed">{data.tick}</Label>
          </div>
        )}
        <Button className="w-full" disabled={!choice || (needsTick && !tick)} onClick={() => setStep("confirm")}>Continue</Button>
        <button type="button" className="w-full text-sm text-muted-foreground underline" onClick={() => setStep("hold")}>Back</button>
      </CardContent></Card>,
    );
  }

  return shell(
    <Card><CardContent className="space-y-5 p-6">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Step 3 of 3</p>
      <h1 className="font-display text-2xl">Confirm</h1>
      <p className="leading-relaxed">You chose: <strong>{opt?.label}</strong></p>
      <div className="space-y-2">
        <Label htmlFor="typed">Type your full name</Label>
        <Input id="typed" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="name" />
      </div>
      {data.confirm_helper && <p className="text-sm text-muted-foreground">{data.confirm_helper}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={typed.replace(/\s/g, "").length < 3 || saving} onClick={submit}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm my choice
      </Button>
      <button type="button" className="w-full text-sm text-muted-foreground underline" onClick={() => setStep("choose")}>Back</button>
    </CardContent></Card>,
  );
}
