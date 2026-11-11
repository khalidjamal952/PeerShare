// WebRTC variables
let peerConnection;
let dataChannel;

// STUN server configuration
const configuration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

// Create WebRTC connection
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);

  // Send ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };

  // Receive DataChannel
  peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;
    setupDataChannel();
  };

  // Connection state

  peerConnection.onconnectionstatechange = () => {
    console.log("WebRTC State:", peerConnection.connectionState);

    if (
      peerConnection.connectionState === "failed" ||
      peerConnection.connectionState === "closed"
    ) {
      statusText.textContent = "WebRTC connection lost";
      statusText.style.color = "red";

      stopFileTransfer();
    }
  };
}

function setupDataChannel() {
  dataChannel.binaryType = "arraybuffer";

  // Receive file messages
  dataChannel.onmessage = handleFileMessage;

  // Connection opened
  dataChannel.onopen = () => {
    console.log("DataChannel Open!");

    statusText.textContent = "WebRTC Connected!";
    statusText.style.color = "green";

    updateSendButton();
  };

  // Connection closed
  dataChannel.onclose = () => {
    console.log("DataChannel Closed");

    statusText.textContent = "WebRTC Disconnected";
    statusText.style.color = "red";

    stopFileTransfer();
  };

  // Connection error
  dataChannel.onerror = (error) => {
    console.error("DataChannel Error:", error);
  };
}

// User A creates Offer
async function createOffer() {
  createPeerConnection();

  // Create DataChannel
  dataChannel = peerConnection.createDataChannel("fileTransfer");

  setupDataChannel();

  const offer = await peerConnection.createOffer();

  await peerConnection.setLocalDescription(offer);

  socket.emit("offer", peerConnection.localDescription);
}

// User B receives Offer
async function handleOffer(offer) {
  createPeerConnection();

  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection.createAnswer();

  await peerConnection.setLocalDescription(answer);

  socket.emit("answer", peerConnection.localDescription);
}

// User A receives Answer
async function handleAnswer(answer) {
  await peerConnection.setRemoteDescription(answer);
}

// Receive ICE candidates
const pendingCandidates = [];

async function handleIceCandidate(candidate) {
  if (!peerConnection || !peerConnection.remoteDescription) {
    pendingCandidates.push(candidate);
    return;
  }

  await peerConnection.addIceCandidate(candidate);
}

// Add candidates received before remote description
async function addPendingCandidates() {
  while (pendingCandidates.length > 0) {
    const candidate = pendingCandidates.shift();

    await peerConnection.addIceCandidate(candidate);
  }
}
