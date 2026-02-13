import { useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Camera, X, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EnrollmentHeader from "@/components/enrollment/EnrollmentHeader";
import { useToast } from "@/hooks/use-toast";

import guidePhoto1 from "@/assets/guide-photo-1.png";
import guidePhoto2 from "@/assets/guide-photo-2.png";
import guidePhoto3 from "@/assets/guide-photo-3.png";
import guidePhoto4 from "@/assets/guide-photo-4.png";
import guidePhoto5 from "@/assets/guide-photo-5.png";
import guidePhoto6 from "@/assets/guide-photo-6.png";
import guidePhoto7 from "@/assets/guide-photo-7.png";
import guidePhoto8 from "@/assets/guide-photo-8.png";

const PHOTO_SLOTS = [
  { key: "face_front_closed", label: "Face – Front", description: "Mouth closed, neutral expression", guide: guidePhoto1 },
  { key: "face_front_smiling", label: "Face – Smiling", description: "Smiling with teeth showing", guide: guidePhoto2 },
  { key: "face_side", label: "Face – Side Profile", description: "Clear side profile of your face", guide: guidePhoto3 },
  { key: "body_front", label: "Full Body – Front", description: "Standing naturally, facing camera", guide: guidePhoto4 },
  { key: "body_back", label: "Full Body – Back", description: "Standing naturally, back to camera", guide: guidePhoto5 },
  { key: "body_side", label: "Full Body – Side", description: "Standing naturally, side profile", guide: guidePhoto6 },
  { key: "feet", label: "Both Feet", description: "Top-down view of both feet together", guide: guidePhoto7 },
  { key: "hands", label: "Hand(s)", description: "Both hands, or one if they're similar", guide: guidePhoto8 },
] as const;

type PhotoKey = typeof PHOTO_SLOTS[number]["key"];

interface PhotoState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
}

const initialPhotoState: PhotoState = {
  file: null,
  preview: null,
  uploading: false,
  uploaded: false,
  error: null,
};

