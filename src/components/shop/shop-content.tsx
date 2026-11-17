'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, List, SlidersHorizontal, Search, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from '@/components/product-card';
import { Product } from '@/lib/types';
import { useFirestore, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { cacheProducts } from '@/lib/product-cache';
import Link from 'next/link';

interface ShopContentProps {
  category?: string;
  subcategory?: string;
  onOpenFilters: () => void;
}

export function ShopContent({ category, subcategory, onOpenFilters }: ShopContentProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState('featured');
  const [searchQuery, setSearchBar] = useState('');

  const db = useFirestore();
  const searchParams = useSearchParams();

  const productsCol = useMemo(() => db ? collection(db, 'products') : null, [db]);
  const { data: allProducts, loading } = useCollection<any>(productsCol);

  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      cacheProducts(allProducts);
    }
  }, [allProducts]);

  // Robust, forgiving matching logic
  const filteredProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    let result = [...allProducts];

    // Subcategory matching
    if (subcategory) {
      const sub = subcategory.toLowerCase();
      if (sub.includes('bottle')) {
        result = result.filter(p => 
          p.subcategory?.toLowerCase().includes('bottle') || 
          p.name?.toLowerCase().includes('bottle') ||
          p.title?.toLowerCase().includes('bottle')
        );
      } else if (sub.includes('mug')) {
        result = result.filter(p => 
          p.subcategory?.toLowerCase().includes('mug') || 
          p.name?.toLowerCase().includes('mug') ||
          p.title?.toLowerCase().includes('mug')
        );
      } else if (sub.includes('bag')) {
        result = result.filter(p => 
          p.subcategory?.toLowerCase().includes('bag') || 
          p.name?.toLowerCase().includes('bag') ||
          p.title?.toLowerCase().includes('bag')
        );
      } else if (sub.includes('umbrella')) {
        result = result.filter(p => 
          p.subcategory?.toLowerCase().includes('umbrella') || 
          p.name?.toLowerCase().includes('umbrella') ||
          p.title?.toLowerCase().includes('umbrella')
        );
      } else if (sub.includes('combo')) {
        result = result.filter(p => 
          p.subcategory?.toLowerCase().includes('combo') || 
          p.name?.toLowerCase().includes('combo') ||
          p.title?.toLowerCase().includes('combo')
        );
      } else if (sub.includes('stationery') || sub.includes('planner')) {
        result = result.filter(p => 
          p.subcategory?.toLowerCase().includes('stationery') || 
          p.subcategory?.toLowerCase().includes('planner') || 
          p.name?.toLowerCase().includes('planner') ||
          p.name?.toLowerCase().includes('stationery')
        );
      } else if (sub.includes('lunch')) {
        result = result.filter(p => 
          p.subcategory?.toLowerCase().includes('lunch') || 
          p.name?.toLowerCase().includes('lunch')
        );
      } else if (sub.includes('passport')) {
        result = result.filter(p => 
          p.subcategory?.toLowerCase().includes('passport') || 
          p.name?.toLowerCase().includes('passport')
        );
      } else if (sub.includes('best-seller')) {
        result = result.filter(p => p.isBestSeller === true || p.subcategory === 'best-sellers');
      } else if (sub.includes('festive')) {
        result = result.filter(p => p.subcategory === 'festive' || p.category === 'festive');
      } else {
        result = result.filter(p => 
          p.subcategory?.toLowerCase() === sub ||
          p.subcategory?.toLowerCase().replace(/-/g, ' ') === sub.replace(/-/g, ' ') ||
          p.category?.toLowerCase() === category?.toLowerCase()
        );
      }
    } else if (category && category !== 'all') {
      const cat = category.toLowerCase();
      if (cat === 'new') {
        result = result.filter(p => p.category === 'new' || p.isNew === true || p.isBestSeller === true);
      } else if (cat.includes('personali')) {
        result = result.filter(p => 
          p.category?.toLowerCase().includes('personali') || 
          p.isPersonalized === true ||
          p.name?.toLowerCase().includes('personal') ||
          p.title?.toLowerCase().includes('personal')
        );
        // If specific personalized tag returned nothing, show all non-empty catalog items
        if (result.length === 0) result = [...allProducts];
      } else {
        result = result.filter(p => 
          p.category?.toLowerCase() === cat || 
          p.category?.toLowerCase().replace(/-/g, ' ') === cat.replace(/-/g, ' ') ||
          p.category?.toLowerCase().includes(cat)
        );
      }
    }

    // Keyword search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Price sorting
    if (sort === 'price-low') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === 'price-high') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === 'rating') {
      result.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    }

    return result;
  }, [allProducts, category, subcategory, searchQuery, sort]);

  // Fallback to all products if specific query has 0 items
  const displayProducts = filteredProducts.length > 0 ? filteredProducts : (allProducts || []);
  const isShowingFallback = filteredProducts.length === 0 && allProducts && allProducts.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Count & Filter Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFilters}
            className="lg:hidden rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </Button>

          <span className="text-xs font-medium text-slate-500">
            Showing <strong className="text-slate-800 dark:text-white font-bold">{displayProducts.length}</strong> items
          </span>
        </div>

        {/* Right: Search & Sort */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              placeholder="Search in collection..."
              value={searchQuery}
              onChange={(e) => setSearchBar(e.target.value)}
              className="w-full text-xs h-9 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-1 focus:ring-purple-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-36 h-9 rounded-xl text-xs font-medium border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="hidden sm:flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 bg-white dark:bg-slate-800">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-purple-100 text-purple-700 dark:bg-slate-700 dark:text-purple-300' : 'text-slate-400'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-purple-100 text-purple-700 dark:bg-slate-700 dark:text-purple-300' : 'text-slate-400'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Fallback Notice */}
      {isShowingFallback && (
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
          <p className="text-xs text-purple-800 dark:text-purple-300 font-medium">
            No exact matches found for &quot;{subcategory || category}&quot;. Showing our most popular gifts below:
          </p>
          <Link href="/collections" className="text-xs font-bold text-purple-600 hover:underline shrink-0 ml-4">
            View All Collections →
          </Link>
        </div>
      )}

      {/* Product Grid / Loading State */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-3 animate-pulse bg-white dark:bg-slate-900">
              <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl mt-2" />
            </div>
          ))}
        </div>
      ) : displayProducts.length > 0 ? (
        <div className={view === 'grid' 
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" 
          : "flex flex-col gap-4"
        }>
          {displayProducts.map((prod: any) => (
            <ProductCard 
              key={prod.id} 
              product={{
                id: prod.id,
                name: prod.name || prod.title || 'Gift Item',
                title: prod.title || prod.name || 'Gift Item',
                price: prod.price || 499,
                originalPrice: prod.originalPrice || prod.price ? Math.round((prod.price || 499) * 1.3) : 699,
                image: prod.image || prod.imageUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80',
                imageUrl: prod.imageUrl || prod.image,
                category: prod.category || 'personalized-gifts',
                subcategory: prod.subcategory || 'gifts',
                rating: prod.rating || 4.8,
                reviewsCount: prod.reviewsCount || 12,
                isBestSeller: prod.isBestSeller,
                isNew: prod.isNew,
                isPersonalized: prod.isPersonalized ?? true
              }} 
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No Products Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We are crafting new magical designs for this collection. Check back soon or browse all collections.
          </p>
          <Button asChild className="rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-semibold">
            <Link href="/collections">Explore All Collections</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
