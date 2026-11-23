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
    { slug: ['adults', 'tumblers'] },
    // Corporate Gifts
    { slug: ['corporate-gifts', 'executive-sets'] },
    { slug: ['corporate-gifts', 'diaries-pens'] },
    { slug: ['corporate-gifts', 'drinkware'] },
    { slug: ['corporate-gifts', 'gift-boxes'] },
    // Return Gifts
    { slug: ['return-gifts', 'birthday-return-gifts'] },
    { slug: ['return-gifts', 'wedding-favors'] },
    { slug: ['return-gifts', 'party-favors'] },
    // Lifestyle
    { slug: ['lifestyle', 'bottles-tumblers'] },
    { slug: ['lifestyle', 'bags-organizers'] },
    { slug: ['lifestyle', 'wall-decor'] },
    { slug: ['lifestyle', 'wall-clocks'] },
    // Souvenirs
    { slug: ['souvenirs', 'custom-plaques'] },
    { slug: ['souvenirs', 'keychains'] },
    { slug: ['souvenirs', 'photo-frames'] },
    // Accessories
    { slug: ['accessories', 'travel-combo'] },
    { slug: ['accessories', 'gift-boxes'] },
    { slug: ['accessories', 'desk'] },
    { slug: ['accessories', 'bags'] },
    { slug: ['accessories', 'small-bags'] },
    { slug: ['accessories', 'big-bags'] },
    { slug: ['accessories', 'laptop-sleeves'] },
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
    { slug: ['kids', 'kids-gifts'] },
    { slug: ['kids', 'small-bags'] },
    { slug: ['kids', 'big-bags'] },
    { slug: ['personalized-gifts', 'corporate-gifts'] },
    { slug: ['personalized-gifts', 'wall-clocks'] },
    { slug: ['personalized-gifts', 'laptop-sleeves'] },
    { slug: ['personalized-gifts', 'diy'] },
    { slug: ['personalized-gifts', 'travelling'] },
    { slug: ['accessories', 'travelling'] },
    { slug: ['kids', 'travelling'] },
  ];
}

export default async function CatalogPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return <CatalogContent slug={slug || []} />;
}
