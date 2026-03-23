const express = require("express");
const router = express.Router();

const {
  createEmergency,
  assignAmbulance,
   getEmergency
} = require("../controllers/emergency.controller");

router.post("/", createEmergency);
router.post("/assign", assignAmbulance);
router.get("/:id", getEmergency);
module.exports = router;