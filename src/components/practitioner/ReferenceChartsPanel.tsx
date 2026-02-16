import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const CHARTS = [
  {
    id: "summary",
    label: "Summary",
    title: "Cheat Sheet ~ 13 Creators Summary",
    file: "/charts/cheat-sheet-summary.pdf",
  },
  {
    id: "families",
    label: "Families",
    title: "Chart ~ Creator Families",
    file: "/charts/creator-families.pdf",
  },
  {
    id: "energies",
    label: "Energies",
    title: "Chart ~ Concentration of Energies",
    file: "/charts/concentration-of-energies.pdf",
  },
  {
    id: "shapes",
    label: "Shapes",
    title: "Chart ~ Creator Shapes",
    file: "/charts/creator-shapes.pdf",
  },
  {
    id: "roles",
    label: "Roles",
    title: "Chart ~ Bodies Families Roles",
    file: "/charts/bodies-families-roles.pdf",
  },
];

export default function ReferenceChartsPanel() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Reference Charts
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="font-display text-xl">Practitioner Reference Charts</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="summary" className="mt-4">
          <TabsList className="grid grid-cols-5 w-full h-auto mx-6" style={{ width: "calc(100% - 3rem)" }}>
            {CHARTS.map((c) => (
              <TabsTrigger key={c.id} value={c.id} className="text-[10px] px-1">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CHARTS.map((chart) => (
            <TabsContent key={chart.id} value={chart.id} className="mt-2 px-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">{chart.title}</h3>
              <iframe
                src={chart.file}
                title={chart.title}
                className="w-full rounded-lg border border-border bg-muted/20"
                style={{ height: "calc(100vh - 200px)" }}
              />
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
