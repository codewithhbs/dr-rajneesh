import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  images: {
    domains: [
      "res.cloudinary.com",
      "lh3.googleusercontent.com",
      "api.dicebear.com",
      "images.unsplash.com",
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // 🔥 CRITICAL FIX FOR YOUR ERROR
  webpack: (config) => {
    config.cache = false; // prevents corrupted chunks
    return config;
  },
};

export default nextConfig;
