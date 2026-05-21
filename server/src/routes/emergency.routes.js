const express = require("express");
const router = express.Router();

const {
  createEmergency,
  driverAcceptRequest,
  getEmergency,
  completeEmergency
} = require("../controllers/emergency.controller");

router.post("/", createEmergency);
router.post("/driver-accept", driverAcceptRequest);
router.post("/complete", completeEmergency);
router.get("/:id", getEmergency);
module.exports = router;