require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const lessonRoutes = require("./routes/lessons");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const prizesRoutes = require("./routes/prizes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/prizes", prizesRoutes);

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/coddy")
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
