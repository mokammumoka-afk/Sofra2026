import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://sofra.ly'),
  title: {
    default: 'سفرة - أول منصة تواصل وسوق للأكل المنزلي في ليبيا 🇱🇾',
    template: '%s | سفرة ليبيا',
  },
  description:
    'أطلُب أشهى الوجبات المنزلية والأطباق الشعبية (رشدة، بازين، مبكبكة، تورتات، حلويات) مباشرة من أشهر الشيفات في طرابلس، بنغازي، مصراتة وباقي المدن الليبية مع التوصيل الحي والضمان الضمني Escrow.',
  keywords: [
    'طبخ منزلي ليبيا',
    'شيفات طرابلس',
    'أكل منزلي بنغازي',
    'وجبات شعبية مصراتة',
    'رشدة كسكاس بالمصران',
    'تورتات بوكسات طرابلس',
    'حلويات ليبية معسلة',
    'توصيل طلبك دروبي express',
    'سفرة ليبيا',
    'Sofra Libya Food',
  ],
  authors: [{ name: 'منصة سفرة - Sofra Libya' }],
  creator: 'Sofra Libya Platform',
  publisher: 'Sofra Libya Platform',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'سفرة ليبيا',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_LY',
    url: 'https://sofra.ly',
    title: 'سفرة - أول منصة تواصل وسوق للأكل المنزلي في ليبيا 🇱🇾',
    description:
      'تصفح وجبات أسرع الشيفات الموثقين في طرابلس، بنغازي ومصراتة، واطلب وجباتك المفضلة محددة بالقطعة أو البوكس الكامل مع حماية الدفع الضمني Escrow.',
    siteName: 'سفرة (Sofra Libya)',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&h=630&q=80',
        width: 1200,
        height: 630,
        alt: 'سفرة - سوق الطعام المنزلي والشيفات الموثقين في ليبيا',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سفرة - أول منصة تواصل وسوق للأكل المنزلي في ليبيا 🇱🇾',
    description: 'طلب الوجبات المنزلية، الأطباق الشعبية والتورتات من أفضل الشيفات الموثقين في ليبيا.',
    images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&h=630&q=80'],
  },
  alternates: {
    canonical: 'https://sofra.ly',
    languages: {
      'ar-LY': 'https://sofra.ly',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Schema.org Structured Data (FoodEstablishment & Marketplace)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: 'سفرة (Sofra Libya)',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&h=630&q=80',
    '@id': 'https://sofra.ly/#organization',
    url: 'https://sofra.ly',
    telephone: '+218910000000',
    priceRange: '5 LYD - 350 LYD',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'شارع عمر المختار',
      addressLocality: 'طرابلس',
      addressRegion: 'طرابلس الكبرى',
      addressCountry: 'LY',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 32.8872,
      longitude: 13.1913,
    },
    servesCuisine: ['Libyan', 'Homemade', 'Traditional', 'Pastries', 'Cakes'],
    areaServed: ['طرابلس', 'بنغازي', 'مصراتة', 'سبها', 'البيضاء', 'الزاوية', 'زليتن'],
    potentialAction: {
      '@type': 'OrderAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://sofra.ly/?tab=explore',
        inLanguage: 'ar-LY',
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
          'http://schema.org/IOSPlatform',
          'http://schema.org/AndroidPlatform',
        ],
      },
      deliveryMethod: ['http://purl.org/goodrelations/v1#DeliveryModeDirectDownload'],
    },
  };

  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body suppressHydrationWarning className="bg-[#faf7f2] text-stone-900 min-h-screen">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
