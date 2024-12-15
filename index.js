import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";

// Ensure __filename and __dirname are correctly set for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public" ,"assets")));

// File storage configuration for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Routes with file uploads
app.post("/auth/register", upload.single("picture"), register);
app.post("/posts", verifyToken, upload.single("picture"), createPost);

// Normal routes (auth, users, posts)
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

// Mongoose setup and server start
const PORT = process.env.PORT || 6001;
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Database connected"))
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    // Optionally, you can insert data one-time (uncomment to use):
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch((error) => {
    console.error("Database connection error: ", error); // Log the error
    process.exit(1); // Exit process with failure
  });

// Global error handler to catch unexpected errors
app.use((err, req, res, next) => {
  console.error("Unexpected Error: ", err);
  res.status(500).json({ message: "Something went wrong, please try again later" });
});

// Mongoose connection error handling
mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
  // Optionally exit or retry connection logic
});
