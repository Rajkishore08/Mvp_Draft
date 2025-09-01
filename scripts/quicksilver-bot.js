// Minimal QuickSilver-like CLI bot that maps utterances to intents and calls the IoT API
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
  // default to latest
  return intents.find(i => i.name === "get_latest_temperature");
}

function fill(template, ctx) {
  return template.replace(/\{\{([^}|]+)\|?([^}]*)\}\}/g, (_, key, def) => {
    return (ctx[key] ?? def ?? "");
  });
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

async function runOnce(msg) {
  const intent = chooseIntent(msg);
  const slots = extractSlots(msg);
  const data = await callAction(intent.action, slots);
  const ctx = { ...slots, ...data };
  const tmpl = intent.responseTemplate || "{{deviceId|sensor-1}} => {{reading||n/a}}";
  return fill(tmpl, ctx);
}

async function main() {
  const input = process.argv.slice(2).join(" ") || "what's the latest temperature";
  try {
    const out = await runOnce(input);
    console.log(out);
  } catch (e) {
    console.error("Error:", e.message || e);
    process.exit(1);
  }
}

main();
