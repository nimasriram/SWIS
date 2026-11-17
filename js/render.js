// Drawing: event feed, active-emergency cards, footer stats, legend, live timers. (Map drawing lives in map.js.)
const ICON = (k, px = 18) => `<svg class="ico" width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true"><path d="${TYPES[k].glyph}" fill="currentColor"/></svg>`;
const badge = (k, px = 20) => `<span class="tbadge t-${k}">${ICON(k, px)}</span>`;
const tag = k => `<span class="tag t-${k}">${TYPES[k].name}</span>`;
const pct = p => Math.round(p * 100);

// Floor wording shared by cards, alert, map chip and detail view.
const floorPair = t => t.fl.top.slice(0, 2).sort((a, b) => a.level - b.level);
function floorHead(t) {
  if (t.type !== "indoor") return "Outdoor";
  const [a, b] = floorPair(t);
  return t.fl.ambiguous ? `Likely Level ${a.level} or ${b.level}` : `Level ${t.fl.level}`;
}
function floorShort(t) { const [a, b] = floorPair(t); return t.fl.ambiguous ? `L${a.level}/${b.level}` : `L${t.fl.level}`; }
function floorConf(t) {
  if (t.type !== "indoor") return `GPS ±${t.gpsAcc} m`;
  const [a, b] = floorPair(t);
  return t.fl.ambiguous ? `${t.fl.confLabel} confidence · ${pct(a.p)}% / ${pct(b.p)}%` : `${t.fl.confLabel} confidence · ${pct(t.fl.conf)}%`;
}
const confChip = t => t.type === "indoor" ? `<span class="chip conf-${t.fl.confLabel}">${floorConf(t)}</span>` : `<span class="chip">${floorConf(t)}</span>`;

let lastA = -1, lastR = -1;
function render() {
  const act = E.filter(isActive).sort((a, b) => (!!a.ackTs - !!b.ackTs) || b.ts - a.ts);   // unacknowledged first
  const nA = act.length, nR = E.length - nA;

  // footer stats (+ a little bump when a number changes)
  $("nA").textContent = nA; $("nA2").textContent = nA; $("nR").textContent = nR;
  if (lastA >= 0 && nA !== lastA) bump("nA"); if (lastR >= 0 && nR !== lastR) bump("nR");
  lastA = nA; lastR = nR;

  // live event feed (newest first)
  const items = E.flatMap(t => t.log.map(l => ({ ...l, t }))).sort((a, b) => b.ts - a.ts).slice(0, 40);
  const LBL = { sos: "SOS", ack: "ACK", res: "RESOLVED" };
  $("feed").innerHTML = items.map(l => `<div class="ev ${Date.now() - l.ts < 1500 ? "fresh" : ""}" data-open="${l.t.id}">
    <span class="ev-ic t-${l.t.kind}">${ICON(l.t.kind, 18)}</span>
    <div class="ev-b"><div class="ev-h"><span class="pill p-${l.ev}">${LBL[l.ev]}</span><b>${l.t.id}</b><span class="ago" data-ago="${l.ts}">${ago(l.ts)}</span></div>
    <div class="ev-t">${l.text}</div></div></div>`).join("");

  // active emergencies (collapsible)
  $("cards").innerHTML = act.length ? act.map(t => `<div class="card ${sel === t.id ? "sel" : ""} ${t.ackTs ? "" : "new"}" data-open="${t.id}">
    <div class="c-top">${badge(t.kind, 22)}<div class="c-id"><b>${t.id}</b>${tag(t.kind)}${t.ackTs ? "" : `<span class="pill p-sos">NEW</span>`}</div><span class="el" data-el="${t.id}">${dur(Date.now() - t.ts)}</span></div>
    <div class="c-loc">${t.label}</div>
    <div class="c-row">${confChip(t)}<span class="m">User ${t.user}</span></div>
    <button class="stbtn" type="button" data-res="${t.id}"><i></i>Active — click to resolve</button></div>`).join("")
    : `<div class="empty">No active emergencies.<br><small>New SOS tickets appear here.</small></div>`;

  renderMap();
  if (typeof detailId !== "undefined" && detailId) paintDetail();
}
function bump(id) { const n = $(id); n.classList.remove("bump"); void n.offsetWidth; n.classList.add("bump"); }

function toast(msg) { const n = $("toast"); n.textContent = msg; n.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => n.classList.remove("on"), 2600); }

// Called once a second: elapsed-since-SOS timers, relative times, header clock.
function tick() {
  const now = Date.now();
  $("clock").textContent = new Date(now).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" });
  document.querySelectorAll("[data-el]").forEach(n => { const t = find(n.dataset.el); if (t) n.textContent = dur((t.resTs || now) - t.ts); });
  document.querySelectorAll("[data-ago]").forEach(n => { n.textContent = ago(+n.dataset.ago); });
}

function renderLegend() {
  $("legend").innerHTML = Object.keys(TYPES).map(k => `<span class="lg t-${k}">${ICON(k, 16)}${TYPES[k].name}</span>`).join("")
    + `<span class="lg"><i class="dot" style="background:var(--rd)"></i>Active</span><span class="lg"><i class="dot" style="background:var(--gn)"></i>Resolved</span>`;
}
