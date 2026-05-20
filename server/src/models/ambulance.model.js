const mongoose = require("mongoose");

const ambulanceSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  vehicleNumber: {
    type: String,
    required: true,
    unique: true
  },

  capability: {
    type: String,
    enum: ["BLS", "ALS"], // Basic Life Support, Advanced Life Support
    default: "BLS"
  },

  status: {
    type: String,
    enum: ["AVAILABLE", "BUSY", "OFFLINE"],
    default: "OFFLINE"
  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

/* 🚨 Important for geospatial queries */
ambulanceSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Ambulance", ambulanceSchema);