'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { CarModel, FilterOptions, SortOptions } from '@/types'
import { FadeInUp, StaggerContainer } from '@/components/Animation/ScrollController'
import { CarViewer } from '@/components/3D/CarViewer'
import { useEntranceAnimation } from '@/hooks/useAnimations'

interface CarGalleryProps {
  cars: CarModel[]
  initialFilters?: FilterOptions
  initialSort?: SortOptions
  itemsPerPage?: number
  className?: string
}

// Filter components
function FilterPanel({
  filters,
  onFilterChange,
  availableOptions
}: {
  filters: FilterOptions
  onFilterChange: (filters: FilterOptions) => void
  availableOptions: {
    brands: string[]
    carTypes: string[]
    priceCategories: string[]
    transmissions: string[]
  }
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter Cars</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <select
              value={filters.brand || ''}
              onChange={(e) => onFilterChange({ ...filters, brand: e.target.value || undefined })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Brands</option>
              {availableOptions.brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Car Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filters.carType || ''}
              onChange={(e) => onFilterChange({ ...filters, carType: e.target.value || undefined })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {availableOptions.carTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range: ${filters.minPrice?.toLocaleString() || 0} - ${filters.maxPrice?.toLocaleString() || '∞'}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice || ''}
                onChange={(e) => onFilterChange({
                  ...filters,
                  minPrice: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice || ''}
                onChange={(e) => onFilterChange({
                  ...filters,
                  maxPrice: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Year Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Year: {filters.minYear || 'Any'} - {filters.maxYear || 'Any'}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min Year"
                value={filters.minYear || ''}
                onChange={(e) => onFilterChange({
                  ...filters,
                  minYear: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1990"
                max={new Date().getFullYear() + 1}
              />
              <input
                type="number"
                placeholder="Max Year"
                value={filters.maxYear || ''}
                onChange={(e) => onFilterChange({
                  ...filters,
                  maxYear: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1990"
                max={new Date().getFullYear() + 1}
              />
            </div>
          </div>

          {/* Transmission Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
            <select
              value={filters.transmission || ''}
              onChange={(e) => onFilterChange({ ...filters, transmission: e.target.value || undefined })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Transmissions</option>
              {availableOptions.transmissions.map(transmission => (
                <option key={transmission} value={transmission}>{transmission}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => onFilterChange({})}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  )
}

// Sort component
function SortControls({
  sort,
  onSortChange
}: {
  sort: SortOptions
  onSortChange: (sort: SortOptions) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-700">Sort by:</label>
      <select
        value={`${sort.field}-${sort.direction}`}
        onChange={(e) => {
          const [field, direction] = e.target.value.split('-')
          onSortChange({
            field: field as SortOptions['field'],
            direction: direction as SortOptions['direction']
          })
        }}
        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="name-asc">Name (A-Z)</option>
        <option value="name-desc">Name (Z-A)</option>
        <option value="price-asc">Price (Low to High)</option>
        <option value="price-desc">Price (High to Low)</option>
        <option value="year-desc">Year (Newest First)</option>
        <option value="year-asc">Year (Oldest First)</option>
        <option value="horsepower-desc">Horsepower (High to Low)</option>
        <option value="zeroToSixty-asc">0-60 mph (Fast to Slow)</option>
      </select>
    </div>
  )
}

// Car card component
function CarCard({
  car,
  onPreview,
  onDetails
}: {
  car: CarModel
  onPreview: (car: CarModel) => void
  onDetails: (car: CarModel) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  useEntranceAnimation(cardRef, 'fadeInUp')

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group"
      onClick={() => onDetails(car)}
    >
      {/* 3D Model Preview */}
      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        {car.modelThumbnail ? (
          <img
            src={car.modelThumbnail}
            alt={car.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <div className="w-16 h-16 bg-gray-400 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        )}

        {/* Overlay with quick actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPreview(car)
              }}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Quick 3D Preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDetails(car)
              }}
              className="p-2 bg-white/90 text-gray-900 rounded-lg hover:bg-white transition-colors"
              title="View Details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Featured badge */}
        {car.featured && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
            Featured
          </div>
        )}
      </div>

      {/* Car Information */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {car.name}
            </h3>
            <p className="text-sm text-gray-600">{car.brand} • {car.modelYear}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">
              ${car.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Description */}
        {car.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {car.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {car.carType}
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
            {car.priceCategory}
          </span>
          {car.horsepower && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {car.horsepower} HP
            </span>
          )}
        </div>

        {/* Quick specs */}
        <div className="flex gap-4 text-xs text-gray-600">
          {car.engineType && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              {car.engineType}
            </span>
          )}
          {car.transmission && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {car.transmission}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function CarGallery({
  cars,
  initialFilters = {},
  initialSort = { field: 'name', direction: 'asc' },
  itemsPerPage = 12,
  className = ''
}: CarGalleryProps) {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters)
  const [sort, setSort] = useState<SortOptions>(initialSort)
  const [currentPage, setCurrentPage] = useState(1)
  const [previewCar, setPreviewCar] = useState<CarModel | null>(null)

  // Get available filter options
  const availableOptions = useMemo(() => {
    const brands = [...new Set(cars.map(car => car.brand))].sort()
    const carTypes = [...new Set(cars.map(car => car.carType))].sort()
    const priceCategories = [...new Set(cars.map(car => car.priceCategory))].sort()
    const transmissions = [...new Set(cars.map(car => car.transmission).filter(Boolean))].sort()

    return { brands, carTypes, priceCategories, transmissions }
  }, [cars])

  // Filter and sort cars
  const filteredAndSortedCars = useMemo(() => {
    let filtered = cars.filter(car => {
      // Brand filter
      if (filters.brand && car.brand !== filters.brand) return false

      // Car type filter
      if (filters.carType && car.carType !== filters.carType) return false

      // Price filter
      if (filters.minPrice && car.price < filters.minPrice) return false
      if (filters.maxPrice && car.price > filters.maxPrice) return false

      // Year filter
      if (filters.minYear && car.modelYear < filters.minYear) return false
      if (filters.maxYear && car.modelYear > filters.maxYear) return false

      // Transmission filter
      if (filters.transmission && car.transmission !== filters.transmission) return false

      return true
    })

    // Sort cars
    filtered.sort((a, b) => {
      let aValue: any = a[sort.field]
      let bValue: any = b[sort.field]

      // Handle nested objects
      if (typeof aValue === 'undefined') aValue = 0
      if (typeof bValue === 'undefined') bValue = 0

      let comparison = 0
      if (aValue < bValue) comparison = -1
      if (aValue > bValue) comparison = 1

      return sort.direction === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [cars, filters, sort])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCars.length / itemsPerPage)
  const paginatedCars = filteredAndSortedCars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, sort])

  const handlePreview = (car: CarModel) => {
    setPreviewCar(car)
  }

  const handleDetails = (car: CarModel) => {
    // Navigate to car details page
    window.location.href = `/cars/${car.uid}`
  }

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <FadeInUp>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Our Collection
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the perfect vehicle from our curated selection of premium automobiles.
            </p>
          </div>
        </FadeInUp>

        {/* Filter and Sort Controls */}
        <div className="mb-8 space-y-6">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            availableOptions={availableOptions}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredAndSortedCars.length}</span> cars
            </div>
            <SortControls sort={sort} onSortChange={setSort} />
          </div>
        </div>

        {/* Car Grid */}
        <StaggerContainer staggerDelay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedCars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onPreview={handlePreview}
                onDetails={handleDetails}
              />
            ))}
          </div>
        </StaggerContainer>

        {/* Empty State */}
        {filteredAndSortedCars.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No cars found</h3>
            <p className="text-gray-600">Try adjusting your filters or search criteria</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewCar && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewCar(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{previewCar.name}</h3>
                <button
                  onClick={() => setPreviewCar(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 3D Model Preview */}
              <div className="h-96 mb-6 rounded-xl overflow-hidden">
                <CarViewer car={previewCar} showControls={true} autoRotate={true} />
              </div>

              {/* Car Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Specifications</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium">{previewCar.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium">{previewCar.modelYear}</span>
                    </div>
                    {previewCar.engineType && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Engine:</span>
                        <span className="font-medium">{previewCar.engineType}</span>
                      </div>
                    )}
                    {previewCar.horsepower && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Horsepower:</span>
                        <span className="font-medium">{previewCar.horsepower} HP</span>
                      </div>
                    )}
                    {previewCar.transmission && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transmission:</span>
                        <span className="font-medium">{previewCar.transmission}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                  <div className="text-2xl font-bold text-blue-600 mb-4">
                    ${previewCar.price.toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDetails(previewCar)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Full Details
                    </button>
                    <button
                      onClick={() => setPreviewCar(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}