'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { ScrollSmoother } from 'gsap/dist/ScrollSmoother'
import { DeviceInfo, ScrollAnimation } from '@/types'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother)
}

interface ScrollControllerProps {
  children: React.ReactNode
  smooth?: boolean
  smoothTime?: number
  effects?: boolean
  refreshPriority?: number
  onUpdate?: (self: any) => void
  onScrollStart?: () => void
  onScrollEnd?: () => void
}

interface AnimationConfig {
  duration: number
  ease: string
  delay?: number
  stagger?: number
  scrub?: boolean | number
  pin?: boolean
  markers?: boolean
  start?: string
  end?: string
}

export function ScrollController({
  children,
  smooth = true,
  smoothTime = 1.2,
  effects = true,
  refreshPriority = 0,
  onUpdate,
  onScrollStart,
  onScrollEnd
}: ScrollControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const smootherRef = useRef<ScrollSmoother | null>(null)
  const [isReady, setIsReady] = useState(false)
  const animationsRef = useRef<Map<string, gsap.core.Tween>>(new Map())

  // Initialize GSAP ScrollSmoother
  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      // Create smooth scroller
      smootherRef.current = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: smooth ? smoothTime : 0,
        effects: effects,
        smoothTouch: 0.1,
        normalizeScroll: true,
        ignoreMobileResize: true,
        onUpdate: (self) => {
          onUpdate?.(self)
        },
        onStop: () => {
          onScrollEnd?.()
        },
        onStart: () => {
          onScrollStart?.()
        }
      })

      setIsReady(true)
    }, containerRef)

    // Refresh ScrollTrigger on window resize
    const handleResize = () => {
      ScrollTrigger.refresh()
    }

    window.addEventListener('resize', handleResize)

    // Initial refresh
    ScrollTrigger.refresh()

    return () => {
      ctx.revert()
      window.removeEventListener('resize', handleResize)
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
      smootherRef.current?.kill()
    }
  }, [smooth, smoothTime, effects, onUpdate, onScrollStart, onScrollEnd])

  // Public methods
  const scrollTo = useCallback((target: string | HTMLElement, duration?: number, offset = 0) => {
    if (!smootherRef.current) return

    const element = typeof target === 'string'
      ? document.querySelector(target)
      : target

    if (element) {
      smootherRef.current.scrollTo(element, true, offset || 0, duration || 1)
    }
  }, [])

  const scrollToTop = useCallback((duration = 1) => {
    if (!smootherRef.current) return
    smootherRef.current.scrollTo(0, true, 0, duration)
  }, [])

  const addAnimation = useCallback((id: string, animation: gsap.core.Tween) => {
    animationsRef.current.set(id, animation)
  }, [])

  const removeAnimation = useCallback((id: string) => {
    const animation = animationsRef.current.get(id)
    if (animation) {
      animation.kill()
      animationsRef.current.delete(id)
    }
  }, [])

  // Context value for child components
  const contextValue = {
    scrollTo,
    scrollToTop,
    addAnimation,
    removeAnimation,
    smoother: smootherRef.current,
    isReady,
  }

  return (
    <ScrollControllerContext.Provider value={contextValue}>
      <div ref={containerRef} className="relative">
        <div id="smooth-wrapper" className="fixed inset-0 overflow-hidden">
          <div id="smooth-content" className="[overflow-anchor:none]">
            {children}
          </div>
        </div>
      </div>
    </ScrollControllerContext.Provider>
  )
}

// Context for child components
const ScrollControllerContext = React.createContext<{
  scrollTo: (target: string | HTMLElement, duration?: number, offset?: number) => void
  scrollToTop: (duration?: number) => void
  addAnimation: (id: string, animation: gsap.core.Tween) => void
  removeAnimation: (id: string) => void
  smoother: ScrollSmoother | null
  isReady: boolean
} | null>(null)

export function useScrollController() {
  const context = React.useContext(ScrollControllerContext)
  if (!context) {
    throw new Error('useScrollController must be used within a ScrollController')
  }
  return context
}

// Animation components
interface ScrollAnimationProps {
  children: React.ReactNode
  animation: {
    from?: Record<string, any>
    to?: Record<string, any>
    config?: AnimationConfig
  }
  trigger?: string
  start?: string
  end?: string
  scrub?: boolean | number
  pin?: boolean
  markers?: boolean
  className?: string
}

