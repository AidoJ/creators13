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
        viewBox="0 0 400 900"
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* Horizontal region dividers */}
        <line x1="0" y1="155" x2="400" y2="155" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="345" x2="400" y2="345" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="510" x2="400" y2="510" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="640" x2="400" y2="640" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />

        {/* Region labels */}
        <text x="300" y="80" fill="hsl(var(--foreground))" fontSize="13" fontWeight="700" fontFamily="sans-serif">HEAD/NECK</text>
        <text x="290" y="260" fill="hsl(var(--foreground))" fontSize="13" fontWeight="700" fontFamily="sans-serif">CHEST/ARMS</text>
        <text x="290" y="435" fill="hsl(var(--foreground))" fontSize="13" fontWeight="700" fontFamily="sans-serif">BELLY/WAIST</text>
        <text x="275" y="570" fill="hsl(var(--foreground))" fontSize="11" fontWeight="700" fontFamily="sans-serif">UPPER THIGHS/</text>
        <text x="275" y="586" fill="hsl(var(--foreground))" fontSize="11" fontWeight="700" fontFamily="sans-serif">HIPS/BUTTOCKS</text>
        <text x="300" y="780" fill="hsl(var(--foreground))" fontSize="13" fontWeight="700" fontFamily="sans-serif">LEGS/FEET</text>
      </svg>
    </div>
  );
}
