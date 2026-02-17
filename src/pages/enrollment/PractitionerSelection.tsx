import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, UserCheck, Search, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import EnrollmentHeader from "@/components/enrollment/EnrollmentHeader";
import type { TierKey } from "@/lib/tiers";

interface PractitionerOption {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  practitioner_code: string | null;
  practitioner_status: string | null;
}

export default function PractitionerSelection() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const tier = (params.get("tier") as TierKey) || "wren";
  const billing = params.get("billing") || "monthly";
  const isUpgrade = params.get("upgrade") === "true";

  const [practitioners, setPractitioners] = useState<PractitionerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPractitionerId, setCurrentPractitionerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Wren allows in_progress practitioners; paid tiers require certified only
  const allowInProgress = tier === "wren";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const returnTo = encodeURIComponent(`/enroll/practitioner?tier=${tier}&billing=${billing}${isUpgrade ? "&upgrade=true" : ""}`);
      navigate(`/auth?returnTo=${returnTo}`, { replace: true });
      return;
    }

    async function fetchData() {
      setLoading(true);

      // Fetch current assignment
      const { data: assignment } = await supabase
        .from("client_practitioner")
        .select("practitioner_id")
        .eq("client_id", user!.id)
        .eq("active", true)
        .maybeSingle();

      if (assignment?.practitioner_id) {
        setCurrentPractitionerId(assignment.practitioner_id);
        setSelectedId(assignment.practitioner_id);
      }

      // Fetch practitioners with appropriate status
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, practitioner_code, practitioner_status");

      if (!profiles) { setLoading(false); return; }

      // Get users with practitioner/trainee roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const practitionerUserIds = new Set(
        (roles || [])
          .filter(r => r.role === "practitioner" || r.role === "trainee")
          .map(r => r.user_id)
      );

      const eligible = profiles.filter(p => {
        if (!practitionerUserIds.has(p.user_id)) return false;
        if (p.user_id === user!.id) return false; // Can't select yourself
        const status = p.practitioner_status;
        if (allowInProgress) {
          return status === "certified" || status === "in_progress";
        }
        return status === "certified";
      });

      setPractitioners(eligible);
      setLoading(false);
    }

    fetchData();
  }, [user, authLoading, tier, allowInProgress, navigate, billing, isUpgrade]);

  const handleContinue = async () => {
    if (!selectedId || !user) return;

    setSaving(true);

    // Update or create assignment
    if (currentPractitionerId && currentPractitionerId !== selectedId) {
      // Deactivate old assignment
      await supabase
        .from("client_practitioner")
        .update({ active: false })
        .eq("client_id", user.id)
        .eq("practitioner_id", currentPractitionerId);
    }

    if (currentPractitionerId !== selectedId) {
      // Create new assignment
      const { error } = await supabase
        .from("client_practitioner")
        .insert({ client_id: user.id, practitioner_id: selectedId });

      if (error) {
        toast({ title: "Failed to assign practitioner", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    setSaving(false);

    const nextParams = new URLSearchParams({ tier, billing });

    // If upgrading, skip details/photos → go to booking
    if (isUpgrade) {
      navigate(`/enroll/booking?${nextParams.toString()}`);
    } else {
      navigate(`/enroll/details?${nextParams.toString()}`);
    }
  };

  const filtered = practitioners.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
    return name.includes(q) || (p.practitioner_code || "").toLowerCase().includes(q);
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={3} />

      <main className="container mx-auto px-4 py-10 max-w-lg">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UserCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {isUpgrade ? "Confirm Your Practitioner" : "Select Your Practitioner"}
          </h1>
          <p className="text-muted-foreground">
            {allowInProgress
              ? "Choose a practitioner to guide your profiling journey."
              : "Choose a certified practitioner for your profiling session."}
          </p>
        </div>

        {currentPractitionerId && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4 text-center">
            <p className="text-xs text-primary font-medium">
              Your current practitioner is pre-selected. You can change if needed.
            </p>
          </div>
        )}

        {practitioners.length > 5 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
            <p className="text-sm">
              {allowInProgress
                ? "No practitioners available at this time."
                : "No certified practitioners available. Please contact support."}
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-8">
            {filtered.map(p => {
              const isSelected = selectedId === p.user_id;
              const isCurrent = currentPractitionerId === p.user_id;
              const name = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown";

              return (
                <button
                  key={p.user_id}
                  onClick={() => setSelectedId(p.user_id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30 shadow-md"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{name}</span>
                      {isCurrent && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.practitioner_code && (
                        <span className="text-xs text-muted-foreground font-mono">{p.practitioner_code}</span>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] capitalize",
                          p.practitioner_status === "certified"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                        )}
                      >
                        {(p.practitioner_status || "unknown").replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedId || saving}
            size="lg"
            className="rounded-full px-10 text-base font-semibold"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