export function ScrollAnimationComponent({
  children,
  animation,
  trigger,
  start = 'top bottom',
  end = 'bottom top',
  scrub = true,
  pin = false,
  markers = false,
  className = ''
}: ScrollAnimationProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const { addAnimation, removeAnimation, isReady } = useScrollController()
  const animationId = useRef(`animation-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    if (!elementRef.current || !isReady) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger || elementRef.current,
        start,
        end,
        scrub,
        pin,
        markers,
        invalidateOnRefresh: true,
        ...animation.config
      }
    })

    // Add from animation if specified
    if (animation.from) {
      tl.from(elementRef.current, animation.from, 0)
    }

    // Add to animation if specified
    if (animation.to) {
      tl.to(elementRef.current, animation.to, animation.from ? '<' : 0)
    }

    addAnimation(animationId.current, tl)

    return () => {
      removeAnimation(animationId.current)
    }
  }, [
    animation,
    trigger,
    start,
    end,
    scrub,
    pin,
    markers,
    addAnimation,
    removeAnimation,
    isReady
  ])

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  )
}

// Predefined animation presets
export const AnimationPresets = {
  fadeInUp: {
    from: { opacity: 0, y: 60 },
    to: { opacity: 1, y: 0 },
    config: { duration: 1, ease: 'power3.out' }
  },
  fadeInDown: {
    from: { opacity: 0, y: -60 },
    to: { opacity: 1, y: 0 },
    config: { duration: 1, ease: 'power3.out' }
  },
  fadeInLeft: {
    from: { opacity: 0, x: -60 },
    to: { opacity: 1, x: 0 },
    config: { duration: 1, ease: 'power3.out' }
  },
  fadeInRight: {
    from: { opacity: 0, x: 60 },
    to: { opacity: 1, x: 0 },
    config: { duration: 1, ease: 'power3.out' }
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
    config: { duration: 1.2, ease: 'back.out(1.7)' }
  },
  slideInFromBottom: {
    from: { y: '100%' },
    to: { y: '0%' },
    config: { duration: 1, ease: 'power4.out' }
  },
  parallaxSlow: {
    from: { y: 0 },
    to: { y: -100 },
    config: { scrub: 1 }
  },
  parallaxMedium: {
    from: { y: 0 },
    to: { y: -200 },
    config: { scrub: 1 }
  },
  parallaxFast: {
    from: { y: 0 },
    to: { y: -300 },
    config: { scrub: 1 }
  }
}

// Specialized animation components
export function FadeInUp({ children, delay = 0, className = '' }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const preset = { ...AnimationPresets.fadeInUp }
  if (delay > 0) {
    preset.from = { ...preset.from, delay }
  }

  return (
    <ScrollAnimationComponent
      animation={preset}
      className={className}
    >
      {children}
    </ScrollAnimationComponent>
  )
}

export function ScaleIn({ children, delay = 0, className = '' }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const preset = { ...AnimationPresets.scaleIn }
  if (delay > 0) {
    preset.from = { ...preset.from, delay }
  }

  return (
    <ScrollAnimationComponent
      animation={preset}
      className={className}
    >
      {children}
    </ScrollAnimationComponent>
  )
}

export function ParallaxElement({ children, speed = 'medium', className = '' }: {
  children: React.ReactNode
  speed?: 'slow' | 'medium' | 'fast'
  className?: string
}) {
  const preset = AnimationPresets[`parallax${speed.charAt(0).toUpperCase() + speed.slice(1)}`]

  return (
    <ScrollAnimationComponent
      animation={preset}
      className={className}
    >
      {children}
    </ScrollAnimationComponent>
  )
}

// Staggered animation component
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  animation = 'fadeInUp',
  className = ''
}: {
  children: React.ReactNode
  staggerDelay?: number
  animation?: keyof typeof AnimationPresets
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { addAnimation, removeAnimation, isReady } = useScrollController()
  const animationId = useRef(`stagger-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    if (!containerRef.current || !isReady) return

    const preset = AnimationPresets[animation]
    const children = containerRef.current.children

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: false,
        invalidateOnRefresh: true
      }
    })

    tl.from(children, {
      ...preset.from,
      stagger: staggerDelay,
      duration: preset.config?.duration || 1,
      ease: preset.config?.ease || 'power3.out'
    }, 0)

    addAnimation(animationId.current, tl)

    return () => {
      removeAnimation(animationId.current)
    }
  }, [animation, staggerDelay, addAnimation, removeAnimation, isReady])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

// Performance monitoring for animations
export function useAnimationPerformance() {
  const [metrics, setMetrics] = useState({
    activeAnimations: 0,
    averageFPS: 60,
    droppedFrames: 0,
    memoryUsage: 0
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    let frameCount = 0
    let lastTime = performance.now()
    let droppedFrames = 0

    const measurePerformance = () => {
      frameCount++
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime

      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime)
        const expectedFrames = Math.round(deltaTime / 16.67) // 60fps target
        droppedFrames = Math.max(0, expectedFrames - frameCount)

        setMetrics(prev => ({
          ...prev,
          averageFPS: fps,
          droppedFrames: droppedFrames,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          activeAnimations: ScrollTrigger.getAll().length
        }))

        frameCount = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measurePerformance)
    }

    const animationFrame = requestAnimationFrame(measurePerformance)

    return () => cancelAnimationFrame(animationFrame)
  }, [])

  return metrics
}