"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ServiceImage = {
  _id: string;
  url: string;
};

type ServiceImageCarouselProps = {
  service: {
    service_name: string;
    service_images: ServiceImage[];
  };
};

export default function ServiceImageCarousel({
  service,
}: ServiceImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const total = service.service_images.length;

  const prevSlide = () =>
    setActiveIndex((prev) => (prev - 1 + total) % total);

  const nextSlide = () =>
    setActiveIndex((prev) => (prev + 1) % total);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 ">
      {/* MAIN IMAGE */}
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="relative aspect-[16/10]">
          <Image
            src={
              service.service_images[activeIndex]?.url ||
              "https://images.unsplash.com/photo-1559757148-5c350d0d3c56"
            }
            alt={service.service_name}
            fill
            priority
            className="object-cover transition-transform duration-700 ease-in-out hover:scale-105"
          />
        </div>

        {/* Left Arrow */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition"
        >
          <ChevronRight className="w-6 h-6 text-gray-800" />
        </button>
      </div>

      {/* THUMBNAILS */}
      <div className="flex justify-center gap-4 flex-wrap">
        {service.service_images.map((img, index) => (
          <button
            key={img._id}
            onClick={() => setActiveIndex(index)}
            className={`relative w-24 h-20 rounded-xl overflow-hidden transition-all duration-300
              ${
                index === activeIndex
                  ? "ring-4 ring-blue-500 scale-110 shadow-xl"
                  : "ring-1 ring-gray-300 hover:ring-blue-300"
              }
            `}
          >
            <Image
              src={img.url}
              alt={`Thumbnail ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
