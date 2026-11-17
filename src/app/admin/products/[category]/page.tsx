"use client";

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  ArrowLeft,
  Edit2, 
  Trash2, 
  Box, 
  Package, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ProductFormDialog, CATEGORIES_LIST } from '@/components/admin/product-form-dialog';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default function AdminCategoryProductsPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const categorySlug = resolvedParams?.category || '';

  const db = useFirestore();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSub, setSelectedSub] = useState<string>("All");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Category Metadata
  const categoryMeta = useMemo(() => {
    return CATEGORIES_LIST.find(c => c.slug === categorySlug) || {
      name: categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      slug: categorySlug,
      subcategories: []
    };
  }, [categorySlug]);

  // Firestore Query
  const categoryProductsQuery = useMemo(() => {
    if (!db || !categorySlug) return null;
    return query(
      collection(db, 'products'),
      where('category', '==', categorySlug)
    );
  }, [db, categorySlug]);

  const { data: products, loading } = useCollection<any>(categoryProductsQuery);

  // Filtered
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: any) => {
      if (selectedSub !== 'All' && (p.subcategory || '').toLowerCase() !== selectedSub.toLowerCase()) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = (p.name || p.title || '').toLowerCase().includes(term);
        const matchesSub = (p.subcategory || '').toLowerCase().includes(term);
        if (!matchesName && !matchesSub) return false;
      }
      return true;
    });
  }, [products, selectedSub, searchTerm]);

  // Open Edit
  const handleEditProduct = (p: any) => {
    setEditingProduct(p);
    setIsAddOpen(true);
  };

  // Delete
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!db) return;
    if (!confirm(`Are you sure you want to remove "${name}" from store catalog?`)) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast({ title: 'Product Deleted', description: `Removed from store catalog.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to delete product.' });
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Link href="/admin/products" className="hover:text-purple-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Store Catalog
            </Link>
            <span>&gt;</span>
            <span className="text-purple-600 font-extrabold">{categoryMeta.name}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0.5 capitalize">
            {categoryMeta.name}
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            {products?.length || 0} product(s) active in {categoryMeta.name}.
          </p>
        </div>

        {/* Add Product Button */}
        <button
          onClick={() => { setEditingProduct(null); setIsAddOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add {categoryMeta.name} Item</span>
        </button>
      </div>

      {/* Product Form Modal */}
      <ProductFormDialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setEditingProduct(null);
        }}
        defaultCategory={categorySlug}
        defaultSubcategory={selectedSub !== 'All' ? selectedSub : categoryMeta.subcategories[0]}
        productToEdit={editingProduct}
      />

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.2rem] border border-slate-100 p-5 md:p-6 shadow-sm space-y-4">
        
        {/* Subcategory Filter Pills */}
        {categoryMeta.subcategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedSub('All')}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0",
                selectedSub === 'All'
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              All Subcategories ({products?.length || 0})
            </button>

            {categoryMeta.subcategories.map((sub) => {
              const count = products?.filter((p: any) => (p.subcategory || '').toLowerCase() === sub.toLowerCase()).length || 0;
              const isSelected = selectedSub.toLowerCase() === sub.toLowerCase();
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSub(sub)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 capitalize",
                    isSelected
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <span>{sub.replace(/-/g, ' ')}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${categoryMeta.name} products...`}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Subcategory</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Loading products in {categoryMeta.name}...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">No products found in this category</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "+ Add {categoryMeta.name} Item" to add your first product!
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p: any) => {
                  const imageCount = (p.images?.length || (p.image ? 1 : 0));
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60">
                            <img 
                              src={p.image || p.images?.[0] || 'https://placehold.co/100'} 
                              alt={p.name || p.title} 
                              className="w-full h-full object-cover" 
                              onError={(e: any) => {
                                e.target.src = 'https://placehold.co/100?text=Gift';
                              }}
                            />
                            {imageCount > 1 && (
                              <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[8px] font-black px-1 rounded-tl-md">
                                {imageCount} imgs
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{p.name || p.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {p.isPersonalizable ? '✨ Custom Name' : 'Standard'}
                              </span>
                              {p.badge && (
                                <span className="text-[9px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                  {p.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="capitalize px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                          {p.subcategory?.replace(/-/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-black text-slate-800">
                        ₹{p.price?.toLocaleString()}
                        {p.oldPrice && p.oldPrice > p.price && (
                          <span className="text-[10px] text-slate-400 font-normal line-through ml-1.5">
                            ₹{p.oldPrice}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full font-bold text-[10px]",
                          (p.inventoryStatus || 'In Stock') === 'In Stock' && "bg-emerald-50 text-emerald-700",
                          p.inventoryStatus === 'Low Stock' && "bg-amber-50 text-amber-700",
                          p.inventoryStatus === 'Out of Stock' && "bg-rose-50 text-rose-700"
                        )}>
                          {p.inventoryStatus || 'In Stock'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/product?id=${p.id}`}
                            as={`/product/${p.id}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="View on Store"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleEditProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name || p.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
