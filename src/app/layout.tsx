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
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <ScrollController>
          {children}
        </ScrollController>
      </body>
    </html>
  )
}