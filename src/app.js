import dotenv from "dotenv";
dotenv.config(); // load env variables

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URL;

app.get("/home", (req, res) => {
  res.json({ hello: "World" });
});

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
