import { createClient } from '@prismicio/client'
import * as prismic from '@prismicio/client'

export const endpoint = prismic.getRepositoryName(process.env.PRISMIC_REPOSITORY_NAME!)

export const client = createClient(endpoint, {
  accessToken: process.env.PRISMIC_ACCESS_TOKEN,
})

// Type definitions for Prismic content
export interface CarModel {
  uid: string
  type: string
  lang: string
  url: string
  data: {
    car_name: prismic.TitleField
    brand: prismic.SelectField
    car_type: prismic.SelectField
    price_category: prismic.SelectField
    model_year: prismic.NumberField
    price: prismic.NumberField
    description?: prismic.RichTextField
    model_file: prismic.ImageField
    model_thumbnail: prismic.ImageField
    alternate_views?: {
      view_image: prismic.ImageField
    }[]
    photo_gallery?: {
      image: prismic.ImageField
    }[]
    video_url?: prismic.LinkField
    brochure_pdf?: prismic.ImageField
    engine_type?: prismic.TextField
    horsepower?: prismic.NumberField
    zero_to_sixty?: prismic.NumberField
    fuel_efficiency?: prismic.NumberField
    transmission?: prismic.SelectField
    dimensions?: {
      length?: prismic.NumberField
      width?: prismic.NumberField
      height?: prismic.NumberField
    }
    weight?: prismic.NumberField
    seating_capacity?: prismic.NumberField
    color_options?: {
      color_name: prismic.TextField
      hex_code: prismic.TextField
    }[]
  }
}

export interface FeatureSection {
  uid: string
  type: string
  lang: string
  url: string
  data: {
    section_title: prismic.TitleField
    section_description?: prismic.RichTextField
    background_style: prismic.SelectField
    call_to_action_button?: prismic.LinkField
  }
}

// Query functions
export async function getAllCarModels(): Promise<CarModel[]> {
  try {
    const cars = await client.getAllByType('car_model', {
      fetchLinks: [],
      orderings: [
        { field: 'my.car_model.featured', direction: 'desc' },
        { field: 'my.car_model.car_name', direction: 'asc' }
      ]
    })
    return cars as CarModel[]
  } catch (error) {
    console.error('Error fetching car models:', error)
    return []
  }
}

export async function getCarByUID(uid: string): Promise<CarModel | null> {
  try {
    const car = await client.getByUID('car_model', uid)
    return car as CarModel
  } catch (error) {
    console.error('Error fetching car by UID:', error)
    return null
  }
}

export async function getCarsByBrand(brand: string): Promise<CarModel[]> {
  try {
    const cars = await client.getAllByType('car_model', {
      filters: [prismic.filter.at('my.car_model.brand', brand)],
      orderings: [
        { field: 'my.car_model.model_year', direction: 'desc' },
        { field: 'my.car_model.car_name', direction: 'asc' }
      ]
    })
    return cars as CarModel[]
  } catch (error) {
    console.error('Error fetching cars by brand:', error)
    return []
  }
}

export async function getCarsByType(carType: string): Promise<CarModel[]> {
  try {
    const cars = await client.getAllByType('car_model', {
      filters: [prismic.filter.at('my.car_model.car_type', carType)],
      orderings: [
        { field: 'my.car_model.model_year', direction: 'desc' },
        { field: 'my.car_model.car_name', direction: 'asc' }
      ]
    })
    return cars as CarModel[]
  } catch (error) {
    console.error('Error fetching cars by type:', error)
    return []
  }
}

export async function getFeaturedCars(limit = 6): Promise<CarModel[]> {
  try {
    const cars = await client.getAllByType('car_model', {
      fetchLinks: [],
      orderings: [
        { field: 'my.car_model.featured', direction: 'desc' },
        { field: 'my.car_model.car_name', direction: 'asc' }
      ]
    })
    return cars.slice(0, limit) as CarModel[]
  } catch (error) {
    console.error('Error fetching featured cars:', error)
    return []
  }
}

export async function getAllFeatureSections(): Promise<FeatureSection[]> {
  try {
    const sections = await client.getAllByType('feature_section', {
      orderings: [{ field: 'my.feature_section.section_title', direction: 'asc' }]
    })
    return sections as FeatureSection[]
  } catch (error) {
    console.error('Error fetching feature sections:', error)
    return []
  }
}

// Helper function to get image URL with proper sizing
export function getOptimizedImageUrl(
  image: prismic.ImageField,
  width?: number,
  height?: number
): string {
  if (!image.url) return '/placeholder-car.jpg'

  const params = new URLSearchParams()
  if (width) params.append('w', width.toString())
  if (height) params.append('h', height.toString())
  params.append('auto', 'format,compress')

  const separator = image.url.includes('?') ? '&' : '?'
  return `${image.url}${separator}${params.toString()}`
}

// Helper function to format price
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// Brand configuration
export const CAR_BRANDS = [
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Tesla',
  'Porsche',
  'Lamborghini',
  'Ferrari',
  'McLaren',
  'Aston Martin',
  'Jaguar',
  'Land Rover',
  'Bentley',
  'Rolls Royce',
  'Genesis',
  'Lexus',
  'Infiniti',
  'Acura',
  'Cadillac',
  'Lincoln',
] as const

export const CAR_TYPES = [
  'SUV',
  'Sedan',
  'Sports Car',
  'Convertible',
  'Truck',
  'Van',
  'Coupe',
  'Hatchback',
  'Wagon',
  'Hybrid',
  'Electric',
  'Luxury',
  'Performance',
] as const

export const PRICE_CATEGORIES = [
  'Budget',
  'Premium',
  'Luxury',
  'Exotic',
] as const