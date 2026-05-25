const express = require('express');
const router = express.Router();
const { createHospital, updateBeds, getHospitals, getMyHospital } = require('../controllers/hospital.controller');   
const { authMiddleware, authorize } = require('../middlewares/auth.middleware');

router.post('/create', authMiddleware, authorize('ADMIN'), createHospital);
router.put('/update-beds',authMiddleware,updateBeds);
router.get('/nearby', getHospitals);
router.get('/my-hospital', authMiddleware, getMyHospital);

module.exports =router ;