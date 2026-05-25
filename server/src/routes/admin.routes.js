const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middlewares/auth.middleware');
const admin = require('../controllers/admin.controller');

// Apply admin-only protection to all routes in this file
router.use(authMiddleware, authorize('ADMIN'));

// ── Hospitals ──────────────────────────
router.post('/hospitals', admin.createHospital);
router.get('/hospitals', admin.getAllHospitals);
router.put('/hospitals/:id/assign-admin', admin.assignHospitalAdmin);
router.delete('/hospitals/:id', admin.deleteHospital);

// ── Ambulances ─────────────────────────
router.post('/ambulances', admin.createAmbulance);
router.get('/ambulances', admin.getAllAmbulances);
router.put('/ambulances/:id/assign-driver', admin.assignDriver);
router.delete('/ambulances/:id', admin.deleteAmbulance);

// ── Users ──────────────────────────────
router.get('/users', admin.getAllUsers);
router.delete('/users/:id', admin.deleteUser);

// ── Emergencies ────────────────────────
router.get('/emergencies', admin.getAllEmergencies);

// ── Stats / Analytics ──────────────────
router.get('/stats', admin.getStats);

module.exports = router;
