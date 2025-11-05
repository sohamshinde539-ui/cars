'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { useScrollController } from '@/components/Animation/ScrollController'
import { AnimationConfig } from '@/types'

// Custom hook for managing animations
export function useAnimations() {
  const { addAnimation, removeAnimation, scrollTo } = useScrollController()
  const animationsRef = useRef<Map<string, gsap.core.Tween>>(new Map())

  // Create a timeline animation
  const createTimeline = useCallback((id: string, config?: gsap.TimelineVars) => {
    const existing = animationsRef.current.get(id)
    if (existing) {
      existing.kill()
    }

    const timeline = gsap.timeline(config)
    animationsRef.current.set(id, timeline)
    addAnimation(id, timeline)

    return timeline
  }, [addAnimation])

  // Animate element properties
  const animateElement = useCallback((
    id: string,
    element: Element | string,
    toVars: gsap.TweenVars,
    fromVars?: gsap.TweenVars
  ) => {
    const existing = animationsRef.current.get(id)
    if (existing) {
      existing.kill()
    }

    const timeline = gsap.timeline()
    if (fromVars) {
      timeline.from(element, fromVars)
    }
    timeline.to(element, toVars)

    animationsRef.current.set(id, timeline)
    addAnimation(id, timeline)

    return timeline
  }, [addAnimation])

  // Create scroll-triggered animation
  const createScrollAnimation = useCallback((
    id: string,
    element: Element | string,
    animation: {
      from?: gsap.TweenVars
      to?: gsap.TweenVars
      scrollTrigger?: ScrollTrigger.Vars
    }
  ) => {
    const existing = animationsRef.current.get(id)
    if (existing) {
      existing.kill()
    }

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        ...animation.scrollTrigger
      }
    })

    if (animation.from) {
      timeline.from(element, animation.from)
    }

    if (animation.to) {
      timeline.to(element, animation.to, animation.from ? '<' : 0)
    }

    animationsRef.current.set(id, timeline)
    addAnimation(id, timeline)

    return timeline
  }, [addAnimation])

  // Cleanup all animations
  const cleanup = useCallback(() => {
    animationsRef.current.forEach((animation, id) => {
      animation.kill()
      removeAnimation(id)
    })
    animationsRef.current.clear()
  }, [removeAnimation])

  // Remove specific animation
  const removeAnimationById = useCallback((id: string) => {
    const animation = animationsRef.current.get(id)
    if (animation) {
      animation.kill()
      removeAnimation(id)
      animationsRef.current.delete(id)
    }
  }, [removeAnimation])

  return {
    createTimeline,
    animateElement,
    createScrollAnimation,
    cleanup,
    removeAnimation: removeAnimationById,
    animations: animationsRef.current
  }
}

// Hook for entrance animations
export function useEntranceAnimation(
  elementRef: React.RefObject<Element>,
  animation: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'fadeInDown' | 'scaleIn' | 'slideIn',
  delay = 0,
  duration = 1,
  trigger?: Element | string
) {
  const { createScrollAnimation, removeAnimation } = useAnimations()
  const [isAnimated, setIsAnimated] = useState(false)

  useEffect(() => {
    if (!elementRef.current) return

    const animationPresets = {
      fadeInUp: {
        from: { opacity: 0, y: 60 },
        to: { opacity: 1, y: 0 }
      },
      fadeInLeft: {
        from: { opacity: 0, x: -60 },
        to: { opacity: 1, x: 0 }
      },
      fadeInRight: {
        from: { opacity: 0, x: 60 },
        to: { opacity: 1, x: 0 }
      },
      fadeInDown: {
        from: { opacity: 0, y: -60 },
        to: { opacity: 1, y: 0 }
      },
      scaleIn: {
        from: { opacity: 0, scale: 0.8 },
        to: { opacity: 1, scale: 1 }
      },
      slideIn: {
        from: { y: '100%' },
        to: { y: '0%' }
      }
    }

    const preset = animationPresets[animation]
    const animationId = `entrance-${Math.random().toString(36).substr(2, 9)}`

    createScrollAnimation(animationId, elementRef.current, {
      from: { ...preset.from, delay },
      to: { ...preset.to, duration, ease: 'power3.out' },
      scrollTrigger: {
        trigger: trigger || elementRef.current,
        start: 'top 85%',
        once: true
      }
    })

    setIsAnimated(true)

    return () => {
      removeAnimation(animationId)
    }
  }, [elementRef, animation, delay, duration, trigger, createScrollAnimation, removeAnimation])

  return isAnimated
}

