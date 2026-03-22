const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3001;

// Manual CORS — allow all origins explicitly
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin, Accept");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Flight proxy running" });
});

// One-way flight search
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
