
const rooms = {};

// Generate random room ID
function createRoom(socketId) {
    let roomId;

    do {
        roomId = Math.random().toString(36)
            .substring(2, 8).toUpperCase();
    } while (rooms[roomId]);

    rooms[roomId] = [socketId];

    return roomId;
}

// Join existing room
function joinRoom(roomId, socketId) {
    const room = rooms[roomId];

    if (!room) {
        return "Room not found";
    }

    if (room.length >= 2) {
        return "Room is full";
    }

    if (room.includes(socketId)) {
        return "Already joined";
    }

    room.push(socketId);

    return "success";
}

// Remove disconnected user
function removeUser(socketId) {
    for (let roomId in rooms) {
        rooms[roomId] = rooms[roomId].filter(
            id => id !== socketId
        );

        if (rooms[roomId].length === 0) {
            delete rooms[roomId];
        }
    }
}

module.exports = {
    createRoom,
    joinRoom,
    removeUser
};
