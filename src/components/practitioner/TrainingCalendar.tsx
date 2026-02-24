import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Video, Clock, Repeat, Globe, ChevronLeft, ChevronRight } from "lucide-react";

interface TrainingCall {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  zoom_link: string | null;
  recurrence_rule: string;
  cancelled: boolean;
}

const TIMEZONE_OPTIONS = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Hobart",
  "Pacific/Auckland",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
];

interface TrainingCalendarProps {
  compact?: boolean;
}

export default function TrainingCalendar({ compact = false }: TrainingCalendarProps) {
  const { user } = useAuth();
  const [calls, setCalls] = useState<TrainingCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState("Australia/Sydney");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("timezone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.timezone) setTimezone(data.timezone);
      });
  }, [user]);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("training_calls")
      .select("id, title, description, scheduled_at, duration_minutes, zoom_link, recurrence_rule, cancelled")
      .eq("cancelled", false)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true });
    setCalls((data as TrainingCall[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  async function handleTimezoneChange(tz: string) {
    setTimezone(tz);
    if (user) {
      await supabase.from("profiles").update({ timezone: tz }).eq("user_id", user.id);
    }
  }

  function formatInTimezone(isoDate: string) {
    const d = new Date(isoDate);
    return {
      date: d.toLocaleDateString("en-AU", { timeZone: timezone, weekday: "short", day: "numeric", month: "short" }),
      time: d.toLocaleTimeString("en-AU", { timeZone: timezone, hour: "2-digit", minute: "2-digit" }),
      fullDate: d.toLocaleDateString("en-AU", { timeZone: timezone, weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      day: d.toLocaleDateString("en-AU", { timeZone: timezone, day: "numeric" }),
      monthKey: d.toLocaleDateString("en-AU", { timeZone: timezone, year: "numeric", month: "2-digit" }),
    };
  }

  // Group calls by date for calendar view
  const callsByDate: Record<string, TrainingCall[]> = {};
  calls.forEach(call => {
    const { fullDate } = formatInTimezone(call.scheduled_at);
    if (!callsByDate[fullDate]) callsByDate[fullDate] = [];
    callsByDate[fullDate].push(call);
  });

  if (compact) {
    // Dashboard card: show next 3 upcoming calls
    const nextCalls = calls.slice(0, 3);
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-display font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Upcoming Training Calls
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : nextCalls.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming calls scheduled.</p>
        ) : (
          <div className="space-y-2">
            {nextCalls.map(call => {
              const { date, time } = formatInTimezone(call.scheduled_at);
              return (
                <div key={call.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{call.title}</p>
                    <p className="text-xs text-muted-foreground">{date} · {time} · {call.duration_minutes}min</p>
                  </div>
                  {call.zoom_link && (
                    <a href={call.zoom_link} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-6 text-[10px] rounded-full">
                        <Video className="h-2.5 w-2.5 mr-0.5" />Join
                      </Button>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Full calendar view
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Training Calendar
        </h2>
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={timezone} onValueChange={handleTimezoneChange}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONE_OPTIONS.map(tz => (
                <SelectItem key={tz} value={tz} className="text-xs">{tz.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading calendar…</div>
      ) : calls.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No upcoming training calls scheduled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(callsByDate).map(([dateLabel, dateCalls]) => (
            <div key={dateLabel}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{dateLabel}</h3>
              <div className="space-y-2">
                {dateCalls.map(call => {
                  const { time } = formatInTimezone(call.scheduled_at);
                  return (
                    <div key={call.id} className="rounded-xl border border-primary/15 bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground text-sm">{call.title}</h4>
                          {call.recurrence_rule !== "none" && (
                            <Badge variant="outline" className="text-[10px]">
                              <Repeat className="h-2.5 w-2.5 mr-0.5" />
                              {call.recurrence_rule}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{time}</span>
                          <span>{call.duration_minutes} minutes</span>
                        </div>
                        {call.description && (
                          <p className="text-xs text-muted-foreground mt-1">{call.description}</p>
                        )}
                      </div>
                      {call.zoom_link && (
                        <a href={call.zoom_link} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="rounded-full h-8 text-xs">
                            <Video className="h-3 w-3 mr-1" />Join Zoom
                          </Button>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
