/**
 * Anatomical body outline SVG – clean single-stroke silhouette
 * matching the reference "medical body outline" style.
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
      strokeWidth="1.8"
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

      {/* Full body outline – single continuous path for clean silhouette */}
      <path d={`
        M 200,18
        C 185,18 174,28 174,48
        C 174,68 184,82 200,82
        C 216,82 226,68 226,48
        C 226,28 215,18 200,18
        Z
      `} />

      {/* Neck + body outline as one continuous shape */}
      <path d={`
        M 189,80
        C 188,90 187,100 186,108
        C 170,112 152,122 140,138
        C 130,150 124,162 122,172
        C 118,188 112,210 108,235
        C 105,252 102,270 100,285
        C 97,305 94,325 92,345
        C 90,358 88,368 86,378
        C 84,388 83,395 84,400
        C 85,405 88,408 92,406
        C 95,404 97,400 100,394
        C 103,386 106,376 108,366
        C 110,356 112,346 115,332
        C 118,318 120,308 122,300
        C 124,290 126,278 128,268
        C 130,258 132,250 134,244
        C 136,260 137,280 138,300
        C 139,320 140,340 140,360
        C 140,380 140,400 142,420
        C 144,440 148,456 154,470
        C 160,484 170,490 180,492
        C 186,493 192,494 198,495
      `} />

      <path d={`
        M 211,80
        C 212,90 213,100 214,108
        C 230,112 248,122 260,138
        C 270,150 276,162 278,172
        C 282,188 288,210 292,235
        C 295,252 298,270 300,285
        C 303,305 306,325 308,345
        C 310,358 312,368 314,378
        C 316,388 317,395 316,400
        C 315,405 312,408 308,406
        C 305,404 303,400 300,394
        C 297,386 294,376 292,366
        C 290,356 288,346 285,332
        C 282,318 280,308 278,300
        C 276,290 274,278 272,268
        C 270,258 268,250 266,244
        C 264,260 263,280 262,300
        C 261,320 260,340 260,360
        C 260,380 260,400 258,420
        C 256,440 252,456 246,470
        C 240,484 230,490 220,492
        C 214,493 208,494 202,495
      `} />

      {/* Inner leg split */}
      <path d={`
        M 198,495
        C 196,510 194,530 193,550
        C 192,570 192,590 192,610
        C 192,640 192,670 192,700
        C 192,720 191,735 190,748
        C 189,758 186,765 182,770
        C 179,774 176,776 174,775
        C 172,774 172,771 174,768
        C 178,762 182,755 184,748
      `} />

      <path d={`
        M 202,495
        C 204,510 206,530 207,550
        C 208,570 208,590 208,610
        C 208,640 208,670 208,700
        C 208,720 209,735 210,748
        C 211,758 214,765 218,770
        C 221,774 224,776 226,775
        C 228,774 228,771 226,768
        C 222,762 218,755 216,748
      `} />

      {/* Left leg outer */}
      <path d={`
        M 142,420
        C 140,440 138,460 138,480
        C 138,500 138,520 140,540
        C 142,560 144,580 146,600
        C 148,620 150,640 152,660
        C 154,680 155,700 156,720
        C 157,735 157,748 156,758
        C 155,765 152,770 148,774
        C 145,777 142,778 140,776
        C 138,774 139,770 142,766
        C 146,760 150,752 152,748
      `} />

      {/* Right leg outer */}
      <path d={`
        M 258,420
        C 260,440 262,460 262,480
        C 262,500 262,520 260,540
        C 258,560 256,580 254,600
        C 252,620 250,640 248,660
        C 246,680 245,700 244,720
        C 243,735 243,748 244,758
        C 245,765 248,770 252,774
        C 255,777 258,778 260,776
        C 262,774 261,770 258,766
        C 254,760 250,752 248,748
      `} />

      {/* Fingers – left hand */}
      <path d="M 84,400 C 80,408 77,414 76,418 C 75,422 77,422 80,418" />
      <path d="M 86,402 C 83,410 80,418 79,424 C 78,428 80,428 83,424" />
      <path d="M 88,404 C 86,412 84,420 84,426 C 84,430 86,430 88,426" />
      <path d="M 92,406 C 90,412 89,418 89,422 C 89,425 91,424 93,420" />

      {/* Fingers – right hand */}
      <path d="M 316,400 C 320,408 323,414 324,418 C 325,422 323,422 320,418" />
      <path d="M 314,402 C 317,410 320,418 321,424 C 322,428 320,428 317,424" />
      <path d="M 312,404 C 314,412 316,420 316,426 C 316,430 314,430 312,426" />
      <path d="M 308,406 C 310,412 311,418 311,422 C 311,425 309,424 307,420" />
    </svg>
  );
}
