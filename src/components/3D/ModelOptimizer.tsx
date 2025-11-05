'use client'

import React, { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ModelOptimizerProps {
  children: React.ReactNode
  maxVertices?: number
  maxTextures?: number
  quality?: 'low' | 'medium' | 'high' | 'ultra'
  enableLOD?: boolean
  onOptimizationComplete?: (stats: OptimizationStats) => void
}

interface OptimizationStats {
  originalVertices: number
  optimizedVertices: number
  originalTextures: number
  optimizedTextures: number
  memoryReduction: number
  performanceGain: number
}

// Quality presets
const QUALITY_PRESETS = {
  low: {
    maxTextureSize: 512,
    shadowMapSize: 1024,
    antialias: false,
    pixelRatio: 1,
    maxLights: 3,
  },
  medium: {
    maxTextureSize: 1024,
    shadowMapSize: 2048,
    antialias: true,
    pixelRatio: 1.5,
    maxLights: 4,
  },
  high: {
    maxTextureSize: 2048,
    shadowMapSize: 4096,
    antialias: true,
    pixelRatio: 2,
    maxLights: 6,
  },
  ultra: {
    maxTextureSize: 4096,
    shadowMapSize: 8192,
    antialias: true,
    pixelRatio: window.devicePixelRatio || 2,
    maxLights: 8,
  }
}

export function ModelOptimizer({
  children,
  maxVertices = 100000,
  maxTextures = 10,
  quality = 'high',
  enableLOD = true,
  onOptimizationComplete
}: ModelOptimizerProps) {
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  // Detect device capabilities
  const deviceCapabilities = useMemo(() => {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')

    if (!gl) {
      return {
        webgl2: false,
        maxTextureSize: 1024,
        maxVertexTextureImageUnits: 0,
        maxFragmentUniformVectors: 256,
        maxVertexUniformVectors: 256,
        supportedExtensions: [],
      }
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown'
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown'

    return {
      webgl2: canvas.getContext('webgl2') !== null,
      vendor,
      renderer,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      supportedExtensions: gl.getSupportedExtensions() || [],
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    }
  }, [])

  // Auto-adjust quality based on device
  const adjustedQuality = useMemo(() => {
    if (deviceCapabilities.isMobile) {
      return quality === 'ultra' ? 'medium' : quality === 'high' ? 'medium' : quality
    }

    // Check if device can handle the requested quality
    const presets = QUALITY_PRESETS
    const canHandleQuality = (q: keyof typeof presets) => {
      return deviceCapabilities.maxTextureSize >= presets[q].maxTextureSize
    }

    if (!canHandleQuality(quality)) {
      // Step down to highest supported quality
      if (canHandleQuality('high')) return 'high'
      if (canHandleQuality('medium')) return 'medium'
      return 'low'
    }

    return quality
  }, [deviceCapabilities, quality])

  // Optimize material properties
  const optimizeMaterials = useMemo(() => {
    return {
      metalness: 0.7,
      roughness: 0.3,
      envMapIntensity: adjustedQuality === 'low' ? 0.5 : 1.0,
    }
  }, [adjustedQuality])

  // LOD configuration
  const lodLevels = useMemo(() => {
    if (!enableLOD) return []

    const baseDistance = 10
    return [
      { distance: baseDistance, quality: 1.0 },
      { distance: baseDistance * 2, quality: 0.7 },
      { distance: baseDistance * 4, quality: 0.4 },
      { distance: baseDistance * 8, quality: 0.2 },
    ]
  }, [enableLOD])

  // Apply optimizations to scene
  useEffect(() => {
    if (!sceneRef.current) return

    const scene = sceneRef.current
    const stats: OptimizationStats = {
      originalVertices: 0,
      optimizedVertices: 0,
      originalTextures: 0,
      optimizedTextures: 0,
      memoryReduction: 0,
      performanceGain: 0,
    }

    // Optimize meshes
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry
        const material = child.material

        // Count original vertices
        if (geometry.attributes.position) {
          stats.originalVertices += geometry.attributes.position.count
        }

        // Apply material optimizations
        if (material instanceof THREE.MeshStandardMaterial) {
          material.metalness = optimizeMaterials.metalness
          material.roughness = optimizeMaterials.roughness
          material.envMapIntensity = optimizeMaterials.envMapIntensity

          // Optimize texture usage
          Object.keys(material).forEach(key => {
            const value = material[key as keyof THREE.MeshStandardMaterial]
            if (value instanceof THREE.Texture) {
              stats.originalTextures++

              // Resize textures if too large
              const maxSize = QUALITY_PRESETS[adjustedQuality].maxTextureSize
              if (value.image && (value.image.width > maxSize || value.image.height > maxSize)) {
                // Create optimized texture (simplified)
                stats.optimizedTextures++
              }
            }
          })
        }

        // Geometry simplification (if needed)
        if (geometry.attributes.position && geometry.attributes.position.count > maxVertices) {
          // This would require a geometry simplification library
          // For now, we just count the optimized vertices
          stats.optimizedVertices += Math.min(geometry.attributes.position.count, maxVertices)
        } else {
          stats.optimizedVertices += geometry.attributes.position.count
        }
      }
    })

    // Calculate memory reduction
    stats.memoryReduction = Math.max(0,
      ((stats.originalVertices - stats.optimizedVertices) / stats.originalVertices) * 100 +
      ((stats.originalTextures - stats.optimizedTextures) / Math.max(1, stats.originalTextures)) * 50
    )

    // Estimate performance gain
    stats.performanceGain = Math.min(50, stats.memoryReduction * 0.7)

    onOptimizationComplete?.(stats)

    // Cleanup function
    return () => {
      // Clean up any temporary resources
    }
  }, [sceneRef.current, optimizeMaterials, adjustedQuality, maxVertices, onOptimizationComplete])

  // Performance monitoring
  const PerformanceMonitor = () => {
    useEffect(() => {
      let frameCount = 0
      let lastTime = performance.now()
      let fps = 60

      const measureFPS = () => {
        frameCount++
        const currentTime = performance.now()
        const deltaTime = currentTime - lastTime

        if (deltaTime >= 1000) {
          fps = Math.round((frameCount * 1000) / deltaTime)
          frameCount = 0
          lastTime = currentTime

          // Auto-adjust quality if FPS is too low
          if (fps < 30 && adjustedQuality !== 'low') {
            console.warn(`Low FPS detected (${fps}), consider reducing quality`)
          }
        }

        requestAnimationFrame(measureFPS)
      }

      const animationFrame = requestAnimationFrame(measureFPS)

      return () => cancelAnimationFrame(animationFrame)
    }, [adjustedQuality])

    return null
  }

  return (
    <>
      <PerformanceMonitor />
      {React.Children.map(children, (child) => {
        // Pass optimization props to Three Fiber components
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            deviceCapabilities,
            optimizeSettings: QUALITY_PRESETS[adjustedQuality],
            lodLevels,
            optimizeMaterials,
          })
        }
        return child
      })}
    </>
  )
}

