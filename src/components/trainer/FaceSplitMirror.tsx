import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, RotateCcw, Scissors, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FaceSplitMirror() {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [splitX, setSplitX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [results, setResults] = useState<{ left: string; right: string } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const handleFile = useCallback((file: File) => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setSplitX(null);
      setResults(null);
    };
    img.src = URL.createObjectURL(file);
  }, []);

  // Draw image + split line
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const maxW = Math.min(600, window.innerWidth - 64);
    const scale = maxW / image.width;
    const w = Math.round(image.width * scale);
    const h = Math.round(image.height * scale);
    canvas.width = w;
    canvas.height = h;
    setCanvasSize({ w, h });

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0, w, h);

    // Draw split line
    const lineX = splitX ?? Math.round(w / 2);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(lineX, 0);
    ctx.lineTo(lineX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = "#ef4444";
    ctx.textAlign = "center";
    ctx.fillText("◄ drag line ►", lineX, 16);
  }, [image, splitX]);

  const getCanvasX = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    return Math.max(10, Math.min(canvasSize.w - 10, Math.round(((clientX - rect.left) / rect.width) * canvas.width)));
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    setSplitX(getCanvasX(e));
  };
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    setSplitX(getCanvasX(e));
  };
  const handlePointerUp = () => setIsDragging(false);

  const generateSplit = useCallback(() => {
    if (!image) return;
    const maxW = Math.min(600, window.innerWidth - 64);
    const scale = maxW / image.width;
    const w = Math.round(image.width * scale);
    const h = Math.round(image.height * scale);
    const lineX = splitX ?? Math.round(w / 2);

    // Left-mirrored: take left half, mirror it to fill right side
    const leftCanvas = document.createElement("canvas");
    leftCanvas.width = w;
    leftCanvas.height = h;
    const lCtx = leftCanvas.getContext("2d")!;
    // Draw left half normally
    lCtx.drawImage(image, 0, 0, w, h);
    // Clear right side
    lCtx.clearRect(lineX, 0, w - lineX, h);
    // Draw mirrored left half on right side
    lCtx.save();
    lCtx.translate(lineX * 2, 0);
    lCtx.scale(-1, 1);
    lCtx.drawImage(image, 0, 0, w, h);
    // Clip to only fill the right portion
    lCtx.restore();
    // Re-do properly with clipping
    leftCanvas.width = w; // reset
    const lCtx2 = leftCanvas.getContext("2d")!;
    // Left half as-is
    lCtx2.save();
    lCtx2.beginPath();
    lCtx2.rect(0, 0, lineX, h);
    lCtx2.clip();
    lCtx2.drawImage(image, 0, 0, w, h);
    lCtx2.restore();
    // Mirrored left half on right
    lCtx2.save();
    lCtx2.beginPath();
    lCtx2.rect(lineX, 0, w - lineX, h);
    lCtx2.clip();
    lCtx2.translate(lineX * 2, 0);
    lCtx2.scale(-1, 1);
    lCtx2.drawImage(image, 0, 0, w, h);
    lCtx2.restore();

    // Right-mirrored: take right half, mirror it to fill left side
    const rightCanvas = document.createElement("canvas");
    rightCanvas.width = w;
    rightCanvas.height = h;
    const rCtx = rightCanvas.getContext("2d")!;
    // Right half as-is
    rCtx.save();
    rCtx.beginPath();
    rCtx.rect(lineX, 0, w - lineX, h);
    rCtx.clip();
    rCtx.drawImage(image, 0, 0, w, h);
    rCtx.restore();
    // Mirrored right half on left
    rCtx.save();
    rCtx.beginPath();
    rCtx.rect(0, 0, lineX, h);
    rCtx.clip();
    rCtx.translate(lineX * 2, 0);
    rCtx.scale(-1, 1);
    rCtx.drawImage(image, 0, 0, w, h);
    rCtx.restore();

    setResults({
      left: leftCanvas.toDataURL("image/png"),
      right: rightCanvas.toDataURL("image/png"),
    });
  }, [image, splitX]);

  const downloadImage = (dataUrl: string, name: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = name;
    a.click();
  };

  const reset = () => {
    setImage(null);
    setSplitX(null);
    setResults(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-lg font-display font-bold text-foreground mb-1">Face Split &amp; Mirror</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a face photo, position the split line, then generate two symmetrical composites — one from each half mirrored.
        </p>

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
              <Button size="sm" onClick={generateSplit} disabled={!image}>
                <Scissors className="h-3.5 w-3.5 mr-1" /> Split &amp; Mirror
              </Button>
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className={cn("rounded-lg border border-border cursor-col-resize", isDragging && "cursor-grabbing")}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              />
            </div>
          </div>
        )}
      </div>

      {results && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left mirrored */}
            <div className="space-y-2 text-center">
              <p className="text-xs font-medium text-muted-foreground">Left Side Mirrored</p>
              <img src={results.left} alt="Left mirrored" className="rounded-lg border border-border w-full" />
              <Button variant="outline" size="sm" className="text-xs" onClick={() => downloadImage(results.left, "left-mirrored.png")}>
                <Download className="h-3 w-3 mr-1" /> Download
              </Button>
            </div>

            {/* Original */}
            <div className="space-y-2 text-center">
              <p className="text-xs font-medium text-muted-foreground">Original</p>
              {image && (
                <img src={image.src} alt="Original" className="rounded-lg border border-border w-full" />
              )}
            </div>

            {/* Right mirrored */}
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
    </div>
  );
}
