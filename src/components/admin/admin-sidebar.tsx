"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Ticket, 
  Undo2,
  Search, 
  Gift,
  ChevronRight,
  LogOut,
  ChevronDown,
  Sparkles,
  Baby,
  UserCircle,
  Shapes,
  FolderOpen,
  Wand2,
  PawPrint,
  CreditCard,
  PlusCircle,
  Truck,
  Image as ImageIcon,
  Palette,
  BookOpen,
  BellRing
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const CATALOG_GROUPS = [
  {
    label: 'NEW',
    icon: Sparkles,
    hrefPrefix: '/admin/products/new',
    items: [
      { label: 'New Collection', sub: 'new-collection' },
      { label: 'New Launch', sub: 'new-launch' },
      { label: 'Best Sellers', sub: 'best-sellers' },
      { label: 'Festive', sub: 'festive' },
    ]
  },
  {
    label: 'PERSONALISED GIFTS',
    icon: Gift,
    hrefPrefix: '/admin/products/personalized-gifts',
    items: [
      { label: 'Travelling', sub: 'travelling' },
      { label: 'Mugs', sub: 'mugs' },
      { label: 'Bottles', sub: 'bottles' },
      { label: 'Passport Covers', sub: 'passport-covers' },
      { label: 'Laptop Bags', sub: 'laptop-bags' },
      { label: 'Travel Cases', sub: 'travel-cases' },
      { label: 'Corporate Gifts', sub: 'corporate-gifts' },
    ]
  },
  {
    label: 'KIDS',
    icon: Baby,
    hrefPrefix: '/admin/products/kids',
    items: [
      { label: 'School Bags', sub: 'bags' },
      { label: 'Water Bottles', sub: 'water-bottles' },
      { label: 'Lunch Boxes', sub: 'lunch-boxes' },
      { label: 'Umbrellas', sub: 'umbrellas' },
      { label: 'Combos', sub: 'combos' },
      { label: 'Gift Sets', sub: 'kids-gifts' },
      { label: 'Stationery', sub: 'stationery' },
      { label: 'Toys', sub: 'toys' },
    ]
  },
  {
    label: 'ADULTS',
    icon: UserCircle,
    hrefPrefix: '/admin/products/adults',
    items: [
      { label: 'Mens', sub: 'mens' },
      { label: 'Womens', sub: 'womens' },
      { label: 'Unisex', sub: 'unisex' },
    ]
  },
  {
    label: 'ACCESSORIES',
    icon: Shapes,
    hrefPrefix: '/admin/products/accessories',
    items: [
      { label: 'Travelling', sub: 'travelling' },
      { label: 'Bags', sub: 'bags' },
      { label: 'Travel Accessories', sub: 'travel-combo' },
      { label: 'Gift Boxes', sub: 'gift-boxes' },
      { label: 'Combos', sub: 'combos' },
      { label: 'Desk Accessories', sub: 'desk' },
    ]
  },
  {
    label: 'PETS',
    icon: PawPrint,
    hrefPrefix: '/admin/products/pets',
    items: [
      { label: 'Pet Bowls', sub: 'pet-bowls' },
      { label: 'Pet Tags', sub: 'pet-tags' },
      { label: 'Pet Bands', sub: 'pet-bands' },
      { label: 'Pet Toys', sub: 'pet-toys' },
      { label: 'Pet Clothes', sub: 'pet-clothes' },
      { label: 'Pet Accessories', sub: 'pet-accessories' },
    ]
  },
];

