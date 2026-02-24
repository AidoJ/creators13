import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Save, Eye, EyeOff, RefreshCw } from "lucide-react";

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  html_body: string;
  description: string | null;
  updated_at: string;
}

export default function EmailTemplateEditor() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("template_key");
    if (error) {
      toast({ title: "Error loading templates", description: error.message, variant: "destructive" });
    } else {
      setTemplates(data || []);
      if (data && data.length > 0 && !selected) {
        selectTemplate(data[0]);
      }
    }
    setLoading(false);
  };

  const selectTemplate = (t: EmailTemplate) => {
    setSelected(t);
    setSubject(t.subject);
    setHtmlBody(t.html_body);
    setShowPreview(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("email_templates")
      .update({ subject, html_body: htmlBody, updated_at: new Date().toISOString() })
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template saved" });
      fetchTemplates();
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const previewHtml = htmlBody
    .replace(/\{\{clientName\}\}/g, "Jane Doe")
    .replace(/\{\{inviteLink\}\}/g, "https://creatortypes.com/enroll?example=true");

  if (loading) return <p className="text-muted-foreground text-sm py-4">Loading templates…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Email Templates</h3>
        <Button variant="outline" size="sm" onClick={fetchTemplates}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No email templates found.</p>
      ) : (
        <>
          {/* Template selector */}
          {templates.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {templates.map(t => (
                <Button
                  key={t.id}
                  variant={selected?.id === t.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectTemplate(t)}
                >
                  {t.template_key.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
          )}

          {selected && (
            <div className="space-y-4">
              {selected.description && (
                <p className="text-xs text-muted-foreground">{selected.description}</p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Subject Line</label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Email HTML</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                      {showPreview ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                      {showPreview ? "Edit" : "Preview"}
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Available placeholders: <code className="bg-muted px-1 rounded">{"{{clientName}}"}</code> <code className="bg-muted px-1 rounded">{"{{inviteLink}}"}</code>
                </p>

                {showPreview ? (
                  <div className="border border-border rounded-xl overflow-hidden bg-white">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full min-h-[600px] border-0"
                      title="Email Preview"
                      sandbox=""
                    />
                  </div>
                ) : (
                  <Textarea
                    value={htmlBody}
                    onChange={e => setHtmlBody(e.target.value)}
                    className="font-mono text-xs min-h-[400px]"
                    placeholder="Paste your email HTML here…"
                  />
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(selected.updated_at).toLocaleString()}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