// Hook for hover animations
export function useHoverAnimation(
  elementRef: React.RefObject<Element>,
  hoverAnimation: gsap.TweenVars,
  animationConfig?: AnimationConfig
) {
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current
    timelineRef.current = gsap.timeline({ paused: true })
      .to(element, hoverAnimation)

    const handleMouseEnter = () => {
      timelineRef.current?.play()
    }

    const handleMouseLeave = () => {
      timelineRef.current?.reverse()
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      timelineRef.current?.kill()
    }
  }, [elementRef, hoverAnimation, animationConfig])

  return timelineRef.current
}

// Hook for staggered animations
export function useStaggeredAnimation(
  elementsRef: React.RefObject<HTMLElement>,
  animation: gsap.TweenVars,
  stagger = 0.1,
  trigger?: Element | string
) {
  const { createScrollAnimation, removeAnimation } = useAnimations()

  useEffect(() => {
    if (!elementsRef.current) return

    const elements = elementsRef.current.children
    const animationId = `stagger-${Math.random().toString(36).substr(2, 9)}`

    createScrollAnimation(animationId, elements, {
      from: animation,
      scrollTrigger: {
        trigger: trigger || elementsRef.current,
        start: 'top 80%',
        once: true
      }
    })

    return () => {
      removeAnimation(animationId)
    }
  }, [elementsRef, animation, stagger, trigger, createScrollAnimation, removeAnimation])
}

// Hook for parallax effects
export function useParallax(
  elementRef: React.RefObject<Element>,
  speed = 0.5,
  direction: 'vertical' | 'horizontal' = 'vertical'
) {
  const { createScrollAnimation, removeAnimation } = useAnimations()

  useEffect(() => {
    if (!elementRef.current) return

    const animationId = `parallax-${Math.random().toString(36).substr(2, 9)}`
    const property = direction === 'vertical' ? 'y' : 'x'

    createScrollAnimation(animationId, elementRef.current, {
      from: { [property]: 0 },
      to: { [property]: direction === 'vertical' ? '20%' : '20%' },
      scrollTrigger: {
        trigger: elementRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1 / speed
      }
    })

    return () => {
      removeAnimation(animationId)
    }
  }, [elementRef, speed, direction, createScrollAnimation, removeAnimation])
}

// Hook for counter animation
export function useCounterAnimation(
  elementRef: React.RefObject<HTMLElement>,
  target: number,
  duration = 2,
  prefix = '',
  suffix = ''
) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current
    const obj = { count: 0 }

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        once: true
      }
    })

    timeline.to(obj, {
      count: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        setCount(Math.round(obj.count))
        element.textContent = `${prefix}${Math.round(obj.count).toLocaleString()}${suffix}`
      }
    })

    return () => {
      timeline.kill()
    }
  }, [elementRef, target, duration, prefix, suffix])

  return count
}

// Hook for typewriter effect
export function useTypewriter(
  elementRef: React.RefObject<HTMLElement>,
  text: string,
  speed = 0.05,
  delay = 0
) {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current
    let currentIndex = 0
    let timeoutId: NodeJS.Timeout

    const startTyping = () => {
      const typeCharacter = () => {
        if (currentIndex < text.length) {
          setDisplayText(text.substring(0, currentIndex + 1))
          currentIndex++
          timeoutId = setTimeout(typeCharacter, speed * 1000)
        } else {
          setIsComplete(true)
        }
      }

      timeoutId = setTimeout(typeCharacter, delay * 1000)
    }

    // Start when element is in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isComplete) {
            startTyping()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(element)

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [elementRef, text, speed, delay, isComplete])

  return { displayText, isComplete }
}

// Hook for morphing animations
export function useMorphAnimation(
  elementRef: React.RefObject<Element>,
  morphTargets: gsap.TweenVars[],
  duration = 1,
  stagger = 0.2
) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { animateElement } = useAnimations()

  const morphTo = useCallback((targetIndex: number) => {
    if (!elementRef.current || targetIndex === currentIndex) return

    const animationId = `morph-${Math.random().toString(36).substr(2, 9)}`
    animateElement(animationId, elementRef.current, morphTargets[targetIndex], undefined)
    setCurrentIndex(targetIndex)
  }, [elementRef, morphTargets, currentIndex, animateElement])

  const nextMorph = useCallback(() => {
    const nextIndex = (currentIndex + 1) % morphTargets.length
    morphTo(nextIndex)
  }, [currentIndex, morphTargets.length, morphTo])

  const prevMorph = useCallback(() => {
    const prevIndex = currentIndex === 0 ? morphTargets.length - 1 : currentIndex - 1
    morphTo(prevIndex)
  }, [currentIndex, morphTargets.length, morphTo])

  return {
    currentIndex,
    morphTo,
    nextMorph,
    prevMorph
  }
}