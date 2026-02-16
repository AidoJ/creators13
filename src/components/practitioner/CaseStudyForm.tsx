import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { FileText, Save, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type CaseStudyStatus = Database["public"]["Enums"]["case_study_status"];

interface CaseStudyFormProps {
  clientId: string;
  clientName: string;
  onSaved?: () => void;
}

const BODY_REGIONS = [
  "Head & Face",
  "Neck & Shoulders",
  "Torso & Trunk",
  "Arms & Hands",
  "Legs & Feet",
] as const;

export default function CaseStudyForm({ clientId, clientName, onSaved }: CaseStudyFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(`${clientName} — Creator Type Assessment`);
  const [description, setDescription] = useState("");
  const [profilingNotes, setProfilingNotes] = useState("");
  const [regionNotes, setRegionNotes] = useState<Record<string, string>>(
    Object.fromEntries(BODY_REGIONS.map(r => [r, ""]))
  );
  const [identifiedTypes, setIdentifiedTypes] = useState<string[]>([]);
  const [typeInput, setTypeInput] = useState("");
  const [saving, setSaving] = useState(false);

  const CREATOR_TYPES = [
    "Lava", "Fire", "Whirlwind", "Sun", "Lightning", "Sky",
    "Mountain", "Tree", "Soil", "River", "Ocean", "Lake", "Snow",
  ];

  function addType(type: string) {
    if (type && !identifiedTypes.includes(type)) {
      setIdentifiedTypes([...identifiedTypes, type]);
    }
    setTypeInput("");
  }

  async function handleSave(status: CaseStudyStatus = "draft") {
    if (!user) return;
    setSaving(true);

    // Combine region notes into profiling notes
    const fullNotes = [
      profilingNotes,
      "",
      "## Body Region Observations",
      ...BODY_REGIONS.map(r => `### ${r}\n${regionNotes[r] || "—"}`),
    ].join("\n\n");

    const { error } = await supabase.from("case_studies").insert({
      practitioner_id: user.id,
      subject_user_id: clientId,
      title,
      description,
      profiling_notes: fullNotes,
      creator_types_identified: identifiedTypes,
      status,
    });

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Case study saved", description: status === "submitted" ? "Submitted for review." : "Saved as draft." });
      onSaved?.();
    }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-bold text-foreground">New Case Study</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Description / Overview</label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Brief overview of this assessment…" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">General Profiling Notes</label>
          <Textarea value={profilingNotes} onChange={e => setProfilingNotes(e.target.value)} rows={3} placeholder="Overall observations, energy patterns, initial impressions…" />
        </div>

        {/* Body region observations */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Body Region Observations</p>
          {BODY_REGIONS.map(region => (
            <div key={region}>
              <label className="text-xs text-foreground font-medium">{region}</label>
              <Textarea
                value={regionNotes[region]}
                onChange={e => setRegionNotes({ ...regionNotes, [region]: e.target.value })}
                rows={2}
                placeholder={`Observations for ${region.toLowerCase()}…`}
                className="mt-1"
              />
            </div>
          ))}
        </div>

        {/* Creator types identified */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Creator Types Identified</label>
          <div className="flex gap-2 mt-1">
            <Select value={typeInput} onValueChange={v => addType(v)}>
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                {CREATOR_TYPES.filter(t => !identifiedTypes.includes(t)).map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {identifiedTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {identifiedTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setIdentifiedTypes(identifiedTypes.filter(x => x !== t))}
                  className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full hover:bg-secondary/20 transition-colors"
                >
                  {t} ✕
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save Draft
        </Button>
        <Button onClick={() => handleSave("submitted")} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Submit for Review
        </Button>
      </div>
    </div>
  );
}
