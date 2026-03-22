const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3001;

// Allow requests from anywhere (your Claude artifact)
app.use(cors());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Flight proxy running" });
});

// One-way flight search
// GET /oneway?origin=LHR&destination=HKG&date=2026-05-01&adults=1&cabin=Economy&currency=GBP
app.get("/oneway", async (req, res) => {
  const { origin, destination, date, adults = "1", cabin = "Economy", currency = "GBP" } = req.query;
  const API_KEY = process.env.FLIGHT_API_KEY;

  if (!origin || !destination || !date) {
    return res.status(400).json({ error: "Missing required params: origin, destination, date" });
  }

  try {
    const url = `https://api.flightapi.io/onewaytrip/${API_KEY}/${origin}/${destination}/${date}/${adults}/0/0/${cabin}/${currency}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
