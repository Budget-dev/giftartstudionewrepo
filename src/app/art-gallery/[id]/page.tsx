import ArtworkClient from './artwork-client';

export function generateStaticParams() {
  return [
    { id: 'seed-art-1' },
    { id: 'seed-art-2' },
    { id: 'seed-art-3' },
  ];
}

export default async function ArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArtworkClient id={id} />;
}