export default function Photos() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [photos, setPhotos] = useState<Record<PhotoKey, PhotoState>>(
    Object.fromEntries(PHOTO_SLOTS.map((s) => [s.key, { ...initialPhotoState }])) as Record<PhotoKey, PhotoState>
  );
  const [submitting, setSubmitting] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const tier = params.get("tier") || "wren";
  const billing = params.get("billing") || "monthly";

  const slot = PHOTO_SLOTS[currentStep];
  const photo = photos[slot.key];
  const completedCount = PHOTO_SLOTS.filter((s) => photos[s.key].file !== null).length;
  const allPhotosSelected = completedCount === PHOTO_SLOTS.length;

  const handleFileSelect = (file: File) => {
    const key = slot.key;
    if (!file.type.startsWith("image/")) {
      setPhotos((p) => ({ ...p, [key]: { ...p[key], error: "Please select an image file" } }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotos((p) => ({ ...p, [key]: { ...p[key], error: "Image must be under 10MB" } }));
      return;
    }
    const preview = URL.createObjectURL(file);
    setPhotos((p) => ({ ...p, [key]: { file, preview, uploading: false, uploaded: false, error: null } }));
  };

  const removePhoto = () => {
    const key = slot.key;
    if (photos[key].preview) URL.revokeObjectURL(photos[key].preview!);
    setPhotos((p) => ({ ...p, [key]: { ...initialPhotoState } }));
  };

  const goNext = () => {
    if (currentStep < PHOTO_SLOTS.length - 1) setCurrentStep(currentStep + 1);
  };
  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmitAll = async () => {
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    for (const s of PHOTO_SLOTS) {
      const p = photos[s.key];
      if (!p.file || p.uploaded) continue;

      setPhotos((prev) => ({ ...prev, [s.key]: { ...prev[s.key], uploading: true, error: null } }));

      const ext = p.file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${s.key}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profiling-photos")
        .upload(path, p.file, { upsert: true });

      if (uploadError) {
        setPhotos((prev) => ({ ...prev, [s.key]: { ...prev[s.key], uploading: false, error: uploadError.message } }));
        setSubmitting(false);
        return;
      }

      const { error: dbError } = await supabase.from("profiling_photos").upsert(
        { user_id: user.id, photo_type: s.key, storage_path: path },
        { onConflict: "user_id,photo_type" }
      );

      if (dbError) {
        setPhotos((prev) => ({ ...prev, [s.key]: { ...prev[s.key], uploading: false, error: dbError.message } }));
        setSubmitting(false);
        return;
      }

      setPhotos((prev) => ({ ...prev, [s.key]: { ...prev[s.key], uploading: false, uploaded: true } }));
    }

    await supabase.from("profiles").update({ enrollment_step: "photos_uploaded" }).eq("user_id", user.id);
    toast({ title: "All photos uploaded successfully!" });
    setSubmitting(false);
    navigate("/dashboard");
  };

  // Guidelines screen
  if (showGuidelines) {
    return (
      <div className="min-h-screen bg-background">
        <EnrollmentHeader currentStep={4} />
        <main className="container mx-auto px-4 py-10 max-w-lg">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-display font-bold text-foreground mb-3">
              How To Take Your Photos
            </h1>
            <p className="text-muted-foreground">
              We need 8 clear photos. Please read the guidelines below before you begin.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-display font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Important Guidelines
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span><strong className="text-foreground">Ask someone to take these photos for you</strong>, rather than taking them yourself in the mirror.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>Full body photos must show contours with <strong className="text-foreground">as much skin as possible</strong>.</span>
              </li>
            </ul>

            <h3 className="text-sm font-semibold text-foreground mt-5 mb-2">Please ensure:</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-forest mt-0.5 shrink-0" />
                Tight-fitting clothing — bathing suit, yoga wear (spine visible)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-forest mt-0.5 shrink-0" />
                No glasses on your face
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-forest mt-0.5 shrink-0" />
                No shoes or socks
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-forest mt-0.5 shrink-0" />
                Hair tied back, fringe clipped — forehead and ears visible
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-forest mt-0.5 shrink-0" />
                No makeup, especially eyebrow pencil
              </li>
            </ul>
          </div>

          <div className="text-center">
            <Button onClick={() => setShowGuidelines(false)} size="lg" className="rounded-full px-10 text-base font-semibold">
              I Understand — Start Photos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={4} />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Photo {currentStep + 1} of {PHOTO_SLOTS.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {completedCount} / {PHOTO_SLOTS.length} added
            </span>
          </div>
          <div className="flex gap-1">
            {PHOTO_SLOTS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all",
                  i === currentStep
                    ? "bg-primary"
                    : photos[s.key].file
                    ? "bg-forest/60"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-display font-bold text-foreground text-center mb-1">
          {currentStep + 1}. {slot.label}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-5">
          {slot.description}
        </p>

        {/* Guide vs Upload comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Guide photo */}
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground mb-1.5 text-center uppercase tracking-wide">Example</span>
            <div className="rounded-xl border border-border overflow-hidden bg-muted/20 flex-1">
              <img
                src={slot.guide}
                alt={`Guide: ${slot.label}`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* User upload */}
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground mb-1.5 text-center uppercase tracking-wide">Your Photo</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all flex-1 min-h-[200px]",
                photo.preview
                  ? "border-primary/40"
                  : "border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/50",
                photo.error && "border-destructive/60"
              )}
            >
              {photo.preview ? (
                <>
                  <img
                    src={photo.preview}
                    alt={slot.label}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {photo.uploaded && (
                    <div className="absolute top-2 right-2 bg-forest text-white rounded-full p-0.5">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  )}
                  {photo.uploading && (
                    <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                    className="absolute top-2 left-2 bg-foreground/60 text-white rounded-full p-1 hover:bg-foreground/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground font-medium">Tap to add photo</span>
                </>
              )}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = "";
          }}
        />

        {photo.error && (
          <p className="text-sm text-destructive text-center mb-4">{photo.error}</p>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="rounded-full flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          {currentStep < PHOTO_SLOTS.length - 1 ? (
            <Button
              onClick={goNext}
              className="rounded-full flex-1"
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitAll}
              disabled={!allPhotosSelected || submitting}
              className="rounded-full flex-1"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...</>
              ) : (
                <>Upload All <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          )}
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-1.5 justify-center mt-6">
          {PHOTO_SLOTS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setCurrentStep(i)}
              className={cn(
                "w-9 h-9 rounded-lg overflow-hidden border-2 transition-all",
                i === currentStep ? "border-primary" : "border-transparent",
                !photos[s.key].file && "bg-muted/40"
              )}
            >
              {photos[s.key].preview ? (
                <img src={photos[s.key].preview!} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-muted-foreground flex items-center justify-center h-full">{i + 1}</span>
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
