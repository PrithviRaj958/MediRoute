const express = require("express");
const cors = require("cors");
const app = express();
const ambulanceRoutes = require("./routes/ambulance.routes");

require("./models/user.model");
require("./models/hospital.model");

app.use(cors());
app.use(express.json());

app.use("/api/ambulances", ambulanceRoutes);
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/hospitals", require("./routes/hospital.routes"));
app.use("/api/emergencies", require("./routes/emergency.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

app.get("/", (req, res) => {
  res.send("MediRoute Backend Running");
});

module.exports = app;
