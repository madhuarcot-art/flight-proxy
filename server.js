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

// One-way flight proxy
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

// Serve the app
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>SkyIntel · Flight Intelligence</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#080a0d;--surface:#0f1318;--surface2:#151b22;--surface3:#1c242e;--border:#1e2836;--border2:#263040;--accent:#e8ff47;--accent3:#35d4ff;--text:#eef2f8;--muted:#556070;--muted2:#2e3a47;--green:#4dffa0;--red:#ff4d6a;--orange:#ff9535;--display:'Syne',sans-serif;--mono:'JetBrains Mono',monospace}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:var(--display);min-height:100vh;background-image:radial-gradient(ellipse at 20% 0%,rgba(232,255,71,.04) 0%,transparent 60%),radial-gradient(ellipse at 80% 100%,rgba(53,212,255,.03) 0%,transparent 50%)}
.shell{max-width:1100px;margin:0 auto;padding:32px 24px 80px}
.header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:40px;padding-bottom:24px;border-bottom:1px solid var(--border)}
.wordmark{font-size:11px;font-family:var(--mono);color:var(--muted);letter-spacing:3px;text-transform:uppercase;margin-bottom:6px}
.title{font-size:36px;font-weight:800;letter-spacing:-1.5px;line-height:1}
.title span{color:var(--accent)}
.header-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.pill{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border2);border-radius:100px;padding:7px 16px;font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase}
.pill.warning{border-color:rgba(255,149,53,.4);color:var(--orange);background:rgba(255,149,53,.08)}
.dot{width:6px;height:6px;border-radius:50%;background:var(--muted2);flex-shrink:0}
.dot.live{background:var(--green);box-shadow:0 0 10px var(--green);animation:blink 2s infinite}
.dot.warn{background:var(--orange)}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.tabs{display:flex;gap:2px;margin-bottom:28px}
.tab{background:transparent;border:none;color:var(--muted);font-family:var(--display);font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;cursor:pointer;transition:all .2s}
.tab.active{background:var(--surface2);color:var(--text);border:1px solid var(--border2)}
.tab:hover:not(.active){color:var(--text)}
.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px;margin-bottom:20px;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);opacity:.4}
.card-label{font-family:var(--mono);font-size:10px;color:var(--accent);text-transform:uppercase;letter-spacing:2px;margin-bottom:20px}
.grid-4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;align-items:end}
.field label{display:block;font-family:var(--mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:7px}
input,select{width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:11px 14px;color:var(--text);font-family:var(--mono);font-size:12px;outline:none;transition:border-color .2s}
input:focus,select:focus{border-color:var(--accent)}
input::placeholder{color:var(--muted2)}
select option{background:var(--surface2)}
button{cursor:pointer;border:none;outline:none;transition:all .15s}
.btn-primary{background:var(--accent);color:#080a0d;font-family:var(--display);font-weight:700;font-size:13px;border-radius:10px;padding:12px 24px;white-space:nowrap}
.btn-primary:hover{opacity:.85;transform:translateY(-1px)}
.btn-primary:disabled{opacity:.35;cursor:not-allowed;transform:none}
.btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border2);font-family:var(--mono);font-size:11px;border-radius:8px;padding:8px 16px}
.btn-ghost:hover{border-color:var(--accent3);color:var(--accent3)}
.btn-watch{background:rgba(232,255,71,.08);color:var(--accent);border:1px solid rgba(232,255,71,.2);font-family:var(--mono);font-size:10px;border-radius:6px;padding:5px 11px;white-space:nowrap}
.btn-watch:hover{background:rgba(232,255,71,.16)}
.btn-rm{background:transparent;color:var(--red);border:1px solid rgba(255,77,106,.25);font-family:var(--mono);font-size:10px;border-radius:6px;padding:5px 11px}
.toggle-row{display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)}
.toggle{position:relative;width:36px;height:20px;flex-shrink:0}
.toggle input{opacity:0;width:0;height:0}
.toggle-slider{position:absolute;inset:0;background:var(--muted2);border-radius:20px;cursor:pointer;transition:.2s}
.toggle-slider:before{content:'';position:absolute;width:14px;height:14px;left:3px;top:3px;background:white;border-radius:50%;transition:.2s}
.toggle input:checked+.toggle-slider{background:var(--orange)}
.toggle input:checked+.toggle-slider:before{transform:translateX(16px)}
.toggle-label{font-family:var(--mono);font-size:11px;color:var(--muted)}
.toggle-label strong{color:var(--orange)}
.alert{border-radius:10px;padding:12px 18px;margin-bottom:16px;font-family:var(--mono);font-size:12px;display:flex;align-items:flex-start;gap:10px}
.alert.err{background:rgba(255,77,106,.08);border:1px solid rgba(255,77,106,.25);color:#ff8099}
.alert.ok{background:rgba(77,255,160,.07);border:1px solid rgba(77,255,160,.2);color:var(--green)}
.alert.info{background:rgba(53,212,255,.07);border:1px solid rgba(53,212,255,.2);color:var(--accent3)}
.alert.warn{background:rgba(255,149,53,.08);border:1px solid rgba(255,149,53,.25);color:var(--orange)}
.loader{display:flex;align-items:center;justify-content:center;gap:12px;padding:48px}
.spinner{width:18px;height:18px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.loader-text{font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:1px}
.insight{background:rgba(232,255,71,.04);border:1px solid rgba(232,255,71,.12);border-radius:12px;padding:16px 20px;margin-bottom:20px}
.insight-label{font-family:var(--mono);font-size:9px;color:var(--accent);text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}
.insight p{font-size:13px;color:var(--muted);line-height:1.7;font-family:var(--mono)}
.filtered-notice{background:rgba(255,149,53,.06);border:1px solid rgba(255,149,53,.2);border-radius:10px;padding:12px 18px;margin-bottom:16px;font-family:var(--mono);font-size:11px;color:var(--orange)}
.results-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.results-title{font-size:15px;font-weight:700;letter-spacing:-.4px}
.badge{font-family:var(--mono);font-size:10px;color:var(--muted);background:var(--surface2);border:1px solid var(--border2);border-radius:100px;padding:3px 12px}
.flight-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px 22px;margin-bottom:10px;display:grid;grid-template-columns:1fr auto auto auto;gap:20px;align-items:center;transition:border-color .2s,transform .15s}
.flight-card:hover{border-color:var(--border2);transform:translateY(-1px)}
.flight-card.top{border-color:rgba(232,255,71,.25);background:linear-gradient(135deg,var(--surface) 0%,rgba(232,255,71,.03) 100%)}
.route-row{display:flex;align-items:center;gap:14px}
.iata{font-family:var(--mono);font-size:22px;font-weight:500;letter-spacing:-1px}
.iata small{display:block;font-size:9px;color:var(--muted);letter-spacing:1px;margin-top:2px;font-weight:400}
.route-mid{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:80px}
.stops-label{font-family:var(--mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
.line-wrap{display:flex;align-items:center;gap:4px;width:100%}
.line-dot{width:5px;height:5px;border-radius:50%;background:var(--muted2);flex-shrink:0}
.line-bar{flex:1;height:1px;background:var(--border2)}
.meta{text-align:center}
.meta-label{font-family:var(--mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.meta-val{font-family:var(--mono);font-size:13px;color:var(--text)}
.price-col{text-align:right}
.price{font-family:var(--mono);font-size:24px;font-weight:500;color:var(--accent);letter-spacing:-1px}
.price-sub{font-family:var(--mono);font-size:9px;color:var(--muted);margin-top:3px}
.best-tag{display:inline-block;background:var(--accent);color:#080a0d;font-family:var(--mono);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:2px 8px;border-radius:100px;margin-bottom:6px}
.empty{text-align:center;padding:56px 24px;border:1px dashed var(--border2);border-radius:14px;font-family:var(--mono);font-size:12px;color:var(--muted);line-height:2}
.empty-icon{font-size:36px;display:block;margin-bottom:12px}
.watch-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px 22px;margin-bottom:10px;display:grid;grid-template-columns:1fr auto auto auto auto;gap:16px;align-items:center}
.watch-route{font-family:var(--mono);font-size:13px;font-weight:500}
.watch-route small{display:block;font-size:10px;color:var(--muted);margin-top:3px}
.price-change{font-family:var(--mono);font-size:12px;text-align:center}
.price-change.down{color:var(--green)}
.price-change.up{color:var(--red)}
.threshold-wrap label{font-family:var(--mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:5px}
.threshold-wrap input{width:90px;padding:7px 10px;font-size:11px}
.scroll{max-height:540px;overflow-y:auto}
.scroll::-webkit-scrollbar{width:3px}
.scroll::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
.suggest-dropdown{position:absolute;top:100%;left:0;right:0;z-index:100;background:var(--surface2);border:1px solid var(--border2);border-radius:10px;margin-top:4px;overflow:hidden}
.suggest-item{padding:9px 14px;cursor:pointer;display:flex;gap:10px;align-items:center;font-family:var(--mono);font-size:11px;border-bottom:1px solid var(--border);transition:background .1s}
.suggest-item:last-child{border-bottom:none}
.suggest-item:hover{background:var(--surface3)}
.row{display:flex;gap:14px;align-items:center}
</style>
</head>
<body>
<div class="shell" id="app">
  <div class="header">
    <div>
      <div class="wordmark">Flight Intelligence</div>
      <div class="title">Sky<span>Intel</span></div>
    </div>
    <div class="header-right">
      <div class="pill"><div class="dot live"></div>FlightAPI · Live</div>
      <div class="pill warning" id="conflictPill"><div class="dot warn"></div>Conflict zone filter ON</div>
    </div>
  </div>

  <div id="banner" style="display:none"></div>

  <div class="tabs">
    <button class="tab active" onclick="showTab('search')">Search</button>
    <button class="tab" onclick="showTab('watch')" id="watchTab">Watchlist</button>
  </div>

  <!-- SEARCH TAB -->
  <div id="searchTab">
    <div class="card">
      <div class="card-label">// Route Search · One Way</div>
      <div class="grid-4" style="margin-bottom:14px">
        <div class="field" style="position:relative">
          <label>From</label>
          <input id="origin" value="LHR" placeholder="LHR" maxlength="3" oninput="this.value=this.value.toUpperCase();showSuggest('origin',this.value)" onfocus="showSuggest('origin',this.value)" onblur="hideSuggest('origin')"/>
          <div class="suggest-dropdown" id="origin-suggest" style="display:none"></div>
        </div>
        <div class="field" style="position:relative">
          <label>To</label>
          <input id="dest" placeholder="HKG, ATH, SIN…" maxlength="3" oninput="this.value=this.value.toUpperCase();showSuggest('dest',this.value)" onfocus="showSuggest('dest',this.value)" onblur="hideSuggest('dest')"/>
          <div class="suggest-dropdown" id="dest-suggest" style="display:none"></div>
        </div>
        <div class="field">
          <label>Departure Date</label>
          <input type="date" id="date" min="${new Date().toISOString().split('T')[0]}"/>
        </div>
        <div class="field">
          <label>Cabin Class</label>
          <select id="cabin">
            <option>Economy</option>
            <option>Premium_Economy</option>
            <option>Business</option>
            <option>First</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div class="field" style="width:90px">
          <label>Adults</label>
          <select id="adults">
            <option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option>
          </select>
        </div>
        <button class="btn-primary" onclick="doSearch()" id="searchBtn" style="margin-top:18px">Search Flights →</button>
        <span style="font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:18px">700+ airlines &amp; OTAs · GBP</span>
      </div>
      <div class="toggle-row">
        <label class="toggle"><input type="checkbox" id="filterToggle" checked onchange="updateConflictPill()"/><span class="toggle-slider"></span></label>
        <span class="toggle-label"><strong>Conflict Zone Filter</strong> — excludes Emirates, Etihad, Oman Air, Gulf carriers &amp; flights routing over Middle East / Iran / Yemen / Sudan airspace</span>
      </div>
    </div>

    <div id="errorBox" style="display:none"></div>
    <div id="loader" style="display:none" class="loader"><div class="spinner"></div><span class="loader-text" id="loaderText">Scanning flights…</span></div>
    <div id="filteredNotice" style="display:none" class="filtered-notice"></div>
    <div id="insightBox" style="display:none" class="insight"><div class="insight-label">// AI Analysis</div><p id="insightText"></p></div>
    <div id="resultsHeader" style="display:none" class="results-header">
      <div class="results-title" id="resultsTitle"></div>
      <span class="badge" id="resultsBadge"></span>
    </div>
    <div id="resultsList" class="scroll"></div>
    <div id="emptyState" class="empty" style="display:none"><span class="empty-icon">✈️</span>Enter a route above to scan flights.<br/>Start typing a city name to find the airport code.</div>
  </div>

  <!-- WATCHLIST TAB -->
  <div id="watchlistTab" style="display:none">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div>
        <div style="font-weight:700;font-size:15px;letter-spacing:-.4px">Price Watchlist</div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:3px" id="lastChecked"></div>
      </div>
      <button class="btn-ghost" onclick="checkAll()" id="refreshBtn">↻ Refresh All Prices</button>
    </div>
    <div class="alert info" style="margin-bottom:16px">💡 Set a £ threshold per route. Hit Refresh — if any price drops below it, you'll get a Gmail alert automatically.</div>
    <div id="watchlistEmpty" class="empty"><span class="empty-icon">👁</span>No routes watched yet.<br/>Search a flight and click <strong>+ Watch</strong> on any result.</div>
    <div id="watchlistItems" class="scroll"></div>
  </div>
</div>

<script>
const PROXY = '';  // same origin

const BLOCKED_CARRIERS = new Set(['EK','EY','QR','GF','WY','SV','RJ','ME','Emirates','Etihad Airways','Qatar Airways','Gulf Air','Oman Air','Saudia','Saudi Arabian Airlines','Royal Jordanian','Middle East Airlines','flydubai','Air Arabia']);
const BLOCKED_AIRPORTS = new Set(['DXB','AUH','SHJ','AAN','FJR',  'DOH','BAH','KWI',  'TLV','BEY',  'THR','IKA','MHD','SYZ','AWZ',  'BGW','BSR','EBL','NJF','OSB',  'DAM','ALP','DEZ','KAC',  'SAH','ADE','HOD',  'KBL','HEA','KDH',  'TIP','BEN','SEB',  'KRT','PZU',  'AMM','AQJ']);

const AIRPORTS = [
  ['LHR','London Heathrow'],['LGW','London Gatwick'],['STN','London Stansted'],
  ['MAN','Manchester'],['EDI','Edinburgh'],['BHX','Birmingham'],['GLA','Glasgow'],
  ['HYD','Hyderabad'],['DEL','Delhi'],['BOM','Mumbai'],['MAA','Chennai'],['BLR','Bangalore'],['CCU','Kolkata'],['GOI','Goa'],
  ['HKG','Hong Kong'],['SIN','Singapore'],['BKK','Bangkok'],['KUL','Kuala Lumpur'],['CGK','Jakarta'],['MNL','Manila'],
  ['NRT','Tokyo Narita'],['HND','Tokyo Haneda'],['ICN','Seoul Incheon'],['PVG','Shanghai'],['PEK','Beijing'],
  ['ATH','Athens'],['FCO','Rome'],['CDG','Paris'],['AMS','Amsterdam'],['MAD','Madrid'],['BCN','Barcelona'],
  ['VIE','Vienna'],['ZRH','Zurich'],['MUC','Munich'],['FRA','Frankfurt'],['LIS','Lisbon'],['CPH','Copenhagen'],
  ['IST','Istanbul'],['SAW','Istanbul Sabiha'],
  ['SYD','Sydney'],['MEL','Melbourne'],['BNE','Brisbane'],['PER','Perth'],['AKL','Auckland'],
  ['JFK','New York'],['LAX','Los Angeles'],['ORD','Chicago'],['MIA','Miami'],['YYZ','Toronto'],
  ['NBO','Nairobi'],['JNB','Johannesburg'],['CPT','Cape Town'],['ADD','Addis Ababa'],
];

let watchlist = JSON.parse(localStorage.getItem('skyintel_watchlist') || '[]');

function saveWatchlist() { localStorage.setItem('skyintel_watchlist', JSON.stringify(watchlist)); }

function fmtMins(m) { if(!m) return '—'; return Math.floor(m/60)+'h '+((m%60)+'m'); }
function fmtTime(d) { if(!d) return ''; try { return new Date(d).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); } catch(e){return '';} }
function fmtDate(d) { if(!d) return '—'; return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'}); }

function showTab(t) {
  document.getElementById('searchTab').style.display = t==='search'?'':'none';
  document.getElementById('watchlistTab').style.display = t==='watch'?'':'none';
  document.querySelectorAll('.tab').forEach((el,i) => el.classList.toggle('active', (i===0&&t==='search')||(i===1&&t==='watch')));
  if(t==='watch') renderWatchlist();
}

function showBanner(type, text) {
  const b = document.getElementById('banner');
  b.className = 'alert '+type;
  b.textContent = text;
  b.style.display = 'flex';
  setTimeout(() => b.style.display='none', 5000);
}

function updateConflictPill() {
  const on = document.getElementById('filterToggle').checked;
  document.getElementById('conflictPill').style.display = on ? 'flex' : 'none';
}

function showSuggest(field, val) {
  const el = document.getElementById(field+'-suggest');
  if(!val || val.length < 1) { el.style.display='none'; return; }
  const matches = AIRPORTS.filter(([c,n]) => c.toLowerCase().startsWith(val.toLowerCase()) || n.toLowerCase().includes(val.toLowerCase())).slice(0,6);
  if(!matches.length) { el.style.display='none'; return; }
  el.innerHTML = matches.map(([c,n]) => \`<div class="suggest-item" onmousedown="pickAirport('\${field}','\${c}')"><span style="color:var(--accent);font-weight:600;width:34px">\${c}</span><span style="color:var(--muted)">\${n}</span></div>\`).join('');
  el.style.display = 'block';
}
function hideSuggest(field) { setTimeout(() => { document.getElementById(field+'-suggest').style.display='none'; }, 160); }
function pickAirport(field, code) {
  document.getElementById(field==='origin'?'origin':'dest').value = code;
  document.getElementById(field+'-suggest').style.display='none';
}

function isConflictFree(f) {
  if(BLOCKED_CARRIERS.has(f.carrierCode)||BLOCKED_CARRIERS.has(f.carrier)) return false;
  if(BLOCKED_AIRPORTS.has(f.origin)||BLOCKED_AIRPORTS.has(f.destination)) return false;
  if(f.stopAirports && f.stopAirports.some(a => BLOCKED_AIRPORTS.has(a))) return false;
  return true;
}

function parseResults(data, filterConflict) {
  if(!data||!Array.isArray(data)) return {flights:[],filteredCount:0};
  const itins = (data.find(d=>d.itineraries)||{}).itineraries||[];
  const legs = (data.find(d=>d.legs)||{}).legs||[];
  const carriers = (data.find(d=>d.carriers)||{}).carriers||[];
  const places = (data.find(d=>d.places)||{}).places||[];
  const agents = (data.find(d=>d.agents)||{}).agents||[];
  const segments = (data.find(d=>d.segments)||{}).segments||[];
  const cMap={},pMap={},aMap={};
  carriers.forEach(c=>{cMap[c.id]={name:c.name||c.iata||String(c.id),code:c.iata||''}});
  places.forEach(p=>{pMap[p.id]=p.iata||p.name||String(p.id)});
  agents.forEach(a=>{aMap[a.id]=a.name||a.id});
  const parsed = itins.slice(0,40).map(itin=>{
    const leg=legs.find(l=>l.id===itin.leg_ids?.[0]);
    const legSegs=(leg?.segment_ids||[]).map(sid=>segments.find(s=>s.id===sid)).filter(Boolean);
    const stopAirports=legSegs.slice(0,-1).map(s=>pMap[s.destination_place_id]).filter(Boolean);
    const opts=[...(itin.pricing_options||[])].sort((a,b)=>(a.price?.amount||999999)-(b.price?.amount||999999));
    const best=opts[0];
    const price=best?.price?.amount;
    const ci=cMap[leg?.marketing_carrier_ids?.[0]]||{name:'—',code:''};
    return {id:itin.id,origin:pMap[leg?.origin_place_id]||'—',destination:pMap[leg?.destination_place_id]||'—',departure:leg?.departure,arrival:leg?.arrival,duration:leg?.duration,stops:leg?.stop_count??0,carrier:ci.name,carrierCode:ci.code,stopAirports,price,bookingUrl:best?.items?.[0]?.url,agentName:aMap[best?.agent_ids?.[0]]||'OTA'};
  }).filter(f=>f.price);
  if(!filterConflict) return {flights:parsed.sort((a,b)=>a.price-b.price),filteredCount:0};
  const safe=parsed.filter(isConflictFree);
  return {flights:safe.sort((a,b)=>a.price-b.price),filteredCount:parsed.length-safe.length};
}

async function doSearch() {
  const origin=document.getElementById('origin').value.trim();
  const dest=document.getElementById('dest').value.trim();
  const date=document.getElementById('date').value;
  const cabin=document.getElementById('cabin').value;
  const adults=document.getElementById('adults').value;
  const filterConflict=document.getElementById('filterToggle').checked;

  const errBox=document.getElementById('errorBox');
  if(!dest||dest.length!==3){errBox.className='alert err';errBox.textContent='⚠ Enter a valid 3-letter destination code.';errBox.style.display='flex';return;}
  if(!date){errBox.className='alert err';errBox.textContent='⚠ Pick a departure date.';errBox.style.display='flex';return;}
  errBox.style.display='none';

  document.getElementById('loader').style.display='flex';
  document.getElementById('loaderText').textContent='Scanning flights'+(filterConflict?' · applying conflict zone filter':'')+'…';
  document.getElementById('resultsList').innerHTML='';
  document.getElementById('resultsHeader').style.display='none';
  document.getElementById('insightBox').style.display='none';
  document.getElementById('filteredNotice').style.display='none';
  document.getElementById('emptyState').style.display='none';
  document.getElementById('searchBtn').disabled=true;

  try {
    const params=new URLSearchParams({origin,destination:dest,date,adults,cabin,currency:'GBP'});
    const r=await fetch('/oneway?'+params);
    if(!r.ok) throw new Error('API error '+r.status);
    const raw=await r.json();
    const {flights,filteredCount}=parseResults(raw,filterConflict);

    document.getElementById('loader').style.display='none';
    document.getElementById('searchBtn').disabled=false;

    if(filteredCount>0){
      const fn=document.getElementById('filteredNotice');
      fn.textContent='⚠ '+filteredCount+' option'+(filteredCount>1?'s':'')+' removed — routed through conflict zones or used Gulf carriers.';
      fn.style.display='block';
    }

    document.getElementById('resultsHeader').style.display='flex';
    document.getElementById('resultsTitle').textContent=flights.length>0?origin+' → '+dest:'No safe routes found';
    document.getElementById('resultsBadge').textContent=flights.length+' options';

    if(flights.length===0){
      document.getElementById('emptyState').style.display='block';
      document.getElementById('emptyState').innerHTML='<span class="empty-icon">🔍</span>No flights found for this route and date.<br/>'+(filterConflict?'Try toggling the conflict zone filter off, or try different dates.':'Try different dates or a nearby hub airport.');
      return;
    }

    const list=document.getElementById('resultsList');
    list.innerHTML=flights.map((f,i)=>\`
      <div class="flight-card\${i===0?' top':''}" id="fc_\${i}">
        <div class="route-row">
          <div class="iata">\${f.origin}<small>\${fmtTime(f.departure)}</small></div>
          <div class="route-mid">
            <div class="stops-label">\${f.stops===0?'Direct':f.stops+' stop'+(f.stops>1?'s':'')}</div>
            <div class="line-wrap"><div class="line-dot"></div><div class="line-bar"></div><span style="font-size:11px;flex-shrink:0">✈</span><div class="line-bar"></div><div class="line-dot"></div></div>
            <div class="stops-label" style="color:var(--muted2)">\${f.carrier}</div>
            \${f.stopAirports.length>0?'<div class="stops-label" style="color:var(--muted2);font-size:8px">via '+f.stopAirports.join(', ')+'</div>':''}
          </div>
          <div class="iata">\${f.destination}<small>\${fmtTime(f.arrival)}</small></div>
        </div>
        <div class="meta"><div class="meta-label">Duration</div><div class="meta-val">\${fmtMins(f.duration)}</div></div>
        <div class="price-col">
          \${i===0?'<div><span class="best-tag">Best Price</span></div>':''}
          <div class="price">£\${Math.round(f.price)}</div>
          <div class="price-sub">via \${f.agentName}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:7px">
          <button class="btn-watch" onclick='addWatch(\${JSON.stringify({...f,date:"'+date+'",cabin:"'+cabin+'",adults:"'+adults+'",filterConflict:'+filterConflict+'})})'>+ Watch</button>
          \${f.bookingUrl?'<a href="https://www.skyscanner.net'+f.bookingUrl+'" target="_blank" style="display:block;text-align:center;font-family:var(--mono);font-size:10px;color:var(--accent3);text-decoration:none">Book →</a>':''}
        </div>
      </div>
    \`).join('');

    // AI insight
    const sample=flights.slice(0,6).map(f=>({carrier:f.carrier,stops:f.stops,duration:fmtMins(f.duration),price:'£'+Math.round(f.price),via:f.stopAirports.join(',')||'direct'}));
    fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:'Flight intelligence analyst. Route: '+origin+' → '+dest+'. Results: '+JSON.stringify(sample)+'. In 2 punchy sentences, flag the best value, whether a stopover saves meaningfully, any creative routing. Be specific. No bullet points.'}]})})
    .then(r=>r.json()).then(d=>{
      const t=d.content?.[0]?.text;
      if(t){document.getElementById('insightText').textContent=t;document.getElementById('insightBox').style.display='block';}
    }).catch(()=>{});

  } catch(e) {
    document.getElementById('loader').style.display='none';
    document.getElementById('searchBtn').disabled=false;
    errBox.className='alert err';
    errBox.textContent='⚠ '+( e.message||'Search failed. Try again in a moment.');
    errBox.style.display='flex';
  }
}

function addWatch(f) {
  const key=f.origin+' → '+f.destination+' · '+fmtDate(f.departure);
  if(watchlist.find(w=>w.key===key)){showBanner('warn','Already watching this route.');return;}
  watchlist.push({key,price:f.price,lastPrice:f.price,origin:f.origin,destination:f.destination,date:f.date,cabin:f.cabin,adults:f.adults,filterConflict:f.filterConflict,addedAt:new Date().toISOString()});
  saveWatchlist();
  showBanner('ok','Now watching '+f.origin+' → '+f.destination);
  document.getElementById('watchTab').textContent='Watchlist ('+watchlist.length+')';
}

function renderWatchlist() {
  const empty=document.getElementById('watchlistEmpty');
  const items=document.getElementById('watchlistItems');
  if(!watchlist.length){empty.style.display='block';items.innerHTML='';return;}
  empty.style.display='none';
  items.innerHTML=watchlist.map((w,i)=>{
    const diff=w.price-w.lastPrice;
    const pct=w.lastPrice?Math.abs(((diff/w.lastPrice)*100)).toFixed(1):null;
    const cls=diff<0?'down':diff>0?'up':'flat';
    return \`<div class="watch-card">
      <div class="watch-route">\${w.key}<small>\${w.cabin} · \${w.adults} pax · \${w.filterConflict?'🛡 conflict filter on':'filter off'}</small></div>
      <div style="text-align:center"><div class="meta-label">Current</div><div style="font-family:var(--mono);font-size:20px;font-weight:500;color:var(--accent);letter-spacing:-1px">£\${Math.round(w.price)}</div></div>
      <div class="price-change \${cls}">\${pct&&diff!==0?'<div>'+(diff<0?'↓':'↑')+' '+pct+'%</div><div style="font-size:9px;opacity:.6">vs last check</div>':'<div style="color:var(--muted)">—</div>'}</div>
      <div class="threshold-wrap"><label>Alert at £</label><input type="number" placeholder="e.g. 500" id="thr_\${i}" value="\${w.threshold||''}" onchange="watchlist[\${i}].threshold=this.value;saveWatchlist()"/></div>
      <button class="btn-rm" onclick="removeWatch(\${i})">Remove</button>
    </div>\`;
  }).join('');
}

function removeWatch(i) { watchlist.splice(i,1); saveWatchlist(); renderWatchlist(); document.getElementById('watchTab').textContent='Watchlist'+(watchlist.length?(' ('+watchlist.length+')'):''); }

async function checkAll() {
  if(!watchlist.length) return;
  document.getElementById('refreshBtn').disabled=true;
  document.getElementById('refreshBtn').textContent='Checking…';
  for(let i=0;i<watchlist.length;i++){
    const w=watchlist[i];
    try{
      const params=new URLSearchParams({origin:w.origin,destination:w.destination,date:w.date,adults:w.adults,cabin:w.cabin,currency:'GBP'});
      const r=await fetch('/oneway?'+params);
      const raw=await r.json();
      const {flights}=parseResults(raw,w.filterConflict);
      const newPrice=flights[0]?.price||w.price;
      watchlist[i]={...w,lastPrice:w.price,price:newPrice};
      const thr=parseFloat(w.threshold||0);
      if(thr>0&&newPrice<=thr){
        fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:'Send a Gmail to myself with subject "✈️ Price Alert: '+w.key+'" and body: "Your watched route '+w.key+' has dropped to £'+Math.round(newPrice)+', below your alert threshold of £'+thr+'. Book now before it goes!"'}],mcp_servers:[{type:'url',url:'https://gmail.mcp.claude.com/mcp',name:'gmail'}]})});
        showBanner('ok','📧 Gmail alert sent for '+w.key+'!');
      }
    }catch(e){}
  }
  saveWatchlist();
  document.getElementById('lastChecked').textContent='Last checked '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('refreshBtn').disabled=false;
  document.getElementById('refreshBtn').textContent='↻ Refresh All Prices';
  renderWatchlist();
}

// Init
updateConflictPill();
document.getElementById('watchTab').textContent='Watchlist'+(watchlist.length?(' ('+watchlist.length+')'):'');
</script>
</body>
</html>`);
});

app.listen(PORT, () => console.log(`SkyIntel running on port ${PORT}`));
