import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ limit: "50kb", extended: true }));

// Routes
app.use("/api/v1/users", userRoutes);

// Port setup
const PORT = process.env.PORT || 8000;

// MongoDB Connection
const startServer = async () => {
  try {
    const dbConnection = await mongoose.connect(
      process.env.MONGO_URI || "mongodb+srv://imdigitalashish:imdigitalashish@cluster0.cujabk4.mongodb.net/"
    );

    console.log(`✅ MongoDB Connected: ${dbConnection.connection.host}`);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

startServer();
