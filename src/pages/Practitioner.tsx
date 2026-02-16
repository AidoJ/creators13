import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ClientList from "@/components/practitioner/ClientList";
import ClientDetail from "@/components/practitioner/ClientDetail";
import CaseStudyForm from "@/components/practitioner/CaseStudyForm";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";

export default function PractitionerDashboard() {
  const { user, signOut } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [showCaseStudy, setShowCaseStudy] = useState(false);

  function handleSelectClient(clientId: string) {
    setSelectedClientId(clientId);
    setShowCaseStudy(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader email={user?.email} onSignOut={signOut} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Practitioner Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client list */}
          <div className="lg:col-span-1">
            <ClientList
              onSelectClient={handleSelectClient}
              selectedClientId={selectedClientId}
            />
          </div>

          {/* Client detail / Case study */}
          <div className="lg:col-span-2 space-y-4">
            {selectedClientId ? (
              <>
                {!showCaseStudy ? (
                  <>
                    <ClientDetail
                      clientId={selectedClientId}
                      onClientNameLoaded={setSelectedClientName}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowCaseStudy(true)}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Create Case Study for {selectedClientName || "this client"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCaseStudy(false)}
                      className="text-xs"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" /> Back to Client Detail
                    </Button>
                    <CaseStudyForm
                      clientId={selectedClientId}
                      clientName={selectedClientName}
                      onSaved={() => setShowCaseStudy(false)}
                    />
                  </>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <p className="text-muted-foreground">Select a client to view their profiling details.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
