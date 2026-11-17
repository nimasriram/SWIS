// App state: tickets (E), selection, mock emergency generator, demo seed data, ack/resolve actions.
// Every SOS creates ONE ticket (E[]). Location, sensor data, timeline and status all hang off that ticket.
let E = [], sel = null;
const $ = id => document.getElementById(id);
const find = id => E.find(t => t.id === id);
const isActive = t => t.status === "active";
const rnd = a => a[Math.floor(Math.random() * a.length)];
const wref = () => 1009.2 + Math.sin(Date.now() / 60000) * .3;   // simulated weather-station feed (hPa)
const pad = n => String(n).padStart(2, "0");
const clock = t => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
const dur = ms => { ms = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(ms / 3600), m = Math.floor(ms % 3600 / 60), s = ms % 60; return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`; };
const ago = t => { const s = Math.floor((Date.now() - t) / 1000); if (s < 5) return "just now"; if (s < 60) return s + " s ago"; const m = Math.floor(s / 60); return m < 60 ? m + " min ago" : Math.floor(m / 60) + " h ago"; };

// Ticket numbers (the real system will issue these server-side).
const nextId = () => "UMER-" + (E.reduce((a, t) => Math.max(a, +t.id.slice(5) || 0), 1040) + 1);
const addLog = (t, ev, text, ts = Date.now()) => t.log.push({ ts, ev, text });

const NOTES = {
  medical: ["Chest pain, conscious", "Person collapsed, responsive", "Severe allergic reaction"],
  fire: ["Smoke visible near stairwell", "Fire alarm sounding, smell of burning"],
  safety: ["Feels followed by a stranger", "Requesting a security escort"],
};

// Spec: {kind,user, b,floor,off}  (indoor)  or  {kind,user, x,y}  (outdoor).  off = metres above the floor slab.
function mkTicket(s) {
  const ref = wref(), entr = ref + 0.15, ts = s.ts || Date.now();
  const t = {
    id: nextId(), user: s.user, kind: s.kind, ts, status: "active", ackTs: null, resTs: null, ref, entr,
    bat: 28 + Math.floor(Math.random() * 65), net: rnd(["Campus Wi-Fi", "Strong LTE", "Fair LTE"]),
    note: rnd(NOTES[s.kind]), log: [],
  };
  if (s.b) {
    const b = B[s.b], jit = () => (Math.random() - .5) * b.w * .45;
    t.type = "indoor"; t.b = s.b;
    t.raw = +pressureAt((s.floor - b.g) * CONFIG.FLOOR_HEIGHT_M + (s.off ?? .4), entr).toFixed(2);
    t.fl = floorFromPressure(t.raw, ref, entr, s.b);
    t.x = b.x + b.w / 2 + jit(); t.y = b.y + b.h / 2 + jit() * .5;
    t.ll = b.ll || toLL(t.x, t.y);
    t.label = `${b.n} · ${floorHead(t)}`;
  } else {
    const p = snap(s.x, s.y);
    t.type = "outdoor"; t.raw = +entr.toFixed(2);
    t.x = p.x; t.y = p.y; t.ll = toLL(p.x, p.y);
    t.snapM = p.d * 1.25; t.gpsAcc = 4 + Math.floor(Math.random() * 8);
    t.label = "Outdoors near " + nearestBuilding(p.x, p.y).n;
  }
  addLog(t, "sos", "SOS button pressed · " + t.label, ts);
  return t;
}

function seed() {
  E = []; sel = null; const now = Date.now();
  [ { kind: "safety",  user: "u-7730", b: "SU",   floor: 2, age: 560, ack: 12, res: 371 },
    { kind: "medical", user: "u-1093", b: "GR",   floor: 1, age: 410, ack: 9 },
    { kind: "fire",    user: "u-4821", b: "ECSW", floor: 4, age: 250, ack: 14 },
    { kind: "safety",  user: "u-3318", x: 458, y: 322, age: 150, ack: 7 },
    { kind: "medical", user: "u-2256", b: "MC",   floor: 3, off: 1.45, age: 80, ack: 5 },   // lands between Level 3 and 4
  ].forEach(d => {
    const ts = now - d.age * 1000, t = mkTicket({ ...d, ts });
    t.ackTs = ts + d.ack * 1000; addLog(t, "ack", "Acknowledged by dispatcher", t.ackTs);
    if (d.res) { t.status = "resolved"; t.resTs = ts + d.res * 1000; addLog(t, "res", "Resolved after " + dur(d.res * 1000), t.resTs); }
    E.push(t);
  });
}

const POOL = [["SLC", 2], ["SU", 1], ["JSOM", 3], ["SSA", 2], ["MC", 2], ["ECSW", 4], ["GR", 2]];
function simulate() {
  const kind = rnd(["medical", "medical", "fire", "safety", "safety"]), user = "u-" + (1000 + Math.floor(Math.random() * 8999));
  let t;
  if (Math.random() < .25) { const s = rnd(OUTDOOR_SPOTS); t = mkTicket({ kind, user, x: s[0] + (Math.random() - .5) * 20, y: s[1] }); }
  else { const p = rnd(POOL); t = mkTicket({ kind, user, b: p[0], floor: p[1], off: Math.random() < .5 ? 1.2 + Math.random() * .4 : .3 + Math.random() * .5 }); }
  E.push(t); send({ t: "new", e: t }); render(); alertNew(t);
}

function ack(id, ts = Date.now(), remote = false) {
  const t = find(id); if (!t || t.ackTs || !isActive(t)) return;
  t.ackTs = ts; addLog(t, "ack", "Acknowledged by dispatcher" + (remote ? " (other console)" : ""), ts);
  if (!remote) send({ t: "ack", id, ts });
  render(); refreshAlert();
}
function resolve(id, ts = Date.now(), remote = false) {
  const t = find(id); if (!t || !isActive(t)) return;
  if (!t.ackTs) { t.ackTs = ts; addLog(t, "ack", "Acknowledged on resolve", ts); }
  t.status = "resolved"; t.resTs = ts; addLog(t, "res", "Resolved after " + dur(ts - t.ts) + (remote ? " (other console)" : ""), ts);
  if (!remote) send({ t: "res", id, ts });
  render(); refreshAlert(); toast(`${t.id} resolved`);
}
