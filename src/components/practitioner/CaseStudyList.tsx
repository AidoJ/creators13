import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Clock, CheckCircle, AlertCircle, Eye, EyeOff, MessageSquare } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type CaseStudyStatus = Database["public"]["Enums"]["case_study_status"];

interface CaseStudy {
  id: string;
  title: string;
  status: CaseStudyStatus;
  subject_user_id: string | null;
  subject_name: string;
  creator_types_identified: string[] | null;
  description: string | null;
  profiling_notes: string | null;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CaseStudyListProps {
  practitionerId: string;
}

export default function CaseStudyList({ practitionerId }: CaseStudyListProps) {
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("case_studies")
        .select("id, title, status, subject_user_id, creator_types_identified, description, profiling_notes, reviewer_notes, created_at, updated_at")
        .eq("practitioner_id", practitionerId)
        .order("created_at", { ascending: false });

      if (!data) { setLoading(false); return; }

      const subjectIds = data.filter(d => d.subject_user_id).map(d => d.subject_user_id!);
      const { data: profiles } = subjectIds.length > 0
        ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", subjectIds)
        : { data: [] };

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.user_id] = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown"; });

      setStudies(data.map(d => ({
        ...d,
        status: d.status as CaseStudyStatus,
        subject_name: d.subject_user_id ? (nameMap[d.subject_user_id] || "Unknown") : "—",
      })));
      setLoading(false);
    }
    fetch();
  }, [practitionerId]);

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading case studies…</div>;

  if (studies.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No case studies yet. Select a client and create your first assessment.</p>
      </div>
    );
  }

  const statusConfig: Record<CaseStudyStatus, { icon: typeof Clock; label: string; className: string }> = {
    draft: { icon: Clock, label: "Draft", className: "bg-muted/50 text-muted-foreground border-border" },
    submitted: { icon: AlertCircle, label: "Pending Review", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    approved: { icon: CheckCircle, label: "Approved", className: "bg-green-500/10 text-green-600 border-green-500/20" },
    revision_requested: { icon: AlertCircle, label: "Needs Revision", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  };

  return (
    <div className="space-y-3">
      {studies.map(cs => {
        const sc = statusConfig[cs.status];
        const StatusIcon = sc.icon;
        const isExpanded = expandedId === cs.id;
        const hasRevisionNotes = cs.status === "revision_requested" && cs.reviewer_notes;

        return (
          <div key={cs.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground">{cs.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Subject: {cs.subject_name} · Created {new Date(cs.created_at).toLocaleDateString("en-AU")}
                  </p>
                  {cs.creator_types_identified && cs.creator_types_identified.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      <Sparkles className="h-3 w-3 text-secondary mt-0.5" />
                      {cs.creator_types_identified.map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px] capitalize">{t}</Badge>
                      ))}
                    </div>
                  )}
                  {hasRevisionNotes && !isExpanded && (
                    <div className="flex items-center gap-1.5 mt-2 text-destructive">
                      <MessageSquare className="h-3 w-3" />
                      <span className="text-xs font-medium">Trainer feedback available — view to read notes</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className={`text-[10px] ${sc.className}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpandedId(isExpanded ? null : cs.id)}>
                    {isExpanded ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                    {isExpanded ? "Hide" : "View"}
                  </Button>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-border bg-muted/20 p-4 space-y-4">
                {hasRevisionNotes && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Trainer Revision Notes
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{cs.reviewer_notes}</p>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Please review the feedback above and submit a new assessment form addressing the noted areas.
                    </p>
                  </div>
                )}
                {cs.description && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{cs.description}</p>
                  </div>
                )}
                {cs.profiling_notes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Your Profiling Notes</p>
                    <div className="text-sm text-foreground whitespace-pre-wrap bg-card rounded-lg border border-border p-3 max-h-96 overflow-y-auto">
                      {cs.profiling_notes}
                    </div>
                  </div>
                )}
                {(!cs.description && !cs.profiling_notes && !hasRevisionNotes) && (
                  <p className="text-sm text-muted-foreground italic">No assessment notes recorded.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
