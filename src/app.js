import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";

import mongoose from "mongoose";

import cors from "cors";
 
const app = express();
const server = createServer(app);
const io = new Server(server)

app.set("port", (process.env.PORT || 8000))
app.get("/home", (req, res)=>{
    return res.json({"hello": "World"})
});

const start = async () =>{
    const connectionDb = await mongoose.connect("mongodb+srv://Satyam:Satyam%40123@cluster0.mdrsd2c.mongodb.net/testDB")
    server.listen(app.get("port"), ()=>{
        console.log("LISENING ON PORT 8000")
    });
}

start();