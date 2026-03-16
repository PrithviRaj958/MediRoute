const express = require("express");
const router = express.Router();

const {
  createAmbulance,
  getAmbulances,
  updateLocation,
  getNearestAmbulance
} = require("../controllers/ambulance.controller");

router.post("/", createAmbulance);
router.get("/", getAmbulances);
router.put("/location", updateLocation);
router.get("/nearest", getNearestAmbulance);

module.exports = router; 