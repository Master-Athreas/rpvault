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

const listingSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "sold", "delisted"],
      default: "active",
    },
  },
  { timestamps: true }
);

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["listing", "sale", "cancellation", "initial_purchase"],
      required: true,
    },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" }, // Optional
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional
    amount: { type: Number }, // Optional
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Listing = mongoose.model("Listing", listingSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);

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
  res.write(`data: ${JSON.stringify({ status: "pending" })}\n\n`);

  req.on("close", () => {
    sseClients.sync.delete(code);
    console.log(`Client ${clientId} for sync code ${code} disconnected`);
  });
});

// Function to send events to all BeamMP clients
function sendEventsToAllBeamMP(data) {
  sseClients.beammp.forEach((client) =>
    client.res.write(`data: ${JSON.stringify(data)}\n\n`)
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

    // Create a transaction for the initial purchase
    await Transaction.create({
        type: 'initial_purchase',
        vehicle: vehicle._id,
        buyer: user._id,
        amount: vehicle.price,
        status: 'completed'
    });

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
        })}\n\n`
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

app.post("/api/check-ownership", async (req, res) => {
  try {
    const { playerId, model, config } = req.body;
    if (!playerId || !model || !config) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const user = await User.findOne({ playerId: playerId });
    if (!user) {
      return res.json({ success: true, isOwner: false });
    }

    const vehicle = await Vehicle.findOne({
      owner: user._id,
      model,
      config,
      purchaseStatus: "confirmed",
    });
    res.json({ success: true, isOwner: !!vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/users/wallet/:walletAddress", async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.params.walletAddress });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Listings
app.post("/api/listings", async (req, res) => {
  const { vehicleId, price, sellerId } = req.body;

  if (!vehicleId || !price || !sellerId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    const seller = await User.findById(sellerId);
    if (!seller) {
        return res.status(404).json({ success: false, message: "Seller not found" });
    }

    // Check if the vehicle is already listed
    const existingListing = await Listing.findOne({ vehicle: vehicleId, status: "active" });
    if (existingListing) {
        return res.status(400).json({ success: false, message: "Vehicle is already listed for sale" });
    }

    const newListing = await Listing.create({
      vehicle: vehicleId,
      seller: sellerId,
      price,
    });

    // Create a transaction for the listing
    await Transaction.create({
        type: 'listing',
        vehicle: vehicleId,
        seller: sellerId,
        listing: newListing._id,
        amount: price,
        status: 'completed'
    });

    res.status(201).json({ success: true, listing: newListing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/listings", async (req, res) => {
  try {
    const listings = await Listing.find({ status: "active" })
      .populate("vehicle")
      .populate("seller", "walletAddress playerId"); // Populate seller with only walletAddress and playerId

    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/listings/:id/buy", async (req, res) => {
    const { buyerId } = req.body;
    const { id: listingId } = req.params;

    if (!buyerId) {
        return res.status(400).json({ success: false, message: "Missing buyerId" });
    }

    try {
        const listing = await Listing.findById(listingId).populate('seller').populate('vehicle');
        if (!listing || listing.status !== 'active') {
            return res.status(404).json({ success: false, message: "Listing not found or not active" });
        }

        const buyer = await User.findById(buyerId);
        if (!buyer) {
            return res.status(404).json({ success: false, message: "Buyer not found" });
        }

        // For simplicity, we are not handling payment here.
        // In a real application, you would integrate with a payment gateway or use a smart contract.

        // 1. Create a transaction
        const newTransaction = await Transaction.create({
            type: 'sale',
            vehicle: listing.vehicle._id,
            listing: listingId,
            buyer: buyerId,
            seller: listing.seller._id,
            amount: listing.price,
            status: 'completed' // Assuming payment is instant
        });

        // 2. Update listing status
        listing.status = 'sold';
        await listing.save();

        // 3. Update vehicle owner
        const vehicle = listing.vehicle;
        vehicle.owner = buyerId;
        await vehicle.save();


        res.status(200).json({ success: true, transaction: newTransaction });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete("/api/listings/:id", async (req, res) => {
    const { id: listingId } = req.params;
    const { userId } = req.body; // The user who is cancelling the listing

    try {
        const listing = await Listing.findById(listingId).populate('seller');
        if (!listing || listing.status !== 'active') {
            return res.status(404).json({ success: false, message: "Listing not found or not active" });
        }

        if (listing.seller._id.toString() !== userId) {
            return res.status(403).json({ success: false, message: "You are not the seller of this listing" });
        }

        listing.status = 'delisted';
        await listing.save();

        // Create a transaction for the cancellation
        await Transaction.create({
            type: 'cancellation',
            vehicle: listing.vehicle,
            seller: userId,
            listing: listingId,
            status: 'completed'
        });

        res.status(200).json({ success: true, message: "Listing cancelled" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Transactions
app.get("/api/transactions/user/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const transactions = await Transaction.find({
            $or: [{ buyer: userId }, { seller: userId }]
        }).populate({
            path: 'listing',
            populate: {
                path: 'vehicle'
            }
        }).populate('buyer', 'walletAddress playerId')
          .populate('seller', 'walletAddress playerId');

        res.json({ success: true, transactions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});

