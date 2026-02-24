import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Video, Clock, Repeat, Send, Trash2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TrainingCall {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  zoom_link: string | null;
  recurrence_rule: string;
  recurrence_end_date: string | null;
  cancelled: boolean;
  created_at: string;
}

export default function TrainingCallManager() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<TrainingCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [zoomLink, setZoomLink] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("training_calls")
      .select("*")
      .order("scheduled_at", { ascending: true });
    setCalls((data as TrainingCall[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  function resetForm() {
    setTitle(""); setDescription(""); setDate(""); setTime("");
    setDuration("60"); setZoomLink(""); setRecurrence("none"); setRecurrenceEnd("");
    setShowForm(false);
  }

  async function handleCreate() {
    if (!title.trim() || !date || !time || !user) return;
    setSubmitting(true);

    const scheduledAt = new Date(`${date}T${time}`).toISOString();

    // Create the call (and recurring instances if applicable)
    const callsToCreate: Array<{ title: string; description: string | null; scheduled_at: string; duration_minutes: number; zoom_link: string | null; recurrence_rule: string; recurrence_end_date?: string | null; created_by: string }> = [];
    
    if (recurrence === "none") {
      callsToCreate.push({
        title: title.trim(),
        description: description.trim() || null,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(duration),
        zoom_link: zoomLink.trim() || null,
        recurrence_rule: "none",
        created_by: user.id,
      });
    } else {
      // Create parent + recurring instances
      const intervals: Record<string, number> = { weekly: 7, fortnightly: 14, monthly: 30 };
      const intervalDays = intervals[recurrence] || 7;
      const endDate = recurrenceEnd ? new Date(recurrenceEnd) : new Date(Date.now() + 90 * 86400000); // default 3 months
      const startDate = new Date(`${date}T${time}`);
      
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        callsToCreate.push({
          title: title.trim(),
          description: description.trim() || null,
          scheduled_at: currentDate.toISOString(),
          duration_minutes: parseInt(duration),
          zoom_link: zoomLink.trim() || null,
          recurrence_rule: recurrence,
          recurrence_end_date: recurrenceEnd || null,
          created_by: user.id,
        });
        if (recurrence === "monthly") {
          currentDate = new Date(currentDate);
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          currentDate = new Date(currentDate.getTime() + intervalDays * 86400000);
        }
      }
    }

    const { error } = await supabase.from("training_calls").insert(callsToCreate);

    if (error) {
      toast({ title: "Error creating call", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Training call${callsToCreate.length > 1 ? "s" : ""} created`, description: `${callsToCreate.length} session${callsToCreate.length > 1 ? "s" : ""} scheduled.` });
      resetForm();
      await fetchCalls();

      // Send email invites for the first call
      sendInvites(callsToCreate[0]);
    }
    setSubmitting(false);
  }

  async function sendInvites(call: Record<string, any>) {
    setSending(call.id || "new");
    try {
      const { data, error } = await supabase.functions.invoke("send-training-invite", {
        body: {
          callId: call.id || "",
          title: call.title,
          description: call.description,
          scheduledAt: call.scheduled_at,
          durationMinutes: call.duration_minutes,
          zoomLink: call.zoom_link,
          recurrenceRule: call.recurrence_rule,
        },
      });
      if (error) throw error;
      toast({ title: "Invites sent!", description: `${data?.sent || 0} email${(data?.sent || 0) !== 1 ? "s" : ""} sent to practitioners.` });
    } catch (err: any) {
      toast({ title: "Error sending invites", description: err.message, variant: "destructive" });
    }
    setSending(null);
  }

  async function handleCancel(id: string) {
    const { error } = await supabase.from("training_calls").update({ cancelled: true }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Call cancelled" });
      fetchCalls();
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("training_calls").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Call deleted" });
      fetchCalls();
    }
  }

  const upcomingCalls = calls.filter(c => !c.cancelled && new Date(c.scheduled_at) >= new Date());
  const pastCalls = calls.filter(c => !c.cancelled && new Date(c.scheduled_at) < new Date());
  const cancelledCalls = calls.filter(c => c.cancelled);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Training Calls
        </h2>
        <Button size="sm" onClick={() => setShowForm(true)} className="rounded-full">
          <Plus className="h-3.5 w-3.5 mr-1" /> Schedule Call
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">New Training Call</h3>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly Training Session" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional agenda or notes…" rows={2} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date *</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Time *</label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Zoom Link</label>
              <Input value={zoomLink} onChange={e => setZoomLink(e.target.value)} placeholder="https://zoom.us/j/..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Recurrence</label>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">One-off</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="fortnightly">Fortnightly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {recurrence !== "none" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Repeat until</label>
                <Input type="date" value={recurrenceEnd} onChange={e => setRecurrenceEnd(e.target.value)} />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleCreate} disabled={!title.trim() || !date || !time || submitting} className="rounded-full">
              <Send className="h-3.5 w-3.5 mr-1" /> {submitting ? "Creating…" : "Create & Send Invites"}
            </Button>
            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Upcoming calls */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading calls…</div>
      ) : upcomingCalls.length === 0 && pastCalls.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
          No training calls scheduled yet. Click "Schedule Call" to create one.
        </div>
      ) : (
        <>
          {upcomingCalls.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</h3>
              {upcomingCalls.map(call => (
                <CallCard key={call.id} call={call} onCancel={handleCancel} onDelete={handleDelete} onResend={(c) => sendInvites(c)} sending={sending === call.id} />
              ))}
            </div>
          )}
          {pastCalls.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past</h3>
              {pastCalls.slice(0, 10).map(call => (
                <CallCard key={call.id} call={call} onCancel={handleCancel} onDelete={handleDelete} onResend={(c) => sendInvites(c)} sending={sending === call.id} past />
              ))}
            </div>
          )}
          {cancelledCalls.length > 0 && (
            <details className="mt-4">
              <summary className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer">Cancelled ({cancelledCalls.length})</summary>
              <div className="space-y-2 mt-2">
                {cancelledCalls.map(call => (
                  <CallCard key={call.id} call={call} onCancel={handleCancel} onDelete={handleDelete} onResend={(c) => sendInvites(c)} sending={false} cancelled />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function CallCard({ call, onCancel, onDelete, onResend, sending, past, cancelled }: {
  call: TrainingCall;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onResend: (call: TrainingCall) => void;
  sending: boolean;
  past?: boolean;
  cancelled?: boolean;
}) {
  const dt = new Date(call.scheduled_at);
  const dateStr = dt.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const timeStr = dt.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`rounded-xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${cancelled ? "opacity-50 border-border" : past ? "border-border" : "border-primary/20"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-foreground text-sm">{call.title}</h4>
          {call.recurrence_rule !== "none" && (
            <Badge variant="outline" className="text-[10px]">
              <Repeat className="h-2.5 w-2.5 mr-0.5" />
              {call.recurrence_rule}
            </Badge>
          )}
          {cancelled && <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Cancelled</Badge>}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{dateStr}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeStr}</span>
          <span>{call.duration_minutes}min</span>
        </div>
        {call.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{call.description}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {call.zoom_link && (
          <a href={call.zoom_link} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-7 text-xs"><Video className="h-3 w-3 mr-1" />Zoom</Button>
          </a>
        )}
        {!past && !cancelled && (
          <>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onResend(call)} disabled={sending}>
              <Send className="h-3 w-3 mr-1" />{sending ? "Sending…" : "Resend"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-600" onClick={() => onCancel(call.id)}>
              Cancel
            </Button>
          </>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this call?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove this training call.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(call.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