const CORE_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'All Products', href: '/admin/products', icon: FolderOpen },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag, hasBadge: true },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Custom AI Orders', href: '/admin/customized-orders', icon: Wand2 },
  { label: 'Banners', href: '/admin/banners', icon: ImageIcon },
  { label: 'Purchase Popups', href: '/admin/popups', icon: BellRing },
  { label: 'Art Gallery', href: '/admin/art-gallery', icon: Palette },
  { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { label: 'RTO Management', href: '/admin/rto', icon: Undo2 },
  { label: 'SEO Settings', href: '/admin/seo', icon: Search },
  { label: 'Admin Manual', href: '/admin/manual', icon: BookOpen },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [isShippingRole, setIsShippingRole] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsShippingRole(localStorage.getItem('admin_role') === 'shipping');
    }
  }, [pathname]);

  // Real pending orders count for the badge
  const pendingOrdersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), where('status', '==', 'Pending'));
  }, [db]);
  const { data: pendingOrders } = useCollection<any>(pendingOrdersQuery);
  const pendingCount = pendingOrders?.length || 0;

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  if (isShippingRole) {
    return (
      <aside className="w-72 bg-white border-r border-slate-100/80 flex flex-col h-screen sticky top-0 overflow-y-auto scrollbar-hide shadow-sm z-40">
        <div className="p-6 pb-4 shrink-0 border-b border-slate-50">
          <Link href="/admin/orders" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Truck className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-base text-slate-800 tracking-tight">GiftArt Logistics</span>
              <span className="text-[10px] font-bold text-purple-600">Shipping Desk</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-3">
          <Link
            href="/admin/orders"
            className={cn(
              "flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm",
              pathname.startsWith('/admin/orders')
                ? "bg-purple-600 text-white shadow-purple-200"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" />
              <span>Orders &amp; Dispatch</span>
            </div>
            {pendingCount > 0 && (
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full",
                pathname.startsWith('/admin/orders') ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
              )}>
                {pendingCount}
              </span>
            )}
          </Link>

          <Link
            href="/admin/manual"
            className={cn(
              "flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm",
              pathname.startsWith('/admin/manual')
                ? "bg-purple-600 text-white shadow-purple-200"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4" />
              <span>User Manual &amp; Guide</span>
            </div>
          </Link>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-[11px] text-purple-900 space-y-1.5 mt-6">
            <div className="flex items-center gap-1.5 font-bold text-purple-800">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Shipping Role Active</span>
            </div>
            <p className="text-[10px] text-purple-700 leading-relaxed">
              You have access to customer delivery details, colour/capacity specifications, and packing slips. Sensitive financials and store products are restricted.
            </p>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('admin_role');
                localStorage.removeItem('shipping_staff_name');
                document.cookie = "admin_role=; path=/; max-age=0";
              }
              signOut(auth).then(() => router.push('/admin/login'));
            }}
            className="flex items-center gap-2.5 px-3.5 py-2.5 w-full rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold text-xs"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 bg-white border-r border-slate-100/80 flex flex-col h-screen sticky top-0 overflow-y-auto scrollbar-hide shadow-sm z-40">
      {/* Brand Header */}
      <div className="p-6 pb-4 shrink-0 border-b border-slate-50">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-[#7c3aed] to-[#6366f1] rounded-2xl flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Gift className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-base text-slate-800 tracking-tight">GiftArtStudio</span>
            <span className="text-[10px] font-bold text-slate-400">Admin Panel</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {/* Core Management Items */}
        <div className="space-y-1 mb-6">
          {CORE_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold",
                  isActive 
                    ? "bg-[#f3e8ff] text-[#6d28d9] shadow-sm shadow-purple-100" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-4 w-4", isActive ? "text-[#7c3aed]" : "text-slate-400 group-hover:text-slate-600")} />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {item.hasBadge && pendingCount > 0 ? (
                  <span className="bg-[#7c3aed] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                    {pendingCount}
                  </span>
                ) : (
                  isActive && <ChevronRight className="h-3.5 w-3.5 text-[#7c3aed]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Catalog Category Groups */}
        <div className="space-y-1">
          <div className="px-3 pb-2 flex items-center justify-between">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Store Catalog</p>
            <Link 
              href="/admin/products" 
              className="text-[9px] font-bold text-purple-600 hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-2.5 h-2.5" /> Add
            </Link>
          </div>
          
          {CATALOG_GROUPS.map((group) => {
            const isGroupOpen = openGroups.includes(group.label) || pathname.startsWith(group.hrefPrefix);
            
            return (
              <Collapsible
                key={group.label}
                open={isGroupOpen}
                onOpenChange={() => toggleGroup(group.label)}
                className="space-y-1"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-xs">
                  <div className="flex items-center gap-3">
                    <group.icon className="h-4 w-4 text-slate-400" />
                    <span className="tracking-tight">{group.label}</span>
                  </div>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform duration-200", isGroupOpen && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pl-9 pr-2 pb-2">
                  {group.items.map((item) => {
                    const href = `${group.hrefPrefix}/${item.sub}`;
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={item.sub}
                        href={href}
                        className={cn(
                          "block px-3 py-2 rounded-xl text-[11px] font-bold transition-all",
                          isActive 
                            ? "bg-purple-600 text-white shadow-sm" 
                            : "text-slate-500 hover:text-purple-600 hover:bg-purple-50/60"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </nav>

      {/* Footer Sign Out */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <button
          onClick={() => signOut(auth).then(() => router.push('/admin/login'))}
          className="flex items-center gap-2.5 px-3.5 py-2.5 w-full rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold text-xs"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
