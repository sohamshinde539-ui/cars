import { Suspense } from 'react'
import { Hero } from '@/components/Sections/Hero'
import { CarGallery } from '@/components/Sections/CarGallery'
import { FadeInUp } from '@/components/Animation/ScrollController'
import { getAllFeaturedCars } from '@/lib/prismic'

// Loading component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-96 bg-gray-300 rounded-xl mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-80"></div>
        ))}
      </div>
    </div>
  )
}

// Features section
function FeaturesSection() {
  const features = [
    {
      title: 'Interactive 3D Models',
      description: 'Explore every angle with our advanced 3D visualization technology.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      title: 'Realistic Details',
      description: 'High-resolution models with accurate materials and lighting.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Expert Curation',
      description: 'Carefully selected collection of premium and luxury vehicles.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Virtual Test Drives',
      description: 'Experience the performance and features before making a decision.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <FadeInUp>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Showroom
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the future of automotive shopping with cutting-edge technology and curated excellence.
            </p>
          </div>
        </FadeInUp>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FadeInUp key={index} delay={index * 0.1}>
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// Newsletter section
function NewsletterSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <FadeInUp>
            <h2 className="text-4xl font-bold mb-4">
              Stay Updated
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Be the first to know about new arrivals, exclusive features, and special offers.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
              >
                Subscribe
              </button>
            </form>
          </FadeInUp>
        </div>
      </div>
    </section>
  )
}

// Main page component
async function HomePage() {
  // Fetch featured cars from Prismic
  let featuredCars = []
  try {
    featuredCars = await getAllFeaturedCars(6)
  } catch (error) {
    console.error('Error fetching featured cars:', error)
    // Continue with empty array - we'll show mock data in the gallery
  }

  return (
    <>
      <Hero />

      {/* Featured Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <FadeInUp>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Featured Vehicles
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore our handpicked selection of exceptional automobiles.
              </p>
            </div>
          </FadeInUp>

          <Suspense fallback={<LoadingSkeleton />}>
            {featuredCars.length > 0 ? (
              <CarGallery cars={featuredCars} itemsPerPage={6} />
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
                <p className="text-gray-600 mb-6">Our featured collection is being prepared. Check back soon!</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-100 rounded-xl p-6">
                      <div className="w-full h-32 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Suspense>
        </div>
      </section>

      <FeaturesSection />
      <NewsletterSection />
    </>
  )
}

export default function Page() {
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <HomePage />
      </Suspense>
    </main>
  )
}