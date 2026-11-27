"use client";

import { cn } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/lib/image-optimizer";

interface TornPaperProps {
  position: "top" | "bottom";
  className?: string;
  color?: string; // Kept for compatibility, but we use the image
}

export function TornPaper({ position, className }: TornPaperProps) {
  // Using the specific torn paper effect image provided by the user, optimized via Sirv WebP
  const imageUrl = getOptimizedImageUrl(
    "https://rohanwakkar.sirv.com/GiftArtStudio%202/GiftArtStudio/New%20collection/K%20pop%20theme%20Personalized%20mat%20set%20combo/ChatGPT%20Image%20Jun%2019%2C%202026%2C%2007_18_23%20PM.png",
    800,
    80
  );

  return (
    <div className={cn("w-full relative z-30 pointer-events-none leading-none overflow-hidden", className)}>
      <div 
        className={cn(
          "w-full h-8 md:h-12 lg:h-20 bg-repeat-x bg-[length:auto_100%]",
          position === "top" ? "rotate-180 bg-top mb-[-1px]" : "bg-bottom mt-[-1px]"
        )}
        style={{ backgroundImage: `url('${imageUrl}')` }}
      />
    </div>
  );
}
