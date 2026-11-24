"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  ShoppingBag,
  Package,
  Layers,
  Palette,
  Truck,
  Image as ImageIcon,
  CreditCard,
  Ticket,
  SearchCheck,
  Undo2,
  Users,
  Eye,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Printer,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sliders,
  DollarSign,
  Percent,
  Lock,
  ShieldCheck,
  Smartphone,
  Mail,
  HelpCircle,
  Video,
  ArrowRight,
  MousePointerClick
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Chapter {
  id: string;
  title: string;
  badge: string;
  icon: any;
  color: string;
  summary: string;
  tags: string[];
  steps: {
    title: string;
    description: string;
    tip?: string;
    warning?: string;
    bullets?: string[];
    actionLink?: { label: string; href: string };
  }[];
}

const CHAPTERS: Chapter[] = [
  {
    id: 'roles',
    title: '1. Admin Roles & Login Management',
    badge: 'Security & Access',
    icon: ShieldCheck,
    color: 'from-blue-600 to-indigo-600',
    summary: 'Understanding Super Admin vs Shipping Personnel logins, securing your credentials, and managing dispatch roles.',
    tags: ['login', 'role', 'shipping', 'super admin', 'password', 'security', 'warehouse'],
    steps: [
      {
        title: 'Super Admin Login vs Shipping Personnel Login',
        description: 'The GiftArtStudio admin system provides two distinct access levels to maintain data privacy and streamline warehouse workflow:',
        bullets: [
          '👑 Super Admin (Full Control): Email login (e.g. rohanswakkargiftartstudio@gmail.com). Has full authority to edit products, prices, GST, hero banners, coupons, payments, customer analytics, and art gallery approvals.',
          '🚚 Shipping Personnel (Restricted Dispatch Desk): Separate role-based login tab on /admin/login. Warehouse staff can only view shipping orders, customer delivery addresses, selected colour & capacity variants, and print packing slips. Financial figures and catalog editing are completely hidden.'
        ],
        tip: 'Always provide your warehouse packing team with the Shipping Personnel login so product catalogs or store finances are never accidentally altered.',
        actionLink: { label: 'Go to Admin Login', href: '/admin/login' }
      },
      {
        title: 'How to Log in as Shipping Personnel',
        description: 'On the /admin/login screen, switch to the "Shipping Personnel Login" tab. Enter the staff member’s Name and Passcode (or shipping staff credentials). The panel will instantly redirect to the streamlined Shipping Logistics Desk.',
        bullets: [
          'Step 1: Open /admin/login in your browser.',
          'Step 2: Click the "Shipping Personnel Login" toggle button at the top.',
          'Step 3: Enter the staff name and dispatch access key.',
          'Step 4: Once authenticated, the sidebar will only display Orders, Dispatch Slip generator, and this User Manual.'
        ]
      },
      {
        title: 'Logging Out & Switching Sessions',
        description: 'To switch between Super Admin and Shipping Desk, click the "Sign Out" or "Log Out" button at the bottom of the sidebar. This clears session tokens and cookies safely.',
        warning: 'Never save Super Admin passwords on shared warehouse packing computers. Use the Shipping Role on packing stations.'
      }
    ]
  },
  {
    id: 'products',
    title: '2. Store Catalogue & Product Management',
    badge: 'Critical Core',
    icon: Package,
    color: 'from-purple-600 to-pink-600',
    summary: 'Step-by-step master guide for creating products, assigning colour-specific photos, setting custom variant prices, capacity options, per-product GST, stock levels, and video reels.',
    tags: ['product', 'add product', 'color', 'variant', 'capacity', 'gst', 'stock', 'photos', 'reels', 'description', 'price'],
    steps: [
      {
        title: 'Creating a New Product (Basic Info & Categories)',
        description: 'To list a new product on GiftArtStudio:',
        bullets: [
          'Step 1: Go to "All Products" (/admin/products) or any specific category in the sidebar.',
          'Step 2: Click the purple "+ Add Product" button in the top right corner.',
          'Step 3: Enter the Product Name (e.g. "Personalized Insulated Stainless Steel Bottle").',
          'Step 4: Select the Main Category (Personalized Gifts, Kids, Adults, Accessories, Lifestyle, Corporate Gifts, Souvenirs, etc.).',
          'Step 5: Select the Subcategory (Travelling, Mugs, Bottles, DIY, Combos, Wall Clocks, Small Bags, Big Bags, Laptop Sleeves, Tumblers, etc.).'
        ],
        tip: 'Choosing the right subcategory ensures the item appears in the matching category page and in the homepage horizontal category slider!',
        actionLink: { label: 'Go to All Products', href: '/admin/products' }
      },
      {
        title: 'Colour Variants with Custom Photos & Individual Prices',
        description: 'GiftArtStudio allows you to set up multiple colour variants where EACH colour can have its own dedicated photo gallery and its own unique selling price!',
        bullets: [
          '🎨 Add Colours: In the product editor under "Colour Variants", click "+ Add Colour". Enter the Colour Name (e.g. "Candy Pink", "Matte Black", "Aqua Blue") and choose a color swatch hex code.',
          '📸 Colour-Wise Photos: For each colour, click "Add Image URLs for this Colour". When a customer clicks that colour on the live website, the product image gallery instantly switches to show photos of that specific colour!',
          '💰 Colour-Specific Pricing (Optional): If a premium colour (e.g. Metallic Gold) costs more than the base color, enter the custom price in the "Price for this colour (₹)" field. The website will automatically update the product price when the user clicks that colour swatch.'
        ],
        tip: 'If you leave colour photos blank, the product’s default main gallery images will be shown as a fallback.'
      },
      {
        title: 'Capacity & Size Options',
        description: 'In the "Capacity / Sizes" section, add options like "500ml", "750ml", "1000ml", "Standard", or "Set of 2". Customers can select their preferred capacity pill before adding to cart.'
      },
      {
        title: 'Setting GST on Product Amount (Percentage or Fixed ₹)',
        description: 'You can configure exact GST rates per product directly from the admin panel:',
        bullets: [
          'GST Calculation Mode: Choose either "Percentage (%)" or "Rupees (₹)".',
          'GST Value: For example, enter 18 for 18% GST, or enter 50 for a flat ₹50 tax.',
          'How it displays: On checkout, the customer sees the transparent breakdown: Base Price + GST Amount = Final Total Amount.'
        ],
        tip: 'If your product price already includes all taxes, you can set GST to 0% or leave it blank.'
      },
      {
        title: 'Managing Stock Status (In Stock / Few Left / Out of Stock)',
        description: 'Never delete a product when inventory runs out! Use the Stock Status toggle instead:',
        bullets: [
          '🟢 In Stock: Product is active and available for normal checkout.',
          '🟡 Only Few Left: Displays an animated high-demand badge ("Only Few Left!") to encourage fast customer checkout.',
          '🔴 Out of Stock: Shows an "Out of Stock" badge on the product page and gracefully disables the Buy/Add to Cart button.'
        ]
      },
      {
        title: 'Adding Product Video Reels',
        description: 'Under "Video / Reel URL", paste a direct MP4 URL or video link. A "Watch Reel" floating play button will appear over the product image gallery, letting shoppers see the product in action before purchasing.'
      },
      {
        title: 'Product Descriptions & Fixing Template Overrides',
        description: 'All descriptions entered in the admin panel are displayed directly on the product page under the title. Any old default template text has been removed so your custom admin description is always shown.'
      }
    ]
  },
  {
    id: 'orders',
    title: '3. Order Processing & Warehouse Fulfillment',
    badge: 'Operations & Dispatch',
    icon: ShoppingBag,
    color: 'from-emerald-600 to-teal-600',
    summary: 'Managing incoming orders, verifying complete customer addresses, inspecting personalized names & colour/capacity variants, and updating tracking numbers.',
    tags: ['orders', 'address', 'dispatch', 'tracking', 'awb', 'color', 'capacity', 'packing slip', 'status'],
    steps: [
      {
        title: 'Viewing Incoming Orders & Critical Details',
        description: 'Go to "/admin/orders". Each order card displays complete order information to prevent dispatch errors:',
        bullets: [
          '📍 Complete Delivery Address: Full street address, landmark, city, state, and 6-digit postal pincode.',
          '📞 Customer Contact: Full recipient name, phone number, and email for courier coordination.',
          '🎨 Selected Colour: The exact colour variant chosen by the buyer (e.g. "Sky Blue").',
          '📏 Selected Capacity: The chosen size/volume (e.g. "750ml").',
          '✍️ Custom Personalization: The exact name or text to be engraved/printed (e.g. "AARAV" in Capital Letters) plus the selected style or charm icon.',
          '💳 Payment Status: Paid via Razorpay / Verified.'
        ],
        actionLink: { label: 'Go to Orders Panel', href: '/admin/orders' }
      },
      {
        title: 'The 5-Stage Order Status Pipeline',
        description: 'Update the order status dropdown as your team works through fulfillment:',
        bullets: [
          '1. Pending: Order placed by customer and payment verified. Awaiting production.',
          '2. Processing: Item is currently being personalized, quality-checked, and packed in gift packaging.',
          '3. Shipped: Handed over to courier partner. Enter the Courier Name (e.g. BlueDart, Delhivery) and AWB Tracking Number. The customer can now track it live on /track-order!',
          '4. Delivered: Successfully received by the customer.',
          '5. Cancelled / Refunded: If an order had an issue or was refunded.'
        ]
      },
      {
        title: 'Printing Packing Slips & Invoices',
        description: 'Click "Print Slip" or the printer icon on any order to generate a clean, thermal-printer friendly dispatch label containing the recipient address, barcode/order number, and personalized engraving specs.'
      }
    ]
  },
  {
    id: 'shipping-role',
    title: '4. Shipping Personnel Login & Restricted Desk',
    badge: 'Warehouse Security',
    icon: Truck,
    color: 'from-amber-600 to-orange-600',
    summary: 'How to use the dedicated role-based login for warehouse staff so they can ship orders safely without access to sensitive store settings.',
    tags: ['shipping role', 'warehouse', 'restricted', 'dispatch', 'passcode', 'packing', 'logistics'],
    steps: [
      {
        title: 'Why Use the Shipping Role?',
        description: 'Giving warehouse packers full admin access poses risks of accidental deletion of products, exposure of store profit margins, or coupon tampering. The Shipping Role creates a clean sandbox designed solely for packing and dispatching orders.',
        bullets: [
          '✅ What Shipping Staff CAN see: Orders list, customer delivery address, contact phone, selected colour & capacity, personalized text, and packing slip printer.',
          '🔒 What is LOCKED: Product editing, pricing, GST settings, Hero banners, Art Gallery curation, Coupons, and Financial payout logs.'
        ]
      },
      {
        title: 'Accessing the Shipping Desk',
        description: 'Warehouse personnel can log in at /admin/login by selecting "Shipping Personnel Login". Upon entering their name and passcode, they are instantly redirected to the specialized "GiftArt Logistics Shipping Desk".'
      }
    ]
  },
  {
    id: 'art-gallery',
    title: '5. Art Gallery Platform & Artist Curation',
    badge: 'New Feature & Curation',
    icon: Palette,
    color: 'from-rose-600 to-red-600',
    summary: 'Administering independent artist applications, setting login credentials, reviewing artist artwork submissions, and holding exclusive control over public selling prices.',
    tags: ['art gallery', 'artist', 'artworks', 'suggested price', 'admin price', 'approve artist', 'publish art'],
    steps: [
      {
        title: 'Artist Registration Review & Granting Login Access',
        description: 'Independent artists apply to sell their original artworks at /art-gallery/register. As an admin:',
        bullets: [
          'Step 1: Go to "Art Gallery" (/admin/art-gallery) in the admin sidebar.',
          'Step 2: On the "Artist Applications" tab, view pending artists.',
          'Step 3: Review their Bio, City, Artistic Medium (Acrylic, Oil, Resin, etc.), Portfolio URL, Instagram handle, and sample artwork photos.',
          'Step 4: Click "Approve & Set Password". Enter their designated login email and set a temporary or approved password.',
          'Step 5: The artist can now log into their dedicated Artist Studio Portal at /art-gallery/artist-portal!'
        ],
        tip: 'If an applicant does not meet gallery standards, click "Reject Application". They will not be able to upload artwork.',
        actionLink: { label: 'Go to Art Gallery Admin', href: '/admin/art-gallery' }
      },
      {
        title: 'Artist Artwork Uploads (Artist Studio Portal)',
        description: 'Approved artists log into /art-gallery/artist-portal to submit original artworks. They enter artwork title, medium, dimensions, high-res photos, and their "Suggested Price".',
        warning: 'Artworks uploaded by artists NEVER go live immediately! They are automatically saved with status: "pending_review" until you approve them.'
      },
      {
        title: 'Admin Price Override & Final Publishing (Strict Admin Control)',
        description: 'As requested, the artist only provides a suggested price. YOU have 100% exclusive authority to decide the actual public selling price:',
        bullets: [
          'Step 1: In /admin/art-gallery, switch to the "Artwork Review & Curation" tab.',
          'Step 2: Click on any pending artwork to review its high-res images, medium, dimensions, and artist’s suggested price.',
          'Step 3: In the "Set Final Selling Price (₹)" field, enter your approved store price (you can keep the artist’s price or increase/decrease it to account for commission/shipping).',
          'Step 4: Click "Publish to Live Gallery".',
          'Step 5: The artwork is now instantly visible to customers at /art-gallery and /art-gallery/[id] with the verified artist profile badge!'
        ],
        tip: 'If an artwork is sold or temporarily removed, you can toggle "Mark as Sold Out" or click "Unpublish" anytime from the admin panel.'
      }
    ]
  },
  {
    id: 'banners',
    title: '6. Hero Banners & Homepage Merchandising',
    badge: 'Marketing & UI',
    icon: ImageIcon,
    color: 'from-violet-600 to-purple-600',
    summary: 'Adding and managing homepage rotating banner slides with 5-second auto-transitions, category sliders, and homepage video integration.',
    tags: ['banner', 'homepage', 'slider', '5 seconds', 'carousel', 'video', 'category slider'],
    steps: [
      {
        title: 'Adding Hero Banner Slides with Auto-Rotation',
        description: 'Go to "/admin/banners" in the admin panel:',
        bullets: [
          'Step 1: Click "+ Add New Banner Slide".',
          'Step 2: Enter the Image URL (high-res horizontal banner, recommended 1920x800px).',
          'Step 3: Enter Headline (e.g. "Crafted with Love, Personalized for You"), Sub-heading, and Button Link (e.g. "/shop/personalized-gifts").',
          'Step 4: Submit! The banner is immediately added to the live homepage carousel.',
          '⏱️ Auto-Transition: The homepage banner slides automatically rotate every 5 seconds. Users can also click the left/right arrow buttons or slide indicators.'
        ],
        actionLink: { label: 'Go to Banners Manager', href: '/admin/banners' }
      },
      {
        title: 'Homepage Category Horizontal Slider',
        description: 'The homepage "Shop By Category" section has been upgraded into a smooth horizontal slider. Shoppers can use the left and right arrow buttons to scroll through all categories (DIY, Combos, Corporate Gifts, Wall Clocks, Small Bags, Big Bags, Laptop Sleeves, Tumblers, Travelling, etc.).'
      },
      {
        title: 'Homepage Video Showcase Section',
        description: 'A dedicated video showcase section is integrated on the homepage to feature product reels, unboxing videos, and customer reviews. You can update the featured video links anytime.'
      }
    ]
  },
  {
    id: 'analytics',
    title: '7. Customer Analytics & Link Click Tracking',
    badge: 'Growth & Metrics',
    icon: Users,
    color: 'from-sky-600 to-cyan-600',
    summary: 'Tracking total customer registrations, breaking down mobile vs email login users, and monitoring shared link clicks.',
    tags: ['analytics', 'customers', 'link clicks', 'tracking', 'mobile login', 'email login', 'visitors'],
    steps: [
      {
        title: 'Customer Registration Counters',
        description: 'On "/admin/dashboard", view live audience metrics:',
        bullets: [
          '👥 Total Registered Customers: Real-time count of every user who has signed up or purchased on the platform.',
          '📱 Mobile Number Logins: Track how many shoppers authenticated using their mobile OTP.',
          '✉️ Email ID Logins: Track how many users registered via traditional email credentials.'
        ],
        actionLink: { label: 'Go to Dashboard', href: '/admin/dashboard' }
      },
      {
        title: 'Website Link Click Tracking',
        description: 'When sharing links on WhatsApp, Instagram, or Facebook campaigns, the link click tracker records every visitor hit. View total link clicks and visitor engagement trends in the Analytics card on the Dashboard.'
      }
    ]
  },
  {
    id: 'finance-coupons',
    title: '8. Coupons, Razorpay Payments & RTO',
    badge: 'Payments & Returns',
    icon: CreditCard,
    color: 'from-emerald-600 to-green-600',
    summary: 'Managing promotional discount codes, verifying Razorpay transactions, and managing Return to Origin (RTO) cases.',
    tags: ['coupons', 'discount', 'razorpay', 'payments', 'rto', 'returns', 'refund'],
    steps: [
      {
        title: 'Creating Discount Coupons',
        description: 'Go to "/admin/coupons" to create promotional offers:',
        bullets: [
          'Coupon Code: Enter a clean uppercase code (e.g. "FIRST10", "DIWALI100").',
          'Discount Type: Choose Percentage (e.g. 10% off) or Flat Amount (e.g. ₹100 off).',
          'Minimum Cart Value: Set minimum cart requirement (e.g. ₹499).',
          'Expiry Date: Schedule an automatic expiration timestamp.'
        ],
        actionLink: { label: 'Go to Coupons', href: '/admin/coupons' }
      },
      {
        title: 'Razorpay Payment Verification',
        description: 'Every online prepaid order is synchronized with Razorpay. Under "/admin/payments", inspect Razorpay Payment IDs, Order IDs, and status (Captured / Authorized / Failed) to reconcile bank deposits.',
        actionLink: { label: 'Go to Payments', href: '/admin/payments' }
      },
      {
        title: 'RTO (Return to Origin) & Damaged Replacements',
        description: 'If a parcel is returned due to incorrect customer address or courier delivery failure, log it under "/admin/rto". You can initiate customer contact, verify correct address, and re-dispatch with a new tracking AWB.',
        actionLink: { label: 'Go to RTO Desk', href: '/admin/rto' }
      }
    ]
  },
  {
    id: 'seo-social',
    title: '9. SEO & Social Preview Configuration',
    badge: 'Organic Search',
    icon: SearchCheck,
    color: 'from-indigo-600 to-blue-600',
    summary: 'Customizing search engine meta titles, descriptions, and OpenGraph social sharing preview images for WhatsApp and Facebook.',
    tags: ['seo', 'meta', 'google', 'whatsapp preview', 'title', 'keywords'],
    steps: [
      {
        title: 'Configuring Global Store SEO',
        description: 'Under "/admin/seo", customize the default website meta title (e.g. "GiftArtStudio | Magical Personalized Gifts & Handcrafted Decor") and meta description so your site ranks high on Google Search.',
        actionLink: { label: 'Go to SEO Settings', href: '/admin/seo' }
      },
      {
        title: 'Social Share Cards (OpenGraph Preview)',
        description: 'Upload your social preview card image. When anyone shares your website link on WhatsApp, Instagram, or Twitter, this high-resolution banner image and description will appear automatically.'
      }
    ]
  }
];

