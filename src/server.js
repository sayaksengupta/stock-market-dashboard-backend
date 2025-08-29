require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const stockRoutes = require("./routes/stocks");
const {
  startPolling,
  stopPolling,
  getSubscribedSymbols,
} = require("./utils/stockPoller");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/stocks", stockRoutes);

// WebSocket connection
io.on("connection", (socket) => {
  console.log("Client connected");

  // Client subscribes to stock symbols (array)
  socket.on("subscribe", (symbols) => {
    console.log(`Client subscribed to: ${symbols}`);
    startPolling(symbols, io); // Start polling for these symbols
  });

  // Client unsubscribes
  socket.on("unsubscribe", (symbols) => {
    console.log(`Client unsubscribed from: ${symbols}`);
    stopPolling(symbols);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
