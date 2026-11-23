'use client';

import dynamic from 'next/dynamic';
import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/hero';
import { KidsDecor } from '@/components/kids-decor';
import { Footer } from '@/components/footer';

// Core content sections rendered instantly with zero blocking
import { CategoryGrid } from '@/components/home/category-grid';
import { MobileNewArrivals } from '@/components/home/mobile-new-arrivals';
import { NewArrivals } from '@/components/home/new-arrivals';
import { MobileBestSellers } from '@/components/home/mobile-best-sellers';
import { BestSellers } from '@/components/home/best-sellers';
import { TrustBar } from '@/components/home/trust-bar';

// Lazy loaded secondary components
const FestiveSection = dynamic(() => import('@/components/home/festive-section').then(mod => mod.FestiveSection), { ssr: false });
const MobileFestiveCarousel = dynamic(() => import('@/components/home/mobile-festive-carousel').then(mod => mod.MobileFestiveCarousel), { ssr: false });
const WhyUs = dynamic(() => import('@/components/home/why-us').then(mod => mod.WhyUs), { ssr: false });
const MobileWhyUs = dynamic(() => import('@/components/home/mobile-why-us').then(mod => mod.MobileWhyUs), { ssr: false });
const MagicalMedia = dynamic(() => import('@/components/home/magical-media').then(mod => mod.MagicalMedia), { ssr: false });
const MagicalPicksMobile = dynamic(() => import('@/components/home/magical-picks-mobile').then(mod => mod.MagicalPicksMobile), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen bg-white relative overflow-x-hidden">
      <Navbar />
      <KidsDecor />

      {/* Hero Section */}
      <div className="lg:hidden">
        <Hero isMobile />
      </div>
      <div className="hidden lg:block">
        <Hero />
      </div>
      
      <div className="flex flex-col">
        {/* Categories */}
        <CategoryGrid />

        {/* New Arrivals */}
        <div className="lg:hidden">
          <MobileNewArrivals />
        </div>
        <div className="hidden lg:block">
          <NewArrivals />
        </div>

        {/* Bestsellers */}
        <div className="lg:hidden">
          <MobileBestSellers />
        </div>
        <div className="hidden lg:block">
          <BestSellers />
        </div>

        {/* Magical Media (Reels) */}
        <div className="lg:hidden">
          <MagicalPicksMobile />
        </div>
        <div className="hidden lg:block">
          <MagicalMedia />
        </div>

        {/* Festive Collections / Featured Products */}
        <div className="lg:hidden">
          <MobileFestiveCarousel />
        </div>
        <div className="hidden lg:block">
          <FestiveSection />
        </div>

        {/* Why Us */}
        <div className="lg:hidden">
          <MobileWhyUs />
        </div>
        <div className="hidden lg:block">
          <WhyUs />
        </div>

        {/* Trust Features */}
        <TrustBar />
      </div>
      
      <Footer />
    </main>
  );
}
