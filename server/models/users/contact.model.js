const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },

    phone: {
      type: String,
      required: true,
     
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    /* ---------- Admin Handling ---------- */

    is_seen: {
      type: Boolean,
      default: false,
    },

    is_solved: {
      type: Boolean,
      default: false,
    },

    admin_comment: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    /* ---------- Meta ---------- */

    created_by: {
      type: String,
      enum: ["user", "guest"],
      default: "guest",
    },

    solved_at: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", ContactSchema);
