const mongoose = require("mongoose");

const addOnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discount_price: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.price;
        },
        message: "Discount price cannot be greater than original price",
      },
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AddOn", addOnSchema);
