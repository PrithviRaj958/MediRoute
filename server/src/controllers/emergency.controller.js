const Emergency = require("../models/emergency.model");
const Ambulance = require("../models/ambulance.model");
const Hospital = require("../models/hospital.model");

// 1. Create Emergency Incident (Unchanged)
exports.createEmergency = async (req, res) => {
  try {
    const { patientName, lng, lat, severity } = req.body;
    const emergency = await Emergency.create({
      patientName,
      severity,
      location: { type: "Point", coordinates: [lng, lat] },
      status: "PENDING"
    });
    res.status(201).json(emergency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Driver Accepts Request - UPDATED for Instant UI Sync
exports.driverAcceptRequest = async (req, res) => {
  try {
    const { emergencyId, ambulanceId } = req.body;
    const emergency = await Emergency.findById(emergencyId);
    const ambulance = await Ambulance.findById(ambulanceId);

    if (!emergency || !ambulance) {
      return res.status(404).json({ message: "Not found" });
    }

    const nearestHospital = await Hospital.findOne({
      availableBeds: { $gt: 0 },
      location: { $near: { $geometry: emergency.location } }
    });

    if (!nearestHospital) {
      return res.status(404).json({ message: "No hospitals found" });
    }

    emergency.assignedAmbulance = ambulance._id;
    emergency.assignedHospital = nearestHospital._id;
    emergency.status = "ASSIGNED";
    ambulance.status = "BUSY"; // Update status

    await emergency.save();
    const updatedAmbulance = await ambulance.save(); // Save and capture[cite: 2]

    const updatedEmergency = await Emergency.findById(emergencyId)
      .populate("assignedAmbulance")
      .populate("assignedHospital");

    // 🔥 FIX: Return the updated ambulance so the UI refreshes[cite: 2]
    res.json({
      message: "Driver accepted",
      emergency: updatedEmergency,
      ambulance: updatedAmbulance, 
      hospitalId: nearestHospital._id 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// 3. Get Single Emergency (Unchanged)
exports.getEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate("assignedAmbulance")
      .populate("assignedHospital");
    if (!emergency) return res.status(404).json({ message: "Not found" });
    res.json(emergency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};