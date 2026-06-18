const mongoose = require("mongoose");

const IncludedServiceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    any_image: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const FullBodyServiceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    desc: {
      type: String,
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
      default: 0,
    },

    tag: {
      type: String,
      trim: true,
    },

    included_services: {
      type: [IncludedServiceSchema],
      default: [],
    },

    per_day_booking_allow_limit: {
      type: Number,
      default: 1,
      min: 1,
    },

    blocked_dates: [
      {
        type: Date,
      },
    ],


    is_active: {
      type: Boolean,
      default: true,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure discount price is not greater than price
FullBodyServiceSchema.pre("save", function (next) {
  if (
    this.discount_price &&
    this.discount_price > this.price
  ) {
    return next(
      new Error("Discount price cannot be greater than price")
    );
  }

  next();
});

module.exports = mongoose.model(
  "FullBodyService",
  FullBodyServiceSchema
);