import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Check, Loader2 } from "lucide-react";
import type { FaceSplitData } from "@/components/trainer/FaceSplitMirror";
import type { BodyAnnotationData } from "@/components/trainer/BodyAnnotationTool";
import { getSignedPhotoUrl } from "@/lib/signedUrls";
import { getStoragePathFromPublicUrl } from "@/lib/creatorTypeProfilingData";

interface ProfilingReportButtonProps {
  clientId: string;
  clientEmail: string | null;
  clientName: string;
  practitionerName: string;
  creatorTypes: string[];
  faceSplitData: FaceSplitData | null;
  bodyAnnotationData: BodyAnnotationData | null;
}

/**
 * Uploads an image into the private reports/ folder and returns its storage
 * path. The path (never a URL) is what the email function receives; it
 * downloads the bytes server-side and attaches them inline.
 */
async function uploadToStorage(
  source: string,
  storagePath: string
): Promise<string | null> {
  try {
    let fetchFrom = source;
    if (!source.startsWith("data:")) {
      // Signed links expire in 60s — re-mint one from the storage path.
      const path = getStoragePathFromPublicUrl(source);
      if (path) {
        if (path === storagePath) return storagePath;
        const fresh = await getSignedPhotoUrl(path);
        if (fresh) fetchFrom = fresh;
      }
    }
    const res = await fetch(fetchFrom);
    const blob = await res.blob();
    const { error } = await supabase.storage
      .from("profiling-photos")
      .upload(storagePath, blob, { upsert: true, contentType: blob.type || "image/png" });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    return storagePath;
  } catch (e) {
    console.error("Upload failed:", e);
    return null;
  }
}

export default function ProfilingReportButton({
  clientId,
  clientEmail,
  clientName,
  practitionerName,
  creatorTypes,
  faceSplitData,
  bodyAnnotationData,
}: ProfilingReportButtonProps) {
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const { toast } = useToast();

  const hasContent =
    (faceSplitData?.leftMirroredDataUrl || faceSplitData?.notes) ||
    (bodyAnnotationData?.annotatedImageDataUrl || bodyAnnotationData?.notes);

  const handleSend = async () => {
    if (!clientEmail) {
      toast({ title: "No email address", description: "This client doesn't have an email on file.", variant: "destructive" });
      return;
    }
    if (!hasContent) {
      toast({ title: "Nothing to send", description: "Complete the face split or body annotation first.", variant: "destructive" });
      return;
    }

    setSending(true);

    try {
      const ts = Date.now();
      const imagePaths: Record<string, string> = {};

      // Upload face split images
      if (faceSplitData?.leftMirroredDataUrl) {
        const path = await uploadToStorage(
          faceSplitData.leftMirroredDataUrl,
          `reports/${clientId}/face-left-${ts}.png`
        );
        if (path) imagePaths.leftMirrored = path;
      }
      if (faceSplitData?.rightMirroredDataUrl) {
        const path = await uploadToStorage(
          faceSplitData.rightMirroredDataUrl,
          `reports/${clientId}/face-right-${ts}.png`
        );
        if (path) imagePaths.rightMirrored = path;
      }
      if (faceSplitData?.originalImageUrl) {
        // Works for both data URLs and short-lived signed URLs — the bytes are
        // copied into reports/ and referenced by path from here on.
        const path = await uploadToStorage(
          faceSplitData.originalImageUrl,
          `reports/${clientId}/face-original-${ts}.png`
        );
        if (path) imagePaths.original = path;
      }

      // Upload body annotation image
      if (bodyAnnotationData?.annotatedImageDataUrl) {
        const path = await uploadToStorage(
          bodyAnnotationData.annotatedImageDataUrl,
          `reports/${clientId}/body-annotated-${ts}.png`
        );
        if (path) imagePaths.bodyAnnotated = path;
      }

      const { data, error } = await supabase.functions.invoke("send-profiling-report", {
        body: {
          client_email: clientEmail,
          client_name: clientName,
          practitioner_name: practitionerName,
          face_split_notes: faceSplitData?.notes || "",
          body_annotation_notes: bodyAnnotationData?.notes || "",
          image_paths: imagePaths,
          creator_types: creatorTypes.join(", "),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const now = new Date().toLocaleString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setSentAt(now);
      toast({ title: "Report sent!", description: `Profiling report emailed to ${clientEmail}` });
    } catch (err: any) {
      console.error("Send report error:", err);
      toast({ title: "Failed to send", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Email Profiling Report
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasContent
              ? `Compile photos & notes into a report and email to ${clientEmail || "client"}`
              : "Complete the face split or body annotation above first"}
          </p>
          {sentAt && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Last sent: {sentAt}
            </p>
          )}
        </div>
        <Button
          onClick={handleSend}
          disabled={sending || !hasContent || !clientEmail}
          className="gap-2"
          variant={sentAt ? "outline" : "default"}
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : sentAt ? (
            <>
              <Send className="h-4 w-4" />
              Resend Report
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
