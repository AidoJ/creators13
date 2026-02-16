import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ClientList from "@/components/practitioner/ClientList";
import ClientDetail from "@/components/practitioner/ClientDetail";

export default function PractitionerDashboard() {
  const { user, signOut } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader email={user?.email} onSignOut={signOut} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Practitioner Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client list — left column */}
          <div className="lg:col-span-1">
            <ClientList
              onSelectClient={setSelectedClientId}
              selectedClientId={selectedClientId}
            />
          </div>

          {/* Client detail — right column */}
          <div className="lg:col-span-2">
            {selectedClientId ? (
              <ClientDetail clientId={selectedClientId} />
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
