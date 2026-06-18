const mongoose = require("mongoose");

const PopupSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        image: {
            type: String,
            required: true,
        },
        public_id:{   type: String,
            required: true,
        },
        button: {
            text: {
                type: String,
                default: "",
            },

            link: {
                type: String,
                default: "",
            },

            openInNewTab: {
                type: Boolean,
                default: false,
            },
        },

        doctorName: {
            type: String,
            default: "",
        },

        location: {
            type: String,
            default: "",
        },

        availableDate: {
            type: Date,
        },

        availableTime: {
            type: String,
            default: "",
        },

        startAt: {
            type: Date,
            required: true,
        },

        endAt: {
            type: Date,
            required: true,
        },

        priority: {
            type: Number,
            default: 1,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Popup", PopupSchema);