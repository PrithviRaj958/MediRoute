require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Ambulance = require('../models/ambulance.model');
const Hospital = require('../models/hospital.model');
const Emergency = require('../models/emergency.model');

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find();
    console.log(`=== USERS ===`);
    users.forEach(u => {
        console.log(`ID: ${u._id} | ${u.name} (${u.email}) | Role: ${u.role} | AmbRef: ${u.ambulanceId} | HospRef: ${u.hospitalId}`);
    });

    const ambulances = await Ambulance.find();
    console.log(`\n=== AMBULANCES ===`);
    ambulances.forEach(a => {
        console.log(`ID: ${a._id} | ${a.vehicleNumber} | Status: ${a.status} | DriverRef: ${a.driverId} | Coords: [${a.location.coordinates}]`);
    });

    const hospitals = await Hospital.find();
    console.log(`\n=== HOSPITALS ===`);
    hospitals.forEach(h => {
        console.log(`ID: ${h._id} | ${h.name} | Total Beds: ${h.totalBeds} | Available: ${h.availableBeds} | Coords: [${h.location.coordinates}]`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Check failed:', err.message);
    process.exit(1);
  }
}

checkDB();
