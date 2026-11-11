// Connect to Socket.IO
const socket = io();

// HTML elements
const createRoomBtn = document.getElementById("createRoom");
const joinRoomBtn = document.getElementById("joinRoom");
const roomInput = document.getElementById("roomId");
const roomCode = document.getElementById("roomCode");
const statusText = document.getElementById("status");

const copyRoomBtn = document.getElementById("copyRoomBtn");

const qrSection = document.getElementById("qrSection");
const qrCode = document.getElementById("qrCode");

// Identify room creator
let isRoomCreator = false;

// Create Room
createRoomBtn.addEventListener("click", () => {
  socket.emit("create-room");
});

// Join Room
joinRoomBtn.addEventListener("click", () => {
  const roomId = roomInput.value.trim().toUpperCase();

  // Check Room ID
  if (!/^[A-Z0-9]{6}$/.test(roomId)) {
    alert("Please enter a valid 6-character Room ID");
    return;
  }

  // Send request to server
  socket.emit("join-room", roomId);

  statusText.textContent = "Joining room...";
  statusText.style.color = "orange";
});

function joinRoomFromQR() {
  // Get Room ID from URL
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");

  if (!roomId) return;

  // Validate Room ID
  const cleanRoomId = roomId.trim().toUpperCase();

  if (!/^[A-Z0-9]{6}$/.test(cleanRoomId)) {
    alert("Invalid Room ID");
    return;
  }

  // Fill Room ID automatically
  document.getElementById("roomId").value = cleanRoomId;

  // Wait for Socket.IO connection
  if (socket.connected) {
    joinRoomBtn.click();
  } else {
    socket.once("connect", () => {
      joinRoomBtn.click();
    });
  }
}

// Automatically join room from QR URL
joinRoomFromQR();

// Room created
socket.on("room-created", (roomId) => {
  isRoomCreator = true;

  roomCode.textContent = "Your Room ID: " + roomId;
  copyRoomBtn.hidden = false;
  generateQRCode(roomId);

  statusText.textContent = "Waiting for another user...";
  statusText.style.color = "orange";

  createRoomBtn.disabled = true;
  joinRoomBtn.disabled = true;
});

// Room joined
socket.on("room-joined", (roomId) => {
  copyRoomBtn.hidden = false;
  isRoomCreator = false;

  roomCode.textContent = "Joined Room: " + roomId;

  createRoomBtn.disabled = true;
  joinRoomBtn.disabled = true;
});

// Both users ready
socket.on("room-ready", async () => {
  statusText.textContent = "Establishing WebRTC connection...";
  statusText.style.color = "orange";

  // Only creator starts Offer
  if (isRoomCreator) {
    try {
      await createOffer();
    } catch (error) {
      console.error("Offer Error:", error);
    }
  }
});

// Receive Offer
socket.on("offer", async (offer) => {
  try {
    await handleOffer(offer);
    await addPendingCandidates();
  } catch (error) {
    console.error("Handle Offer Error:", error);
  }
});

// Receive Answer
socket.on("answer", async (answer) => {
  try {
    await handleAnswer(answer);
    await addPendingCandidates();
  } catch (error) {
    console.error("Handle Answer Error:", error);
  }
});

// Receive ICE Candidate
socket.on("ice-candidate", async (candidate) => {
  try {
    await handleIceCandidate(candidate);
  } catch (error) {
    console.error("ICE Error:", error);
  }
});

// Room Error
socket.on("room-error", (message) => {
  alert(message);
});

// Peer disconnected

socket.on("peer-disconnected", () => {
  statusText.textContent = "Other user disconnected";
  statusText.style.color = "red";

  // Stop file transfer
  stopFileTransfer();

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  dataChannel = null;
  pendingCandidates.length = 0;
});

// Server disconnected

socket.on("disconnect", () => {
  statusText.textContent = "Disconnected from server";
  statusText.style.color = "red";

  // Stop file transfer
  stopFileTransfer();

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  dataChannel = null;
  pendingCandidates.length = 0;

  createRoomBtn.disabled = false;
  joinRoomBtn.disabled = false;
  isRoomCreator = false;
  roomCode.textContent = "";
  copyRoomBtn.hidden = true;
});

copyRoomBtn.addEventListener("click", async () => {
  const roomId = roomCode.textContent.match(/[A-Z0-9]{6}/)?.[0];

  if (!roomId) {
    alert("Room ID not found!");
    return;
  }

  try {
    await navigator.clipboard.writeText(roomId);
    copyRoomBtn.textContent = "✅ Copied!";

    setTimeout(() => {
      copyRoomBtn.textContent = "📋 Copy Room ID";
    }, 2000);
  } catch (error) {
    console.error("Copy failed:", error);
    alert("Unable to copy Room ID");
  }
});

function generateQRCode(roomId) {
  // Remove previous QR code
  qrCode.innerHTML = "";

  // Create room joining URL
  const roomURL =
    window.location.origin + "/?room=" + encodeURIComponent(roomId);

  // Generate QR code
  new QRCode(qrCode, {
    text: roomURL,
    width: 180,
    height: 180,
  });

  // Show QR section
  qrSection.hidden = false;
}
