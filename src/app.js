import dotenv from "dotenv";
dotenv.config(); 

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import connectToSocket from "./controllers/socketManager.js";

import cors from "cors";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URL;

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

const start = async () => {
  try {
    console.log("Connecting to MongoDB:", MONGO_URI); // debug
    const connectionDb = await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB Connected: ${connectionDb.connection.host}`);

    server.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

start();
