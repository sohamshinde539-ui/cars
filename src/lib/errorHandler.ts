import { AppError, DeviceInfo } from '@/types'

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  NETWORK = 'network',
  RENDERING = 'rendering',
  USER_INPUT = 'user_input',
  WEBGL = 'webgl',
  CONTENT = 'content',
  PERMISSION = 'permission',
  BROWSER = 'browser',
  UNKNOWN = 'unknown'
}

// Enhanced error interface
interface EnhancedAppError extends AppError {
  severity: ErrorSeverity
  category: ErrorCategory
  retryable: boolean
  context?: Record<string, any>
  userId?: string
  sessionId: string
}

// Error handler class
export class ErrorHandler {
  private errors: EnhancedAppError[] = []
  private maxErrors = 100
  private deviceInfo: DeviceInfo | null = null
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initDeviceInfo()
    this.setupGlobalErrorHandlers()
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private initDeviceInfo(): void {
    if (typeof window === 'undefined') return

    this.deviceInfo = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
      isDesktop: !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)),
      orientation: 'landscape',
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      webglSupport: this.checkWebGLSupport(),
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency
    }

    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      if (this.deviceInfo) {
        this.deviceInfo.orientation = window.orientation ? 'portrait' : 'landscape'
      }
    })
  }

  private checkWebGLSupport(): boolean {
    if (typeof window === 'undefined') return false

    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return gl !== null
    } catch (e) {
      return false
    }
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return

    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        code: 'JAVASCRIPT_ERROR',
        message: event.message || 'JavaScript error',
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        },
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.UNKNOWN,
        retryable: false,
        sessionId: this.sessionId
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        code: 'PROMISE_REJECTION',
        message: event.reason?.message || 'Unhandled promise rejection',
        details: {
          reason: event.reason,
          stack: event.reason?.stack
        },
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.UNKNOWN,
        retryable: false,
        sessionId: this.sessionId
      })
    })
  }

  // Main error handling method
  public handleError(error: Partial<EnhancedAppError>): EnhancedAppError {
    const enhancedError: EnhancedAppError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      timestamp: error.timestamp || new Date(),
      userAgent: error.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : undefined),
      url: error.url || (typeof window !== 'undefined' ? window.location.href : undefined),
      severity: error.severity || ErrorSeverity.MEDIUM,
      category: error.category || ErrorCategory.UNKNOWN,
      retryable: error.retryable ?? true,
      context: error.context,
      sessionId: this.sessionId,
      details: error.details
    }

    // Add device info if available
    if (this.deviceInfo) {
      enhancedError.context = {
        ...enhancedError.context,
        deviceInfo: this.deviceInfo
      }
    }

    // Categorize error based on message/code
    enhancedError.category = this.categorizeError(enhancedError)
    enhancedError.severity = this.determineSeverity(enhancedError)

    // Store error
    this.errors.push(enhancedError)

    // Limit error array size
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    // Log error
    this.logError(enhancedError)

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(enhancedError)
    }

    return enhancedError
  }

  private categorizeError(error: EnhancedAppError): ErrorCategory {
    const message = error.message.toLowerCase()
    const code = error.code.toLowerCase()

    // WebGL errors
    if (message.includes('webgl') || code.includes('webgl') || message.includes('gl_')) {
      return ErrorCategory.WEBGL
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection') ||
        code.includes('network') || code.includes('fetch')) {
      return ErrorCategory.NETWORK
    }

    // Rendering errors
    if (message.includes('render') || message.includes('canvas') || message.includes('three') ||
        code.includes('render') || code.includes('canvas')) {
      return ErrorCategory.RENDERING
    }

    // Content errors
    if (message.includes('content') || message.includes('prismic') || message.includes('api') ||
        code.includes('content') || code.includes('api')) {
      return ErrorCategory.CONTENT
    }

    // Permission errors
    if (message.includes('permission') || message.includes('denied') || message.includes('blocked')) {
      return ErrorCategory.PERMISSION
    }

    // Browser errors
    if (message.includes('browser') || message.includes('compatibility') || message.includes('support')) {
      return ErrorCategory.BROWSER
    }

    return ErrorCategory.UNKNOWN
  }

  private determineSeverity(error: EnhancedAppError): ErrorSeverity {
    // Critical errors that prevent core functionality
    if (error.category === ErrorCategory.WEBGL && this.deviceInfo?.webglSupport) {
      return ErrorSeverity.CRITICAL
    }

    // High severity errors
    if (error.category === ErrorCategory.WEBGL ||
        error.category === ErrorCategory.RENDERING ||
        error.code === 'CRITICAL_ERROR') {
      return ErrorSeverity.HIGH
    }

    // Medium severity errors
    if (error.category === ErrorCategory.NETWORK ||
        error.category === ErrorCategory.CONTENT) {
      return ErrorSeverity.MEDIUM
    }

    return ErrorSeverity.LOW
  }

  private logError(error: EnhancedAppError): void {
    const emoji = this.getSeverityEmoji(error.severity)
    const categoryEmoji = this.getCategoryEmoji(error.category)

    console.group(`${emoji} ${categoryEmoji} Error (${error.severity.toUpperCase()})`)
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    console.error('Category:', error.category)
    console.error('Timestamp:', error.timestamp.toLocaleString())
    console.error('Retryable:', error.retryable)

    if (error.context) {
      console.error('Context:', error.context)
    }

    if (error.details) {
      console.error('Details:', error.details)
    }

    console.groupEnd()
  }

  private getSeverityEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL: return '🚨'
      case ErrorSeverity.HIGH: return '⚠️'
      case ErrorSeverity.MEDIUM: return '⚡'
      case ErrorSeverity.LOW: return 'ℹ️'
      default: return '❓'
    }
  }

  private getCategoryEmoji(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.WEBGL: return '🎮'
      case ErrorCategory.NETWORK: return '🌐'
      case ErrorCategory.RENDERING: return '🖼️'
      case ErrorCategory.CONTENT: return '📝'
      case ErrorCategory.USER_INPUT: return '👆'
      case ErrorCategory.PERMISSION: return '🔒'
      case ErrorCategory.BROWSER: return '🌍'
      default: return '❓'
    }
  }

  private sendToErrorService(error: EnhancedAppError): void {
    // In production, send to error reporting service like Sentry, LogRocket, etc.
    // This is a placeholder implementation
    try {
      // Example for Sentry:
      // Sentry.captureException(error, {
      //   tags: {
      //     category: error.category,
      //     severity: error.severity,
      //     sessionId: error.sessionId
      //   },
      //   extra: {
      //     context: error.context,
      //     deviceInfo: error.context?.deviceInfo
      //   }
      // })

      console.log('Would send error to service:', error)
    } catch (e) {
      console.error('Failed to send error to service:', e)
    }
  }

  // Public methods
  public getErrors(): EnhancedAppError[] {
    return [...this.errors]
  }

  public getErrorsByCategory(category: ErrorCategory): EnhancedAppError[] {
    return this.errors.filter(error => error.category === category)
  }

  public getErrorsBySeverity(severity: ErrorSeverity): EnhancedAppError[] {
    return this.errors.filter(error => error.severity === severity)
  }

  public clearErrors(): void {
    this.errors = []
  }

  public getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo
  }

  public getSessionId(): string {
    return this.sessionId
  }

  // Specific error handling methods
  public handleWebGLError(error: Error | string): EnhancedAppError {
    return this.handleError({
      code: 'WEBGL_ERROR',
      message: typeof error === 'string' ? error : error.message,
      details: typeof error === 'object' ? error.stack : undefined,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.WEBGL,
      retryable: false,
      context: {
        webglSupported: this.deviceInfo?.webglSupport,
        fallbackRequired: true
      }
    })
  }

  public handleNetworkError(error: Error | string, context?: string): EnhancedAppError {
    return this.handleError({
      code: 'NETWORK_ERROR',
      message: typeof error === 'string' ? error : error.message,
      details: typeof error === 'object' ? error.stack : undefined,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.NETWORK,
      retryable: true,
      context: {
        url: context,
        online: navigator.onLine
      }
    })
  }

  public handleContentError(error: Error | string, contentType?: string): EnhancedAppError {
    return this.handleError({
      code: 'CONTENT_ERROR',
      message: typeof error === 'string' ? error : error.message,
      details: typeof error === 'object' ? error.stack : undefined,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.CONTENT,
      retryable: true,
      context: {
        contentType,
        timestamp: new Date().toISOString()
      }
    })
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler()

// Convenience functions for common error types
export const handleWebGLError = (error: Error | string) => errorHandler.handleWebGLError(error)
export const handleNetworkError = (error: Error | string, context?: string) => errorHandler.handleNetworkError(error, context)
export const handleContentError = (error: Error | string, contentType?: string) => errorHandler.handleContentError(error, contentType)
export const handleError = (error: Partial<EnhancedAppError>) => errorHandler.handleError(error)