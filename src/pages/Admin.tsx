import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type EnrollmentStep = Database["public"]["Enums"]["enrollment_step"];

const ALL_ROLES: AppRole[] = ["trainer", "practitioner", "trainee", "client", "community_participant", "gamer"];

interface UserRow {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  enrollment_step: EnrollmentStep | null;
  roles: AppRole[];
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [addingRole, setAddingRole] = useState<{ userId: string; role: AppRole } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email, enrollment_step")
      .order("created_at", { ascending: false });

    if (!profiles) {
      setLoading(false);
      return;
    }

    const userIds = profiles.map(p => p.user_id);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    const roleMap: Record<string, AppRole[]> = {};
    (roles || []).forEach(r => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    setUsers(
      profiles.map(p => ({
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        enrollment_step: p.enrollment_step,
        roles: roleMap[p.user_id] || [],
      }))
    );
    setLoading(false);
  }

  async function handleAddRole(userId: string, role: AppRole) {
    setAddingRole({ userId, role });
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role added", description: `Added ${role} role successfully.` });
      await fetchUsers();
    }
    setAddingRole(null);
  }

  async function handleRemoveRole(userId: string, role: AppRole) {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role removed", description: `Removed ${role} role.` });
      await fetchUsers();
    }
  }

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    return name.includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const stepLabel = (step: string | null) =>
    step ? step.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "—";

  // Stats
  const totalUsers = users.length;
  const completeCount = users.filter(u => u.enrollment_step === "complete").length;
  const practitionerCount = users.filter(u => u.roles.includes("practitioner")).length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader email={user?.email} onSignOut={signOut} />

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Admin Panel</h1>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Users", value: totalUsers, icon: Users },
            { label: "Completed", value: completeCount, icon: Shield },
            { label: "Practitioners", value: practitionerCount, icon: Shield },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <stat.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* User table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Enrollment</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Roles</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
                ) : (
                  filtered.map(u => (
                    <UserTableRow
                      key={u.user_id}
                      user={u}
                      isExpanded={expandedUser === u.user_id}
                      onToggle={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}
                      onAddRole={handleAddRole}
                      onRemoveRole={handleRemoveRole}
                      addingRole={addingRole}
                      stepLabel={stepLabel}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function UserTableRow({
  user: u,
  isExpanded,
  onToggle,
  onAddRole,
  onRemoveRole,
  addingRole,
  stepLabel,
}: {
  user: UserRow;
  isExpanded: boolean;
  onToggle: () => void;
  onAddRole: (userId: string, role: AppRole) => void;
  onRemoveRole: (userId: string, role: AppRole) => void;
  addingRole: { userId: string; role: AppRole } | null;
  stepLabel: (s: string | null) => string;
}) {
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const availableRoles = ALL_ROLES.filter(r => !u.roles.includes(r));

  return (
    <>
      <tr className="border-b border-border hover:bg-accent/30 transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3 font-medium text-foreground">
          {u.first_name || "—"} {u.last_name || ""}
        </td>
        <td className="px-4 py-3 text-muted-foreground">{u.email || "—"}</td>
        <td className="px-4 py-3">
          <Badge variant="outline" className="text-[10px] capitalize">{stepLabel(u.enrollment_step)}</Badge>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {u.roles.length > 0 ? u.roles.map(r => (
              <Badge key={r} variant="secondary" className="text-[10px] capitalize">{r.replace("_", " ")}</Badge>
            )) : (
              <span className="text-xs text-muted-foreground">No roles</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-muted/10">
          <td colSpan={5} className="px-4 py-4">
            <div className="space-y-3">
              <p className="text-xs font-medium text-foreground">Manage Roles</p>
              <div className="flex flex-wrap gap-2">
                {u.roles.map(role => (
                  <Button
                    key={role}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 capitalize"
                    onClick={(e) => { e.stopPropagation(); onRemoveRole(u.user_id, role); }}
                  >
                    ✕ {role.replace("_", " ")}
                  </Button>
                ))}
              </div>
              {availableRoles.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                    <SelectTrigger className="w-48 h-8 text-xs">
                      <SelectValue placeholder="Add role…" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(r => (
                        <SelectItem key={r} value={r} className="capitalize text-xs">
                          {r.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    disabled={!selectedRole || (addingRole?.userId === u.user_id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedRole) {
                        onAddRole(u.user_id, selectedRole as AppRole);
                        setSelectedRole("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
