const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema({
  patientName: String,
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: [Number] // [lng, lat]
  },
  status: {
    type: String,
    enum: ["PENDING", "ASSIGNED", "COMPLETED"],
    default: "PENDING"
  },
  severity: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium" 
  },
  assignedHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital"
  },
  assignedAmbulance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ambulance"
  }
}, { timestamps: true });

emergencySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Emergency", emergencySchema);