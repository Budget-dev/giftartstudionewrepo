'use client';

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { KidsDecor } from '@/components/kids-decor';
import { FilterSidebar } from '@/components/shop/filter-sidebar';
import { ShopContent } from '@/components/shop/shop-content';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { RelatedProducts } from '@/components/shop/related-products';

export default function CategoryLandingContent({ categoryName }: { categoryName: string }) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const category = categoryName || 'all';
  const pageTitle = category.replace(/-/g, ' ').toUpperCase();

  return (
    <main className="min-h-screen bg-white relative overflow-x-hidden">
      <Navbar />
      <KidsDecor />
      
      <div className="pt-20 md:pt-24 lg:pt-28">
        <div className="container mx-auto px-4 py-3 md:py-5 text-center flex flex-col items-center border-b border-slate-100">
          <h1 className="text-2xl md:text-3xl font-headline font-black tracking-tight text-slate-800 uppercase">
            {pageTitle}
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest italic opacity-80">
            Discover our curated {pageTitle.toLowerCase()} collection.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-3 md:py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <FilterSidebar category={category} />
          </aside>

          {/* Mobile Filter Sheet */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetContent side="left" className="w-[300px] sm:w-[380px] p-5 sm:p-6 overflow-y-auto bg-white border-none rounded-r-3xl shadow-2xl">
              <SheetHeader className="sr-only">
                <SheetTitle>Shop Filters</SheetTitle>
              </SheetHeader>
              <FilterSidebar 
                category={category} 
                onClose={() => setIsFilterOpen(false)} 
              />
            </SheetContent>
          </Sheet>

          {/* Main Content Area */}
          <div className="flex-1">
            <ShopContent 
              category={category} 
              onOpenFilters={() => setIsFilterOpen(true)} 
            />
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
