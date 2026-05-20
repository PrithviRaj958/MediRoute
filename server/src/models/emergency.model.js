const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema({
  patientName: String,
  emergencyType: {
    type: String,
    enum: ["Cardiac", "Trauma", "Respiratory", "Transport", "Other"],
    default: "Other"
  },
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
    enum: ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED"],
    default: "PENDING"
  },
  severity: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium" 
  },
  assignedHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital"
  },
  assignedAmbulance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ambulance"
  },
  patientProfile: {
    vitals: String, // e.g., "BP: 120/80, Pulse: 80"
    allergies: String,
    medicalHistory: String
  }
}, { timestamps: true });

emergencySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Emergency", emergencySchema);