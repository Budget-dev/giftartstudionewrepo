import CategoryLandingContent from './client';

export function generateStaticParams() {
  return [
    { categoryName: 'personalized-gifts' },
    { categoryName: 'kids' },
    { categoryName: 'adults' },
    { categoryName: 'accessories' },
    { categoryName: 'occasions' },
    { categoryName: 'decor' },
    { categoryName: 'corporate' },
    { categoryName: 'new' },
    { categoryName: 'festive' },
    { categoryName: 'best-sellers' },
    { categoryName: 'all' },
  ];
}

export default async function CategoryLandingPage({ params }: { params: Promise<{ categoryName: string }> }) {
  const { categoryName } = await params;
  return <CategoryLandingContent categoryName={categoryName} />;
}
