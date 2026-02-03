const BlogCategory = require("../../models/Blogs/BlogCategory");
const { cleanRedisDataFlush, getRedisClient } = require("../../utils/redis.utils");

exports.createCategory = async (req, res) => {
    const redisClient = await getRedisClient(req, res);
    const cacheKey = "blog:categories";
    try {
        const { name, slug, isActive } = req.body;

        if (!name || !slug || typeof isActive !== "boolean") {
            return res.status(400).json({ message: "All fields are required." });
        }

        const isExist = await BlogCategory.findOne({ $or: [{ name }, { slug }] });
        if (isExist) {
            return res.status(409).json({ message: "Category with same name or slug already exists." });
        }

        const newCategory = await BlogCategory.create({ name, slug, isActive });

        await cleanRedisDataFlush(redisClient, cacheKey);

        return res.status(201).json({ message: "Category created successfully", data: newCategory });
    } catch (error) {
        console.error("Error creating category:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const redisClient = await getRedisClient(req, res);
        const cacheKey = "blog:categories";

        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({ fromCache: true, data: JSON.parse(cachedData) });
        }

        const categories = await BlogCategory.find().sort({ createdAt: -1 });
        await redisClient.set(cacheKey, JSON.stringify(categories), 'EX', 300);

        return res.status(200).json({ fromCache: false, data: categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getSingleCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await BlogCategory.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        return res.status(200).json({ data: category });
    } catch (error) {
        console.error("Error fetching category:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.updateCategory = async (req, res) => {
       const redisClient = await getRedisClient(req, res);
        const cacheKey = "blog:categories";

    try {
        const { id } = req.params;
        const { name, slug, isActive } = req.body;

        const updated = await BlogCategory.findByIdAndUpdate(
            id,
            { name, slug, isActive },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Category not found." });
        }

        await cleanRedisDataFlush(redisClient,cacheKey);

        return res.status(200).json({ message: "Category updated successfully", data: updated });
    } catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).json({ message: "Server error" });
    }
};


exports.deleteCategory = async (req, res) => {
     const redisClient = await getRedisClient(req, res);
        const cacheKey = "blog:categories";

    try {
        const { id } = req.params;

        const deleted = await BlogCategory.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "Category not found." });
        }

        await cleanRedisDataFlush(redisClient,cacheKey); 

        return res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
