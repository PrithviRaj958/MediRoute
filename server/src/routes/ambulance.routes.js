const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middlewares/auth.middleware");

const {
  createAmbulance,
  getAmbulances,
  updateLocation,
  getNearestAmbulance,
  getMyAmbulance,   // 🔥 ADD THIS
  updateStatus      // (if used)
} = require("../controllers/ambulance.controller");

router.post("/", createAmbulance);
router.get("/", getAmbulances);
router.put("/location", updateLocation);
router.get("/nearest", getNearestAmbulance);
router.get(
  "/my",
  authMiddleware,
  authorize("DRIVER"),
  getMyAmbulance
);
router.put("/status", updateStatus);
module.exports = router; 