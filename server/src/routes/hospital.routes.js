const express = require('express');
const router = express.Router();
const { createHospital, updateBeds, getHospitals } = require('../controllers/hospital.controller');   
const { authMiddleware, authorize } = require('../middlewares/auth.middleware');

router.post('/create',authMiddleware,authorize("HOSPITAL_ADMIN","ADMIN"), createHospital);
router.put('/update-beds/:id', authMiddleware,authorize("HOSPITAL_ADMIN","ADMIN"),updateBeds);
router.get('/nearby', getHospitals);

module.exports =router ;