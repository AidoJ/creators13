import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { FileText, Save, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import BodyDrawingCanvas from "./BodyDrawingCanvas";
import type { Database } from "@/integrations/supabase/types";
// eslint-disable-next-line @typescript-eslint/no-explicit-any

type CaseStudyStatus = Database["public"]["Enums"]["case_study_status"];

interface CaseStudyFormProps {
  clientId: string;
  clientName: string;
  onSaved?: () => void;
}

const CREATOR_TYPES = [
  "Lava", "Fire", "Whirlwind", "Sun", "Lightning", "Sky",
  "Mountain", "Tree", "Soil", "River", "Ocean", "Lake", "Snow",
];

const PAGES = ["assessment", "details", "preparation", "reflection"] as const;
const PAGE_LABELS = {
  assessment: "Body Assessment",
  details: "Assessment Details",
  preparation: "Feedback Preparation",
  reflection: "Feedback Reflection",
};

export default function CaseStudyForm({ clientId, clientName, onSaved }: CaseStudyFormProps) {
  const { user } = useAuth();
  const [page, setPage] = useState<typeof PAGES[number]>("assessment");
  const [saving, setSaving] = useState(false);

  // Header fields
  const [title, setTitle] = useState(`${clientName} — Case Study Assessment`);
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split("T")[0]);

  // Page 1: Body Assessment
  const [bodyDrawing, setBodyDrawing] = useState<string | null>(null);
  const [headNeck, setHeadNeck] = useState("");
  const [chestArms, setChestArms] = useState("");
  const [bellyWaist, setBellyWaist] = useState("");
  const [upperThighs, setUpperThighs] = useState("");
  const [legsFeet, setLegsFeet] = useState("");

  // Page 2: Assessment Details
  const [prominentFace, setProminentFace] = useState("");
  const [prominentBody, setProminentBody] = useState("");
  const [prominentHandsFeet, setProminentHandsFeet] = useState("");
  const [concentrationOfTissue, setConcentrationOfTissue] = useState("");
  const [otherAilments, setOtherAilments] = useState("");
  const [possibleCreatorTypes, setPossibleCreatorTypes] = useState<string[]>([]);

  // Page 3: Feedback Preparation
  const [keyFeaturesCT1, setKeyFeaturesCT1] = useState("");
  const [keyFeaturesCT2, setKeyFeaturesCT2] = useState("");
  const [keyFeaturesOther, setKeyFeaturesOther] = useState("");
  const [keyQuestions, setKeyQuestions] = useState("");

  // Page 4: Feedback Reflection
  const [lightBulbMoments, setLightBulbMoments] = useState("");
  const [whatLearned, setWhatLearned] = useState("");
  const [whatWentWell, setWhatWentWell] = useState("");
  const [potentialFollowUp, setPotentialFollowUp] = useState("");

  function addCreatorType(type: string) {
    if (type && !possibleCreatorTypes.includes(type)) {
      setPossibleCreatorTypes([...possibleCreatorTypes, type]);
    }
  }

  function navigatePage(dir: 1 | -1) {
    const idx = PAGES.indexOf(page);
    const next = PAGES[idx + dir];
    if (next) setPage(next);
  }

  async function uploadBodyDrawing(): Promise<string | null> {
    if (!bodyDrawing || !user) return null;
    // Convert data URL to blob
    const res = await fetch(bodyDrawing);
    const blob = await res.blob();
    const path = `body-drawings/${user.id}/${clientId}-${Date.now()}.png`;
    const { error } = await supabase.storage
      .from("profiling-photos")
      .upload(path, blob, { contentType: "image/png", upsert: true });
    if (error) {
      console.error("Drawing upload error:", error);
      return null;
    }
    return path;
  }

  async function handleSave(status: CaseStudyStatus = "draft") {
    if (!user) return;
    setSaving(true);

    // Upload body drawing if present
    let drawingPath: string | null = null;
    if (bodyDrawing) {
      drawingPath = await uploadBodyDrawing();
    }

    const formData = {
      page1: { head_neck: headNeck, chest_arms: chestArms, belly_waist: bellyWaist, upper_thighs_hips_buttocks: upperThighs, legs_feet: legsFeet },
      page2: { prominent_features_face: prominentFace, prominent_features_body: prominentBody, prominent_features_hands_feet: prominentHandsFeet, concentration_of_tissue: concentrationOfTissue, other_ailments: otherAilments },
      page3: { key_features_ct1: keyFeaturesCT1, key_features_ct2: keyFeaturesCT2, key_features_other: keyFeaturesOther, key_questions: keyQuestions },
      page4: { light_bulb_moments: lightBulbMoments, what_learned: whatLearned, what_went_well: whatWentWell, potential_follow_up: potentialFollowUp },
      assessment_date: assessmentDate,
    };

    // Build profiling_notes as combined text for backward compatibility
    const profilingNotes = [
      "## Body Assessment",
      `### Head/Neck\n${headNeck || "—"}`,
      `### Chest/Arms\n${chestArms || "—"}`,
      `### Belly/Waist\n${bellyWaist || "—"}`,
      `### Upper Thighs/Hips/Buttocks\n${upperThighs || "—"}`,
      `### Legs/Feet\n${legsFeet || "—"}`,
      "",
      "## Prominent Features",
      `Face: ${prominentFace || "—"}`,
      `Body: ${prominentBody || "—"}`,
      `Hands + Feet: ${prominentHandsFeet || "—"}`,
      "",
      `## Concentration of Tissue\n${concentrationOfTissue || "—"}`,
      `## Other Ailments/Comments\n${otherAilments || "—"}`,
    ].join("\n\n");

    const insertPayload: Record<string, unknown> = {
      practitioner_id: user.id,
      subject_user_id: clientId,
      title,
      description: `Assessment for ${clientName} on ${assessmentDate}`,
      profiling_notes: profilingNotes,
      creator_types_identified: possibleCreatorTypes,
      form_data: formData,
      body_drawing_path: drawingPath,
      status,
    };

    const { error } = await supabase.from("case_studies").insert(insertPayload as any);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Case study saved", description: status === "submitted" ? "Submitted for review." : "Saved as draft." });
      onSaved?.();
    }
    setSaving(false);
  }

  const pageIdx = PAGES.indexOf(page);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-bold text-foreground">Case Study Assessment</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <Input type="date" value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)} className="mt-1" />
        </div>
      </div>

      {/* Page tabs */}
      <Tabs value={page} onValueChange={v => setPage(v as typeof page)}>
        <TabsList className="w-full grid grid-cols-4">
          {PAGES.map((p, i) => (
            <TabsTrigger key={p} value={p} className="text-xs">
              <span className="hidden sm:inline">{PAGE_LABELS[p]}</span>
              <span className="sm:hidden">Page {i + 1}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* === PAGE 1: Body Assessment === */}
        <TabsContent value="assessment" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">Draw directly on the body outline to mark observations. Add notes for each body region below.</p>
          
          <BodyDrawingCanvas onDrawingChange={setBodyDrawing} initialDrawing={bodyDrawing} />

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground">HEAD/NECK</label>
              <Textarea value={headNeck} onChange={e => setHeadNeck(e.target.value)} rows={2} placeholder="Observations for head and neck…" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">CHEST/ARMS</label>
              <Textarea value={chestArms} onChange={e => setChestArms(e.target.value)} rows={2} placeholder="Observations for chest and arms…" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">BELLY/WAIST</label>
              <Textarea value={bellyWaist} onChange={e => setBellyWaist(e.target.value)} rows={2} placeholder="Observations for belly and waist…" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">UPPER THIGHS/HIPS/BUTTOCKS</label>
              <Textarea value={upperThighs} onChange={e => setUpperThighs(e.target.value)} rows={2} placeholder="Observations for upper thighs, hips and buttocks…" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">LEGS/FEET</label>
              <Textarea value={legsFeet} onChange={e => setLegsFeet(e.target.value)} rows={2} placeholder="Observations for legs and feet…" className="mt-1" />
            </div>
          </div>
        </TabsContent>

        {/* === PAGE 2: Assessment Details === */}
        <TabsContent value="details" className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">PROMINENT FEATURES</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-primary italic">Face</label>
                <Textarea value={prominentFace} onChange={e => setProminentFace(e.target.value)} rows={3} placeholder="Notable facial features…" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-primary italic">Body</label>
                <Textarea value={prominentBody} onChange={e => setProminentBody(e.target.value)} rows={3} placeholder="Notable body features…" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-primary italic">Hands + Feet</label>
                <Textarea value={prominentHandsFeet} onChange={e => setProminentHandsFeet(e.target.value)} rows={3} placeholder="Notable features of hands and feet…" className="mt-1" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">CONCENTRATION OF TISSUE In Their Body</h3>
            <Textarea value={concentrationOfTissue} onChange={e => setConcentrationOfTissue(e.target.value)} rows={3} placeholder="Where tissue is concentrated in this body…" className="mt-1" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">OTHER Ailments, Notable Characteristics, Comments</h3>
            <Textarea value={otherAilments} onChange={e => setOtherAilments(e.target.value)} rows={3} placeholder="Any other observations, ailments, or comments…" className="mt-1" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">POSSIBLE CREATOR TYPES?</h3>
            <div className="flex gap-2 mt-1">
              <Select onValueChange={v => addCreatorType(v)}>
                <SelectTrigger className="flex-1 h-9 text-sm">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {CREATOR_TYPES.filter(t => !possibleCreatorTypes.includes(t)).map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {possibleCreatorTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {possibleCreatorTypes.map(t => (
                  <button
                    key={t}
                    onClick={() => setPossibleCreatorTypes(possibleCreatorTypes.filter(x => x !== t))}
                    className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full hover:bg-secondary/20 transition-colors"
                  >
                    {t} ✕
                  </button>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* === PAGE 3: Feedback Preparation === */}
        <TabsContent value="preparation" className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">KEY PHYSICAL FEATURES That Demonstrate Their CTs</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-primary italic">CT1</label>
                <Textarea value={keyFeaturesCT1} onChange={e => setKeyFeaturesCT1(e.target.value)} rows={3} placeholder="Physical features demonstrating Creator Type 1…" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-primary italic">CT2</label>
                <Textarea value={keyFeaturesCT2} onChange={e => setKeyFeaturesCT2(e.target.value)} rows={3} placeholder="Physical features demonstrating Creator Type 2…" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-primary italic">Other notable features</label>
                <Textarea value={keyFeaturesOther} onChange={e => setKeyFeaturesOther(e.target.value)} rows={3} placeholder="Any other notable physical features…" className="mt-1" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">KEY QUESTIONS To Ask Your Case Study</h3>
            <Textarea value={keyQuestions} onChange={e => setKeyQuestions(e.target.value)} rows={4} placeholder="Questions you plan to ask during the feedback session…" className="mt-1" />
          </div>
        </TabsContent>

        {/* === PAGE 4: Feedback Reflection === */}
        <TabsContent value="reflection" className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">REFLECTIONS From This Body + The Conversation</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-primary italic">Light bulb moments for your case study…</label>
                <Textarea value={lightBulbMoments} onChange={e => setLightBulbMoments(e.target.value)} rows={3} placeholder="Key insights or breakthroughs…" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-primary italic">What you learned from this body or how it shifted you…</label>
                <Textarea value={whatLearned} onChange={e => setWhatLearned(e.target.value)} rows={3} placeholder="Personal learnings and shifts…" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-primary italic">What went well + what you would do differently next time…</label>
                <Textarea value={whatWentWell} onChange={e => setWhatWentWell(e.target.value)} rows={3} placeholder="Reflections on the process…" className="mt-1" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">POTENTIAL FOLLOW-UP With Your Case Study</h3>
            <Textarea value={potentialFollowUp} onChange={e => setPotentialFollowUp(e.target.value)} rows={3} placeholder="Planned follow-up actions…" className="mt-1" />
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation + Save */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigatePage(-1)}
          disabled={pageIdx === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save Draft
          </Button>
          {pageIdx === PAGES.length - 1 && (
            <Button onClick={() => handleSave("submitted")} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Submit for Review
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigatePage(1)}
          disabled={pageIdx === PAGES.length - 1}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
