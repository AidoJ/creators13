import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Flame, Droplets, Wind, Mountain as MountainIcon, Zap } from "lucide-react";

interface CreatorType {
  name: string;
  family: string;
  element: string;
  color_hex: string | null;
  energy_pattern: string | null;
  creative_power: string | null;
  natural_power: string | null;
  disaster_state: string | null;
  team_role: string | null;
}

const FAMILIES = ["Catalysts", "Sustainers", "Navigators"] as const;

const familyMeta: Record<string, { description: string; icon: typeof Flame; color: string }> = {
  Catalysts: { description: "Fire-driven forces that ignite and transform", icon: Flame, color: "text-red-500" },
  Sustainers: { description: "Grounding forces that build and maintain", icon: MountainIcon, color: "text-amber-600" },
  Navigators: { description: "Flowing forces that adapt and explore", icon: Droplets, color: "text-blue-500" },
};

export default function ReferenceChartsPanel() {
  const [types, setTypes] = useState<CreatorType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("creator_types")
      .select("name, family, element, color_hex, energy_pattern, creative_power, natural_power, disaster_state, team_role")
      .order("sort_order")
      .then(({ data }) => {
        setTypes(data || []);
        setLoading(false);
      });
  }, []);

  const byFamily = (family: string) => types.filter(t => t.family === family);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Reference Charts
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">Practitioner Reference Charts</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading…</div>
        ) : (
          <Tabs defaultValue="summary" className="mt-4">
            <TabsList className="grid grid-cols-5 w-full h-auto">
              <TabsTrigger value="summary" className="text-[10px] px-1">Summary</TabsTrigger>
              <TabsTrigger value="families" className="text-[10px] px-1">Families</TabsTrigger>
              <TabsTrigger value="energies" className="text-[10px] px-1">Energies</TabsTrigger>
              <TabsTrigger value="shapes" className="text-[10px] px-1">Shapes</TabsTrigger>
              <TabsTrigger value="roles" className="text-[10px] px-1">Roles</TabsTrigger>
            </TabsList>

            {/* ========= CHEAT SHEET: 13 Creators Summary ========= */}
            <TabsContent value="summary" className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground mb-3">Quick reference for all 13 Creator Types — key attributes at a glance.</p>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="text-left px-3 py-2 font-semibold text-foreground">Type</th>
                      <th className="text-left px-3 py-2 font-semibold text-foreground">Element</th>
                      <th className="text-left px-3 py-2 font-semibold text-foreground">Family</th>
                      <th className="text-left px-3 py-2 font-semibold text-foreground">Team Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {types.map(t => (
                      <tr key={t.name} className="border-b border-border last:border-0 hover:bg-accent/30">
                        <td className="px-3 py-2 font-medium flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: t.color_hex || "#888" }} />
                          {t.name}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{t.element}</td>
                        <td className="px-3 py-2"><Badge variant="outline" className="text-[9px]">{t.family}</Badge></td>
                        <td className="px-3 py-2 text-muted-foreground">{t.team_role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ========= CHART: Creator Families ========= */}
            <TabsContent value="families" className="mt-4 space-y-4">
              <p className="text-xs text-muted-foreground mb-2">The 13 Creators are organised into 3 families based on their elemental nature.</p>
              {FAMILIES.map(family => {
                const meta = familyMeta[family];
                const FamilyIcon = meta.icon;
                const members = byFamily(family);
                return (
                  <div key={family} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FamilyIcon className={`h-5 w-5 ${meta.color}`} />
                      <h4 className="font-display font-bold text-foreground">{family}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{meta.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {members.map(m => (
                        <div key={m.name} className="flex items-center gap-2 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.color_hex || "#888" }} />
                          <span className="font-medium text-foreground">{m.name}</span>
                          <span className="text-[10px] text-muted-foreground">({m.element})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {/* ========= CHART: Concentration of Energies ========= */}
            <TabsContent value="energies" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground mb-2">How each Creator Type concentrates and expresses their energy pattern.</p>
              {types.map(t => (
                <div key={t.name} className="rounded-lg border border-border p-3 flex items-start gap-3">
                  <span className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: t.color_hex || "#888" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-foreground">{t.name}</span>
                      <span className="text-[10px] text-muted-foreground">{t.element}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5"><strong>Energy:</strong> {t.energy_pattern}</p>
                    <p className="text-xs text-muted-foreground"><strong>Natural Power:</strong> {t.natural_power}</p>
                    <p className="text-xs text-muted-foreground"><strong>Creative Power:</strong> {t.creative_power}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* ========= CHART: Creator Shapes (Disaster States) ========= */}
            <TabsContent value="shapes" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground mb-2">Every Creator Type has a natural expression and a disaster state — the shadow side when energy is blocked or overextended.</p>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="text-left px-3 py-2 font-semibold text-foreground">Type</th>
                      <th className="text-left px-3 py-2 font-semibold text-foreground">Natural Power</th>
                      <th className="text-left px-3 py-2 font-semibold text-foreground">Disaster State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {types.map(t => (
                      <tr key={t.name} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-medium flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: t.color_hex || "#888" }} />
                          {t.name}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{t.natural_power}</td>
                        <td className="px-3 py-2 text-destructive font-medium">{t.disaster_state}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ========= CHART: Bodies, Families & Roles ========= */}
            <TabsContent value="roles" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground mb-2">How each Creator Type functions within a team and their contribution style.</p>
              {FAMILIES.map(family => {
                const members = byFamily(family);
                return (
                  <div key={family} className="rounded-xl border border-border overflow-hidden">
                    <div className="bg-muted/30 px-3 py-2 border-b border-border">
                      <h4 className="text-sm font-bold text-foreground">{family}</h4>
                    </div>
                    {members.map(m => (
                      <div key={m.name} className="px-3 py-2.5 border-b border-border last:border-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.color_hex || "#888" }} />
                          <span className="text-sm font-medium text-foreground">{m.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{m.team_role}</Badge>
                      </div>
                    ))}
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
