import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const CHARTS = [
  {
    id: "summary",
    label: "Summary",
    title: "Cheat Sheet ~ 13 Creators Summary",
    image: "/charts/cheat-sheet-summary.jpg",
  },
  {
    id: "families",
    label: "Families",
    title: "Chart ~ Creator Families",
    image: "/charts/creator-families.jpg",
  },
  {
    id: "energies",
    label: "Energies",
    title: "Chart ~ Concentration of Energies",
    image: "/charts/concentration-of-energies.jpg",
  },
  {
    id: "shapes",
    label: "Shapes",
    title: "Chart ~ Creator Shapes",
    image: "/charts/creator-shapes.jpg",
  },
  {
    id: "roles",
    label: "Roles",
    title: "Chart ~ Bodies Families Roles",
    image: "/charts/bodies-families-roles.jpg",
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
            <TabsContent key={chart.id} value={chart.id} className="mt-2 px-6 pb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">{chart.title}</h3>
              <img
                src={chart.image}
                alt={chart.title}
                className={`w-full rounded-lg border border-border ${
                  chart.id === "shapes" || chart.id === "roles" ? "rotate-90 origin-center my-[25%]" : ""
                }`}
              />
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
