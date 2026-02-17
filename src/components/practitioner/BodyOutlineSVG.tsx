/**
 * Clean body outline SVG matching the official 13 Creators Case Study Assessment Form.
 * 5 labelled body regions with horizontal divider lines.
 */
export default function BodyOutlineSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 800"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Horizontal region dividers */}
      <line x1="0" y1="120" x2="400" y2="120" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="0" y1="290" x2="400" y2="290" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="0" y1="400" x2="400" y2="400" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="0" y1="500" x2="400" y2="500" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />

      {/* Region labels */}
      <text x="320" y="90" fill="hsl(var(--foreground))" stroke="none" fontSize="12" fontWeight="700" fontFamily="sans-serif">HEAD/NECK</text>
      <text x="310" y="220" fill="hsl(var(--foreground))" stroke="none" fontSize="12" fontWeight="700" fontFamily="sans-serif">CHEST/ARMS</text>
      <text x="310" y="350" fill="hsl(var(--foreground))" stroke="none" fontSize="12" fontWeight="700" fontFamily="sans-serif">BELLY/WAIST</text>
      <text x="290" y="455" fill="hsl(var(--foreground))" stroke="none" fontSize="10" fontWeight="700" fontFamily="sans-serif">UPPER THIGHS/</text>
      <text x="290" y="470" fill="hsl(var(--foreground))" stroke="none" fontSize="10" fontWeight="700" fontFamily="sans-serif">HIPS/BUTTOCKS</text>
      <text x="310" y="650" fill="hsl(var(--foreground))" stroke="none" fontSize="12" fontWeight="700" fontFamily="sans-serif">LEGS/FEET</text>

      {/* Head */}
      <ellipse cx="200" cy="55" rx="30" ry="38" />
      
      {/* Neck */}
      <line x1="190" y1="93" x2="188" y2="115" />
      <line x1="210" y1="93" x2="212" y2="115" />

      {/* Shoulders */}
      <path d="M188,115 Q170,118 145,135 Q130,145 125,160" />
      <path d="M212,115 Q230,118 255,135 Q270,145 275,160" />

      {/* Torso outline */}
      <path d="M125,160 L120,200 L118,260 Q116,300 120,340 Q124,380 130,400 Q135,430 140,460" />
      <path d="M275,160 L280,200 L282,260 Q284,300 280,340 Q276,380 270,400 Q265,430 260,460" />

      {/* Arms - Left */}
      <path d="M125,160 Q110,180 100,220 Q90,260 85,300 Q82,320 80,340 L78,360" />
      <path d="M125,165 Q115,185 108,220 Q100,255 96,290 Q93,310 92,330 L90,355" />
      {/* Left hand */}
      <path d="M78,360 Q75,370 73,380 Q72,385 78,388 Q82,385 85,378 Q88,370 90,355" />

      {/* Arms - Right */}
      <path d="M275,160 Q290,180 300,220 Q310,260 315,300 Q318,320 320,340 L322,360" />
      <path d="M275,165 Q285,185 292,220 Q300,255 304,290 Q307,310 308,330 L310,355" />
      {/* Right hand */}
      <path d="M322,360 Q325,370 327,380 Q328,385 322,388 Q318,385 315,378 Q312,370 310,355" />

      {/* Hips / Pelvis */}
      <path d="M140,460 Q155,475 170,480 Q185,484 200,485 Q215,484 230,480 Q245,475 260,460" />

      {/* Inner thigh split */}
      <path d="M200,485 L198,520 Q196,540 194,560" />
      <path d="M200,485 L202,520 Q204,540 206,560" />

      {/* Left leg */}
      <path d="M140,460 Q138,500 140,540 Q142,580 145,620 Q147,660 150,700 Q152,730 155,750" />
      <path d="M194,560 Q190,600 188,640 Q186,680 185,720 Q184,740 183,750" />
      {/* Left foot */}
      <path d="M155,750 Q148,760 142,765 Q138,768 135,765 Q134,762 138,758 Q145,752 155,750" />
      <path d="M183,750 Q185,758 188,762 Q190,765 186,766 Q182,764 180,758 Q179,755 183,750" />

      {/* Right leg */}
      <path d="M260,460 Q262,500 260,540 Q258,580 255,620 Q253,660 250,700 Q248,730 245,750" />
      <path d="M206,560 Q210,600 212,640 Q214,680 215,720 Q216,740 217,750" />
      {/* Right foot */}
      <path d="M245,750 Q252,760 258,765 Q262,768 265,765 Q266,762 262,758 Q255,752 245,750" />
      <path d="M217,750 Q215,758 212,762 Q210,765 214,766 Q218,764 220,758 Q221,755 217,750" />
    </svg>
  );
}
