"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Heart,
  ArrowRight,
  BookOpen,
} from "lucide-react";

const Blogs = () => {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [blogsPerSlide, setBlogsPerSlide] = useState(3);

  // Fetch blogs from API
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch("http://localhost:7900/api/v1/get-all-blogs");
        const data = await res.json();
        setBlogs(data.data.filter((blog) => blog.status === "published"));
      } catch (error) {
        console.error("Error fetching blogs:", error);
      }
    };
    fetchBlogs();
  }, []);

  // Responsive blogs per slide
  useEffect(() => {
    const updateBlogsPerSlide = () => {
      if (window.innerWidth < 768) setBlogsPerSlide(1);
      else if (window.innerWidth < 1024) setBlogsPerSlide(2);
      else setBlogsPerSlide(3);
    };
    updateBlogsPerSlide();
    window.addEventListener("resize", updateBlogsPerSlide);
    return () => window.removeEventListener("resize", updateBlogsPerSlide);
  }, []);

  // Filter blogs
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || blog.category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalSlides = Math.ceil(filteredBlogs.length / blogsPerSlide);

  useEffect(() => {
    setCurrentSlide(0);
  }, [searchTerm, selectedCategory, blogsPerSlide]);

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) setCurrentSlide((prev) => prev + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide((prev) => prev - 1);
  };

  const getCurrentBlogs = () => {
    const start = currentSlide * blogsPerSlide;
    return filteredBlogs.slice(start, start + blogsPerSlide);
  };

  // Navigate to blog details page
  const handleBlogClick = (slug: string) => {
    router.push(`/pages/blogs/${slug}`);
  };


  if (blogs.length === 0) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center py-20 px-4">
          <div className="w-24 h-24 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            No Blogs Available
          </h2>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            We're working on creating amazing content for you. Please check back
            soon for our latest health and wellness insights.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Subscribe for Updates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Health & Wellness
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Insights</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-4">
              Expert insights, tips, and advice on chiropractic care, physiotherapy, and overall wellness from our healthcare professionals
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Latest Research</span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Expert Tips</span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Patient Stories</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* All Articles */}
      {filteredBlogs.length > 0 && (
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 sm:mb-4">
                  All Articles
                </h2>
                <p className="text-gray-600 max-w-md">
                  Browse our complete collection of health and wellness articles
                  curated for you.
                </p>
              </div>
              {totalSlides > 1 && (
                <div className="flex gap-2 justify-center sm:justify-end">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className={`p-3 rounded-full border border-gray-200 bg-white shadow-sm transition-all ${currentSlide === 0
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-lg hover:bg-gray-50"
                      }`}
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    onClick={nextSlide}
                    disabled={currentSlide === totalSlides - 1}
                    className={`p-3 rounded-full border border-gray-200 bg-white shadow-sm transition-all ${currentSlide === totalSlides - 1
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-lg hover:bg-gray-50"
                      }`}
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Blog Cards */}
            <div className="overflow-hidden">
              <div
                className={`grid gap-6 transition-transform duration-500 ease-in-out ${blogsPerSlide === 1
                    ? "grid-cols-1"
                    : blogsPerSlide === 2
                      ? "grid-cols-2"
                      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  }`}
              >
                {getCurrentBlogs().map((blog) => (
                  <div key={blog._id} className="group cursor-pointer">
                    <div
                      onClick={() => handleBlogClick(blog.slug)}
                      className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="relative h-48 sm:h-56">
                        <img
                          src={blog.image.url}
                          alt={blog.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute top-4 right-4 bg-[#155DFC] text-white text-xs font-semibold px-3 py-1 rounded-lg shadow-md">
                          {blog.category.name}
                        </span>
                      </div>
                      <div className="p-4 sm:p-6 flex flex-col justify-between">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2">
                          {blog.title}
                        </h3>
                        <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed line-clamp-3">
                          {blog.content.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 120)}...
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm text-gray-500 mb-4">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span>5 min read</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <span>100</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                              {blog.author.charAt(0)}
                            </div>
                            <span className="text-gray-900 font-medium">{blog.author}</span>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-600 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Blogs;
