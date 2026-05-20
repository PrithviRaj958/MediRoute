const Emergency = require("../models/emergency.model");
const Ambulance = require("../models/ambulance.model");
const Hospital = require("../models/hospital.model");

// Create Emergency Incident
exports.createEmergency = async (req, res) => {
  try {
    const { patientName, lng, lat, severity, emergencyType, patientProfile } = req.body;
    const emergency = await Emergency.create({
      patientName,
      severity,
      emergencyType,
      location: { type: "Point", coordinates: [lng, lat] },
      patientProfile
    });
    res.status(201).json(emergency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Assign Ambulance (Automatic matching based on location and capability)
exports.assignAmbulance = async (req, res) => {
  try {
    const { emergencyId } = req.body;
    const emergency = await Emergency.findById(emergencyId);

    if (!emergency) return res.status(404).json({ message: "Emergency not found" });
    if (emergency.status !== "PENDING") return res.status(400).json({ message: "Emergency already assigned" });

    // Determine required capability based on severity
    const requiredCapability = (emergency.severity === "Critical" || emergency.severity === "High") ? "ALS" : "BLS";

    // Find nearest available ambulance with matching capability
    const ambulance = await Ambulance.findOne({
      status: "AVAILABLE",
      capability: requiredCapability,
      location: {
        $near: {
          $geometry: emergency.location,
          $maxDistance: 10000 // 10km radius
        }
      }
    });

    if (!ambulance) return res.status(404).json({ message: "No suitable ambulance available" });

    // Find nearest hospital with available beds
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

    // Emit socket event to notify driver
    const io = require("../../server").io; // Assuming io is exported from server.js
    io.to(`driver_${ambulance.driverId}`).emit("emergency_assigned", { emergency: updatedEmergency });

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

// Update Patient Location in Real-time
exports.updatePatientLocation = async (req, res) => {
  try {
    const { emergencyId, lng, lat } = req.body;
    const emergency = await Emergency.findByIdAndUpdate(
      emergencyId,
      { location: { type: "Point", coordinates: [lng, lat] } },
      { new: true }
    )
      .populate("assignedAmbulance")
      .populate("assignedHospital");
    
    if (!emergency) return res.status(404).json({ message: "Emergency not found" });
    res.json(emergency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Driver accepts assigned emergency
exports.acceptEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.body;
    const emergency = await Emergency.findById(emergencyId);

    if (!emergency || emergency.assignedAmbulance.toString() !== req.user.ambulanceId) {
      return res.status(403).json({ message: "Not assigned to this emergency" });
    }

    emergency.status = "IN_PROGRESS";
    await emergency.save();

    res.json({ message: "Emergency accepted", emergency });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};