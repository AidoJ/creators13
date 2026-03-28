import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { FileText, Save, Loader2, ChevronRight, ChevronLeft, AlertTriangle, Upload, X, FileImage } from "lucide-react";
import BodyDrawingCanvas from "./BodyDrawingCanvas";
import AttachmentGallery from "./AttachmentGallery";
import type { Database } from "@/integrations/supabase/types";
import { getCreatorTypeColor } from "@/lib/creatorTypes";
// eslint-disable-next-line @typescript-eslint/no-explicit-any

type CaseStudyStatus = Database["public"]["Enums"]["case_study_status"];

interface ExistingCaseStudy {
  id: string;
  title: string;
  form_data: Record<string, any> | null;
  body_drawing_path: string | null;
  creator_types_identified: string[] | null;
  reviewer_notes: string | null;
  status: CaseStudyStatus;
}

interface CaseStudyFormProps {
  clientId: string;
  clientName: string;
  onSaved?: () => void;
  existingCaseStudy?: ExistingCaseStudy;
}

const CREATOR_TYPES = [
  "Lava", "Fire", "Whirlwind", "Snow", "Lightning", "Sun",
  "Lake", "Ocean", "Tree", "Mountain", "Soil", "River", "Sky",
];

const PAGES = ["assessment", "details", "preparation", "reflection"] as const;
const PAGE_LABELS = {
  assessment: "Body Assessment",
  details: "Assessment Details",
  preparation: "Feedback Preparation",
  reflection: "Feedback Reflection",
};

