const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env.local") });
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");
const dns = require("node:dns");
const fileUpload = require("express-fileupload");
const authRoutes = require("./Routes/authRoute.js");
const contactRoutes = require("./Routes/contactroute/contactroute.js");
const blogRoutes = require("./Routes/Blogroute/categoryRoute.js");
const adminRoutes = require("./Routes/adminRoute.js");
const eventRoutes = require("./Routes/eventRoute.js");
const galleryRoutes = require("./Routes/galleryRoute.js");
dns.setServers(["8.8.8.8", "1.1.1.1", "0.0.0.0"]);

const app = express();
const PORT = process.env.PORT || 8000;
morgan.token("body", (req) => {
  if (!req.body || typeof req.body !== "object") return "";
  const safeBody = { ...req.body };
  delete safeBody.password;
  delete safeBody.token;
  delete safeBody.currentPassword;
  delete safeBody.newPassword;
  delete safeBody.confirmPassword;
  delete safeBody.name;
  delete safeBody.email;
  delete safeBody.phone;
  delete safeBody.message;
  delete safeBody.interest;
  delete safeBody.ageGroup;
  delete safeBody.method;
  delete safeBody.company;
  delete safeBody.captcha;
  return JSON.stringify(safeBody);
});

app.use(express.json()); // for JSON bodies
app.use(express.urlencoded({ extended: true })); // for form-urlencoded bodies
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });
app.use(
  fileUpload({
    useTempFiles: false,
    limits: { fileSize: 100 * 1024 * 1024 },
    abortOnLimit: true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body"),
);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/blogcategory", blogRoutes);
app.use("/api", eventRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Server is running successfully");
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 413 ? "Uploaded file exceeds the 100 MB limit" : "Internal Server Error",
  });
});

const server = app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

server.timeout = 0;
server.requestTimeout = 0;
