const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.FLIGHT_API_KEY;

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ── Watched routes ───────────────────────────────────────────────
const ROUTES = [
  { origin: "HYD", destination: "IST", label: "Hyderabad → Istanbul" },
  { origin: "HYD", destination: "MAD", label: "Hyderabad → Madrid" },
  { origin: "HYD", destination: "AGP", label: "Hyderabad → Malaga" },
  { origin: "HYD", destination: "LHR", label: "Hyderabad → London" },
  { origin: "HYD", destination: "BCN", label: "Hyderabad → Barcelona" },
  { origin: "HYD", destination: "ATH", label: "Hyderabad → Athens" },
  { origin: "IST", destination: "MAD", label: "Istanbul → Madrid" },
  { origin: "IST", destination: "AGP", label: "Istanbul → Malaga" },
  { origin: "IST", destination: "ATH", label: "Istanbul → Athens" },
];

const THRESHOLD = parseFloat(process.env.PRICE_THRESHOLD || "880");
const ALERT_DATE = process.env.TRAVEL_DATE || "2026-04-01";
const ALERT_EMAIL = process.env.ALERT_EMAIL || "";

// ── Conflict zone filter (FCDO March 2026) ───────────────────────
const BLOCKED_CARRIERS = new Set([
  "EK","EY","QR","GF","WY","SV","RJ","ME",
  "Emirates","Etihad Airways","Qatar Airways","Gulf Air",
  "Oman Air","Saudia","Saudi Arabian Airlines",
  "Royal Jordanian","Middle East Airlines","flydubai","Air Arabia"
]);
const BLOCKED_AIRPORTS = new Set([
  "DXB","AUH","SHJ","DOH","BAH","KWI",
  "TLV","BEY",
  "THR","IKA","MHD","SYZ",
  "BGW","BSR","EBL","NJF",
  "DAM","ALP","SAH","ADE","HOD",
  "KBL","TIP","KRT"
]);

function isConflictFree(f) {
  if (BLOCKED_CARRIERS.has(f.carrierCode) || BLOCKED_CARRIERS.has(f.carrier)) return false;
  if (BLOCKED_AIRPORTS.has(f.origin) || BLOCKED_AIRPORTS.has(f.destination)) return false;
  if (f.stopAirports && f.stopAirports.some(a => BLOCKED_AIRPORTS.has(a))) return false;
  return true;
}

// ── Parse FlightAPI response ─────────────────────────────────────
function parseResults(data) {
  if (!data || !Array.isArray(data)) return [];
  const itins = (data.find(d => d.itineraries) || {}).itineraries || [];
  const legs = (data.find(d => d.legs) || {}).legs || [];
  const carriers = (data.find(d => d.carriers) || {}).carriers || [];
  const places = (data.find(d => d.places) || {}).places || [];
  const agents = (data.find(d => d.agents) || {}).agents || [];
  const segments = (data.find(d => d.segments) || {}).segments || [];

  const cMap = {}, pMap = {}, aMap = {};
  carriers.forEach(c => { cMap[c.id] = { name: c.name || c.iata || String(c.id), code: c.iata || "" }; });
  places.forEach(p => { pMap[p.id] = p.iata || p.name || String(p.id); });
  agents.forEach(a => { aMap[a.id] = a.name || a.id; });

  return itins.slice(0, 40).map(itin => {
    const leg = legs.find(l => l.id === itin.leg_ids?.[0]);
    const legSegs = (leg?.segment_ids || []).map(sid => segments.find(s => s.id === sid)).filter(Boolean);
    const stopAirports = legSegs.slice(0, -1).map(s => pMap[s.destination_place_id]).filter(Boolean);
    const opts = [...(itin.pricing_options || [])].sort((a, b) => (a.price?.amount || 999999) - (b.price?.amount || 999999));
    const best = opts[0];
    const price = best?.price?.amount;
    const ci = cMap[leg?.marketing_carrier_ids?.[0]] || { name: "—", code: "" };
    return {
      origin: pMap[leg?.origin_place_id] || "—",
      destination: pMap[leg?.destination_place_id] || "—",
      carrier: ci.name,
      carrierCode: ci.code,
      stops: leg?.stop_count ?? 0,
      stopAirports,
      duration: leg?.duration,
      price,
      agentName: aMap[best?.agent_ids?.[0]] || "OTA",
      bookingUrl: best?.items?.[0]?.url,
    };
  }).filter(f => f.price && isConflictFree(f)).sort((a, b) => a.price - b.price);
}

