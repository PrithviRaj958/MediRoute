const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema({
  patientName: String,

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: [Number]
  },

  status: {
    type: String,
    enum: ["PENDING", "ASSIGNED", "COMPLETED"],
    default: "PENDING"
  },

  assignedAmbulance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ambulance"
  }

}, { timestamps: true });

emergencySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Emergency", emergencySchema);