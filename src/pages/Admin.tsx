import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Shield, ChevronDown, ChevronUp, UserPlus, FileText, CheckCircle, XCircle, Clock, Link2, BarChart3, Eye, EyeOff, FolderOpen, GitBranch } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import CreateUserForm from "@/components/admin/CreateUserForm";
import ResourceUploadPanel from "@/components/admin/ResourceUploadPanel";
import CompositePhotoLayout from "@/components/profiling/CompositePhotoLayout";

type AppRole = Database["public"]["Enums"]["app_role"];
type EnrollmentStep = Database["public"]["Enums"]["enrollment_step"];
type CaseStudyStatus = Database["public"]["Enums"]["case_study_status"];

const ALL_ROLES: AppRole[] = ["trainer", "practitioner", "trainee", "client", "community_participant", "gamer"];

interface UserRow {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  enrollment_step: EnrollmentStep | null;
  practitioner_code: string | null;
  practitioner_status: string | null;
  roles: AppRole[];
  tier: string | null;
  sub_status: string | null;
}

interface CaseStudyRow {
  id: string;
  title: string;
  status: CaseStudyStatus;
  practitioner_id: string;
  practitioner_name: string;
  subject_name: string;
  subject_user_id: string | null;
  creator_types_identified: string[] | null;
  description: string | null;
  profiling_notes: string | null;
  reviewer_notes: string | null;
  created_at: string;
}

interface AssignmentRow {
  id: string;
  client_id: string;
  practitioner_id: string;
  client_name: string;
  practitioner_name: string;
  active: boolean;
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudyRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [addingRole, setAddingRole] = useState<{ userId: string; role: AppRole } | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const [expandedCaseStudy, setExpandedCaseStudy] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState<Record<string, string>>({});

  const fetchUsers = useCallback(async () => {
    const [profilesRes, rolesRes, subsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name, email, enrollment_step, practitioner_code, practitioner_status").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("subscriptions").select("user_id, tier, status"),
    ]);

    const profiles = profilesRes.data || [];
    const roles = rolesRes.data || [];
    const subs = subsRes.data || [];

    const roleMap: Record<string, AppRole[]> = {};
    roles.forEach(r => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    const subMap: Record<string, { tier: string; status: string }> = {};
    subs.forEach(s => { subMap[s.user_id] = { tier: s.tier, status: s.status }; });

    setUsers(profiles.map(p => ({
      user_id: p.user_id,
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      enrollment_step: p.enrollment_step,
      practitioner_code: p.practitioner_code,
      practitioner_status: (p as any).practitioner_status || null,
      roles: roleMap[p.user_id] || [],
      tier: subMap[p.user_id]?.tier || null,
      sub_status: subMap[p.user_id]?.status || null,
    })));
  }, []);

  const fetchCaseStudies = useCallback(async () => {
    const { data } = await supabase.from("case_studies")
      .select("id, title, status, practitioner_id, subject_user_id, creator_types_identified, description, profiling_notes, reviewer_notes, created_at")
      .order("created_at", { ascending: false });

    if (!data) return;

    const userIds = [...new Set([...data.map(d => d.practitioner_id), ...data.filter(d => d.subject_user_id).map(d => d.subject_user_id!)])];
    const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
    const nameMap: Record<string, string> = {};
    (profiles || []).forEach(p => { nameMap[p.user_id] = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown"; });

    setCaseStudies(data.map(d => ({
      id: d.id,
      title: d.title,
      status: d.status as CaseStudyStatus,
      practitioner_id: d.practitioner_id,
      practitioner_name: nameMap[d.practitioner_id] || "Unknown",
      subject_name: d.subject_user_id ? (nameMap[d.subject_user_id] || "Unknown") : "—",
      subject_user_id: d.subject_user_id,
      creator_types_identified: d.creator_types_identified,
      description: d.description,
      profiling_notes: d.profiling_notes,
      reviewer_notes: (d as any).reviewer_notes || null,
      created_at: d.created_at,
    })));
  }, []);

  const fetchAssignments = useCallback(async () => {
    const { data } = await supabase.from("client_practitioner").select("id, client_id, practitioner_id, active");
    if (!data) return;

    const userIds = [...new Set([...data.map(d => d.client_id), ...data.map(d => d.practitioner_id)])];
    const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
    const nameMap: Record<string, string> = {};
    (profiles || []).forEach(p => { nameMap[p.user_id] = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown"; });

    setAssignments(data.map(d => ({
      id: d.id,
      client_id: d.client_id,
      practitioner_id: d.practitioner_id,
      client_name: nameMap[d.client_id] || "Unknown",
      practitioner_name: nameMap[d.practitioner_id] || "Unknown",
      active: d.active ?? true,
    })));
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchCaseStudies(), fetchAssignments()]);
      setLoading(false);
    }
    init();
  }, [fetchUsers, fetchCaseStudies, fetchAssignments]);

  async function handleAddRole(userId: string, role: AppRole) {
    setAddingRole({ userId, role });
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role added", description: `Added ${role} role.` });
      await fetchUsers();
    }
    setAddingRole(null);
  }

