'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Touch gesture types
type TouchGesture = 'single' | 'double' | 'pinch' | 'pan' | 'none'

interface TouchPoint {
  id: number
  x: number
  y: number
  startX: number
  startY: number
}

interface TouchControlsProps {
  onSingleTap?: (x: number, y: number) => void
  onDoubleTap?: (x: number, y: number) => void
  onPinch?: (scale: number, centerX: number, centerY: number) => void
  onPan?: (deltaX: number, deltaY: number) => void
  onRotate?: (angle: number) => void
  children?: React.ReactNode
}

export function TouchControls({
  onSingleTap,
  onDoubleTap,
  onPinch,
  onPan,
  onRotate,
  children
}: TouchControlsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const touchPoints = useRef<TouchPoint[]>([])
  const lastDistance = useRef(0)
  const lastAngle = useRef(0)
  const gestureTimeout = useRef<NodeJS.Timeout>()
  const tapCount = useRef(0)
  const lastTapTime = useRef(0)
  const [gesture, setGesture] = useState<TouchGesture>('none')

  // Calculate distance between two touch points
  const getDistance = (point1: Touch, point2: Touch): number => {
    const dx = point2.clientX - point1.clientX
    const dy = point2.clientY - point1.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Calculate angle between two touch points
  const getAngle = (point1: Touch, point2: Touch): number => {
    return Math.atan2(point2.clientY - point1.clientY, point2.clientX - point1.clientX)
  }

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()

    const touches = Array.from(e.touches)

    // Clear existing timeout
    if (gestureTimeout.current) {
      clearTimeout(gestureTimeout.current)
    }

    // Reset tap count if too much time has passed
    const now = Date.now()
    if (now - lastTapTime.current > 300) {
      tapCount.current = 0
    }

    // Update touch points
    touchPoints.current = touches.map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      startX: touch.clientX,
      startY: touch.clientY,
    }))

    // Determine gesture type
    if (touches.length === 1) {
      setGesture('single')
    } else if (touches.length === 2) {
      setGesture('pinch')
      lastDistance.current = getDistance(touches[0], touches[1])
      lastAngle.current = getAngle(touches[0], touches[1])
    }
  }

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()

    const touches = Array.from(e.touches)

    if (touches.length === 1 && gesture === 'pan') {
      // Pan gesture
      const touch = touches[0]
      const point = touchPoints.current.find(p => p.id === touch.identifier)

      if (point) {
        const deltaX = touch.clientX - point.x
        const deltaY = touch.clientY - point.y

        onPan?.(deltaX, deltaY)

        // Update position
        point.x = touch.clientX
        point.y = touch.clientY
      }
    } else if (touches.length === 2 && gesture === 'pinch') {
      // Pinch gesture
      const distance = getDistance(touches[0], touches[1])
      const angle = getAngle(touches[0], touches[1])

      if (onPinch && lastDistance.current > 0) {
        const scale = distance / lastDistance.current
        const centerX = (touches[0].clientX + touches[1].clientX) / 2
        const centerY = (touches[0].clientY + touches[1].clientY) / 2
        onPinch(scale, centerX, centerY)
      }

      if (onRotate && lastAngle.current !== 0) {
        const deltaAngle = angle - lastAngle.current
        onRotate(deltaAngle)
      }

      lastDistance.current = distance
      lastAngle.current = angle
    }
  }

  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()

    const touches = Array.from(e.touches)
    const changedTouches = Array.from(e.changedTouches)

    if (touches.length === 0) {
      // All touches ended
      if (gesture === 'single' && touchPoints.current.length === 1) {
        // Check for tap
        const point = touchPoints.current[0]
        const deltaX = Math.abs(point.x - point.startX)
        const deltaY = Math.abs(point.y - point.startY)

        if (deltaX < 10 && deltaY < 10) {
          // It's a tap
          tapCount.current++
          lastTapTime.current = Date.now()

          if (tapCount.current === 1) {
            // Wait for potential second tap
            gestureTimeout.current = setTimeout(() => {
              if (tapCount.current === 1) {
                onSingleTap?.(point.x, point.y)
              }
              tapCount.current = 0
            }, 300)
          } else if (tapCount.current === 2) {
            // Double tap
            if (gestureTimeout.current) {
              clearTimeout(gestureTimeout.current)
            }
            onDoubleTap?.(point.x, point.y)
            tapCount.current = 0
          }
        } else {
          // It was a pan gesture
          tapCount.current = 0
        }
      }

      // Reset gesture state
      setGesture('none')
      touchPoints.current = []
      lastDistance.current = 0
      lastAngle.current = 0
    }
  }

  return (
    <div
      ref={containerRef}
      className="touch-manipulation"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {children}
    </div>
  )
}

