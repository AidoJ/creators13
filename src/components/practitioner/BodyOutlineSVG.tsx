import bodyOutlineImg from "@/assets/body-outline-reference.png";

/**
 * Body outline using the exact reference image provided,
 * with labelled region dividers overlaid.
 */
export default function BodyOutlineSVG({ className }: { className?: string }) {
  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Reference body outline image */}
      <img
        src={bodyOutlineImg}
        alt="Body outline"
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
      {/* Region labels overlay */}
      <svg
        viewBox="0 0 400 800"
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
      {/* Horizontal region dividers */}
        <line x1="0" y1="140" x2="400" y2="140" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="310" x2="400" y2="310" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="420" x2="400" y2="420" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="520" x2="400" y2="520" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />

        {/* Region labels */}
        <text x="315" y="100" fill="hsl(var(--foreground))" fontSize="12" fontWeight="700" fontFamily="sans-serif">HEAD/NECK</text>
        <text x="305" y="240" fill="hsl(var(--foreground))" fontSize="12" fontWeight="700" fontFamily="sans-serif">CHEST/ARMS</text>
        <text x="305" y="370" fill="hsl(var(--foreground))" fontSize="12" fontWeight="700" fontFamily="sans-serif">BELLY/WAIST</text>
        <text x="285" y="475" fill="hsl(var(--foreground))" fontSize="10" fontWeight="700" fontFamily="sans-serif">UPPER THIGHS/</text>
        <text x="285" y="490" fill="hsl(var(--foreground))" fontSize="10" fontWeight="700" fontFamily="sans-serif">HIPS/BUTTOCKS</text>
        <text x="305" y="660" fill="hsl(var(--foreground))" fontSize="12" fontWeight="700" fontFamily="sans-serif">LEGS/FEET</text>
      </svg>
    </div>
  );
}