  async function handleRemoveRole(userId: string, role: AppRole) {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role removed" });
      await fetchUsers();
    }
  }

  async function handleCaseStudyAction(id: string, action: "approved" | "revision_requested", notes?: string) {
    const updateData: Record<string, any> = {
      status: action,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    };
    if (action === "revision_requested" && notes) {
      updateData.reviewer_notes = notes;
    }
    const { error } = await supabase.from("case_studies").update(updateData).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: action === "approved" ? "Case study approved" : "Revision requested with notes" });
      setRevisionNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
      await fetchCaseStudies();
    }
  }

  async function handlePractitionerStatus(userId: string, status: string) {
    const { error } = await supabase.from("profiles").update({ practitioner_status: status as Database["public"]["Enums"]["practitioner_status"] }).eq("user_id", userId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated", description: `Set to ${status.replace(/_/g, " ")}` });
      await fetchUsers();
    }
  }

  // Assign client to practitioner
  const [assignClient, setAssignClient] = useState("");
  const [assignPrac, setAssignPrac] = useState("");

  async function handleAssign() {
    if (!assignClient || !assignPrac) return;
    const { error } = await supabase.from("client_practitioner").insert({
      client_id: assignClient,
      practitioner_id: assignPrac,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Client assigned" });
      setAssignClient("");
      setAssignPrac("");
      await fetchAssignments();
    }
  }

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    return name.includes(q) || (u.email || "").toLowerCase().includes(q) || (u.practitioner_code || "").toLowerCase().includes(q);
  });

  const stepLabel = (step: string | null) => step ? step.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "—";

  // Pipeline stats
  const totalUsers = users.length;
  const byStep: Record<string, number> = {};
  users.forEach(u => { const s = u.enrollment_step || "none"; byStep[s] = (byStep[s] || 0) + 1; });
  const practitionerCount = users.filter(u => u.roles.includes("practitioner")).length;
  const traineeCount = users.filter(u => u.roles.includes("trainee")).length;
  const pendingCaseStudies = caseStudies.filter(c => c.status === "submitted").length;

  const practitioners = users.filter(u => u.roles.includes("practitioner") || u.roles.includes("trainee") || u.roles.includes("trainer"));
  const clients = users.filter(u => u.roles.includes("client"));

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader email={user?.email} onSignOut={signOut} />

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Admin Panel</h1>

        {/* Pipeline stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Users", value: totalUsers, icon: Users },
            { label: "Practitioners", value: practitionerCount, icon: Shield },
            { label: "Trainees", value: traineeCount, icon: Shield },
            { label: "Pending Reviews", value: pendingCaseStudies, icon: FileText },
            { label: "Completed Enrollment", value: byStep["complete"] || 0, icon: CheckCircle },
            { label: "In Progress", value: totalUsers - (byStep["complete"] || 0), icon: Clock },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Enrollment pipeline visual */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Enrollment Pipeline</h3>
          </div>
          <div className="grid grid-cols-6 gap-2 text-center">
            {["plan_selected", "signed_up", "payment_complete", "photos_uploaded", "booking_made", "complete"].map(step => (
              <div key={step} className="space-y-1">
                <div className="text-lg font-bold text-foreground">{byStep[step] || 0}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{step.replace(/_/g, " ")}</div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${totalUsers > 0 ? ((byStep[step] || 0) / totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="users"><Users className="h-3.5 w-3.5 mr-1" />Users</TabsTrigger>
            <TabsTrigger value="pipeline"><GitBranch className="h-3.5 w-3.5 mr-1" />Pipeline</TabsTrigger>
            <TabsTrigger value="cases"><FileText className="h-3.5 w-3.5 mr-1" />Case Studies {pendingCaseStudies > 0 && <Badge className="ml-1 h-5 text-[10px]" variant="destructive">{pendingCaseStudies}</Badge>}</TabsTrigger>
            <TabsTrigger value="assignments"><Link2 className="h-3.5 w-3.5 mr-1" />Assignments</TabsTrigger>
            <TabsTrigger value="resources"><FolderOpen className="h-3.5 w-3.5 mr-1" />Resources</TabsTrigger>
          </TabsList>

          {/* ======= USERS TAB ======= */}
          <TabsContent value="users" className="space-y-4">
            <CreateUserForm onCreated={fetchUsers} />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, or practitioner code…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Name</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Email</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Tier</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Enrollment</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Roles</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Prac Code</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
                    ) : filtered.map(u => (
                      <UserTableRow key={u.user_id} user={u} isExpanded={expandedUser === u.user_id}
                        onToggle={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}
                        onAddRole={handleAddRole} onRemoveRole={handleRemoveRole} addingRole={addingRole} stepLabel={stepLabel}
                        onStatusChange={handlePractitionerStatus}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ======= PIPELINE TAB ======= */}
          <TabsContent value="pipeline" className="space-y-4">
            <TrainerCaseStudyPipeline caseStudies={caseStudies} users={users} />
          </TabsContent>

          {/* ======= CASE STUDIES TAB ======= */}
          <TabsContent value="cases" className="space-y-4">
            {caseStudies.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">No case studies yet.</div>
            ) : (
              <div className="space-y-3">
                {caseStudies.map(cs => {
                  const isExpanded = expandedCaseStudy === cs.id;
                  return (
                    <div key={cs.id} className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">{cs.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              By {cs.practitioner_name} · Subject: {cs.subject_name} · {new Date(cs.created_at).toLocaleDateString("en-AU")}
                            </p>
                            {cs.creator_types_identified && cs.creator_types_identified.length > 0 && (
                              <div className="flex gap-1 mt-1.5">
                                {cs.creator_types_identified.map(t => (
                                  <Badge key={t} variant="secondary" className="text-[10px] capitalize">{t}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <CaseStudyStatusBadge status={cs.status} />
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpandedCaseStudy(isExpanded ? null : cs.id)}>
                              {isExpanded ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                              {isExpanded ? "Hide" : "View"}
                            </Button>
                            {cs.status === "submitted" && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => handleCaseStudyAction(cs.id, "approved")}>
                                  <CheckCircle className="h-3 w-3 mr-1" />Approve
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-amber-600" onClick={() => {
                                  setExpandedCaseStudy(cs.id);
                                  setRevisionNotes(prev => ({ ...prev, [cs.id]: prev[cs.id] || "" }));
                                }}>
                                  <XCircle className="h-3 w-3 mr-1" />Revise
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
                          {cs.subject_user_id && (
                            <CompositePhotoLayout
                              userId={cs.subject_user_id}
                              subjectName={`${cs.subject_name}'s Profiling Photos`}
                            />
                          )}
                          {cs.description && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{cs.description}</p>
                            </div>
                          )}
                          {cs.profiling_notes && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Profiling Notes</p>
                              <div className="text-sm text-foreground whitespace-pre-wrap bg-card rounded-lg border border-border p-3 max-h-96 overflow-y-auto">
                                {cs.profiling_notes}
                              </div>
                            </div>
                          )}
                          {(!cs.description && !cs.profiling_notes) && (
                            <p className="text-sm text-muted-foreground italic">No assessment notes have been added yet.</p>
                          )}
                          {cs.reviewer_notes && cs.status !== "submitted" && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Previous Reviewer Notes</p>
                              <div className="text-sm text-foreground whitespace-pre-wrap bg-amber-500/5 rounded-lg border border-amber-500/20 p-3">
                                {cs.reviewer_notes}
                              </div>
                            </div>
                          )}
                          {revisionNotes[cs.id] !== undefined && cs.status === "submitted" && (
                            <div className="border-t border-border pt-4 space-y-2">
                              <p className="text-xs font-semibold text-foreground">Revision Notes for Practitioner</p>
                              <Textarea
                                value={revisionNotes[cs.id]}
                                onChange={e => setRevisionNotes(prev => ({ ...prev, [cs.id]: e.target.value }))}
                                rows={4}
                                placeholder="Explain what needs to be revised, specific areas to focus on, and that they need to submit a new assessment form…"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={!revisionNotes[cs.id]?.trim()}
                                  onClick={() => handleCaseStudyAction(cs.id, "revision_requested", revisionNotes[cs.id])}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />Submit Revision Request
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setRevisionNotes(prev => { const n = { ...prev }; delete n[cs.id]; return n; })}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ======= ASSIGNMENTS TAB ======= */}
          <TabsContent value="assignments" className="space-y-4">
            {/* New assignment form */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" /> Assign Client to Practitioner
              </h3>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-muted-foreground">Client</label>
                  <Select value={assignClient} onValueChange={setAssignClient}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select client…" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.user_id} value={c.user_id} className="text-sm">
                          {c.first_name || "—"} {c.last_name || ""} ({c.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-muted-foreground">Practitioner</label>
                  <Select value={assignPrac} onValueChange={setAssignPrac}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select practitioner…" /></SelectTrigger>
                    <SelectContent>
                      {practitioners.map(p => (
                        <SelectItem key={p.user_id} value={p.user_id} className="text-sm">
                          {p.first_name || "—"} {p.last_name || ""} {p.practitioner_code ? `(${p.practitioner_code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="h-9" onClick={handleAssign} disabled={!assignClient || !assignPrac}>
                  <Link2 className="h-3.5 w-3.5 mr-1" /> Assign
                </Button>
              </div>
            </div>

            {/* Existing assignments */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Client</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Practitioner</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No assignments yet.</td></tr>
                  ) : assignments.map(a => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground">{a.client_name}</td>
                      <td className="px-4 py-3 text-foreground">{a.practitioner_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant={a.active ? "default" : "outline"} className="text-[10px]">
                          {a.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ======= RESOURCES TAB ======= */}
          <TabsContent value="resources" className="space-y-4">
            <ResourceUploadPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function CaseStudyStatusBadge({ status }: { status: CaseStudyStatus }) {
  const map: Record<CaseStudyStatus, { label: string; class: string }> = {
    draft: { label: "Draft", class: "bg-muted/50 text-muted-foreground border-border" },
    submitted: { label: "Pending Review", class: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    approved: { label: "Approved", class: "bg-green-500/10 text-green-600 border-green-500/20" },
    revision_requested: { label: "Revision Needed", class: "bg-red-500/10 text-red-600 border-red-500/20" },
  };
  const s = map[status];
  return <Badge variant="outline" className={`text-[10px] ${s.class}`}>{s.label}</Badge>;
}

function TrainerCaseStudyPipeline({ caseStudies, users }: { caseStudies: CaseStudyRow[]; users: UserRow[] }) {
  const practitioners = users.filter(u => u.roles.includes("practitioner") || u.roles.includes("trainee") || u.roles.includes("trainer"));

  const STAGES = [
    { key: "draft", label: "In Progress", icon: Clock, dotColor: "bg-orange-500", cardColor: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    { key: "submitted", label: "Submitted", icon: FileText, dotColor: "bg-blue-500", cardColor: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    { key: "revision_requested", label: "Needs Revision", icon: XCircle, dotColor: "bg-red-500", cardColor: "bg-red-500/10 text-red-600 border-red-500/20" },
    { key: "approved", label: "Approved", icon: CheckCircle, dotColor: "bg-green-500", cardColor: "bg-green-500/10 text-green-600 border-green-500/20" },
  ] as const;

  const byStatus: Record<string, CaseStudyRow[]> = {};
  caseStudies.forEach(cs => {
    if (!byStatus[cs.status]) byStatus[cs.status] = [];
    byStatus[cs.status].push(cs);
  });

  const total = caseStudies.length;

  // Group by practitioner for overview
  const pracMap: Record<string, { name: string; status: string | null; counts: Record<string, number>; total: number }> = {};
  practitioners.forEach(p => {
    pracMap[p.user_id] = {
      name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown",
      status: p.practitioner_status,
      counts: {},
      total: 0,
    };
  });
  caseStudies.forEach(cs => {
    if (pracMap[cs.practitioner_id]) {
      pracMap[cs.practitioner_id].counts[cs.status] = (pracMap[cs.practitioner_id].counts[cs.status] || 0) + 1;
      pracMap[cs.practitioner_id].total += 1;
    }
  });

  const pracStatusColors: Record<string, string> = {
    in_progress: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    paused: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
    certified: "bg-green-500/10 text-green-600 border-green-500/20",
  };

  return (
    <div className="space-y-4">
      {/* Global pipeline summary */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-display font-bold text-foreground">Global Case Study Pipeline</h2>
          <Badge variant="outline" className="ml-auto text-xs">{total} total</Badge>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          {STAGES.map(stage => {
            const count = byStatus[stage.key]?.length || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            if (pct === 0) return null;
            return <div key={stage.key} className={`${stage.dotColor} h-full`} style={{ width: `${pct}%` }} title={`${stage.label}: ${count}`} />;
          })}
        </div>

        {/* Stage counts */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {STAGES.map(stage => {
            const count = byStatus[stage.key]?.length || 0;
            const StageIcon = stage.icon;
            return (
              <div key={stage.key} className={`rounded-xl border p-3 text-center transition-all ${count > 0 ? stage.cardColor : "bg-muted/20 text-muted-foreground/40 border-border/50"}`}>
                <StageIcon className="h-4 w-4 mx-auto mb-1" />
                <div className="text-xl font-bold">{count}</div>
                <div className="text-[10px] font-medium leading-tight">{stage.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-practitioner breakdown */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Practitioner Progress</h3>
        <div className="space-y-2">
          {Object.entries(pracMap)
            .filter(([, p]) => p.total > 0 || p.status)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([id, p]) => (
              <div key={id} className="flex items-center gap-3 rounded-lg bg-muted/20 border border-border px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    {p.status && (
                      <Badge variant="outline" className={`text-[10px] capitalize ${pracStatusColors[p.status] || ""}`}>
                        {p.status.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    {STAGES.map(stage => {
                      const count = p.counts[stage.key] || 0;
                      if (count === 0) return null;
                      return (
                        <span key={stage.key} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${stage.cardColor}`}>
                          {stage.label}: {count}
                        </span>
                      );
                    })}
                    {p.total === 0 && <span className="text-[10px] text-muted-foreground">No case studies yet</span>}
                  </div>
                </div>
                <span className="text-lg font-bold text-foreground">{p.total}</span>
              </div>
            ))}
          {Object.values(pracMap).every(p => p.total === 0 && !p.status) && (
            <p className="text-sm text-muted-foreground text-center py-4">No practitioners with case studies yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function UserTableRow({ user: u, isExpanded, onToggle, onAddRole, onRemoveRole, addingRole, stepLabel, onStatusChange }: {
  user: UserRow; isExpanded: boolean; onToggle: () => void;
  onAddRole: (userId: string, role: AppRole) => void;
  onRemoveRole: (userId: string, role: AppRole) => void;
  addingRole: { userId: string; role: AppRole } | null;
  stepLabel: (s: string | null) => string;
  onStatusChange: (userId: string, status: string) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const availableRoles = ALL_ROLES.filter(r => !u.roles.includes(r));
  const isPractitioner = u.roles.includes("practitioner") || u.roles.includes("trainee");

  const statusColors: Record<string, string> = {
    in_progress: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    paused: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
    certified: "bg-green-500/10 text-green-600 border-green-500/20",
  };

  return (
    <>
      <tr className="border-b border-border hover:bg-accent/30 transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-2.5 font-medium text-foreground">{u.first_name || "—"} {u.last_name || ""}</td>
        <td className="px-4 py-2.5 text-muted-foreground text-xs">{u.email || "—"}</td>
        <td className="px-4 py-2.5">
          {u.tier ? <Badge variant="secondary" className="text-[10px] capitalize">{u.tier}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
        </td>
        <td className="px-4 py-2.5">
          <Badge variant="outline" className="text-[10px] capitalize">{stepLabel(u.enrollment_step)}</Badge>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex flex-wrap gap-1">
            {u.roles.length > 0 ? u.roles.map(r => {
              const isPracRole = r === "practitioner" || r === "trainee";
              if (isPracRole && u.practitioner_status) {
                const pracBadgeColors: Record<string, string> = {
                  certified: "bg-green-500 text-white border-green-600",
                  in_progress: "bg-orange-500 text-white border-orange-600",
                  cancelled: "bg-red-500 text-white border-red-600",
                  paused: "bg-blue-500 text-white border-blue-600",
                };
                return (
                  <Badge key={r} variant="outline" className={`text-[10px] capitalize ${pracBadgeColors[u.practitioner_status] || ""}`}>
                    {r.replace(/_/g, " ")}
                  </Badge>
                );
              }
              return <Badge key={r} variant="secondary" className="text-[10px] capitalize">{r.replace(/_/g, " ")}</Badge>;
            }) : <span className="text-[10px] text-muted-foreground">No roles</span>}
          </div>
        </td>
        <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{u.practitioner_code || "—"}</td>
        <td className="px-4 py-2.5">
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-muted/10">
          <td colSpan={7} className="px-4 py-4">
            <div className="space-y-3">
              <p className="text-xs font-medium text-foreground">Manage Roles</p>
              <div className="flex flex-wrap gap-2">
                {u.roles.map(role => (
                  <Button key={role} variant="outline" size="sm" className="text-xs h-7 capitalize"
                    onClick={e => { e.stopPropagation(); onRemoveRole(u.user_id, role); }}>
                    ✕ {role.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
              {availableRoles.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select value={selectedRole} onValueChange={v => setSelectedRole(v as AppRole)}>
                    <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Add role…" /></SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(r => (
                        <SelectItem key={r} value={r} className="capitalize text-xs">{r.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8 text-xs" disabled={!selectedRole || addingRole?.userId === u.user_id}
                    onClick={e => { e.stopPropagation(); if (selectedRole) { onAddRole(u.user_id, selectedRole as AppRole); setSelectedRole(""); } }}>
                    Add
                  </Button>
                </div>
              )}

              {/* Practitioner certification status */}
              {isPractitioner && (
                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-xs font-medium text-foreground">Certification Status</p>
                  <div className="flex items-center gap-2">
                    {u.practitioner_status && (
                      <Badge variant="outline" className={`text-[10px] capitalize ${statusColors[u.practitioner_status] || ""}`}>
                        {u.practitioner_status.replace(/_/g, " ")}
                      </Badge>
                    )}
                    <Select
                      value={u.practitioner_status || ""}
                      onValueChange={v => onStatusChange(u.user_id, v)}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue placeholder="Set status…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                        <SelectItem value="paused" className="text-xs">Paused</SelectItem>
                        <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                        <SelectItem value="certified" className="text-xs">Certified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}