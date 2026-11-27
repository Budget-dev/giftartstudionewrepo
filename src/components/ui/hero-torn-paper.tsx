'use client';

import { cn } from '@/lib/utils';

interface HeroTornPaperProps {
  className?: string;
  fillColor?: string;
}

/**
 * Realistic fixed torn-paper bottom edge template overlay for 16:9 homepage banners.
 * Pure inline SVG for instant 0ms rendering and crisp edges across all screen sizes.
 */
export function HeroTornPaper({ className, fillColor = '#ffffff' }: HeroTornPaperProps) {
  return (
    <div
      className={cn(
        'w-full pointer-events-none select-none overflow-hidden leading-none z-30',
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        className="w-full h-7 sm:h-10 md:h-12 lg:h-16 block drop-shadow-[0_-4px_6px_rgba(0,0,0,0.12)]"
      >
        {/* Subtle paper fiber deckle shadow edge */}
        <path
          d="M0,44 L36,28 L68,41 L104,22 L142,39 L185,18 L224,36 L262,24 L305,45 L348,20 L392,38 L434,25 L476,42 L520,19 L562,37 L604,23 L648,43 L690,18 L734,39 L778,22 L820,41 L862,20 L908,38 L952,24 L996,44 L1040,19 L1082,36 L1126,21 L1170,40 L1214,22 L1258,41 L1304,19 L1348,37 L1392,24 L1440,39 L1440,72 L0,72 Z"
          fill="rgba(241,245,249,0.75)"
        />
        {/* Crisp foreground torn-paper white deckle edge */}
        <path
          d="M0,50 L28,36 L58,48 L96,29 L134,45 L176,26 L216,44 L254,31 L298,50 L342,27 L384,46 L426,33 L470,49 L514,26 L556,44 L598,30 L642,48 L684,25 L728,45 L772,29 L814,48 L856,28 L902,45 L946,32 L990,50 L1034,26 L1076,43 L1120,28 L1164,47 L1208,29 L1252,47 L1298,26 L1342,44 L1386,31 L1440,46 L1440,72 L0,72 Z"
          fill={fillColor}
        />
      </svg>
    </div>
  );
}