// ── State: last known prices ─────────────────────────────────────
const priceCache = {};

// ── Fetch one route ──────────────────────────────────────────────
async function fetchRoute(origin, destination, date) {
  const url = `https://api.flightapi.io/onewaytrip/${API_KEY}/${origin}/${destination}/${date}/1/0/0/Economy/GBP`;
  const r = await fetch(url, { timeout: 20000 });
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

// ── Send Gmail alert via Claude MCP ─────────────────────────────
async function sendGmailAlert(label, price, threshold, date) {
  try {
    await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Send a Gmail email to ${ALERT_EMAIL} with subject "✈️ SkyIntel Alert: ${label} dropped to £${Math.round(price)}" and this body:

"Your watched route ${label} on ${date} has dropped to £${Math.round(price)} — below your threshold of £${threshold}.

This is a conflict-zone-filtered result (no Gulf carriers, no dangerous airspace).

Check and book now at skyscanner.net or google.com/flights before it goes.

— SkyIntel"`
        }],
        mcp_servers: [{ type: "url", url: "https://gmail.mcp.claude.com/mcp", name: "gmail" }]
      })
    });
    console.log(`[ALERT SENT] ${label} @ £${Math.round(price)}`);
  } catch (e) {
    console.error("[ALERT FAILED]", e.message);
  }
}

