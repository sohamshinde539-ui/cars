'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  Environment,
  OrbitControls,
  PresentationControls,
  ContactShadows,
  Float,
  Center,
  useProgress,
  Html
} from '@react-three/drei'
import * as THREE from 'three'
import { CarViewer } from '@/components/3D/CarViewer'
import { FadeInUp, ParallaxElement } from '@/components/Animation/ScrollController'
import { useEntranceAnimation, useTypewriter } from '@/hooks/useAnimations'
import { CarModel } from '@/types'

interface HeroProps {
  featuredCar?: CarModel
  className?: string
}

// Loading indicator for 3D model
function HeroLoader() {
  const { progress } = useProgress()

  return (
    <Html center>
      <div className="flex flex-col items-center space-y-3">
        <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white text-sm font-medium">Loading Experience... {Math.round(progress)}%</p>
      </div>
    </Html>
  )
}

// Floating particles for visual enhancement
function Particles() {
  const particlesRef = useRef<THREE.Points>(null)

  useEffect(() => {
    if (particlesRef.current) {
      const particleCount = 50
      const positions = new Float32Array(particleCount * 3)

      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 20
        positions[i + 1] = (Math.random() - 0.5) * 20
        positions[i + 2] = (Math.random() - 0.5) * 20
      }

      particlesRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    }
  }, [])

  return (
    <points ref={particlesRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

export function Hero({ featuredCar, className = '' }: HeroProps) {
  const [isLoading, setIsLoading] = useState(true)
  const heroRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Entrance animations
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEntranceAnimation(titleRef, 'fadeInUp', 0)
  useEntranceAnimation(subtitleRef, 'fadeInUp', 0.2)
  useEntranceAnimation(ctaRef, 'fadeInUp', 0.4)

  // Typewriter effect for subtitle
  const { displayText: typewriterText } = useTypewriter(
    subtitleRef,
    "Experience the future of automotive excellence with our interactive 3D showroom.",
    0.03,
    0.8
  )

  // Handle model loading
  const handleModelLoad = () => {
    setIsLoading(false)
  }

  const handleModelError = (error: Error) => {
    console.error('Hero model loading error:', error)
    setIsLoading(false)
  }

  // Mock featured car data for demonstration
  const mockFeaturedCar: CarModel = featuredCar || {
    id: '1',
    uid: 'featured-luxury-sedan',
    name: 'Luxury Performance Sedan',
    brand: 'Mercedes-Benz',
    carType: 'Luxury',
    priceCategory: 'Luxury',
    modelYear: 2024,
    price: 125000,
    description: 'Experience unparalleled luxury and performance',
    modelFile: '/models/luxury-sedan.glb',
    modelThumbnail: '/images/luxury-sedan-thumb.jpg',
    featured: true
  }

  return (
    <section
      ref={heroRef}
      className={`relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 ${className}`}
    >
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas
          ref={canvasRef}
          camera={{
            position: [0, 2, 10],
            fov: 35,
            near: 0.1,
            far: 1000
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          }}
          className="opacity-70"
        >
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4a90e2" />

          <Suspense fallback={<HeroLoader />}>
            <Particles />

            {mockFeaturedCar && (
              <PresentationControls
                global
                rotation={[0.1, -0.3, 0]}
                polar={[-0.2, 0.6]}
                azimuth={[-Math.PI / 2, Math.PI / 2]}
                config={{ mass: 2, tension: 400 }}
                snap={{ mass: 4, tension: 400 }}
              >
                <Float speed={1} rotationIntensity={0.1} floatIntensity={0.1}>
                  <Center>
                    {/* 3D Car Model - Replace with actual model */}
                    <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 6, 0]}>
                      <boxGeometry args={[3, 1.5, 6]} />
                      <meshStandardMaterial
                        color="#1e293b"
                        metalness={0.9}
                        roughness={0.1}
                        envMapIntensity={2}
                      />
                    </mesh>
                  </Center>
                </Float>
              </PresentationControls>
            )}

            <ContactShadows
              position={[0, -1, 0]}
              opacity={0.4}
              scale={20}
              blur={2}
              far={20}
            />

            <Environment
              files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr"
              background={false}
              environmentIntensity={0.5}
            />

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 2}
              autoRotate={true}
              autoRotateSpeed={0.5}
              enableDamping
              dampingFactor={0.05}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/50 z-10" />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 pt-20 pb-32 text-center">
        <ParallaxElement speed="slow">
          <div className="max-w-4xl mx-auto">
            {/* Title */}
            <FadeInUp>
              <h1
                ref={titleRef}
                className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight"
              >
                <span className="bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent">
                  Discover
                </span>
                <br />
                <span className="text-white">Excellence</span>
              </h1>
            </FadeInUp>

            {/* Subtitle with typewriter effect */}
            <FadeInUp delay={0.2}>
              <p
                ref={subtitleRef}
                className="text-lg md:text-xl text-blue-200 mb-8 max-w-2xl mx-auto leading-relaxed font-light"
              >
                {typewriterText}
              </p>
            </FadeInUp>

            {/* Call to Action Buttons */}
            <FadeInUp delay={0.4}>
              <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button className="group relative px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:bg-blue-700 hover:scale-105 hover:shadow-2xl">
                  <span className="relative z-10 flex items-center gap-2">
                    Explore Collection
                    <svg
                      className="w-5 h-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>

                <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg backdrop-blur-sm hover:bg-white/10 hover:border-white/50 transition-all duration-300 hover:scale-105">
                  Watch Demo
                </button>
              </div>
            </FadeInUp>

            {/* Featured Car Info */}
            {mockFeaturedCar && (
              <FadeInUp delay={0.6}>
                <div className="mt-16 p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 max-w-md mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{mockFeaturedCar.name}</h3>
                      <p className="text-blue-200">{mockFeaturedCar.brand} • {mockFeaturedCar.modelYear}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-400">
                        ${mockFeaturedCar.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-200">Starting MSRP</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full text-sm">
                      {mockFeaturedCar.carType}
                    </span>
                    <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm">
                      {mockFeaturedCar.priceCategory}
                    </span>
                    <span className="px-3 py-1 bg-green-600/30 text-green-300 rounded-full text-sm">
                      Featured
                    </span>
                  </div>
                </div>
              </FadeInUp>
            )}

            {/* Scroll Indicator */}
            <FadeInUp delay={0.8}>
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                  <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
                </div>
                <p className="text-white/60 text-sm mt-2">Scroll to explore</p>
              </div>
            </FadeInUp>
          </div>
        </ParallaxElement>
      </div>

      {/* Performance indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 z-30 bg-black/50 backdrop-blur-sm p-3 rounded-lg text-white text-xs font-mono">
          <p>3D Scene Active</p>
          <p>Auto-rotating: ON</p>
          <p>Particles: 50</p>
        </div>
      )}
    </section>
  )
}