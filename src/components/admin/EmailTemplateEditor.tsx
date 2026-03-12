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

  // Preview replacements for all known template variables
  const previewReplacements: Record<string, string> = {
    clientName: "Jane Doe",
    inviteLink: "https://creatortypes.com/enroll?example=true",
    firstName: "Sarah",
    title: "Weekly Training Session",
    description: '<p style="color:#666;font-size:14px;margin:0 0 8px 0;">Reviewing body profiling techniques and case study submissions.</p>',
    localTime: "Wednesday, 26 February 2026, 10:00 AM",
    durationMinutes: "60",
    timezone: "Australia/Sydney",
    recurrenceText: '<p style="color:#666;font-size:13px;margin:0 0 16px 0;">🔁 This is a <strong>weekly</strong> recurring call.</p>',
    zoomButton: '<div style="text-align:center;margin:24px 0 0 0;"><a href="#" style="display:inline-block;background:#BB1B56;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Join Zoom Meeting →</a></div>',
    email: "sarah@example.com",
    practitionerName: "Sarah Johnson",
    clientName: "Jane Doe",
    caseStudyTitle: "Assessment for Jane Doe on 2026-03-12",
    viewLink: "https://creators13.lovable.app/trainer",
    photosLink: "https://creators13.lovable.app/enroll/photos",
    loginLink: "https://creators13.lovable.app/auth",
  };
  let previewHtml = htmlBody;
  for (const [key, value] of Object.entries(previewReplacements)) {
    previewHtml = previewHtml.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

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
                  {selected.description || "Available placeholders shown in the template description above."}
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
