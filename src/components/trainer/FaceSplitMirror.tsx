import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, RotateCcw, Scissors, Download, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Point { x: number; y: number }

export default function FaceSplitMirror() {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [topPoint, setTopPoint] = useState<Point | null>(null);
  const [bottomPoint, setBottomPoint] = useState<Point | null>(null);
  const [placingPoint, setPlacingPoint] = useState<"top" | "bottom" | "done">("top");
  const [results, setResults] = useState<{ left: string; right: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const handleFile = useCallback((file: File) => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setTopPoint(null);
      setBottomPoint(null);
      setPlacingPoint("top");
      setResults(null);
    };
    img.src = URL.createObjectURL(file);
  }, []);

  // Compute canvas dimensions
  const getScaledSize = useCallback(() => {
    if (!image) return { w: 0, h: 0, scale: 1 };
    const maxW = Math.min(600, window.innerWidth - 64);
    const scale = maxW / image.width;
    return { w: Math.round(image.width * scale), h: Math.round(image.height * scale), scale };
  }, [image]);

  // Draw image + split line
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const { w, h } = getScaledSize();
    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;
    setCanvasSize({ w, h });

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0, w, h);

    // Draw points and line
    const drawDot = (p: Point, color: string, label: string) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(label, p.x, p.y - 12);
    };

    if (topPoint) drawDot(topPoint, "#ef4444", "Top");
    if (bottomPoint) drawDot(bottomPoint, "#3b82f6", "Bottom");

    if (topPoint && bottomPoint) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(topPoint.x, topPoint.y);
      ctx.lineTo(bottomPoint.x, bottomPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Instructions
    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = "rgba(239,68,68,0.9)";
    ctx.textAlign = "center";
    if (placingPoint === "top") {
      ctx.fillText("Click to place TOP point", w / 2, 20);
    } else if (placingPoint === "bottom") {
      ctx.fillText("Click to place BOTTOM point", w / 2, h - 8);
    }
  }, [image, topPoint, bottomPoint, placingPoint, getScaledSize]);

  const getCanvasPos = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(((e.clientX - rect.left) / rect.width) * canvas.width),
      y: Math.round(((e.clientY - rect.top) / rect.height) * canvas.height),
    };
  };

  const handleClick = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    if (placingPoint === "top") {
      setTopPoint(pos);
      setPlacingPoint("bottom");
      setResults(null);
    } else if (placingPoint === "bottom") {
      setBottomPoint(pos);
      setPlacingPoint("done");
      setResults(null);
    } else {
      // Re-place: cycle back to top
      setTopPoint(pos);
      setBottomPoint(null);
      setPlacingPoint("bottom");
      setResults(null);
    }
  };

  const generateSplit = useCallback(() => {
    if (!image || !topPoint || !bottomPoint) return;
    const { w, h } = getScaledSize();

    // For each scanline y, compute the x position of the split line
    const getLineX = (y: number): number => {
      if (bottomPoint.y === topPoint.y) return topPoint.x;
      const t = (y - topPoint.y) / (bottomPoint.y - topPoint.y);
      return topPoint.x + t * (bottomPoint.x - topPoint.x);
    };

    // Source canvas
    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = w;
    srcCanvas.height = h;
    const srcCtx = srcCanvas.getContext("2d")!;
    srcCtx.drawImage(image, 0, 0, w, h);
    const srcData = srcCtx.getImageData(0, 0, w, h);

    // Left-mirrored: left half + mirror of left half
    const leftCanvas = document.createElement("canvas");
    leftCanvas.width = w;
    leftCanvas.height = h;
    const leftCtx = leftCanvas.getContext("2d")!;
    const leftImgData = leftCtx.createImageData(w, h);

    // Right-mirrored: right half + mirror of right half
    const rightCanvas = document.createElement("canvas");
    rightCanvas.width = w;
    rightCanvas.height = h;
    const rightCtx = rightCanvas.getContext("2d")!;
    const rightImgData = rightCtx.createImageData(w, h);

    for (let y = 0; y < h; y++) {
      const lineX = Math.round(getLineX(y));

      for (let x = 0; x < w; x++) {
        const srcIdx = (y * w + x) * 4;

        // Left composite: if x < lineX use original, else mirror from left side
        const leftIdx = (y * w + x) * 4;
        if (x <= lineX) {
          // Original left pixel
          leftImgData.data[leftIdx] = srcData.data[srcIdx];
          leftImgData.data[leftIdx + 1] = srcData.data[srcIdx + 1];
          leftImgData.data[leftIdx + 2] = srcData.data[srcIdx + 2];
          leftImgData.data[leftIdx + 3] = srcData.data[srcIdx + 3];
        } else {
          // Mirror: reflect x across lineX
          const mirrorX = Math.round(lineX - (x - lineX));
          if (mirrorX >= 0 && mirrorX < w) {
            const mirrorIdx = (y * w + mirrorX) * 4;
            leftImgData.data[leftIdx] = srcData.data[mirrorIdx];
            leftImgData.data[leftIdx + 1] = srcData.data[mirrorIdx + 1];
            leftImgData.data[leftIdx + 2] = srcData.data[mirrorIdx + 2];
            leftImgData.data[leftIdx + 3] = srcData.data[mirrorIdx + 3];
          }
        }

        // Right composite: if x >= lineX use original, else mirror from right side
        const rightIdx = (y * w + x) * 4;
        if (x >= lineX) {
          rightImgData.data[rightIdx] = srcData.data[srcIdx];
          rightImgData.data[rightIdx + 1] = srcData.data[srcIdx + 1];
          rightImgData.data[rightIdx + 2] = srcData.data[srcIdx + 2];
          rightImgData.data[rightIdx + 3] = srcData.data[srcIdx + 3];
        } else {
          const mirrorX = Math.round(lineX + (lineX - x));
          if (mirrorX >= 0 && mirrorX < w) {
            const mirrorIdx = (y * w + mirrorX) * 4;
            rightImgData.data[rightIdx] = srcData.data[mirrorIdx];
            rightImgData.data[rightIdx + 1] = srcData.data[mirrorIdx + 1];
            rightImgData.data[rightIdx + 2] = srcData.data[mirrorIdx + 2];
            rightImgData.data[rightIdx + 3] = srcData.data[mirrorIdx + 3];
          }
        }
      }
    }

    leftCtx.putImageData(leftImgData, 0, 0);
    rightCtx.putImageData(rightImgData, 0, 0);

    setResults({
      left: leftCanvas.toDataURL("image/png"),
      right: rightCanvas.toDataURL("image/png"),
    });
  }, [image, topPoint, bottomPoint, getScaledSize]);

  const downloadImage = (dataUrl: string, name: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = name;
    a.click();
  };

  const reset = () => {
    setImage(null);
    setTopPoint(null);
    setBottomPoint(null);
    setPlacingPoint("top");
    setResults(null);
  };

  const resetLine = () => {
    setTopPoint(null);
    setBottomPoint(null);
    setPlacingPoint("top");
    setResults(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-lg font-display font-bold text-foreground mb-1">Face Split &amp; Mirror</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Upload a face photo, place a top and bottom point to define the cut line, then generate two symmetrical composites.
        </p>

        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This tool is for <strong>paying subscribers only</strong> — not for case study subjects.
          </AlertDescription>
        </Alert>

        {!image ? (
          <div
            className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Click to upload a face photo</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> New Photo
              </Button>
              <Button variant="outline" size="sm" onClick={resetLine} disabled={!topPoint}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Line
              </Button>
              <Button size="sm" onClick={generateSplit} disabled={placingPoint !== "done"}>
                <Scissors className="h-3.5 w-3.5 mr-1" /> Split &amp; Mirror
              </Button>
              <span className="text-xs text-muted-foreground ml-2">
                {placingPoint === "top" && "Click on the image to place the top point"}
                {placingPoint === "bottom" && "Now click to place the bottom point"}
                {placingPoint === "done" && "Line set — click Split & Mirror, or click image to reposition"}
              </span>
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className={cn(
                  "rounded-lg border border-border",
                  placingPoint !== "done" ? "cursor-crosshair" : "cursor-pointer"
                )}
                onClick={handleClick}
              />
            </div>
          </div>
        )}
      </div>

      {results && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 text-center">
              <p className="text-xs font-medium text-muted-foreground">Left Side Mirrored</p>
              <img src={results.left} alt="Left mirrored" className="rounded-lg border border-border w-full" />
              <Button variant="outline" size="sm" className="text-xs" onClick={() => downloadImage(results.left, "left-mirrored.png")}>
                <Download className="h-3 w-3 mr-1" /> Download
              </Button>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xs font-medium text-muted-foreground">Original</p>
              {image && <img src={image.src} alt="Original" className="rounded-lg border border-border w-full" />}
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xs font-medium text-muted-foreground">Right Side Mirrored</p>
              <img src={results.right} alt="Right mirrored" className="rounded-lg border border-border w-full" />
              <Button variant="outline" size="sm" className="text-xs" onClick={() => downloadImage(results.right, "right-mirrored.png")}>
                <Download className="h-3 w-3 mr-1" /> Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Trainer notes */}
      <div className="rounded-xl border border-border bg-card p-5">
        <Label htmlFor="face-split-notes" className="text-sm font-semibold text-foreground">Trainer Notes — Face Split</Label>
        <Textarea
          id="face-split-notes"
          placeholder="Add your observations about facial symmetry, asymmetries noticed, etc…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-2 min-h-[100px]"
        />
      </div>
    </div>
  );
}
