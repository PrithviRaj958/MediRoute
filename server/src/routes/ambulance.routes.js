const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middlewares/auth.middleware");

const {
  createAmbulance,
  getAmbulances,
  updateLocation,
  getNearestAmbulance,
  getMyAmbulance,
  updateStatus
} = require("../controllers/ambulance.controller");

router.post("/", createAmbulance);
router.get("/", getAmbulances);
router.put("/location", updateLocation);
router.get("/nearest", getNearestAmbulance);

// 🔥 FIX: Ensure this ONLY checks for the DRIVER role. 
// Do NOT add any middleware here that checks if status is "AVAILABLE"[cite: 1].
router.get(
  "/my",
  authMiddleware,
  authorize("DRIVER"),
  getMyAmbulance
);

router.put("/status", updateStatus);

module.exports = router;