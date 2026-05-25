const express = require('express');
const router = express.Router();
const { createHospital, updateBeds, getHospitals, getMyHospital, updateResources, getHospitalAnalytics, getAllHospitals } = require('../controllers/hospital.controller');   
const { authMiddleware, authorize } = require('../middlewares/auth.middleware');

router.post('/create', authMiddleware, authorize('ADMIN','HOSPITAL_ADMIN'), createHospital);
router.put('/update-beds',authMiddleware,updateBeds);
router.put('/update-resources', authMiddleware, updateResources);
router.get('/nearby', getHospitals);
router.get('/all', getAllHospitals);
router.get('/my-hospital', authMiddleware, getMyHospital);
router.get('/analytics', authMiddleware, getHospitalAnalytics);

module.exports =router ;