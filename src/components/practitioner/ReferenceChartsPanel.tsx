import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink } from "lucide-react";

const CHARTS = [
  {
    id: "summary",
    label: "Summary",
    title: "Cheat Sheet ~ 13 Creators Summary",
    url: "http://sacredbusiness.com.au/wp-content/uploads/2025/06/13CREATORS-Cheat-Sheet-Summary-Table.pdf",
  },
  {
    id: "families",
    label: "Families",
    title: "Chart ~ Creator Families",
    url: "https://sacredbusiness.com.au/wp-content/uploads/2025/11/13CREATORS-Chart-Creator-Families-with-Glyphs.pdf",
  },
  {
    id: "energies",
    label: "Energies",
    title: "Chart ~ Concentration of Energies",
    url: "http://sacredbusiness.com.au/wp-content/uploads/2025/05/13CREATORS-Chart-Concentration-of-Energy.pdf",
  },
  {
    id: "shapes",
    label: "Shapes",
    title: "Chart ~ Creator Shapes",
    url: "http://sacredbusiness.com.au/wp-content/uploads/2025/11/13CREATORS-Chart-Creator-Shapes-Built-For.pdf",
  },
  {
    id: "roles",
    label: "Roles",
    title: "Chart ~ Bodies Families Roles",
    url: "http://sacredbusiness.com.au/wp-content/uploads/2025/05/13CREATORS-Chart-Bodies-Families-Roles.pdf",
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">{chart.title}</h3>
                <a
                  href={chart.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Open in new tab <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <iframe
                src={chart.url}
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
