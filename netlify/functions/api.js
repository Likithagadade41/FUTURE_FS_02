const express = require("express");
const mongoose = require("mongoose");
const serverless = require("serverless-http");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(express.json());

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      default: "Website",
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "Converted"],
      default: "New",
    },
    notes: {
      type: String,
      default: "",
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    followUpCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
}

// Get all leads
app.get("/api/leads", async (req, res) => {
  try {
    await connectDB();

    const leads = await Lead.find().sort({ createdAt: -1 });

    res.json(leads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching leads" });
  }
});

// Add lead
app.post("/api/leads", async (req, res) => {
  try {
    await connectDB();

    const {
      name,
      email,
      source,
      status,
      notes,
      followUpDate,
    } = req.body;

    const newLead = new Lead({
      name,
      email,
      source,
      status,
      notes,
      followUpDate,
    });

    await newLead.save();

    res.status(201).json(newLead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding lead" });
  }
});

// Update lead
app.patch("/api/leads/:id", async (req, res) => {
  try {
    await connectDB();

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" }
    );

    res.json(updatedLead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating lead" });
  }
});

// Delete lead
app.delete("/api/leads/:id", async (req, res) => {
  try {
    await connectDB();

    await Lead.findByIdAndDelete(req.params.id);

    res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting lead" });
  }
});

module.exports.handler = serverless(app);