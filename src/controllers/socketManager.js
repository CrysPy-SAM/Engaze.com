import { Server } from "socket.io";

const connections = {};
const messages = {};
const timeOnline = {};

/**
 * Initializes Socket.IO and handles all real-time events.
 * @param {import("http").Server} server
 * @returns {Server}
 */
export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ New client connected: ${socket.id}`);

    // When a user joins a call
    socket.on("join-call", (roomId) => {
      if (!connections[roomId]) connections[roomId] = [];
      connections[roomId].push(socket.id);
      timeOnline[socket.id] = new Date();

      console.log(`👥 ${socket.id} joined room: ${roomId}`);

      // Notify others in the room
      connections[roomId].forEach((clientId) => {
        io.to(clientId).emit("user-joined", socket.id, connections[roomId]);
      });

      // Send old messages to the newly joined user
      if (messages[roomId]) {
        messages[roomId].forEach((msg) => {
          io.to(socket.id).emit(
            "chat-message",
            msg.data,
            msg.sender,
            msg["socket-id-sender"]
          );
        });
      }
    });

    // WebRTC signaling between peers
    socket.on("signal", (targetId, message) => {
      io.to(targetId).emit("signal", socket.id, message);
    });

    // Chat messages
    socket.on("chat-message", (data, sender) => {
      const roomId = Object.keys(connections).find((key) =>
        connections[key].includes(socket.id)
      );

      if (!roomId) return;

      if (!messages[roomId]) messages[roomId] = [];
      messages[roomId].push({
        sender,
        data,
        "socket-id-sender": socket.id,
      });

      console.log(`💬 [${roomId}] ${sender}: ${data}`);

      // Broadcast to everyone in the room
      connections[roomId].forEach((clientId) => {
        io.to(clientId).emit("chat-message", data, sender, socket.id);
      });
    });

    // When a user disconnects
    socket.on("disconnect", () => {
      const disconnectTime = new Date();
      const duration =
        timeOnline[socket.id] && (disconnectTime - timeOnline[socket.id]) / 1000;

      let roomId;
      for (const [room, clients] of Object.entries(connections)) {
        if (clients.includes(socket.id)) {
          roomId = room;
          // Notify everyone that this user left
          clients.forEach((clientId) => {
            io.to(clientId).emit("user-left", socket.id);
          });

          // Remove from room
          connections[room] = clients.filter((id) => id !== socket.id);

          if (connections[room].length === 0) delete connections[room];
          break;
        }
      }

      delete timeOnline[socket.id];
      console.log(
        `❌ Client disconnected: ${socket.id}${
          roomId ? ` (Room: ${roomId})` : ""
        } | Online: ${duration?.toFixed(1) || 0}s`
      );
    });
  });

  return io;
};
