import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { CarViewer } from '@/components/3D/CarViewer'
import { FadeInUp, ParallaxElement } from '@/components/Animation/ScrollController'
import { getCarByUID, getOptimizedImageUrl, formatPrice } from '@/lib/prismic'
import { CarModel } from '@/types'

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { uid: string } }): Promise<Metadata> {
  try {
    const car = await getCarByUID(params.uid)

    if (!car) {
      return {
        title: 'Car Not Found',
        description: 'The requested car could not be found.'
      }
    }

    const carName = `${car.data.car_name} ${car.data.model_year}`
    const description = car.data.description
      ? (typeof car.data.description === 'string' ? car.data.description : 'Explore this premium vehicle in stunning 3D detail.')
      : `Explore the ${carName} from ${car.data.brand} in our interactive 3D showroom.`

    return {
      title: `${carName} | 3D Car Showroom`,
      description,
      keywords: [
        car.data.car_name,
        car.data.brand,
        car.data.car_type,
        '3D model',
        'interactive',
        'car showroom',
        `${car.data.model_year}`
      ].filter(Boolean),
      openGraph: {
        title: `${carName} | 3D Car Showroom`,
        description,
        images: [
          {
            url: getOptimizedImageUrl(car.data.model_thumbnail, 1200, 630),
            width: 1200,
            height: 630,
            alt: carName,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${carName} | 3D Car Showroom`,
        description,
        images: [getOptimizedImageUrl(car.data.model_thumbnail)],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Car Details | 3D Car Showroom',
      description: 'Explore this premium vehicle in stunning 3D detail.'
    }
  }
}

// Breadcrumb component
function Breadcrumbs({ car }: { car: CarModel }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <a href="/" className="hover:text-blue-600 transition-colors">Home</a>
      <span>/</span>
      <a href="/browse" className="hover:text-blue-600 transition-colors">Cars</a>
      <span>/</span>
      <a href={`/browse?brand=${car.brand}`} className="hover:text-blue-600 transition-colors">
        {car.brand}
      </a>
      <span>/</span>
      <span className="text-gray-900 font-medium">{car.name}</span>
    </nav>
  )
}

// Specification display component
function Specifications({ car }: { car: CarModel }) {
  const specs = [
    { label: 'Brand', value: car.brand },
    { label: 'Model Year', value: car.modelYear.toString() },
    { label: 'Car Type', value: car.carType },
    { label: 'Price Category', value: car.priceCategory },
    { label: 'Transmission', value: car.transmission },
    { label: 'Engine Type', value: car.engineType },
    { label: 'Horsepower', value: car.horsepower ? `${car.horsepower} HP` : 'N/A' },
    { label: '0-60 mph', value: car.zeroToSixty ? `${car.zeroToSixty}s` : 'N/A' },
    { label: 'Fuel Efficiency', value: car.fuelEfficiency ? `${car.fuelEfficiency} MPG` : 'N/A' },
  ].filter(spec => spec.value !== undefined && spec.value !== 'N/A')

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Specifications</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {specs.map((spec, index) => (
          <div key={index} className="flex justify-between py-3 border-b border-gray-200 last:border-0">
            <span className="text-gray-600">{spec.label}</span>
            <span className="font-medium text-gray-900">{spec.value}</span>
          </div>
        ))}
      </div>

      {/* Dimensions */}
      {car.dimensions && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Dimensions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {car.dimensions.length && (
              <div className="flex justify-between">
                <span className="text-gray-600">Length</span>
                <span className="font-medium text-gray-900">{car.dimensions.length}"</span>
              </div>
            )}
            {car.dimensions.width && (
              <div className="flex justify-between">
                <span className="text-gray-600">Width</span>
                <span className="font-medium text-gray-900">{car.dimensions.width}"</span>
              </div>
            )}
            {car.dimensions.height && (
              <div className="flex justify-between">
                <span className="text-gray-600">Height</span>
                <span className="font-medium text-gray-900">{car.dimensions.height}"</span>
              </div>
            )}
            {car.weight && (
              <div className="flex justify-between">
                <span className="text-gray-600">Weight</span>
                <span className="font-medium text-gray-900">{car.weight.toLocaleString()} lbs</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Contact form component
function ContactForm({ car }: { car: CarModel }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Request Information</h3>
      <form className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder={`I'm interested in learning more about the ${car.name}...`}
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send Request
          </button>
          <button
            type="button"
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Schedule Test Drive
          </button>
        </div>
      </form>
    </div>
  )
}

// Photo gallery component
function PhotoGallery({ car }: { car: CarModel }) {
  if (!car.photoGallery || car.photoGallery.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Photo Gallery</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {car.photoGallery.map((photo, index) => (
          <div key={index} className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer">
            <img
              src={photo}
              alt={`${car.name} - Photo ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Color options component
function ColorOptions({ car }: { car: CarModel }) {
  if (!car.colorOptions || car.colorOptions.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Available Colors</h3>
      <div className="flex flex-wrap gap-4">
        {car.colorOptions.map((color, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-inner"
              style={{ backgroundColor: color.hexCode }}
              title={color.colorName}
            />
            <span className="text-sm text-gray-700">{color.colorName}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main car detail page component
async function CarDetailPage({ params }: { params: { uid: string } }) {
  try {
    const prismicCar = await getCarByUID(params.uid)

    if (!prismicCar) {
      notFound()
    }

    // Transform Prismic data to our CarModel type
    const car: CarModel = {
      id: prismicCar.id,
      uid: prismicCar.uid,
      name: prismicCar.data.car_name,
      brand: prismicCar.data.brand,
      carType: prismicCar.data.car_type,
      priceCategory: prismicCar.data.price_category,
      modelYear: prismicCar.data.model_year,
      price: prismicCar.data.price,
      description: prismicCar.data.description
        ? (typeof prismicCar.data.description === 'string' ? prismicCar.data.description : '')
        : undefined,
      modelFile: prismicCar.data.model_file.url || '/models/default-car.glb',
      modelThumbnail: getOptimizedImageUrl(prismicCar.data.model_thumbnail),
      alternateViews: prismicCar.data.alternate_views?.map(view => view.view_image.url).filter(Boolean),
      photoGallery: prismicCar.data.photo_gallery?.map(photo => photo.image.url).filter(Boolean),
      videoUrl: prismicCar.data.video_url?.url,
      brochurePdf: prismicCar.data.brochure_pdf?.url,
      engineType: prismicCar.data.engine_type,
      horsepower: prismicCar.data.horsepower,
      zeroToSixty: prismicCar.data.zero_to_sixty,
      fuelEfficiency: prismicCar.data.fuel_efficiency,
      transmission: prismicCar.data.transmission,
      dimensions: {
        length: prismicCar.data.dimensions?.length,
        width: prismicCar.data.dimensions?.width,
        height: prismicCar.data.dimensions?.height,
      },
      weight: prismicCar.data.weight,
      seatingCapacity: prismicCar.data.seating_capacity,
      colorOptions: prismicCar.data.color_options?.map(color => ({
        colorName: color.color_name,
        hexCode: color.hex_code,
      })),
      metaTitle: prismicCar.data.meta_title,
      metaDescription: prismicCar.data.meta_description,
      featured: prismicCar.data.featured,
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section with 3D Model */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16">
          <div className="container mx-auto px-6">
            <FadeInUp>
              <Breadcrumbs car={car} />
            </FadeInUp>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <FadeInUp delay={0.2}>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {car.name}
                  </h1>
                  <p className="text-xl text-blue-200 mb-2">
                    {car.brand} • {car.modelYear}
                  </p>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-3xl font-bold text-blue-400">
                      {formatPrice(car.price)}
                    </span>
                    <span className="px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full text-sm">
                      {car.carType}
                    </span>
                    <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm">
                      {car.priceCategory}
                    </span>
                  </div>

                  {car.description && (
                    <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                      {car.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                      Schedule Test Drive
                    </button>
                    <button className="px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-lg backdrop-blur-sm hover:bg-white/10 transition-colors">
                      Download Brochure
                    </button>
                  </div>
                </div>
              </FadeInUp>

              <FadeInUp delay={0.4}>
                <div className="h-[600px] rounded-xl overflow-hidden">
                  <CarViewer
                    car={car}
                    autoRotate={true}
                    showControls={true}
                    enableFullscreen={true}
                  />
                </div>
              </FadeInUp>
            </div>
          </div>
        </section>

        {/* Details Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <FadeInUp>
                  <Specifications car={car} />
                </FadeInUp>

                {car.colorOptions && car.colorOptions.length > 0 && (
                  <FadeInUp delay={0.2}>
                    <ColorOptions car={car} />
                  </FadeInUp>
                )}

                {car.photoGallery && car.photoGallery.length > 0 && (
                  <FadeInUp delay={0.4}>
                    <PhotoGallery car={car} />
                  </FadeInUp>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                <FadeInUp delay={0.3}>
                  <ContactForm car={car} />
                </FadeInUp>

                {/* Quick Stats */}
                <FadeInUp delay={0.5}>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Stats</h3>
                    <div className="space-y-4">
                      {car.horsepower && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{car.horsepower}</div>
                          <div className="text-sm text-gray-600">Horsepower</div>
                        </div>
                      )}
                      {car.zeroToSixty && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{car.zeroToSixty}s</div>
                          <div className="text-sm text-gray-600">0-60 mph</div>
                        </div>
                      )}
                      {car.seatingCapacity && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{car.seatingCapacity}</div>
                          <div className="text-sm text-gray-600">Seats</div>
                        </div>
                      )}
                    </div>
                  </div>
                </FadeInUp>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  } catch (error) {
    console.error('Error loading car details:', error)
    notFound()
  }
}

export default function Page({ params }: { params: { uid: string } }) {
  return (
    <Suspense fallback={<div>Loading car details...</div>}>
      <CarDetailPage params={params} />
    </Suspense>
  )
}

// Import Suspense for async component handling
import { Suspense } from 'react'