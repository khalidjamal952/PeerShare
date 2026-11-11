const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
require("dotenv").config();

const socketHandler = require("./socket/socketHandler");

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server);

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// Handle socket connections
socketHandler(io);

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
