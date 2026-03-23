const Ambulance = require("../models/ambulance.model");

exports.createAmbulance = async (req, res) => {
  try {
    const { vehicleNumber, driverId } = req.body;

    const ambulance = await Ambulance.create({
      vehicleNumber,
      driverId,
      status: "AVAILABLE"
    });

    res.status(201).json({
      message: "Ambulance created",
      ambulance
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { ambulanceId, status } = req.body;

    const ambulance = await Ambulance.findByIdAndUpdate(
      ambulanceId,
      { status },
      { new: true }
    );

    res.json(ambulance);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyAmbulance = async (req, res) => {
  try {
    const userId = req.user.userId;

    const ambulance = await Ambulance.findOne({ driverId: userId });

    if (!ambulance) {
      return res.status(404).json({ message: "No ambulance assigned" });
    }

    res.json(ambulance);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 


exports.getAmbulances = async (req, res) => {
  try {
    const ambulances = await Ambulance.find();

    res.json(ambulances);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNearestAmbulance = async (req, res) => {
  try {

    const { lng, lat } = req.query;

    const ambulance = await Ambulance.findOne({
      status: "AVAILABLE",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: 5000
        }
      }
    });

    res.json(ambulance);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.updateLocation = async (req, res) => {
  try {

    const { ambulanceId, lng, lat } = req.body;

    const ambulance = await Ambulance.findByIdAndUpdate(
      ambulanceId,
      {
        location: {
          type: "Point",
          coordinates: [lng, lat]
        },
        lastUpdated: new Date()
      },
      { new: true }
    );

    res.json({
      message: "Location updated",
      ambulance
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};