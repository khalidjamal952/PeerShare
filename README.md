# PeerShare — Peer-to-Peer File Sharing App

PeerShare is a browser-based file sharing application built using WebRTC, Socket.IO, Node.js, Express.js, HTML, CSS, and JavaScript.

It allows two users to connect through a unique Room ID or QR Code and transfer files directly between their browsers.

## Features

- Peer-to-peer file sharing using WebRTC DataChannel
- Create and join rooms using a unique 6-character Room ID
- QR Code-based room joining
- Drag-and-drop file selection
- File transfer progress tracking
- Transfer speed and estimated remaining time
- Copy Room ID functionality
- Mobile and desktop browser support
- File sharing without storing transferred files on the application server
- File size limit: 100 MB

## Tech Stack

| Technology        | Purpose                       |
| ----------------- | ----------------------------- |
| HTML5             | Application structure         |
| CSS3              | Styling and responsive layout |
| JavaScript        | Frontend functionality        |
| Node.js           | Backend runtime               |
| Express.js        | Web server                    |
| Socket.IO         | Real-time signaling           |
| WebRTC            | Peer-to-peer file transfer    |
| Cloudflare Tunnel | Temporary HTTPS testing       |

## Project Structure

```text
peer-share/
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── webrtc.js
│       └── fileTransfer.js
├── backend/
│   ├── server.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── utils/
│   │   └── roomManager.js
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

## Installation and Setup

### Prerequisites

Install the following software:

- Node.js
- npm
- Git
- A modern browser with WebRTC support

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/PeerShare.git
```

### 2. Open the Backend Directory

```bash
cd PeerShare/backend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Open the Application

Visit:

```text
http://localhost:3000
```

## How to Use PeerShare

### Sender

1. Open the PeerShare website.
2. Click **Create Room**.
3. Share the generated Room ID or QR Code.
4. Wait for the receiver to join.
5. Select a file or drag and drop it.
6. Start the file transfer.

### Receiver

1. Open the PeerShare website.
2. Enter the Room ID or scan the QR Code.
3. Join the room.
4. Wait for the WebRTC connection.
5. Receive and download the transferred file.

## How It Works

1. The sender creates a room.
2. Socket.IO handles room joining and WebRTC signaling.
3. The browsers establish a WebRTC peer connection.
4. Files are divided into chunks and transferred through the WebRTC DataChannel.
5. The receiver reconstructs the file and downloads it.

Socket.IO is used for signaling, not for transferring the actual file data.

## Security and Limitations

- Room IDs are used to connect two users.
- Transferred file data is encrypted in transit by WebRTC.
- File contents are not intentionally uploaded to the application server.
- Room IDs are not passwords or an authentication mechanism.
- WebRTC connectivity may require a TURN server on restrictive networks.
- Maximum supported file size is currently 100 MB.
- This project is intended for learning and demonstration purposes.

## Deployment

The application can be deployed to a Node.js hosting provider such as Render.

The deployment must support HTTP requests and persistent WebSocket connections for Socket.IO signaling.

A public HTTPS URL allows users to open the website and join rooms from different devices.

## Future Improvements

- Multiple file transfers
- Transfer cancellation
- Transfer history
- Improved reconnection handling
- TURN server support for restrictive networks

## Author

**Khalid Jamal**

Frontend Developer | Computer Science Engineering Student

## License

No license has been added yet. All rights reserved.
