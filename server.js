// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"));

// Schemas
const userSchema = new mongoose.Schema(
  {
    playerId: { type: String, unique: true, sparse: true },
    walletAddress: { type: String, required: true, unique: true },
    tokenBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const codeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    used: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const vehicleSchema = new mongoose.Schema(
  {
    playerId: String, // The player who originally spawned the car for purchase
    playerName: String,
    vehicleId: String,
    model: String,
    config: String,
    price: Number,
    niceName: String,
    configJson: Object,
    purchaseStatus: {
      type: String,
      enum: ["pending", "confirmed", "rejected"],
      default: "pending",
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vehicleCode: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Code = mongoose.model("Code", codeSchema);
const Vehicle = mongoose.model("Vehicle", vehicleSchema);

// In-memory store for SSE clients
const sseClients = {
  beammp: [],
  sync: new Map(), // Use a Map for sync clients for easier lookup by code
};

// SSE endpoint for BeamMP
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };
  sseClients.beammp.push(newClient);
  console.log(`${clientId} Connection opened for BeamMP`);

  req.on("close", () => {
    sseClients.beammp = sseClients.beammp.filter(
      (client) => client.id !== clientId
    );
    console.log(`${clientId} Connection closed for BeamMP`);
  });
});

// SSE endpoint for sync status
app.get("/api/sync-events/:code", (req, res) => {
  const { code } = req.params;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res: res,
  };

  // Store the client response, keyed by the sync code
  sseClients.sync.set(code, newClient);
  console.log(`Client ${clientId} connected for sync code ${code}`);

  // Send an initial "pending" status
  res.write(`data: ${JSON.stringify({ status: "pending" })}`);

  req.on("close", () => {
    sseClients.sync.delete(code);
    console.log(`Client ${clientId} for sync code ${code} disconnected`);
  });
});

// Function to send events to all BeamMP clients
function sendEventsToAllBeamMP(data) {
  sseClients.beammp.forEach((client) =>
    client.res.write(`data: ${JSON.stringify(data)}`)
  );
}

// Webhook for BeamMP server - creates a new pending vehicle
app.post("/api/beammp-webhook", async (req, res) => {
  const { event, vehicleCode, ...vehicleData } = req.body;

  if (event !== "car_spawn") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid event type" });
  }
  if (!vehicleCode) {
    return res
      .status(400)
      .json({ success: false, message: "Missing vehicleCode" });
  }

  try {
    const newVehicle = await Vehicle.create({
      ...vehicleData,
      vehicleCode,
    });

    // Broadcast the full vehicle data to the dapp
    sendEventsToAllBeamMP({ event: "car_spawn", vehicle: newVehicle });

    res.status(201).json({ success: true, vehicle: newVehicle });
  } catch (err) {
    console.error("Error creating vehicle from webhook:", err);
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "vehicleCode already exists." });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dapp calls this endpoint after a user purchases a vehicle
app.post("/api/purchase-vehicle", async (req, res) => {
  const { vehicleCode, playerId } = req.body;

  if (!vehicleCode || !playerId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing vehicleCode or playerId" });
  }

  try {
    const user = await User.findOne({ playerId: playerId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const vehicle = await Vehicle.findOne({ vehicleCode: vehicleCode });
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    if (vehicle.purchaseStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Vehicle status is already '${vehicle.purchaseStatus}'`,
      });
    }

    vehicle.purchaseStatus = "confirmed";
    vehicle.owner = user._id;
    await vehicle.save();

    res.status(200).json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dapp calls this endpoint to reject a vehicle purchase
app.post("/api/reject-purchase", async (req, res) => {
  const { vehicleCode } = req.body;
  if (!vehicleCode) {
    return res
      .status(400)
      .json({ success: false, message: "Missing vehicleCode" });
  }

  try {
    const vehicle = await Vehicle.findOne({ vehicleCode: vehicleCode });
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    if (vehicle.purchaseStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Vehicle status is already '${vehicle.purchaseStatus}'`,
      });
    }

    vehicle.purchaseStatus = "rejected";
    await vehicle.save();

    res.status(200).json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Game calls this endpoint when a player tries to spawn a car
app.post("/api/spawn-vehicle", async (req, res) => {
  const { vehicleCode, playerId } = req.body;
  if (!vehicleCode || !playerId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing vehicle code or player ID" });
  }

  try {
    const vehicle = await Vehicle.findOne({ vehicleCode }).populate("owner");

    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    if (vehicle.purchaseStatus !== "confirmed") {
      return res
        .status(403)
        .json({ success: false, message: "This vehicle is not confirmed." });
    }

    if (!vehicle.owner || vehicle.owner.playerId !== playerId) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not the owner of this vehicle",
        });
    }

    res.json({ success: true, configJson: vehicle.configJson });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dapp calls this to get all vehicles for a player
app.get("/api/player-vehicles/:playerId", async (req, res) => {
  try {
    const user = await User.findOne({ playerId: req.params.playerId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const vehicles = await Vehicle.find({
      owner: user._id,
      purchaseStatus: "confirmed",
    });
    res.json({ success: true, vehicles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Secure /init-sync endpoint
app.post("/api/init-sync", async (req, res) => {
  const { code, wallet, balance } = req.body;
  if (!code || !wallet || balance === undefined) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  try {
    // Create user
    const user = await User.create({
      walletAddress: wallet,
      tokenBalance: balance,
    });

    // Create code and link to user
    await Code.create({
      code,
      user: user._id,
    });

    res.json({ success: true, balance: user.tokenBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Open /verify-sync endpoint
app.post("/api/verify-sync", async (req, res) => {
  console.log("Body:", req.body);
  const { code, playerId } = req.body;
  if (!code || playerId === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "Missing code or playerId" });
  }

  try {
    const syncCode = await Code.findOne({ code }).populate("user");
    if (!syncCode || syncCode.used) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid or used code" });
    }

    syncCode.used = true;
    await syncCode.save();

    const user = syncCode.user;
    user.playerId = playerId;
    await user.save();

    // --- SSE Change ---
    const client = sseClients.sync.get(code);
    if (client) {
      client.res.write(
        `data: ${JSON.stringify({
          status: "completed",
          playerId: user.playerId,
        })}

`
      );
      client.res.end();
      sseClients.sync.delete(code);
    }
    // --- End SSE Change ---

    res.json({
      success: true,
      wallet: user.walletAddress,
      balance: user.tokenBalance,
      vehicles: [], // Placeholder for now
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Game server polls this endpoint to get the status of a pending purchase
app.get("/api/purchase-status", async (req, res) => {
  const { vehicleCode } = req.query;
  if (!vehicleCode) {
    return res
      .status(400)
      .json({ status: "failed", message: "Missing vehicleCode" });
  }

  try {
    const vehicle = await Vehicle.findOne({ vehicleCode });

    if (!vehicle) {
      return res
        .status(404)
        .json({ status: "failed", message: "Vehicle not found" });
    }

    res
      .status(200)
      .json({ status: vehicle.purchaseStatus, configJson: vehicle.configJson });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});

