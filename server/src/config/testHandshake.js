require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Ambulance = require('../models/ambulance.model');
const Hospital = require('../models/hospital.model');
const Emergency = require('../models/emergency.model');
const { createEmergency, driverAcceptRequest } = require('../controllers/emergency.controller');
const { updateBeds } = require('../controllers/hospital.controller');

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Reset driver statuses to AVAILABLE
    const d11User = await User.findOne({ email: 'driver11@gmail.com' });
    const d12User = await User.findOne({ email: 'driver12@gmail.com' });
    const ajAdminUser = await User.findOne({ email: 'aj@hospital.com' });

    if (!d11User || !d12User || !ajAdminUser) {
        console.error('❌ Missing test users in DB. Run checkDB first.');
        process.exit(1);
    }

    const amb11 = await Ambulance.findOne({ driverId: d11User._id });
    const amb12 = await Ambulance.findOne({ driverId: d12User._id });
    
    if (amb11) { amb11.status = 'AVAILABLE'; await amb11.save(); }
    if (amb12) { amb12.status = 'AVAILABLE'; await amb12.save(); }

    const ajHospital = await Hospital.findById(ajAdminUser.hospitalId);
    if (ajHospital) {
        ajHospital.availableBeds = 40;
        await ajHospital.save();
        console.log(`Reset AJ Hospital beds to: ${ajHospital.availableBeds}`);
    }

    // 2. Create emergency (Coordinates near AJ Hospital and the drivers)
    console.log('\n--- 1. Creating Emergency ---');
    const req = {
        body: {
            patientName: "Test Patient Proximity",
            lng: 74.8430,
            lat: 12.8950,
            severity: "High"
        }
    };
    
    let resData;
    const res = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            resData = data;
            return this;
        }
    };

    await createEmergency(req, res);
    console.log(`Emergency Created! Status: ${res.statusCode || 201}`);
    const emergencyId = resData._id;
    console.log(`Emergency ID: ${emergencyId}`);
    console.log(`Candidate Ambulances: ${resData.candidateAmbulances}`);

    // 3. Driver 11 (first candidate) declines
    console.log('\n--- 2. Driver 11 Declines ---');
    const em = await Emergency.findById(emergencyId);
    const firstAmbId = em.candidateAmbulances[0].toString();
    console.log(`First candidate: ${firstAmbId} (Driver 11: ${amb11._id})`);

    // Simulate decline logic on server
    em.ignoredAmbulances.push(firstAmbId);
    em.currentAmbulanceIndex += 1;
    await em.save();
    console.log(`Ambulance index advanced to: ${em.currentAmbulanceIndex}`);

    // 4. Driver 12 (second candidate) accepts
    console.log('\n--- 3. Driver 12 Accepts ---');
    const acceptReq = {
        body: {
            emergencyId: emergencyId,
            ambulanceId: amb12._id.toString()
        }
    };
    let acceptResData;
    const acceptRes = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            acceptResData = data;
            return this;
        }
    };

    await driverAcceptRequest(acceptReq, acceptRes);
    console.log(`Driver 12 Accepted! Status: ${acceptRes.statusCode || 200}`);
    if (acceptRes.statusCode === 500 || (acceptResData && acceptResData.message && acceptResData.message.includes('error'))) {
        console.error('Accept Request Error:', acceptResData);
        process.exit(1);
    }
    console.log(`Response Hospital ID: ${acceptResData.hospitalId}`);

    // 5. Hospital 1 (AJ Hospital) declines handshake
    console.log('\n--- 4. AJ Hospital Declines Handshake ---');
    const socketEmergency = await Emergency.findById(emergencyId);
    
    // Add to ignored list and increment index
    socketEmergency.ignoredHospitals.push(ajHospital._id);
    socketEmergency.currentHospitalIndex += 1;
    const nextHospIndex = socketEmergency.currentHospitalIndex;
    await socketEmergency.save();

    console.log(`Declined index advanced to: ${nextHospIndex}`);
    console.log(`Candidate list in DB: ${socketEmergency.candidateHospitals}`);
    
    const kmcHospital = await Hospital.findOne({ name: /KMC/ });
    if (socketEmergency.candidateHospitals && nextHospIndex < socketEmergency.candidateHospitals.length) {
        const nextHospitalId = socketEmergency.candidateHospitals[nextHospIndex].toString();
        console.log(`Next hospital resolved: ${nextHospitalId}`);
        console.log(`Is this KMC Hospital? ${kmcHospital && nextHospitalId === kmcHospital._id.toString()}`);
    } else {
        console.log('No next hospital available!');
    }

    // 6. Hospital calls update-beds API
    console.log('\n--- 5. Hospital calls updateBeds API ---');
    const updateReq = {
        user: {
            userId: ajAdminUser._id.toString(),
            role: ajAdminUser.role,
            hospitalId: ajAdminUser.hospitalId.toString()
        },
        body: {
            action: 'decrement',
            availableBeds: 1
        }
    };
    let updateResData;
    const updateRes = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            updateResData = data;
            return this;
        }
    };

    await updateBeds(updateReq, updateRes);
    console.log(`updateBeds API result status: ${updateRes.statusCode || 200}`);
    console.log('API Response:', updateResData);

    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTest();