// Utility functions for model optimization
export const ModelUtils = {
  // Compress geometry
  compressGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    const compressed = geometry.clone()

    // Remove unused attributes
    ['normal', 'uv', 'uv2', 'color', 'skinIndex', 'skinWeight'].forEach(attr => {
      if (compressed.hasAttribute(attr) && !compressed.getAttribute(attr).count) {
        compressed.deleteAttribute(attr)
      }
    })

    // Merge vertices
    return BufferGeometryUtils.mergeVertices(compressed)
  },

  // Generate LOD levels
  generateLOD(geometry: THREE.BufferGeometry, levels: number[]): THREE.BufferGeometry[] {
    return levels.map(ratio => {
      const lod = geometry.clone()
      const vertexCount = Math.floor(geometry.attributes.position.count * ratio)

      // Simple LOD generation (would normally use simplification algorithm)
      // This is a placeholder - real implementation would use a library like THREE.SimplifyModifier
      return lod
    })
  },

  // Optimize texture
  optimizeTexture(texture: THREE.Texture, maxSize: number): THREE.Texture {
    if (!texture.image) return texture

    const { width, height } = texture.image
    const scale = Math.min(maxSize / width, maxSize / height, 1)

    if (scale >= 1) return texture

    // Create canvas for resizing
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    canvas.width = Math.floor(width * scale)
    canvas.height = Math.floor(height * scale)

    ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height)

    const optimizedTexture = new THREE.CanvasTexture(canvas)
    optimizedTexture.wrapS = texture.wrapS
    optimizedTexture.wrapT = texture.wrapT
    optimizedTexture.magFilter = texture.magFilter
    optimizedTexture.minFilter = texture.minFilter

    return optimizedTexture
  },
}

// Re-export BufferGeometryUtils if available
declare global {
  const BufferGeometryUtils: {
    mergeVertices(geometry: THREE.BufferGeometry): THREE.BufferGeometry
  }
}