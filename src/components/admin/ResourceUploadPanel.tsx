import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Upload, Loader2, Trash2, FileText, Video, Music, Image, File } from "lucide-react";

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

const RESOURCE_TYPES = [
  { value: "video", label: "Video", icon: Video },
  { value: "document", label: "Document / PDF", icon: FileText },
  { value: "audio", label: "Audio", icon: Music },
  { value: "image", label: "Image", icon: Image },
];

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function typeIcon(type: string) {
  const t = RESOURCE_TYPES.find(r => r.value === type);
  const Icon = t?.icon || File;
  return <Icon className="h-4 w-4" />;
}

export default function ResourceUploadPanel() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("document");
  const [file, setFile] = useState<File | null>(null);

  const fetchResources = useCallback(async () => {
    const { data } = await supabase
      .from("training_resources")
      .select("id, title, description, resource_type, file_name, file_size_bytes, storage_path, created_at")
      .order("created_at", { ascending: false });
    setResources(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  async function handleUpload() {
    if (!file || !title.trim() || !user) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const storagePath = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    // Upload to storage
    const { error: storageError } = await supabase.storage
      .from("training-resources")
      .upload(storagePath, file);

    if (storageError) {
      toast({ title: "Upload failed", description: storageError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // Save metadata
    const { error: dbError } = await supabase.from("training_resources").insert({
      title: title.trim(),
      description: description.trim() || null,
      resource_type: resourceType,
      storage_path: storagePath,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
    });

    if (dbError) {
      toast({ title: "Save failed", description: dbError.message, variant: "destructive" });
    } else {
      toast({ title: "Resource uploaded" });
      setTitle("");
      setDescription("");
      setFile(null);
      setResourceType("document");
      await fetchResources();
    }
    setUploading(false);
  }

  async function handleDelete(resource: Resource) {
    const { error: storageErr } = await supabase.storage
      .from("training-resources")
      .remove([resource.storage_path]);

    const { error: dbErr } = await supabase
      .from("training_resources")
      .delete()
      .eq("id", resource.id);

    if (storageErr || dbErr) {
      toast({ title: "Delete failed", description: (storageErr || dbErr)?.message, variant: "destructive" });
    } else {
      toast({ title: "Resource deleted" });
      await fetchResources();
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" /> Upload New Resource
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Body Region Training Video" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief description of this resource…" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">File *</label>
          <Input
            type="file"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="mt-1"
            accept="video/*,audio/*,application/pdf,image/*,.doc,.docx,.ppt,.pptx"
          />
          {file && <p className="text-xs text-muted-foreground mt-1">{file.name} ({formatBytes(file.size)})</p>}
        </div>

        <Button onClick={handleUpload} disabled={!title.trim() || !file || uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
          Upload Resource
        </Button>
      </div>

      {/* Resource list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Resource</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Type</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Size</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Uploaded</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : resources.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No resources uploaded yet.</td></tr>
            ) : resources.map(r => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-accent/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {typeIcon(r.resource_type)}
                    <div>
                      <p className="font-medium text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.file_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="text-[10px] capitalize">{r.resource_type}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatBytes(r.file_size_bytes)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-AU")}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(r)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