export default function CaseStudyForm({ clientId, clientName, onSaved, existingCaseStudy }: CaseStudyFormProps) {
  const { user } = useAuth();
  const isEditing = !!existingCaseStudy;
  const existingAttachments = (existingCaseStudy?.form_data?.attachments as string[] | undefined) || [];
  const hasPaperAttachments = existingAttachments.length > 0;
  
  // Assessment mode: "online" for digital form, "paper" for scanned uploads
  const [mode, setMode] = useState<"online" | "paper">(
    hasPaperAttachments ? "paper" : (isEditing ? "online" : "")  as "online" | "paper"
  );
  const [page, setPage] = useState<typeof PAGES[number]>("assessment");
  const [saving, setSaving] = useState(false);

  // Paper upload state
  const [paperFiles, setPaperFiles] = useState<File[]>([]);
  const [paperPreviews, setPaperPreviews] = useState<string[]>([]);
  const [uploadingPaper, setUploadingPaper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-populate from existing case study form_data if editing
  const fd = existingCaseStudy?.form_data || {};
  const p1 = fd.page1 || {};
  const p2 = fd.page2 || {};
  const p3 = fd.page3 || {};
  const p4 = fd.page4 || {};

  // Header fields
  const [title, setTitle] = useState(existingCaseStudy?.title || `${clientName} — Case Study Assessment`);
  const [assessmentDate, setAssessmentDate] = useState(fd.assessment_date || new Date().toISOString().split("T")[0]);

  // Page 1: Body Assessment
  const [bodyDrawing, setBodyDrawing] = useState<string | null>(null);
  const [existingDrawingLoaded, setExistingDrawingLoaded] = useState(false);

  // Load existing body drawing from storage when editing
  useEffect(() => {
    if (!existingCaseStudy?.body_drawing_path || existingDrawingLoaded) return;
    const { data } = supabase.storage
      .from("profiling-photos")
      .getPublicUrl(existingCaseStudy.body_drawing_path);
    if (data?.publicUrl) {
      setBodyDrawing(data.publicUrl);
      setExistingDrawingLoaded(true);
    }
  }, [existingCaseStudy?.body_drawing_path, existingDrawingLoaded]);
  const [headNeck, setHeadNeck] = useState(p1.head_neck || "");
  const [chestArms, setChestArms] = useState(p1.chest_arms || "");
  const [bellyWaist, setBellyWaist] = useState(p1.belly_waist || "");
  const [upperThighs, setUpperThighs] = useState(p1.upper_thighs_hips_buttocks || "");
  const [legsFeet, setLegsFeet] = useState(p1.legs_feet || "");

  // Page 2: Assessment Details
  const [prominentFace, setProminentFace] = useState(p2.prominent_features_face || "");
  const [prominentBody, setProminentBody] = useState(p2.prominent_features_body || "");
  const [prominentHandsFeet, setProminentHandsFeet] = useState(p2.prominent_features_hands_feet || "");
  const [concentrationOfTissue, setConcentrationOfTissue] = useState(p2.concentration_of_tissue || "");
  const [otherAilments, setOtherAilments] = useState(p2.other_ailments || "");
  const [possibleCreatorTypes, setPossibleCreatorTypes] = useState<string[]>(existingCaseStudy?.creator_types_identified || []);

  // Page 3: Feedback Preparation
  const [keyFeaturesCT1, setKeyFeaturesCT1] = useState(p3.key_features_ct1 || "");
  const [keyFeaturesCT2, setKeyFeaturesCT2] = useState(p3.key_features_ct2 || "");
  const [keyFeaturesOther, setKeyFeaturesOther] = useState(p3.key_features_other || "");
  const [keyQuestions, setKeyQuestions] = useState(p3.key_questions || "");

  // Page 4: Feedback Reflection
  const [lightBulbMoments, setLightBulbMoments] = useState(p4.light_bulb_moments || "");
  const [whatLearned, setWhatLearned] = useState(p4.what_learned || "");
  const [whatWentWell, setWhatWentWell] = useState(p4.what_went_well || "");
  const [potentialFollowUp, setPotentialFollowUp] = useState(p4.potential_follow_up || "");
  const [otherComments, setOtherComments] = useState(p4.other_comments || "");

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

  function handlePaperFileSelect(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setPaperFiles(prev => [...prev, ...newFiles]);
    setPaperPreviews(prev => [...prev, ...newPreviews]);
  }

  function removePaperFile(idx: number) {
    setPaperFiles(prev => prev.filter((_, i) => i !== idx));
    setPaperPreviews(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function uploadPaperAttachments(caseStudyId: string): Promise<string[]> {
    const paths: string[] = [];
    for (let i = 0; i < paperFiles.length; i++) {
      const file = paperFiles[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `case-study-attachments/${caseStudyId}/${clientName.replace(/\s+/g, "_")}_page_${existingAttachments.length + i + 1}.${ext}`;
      const { error } = await supabase.storage
        .from("profiling-photos")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) {
        console.error("Upload error:", error);
        toast({ title: "Upload failed", description: `${file.name}: ${error.message}`, variant: "destructive" });
      } else {
        paths.push(path);
      }
    }
    return paths;
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

  async function notifyTrainerSubmission() {
    if (!user) return;
    try {
      await supabase.functions.invoke("notify-trainer-submission", {
        body: {
          practitioner_id: user.id,
          client_name: clientName,
          case_study_title: title,
        },
      });
    } catch (e) {
      console.error("Failed to notify trainer:", e);
    }
  }

  async function handleSave(status: CaseStudyStatus = "draft") {
    if (!user) return;
    setSaving(true);

    if (mode === "paper") {
      // Paper upload mode — upload files and save as attachments
      const caseStudyId = existingCaseStudy?.id || crypto.randomUUID();
      let newPaths: string[] = [];
      if (paperFiles.length > 0) {
        setUploadingPaper(true);
        newPaths = await uploadPaperAttachments(caseStudyId);
        setUploadingPaper(false);
      }
      const allAttachments = [...existingAttachments, ...newPaths];
      const formData = { attachments: allAttachments, assessment_date: assessmentDate, mode: "paper" };

      if (isEditing && existingCaseStudy) {
        const { error } = await supabase.from("case_studies").update({
          title,
          description: `Paper assessment for ${clientName} on ${assessmentDate}`,
          creator_types_identified: possibleCreatorTypes,
          form_data: formData,
          profiling_notes: "Paper-based assessment — see attached scanned pages.",
          status,
        } as any).eq("id", existingCaseStudy.id);
        if (error) toast({ title: "Error saving", description: error.message, variant: "destructive" });
        else { toast({ title: "Case study updated" }); if (status === "submitted") notifyTrainerSubmission(); onSaved?.(); }
      } else {
        const { error } = await supabase.from("case_studies").insert({
          id: caseStudyId,
          practitioner_id: user.id,
          subject_user_id: clientId,
          title,
          description: `Paper assessment for ${clientName} on ${assessmentDate}`,
          creator_types_identified: possibleCreatorTypes,
          form_data: formData,
          profiling_notes: "Paper-based assessment — see attached scanned pages.",
          status,
        } as any);
        if (error) toast({ title: "Error saving", description: error.message, variant: "destructive" });
        else { toast({ title: "Case study saved", description: status === "submitted" ? "Submitted for review." : "Saved as draft." }); if (status === "submitted") notifyTrainerSubmission(); onSaved?.(); }
      }
      setSaving(false);
      return;
    }

    // Only upload if bodyDrawing is a new data URL (not a public URL from storage)
    let drawingPath: string | null = existingCaseStudy?.body_drawing_path || null;
    if (bodyDrawing && bodyDrawing.startsWith("data:")) {
      const uploadedPath = await uploadBodyDrawing();
      if (uploadedPath) drawingPath = uploadedPath;
    }

    const formData = {
      page1: { head_neck: headNeck, chest_arms: chestArms, belly_waist: bellyWaist, upper_thighs_hips_buttocks: upperThighs, legs_feet: legsFeet },
      page2: { prominent_features_face: prominentFace, prominent_features_body: prominentBody, prominent_features_hands_feet: prominentHandsFeet, concentration_of_tissue: concentrationOfTissue, other_ailments: otherAilments },
      page3: { key_features_ct1: keyFeaturesCT1, key_features_ct2: keyFeaturesCT2, key_features_other: keyFeaturesOther, key_questions: keyQuestions },
      page4: { light_bulb_moments: lightBulbMoments, what_learned: whatLearned, what_went_well: whatWentWell, potential_follow_up: potentialFollowUp, other_comments: otherComments },
      assessment_date: assessmentDate,
      mode: "online",
    };

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

    if (isEditing && existingCaseStudy) {
      const updatePayload: Record<string, unknown> = {
        title,
        description: `Assessment for ${clientName} on ${assessmentDate}`,
        profiling_notes: profilingNotes,
        creator_types_identified: possibleCreatorTypes,
        form_data: formData,
        status,
      };
      if (drawingPath) updatePayload.body_drawing_path = drawingPath;

      const { error } = await supabase.from("case_studies").update(updatePayload as any).eq("id", existingCaseStudy.id);
      if (error) {
        toast({ title: "Error saving", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Case study updated", description: status === "submitted" ? "Re-submitted for review." : "Saved as draft." });
        if (status === "submitted") notifyTrainerSubmission();
        onSaved?.();
      }
    } else {
      // Safeguard: check for existing case study for this subject from this practitioner
      const { data: existingStudies } = await supabase
        .from("case_studies")
        .select("id, title")
        .eq("practitioner_id", user.id)
        .eq("subject_user_id", clientId)
        .limit(1);

      if (existingStudies && existingStudies.length > 0) {
        toast({
          title: "Case study already exists",
          description: `"${existingStudies[0].title}" already exists for this client. Please edit the existing study instead.`,
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

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
        if (status === "submitted") notifyTrainerSubmission();
        onSaved?.();
      }
    }
    setSaving(false);
  }

  const pageIdx = PAGES.indexOf(page);

  // Validation: all fields + drawing required for submit (online mode)
  const allPage1Filled = !!(headNeck.trim() && chestArms.trim() && bellyWaist.trim() && upperThighs.trim() && legsFeet.trim());
  const allPage2Filled = !!(prominentFace.trim() && prominentBody.trim() && prominentHandsFeet.trim() && concentrationOfTissue.trim() && otherAilments.trim());
  const allPage3Filled = !!(keyFeaturesCT1.trim() && keyFeaturesCT2.trim() && keyFeaturesOther.trim() && keyQuestions.trim());
  const allPage4Filled = !!(lightBulbMoments.trim() && whatLearned.trim() && whatWentWell.trim() && potentialFollowUp.trim());
  const hasDrawing = !!bodyDrawing;
  const canSubmitOnline = allPage1Filled && allPage2Filled && allPage3Filled && allPage4Filled && hasDrawing;

  // Build missing items list for tooltip
  const missingItems: string[] = [];
  if (!hasDrawing) missingItems.push("Body drawing");
  if (!allPage1Filled) missingItems.push("Page 1 fields");
  if (!allPage2Filled) missingItems.push("Page 2 fields");
  if (!allPage3Filled) missingItems.push("Page 3 fields");
  if (!allPage4Filled) missingItems.push("Page 4 fields");

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-bold text-foreground">
          {isEditing ? "Edit Case Study Assessment" : "Case Study Assessment"}
        </h2>
      </div>

      {/* Reviewer notes banner when editing */}
      {isEditing && existingCaseStudy?.reviewer_notes && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Trainer Feedback
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{existingCaseStudy.reviewer_notes}</p>
        </div>
      )}

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

      {/* Mode selector — shown when mode not yet chosen, OR as a switcher when a mode is active */}
      {!mode ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">How would you like to complete this assessment?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setMode("online")}
              className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
            >
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold text-foreground">Online Form</span>
              <span className="text-xs text-muted-foreground">Fill in the 4-page assessment digitally</span>
            </button>
            <button
              onClick={() => setMode("paper")}
              className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
            >
              <Upload className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold text-foreground">Paper Upload</span>
              <span className="text-xs text-muted-foreground">Upload photos/scans of handwritten pages</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Mode: <span className="font-semibold text-foreground">{mode === "online" ? "Online Form" : "Paper Upload"}</span></span>
          {paperFiles.length === 0 && existingAttachments.length === 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setMode(mode === "online" ? "paper" : "online")}>
              Switch to {mode === "online" ? "Paper Upload" : "Online Form"}
            </Button>
          )}
        </div>
      )}

      {/* Paper upload mode */}
      {mode === "paper" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <FileImage className="h-4 w-4 text-primary" /> Upload Scanned Assessment Pages
            </p>
            <p className="text-xs text-muted-foreground">
              Take photos or scan your handwritten assessment pages and upload them here. You can upload multiple pages.
            </p>

            {/* Existing attachments */}
            {existingAttachments.length > 0 && (
              <AttachmentGallery attachments={existingAttachments} title="Previously Uploaded Pages" />
            )}

            {/* New file previews */}
            {paperPreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {paperPreviews.map((preview, i) => (
                  <div key={i} className="relative rounded-lg border border-border overflow-hidden aspect-[3/4] bg-muted/30">
                    <img src={preview} alt={`Page ${i + 1}`} className="w-full h-full object-contain" />
                    <button
                      onClick={() => removePaperFile(i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:opacity-80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 text-center">
                      New — Page {existingAttachments.length + i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handlePaperFileSelect(e.target.files)}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {paperPreviews.length > 0 || existingAttachments.length > 0 ? "Add More Pages" : "Select Photos / Scans"}
            </Button>
          </div>

          {/* Creator types selector (also available in paper mode) */}
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
                {possibleCreatorTypes.map(t => {
                  const c = getCreatorTypeColor(t);
                  return (
                    <button
                      key={t}
                      onClick={() => setPossibleCreatorTypes(possibleCreatorTypes.filter(x => x !== t))}
                      className="text-xs px-2.5 py-1 rounded-full font-medium transition-opacity hover:opacity-80"
                      style={{ backgroundColor: `${c}22`, color: c, border: `1px solid ${c}55` }}
                    >
                      {t} ✕
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save buttons for paper mode */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save Draft
            </Button>
            <Button onClick={() => handleSave("submitted")} disabled={saving || (paperFiles.length === 0 && existingAttachments.length === 0)}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Submit for Review
            </Button>
          </div>
        </div>
      )}

      {/* Online form mode */}
      {mode === "online" && (
        <>
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
                    {possibleCreatorTypes.map(t => {
                      const c = getCreatorTypeColor(t);
                      return (
                        <button
                          key={t}
                          onClick={() => setPossibleCreatorTypes(possibleCreatorTypes.filter(x => x !== t))}
                          className="text-xs px-2.5 py-1 rounded-full font-medium transition-opacity hover:opacity-80"
                          style={{ backgroundColor: `${c}22`, color: c, border: `1px solid ${c}55` }}
                        >
                          {t} ✕
                        </button>
                      );
                    })}
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

              <div>
                <h3 className="text-sm font-bold text-foreground">Other comments</h3>
                <Textarea value={otherComments} onChange={e => setOtherComments(e.target.value)} rows={3} placeholder="Any other comments…" className="mt-1" />
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
                <div className="flex flex-col items-end gap-1">
                  <Button onClick={() => handleSave("submitted")} disabled={saving || !canSubmitOnline}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Submit for Review
                  </Button>
                  {!canSubmitOnline && (
                    <p className="text-[10px] text-destructive">
                      Missing: {missingItems.join(", ")}
                    </p>
                  )}
                </div>
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
        </>
      )}
    </div>
  );
}
