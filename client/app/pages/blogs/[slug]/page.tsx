"use client";

import BlogDetails from "@/components/sections/BlogDetails";

interface BlogPageProps {
  params: { slug: string };
}

const BlogPage = ({ params }: BlogPageProps) => {
  return <BlogDetails slug={params.slug} />;
};

export default BlogPage;
