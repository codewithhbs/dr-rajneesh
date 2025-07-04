import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com','lh3.googleusercontent.com','api.dicebear.com']
  },
   typescript: {
    ignoreBuildErrors: true, 
  },
};

export default nextConfig;
