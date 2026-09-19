const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 5000;

// Lead Schema
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

const Lead = mongoose.model("Lead", leadSchema);

// Get all leads
app.get("/api/leads", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leads" });
  }
});

// Add a new lead
app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, source, status, notes, followUpDate } = req.body;

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
    res.status(500).json({ message: "Error adding lead" });
  }
});

// Update lead status
app.patch("/api/leads/:id", async (req, res) => {
  try {
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" }
    );

    res.json(updatedLead);
  } catch (error) {
    res.status(500).json({ message: "Error updating lead" });
  }
});

// Delete lead
app.delete("/api/leads/:id", async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);

    res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting lead" });
  }
});

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });