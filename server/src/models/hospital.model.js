const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        contactNumber: {
            type: String,
            required: true,
            trim: true
        },
        totalBeds: {
            type: Number,
            default: 0
        },
        availableBeds: {
            type: Number,
            default: 0
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true
            },
            coordinates: {
                type: [Number],
                required: true
            }
        }
    },
    { timestamps: true }
);

hospitalSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Hospital", hospitalSchema);