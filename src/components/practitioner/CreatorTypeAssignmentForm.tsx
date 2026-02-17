import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Save, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreatorType {
  name: string;
  family: string;
  element: string;
  color_hex: string | null;
}

interface CreatorTypeAssignmentFormProps {
  clientId: string;
  clientName: string;
}

export default function CreatorTypeAssignmentForm({ clientId, clientName }: CreatorTypeAssignmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [creatorTypes, setCreatorTypes] = useState<CreatorType[]>([]);
  const [primaryType, setPrimaryType] = useState<string>("");
  const [secondaryType, setSecondaryType] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [typesRes, profileRes] = await Promise.all([
        supabase.from("creator_types").select("name, family, element, color_hex").order("sort_order"),
        supabase.from("creator_type_profiles").select("id, primary_type, secondary_type, profiling_data").eq("user_id", clientId).maybeSingle(),
      ]);
      if (typesRes.data) setCreatorTypes(typesRes.data);
      if (profileRes.data) {
        setExistingProfileId(profileRes.data.id);
        setPrimaryType(profileRes.data.primary_type || "");
        setSecondaryType(profileRes.data.secondary_type || "");
        const data = profileRes.data.profiling_data as Record<string, unknown> | null;
        setNotes((data?.notes as string) || "");
      }
      setLoading(false);
    }
    load();
  }, [clientId]);

  const handleSave = async () => {
    if (!primaryType || !user) return;
    setSaving(true);

    const payload = {
      user_id: clientId,
      primary_type: primaryType,
      secondary_type: secondaryType || null,
      profiled_by: user.id,
      profiled_at: new Date().toISOString(),
      profiling_data: { notes } as unknown as Record<string, never>,
    };

    let error;
    if (existingProfileId) {
      const res = await supabase.from("creator_type_profiles").update(payload).eq("id", existingProfileId);
      error = res.error;
    } else {
      const res = await supabase.from("creator_type_profiles").insert(payload);
      error = res.error;
    }

    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      setSaved(true);
      toast({ title: "Creator type assigned!", description: `${clientName} has been profiled as ${primaryType}.` });
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground text-center py-4">Loading…</div>;

  const grouped = creatorTypes.reduce<Record<string, CreatorType[]>>((acc, ct) => {
    (acc[ct.family] = acc[ct.family] || []).push(ct);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-secondary" />
        <h3 className="text-lg font-display font-bold text-foreground">Assign Creator Type</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Primary Type *</label>
          <Select value={primaryType || "none"} onValueChange={(v) => setPrimaryType(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select primary type…" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(grouped).map(([family, types]) => (
                <div key={family}>
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{family}</div>
                  {types.map(t => (
                    <SelectItem key={t.name} value={t.name}>
                      <span className="capitalize">{t.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({t.element})</span>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Secondary Type</label>
          <Select value={secondaryType || "none"} onValueChange={(v) => setSecondaryType(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Optional…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {Object.entries(grouped).map(([family, types]) => (
                <div key={family}>
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{family}</div>
                  {types.map(t => (
                    <SelectItem key={t.name} value={t.name} disabled={t.name === primaryType}>
                      <span className="capitalize">{t.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({t.element})</span>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Profiling Notes</label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Key observations from the profiling session…"
          rows={3}
        />
      </div>

      <Button onClick={handleSave} disabled={!primaryType || saving} className="w-full">
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : saved ? (
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        {existingProfileId ? "Update Creator Type" : "Assign Creator Type"}
      </Button>
    </div>
  );
}
