const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: ["admin", "superadmin"],
            default: "admin"
        },

        avatar: {
            type: String,
            default: null
        },

        password_changes_last_time: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// optional: index for faster login lookup
AdminSchema.index({ name: 1 });

module.exports = mongoose.model("Admin", AdminSchema);