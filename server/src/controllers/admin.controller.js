const Hospital = require('../models/hospital.model');
const Ambulance = require('../models/ambulance.model');
const User = require('../models/user.model');
const Emergency = require('../models/emergency.model');

// ═══════════════════════════════════════
// HOSPITAL MANAGEMENT
// ═══════════════════════════════════════

exports.createHospital = async (req, res) => {
  try {
    const { name, address, contactNumber, totalBeds, location } = req.body;

    if (!name || !address || !contactNumber || !totalBeds || !location) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!Array.isArray(location) || location.length !== 2) {
      return res.status(400).json({ message: 'Location must be [lng, lat] array' });
    }

    const existing = await Hospital.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'A hospital with this name already exists' });
    }

    const hospital = await Hospital.create({
      name,
      address,
      contactNumber,
      totalBeds: Number(totalBeds),
      availableBeds: Number(totalBeds),
      location: { type: 'Point', coordinates: location }
    });

    res.status(201).json({ message: 'Hospital created successfully', hospital });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find().populate('adminId', 'name email');
    res.status(200).json({ hospitals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignHospitalAdmin = async (req, res) => {
  try {
    const { id: hospitalId } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'HOSPITAL_ADMIN') {
      return res.status(400).json({ message: 'User must have role HOSPITAL_ADMIN' });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    // Unassign old admin from this hospital
    if (hospital.adminId && hospital.adminId.toString() !== userId) {
      await User.findByIdAndUpdate(hospital.adminId, { hospitalId: null });
    }

    // Unassign this user from their previous hospital
    if (user.hospitalId && user.hospitalId.toString() !== hospitalId) {
      await Hospital.findByIdAndUpdate(user.hospitalId, { adminId: null });
    }

    hospital.adminId = userId;
    user.hospitalId = hospitalId;
    await hospital.save();
    await user.save();

    const populated = await Hospital.findById(hospitalId).populate('adminId', 'name email');
    res.status(200).json({ message: 'Hospital admin assigned successfully', hospital: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    if (hospital.adminId) {
      await User.findByIdAndUpdate(hospital.adminId, { hospitalId: null });
    }

    await Hospital.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Hospital deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════
// AMBULANCE MANAGEMENT
// ═══════════════════════════════════════

exports.createAmbulance = async (req, res) => {
  try {
    const { vehicleNumber, coordinates, status, capability } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({ message: 'Vehicle number is required' });
    }

    const existing = await Ambulance.findOne({ vehicleNumber });
    if (existing) {
      return res.status(400).json({ message: 'An ambulance with this vehicle number already exists' });
    }

    const ambulance = await Ambulance.create({
      vehicleNumber,
      status: status || 'AVAILABLE',
      capability: capability || 'BLS',
      location: {
        type: 'Point',
        coordinates: coordinates && coordinates.length === 2 ? coordinates : [0, 0]
      }
    });

    res.status(201).json({ message: 'Ambulance created successfully', ambulance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAmbulances = async (req, res) => {
  try {
    const ambulances = await Ambulance.find().populate('driverId', 'name email');
    res.status(200).json({ ambulances });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignDriver = async (req, res) => {
  try {
    const { id: ambulanceId } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'DRIVER') {
      return res.status(400).json({ message: 'User must have role DRIVER' });
    }

    const ambulance = await Ambulance.findById(ambulanceId);
    if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });

    // Unassign old driver from this ambulance
    if (ambulance.driverId && ambulance.driverId.toString() !== userId) {
      await User.findByIdAndUpdate(ambulance.driverId, { ambulanceId: null });
    }

    // Unassign this driver from their previous ambulance
    if (user.ambulanceId && user.ambulanceId.toString() !== ambulanceId) {
      await Ambulance.findByIdAndUpdate(user.ambulanceId, { driverId: null });
    }

    ambulance.driverId = userId;
    user.ambulanceId = ambulanceId;
    await ambulance.save();
    await user.save();

    const populated = await Ambulance.findById(ambulanceId).populate('driverId', 'name email');
    res.status(200).json({ message: 'Driver assigned successfully', ambulance: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAmbulance = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });

    if (ambulance.driverId) {
      await User.findByIdAndUpdate(ambulance.driverId, { ambulanceId: null });
    }

    await Ambulance.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Ambulance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════

exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = { role: { $ne: 'ADMIN' } };
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-passwordHash')
      .populate('hospitalId', 'name')
      .populate('ambulanceId', 'vehicleNumber');

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'ADMIN') {
      return res.status(403).json({ message: 'Cannot delete an admin user' });
    }

    if (user.hospitalId) {
      await Hospital.findByIdAndUpdate(user.hospitalId, { adminId: null });
    }
    if (user.ambulanceId) {
      await Ambulance.findByIdAndUpdate(user.ambulanceId, { driverId: null });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════
// EMERGENCY MONITORING
// ═══════════════════════════════════════

exports.getAllEmergencies = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const emergencies = await Emergency.find(filter)
      .populate('assignedHospital', 'name address')
      .populate('assignedAmbulance', 'vehicleNumber status')
      .sort({ createdAt: -1 });

    res.status(200).json({ emergencies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════
// ANALYTICS / STATS
// ═══════════════════════════════════════

exports.getStats = async (req, res) => {
  try {
    const [
      totalHospitals,
      totalAmbulances,
      totalUsers,
      activeEmergencies,
      availableAmbulances,
      busyAmbulances,
      offlineAmbulances,
      hospitalBeds,
      emergencyByStatus,
      emergencyByType,
      emergencyBySeverity
    ] = await Promise.all([
      Hospital.countDocuments(),
      Ambulance.countDocuments(),
      User.countDocuments({ role: { $ne: 'ADMIN' } }),
      Emergency.countDocuments({ status: { $in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } }),
      Ambulance.countDocuments({ status: 'AVAILABLE' }),
      Ambulance.countDocuments({ status: 'BUSY' }),
      Ambulance.countDocuments({ status: 'OFFLINE' }),
      Hospital.aggregate([{
        $group: {
          _id: null,
          total: { $sum: '$totalBeds' },
          available: { $sum: '$availableBeds' }
        }
      }]),
      Emergency.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Emergency.aggregate([{ $group: { _id: '$emergencyType', count: { $sum: 1 } } }]),
      Emergency.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }])
    ]);

    const beds = hospitalBeds[0] || { total: 0, available: 0 };

    res.status(200).json({
      totalHospitals,
      totalAmbulances,
      totalUsers,
      activeEmergencies,
      availableAmbulances,
      busyAmbulances,
      offlineAmbulances,
      totalBeds: beds.total,
      availableBeds: beds.available,
      emergencyByStatus,
      emergencyByType,
      emergencyBySeverity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
