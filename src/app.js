import express from "express";
import { createServer } from "node:http";

import {Server} from "socket.io";

import mongoose from "mongoose";

import cors from "cors";

const app = express();

app.get("/home", (req, res)=>{
    return res.json({"hello": "world"})
});

const start = async () =>{
    app.listen(8000, ()=>{
        console.log("LISTENING ON PORT 8000")
    });
}

start();