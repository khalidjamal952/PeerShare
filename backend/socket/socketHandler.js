const { createRoom, joinRoom, removeUser } = require("../utils/roomManager");

function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Create Room
    socket.on("create-room", () => {
      if (socket.data.roomId) {
        socket.emit("room-error", "Already in a room");
        return;
      }

      const roomId = createRoom(socket.id);

      socket.join(roomId);
      socket.data.roomId = roomId;

      socket.emit("room-created", roomId);
    });

    // Join Room
    socket.on("join-room", (roomId) => {
      if (socket.data.roomId) {
        socket.emit("room-error", "Already in a room");
        return;
      }

      if (typeof roomId !== "string") {
        socket.emit("room-error", "Invalid Room ID");
        return;
      }

      roomId = roomId.trim().toUpperCase();

      const result = joinRoom(roomId, socket.id);

      if (result !== "success") {
        socket.emit("room-error", result);
        return;
      }

      socket.join(roomId);
      socket.data.roomId = roomId;

      socket.emit("room-joined", roomId);

      // Tell both users room is ready
      io.to(roomId).emit("room-ready");
    });

    // WebRTC Signaling
    socket.on("offer", (offer) => {
      const roomId = socket.data.roomId;

      if (roomId) {
        socket.to(roomId).emit("offer", offer);
      }
    });

    socket.on("answer", (answer) => {
      const roomId = socket.data.roomId;

      if (roomId) {
        socket.to(roomId).emit("answer", answer);
      }
    });

    socket.on("ice-candidate", (candidate) => {
      const roomId = socket.data.roomId;

      if (roomId) {
        socket.to(roomId).emit("ice-candidate", candidate);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;

      if (roomId) {
        socket.to(roomId).emit("peer-disconnected");
      }

      removeUser(socket.id);

      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = socketHandler;