export default function AdminManualPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChapterId, setActiveChapterId] = useState<string>('roles');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Live Simulator States
  const [simBasePrice, setSimBasePrice] = useState<number>(599);
  const [simColorPrice, setSimColorPrice] = useState<number>(100);
  const [simGstType, setSimGstType] = useState<'percent' | 'flat'>('percent');
  const [simGstValue, setSimGstValue] = useState<number>(18);
  const [simSelectedColor, setSimSelectedColor] = useState<string>('Candy Pink');
  const [simOrderStatus, setSimOrderStatus] = useState<string>('Processing');
  const [simArtSuggested, setSimArtSuggested] = useState<number>(2500);
  const [simArtFinal, setSimArtFinal] = useState<number>(3200);

  // Filtered chapters based on search
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return CHAPTERS;
    const q = searchQuery.toLowerCase().trim();
    return CHAPTERS.filter(c => 
      c.title.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q)) ||
      c.steps.some(s => 
        s.title.toLowerCase().includes(q) || 
        s.description.toLowerCase().includes(q) ||
        (s.bullets && s.bullets.some(b => b.toLowerCase().includes(q)))
      )
    );
  }, [searchQuery]);

  const activeChapter = useMemo(() => {
    return CHAPTERS.find(c => c.id === activeChapterId) || CHAPTERS[0];
  }, [activeChapterId]);

  const toggleStep = (stepKey: string) => {
    setExpandedSteps(prev => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast({ title: "Copied to Clipboard", description: `Copied ${label} successfully.` });
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Math for Simulator 1
  const simSubtotal = simBasePrice + simColorPrice;
  const simGstAmount = simGstType === 'percent' 
    ? Math.round((simSubtotal * simGstValue) / 100) 
    : simGstValue;
  const simFinalTotal = simSubtotal + simGstAmount;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:max-w-none">
      
      {/* Top Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-10 text-white shadow-xl border border-white/10"
      >
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wider text-purple-200 border border-white/10">
              <BookOpen className="w-3.5 h-3.5 text-purple-300" />
              <span>OFFICIAL ADMIN USER MANUAL &amp; OPERATIONAL HANDBOOK</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              GiftArtStudio Admin Master Manual
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Step-by-step interactive visual instructions for managing the entire website: colour variant photos, custom prices, per-product GST, shipping staff access, hero banners, and the Art Gallery curation portal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-2xl gap-2 font-bold text-xs h-11 px-4 backdrop-blur-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </Button>
            <a
              href="#interactive-simulators"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xs px-4 h-11 rounded-2xl shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Practice Simulator
            </a>
          </div>
        </div>

        {/* Search Bar Inside Banner */}
        <div className="mt-8 relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search instructions (e.g. 'How to add color photos', 'Set GST', 'Artist pricing', 'Shipping login')..."
            className="w-full bg-white/10 border border-white/20 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-md transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-200 bg-white/20 px-2 py-0.5 rounded-full hover:bg-white/30"
            >
              Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* Chapter Selection Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CHAPTERS.map((ch) => {
          const Icon = ch.icon;
          const isSelected = activeChapterId === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => {
                setActiveChapterId(ch.id);
                setSearchQuery('');
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all border shrink-0",
                isSelected
                  ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20 scale-[1.02]"
                  : "bg-white text-slate-700 border-slate-200 hover:border-purple-200 hover:bg-purple-50/50"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-purple-600")} />
              <span>{ch.title.split('. ')[1] || ch.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Navigation / Details & Right Detailed Walkthrough */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Chapters Quick Directory */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Chapters Index</span>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {CHAPTERS.length} Guides
              </span>
            </div>

            <div className="space-y-1.5 mt-3 max-h-[650px] overflow-y-auto scrollbar-hide pr-1">
              {filteredChapters.map((ch) => {
                const Icon = ch.icon;
                const isSelected = activeChapterId === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChapterId(ch.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 border group",
                      isSelected
                        ? "bg-purple-50/80 border-purple-200 shadow-sm"
                        : "border-transparent hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      isSelected ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-600"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn(
                          "text-xs font-bold truncate",
                          isSelected ? "text-purple-950 font-extrabold" : "text-slate-800"
                        )}>
                          {ch.title}
                        </span>
                        <ChevronRight className={cn(
                          "w-3.5 h-3.5 shrink-0 transition-transform",
                          isSelected ? "text-purple-600 translate-x-0.5" : "text-slate-300 group-hover:text-slate-400"
                        )} />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {ch.summary}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredChapters.length === 0 && (
                <div className="p-6 text-center space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No matching topic found</p>
                  <p className="text-[11px] text-slate-400">Try searching for &quot;GST&quot;, &quot;Color&quot;, or &quot;Artist&quot;</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-bold text-purple-600 underline pt-1"
                  >
                    Reset Search
                  </button>
                </div>
              )}
            </div>

            {/* Quick Contact / Support Note */}
            <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
              <p className="text-[11px] font-bold text-slate-700">Need immediate tech support?</p>
              <p className="text-[10px] text-slate-400">Contact Developer or check the live logs on the Dashboard.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Active Chapter Full Content & Animated Steps */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChapter.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
            >
              {/* Chapter Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                    <Sparkles className="w-3 h-3" />
                    <span>{activeChapter.badge}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {activeChapter.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {activeChapter.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allKeys: Record<string, boolean> = {};
                      activeChapter.steps.forEach((_, idx) => {
                        allKeys[`${activeChapter.id}-${idx}`] = true;
                      });
                      setExpandedSteps(prev => ({ ...prev, ...allKeys }));
                    }}
                    className="rounded-xl text-[11px] font-bold h-8 text-slate-600"
                  >
                    Expand All
                  </Button>
                </div>
              </div>

              {/* Step by Step Breakdown */}
              <div className="space-y-4">
                {activeChapter.steps.map((step, idx) => {
                  const stepKey = `${activeChapter.id}-${idx}`;
                  const isExpanded = expandedSteps[stepKey] ?? true;

                  return (
                    <motion.div
                      key={idx}
                      layout
                      className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all hover:border-purple-200"
                    >
                      {/* Step Header Accordion Trigger */}
                      <button
                        onClick={() => toggleStep(stepKey)}
                        className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {idx + 1}
                          </div>
                          <span className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                            {step.title}
                          </span>
                        </div>
                        <ChevronDown className={cn(
                          "w-4 h-4 text-slate-400 transition-transform shrink-0",
                          isExpanded && "rotate-180"
                        )} />
                      </button>

                      {/* Step Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-600 border-t border-slate-100 bg-white"
                          >
                            <p className="leading-relaxed font-normal text-slate-700">
                              {step.description}
                            </p>

                            {/* Bullets if any */}
                            {step.bullets && step.bullets.length > 0 && (
                              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                                {step.bullets.map((bullet, bIdx) => (
                                  <div key={bIdx} className="flex items-start gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed text-slate-700 font-medium">
                                      {bullet}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Tip Alert */}
                            {step.tip && (
                              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900">
                                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs leading-relaxed">
                                  <span className="font-extrabold text-amber-800">Pro Tip: </span>
                                  {step.tip}
                                </div>
                              </div>
                            )}

                            {/* Warning Alert */}
                            {step.warning && (
                              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-rose-900">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div className="text-xs leading-relaxed">
                                  <span className="font-extrabold text-rose-800">Important Warning: </span>
                                  {step.warning}
                                </div>
                              </div>
                            )}

                            {/* Quick Action Link */}
                            {step.actionLink && (
                              <div className="pt-2">
                                <Link
                                  href={step.actionLink.href}
                                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl transition-colors"
                                >
                                  <span>{step.actionLink.label}</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {/* Chapter Footer Navigation */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Chapter {CHAPTERS.findIndex(c => c.id === activeChapter.id) + 1} of {CHAPTERS.length}
                </span>

                <div className="flex items-center gap-2">
                  {(() => {
                    const currentIndex = CHAPTERS.findIndex(c => c.id === activeChapter.id);
                    const prevChapter = CHAPTERS[currentIndex - 1];
                    const nextChapter = CHAPTERS[currentIndex + 1];

                    return (
                      <>
                        {prevChapter && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveChapterId(prevChapter.id)}
                            className="rounded-xl text-xs font-bold h-9"
                          >
                            ← Previous
                          </Button>
                        )}
                        {nextChapter && (
                          <Button
                            size="sm"
                            onClick={() => setActiveChapterId(nextChapter.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold h-9"
                          >
                            Next Chapter →
                          </Button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* SECTION: Interactive Practice Simulators & Sandboxes */}
      <div id="interactive-simulators" className="pt-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold tracking-wider">
              <Play className="w-3 h-3 text-purple-600" />
              <span>HANDS-ON PRACTICE SANDBOX</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Interactive Admin Live Simulators
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Test out how colour variant prices, GST mathematics, order stages, and artist curation behave in real time before applying them to your live store!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* SIMULATOR 1: Product Variant & GST Calculator */}
          <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                  Simulator #1
                </span>
                <Sliders className="w-4 h-4 text-purple-600" />
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Colour Variant &amp; GST Calculator
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust base price, choose custom colour price, and watch the final customer total calculate live.
                </p>
              </div>

              {/* Controls */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Base Product Price (₹)
                  </label>
                  <input
                    type="number"
                    value={simBasePrice}
                    onChange={(e) => setSimBasePrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Select Colour &amp; Premium Extra (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={simSelectedColor}
                      onChange={(e) => {
                        setSimSelectedColor(e.target.value);
                        if (e.target.value === 'Metallic Gold') setSimColorPrice(150);
                        else if (e.target.value === 'Matte Black') setSimColorPrice(50);
                        else setSimColorPrice(0);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Candy Pink">Candy Pink (+₹0)</option>
                      <option value="Matte Black">Matte Black (+₹50)</option>
                      <option value="Metallic Gold">Metallic Gold (+₹150)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    GST Rate ({simGstType === 'percent' ? '%' : '₹'})
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={simGstType}
                      onChange={(e) => setSimGstType(e.target.value as any)}
                      className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800"
                    >
                      <option value="percent">Percent (%)</option>
                      <option value="flat">Fixed (₹)</option>
                    </select>
                    <input
                      type="number"
                      value={simGstValue}
                      onChange={(e) => setSimGstValue(Number(e.target.value) || 0)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 space-y-2 mt-4">
              <div className="text-[10px] font-black uppercase tracking-wider text-purple-700">
                Customer Checkout Breakdown
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Product Base:</span>
                <span className="font-bold">₹{simBasePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Colour Extra ({simSelectedColor}):</span>
                <span className="font-bold">+₹{simColorPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-purple-700">
                <span>GST ({simGstType === 'percent' ? `${simGstValue}%` : `₹${simGstValue}`}):</span>
                <span className="font-bold">+₹{simGstAmount.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-purple-200 flex justify-between text-sm font-black text-slate-900">
                <span>Customer Pays:</span>
                <span className="text-purple-700">₹{simFinalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* SIMULATOR 2: Order Status Pipeline */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Simulator #2
                </span>
                <Truck className="w-4 h-4 text-emerald-600" />
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  5-Stage Order Dispatch Flow
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click through the stages to simulate how warehouse dispatch works and what tracking details look like.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                {['Pending', 'Processing', 'Shipped', 'Delivered'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSimOrderStatus(st)}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center",
                      simOrderStatus === st
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 space-y-2 mt-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-emerald-800">
                <span>Live State: {simOrderStatus}</span>
                <span className="text-[9px] bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                  AWB: GAS-BLUEDART-88219
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {simOrderStatus === 'Pending' && 'Order received and verified. Ready for personalization printing.'}
                {simOrderStatus === 'Processing' && 'Item is being engraved with customer name "AARAV" and packed.'}
                {simOrderStatus === 'Shipped' && 'Handed over to BlueDart. Customer notified with live tracking link.'}
                {simOrderStatus === 'Delivered' && 'Order confirmed delivered by courier. Transaction complete!'}
              </p>
              <div className="pt-2 border-t border-emerald-200 text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                <span>Tracking Portal Sync:</span>
                <span className="text-emerald-700">/track-order Active ✓</span>
              </div>
            </div>
          </div>

          {/* SIMULATOR 3: Art Gallery Pricing Override */}
          <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                  Simulator #3
                </span>
                <Palette className="w-4 h-4 text-rose-600" />
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Art Gallery Pricing Authority
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  The artist suggests a price, but you set the final store price to maintain gallery standards.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Artist Suggested Price (₹)
                  </label>
                  <input
                    type="number"
                    value={simArtSuggested}
                    onChange={(e) => setSimArtSuggested(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Admin Approved Final Price (₹)
                  </label>
                  <input
                    type="number"
                    value={simArtFinal}
                    onChange={(e) => setSimArtFinal(Number(e.target.value) || 0)}
                    className="w-full bg-rose-50/60 border border-rose-300 rounded-xl px-3 py-2 text-xs font-black text-rose-800 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 space-y-2 mt-4">
              <div className="text-[10px] font-black uppercase tracking-wider text-rose-700">
                Public Art Gallery Display
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Artist Asks:</span>
                <span className="line-through text-slate-400">₹{simArtSuggested.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-extrabold text-rose-900">
                <span>Final Gallery Price:</span>
                <span className="text-sm font-black text-rose-700">₹{simArtFinal.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-rose-200 text-[10px] text-rose-700 font-bold">
                ✓ Admin exclusive pricing rule active
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION: Frequently Asked Questions & Rapid Troubleshooting */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-bold tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>RAPID TROUBLESHOOTING &amp; FAQ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Common Admin Questions Answered
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              How do I temporarily hide an out-of-stock product?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Don’t delete the product! Edit the product in /admin/products and switch Stock Status to &quot;Out of Stock&quot;. The product will still be indexed on search engines, but customers won’t be able to buy it until you restock.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              Why did an artist say they cannot upload artworks?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Check /admin/art-gallery on the &quot;Artist Applications&quot; tab. If their status is still &quot;Pending Approval&quot;, you must review their application and click &quot;Approve &amp; Set Password&quot; to authorize their upload privileges.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              Can the shipping team change product prices?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              No. Shipping Personnel are locked strictly to the Orders desk. All product catalog, pricing, banner, and coupon controls are inaccessible in shipping mode.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              How do I make the homepage banners change automatically?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Once you add 2 or more banner slides in /admin/banners, the homepage carousel automatically transitions every 5 seconds. Shoppers can also pause or swipe slides manually.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
