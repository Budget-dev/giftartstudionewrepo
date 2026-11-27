'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/hero';
import { KidsDecor } from '@/components/kids-decor';
import { Footer } from '@/components/footer';

// Core content sections
import { CategoryGrid } from '@/components/home/category-grid';
import { MobileNewArrivals } from '@/components/home/mobile-new-arrivals';
import { NewArrivals } from '@/components/home/new-arrivals';
import { MobileBestSellers } from '@/components/home/mobile-best-sellers';
import { BestSellers } from '@/components/home/best-sellers';
import { TrustBar } from '@/components/home/trust-bar';
import { FestiveSection } from '@/components/home/festive-section';
import { MobileFestiveCarousel } from '@/components/home/mobile-festive-carousel';
import { WhyUs } from '@/components/home/why-us';
import { MobileWhyUs } from '@/components/home/mobile-why-us';
import { MagicalMedia } from '@/components/home/magical-media';
import { MagicalPicksMobile } from '@/components/home/magical-picks-mobile';

export default function Home() {
  // Mount only the active viewport's sections (mobile OR desktop) to avoid
  // duplicate Firestore listeners and duplicate image downloads.
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <main className="min-h-screen bg-white relative overflow-x-hidden">
      <Navbar />
      <KidsDecor />

      {/* Hero Banner Section (5-Second Auto Rotation) */}
      <Hero isMobile={isDesktop === false} />

      <div className="flex flex-col">
        {/* Categories */}
        <CategoryGrid />

        {isDesktop === false && (
          <>
            <MobileNewArrivals />
            <div className="[content-visibility:auto] [contain-intrinsic-size:1px_450px]">
              <MobileBestSellers />
            </div>
            <div className="[content-visibility:auto] [contain-intrinsic-size:1px_400px]">
              <MagicalPicksMobile />
            </div>
            <div className="[content-visibility:auto] [contain-intrinsic-size:1px_500px]">
              <MobileFestiveCarousel />
            </div>
            <div className="[content-visibility:auto] [contain-intrinsic-size:1px_400px]">
              <MobileWhyUs />
            </div>
          </>
        )}

        {isDesktop === true && (
          <>
            <NewArrivals />
            <div className="[content-visibility:auto] [contain-intrinsic-size:1px_700px]">
              <BestSellers />
            </div>
            <div className="[content-visibility:auto] [contain-intrinsic-size:1px_600px]">
              <MagicalMedia />
            </div>
            <div className="[content-visibility:auto] [contain-intrinsic-size:1px_700px]">
              <FestiveSection />
            </div>
            <div className="[content-visibility:auto] [contain-intrinsic-size:1px_500px]">
              <WhyUs />
            </div>
          </>
        )}

        {/* Trust Features */}
        <TrustBar />
      </div>

      <Footer />
    </main>
  );
}