// ── Core monitor function ────────────────────────────────────────
async function runMonitor() {
  console.log(`[${new Date().toISOString()}] Running monitor for ${ROUTES.length} routes on ${ALERT_DATE}`);
  const results = [];

  for (const route of ROUTES) {
    try {
      const raw = await fetchRoute(route.origin, route.destination, ALERT_DATE);
      const flights = parseResults(raw);
      const best = flights[0];

      if (!best) {
        results.push({ ...route, status: "no_results", price: null, flight: null });
        continue;
      }

      const prev = priceCache[route.label];
      const price = Math.round(best.price);
      priceCache[route.label] = price;

      const dropped = prev && price < prev;
      const belowThreshold = price <= THRESHOLD;

      console.log(`  ${route.label}: £${price} (prev: ${prev ? "£"+prev : "n/a"}) ${belowThreshold ? "⚠️ BELOW THRESHOLD" : ""}`);

      // Alert if below threshold and (first time seen below, or price dropped)
      if (belowThreshold && ALERT_EMAIL && (!prev || dropped)) {
        await sendGmailAlert(route.label, price, THRESHOLD, ALERT_DATE);
      }

      results.push({ ...route, status: "ok", price, prev: prev || null, dropped, belowThreshold, flight: best });
    } catch (e) {
      console.error(`  [ERROR] ${route.label}: ${e.message}`);
      results.push({ ...route, status: "error", error: e.message, price: null, flight: null });
    }

    // Pace requests to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  return results;
}

// ── Proxy endpoint (for manual searches) ────────────────────────
app.get("/oneway", async (req, res) => {
  const { origin, destination, date, adults = "1", cabin = "Economy", currency = "GBP" } = req.query;
  if (!origin || !destination || !date) return res.status(400).json({ error: "Missing params" });
  try {
    const url = `https://api.flightapi.io/onewaytrip/${API_KEY}/${origin}/${destination}/${date}/${adults}/0/0/${cabin}/${currency}`;
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Monitor trigger (called by cron-job.org every hour) ──────────
app.get("/monitor", async (req, res) => {
  const secret = req.query.secret;
  if (process.env.MONITOR_SECRET && secret !== process.env.MONITOR_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const results = await runMonitor();
    res.json({ ran_at: new Date().toISOString(), results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Dashboard ────────────────────────────────────────────────────
app.get("/", (req, res) => {
  const rows = ROUTES.map(r => {
    const cached = priceCache[r.label];
    const below = cached && cached <= THRESHOLD;
    return `<tr style="background:${below ? "rgba(77,255,160,0.08)" : "transparent"}">
      <td style="padding:12px 16px;font-weight:600">${r.label}</td>
      <td style="padding:12px 16px;font-family:monospace;font-size:18px;color:${below ? "#4dffa0" : "#e8ff47"}">${cached ? "£"+cached : "—"}</td>
      <td style="padding:12px 16px;font-family:monospace;font-size:12px;color:${below ? "#4dffa0" : "#556070"}">${below ? "✅ BELOW £"+THRESHOLD : "£"+THRESHOLD+" threshold"}</td>
    </tr>`;
  }).join("");

  res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta http-equiv="refresh" content="3600"/>
<title>SkyIntel Monitor</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#080a0d;color:#eef2f8;font-family:'Syne',sans-serif;min-height:100vh;padding:40px 24px}
.wrap{max-width:900px;margin:0 auto}
.top{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:40px;padding-bottom:24px;border-bottom:1px solid #1e2836}
h1{font-size:32px;font-weight:800;letter-spacing:-1px}
h1 span{color:#e8ff47}
.meta{font-family:'JetBrains Mono',monospace;font-size:11px;color:#556070;text-align:right;line-height:1.8}
.meta strong{color:#4dffa0}
table{width:100%;border-collapse:collapse;background:#0f1318;border:1px solid #1e2836;border-radius:12px;overflow:hidden}
th{padding:12px 16px;text-align:left;font-family:'JetBrains Mono',monospace;font-size:10px;color:#556070;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1e2836}
tr{border-bottom:1px solid #1e2836}
tr:last-child{border-bottom:none}
.note{margin-top:24px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#556070;line-height:1.8;background:#0f1318;border:1px solid #1e2836;border-radius:10px;padding:16px 20px}
.note strong{color:#35d4ff}
.btn{display:inline-block;margin-top:16px;background:#e8ff47;color:#080a0d;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;border-radius:8px;padding:10px 20px;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#556070;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px">Flight Intelligence</div>
      <h1>Sky<span>Intel</span></h1>
    </div>
    <div class="meta">
      Monitoring <strong>${ROUTES.length} routes</strong><br/>
      Travel date: <strong>${ALERT_DATE}</strong><br/>
      Threshold: <strong>£${THRESHOLD}</strong><br/>
      Checks: <strong>every hour</strong><br/>
      Last check: <strong>${Object.keys(priceCache).length > 0 ? new Date().toLocaleTimeString("en-GB") : "not yet run"}</strong>
    </div>
  </div>

  <table>
    <thead><tr>
      <th>Route</th>
      <th>Best Safe Price</th>
      <th>Status</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="3" style="padding:24px;text-align:center;font-family:monospace;color:#556070">No data yet — trigger /monitor to run first check</td></tr>'}</tbody>
  </table>

  <div class="note">
    <strong>How this works:</strong><br/>
    Prices update every hour via cron-job.org → /monitor<br/>
    All results filtered: no Gulf carriers, no conflict zone airports (FCDO March 2026)<br/>
    Gmail alert fires automatically when any route drops below £${THRESHOLD}<br/>
    Page auto-refreshes every hour · <a href="/monitor" style="color:#e8ff47">trigger manual check →</a>
  </div>
</div>
</body>
</html>`);
});

app.listen(PORT, () => console.log(`SkyIntel Monitor running on port ${PORT}`));
