// HTML elements
const fileInput = document.getElementById("fileInput");
const sendFileBtn = document.getElementById("sendFile");
const fileName = document.getElementById("fileName");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const transferSpeed = document.getElementById("transferSpeed");
const timeRemaining = document.getElementById("timeRemaining");

const receivedFiles = document.getElementById("receivedFiles");

// File transfer settings
const CHUNK_SIZE = 16 * 1024;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return (bytes / Math.pow(1024, index)).toFixed(2) + " " + units[index];
}

// Receiver variables
let receivedChunks = [];
let receivedSize = 0;
let incomingFile = null;
let isSending = false;
let isReceiving = false;

// Update Send button
function updateSendButton() {
  sendFileBtn.disabled =
    !fileInput.files.length ||
    !dataChannel ||
    dataChannel.readyState !== "open" ||
    isSending ||
    isReceiving;
}

// File selection

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];

  if (file) {
    fileName.textContent = file.name + " (" + formatFileSize(file.size) + ")";
  } else {
    fileName.textContent = "";
  }

  progressBar.value = 0;
  progressText.textContent = "0%";

  updateSendButton();
});

// Send button click
sendFileBtn.addEventListener("click", sendFile);

// Update progress bar
function updateProgress(percent) {
  progressBar.value = percent;
  progressText.textContent = percent + "%";
}

// Wait until DataChannel has buffer space
function waitForBuffer() {
  return new Promise((resolve, reject) => {
    if (!dataChannel || dataChannel.readyState !== "open") {
      reject(new Error("DataChannel is closed"));
      return;
    }

    if (dataChannel.bufferedAmount < 65536) {
      resolve();
      return;
    }

    const channel = dataChannel;

    const check = () => {
      if (channel.readyState !== "open") {
        reject(new Error("Connection lost"));
        return;
      }

      if (channel.bufferedAmount < 65536) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };

    check();
  });
}

// Send file
async function sendFile() {
  const file = fileInput.files[0];

  if (!file || isSending || isReceiving) return;

  if (!dataChannel || dataChannel.readyState !== "open") {
    alert("Peer is not connected");
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    alert("Maximum file size is 100 MB");
    return;
  }

  isSending = true;
  updateSendButton();

  const channel = dataChannel;

  try {
    // Send file information first
    channel.send(
      JSON.stringify({
        type: "file-info",
        name: file.name,
        size: file.size,
        mime: file.type,
      }),
    );

    let offset = 0;
    const startTime = performance.now();
    // Send file in small chunks
    while (offset < file.size) {
      await waitForBuffer();

      if (channel.readyState !== "open") {
        throw new Error("Connection lost");
      }

      const chunk = file.slice(offset, offset + CHUNK_SIZE);

      const buffer = await chunk.arrayBuffer();

      channel.send(buffer);

      offset += buffer.byteLength;

      const percent = Math.floor((offset / file.size) * 100);

      const elapsedSeconds = (performance.now() - startTime) / 1000;

      if (elapsedSeconds > 0) {
        const speed = offset / elapsedSeconds;

        transferSpeed.textContent =
          (speed / (1024 * 1024)).toFixed(2) + " MB/s";

        const remainingBytes = file.size - offset;
        const remainingSeconds = remainingBytes / speed;

        timeRemaining.textContent = Math.ceil(remainingSeconds) + " sec";
      }

      updateProgress(percent);
    }

    await waitForBuffer();

    channel.send(
      JSON.stringify({
        type: "file-end",
      }),
    );

    updateProgress(100);
    progressText.textContent = "File sent!";
  } catch (error) {
    console.error("Send error:", error);
    progressText.textContent = "Transfer failed";
  } finally {
    isSending = false;
    updateSendButton();
  }
}

// Receive DataChannel messages
function handleFileMessage(event) {
  if (typeof event.data === "string") {
    const message = JSON.parse(event.data);

    // File information
    if (message.type === "file-info") {
      if (
        isReceiving ||
        isSending ||
        !Number.isSafeInteger(message.size) ||
        message.size < 0 ||
        message.size > MAX_FILE_SIZE
      ) {
        console.error("Invalid or busy transfer");
        dataChannel.close();
        return;
      }

      incomingFile = message;
      receivedChunks = [];
      receivedSize = 0;
      isReceiving = true;

      updateProgress(0);
      progressText.textContent = "Receiving...";

      updateSendButton();
    }

    // File finished
    if (message.type === "file-end") {
      if (!isReceiving || !incomingFile) return;

      if (receivedSize !== incomingFile.size) {
        progressText.textContent = "Incomplete file";
        resetReceiver();
        return;
      }

      downloadReceivedFile();
    }

    return;
  }

  // Receive binary chunk
  if (event.data instanceof ArrayBuffer) {
    if (!isReceiving || !incomingFile) return;

    receivedSize += event.data.byteLength;

    if (receivedSize > incomingFile.size) {
      progressText.textContent = "Invalid file size";
      dataChannel.close();
      resetReceiver();
      return;
    }

    receivedChunks.push(event.data);

    const percent =
      incomingFile.size === 0
        ? 100
        : Math.floor((receivedSize / incomingFile.size) * 100);

    updateProgress(percent);
  }
}

// Create download link
function downloadReceivedFile() {
  const blob = new Blob(receivedChunks, {
    type: incomingFile.mime || "application/octet-stream",
  });

  const url = URL.createObjectURL(blob);

  if (receivedFiles.textContent.includes("No files received")) {
    receivedFiles.textContent = "";
  }

  const link = document.createElement("a");

  link.href = url;
  link.download = incomingFile.name;
  link.textContent = "Download " + incomingFile.name;

  receivedFiles.appendChild(link);

  progressText.textContent = "File received!";
  updateProgress(100);

  resetReceiver();
}

// Reset receiver
function resetReceiver() {
  receivedChunks = [];
  receivedSize = 0;
  incomingFile = null;
  isReceiving = false;

  updateSendButton();
}

// Handle disconnected transfer
function stopFileTransfer() {
  if (isSending || isReceiving) {
    progressText.textContent = "Connection lost";
  }

  isSending = false;
  resetReceiver();
  updateSendButton();
}

const dropZone = document.getElementById("dropZone");

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", (event) => {
  if (!dropZone.contains(event.relatedTarget)) {
    dropZone.classList.remove("drag-over");
  }
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("drag-over");

  const files = event.dataTransfer.files;

  if (files.length === 0) return;

  if (files.length > 1) {
    alert("Please select only one file.");
    return;
  }

  fileInput.files = files;
  fileInput.dispatchEvent(new Event("change"));
});
