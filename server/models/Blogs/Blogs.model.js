const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Please provide a blog title"],
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
        },

        content: {
            type: String,
            required: [true, "Please provide blog content"],
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BlogCategory",
            required: [true, "Please select a category"],
        },
        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft",
        },
        featured: {
            type: Boolean,
            default: false,
        },
        image: {
            url: String,
            public_id: String,
        },
        author: {
            type: String,
            default: "Admin",
        },
        // SEO Fields
        metaTitle: String,
        metaDescription: String,
        metaKeywords: String,
        ogTitle: String,
        ogDescription: String,
        ogImage: String,
        twitterTitle: String,
        twitterDescription: String,
        twitterImage: String,
    },
    { timestamps: true }
);

const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);
module.exports = Blog