const Emergency = require("../models/emergency.model");
const Ambulance = require("../models/ambulance.model");

// 🔹 Create Emergency
exports.createEmergency = async (req, res) => {
  try {
    const { patientName, lng, lat } = req.body;

    const emergency = await Emergency.create({
      patientName,
      location: {
        type: "Point",
        coordinates: [lng, lat]
      }
    });

    res.status(201).json(emergency);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEmergency = async (req, res) => {
  try {
    const { id } = req.params;

    const emergency = await Emergency.findById(id)
      .populate("assignedAmbulance");

    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    res.json(emergency);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Assign nearest ambulance
exports.assignAmbulance = async (req, res) => {
  try {
    const { emergencyId } = req.body;

    const emergency = await Emergency.findById(emergencyId);

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
      return res.json({ message: "No ambulance available" });
    }

    emergency.assignedAmbulance = ambulance._id;
    emergency.status = "ASSIGNED";

    ambulance.status = "BUSY";

    await emergency.save();
    await ambulance.save();

    res.json({
      message: "Ambulance assigned",
      emergency,
      ambulance
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};