// Enhanced OrbitControls with touch support
export function TouchOrbitControls({
  camera,
  domElement,
  enablePan = true,
  enableZoom = true,
  enableRotate = true,
  minDistance = 1,
  maxDistance = 100,
  minPolarAngle = 0,
  maxPolarAngle = Math.PI,
  autoRotate = false,
  autoRotateSpeed = 2
}: {
  camera: THREE.PerspectiveCamera
  domElement: HTMLElement
  enablePan?: boolean
  enableZoom?: boolean
  enableRotate?: boolean
  minDistance?: number
  maxDistance?: number
  minPolarAngle?: number
  maxPolarAngle?: number
  autoRotate?: boolean
  autoRotateSpeed?: number
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isPinching, setIsPinching] = useState(false)
  const spherical = useRef(new THREE.Spherical())
  const sphericalDelta = useRef(new THREE.Spherical())
  const scale = useRef(1)
  const panOffset = useRef(new THREE.Vector3())
  const rotateStart = useRef({ x: 0, y: 0 })
  const rotateEnd = useRef({ x: 0, y: 0 })
  const rotateDelta = useRef({ x: 0, y: 0 })

  // Update camera position
  const updateCamera = () => {
    const offset = new THREE.Vector3()
    const quat = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0))
    const quatInverse = quat.clone().invert()

    // Apply rotation
    offset.copy(camera.position).sub(panOffset.current)
    offset.applyQuaternion(quat)

    spherical.current.setFromVector3(offset)

    if (autoRotate && !isDragging) {
      sphericalDelta.current.theta -= (2 * Math.PI) / (60 * autoRotateSpeed)
    }

    spherical.current.theta += sphericalDelta.current.theta
    spherical.current.phi += sphericalDelta.current.phi
    spherical.current.phi = Math.max(minPolarAngle, Math.min(maxPolarAngle, spherical.current.phi))
    spherical.current.makeSafe()

    spherical.radius *= scale.current
    spherical.radius = Math.max(minDistance, Math.min(maxDistance, spherical.radius))

    offset.setFromSpherical(spherical.current)
    offset.applyQuaternion(quatInverse)

    camera.position.copy(panOffset.current).add(offset)
    camera.lookAt(panOffset.current)
  }

  // Handle mouse wheel zoom
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()

    if (!enableZoom) return

    const delta = e.deltaY
    scale.current = Math.pow(0.95, delta * 0.01)

    updateCamera()
  }

  // Handle touch controls
  const handleTouchControls = (e: TouchEvent) => {
    const touches = Array.from(e.touches)

    if (touches.length === 1) {
      // Single finger - rotation
      const touch = touches[0]

      if (e.type === 'touchstart') {
        isDragging && setIsDragging(true)
        rotateStart.current = { x: touch.clientX, y: touch.clientY }
      } else if (e.type === 'touchmove' && enableRotate) {
        rotateEnd.current = { x: touch.clientX, y: touch.clientY }
        rotateDelta.current = {
          x: (rotateEnd.current.x - rotateStart.current.x) * 0.01,
          y: (rotateEnd.current.y - rotateStart.current.y) * 0.01
        }
        rotateStart.current = rotateEnd.current

        sphericalDelta.current.theta -= rotateDelta.current.x
        sphericalDelta.current.phi -= rotateDelta.current.y

        updateCamera()
      }
    } else if (touches.length === 2) {
      // Two fingers - zoom and pan
      if (e.type === 'touchmove') {
        const distance = Math.sqrt(
          Math.pow(touches[1].clientX - touches[0].clientX, 2) +
          Math.pow(touches[1].clientY - touches[0].clientY, 2)
        )

        if (enableZoom && distance > 0) {
          scale.current = Math.pow(0.95, (lastDistance.current - distance) * 0.01)
          lastDistance.current = distance
          updateCamera()
        }
      }
    }
  }

  // Animation loop
  useFrame(() => {
    if (autoRotate) {
      updateCamera()
    }
  })

  useEffect(() => {
    const element = domElement

    // Add event listeners
    element.addEventListener('wheel', handleWheel, { passive: false })
    element.addEventListener('touchstart', handleTouchControls, { passive: false })
    element.addEventListener('touchmove', handleTouchControls, { passive: false })
    element.addEventListener('touchend', handleTouchControls, { passive: false })

    // Initial camera setup
    spherical.current.setFromVector3(camera.position)
    updateCamera()

    return () => {
      element.removeEventListener('wheel', handleWheel)
      element.removeEventListener('touchstart', handleTouchControls)
      element.removeEventListener('touchmove', handleTouchControls)
      element.removeEventListener('touchend', handleTouchControls)
    }
  }, [camera, domElement, enablePan, enableZoom, enableRotate])

  return null
}

// Mobile-friendly controls panel
export function MobileControls({
  onAutoRotateToggle,
  onFullscreenToggle,
  onResetView,
  isAutoRotating,
  isFullscreen
}: {
  onAutoRotateToggle: () => void
  onFullscreenToggle: () => void
  onResetView: () => void
  isAutoRotating: boolean
  isFullscreen: boolean
}) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 md:hidden">
      <div className="bg-black/80 backdrop-blur-md rounded-full px-4 py-2 flex items-center space-x-2">
        <button
          onClick={onAutoRotateToggle}
          className="p-3 text-white rounded-full hover:bg-white/20 transition-colors"
          title={isAutoRotating ? 'Stop Rotation' : 'Start Rotation'}
        >
          {isAutoRotating ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>

        <div className="w-px h-6 bg-white/30" />

        <button
          onClick={onResetView}
          className="p-3 text-white rounded-full hover:bg-white/20 transition-colors"
          title="Reset View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>

        <div className="w-px h-6 bg-white/30" />

        <button
          onClick={onFullscreenToggle}
          className="p-3 text-white rounded-full hover:bg-white/20 transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}