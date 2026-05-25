import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Image as ImageIcon, Plus, Trash2, ZoomIn, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SessionImage {
  id: string;
  storage_path: string;
  label: string | null;
  created_at: string;
}

interface Props {
  clientId: string;
  canEdit?: boolean;
}

const MAX_IMAGES = 5;
const BUCKET = "profiling-photos";

export default function ClientSessionImages({ clientId, canEdit = true }: Props) {
  const { user } = useAuth();
  const [images, setImages] = useState<SessionImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchImages() {
    const { data } = await supabase
      .from("client_session_images")
      .select("id, storage_path, label, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setImages(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchImages();
  }, [clientId]);

  function publicUrl(path: string) {
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !user) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum of ${MAX_IMAGES} images reached`);
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      for (const file of toUpload) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `session-images/${clientId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase.from("client_session_images").insert({
          client_id: clientId,
          practitioner_id: user.id,
          storage_path: path,
          label: file.name.replace(/\.[^.]+$/, "").slice(0, 80),
        });
        if (dbErr) throw dbErr;
      }
      toast.success(`Uploaded ${toUpload.length} image${toUpload.length === 1 ? "" : "s"}`);
      await fetchImages();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(img: SessionImage) {
    if (!confirm("Remove this image?")) return;
    const { error: sErr } = await supabase.storage.from(BUCKET).remove([img.storage_path]);
    if (sErr) {
      toast.error("Failed to remove file");
      return;
    }
    await supabase.from("client_session_images").delete().eq("id", img.id);
    setImages(prev => prev.filter(i => i.id !== img.id));
    toast.success("Image removed");
  }

  async function handleRename(img: SessionImage, newLabel: string) {
    await supabase.from("client_session_images").update({ label: newLabel || null }).eq("id", img.id);
    setImages(prev => prev.map(i => (i.id === img.id ? { ...i, label: newLabel || null } : i)));
  }

  if (loading) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" /> Session Images ({images.length}/{MAX_IMAGES})
        </p>
        {canEdit && images.length < MAX_IMAGES && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px]"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
              {uploading ? "Uploading…" : "Add Image"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </>
        )}
      </div>

      {images.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No session images attached.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {images.map(img => {
            const url = publicUrl(img.storage_path);
            return (
              <div key={img.id} className="group relative">
                <button
                  onClick={() => setZoomedUrl(url)}
                  className="block w-full aspect-square rounded-lg overflow-hidden border border-border bg-muted/30 hover:ring-2 hover:ring-primary/40 transition-all"
                >
                  <img src={url} alt={img.label || "Session image"} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(img)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                <Input
                  defaultValue={img.label || ""}
                  placeholder="Label…"
                  disabled={!canEdit}
                  onBlur={(e) => {
                    if (e.target.value !== (img.label || "")) handleRename(img, e.target.value);
                  }}
                  className="h-6 text-[10px] mt-1 px-1.5"
                />
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!zoomedUrl} onOpenChange={() => setZoomedUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          {zoomedUrl && <img src={zoomedUrl} alt="Session image" className="w-full h-full object-contain max-h-[85vh]" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
