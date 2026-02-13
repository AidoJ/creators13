import { useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Camera, X, CheckCircle, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
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
  { key: "hands", label: "Hand(s)", description: "Both hands if they differ, or one hand", guide: guidePhoto8 },
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
  const [photos, setPhotos] = useState<Record<PhotoKey, PhotoState>>(
    Object.fromEntries(PHOTO_SLOTS.map((s) => [s.key, { ...initialPhotoState }])) as Record<PhotoKey, PhotoState>
  );
  const [submitting, setSubmitting] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const tier = params.get("tier") || "wren";
  const billing = params.get("billing") || "monthly";

  const handleFileSelect = (key: PhotoKey, file: File) => {
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

  const removePhoto = (key: PhotoKey) => {
    if (photos[key].preview) URL.revokeObjectURL(photos[key].preview!);
    setPhotos((p) => ({ ...p, [key]: { ...initialPhotoState } }));
  };

  const allPhotosSelected = PHOTO_SLOTS.every((s) => photos[s.key].file !== null);
  const uploadedCount = PHOTO_SLOTS.filter((s) => photos[s.key].uploaded).length;

  const handleSubmitAll = async () => {
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    for (const slot of PHOTO_SLOTS) {
      const photo = photos[slot.key];
      if (!photo.file || photo.uploaded) continue;

      setPhotos((p) => ({ ...p, [slot.key]: { ...p[slot.key], uploading: true, error: null } }));

      const ext = photo.file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${slot.key}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profiling-photos")
        .upload(path, photo.file, { upsert: true });

      if (uploadError) {
        setPhotos((p) => ({
          ...p,
          [slot.key]: { ...p[slot.key], uploading: false, error: uploadError.message },
        }));
        setSubmitting(false);
        return;
      }

      const { error: dbError } = await supabase.from("profiling_photos").upsert(
        { user_id: user.id, photo_type: slot.key, storage_path: path },
        { onConflict: "user_id,photo_type" }
      );

      if (dbError) {
        setPhotos((p) => ({
          ...p,
          [slot.key]: { ...p[slot.key], uploading: false, error: dbError.message },
        }));
        setSubmitting(false);
        return;
      }

      setPhotos((p) => ({
        ...p,
        [slot.key]: { ...p[slot.key], uploading: false, uploaded: true },
      }));
    }

    await supabase
      .from("profiles")
      .update({ enrollment_step: "photos_uploaded" })
      .eq("user_id", user.id);

    toast({ title: "All photos uploaded successfully!" });
    setSubmitting(false);

    // Booking page not yet built — go to dashboard for now
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={4} />

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Instructions */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">
            How To Take Your Photos
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            To see all of you, we require eight (8) clear photos of your face, hands, feet and body.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
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
              <span>Your full body photos must show the contours of your whole body with <strong className="text-foreground">as much skin shown as possible</strong>.</span>
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-foreground mt-5 mb-2">Please ensure you are wearing:</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-forest mt-0.5 shrink-0" />
              Tight-fitting clothing — bathing suit, yoga wear or similar (spine visible)
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
              Hair tied back, fringe clipped — we need to see your whole forehead and ears
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-forest mt-0.5 shrink-0" />
              No makeup, especially eyebrow pencil — we want your natural brows!
            </li>
          </ul>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
          {PHOTO_SLOTS.map((slot, i) => {
            const photo = photos[slot.key];
            return (
              <div key={slot.key} className="flex flex-col">
                <p className="text-xs font-semibold text-foreground mb-1">
                  {i + 1}. {slot.label}
                </p>

                {/* Guide example */}
                <div className="rounded-lg overflow-hidden border border-border mb-2 bg-muted/20">
                  <img
                    src={slot.guide}
                    alt={`Example: ${slot.label}`}
                    className="w-full aspect-[3/4] object-contain bg-muted/40 opacity-80"
                  />
                  <p className="text-[9px] text-muted-foreground text-center py-1 bg-muted/40">Example</p>
                </div>

                {/* Upload slot */}
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[slot.key]?.click()}
                  className={cn(
                    "relative aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all",
                    photo.preview
                      ? "border-primary/40"
                      : "border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/50",
                    photo.error && "border-destructive/60"
                  )}
                >
                  {photo.preview ? (
                    <>
                      <img src={photo.preview} alt={slot.label} className="absolute inset-0 w-full h-full object-cover" />
                      {photo.uploaded && (
                        <div className="absolute top-1.5 right-1.5 bg-forest text-white rounded-full p-0.5">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      )}
                      {photo.uploading && (
                        <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removePhoto(slot.key); }}
                        className="absolute top-1.5 left-1.5 bg-foreground/60 text-white rounded-full p-0.5 hover:bg-foreground/80"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-[10px] text-muted-foreground text-center px-2">{slot.description}</span>
                    </>
                  )}
                </button>
                <input
                  ref={(el) => { fileInputRefs.current[slot.key] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(slot.key, file);
                    e.target.value = "";
                  }}
                />
                {photo.error && (
                  <p className="text-[10px] text-destructive mt-1">{photo.error}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <div className="text-center space-y-3">
          {submitting && (
            <p className="text-sm text-muted-foreground">
              Uploading... {uploadedCount}/{PHOTO_SLOTS.length} complete
            </p>
          )}
          <Button
            onClick={handleSubmitAll}
            disabled={!allPhotosSelected || submitting}
            size="lg"
            className="rounded-full px-10 text-base font-semibold"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...</>
            ) : (
              <>Upload All Photos <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
