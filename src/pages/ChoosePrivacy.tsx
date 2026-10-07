import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { paragraphs } from "@/lib/migrationText";

export default function ChoosePrivacy() {
  const [params] = useSearchParams();
  const back = params.get("back");
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    document.title = "How we protect your information — 13 Creators";
    supabase.functions.invoke("migration-choice", { body: { action: "privacy" } })
      .then(({ data }) => setText(data?.text ?? ""));
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <p className="text-center font-display text-lg text-primary">13 Creators</p>
        {back && (
          <Link to={`/choose/${encodeURIComponent(back)}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground underline">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        )}
        <Card><CardContent className="space-y-5 p-6">
          {text === null ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /> :
            paragraphs(text).map((p, i) => (
              <section key={i} className="space-y-2">
                {p.heading && (i === 0 ? <h1 className="font-display text-2xl">{p.heading}</h1> : <h2 className="text-lg font-semibold">{p.heading}</h2>)}
                {p.body && <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{p.body}</p>}
              </section>
            ))}
        </CardContent></Card>
      </div>
    </main>
  );
}
