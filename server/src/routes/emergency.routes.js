const express = require("express");
const router = express.Router();

const {
  createEmergency,
  driverAcceptRequest,
  getEmergency,
  completeEmergency,
  getAdmittedPatients,
  dischargePatient
} = require("../controllers/emergency.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.post("/", createEmergency);
router.post("/driver-accept", authMiddleware, driverAcceptRequest);
router.post("/complete", authMiddleware, completeEmergency);
router.get("/admitted", authMiddleware, getAdmittedPatients);
router.post("/discharge", authMiddleware, dischargePatient);
router.get("/:id", getEmergency);
module.exports = router;