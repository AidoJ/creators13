import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Video, Music, Image, File, Download, ExternalLink, Play } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  file_name: string;
  file_size_bytes: number | null;
  storage_path: string;
  created_at: string;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const TYPE_CONFIG: Record<string, { icon: typeof File; color: string }> = {
  video: { icon: Video, color: "text-blue-500" },
  audio: { icon: Music, color: "text-purple-500" },
  document: { icon: FileText, color: "text-amber-500" },
  image: { icon: Image, color: "text-green-500" },
  url: { icon: ExternalLink, color: "text-cyan-500" },
};

export default function ResourceLibrary() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");

  useEffect(() => {
    supabase
      .from("training_resources")
      .select("id, title, description, resource_type, file_name, file_size_bytes, storage_path, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setResources(data || []);
        setLoading(false);
      });
  }, []);

  function getPublicUrl(path: string) {
    return supabase.storage.from("training-resources").getPublicUrl(path).data.publicUrl;
  }

  function handleOpen(resource: Resource) {
    if (resource.resource_type === "url") {
      window.open(resource.storage_path, "_blank");
      return;
    }
    const url = getPublicUrl(resource.storage_path);
    if (resource.resource_type === "video" || resource.resource_type === "audio") {
      setPreviewUrl(url);
      setPreviewType(resource.resource_type);
    } else {
      window.open(url, "_blank");
    }
  }

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading resources…</div>;

  if (resources.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No training resources available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Media preview */}
      {previewUrl && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Preview</p>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPreviewUrl(null)}>Close</Button>
          </div>
          {previewType === "video" ? (
            <video src={previewUrl} controls className="w-full rounded-lg max-h-96" />
          ) : (
            <audio src={previewUrl} controls className="w-full" />
          )}
        </div>
      )}

      {/* Resource grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {resources.map(r => {
          const cfg = TYPE_CONFIG[r.resource_type] || { icon: File, color: "text-muted-foreground" };
          const Icon = cfg.icon;
          return (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-muted/50 ${cfg.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm truncate">{r.title}</h4>
                  {r.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-[10px] capitalize">{r.resource_type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{formatBytes(r.file_size_bytes)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {r.resource_type === "url" ? (
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => handleOpen(r)}>
                    <ExternalLink className="h-3 w-3 mr-1" />Open Link
                  </Button>
                ) : (r.resource_type === "video" || r.resource_type === "audio") ? (
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => handleOpen(r)}>
                    <Play className="h-3 w-3 mr-1" />Play
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => handleOpen(r)}>
                    <ExternalLink className="h-3 w-3 mr-1" />Open
                  </Button>
                )}
                {r.resource_type !== "url" && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                    <a href={getPublicUrl(r.storage_path)} download={r.file_name}>
                      <Download className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
