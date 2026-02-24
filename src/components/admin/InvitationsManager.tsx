import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Trash2, Search, Mail, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Invitation {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  practitioner_id: string;
  practitioner_name: string;
  created_at: string;
}

export default function InvitationsManager() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInvitations();
  }, []);

  async function fetchInvitations() {
    setLoading(true);
    const { data } = await supabase
      .from("client_invitations")
      .select("id, name, email, phone, status, practitioner_id, created_at")
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    const pracIds = [...new Set(data.map(d => d.practitioner_id))];
    const { data: profiles } = pracIds.length > 0
      ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", pracIds)
      : { data: [] };

    const nameMap: Record<string, string> = {};
    (profiles || []).forEach(p => {
      nameMap[p.user_id] = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown";
    });

    setInvitations(data.map(d => ({
      ...d,
      practitioner_name: nameMap[d.practitioner_id] || "Unknown",
    })));
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const { error } = await supabase.from("client_invitations").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invitation deleted" });
      setInvitations(prev => prev.filter(i => i.id !== id));
    }
    setDeleting(null);
  }

  const filtered = invitations.filter(inv => {
    const q = search.toLowerCase();
    return !q || inv.name.toLowerCase().includes(q) || inv.email.toLowerCase().includes(q) || inv.practitioner_name.toLowerCase().includes(q);
  });

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">Loading invitations…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          Client Invitations
          <span className="text-muted-foreground font-normal">({invitations.length})</span>
        </h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          {search ? "No invitations match your search." : "No invitations found."}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map(inv => (
              <div key={inv.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{inv.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {inv.email} {inv.phone ? `• ${inv.phone}` : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    By: {inv.practitioner_name} · {new Date(inv.created_at).toLocaleDateString("en-AU")}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">
                  {inv.status}
                </Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={deleting === inv.id}
                    >
                      {deleting === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete invitation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the invitation for <strong>{inv.name}</strong> ({inv.email}). This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(inv.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
