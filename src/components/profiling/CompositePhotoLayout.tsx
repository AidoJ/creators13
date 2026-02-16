import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const PHOTO_ORDER = [
  { key: "face_front_closed", label: "Face Front" },
  { key: "face_front_smiling", label: "Face Smiling" },
  { key: "face_side", label: "Face Side" },
  { key: "body_front", label: "Body Front" },
  { key: "body_back", label: "Body Back" },
  { key: "body_side", label: "Body Side" },
  { key: "feet", label: "Feet" },
  { key: "hands", label: "Hands" },
] as const;

interface CompositePhotoLayoutProps {
  userId: string;
  subjectName?: string;
  className?: string;
}

export default function CompositePhotoLayout({ userId, subjectName, className }: CompositePhotoLayoutProps) {
  const [photos, setPhotos] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPhotos() {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiling_photos")
        .select("photo_type, storage_path")
        .eq("user_id", userId);

      if (error || !data) {
        setLoading(false);
        return;
      }

      const photoMap: Record<string, string | null> = {};
      for (const row of data) {
        const { data: urlData } = supabase.storage
          .from("profiling-photos")
          .getPublicUrl(row.storage_path);
        photoMap[row.photo_type] = urlData?.publicUrl || null;
      }
      setPhotos(photoMap);
      setLoading(false);
    }
    fetchPhotos();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const Placeholder = ({ label }: { label: string }) => (
    <div className="bg-muted/50 rounded-lg flex flex-col items-center justify-center h-full min-h-[100px]">
      <User className="h-6 w-6 text-muted-foreground/40" />
      <span className="text-[10px] text-muted-foreground/60 mt-1">{label}</span>
    </div>
  );

  const PhotoCell = ({ photoKey, label, className: cellClass }: { photoKey: string; label: string; className?: string }) => {
    const url = photos[photoKey];
    return (
      <div className={cn("overflow-hidden rounded-lg", cellClass)}>
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-contain bg-muted/30" />
        ) : (
          <Placeholder label={label} />
        )}
      </div>
    );
  };

  return (
    <div className={cn("bg-card border border-border rounded-2xl p-4", className)}>
      {subjectName && (
        <h3 className="text-lg font-display font-bold text-foreground mb-3">{subjectName}</h3>
      )}

      {/* Composite grid matching reference layout:
          Row 1: face_front_closed | face_front_smiling | face_side | body_front | body_back | body_side
          Row 2: feet | hands | (empty) | (body photos span full height)
      */}
      <div className="grid grid-cols-6 gap-2">
        {/* Top row - faces */}
        <PhotoCell photoKey="face_front_closed" label="Face Front" className="aspect-square" />
        <PhotoCell photoKey="face_front_smiling" label="Face Smiling" className="aspect-square" />
        <PhotoCell photoKey="face_side" label="Face Side" className="aspect-square" />

        {/* Body photos - taller */}
        <PhotoCell photoKey="body_front" label="Body Front" className="row-span-2 aspect-[3/5]" />
        <PhotoCell photoKey="body_back" label="Body Back" className="row-span-2 aspect-[3/5]" />
        <PhotoCell photoKey="body_side" label="Body Side" className="row-span-2 aspect-[3/5]" />

        {/* Bottom left - feet & hands */}
        <PhotoCell photoKey="feet" label="Feet" className="aspect-square" />
        <PhotoCell photoKey="hands" label="Hands" className="aspect-square" />
        <div /> {/* empty cell */}
      </div>
    </div>
  );
}
