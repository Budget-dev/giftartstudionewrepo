import ProductClient from './product-client';

export function generateStaticParams() {
  return [
    { id: '3WYhAtNTkUhvan5LN7Pf' },
    { id: '4u0cmhiO1dXZufaNKVF4' },
    { id: '5aKW7o1POfOVNytwkpVb' },
    { id: '5gkHuYsvDZNKAl7NOcFF' },
    { id: 'DK1sEUpHRtTYJdZWBH7z' },
    { id: 'FGkRHKtQQyveavUMvG02' },
    { id: 'FcDYQubtNdHB0yasxIO9' },
    { id: 'Gk6TyNI50oaMIpiL4Jia' },
    { id: 'KYROm3XP4Mbvi2An5ckZ' },
    { id: 'LFGlfSLDBOUnwm0dUtGo' },
  ];
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductClient id={id} />;
}
