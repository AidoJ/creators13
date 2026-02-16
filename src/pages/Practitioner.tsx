import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ClientList from "@/components/practitioner/ClientList";
import ClientDetail from "@/components/practitioner/ClientDetail";
import CaseStudyForm from "@/components/practitioner/CaseStudyForm";
import CaseStudyList from "@/components/practitioner/CaseStudyList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowLeft, Users, ClipboardList, Copy, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function PractitionerDashboard() {
  const { user, signOut } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [showCaseStudy, setShowCaseStudy] = useState(false);
  const [practitionerCode, setPractitionerCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("practitioner_code")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.practitioner_code) setPractitionerCode(data.practitioner_code);
      });
  }, [user]);

  function handleSelectClient(clientId: string) {
    setSelectedClientId(clientId);
    setShowCaseStudy(false);
  }

  function handleCopyCode() {
    if (practitionerCode) {
      navigator.clipboard.writeText(practitionerCode);
      setCodeCopied(true);
      toast({ title: "Copied!", description: "Practitioner code copied to clipboard." });
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader email={user?.email} onSignOut={signOut} />

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-display font-bold text-foreground">Practitioner Dashboard</h1>

          {/* Practitioner code display */}
          {practitionerCode && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
              <span className="text-xs text-muted-foreground">Your Referral Code:</span>
              <span className="font-mono font-bold text-primary text-sm tracking-wider">{practitionerCode}</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopyCode}>
                {codeCopied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="clients">
          <TabsList>
            <TabsTrigger value="clients"><Users className="h-3.5 w-3.5 mr-1" />Clients</TabsTrigger>
            <TabsTrigger value="cases"><ClipboardList className="h-3.5 w-3.5 mr-1" />My Case Studies</TabsTrigger>
          </TabsList>

          {/* ======= CLIENTS TAB ======= */}
          <TabsContent value="clients" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ClientList onSelectClient={handleSelectClient} selectedClientId={selectedClientId} />
              </div>
              <div className="lg:col-span-2 space-y-4">
                {selectedClientId ? (
                  <>
                    {!showCaseStudy ? (
                      <>
                        <ClientDetail clientId={selectedClientId} onClientNameLoaded={setSelectedClientName} />
                        <Button variant="outline" onClick={() => setShowCaseStudy(true)} className="w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          Create Case Study for {selectedClientName || "this client"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setShowCaseStudy(false)} className="text-xs">
                          <ArrowLeft className="h-3 w-3 mr-1" /> Back to Client Detail
                        </Button>
                        <CaseStudyForm clientId={selectedClientId} clientName={selectedClientName} onSaved={() => setShowCaseStudy(false)} />
                      </>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Users className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                      <p className="text-muted-foreground">Select a client from the list to view their profiling details and create assessments.</p>
                      {practitionerCode && (
                        <p className="text-xs text-muted-foreground">
                          Share your referral code <span className="font-mono font-bold text-primary">{practitionerCode}</span> with new clients to have them automatically linked to you.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ======= CASE STUDIES TAB ======= */}
          <TabsContent value="cases" className="mt-4">
            {user && <CaseStudyList practitionerId={user.id} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
