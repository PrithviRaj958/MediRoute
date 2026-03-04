const express = require("express");
const cors = require("cors");  
const app = express();

require("./models/user.model");

app.use(cors());
app.use(express.json());
app.use("/api/auth", require("./routes/auth.routes"));
app.get("/", (req, res) => {
  res.send("MediRoute Backend Running");
});

module.exports = app;
