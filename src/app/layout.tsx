import { Inter, Space_Grotesk } from 'next/font/google'
import type { Metadata } from 'next'
import { ScrollController } from '@/components/Animation/ScrollController'
import { ErrorBoundary } from '@/components/UI/ErrorBoundary'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: {
    default: '3D Car Showroom - Interactive Automotive Experience',
    template: '%s | 3D Car Showroom'
  },
  description: 'Experience the future of car shopping with our interactive 3D showroom. Explore luxury vehicles in stunning detail with advanced 3D visualization.',
  keywords: ['cars', '3D models', 'automotive', 'showroom', 'luxury cars', 'interactive', 'virtual'],
  authors: [{ name: '3D Car Showroom' }],
  creator: '3D Car Showroom',
  publisher: '3D Car Showroom',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: '3D Car Showroom - Interactive Automotive Experience',
    description: 'Experience the future of car shopping with our interactive 3D showroom.',
    siteName: '3D Car Showroom',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '3D Car Showroom',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3D Car Showroom - Interactive Automotive Experience',
    description: 'Experience the future of car shopping with our interactive 3D showroom.',
    images: ['/images/og-image.jpg'],
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://images.prismic.io" crossOrigin="" />

        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//cdn.prismic.io" />
        <link rel="dns-prefetch" href="//images.prismic.io" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AutomotiveBusiness",
              "name": "3D Car Showroom",
              "description": "Interactive 3D car showroom featuring luxury vehicles with advanced visualization technology",
              "url": process.env.NEXT_PUBLIC_SITE_URL,
              "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo.png`
              },
              "image": `${process.env.NEXT_PUBLIC_SITE_URL}/images/og-image.jpg`,
              "sameAs": [
                "https://twitter.com/3dcarshowroom",
                "https://instagram.com/3dcarshowroom"
              ],
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "US"
              },
              "openingHours": "Mo-Su 00:00-23:59",
              "priceRange": "$$-$$$$",
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Vehicle Collection",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Car",
                      "name": "Luxury Vehicles",
                      "vehicleConfiguration": "3D Interactive Showroom"
                    }
                  }
                ]
              }
            })
          }}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background text-foreground`}>
        <ErrorBoundary>
          <ScrollController>
            {children}
          </ScrollController>
        </ErrorBoundary>
      </body>
    </html>
  )
}