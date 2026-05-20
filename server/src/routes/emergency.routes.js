const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middlewares/auth.middleware");

const {
  createEmergency,
  assignAmbulance,
  getEmergency,
  updatePatientLocation,
  acceptEmergency
} = require("../controllers/emergency.controller");

router.post("/", authMiddleware, authorize("OPERATOR"), createEmergency);
router.post("/assign", authMiddleware, authorize("OPERATOR"), assignAmbulance);
router.post("/accept", authMiddleware, authorize("DRIVER"), acceptEmergency);
router.get("/:id", authMiddleware, authorize("OPERATOR", "DRIVER", "HOSPITAL_ADMIN"), getEmergency);
router.put("/location/update", authMiddleware, authorize("DRIVER", "OPERATOR"), updatePatientLocation);

module.exports = router;