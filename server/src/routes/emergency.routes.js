const express = require("express");
const router = express.Router();

const {
  createEmergency,
  driverAcceptRequest,
   getEmergency
} = require("../controllers/emergency.controller");

router.post("/", createEmergency);
router.post("/driver-accept", driverAcceptRequest);
router.get("/:id", getEmergency);
module.exports = router;