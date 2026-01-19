const mongoose = require("mongoose");

const otherServiceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    position: {
      type: Number,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OtherService", otherServiceSchema);
