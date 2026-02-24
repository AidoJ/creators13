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
        <line x1="0" y1="120" x2="400" y2="120" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="290" x2="400" y2="290" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="400" x2="400" y2="400" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="500" x2="400" y2="500" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />

        {/* Region labels */}
        <text x="320" y="90" fill="hsl(var(--foreground))" fontSize="12" fontWeight="700" fontFamily="sans-serif">HEAD/NECK</text>
        <text x="310" y="220" fill="hsl(var(--foreground))" fontSize="12" fontWeight="700" fontFamily="sans-serif">CHEST/ARMS</text>
        <text x="310" y="350" fill="hsl(var(--foreground))" fontSize="12" fontWeight="700" fontFamily="sans-serif">BELLY/WAIST</text>
        <text x="290" y="455" fill="hsl(var(--foreground))" fontSize="10" fontWeight="700" fontFamily="sans-serif">UPPER THIGHS/</text>
        <text x="290" y="470" fill="hsl(var(--foreground))" fontSize="10" fontWeight="700" fontFamily="sans-serif">HIPS/BUTTOCKS</text>
        <text x="310" y="650" fill="hsl(var(--foreground))" fontSize="12" fontWeight="700" fontFamily="sans-serif">LEGS/FEET</text>
      </svg>
    </div>
  );
}
