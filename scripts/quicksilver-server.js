const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const intentsPath = path.join(__dirname, "..", "quicksilver", "intents.json");
const intents = JSON.parse(fs.readFileSync(intentsPath, "utf8")).intents;

function extractSlots(msg) {
  const res = {};
  const nMatch = msg.match(/last\s+(\d+)\s+readings/i);
  if (nMatch) res.n = nMatch[1];
  const devMatch = msg.match(/device\s+([\w-]+)/i) || msg.match(/from\s+([\w-]+)/i);
  if (devMatch) res.deviceId = devMatch[1];
  return res;
}

function chooseIntent(msg) {
  const m = msg.toLowerCase();
  if (/last\s+\d+\s+readings/.test(m) || /history/.test(m)) {
    return intents.find(i => i.name === "get_last_n_readings");
  }
  if (/latest|current/.test(m)) {
    return intents.find(i => i.name === "get_latest_temperature");
  }
  return intents.find(i => i.name === "get_latest_temperature");
}

function fill(template, ctx) {
  return template.replace(/\{\{([^}|]+)\|?([^}]*)\}\}/g, (_, key, def) => (ctx[key] ?? def ?? ""));
}

async function callAction(action, slots) {
  const url = new URL(action.url);
  const params = action.query || {};
  for (const [k, v] of Object.entries(params)) {
    const val = v.replace(/\{\{([^}|]+)\|?([^}]*)\}\}/g, (_, key, def) => slots[key] ?? def ?? "");
    url.searchParams.set(k, val);
  }
  const resp = await fetch(url, { method: action.method || "GET" });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
  <html><head><meta charset=utf-8><title>QuickSilver Prototype</title>
  <style>
    body{font:14px sans-serif;margin:20px}
    #out{border:1px solid #ddd;padding:10px;height:240px;overflow:auto;margin-bottom:10px}
    #panel{display:flex;gap:8px;margin-bottom:8px}
    #stats{border:1px solid #eee;padding:8px;margin-top:8px}
    .item{border-bottom:1px dashed #eee;padding:4px 0}
    .muted{color:#777}
  </style>
  </head><body>
  <h3>QuickSilver Prototype</h3>
  <div id="out"></div>
  <div id="panel">
    <input id="msg" placeholder="Ask: latest temperature or last 5 readings from device sensor-1" style="flex:1"/>
    <button onclick="send()">Send</button>
  </div>
  <div id="stats" class="muted">Summary will appear here when asking for last N readings.</div>
  <script>
  async function send(){
    const msg = document.getElementById('msg').value;
    const r = await fetch('/ask', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ msg })});
    const data = await r.json();
    const out = document.getElementById('out');
    out.innerHTML += '<div><b>You:</b> '+ msg +'</div>';
    out.innerHTML += '<div><b>Bot:</b> '+ data.text +'</div>';
    out.scrollTop = out.scrollHeight;
    // Render readings & summary if present
    const stats = document.getElementById('stats');
    if (data.data && Array.isArray(data.data.readings)) {
      const list = data.data.readings.map(r => {
        return '<div class="item"><span class="muted">'+ new Date(r.ts*1000).toLocaleString() +'</span> — '+ r.reading +'</div>'
      }).join('');
      let s = ''; const sum = data.data.summary;
      if (sum) {
        const t = sum.temp; const h = sum.humidity;
        s = '<div><b>Summary:</b> ' +
            (t ? 'Temp min='+t.min.toFixed(2)+', max='+t.max.toFixed(2)+', avg='+t.avg.toFixed(2) : 'Temp n/a') +
            ' | ' +
            (h ? 'Humidity min='+h.min.toFixed(2)+', max='+h.max.toFixed(2)+', avg='+h.avg.toFixed(2) : 'Humidity n/a') +
            '</div>';
      }
      stats.innerHTML = s + '<div style="max-height:200px;overflow:auto;margin-top:6px">'+ list +'</div>';
    }
  }
  </script>
  </body></html>`);
});

app.post("/ask", async (req, res) => {
  try {
    const { msg } = req.body || {};
    const slots = extractSlots(msg || "");
    const intent = chooseIntent(msg || "");
    const data = await callAction(intent.action, slots);
    const ctx = { ...slots, ...data };
    const text = fill(intent.responseTemplate || "OK", ctx);
    res.json({ text, data });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

const port = process.env.QS_PORT || 8799;
app.listen(port, () => console.log(`QuickSilver server on :${port}`));
