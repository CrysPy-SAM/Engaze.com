import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

app.set("port", process.env.PORT || 8000);

app.get("/home", (req, res) => {
  return res.json({ hello: "world" });
});

const start = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://Satyam:Satyam%40123@cluster0.mdrsd2c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("✅ MongoDB connected successfully!");

    server.listen(app.get("port"), () => {
      console.log(`🚀 Server listening on port ${app.get("port")}`);
    });
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
};

start();
