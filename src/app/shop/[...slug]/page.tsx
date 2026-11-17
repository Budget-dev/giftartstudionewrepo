import CatalogContent from './client';

export function generateStaticParams() {
  return [
    // Personalised
    { slug: ['personalized-gifts', 'mugs'] },
    { slug: ['personalized-gifts', 'bottles'] },
    { slug: ['personalized-gifts', 'passport-covers'] },
    { slug: ['personalized-gifts', 'laptop-bags'] },
    // Kids
    { slug: ['kids', 'bags'] },
    { slug: ['kids', 'water-bottles'] },
    { slug: ['kids', 'bottles'] },
    { slug: ['kids', 'lunch-boxes'] },
    { slug: ['kids', 'umbrellas'] },
    { slug: ['kids', 'combos'] },
    { slug: ['kids', 'stationery'] },
    { slug: ['kids', 'school-stationery'] },
    { slug: ['kids', 'night-lamps'] },
    { slug: ['kids', 'towels'] },
    // Adults
    { slug: ['adults', 'mens'] },
    { slug: ['adults', 'womens'] },
    { slug: ['adults', 'unisex'] },
    // Accessories
    { slug: ['accessories', 'travel-combo'] },
    { slug: ['accessories', 'gift-boxes'] },
    { slug: ['accessories', 'desk'] },
    { slug: ['accessories', 'bags'] },
    // New
    { slug: ['new', 'new-collection'] },
    { slug: ['new', 'new-launch'] },
    { slug: ['new', 'best-sellers'] },
    { slug: ['new', 'festive'] },
    { slug: ['new', 'sale'] },
    { slug: ['new', 'reels'] },
    { slug: ['kids', 'lifestyle'] },
    { slug: ['kids', 'toys'] },
    { slug: ['kids', 'hampers'] },
  ];
}

export default async function CatalogPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return <CatalogContent slug={slug || []} />;
}
