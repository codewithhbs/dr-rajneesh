const { deleteFile } = require("../../middleware/multer");
const Blog = require("../../models/Blogs/Blogs.model");
const {  getRedisClient, cleanRedisDataFlush } = require("../../utils/redis.utils");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");

exports.createBlog = async (req, res) => {
    const redisClient = await getRedisClient(req, res);
    const cacheKey = "blog";

    const file = req.file;
    try {
        const {
            title,
            slug,
            content,
            category,
            status,
            featured,
            metaTitle,
            metaDescription,
            metaKeywords,
        } = req.body;

        // 🔸 Validate required fields
        const emptyFields = [];
        if (!title) emptyFields.push("title is required");
        if (!slug) emptyFields.push("slug is required");
        if (!content) emptyFields.push("content is required");
        if (!category) emptyFields.push("category is required");

        if (emptyFields.length > 0) {
            await deleteFile(file?.path)
            return res.status(400).json({ message: "Missing fields", errors: emptyFields });
        }

        // 🔸 Check if blog with same slug exists
        const isExist = await Blog.findOne({ slug });
        if (isExist) {
                await deleteFile(file?.path)
            return res.status(409).json({ message: "A blog with the same slug already exists" });
        }

        // 🔸 Upload cover image (if exists)
        let imageUploadData = null;
        if (file) {
            imageUploadData = await uploadSingleFile(file);
        }

        // 🔸 Create new blog
        const newBlog = await Blog.create({
            title,
            slug,
            content,
            category,
            status: status || "draft",
            featured: featured || false,
            metaTitle,
            metaDescription,
            metaKeywords,
            image: imageUploadData
                ? {
                    public_id: imageUploadData.public_id,
                    url: imageUploadData.url,
                }
                : null,
        });


        await cleanRedisDataFlush(redisClient,cacheKey)
    

        return res.status(201).json({
            message: "Blog created successfully",
            data: newBlog,
        });
    } catch (error) {
        console.error("Error creating blog:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};


exports.getAllBlogs = async (req, res) => {
  const redisClient = await getRedisClient(req, res);
  const cacheKey = "blog";

  try {
    // Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.status(200).json({ message: "Blogs from cache", data: JSON.parse(cached) });
    }

    const blogs = await Blog.find().sort({ createdAt: -1 }).populate('category');

    // Cache result
    await redisClient.set(cacheKey, JSON.stringify(blogs));

    return res.status(200).json({ message: "All blogs", data: blogs });
  } catch (error) {
    console.error("Get All Blogs Error:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};



exports.getBlogsCount = async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments();

    return res.status(200).json({
      success: true,
      count: totalBlogs
    });
  } catch (error) {
    console.error("Error getting blogs count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get blogs count",
      error: error.message
    });
  }
};


exports.getSingleBlog = async (req, res) => {
  try {
    console.log(req.params.id)
    const blog = await Blog.findById(req.params.id).populate('category');

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    return res.status(200).json({ message: "Blog fetched successfully", data: blog });
  } catch (error) {
    console.error("Get Single Blog Error:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// Get single blog by slug
exports.getSingleBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug }).populate("category");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    return res.status(200).json({
      message: "Blog fetched successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Get Blog by Slug Error:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


exports.deleteBlog = async (req, res) => {
  const redisClient = await getRedisClient(req, res);
  const cacheKey = "blog";

  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Delete cloud image if exists
    if (blog.image?.public_id) {
      await deleteFileCloud(blog.image.public_id);
    }

    await blog.remove();

    await redisClient.del(cacheKey);

    return res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Delete Blog Error:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  const redisClient = await getRedisClient(req, res);
  const cacheKey = "blog";

  const file = req.file;

  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      if (file) await deleteFile(file?.path);
      return res.status(404).json({ message: "Blog not found" });
    }

    const {
      title,
      slug,
      content,
      category,
      status,
      featured,
      metaTitle,
      metaDescription,
      metaKeywords,
    } = req.body;

 
    if (file) {
      if (blog.image?.public_id) {
        await deleteFileCloud(blog.image.public_id);
      }
      const imageUploadData = await uploadSingleFile(file);
      blog.image = {
        public_id: imageUploadData.public_id,
        url: imageUploadData.url,
      };
    }

    blog.title = title || blog.title;
    blog.slug = slug || blog.slug;
    blog.content = content || blog.content;
    blog.category = category || blog.category;
    blog.status = status || blog.status;
    blog.featured = featured || blog.featured;
    blog.metaTitle = metaTitle || blog.metaTitle;
    blog.metaDescription = metaDescription || blog.metaDescription;
    blog.metaKeywords = metaKeywords || blog.metaKeywords;

    await blog.save();
    await redisClient.del(cacheKey);

    return res.status(200).json({ message: "Blog updated successfully", data: blog });
  } catch (error) {
    console.error("Update Blog Error:", error);
    if (file) await deleteFile(file?.path);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};
