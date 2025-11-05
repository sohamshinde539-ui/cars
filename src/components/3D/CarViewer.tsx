'use client'

import React, { Suspense, useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Stage,
  PresentationControls,
  ContactShadows,
  Float,
  Center,
  useGLTF,
  useProgress,
  Html
} from '@react-three/drei'
import * as THREE from 'three'
import { CarModel, ViewerState, ModelLoadingProgress } from '@/types'

// Loading component
function Loader() {
  const { progress, item, loaded, total } = useProgress()

  return (
    <Html center>
      <div className="flex flex-col items-center space-y-4 p-6 bg-white/90 backdrop-blur rounded-xl shadow-xl">
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 font-medium">
          Loading 3D Model... {Math.round(progress)}%
        </p>
        <p className="text-xs text-gray-500">
          {item ? `Loading: ${item}` : `${loaded} / ${total} files`}
        </p>
      </div>
    </Html>
  )
}

// Error fallback component
function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-100 rounded-xl">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">3D Model Loading Failed</h3>
        <p className="text-sm text-gray-600 max-w-sm">
          {error.message || 'Failed to load the 3D model. The file might be corrupted or unsupported.'}
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

// Car model component
function CarModel({
  modelUrl,
  scale = 1,
  rotation = [0, 0, 0],
  position = [0, 0, 0]
}: {
  modelUrl: string
  scale?: number
  rotation?: [number, number, number]
  position?: [number, number, number]
}) {
  const meshRef = useRef<THREE.Group>(null)
  const [error, setError] = useState<Error | null>(null)

  try {
    const gltf = useGLTF(modelUrl, true) // Use draco loader for compression
    const { scene } = gltf

    useEffect(() => {
      if (meshRef.current) {
        // Optimize the scene
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Enable shadows
            child.castShadow = true
            child.receiveShadow = true

            // Optimize materials
            if (child.material) {
              child.material = new THREE.MeshStandardMaterial({
                ...child.material,
                metalness: 0.8,
                roughness: 0.2,
              })
            }
          }
        })

        // Center the model
        const box = new THREE.Box3().setFromObject(scene)
        const center = box.getCenter(new THREE.Vector3())
        meshRef.current.position.x = -center.x
        meshRef.current.position.y = -center.y
        meshRef.current.position.z = -center.z
      }
    }, [scene])

    // Handle auto-rotation
    useFrame((state, delta) => {
      if (meshRef.current) {
        meshRef.current.rotation.y += delta * 0.2 // Slow rotation
      }
    })

    return (
      <group
        ref={meshRef}
        scale={scale}
        rotation={rotation}
        position={position}
      >
        <primitive object={scene} />
      </group>
    )
  } catch (err) {
    console.error('Error loading 3D model:', err)
    setError(err as Error)
    return null
  }
}

// Lighting setup
function LightingSetup() {
  return (
    <>
      {/* Main directional light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Fill lights */}
      <pointLight position={[-10, 10, -5]} intensity={0.5} color="#4a90e2" />
      <pointLight position={[10, -10, 5]} intensity={0.3} color="#ff6b6b" />

      {/* Rim light */}
      <spotLight
        position={[-5, 5, 10]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#f39c12"
      />

      {/* Ambient light */}
      <ambientLight intensity={0.4} />
    </>
  )
}

// Main Car Viewer component
interface CarViewerProps {
  car: CarModel
  className?: string
  autoRotate?: boolean
  showControls?: boolean
  enableFullscreen?: boolean
  onLoad?: (progress: ModelLoadingProgress) => void
  onError?: (error: Error) => void
}

export function CarViewer({
  car,
  className = '',
  autoRotate = true,
  showControls = true,
  enableFullscreen = true,
  onLoad,
  onError
}: CarViewerProps) {
  const [viewerState, setViewerState] = useState<ViewerState>({
    isAutoRotating: autoRotate,
    isFullscreen: false,
    currentView: 'exterior',
    zoom: 1,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
    lighting: {
      intensity: 1,
      environment: 'studio',
      shadows: true
    }
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  const handleRetry = useCallback(() => {
    setError(null)
    setIsLoading(true)
    setRetryKey(prev => prev + 1)
  }, [])

  const handleError = useCallback((err: Error) => {
    console.error('3D model loading error:', err)
    setError(err)
    setIsLoading(false)
    onError?.(err)
  }, [onError])

  const toggleAutoRotate = useCallback(() => {
    setViewerState(prev => ({
      ...prev,
      isAutoRotating: !prev.isAutoRotating
    }))
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setViewerState(prev => ({ ...prev, isFullscreen: true }))
    } else {
      document.exitFullscreen()
      setViewerState(prev => ({ ...prev, isFullscreen: false }))
    }
  }, [])

  const resetView = useCallback(() => {
    setViewerState(prev => ({
      ...prev,
      zoom: 1,
      rotation: { x: 0, y: 0, z: 0 },
      position: { x: 0, y: 0, z: 0 }
    }))
  }, [])

  if (error) {
    return <ErrorFallback error={error} onRetry={handleRetry} />
  }

  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden ${className}`}>
      <Canvas
        key={retryKey}
        shadows
        camera={{
          position: [5, 2, 5],
          fov: 50,
          near: 0.1,
          far: 100
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        className="three-viewer"
      >
        <Suspense fallback={<Loader />}>
          {/* Lighting */}
          <LightingSetup />

          {/* Environment */}
          <Environment
            files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr"
            background={false}
            environmentIntensity={viewerState.lighting.intensity}
          />

          {/* Main car model */}
          <PresentationControls
            global
            rotation={[0.1, -0.3, 0]}
            polar={[-0.2, 0.6]}
            azimuth={[-Math.PI / 2, Math.PI / 2]}
            config={{ mass: 2, tension: 400 }}
            snap={{ mass: 4, tension: 400 }}
          >
            <Float speed={viewerState.isAutoRotating ? 1 : 0} rotationIntensity={0.1}>
              <Center>
                <CarModel
                  modelUrl={car.modelFile}
                  scale={0.02}
                  rotation={[0, Math.PI / 6, 0]}
                />
              </Center>
            </Float>
          </PresentationControls>

          {/* Contact shadows */}
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.6}
            scale={10}
            blur={2}
            far={20}
          />

          {/* Controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2}
            maxDistance={10}
            autoRotate={viewerState.isAutoRotating}
            autoRotateSpeed={2}
            enableDamping
            dampingFactor={0.05}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>

      {/* Overlay controls */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
          <button
            onClick={toggleAutoRotate}
            className="p-3 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/70 transition-colors"
            title={viewerState.isAutoRotating ? 'Stop Rotation' : 'Start Rotation'}
          >
            {viewerState.isAutoRotating ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>

          {enableFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/70 transition-colors"
              title="Toggle Fullscreen"
            >
              {viewerState.isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          )}

          <button
            onClick={resetView}
            className="p-3 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/70 transition-colors"
            title="Reset View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      )}

      {/* Car info overlay */}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm p-4 rounded-lg text-white max-w-xs">
        <h3 className="font-bold text-lg">{car.name}</h3>
        <p className="text-sm text-gray-300">{car.brand} • {car.modelYear}</p>
        <p className="text-lg font-semibold text-blue-400">
          ${car.price.toLocaleString()}
        </p>
      </div>
    </div>
  )
}

// Preload common models for better performance
export function preloadModels(modelUrls: string[]) {
  modelUrls.forEach(url => {
    useGLTF.preload(url)
  })
}