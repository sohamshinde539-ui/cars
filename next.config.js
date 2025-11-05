/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['images.prismic.io'],
  },
  webpack: (config) => {
    // WebGL and Three.js support
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };

    // Handle GLB/GLTF files
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/assets/',
          outputPath: 'static/assets/',
        },
      },
    });

    return config;
  },
  // Enable React strict mode
  reactStrictMode: true,
  // Enable source maps in production for debugging
  productionBrowserSourceMaps: false,
  // Compress assets
  compress: true,
  // Powered by header
  poweredByHeader: false,
}

module.exports = nextConfig