'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AppError } from '@/types'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: AppError, reset: () => void) => ReactNode
  onError?: (error: AppError, errorInfo: ErrorInfo) => void
  isolate?: boolean // If true, only shows error for this component tree
}

interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
  retryCount: number
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorId: string

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    }
    this.errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: {
        code: 'RENDER_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: error.stack,
        timestamp: new Date(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      }
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError: AppError = {
      code: 'RENDER_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: {
        errorStack: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundaryId: this.errorId
      },
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }

    this.setState(prevState => ({
      error: appError
    }))

    // Call error handler if provided
    this.props.onError?.(appError, errorInfo)

    // Log error for debugging
    console.error('Error Boundary caught an error:', appError, errorInfo)

    // In development, also log to console for easier debugging
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary (${this.errorId})`)
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }
  }

  handleReset = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      // Default error UI based on whether we're isolated
      if (this.props.isolate) {
        return <ComponentErrorFallback error={this.state.error} onReset={this.handleReset} isolated />
      } else {
        return <PageErrorFallback error={this.state.error} onReset={this.handleReset} />
      }
    }

    return this.props.children
  }
}

// Component-level error fallback (for isolated errors)
function ComponentErrorFallback({
  error,
  onReset,
  isolated = true
}: {
  error: AppError
  onReset: () => void
  isolated?: boolean
}) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${isolated ? 'm-2' : 'm-4'}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800">
            Component Error
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {error.message}
          </p>
          {process.env.NODE_ENV === 'development' && error.details && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer">Error Details</summary>
              <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap">
                {typeof error.details === 'string'
                  ? error.details
                  : JSON.stringify(error.details, null, 2)
                }
              </pre>
            </details>
          )}
          <button
            onClick={onReset}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

// Page-level error fallback (for full page errors)
function PageErrorFallback({ error, onReset }: { error: AppError; onReset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-6">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>

        <div className="space-y-3">
          <button
            onClick={onReset}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reload Page
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-600 cursor-pointer font-medium">
              Error Details (Development)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-700 mb-2">
                <strong>Error Code:</strong> {error.code}
              </p>
              <p className="text-xs text-gray-700 mb-2">
                <strong>Timestamp:</strong> {error.timestamp.toLocaleString()}
              </p>
              {error.details && (
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-32">
                  {typeof error.details === 'string'
                    ? error.details
                    : JSON.stringify(error.details, null, 2)
                  }
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

// Hook for handling async errors in functional components
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error | AppError, context?: string) => {
    const appError: AppError = typeof error === 'string'
      ? {
          code: 'MANUAL_ERROR',
          message: error,
          timestamp: new Date(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          url: typeof window !== 'undefined' ? window.location.href : undefined
        }
      : 'code' in error
        ? error as AppError
        : {
            code: 'ASYNC_ERROR',
            message: error.message,
            details: error.stack,
            timestamp: new Date(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
            url: typeof window !== 'undefined' ? window.location.href : undefined
          }

    // Add context if provided
    if (context) {
      appError.details = {
        ...(appError.details || {}),
        context
      }
    }

    console.error('Caught async error:', appError)

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(appError)
    }
  }, [])

  return handleError
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}