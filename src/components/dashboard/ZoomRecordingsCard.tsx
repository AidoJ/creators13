import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Video, ExternalLink, Clock } from "lucide-react";
import { format, isPast, parseISO, differenceInDays } from "date-fns";

interface Recording {
  id: string;
  url: string;
  label: string | null;
  expires_at: string;
  case_study_title: string;
}

export default function ZoomRecordingsCard() {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetch() {
      // Get case studies where this user is the subject
      const { data: caseStudies } = await supabase
        .from("case_studies")
        .select("id, title")
        .eq("subject_user_id", user!.id);

      if (!caseStudies || caseStudies.length === 0) {
        setLoading(false);
        return;
      }

      const csIds = caseStudies.map(cs => cs.id);
      const titleMap: Record<string, string> = {};
      caseStudies.forEach(cs => { titleMap[cs.id] = cs.title; });

      const { data: recs } = await supabase
        .from("zoom_recordings")
        .select("id, url, label, expires_at, case_study_id")
        .in("case_study_id", csIds)
        .order("created_at", { ascending: false });

      const active = (recs || [])
        .filter(r => !isPast(parseISO(r.expires_at)))
        .map(r => ({
          id: r.id,
          url: r.url,
          label: r.label,
          expires_at: r.expires_at,
          case_study_title: titleMap[r.case_study_id] || "Session",
        }));

      setRecordings(active);
      setLoading(false);
    }
    fetch();
  }, [user]);

  if (loading || recordings.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Video className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Session Recordings</h3>
      </div>

      <div className="space-y-2">
        {recordings.map(r => {
          const daysLeft = differenceInDays(parseISO(r.expires_at), new Date());
          const isExpiringSoon = daysLeft <= 3;
          return (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5"
            >
              <ExternalLink className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline truncate block"
                >
                  {r.label || r.case_study_title}
                </a>
              </div>
              <span className={`flex items-center gap-1 text-xs flex-shrink-0 ${isExpiringSoon ? "text-destructive" : "text-muted-foreground"}`}>
                <Clock className="h-3 w-3" />
                {daysLeft <= 0 ? "Expires today" : `${daysLeft}d left`}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3 italic">
        Recording links expire automatically. View them before they're removed.
      </p>
    </div>
  );
}
