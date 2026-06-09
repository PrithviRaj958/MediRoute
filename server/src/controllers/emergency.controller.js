const Emergency = require("../models/emergency.model");
const Ambulance = require("../models/ambulance.model");
const Hospital = require("../models/hospital.model");

// 1. Create Emergency Incident (Updated for sequential nearest ambulance dispatch)
exports.createEmergency = async (req, res) => {
  try {
    const { patientName, lng, lat, severity } = req.body;

    // Find all available ambulances, sorted by proximity to patient location
    const availableAmbulances = await Ambulance.find({
      status: "AVAILABLE",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          }
        }
      }
    });

    if (availableAmbulances.length === 0) {
      return res.status(400).json({
        message: "No available ambulances found in the vicinity. Please ensure drivers are online and available."
      });
    }

    const candidateAmbulances = availableAmbulances.map(a => a._id);

    const emergency = await Emergency.create({
      patientName,
      severity,
      location: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
      status: "PENDING",
      candidateAmbulances,
      ignoredAmbulances: [],
      currentAmbulanceIndex: 0
    });

    res.status(201).json(emergency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Driver Accepts Request - UPDATED for Hospital Selection Loop
exports.driverAcceptRequest = async (req, res) => {
  try {
    const { emergencyId, ambulanceId } = req.body;
    const emergency = await Emergency.findById(emergencyId);
    const ambulance = await Ambulance.findById(ambulanceId);

    if (!emergency || !ambulance) {
      return res.status(404).json({ message: "Not found" });
    }

    // Find all candidate hospitals with available beds > 0, sorted by proximity to emergency location
    const candidateHospitals = await Hospital.find({
      availableBeds: { $gt: 0 },
      location: {
        $near: {
          $geometry: emergency.location
        }
      }
    });

    if (candidateHospitals.length === 0) {
      return res.status(404).json({ message: "No hospitals with available beds found" });
    }

    emergency.assignedAmbulance = ambulance._id;
    // Keep assignedHospital null until accepted
    emergency.assignedHospital = null;
    emergency.candidateHospitals = candidateHospitals.map(h => h._id);
    emergency.ignoredHospitals = [];
    emergency.currentHospitalIndex = 0;
    
    // Status is ASSIGNED_DRIVER while waiting for hospital confirmation
    emergency.status = "PENDING"; 
    
    ambulance.status = "BUSY"; 

    await emergency.save();
    const updatedAmbulance = await ambulance.save(); 

    const updatedEmergency = await Emergency.findById(emergencyId)
      .populate("assignedAmbulance");

    // Return the updated state along with the first candidate hospital's ID for socket routing
    res.json({
      message: "Driver accepted, searching hospital",
      emergency: updatedEmergency,
      ambulance: updatedAmbulance, 
      hospitalId: candidateHospitals[0]._id 
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

// 4. Complete Emergency (New Feature)
exports.completeEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.body;
    const emergency = await Emergency.findById(emergencyId);
    
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    const ambulance = await Ambulance.findById(emergency.assignedAmbulance);
    
    if (ambulance) {
      ambulance.status = "AVAILABLE";
      await ambulance.save();
    }

    emergency.status = "COMPLETED";
    await emergency.save();

    res.json({ message: "Dispatch completed successfully", emergency });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Get Admitted Patients for Hospital
exports.getAdmittedPatients = async (req, res) => {
    try {
        const hospitalId = req.user.hospitalId || req.user.id;
        if (!hospitalId) return res.status(400).json({ message: "No Hospital ID found in token" });

        const patients = await Emergency.find({
            assignedHospital: hospitalId,
            status: "COMPLETED" // Completed the ambulance run = Admitted
        }).sort({ updatedAt: -1 });

        res.status(200).json(patients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 6. Discharge Patient
exports.dischargePatient = async (req, res) => {
    try {
        const { emergencyId } = req.body;
        const hospitalId = req.user.hospitalId || req.user.id;

        const emergency = await Emergency.findOne({ _id: emergencyId, assignedHospital: hospitalId });
        if (!emergency) return res.status(404).json({ message: "Patient not found" });

        if (emergency.status === "DISCHARGED") {
            return res.status(400).json({ message: "Patient already discharged" });
        }

        emergency.status = "DISCHARGED";
        await emergency.save();

        // Free up a bed
        const hospital = await Hospital.findById(hospitalId);
        if (hospital && hospital.availableBeds < hospital.totalBeds) {
            hospital.availableBeds += 1;
            await hospital.save();
        }

        res.status(200).json({ message: "Patient discharged successfully", emergency });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};