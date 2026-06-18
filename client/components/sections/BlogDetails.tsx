"use client";
import React, { useEffect, useState } from "react";
import { Calendar, Clock, Heart, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface BlogDetailsProps {
  slug: string;
}

const BlogDetails = ({ slug }: BlogDetailsProps) => {
  const [blog, setBlog] = useState<any>(null);
  const [popularBlogs, setPopularBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`http://localhost:7900/api/v1/get-blog/slug/${slug}`);
        const data = await res.json();
        setBlog(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPopular = async () => {
      try {
        const res = await fetch(`http://localhost:7900/api/v1/get-all-blogs`);
        const data = await res.json();
        const popular = data.data
          .sort((a: any, b: any) => b.likes - a.likes || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setPopularBlogs(popular);
      } catch (err) {
        console.error(err);
      }
    };

    fetchBlog();
    fetchPopular();
  }, [slug]);

  if (loading)
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <svg
        className="animate-spin h-10 w-10 text-blue-600 mb-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
      <p className="text-gray-500 text-lg font-medium">Loading blog content...</p>
    </div>
  );

if (!blog)
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="bg-red-50 p-6 rounded-2xl shadow-md flex flex-col items-center">
        <svg
          className="h-12 w-12 text-red-400 mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728"
          />
        </svg>
        <p className="text-gray-700 text-lg font-semibold">Oops! Blog not found.</p>
        <p className="text-gray-500 text-sm mt-1 text-center">
          The blog you are looking for might have been removed or the URL is incorrect.
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="relative mb-12 rounded-3xl overflow-hidden shadow-lg">
        <img
          src={blog.image.url}
          alt={blog.title}
          className="w-full h-96 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 text-white z-10 max-w-3xl">
          <span className="bg-blue-600 text-white px-4 py-1 rounded shadow-lg uppercase text-xs font-bold mb-2 inline-block">
            {blog.category.name}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold drop-shadow-lg">
            {blog.title}
          </h1>
          <div className="flex items-center gap-4 mt-4 text-gray-200 text-sm">
            <div className="flex items-center gap-1">
              <User className="h-5 w-5" />
              <span>{blog.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-5 w-5" />
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-5 w-5" />
              <span>5 min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-5 w-5 text-red-500" />
              <span>{blog.likes || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Blog Content */}
        <div className="lg:flex-1 prose prose-lg sm:prose-xl text-gray-700 leading-relaxed text-justify">
            <div dangerouslySetInnerHTML={{ __html: blog.content }} />
            </div>


        {/* Sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="sticky top-20 space-y-8">
            {/* Popular Posts */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Popular Posts</h2>
              <ul className="space-y-4">
                {popularBlogs.map((post) => (
                  <li
                    key={post._id}
                    className="flex gap-4 cursor-pointer hover:bg-gray-100 p-2 rounded transition-all"
                    onClick={() => router.push(`/pages/blogs/${post.slug}`)}
                  >
                    <img
                      src={post.image?.url}
                      alt={post.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex flex-col justify-between">
                      <span className="font-semibold text-gray-900 line-clamp-2">
                        {post.title}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            

            {/* Categories */}
            <div className="bg-white p-6 rounded shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {[...new Set(popularBlogs.map((b) => b.category.name))].map((cat) => (
                  <span
                    key={cat}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded text-sm font-medium cursor-pointer hover:scale-105 transform transition"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetails;
