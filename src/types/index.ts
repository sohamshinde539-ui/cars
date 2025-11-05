// Common type definitions used across the application

export interface CarModel {
  id: string
  uid: string
  name: string
  brand: string
  carType: string
  priceCategory: string
  modelYear: number
  price: number
  description?: string
  modelFile: string
  modelThumbnail: string
  alternateViews?: string[]
  photoGallery?: string[]
  videoUrl?: string
  brochurePdf?: string
  engineType?: string
  horsepower?: number
  zeroToSixty?: number
  fuelEfficiency?: number
  transmission?: string
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  weight?: number
  seatingCapacity?: number
  colorOptions?: {
    colorName: string
    hexCode: string
  }[]
  metaTitle?: string
  metaDescription?: string
  featured?: boolean
}

export interface FilterOptions {
  brand?: string
  carType?: string
  priceCategory?: string
  minPrice?: number
  maxPrice?: number
  minYear?: number
  maxYear?: number
  transmission?: string
  fuelType?: string
}

export interface SortOptions {
  field: 'name' | 'price' | 'year' | 'horsepower' | 'zeroToSixty'
  direction: 'asc' | 'desc'
}

export interface CarSearchParams {
  query?: string
  filters?: FilterOptions
  sort?: SortOptions
  page?: number
  limit?: number
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface CarSearchResult {
  cars: CarModel[]
  pagination: PaginationInfo
}

export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

export interface ErrorState {
  hasError: boolean
  message: string
  code?: string
}

// 3D Viewer types
export interface ViewerState {
  isAutoRotating: boolean
  isFullscreen: boolean
  currentView: 'exterior' | 'interior' | 'engine'
  zoom: number
  rotation: { x: number; y: number; z: number }
  position: { x: number; y: number; z: number }
  lighting: {
    intensity: number
    environment: string
    shadows: boolean
  }
}

export interface ModelLoadingProgress {
  loaded: number
  total: number
  percentage: number
  stage: 'downloading' | 'parsing' | 'processing' | 'complete' | 'error'
}

// Animation types
export interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
  repeat?: number
  yoyo?: boolean
}

export interface ScrollAnimation {
  trigger: string
  start?: string
  end?: string
  scrub?: boolean
  pin?: boolean
  animation: {
    element: string
    properties: Record<string, number | string>
    config?: AnimationConfig
  }[]
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'auto'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
}

// Device and viewport types
export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  orientation: 'portrait' | 'landscape'
  touchSupport: boolean
  webglSupport: boolean
  deviceMemory?: number
  hardwareConcurrency?: number
}

export interface ViewportSize {
  width: number
  height: number
}

// Performance monitoring
export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  modelLoadTime: number
  animationFrameRate: number
  memoryUsage: number
  connectionSpeed?: string
}

// Form types
export interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  preferredContact: 'email' | 'phone'
  carInterest?: string
}

export interface ScheduleTestDriveForm {
  name: string
  email: string
  phone: string
  carModel: string
  preferredDate: string
  preferredTime: string
  message?: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: unknown
  timestamp: Date
  userAgent?: string
  url?: string
}

// Analytics types
export interface UserInteraction {
  type: 'view' | 'click' | 'hover' | 'scroll' | 'model_interaction' | 'form_submit'
  element: string
  metadata?: Record<string, unknown>
  timestamp: Date
}

export interface PageView {
  path: string
  title: string
  referrer?: string
  timestamp: Date
  timeOnPage?: number
}

// Configuration types
export interface AppConfig {
  siteUrl: string
  apiEndpoint: string
  enableAnalytics: boolean
  enableWebGL: boolean
  enableMobile3D: boolean
  maxModelFileSize: number
  cdnUrl: string
  environment: 'development' | 'staging' | 'production'
}