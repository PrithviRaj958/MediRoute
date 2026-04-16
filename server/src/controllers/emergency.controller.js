const Emergency = require("../models/emergency.model");
const Ambulance = require("../models/ambulance.model");
const Hospital = require("../models/hospital.model");

// Create Emergency Incident
exports.createEmergency = async (req, res) => {
  try {
    const { patientName, lng, lat, severity } = req.body; // 🔥 FIX: Added severity here
    const emergency = await Emergency.create({
      patientName,
      severity, // Now this will not be undefined
      location: { type: "Point", coordinates: [lng, lat] }
    });
    res.status(201).json(emergency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Assign Nearest Ambulance (The Handshake)
exports.assignAmbulance = async (req, res) => {
  try {
    const { emergencyId } = req.body;
    const emergency = await Emergency.findById(emergencyId);

    if (!emergency) return res.status(404).json({ message: "Emergency not found" });

    const ambulance = await Ambulance.findOne({
      status: "AVAILABLE",
      location: {
        $near: {
          $geometry: emergency.location,
          $maxDistance: 5000
        }
      }
    });

    if (!ambulance) {
      return res.status(404).json({ message: "No ambulances available in radius" });
    }

    const hospital = await Hospital.findOne({
      availableBeds: { $gt: 0 },
      location: {
        $near: { $geometry: emergency.location }
      }
    });

    emergency.assignedHospital = hospital ? hospital._id : null;
    emergency.assignedAmbulance = ambulance._id;
    emergency.status = "ASSIGNED";
    ambulance.status = "BUSY";

    await emergency.save();
    await ambulance.save();

    const updatedEmergency = await Emergency.findById(emergencyId)
      .populate("assignedAmbulance")
      .populate("assignedHospital");

    res.json({
      message: "Ambulance assigned successfully",
      emergency: updatedEmergency,
      ambulance: ambulance 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Get Single Emergency Details
exports.getEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate("assignedAmbulance")
      .populate("assignedHospital"); // 🔥 Add this for consistency
    if (!emergency) return res.status(404).json({ message: "Not found" });
    res.json(emergency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};