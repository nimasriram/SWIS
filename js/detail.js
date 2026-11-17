// Ticket detail drawer: everything linked to one ticket number.
let detailId = null, detailFresh = false;

function openDetail(id) {
  if (!find(id)) return;
  detailId = id; sel = id; detailFresh = true;
  $("drawer").classList.add("on");
  focusTicket(id); render();
}
function closeDetail() { detailId = null; sel = null; $("drawer").classList.remove("on"); render(); }

const row = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;

function floorDiagram(t) {
  const f = t.fl, b = B[t.b], low = Math.max(1, b.g - 1);
  let r = "";
  for (let L = b.top; L >= low; L--) {
    const p = f.levels.find(x => x.level === L).p, lead = L === f.level;
    r += `<div class="fl-row ${lead ? "lead" : ""}" style="--p:${p.toFixed(3)}"><span class="fl-n">L${L}</span>
      <span class="fl-slab"></span><span class="fl-bar"><i></i></span><span class="fl-p">${p >= .01 ? pct(p) + "%" : "–"}</span>
      ${L === b.g ? `<span class="fl-ent">entrance</span>` : ""}</div>`;
  }
  return `<div class="fl">${r}</div>`;
}

function paintDetail() {
  const t = find(detailId), d = $("drawer");
  if (!t) { closeDetail(); return; }
  const fresh = detailFresh; detailFresh = false;
  const sc = $("dbody") ? $("dbody").scrollTop : 0;
  const act = isActive(t);

  let loc;
  if (t.type === "indoor") {
    const f = t.fl;
    loc = `<div class="loc-main">${B[t.b].n}</div>
      <div class="fl-wrap ${fresh ? "enter" : ""}">${floorDiagram(t)}
        <div class="fl-side"><small>Floor estimate</small><div class="fl-big">${floorHead(t)}</div>
          <div class="chip conf-${f.confLabel}">${floorConf(t)}</div>
          <p class="hint">Phone barometer vs. the live campus weather reference, ±${f.sigma} m noise. Bars show the chance of each level.</p></div></div>`;
  } else {
    loc = `<div class="loc-main">${t.label}</div>
      ${row("Position source", "GPS, snapped to nearest path")}${row("GPS accuracy", "±" + t.gpsAcc + " m")}${row("Snapped by", t.snapM.toFixed(0) + " m")}
      <p class="hint">Outdoors, so no floor estimate is needed.</p>`;
  }
  const sensor = t.type === "indoor"
    ? row("Raw pressure", t.raw.toFixed(2) + " hPa") + row("Weather reference", t.ref.toFixed(2) + " hPa") + row("Entrance baseline", t.entr.toFixed(2) + " hPa") +
      row("Drift vs. reference", (t.fl.drift >= 0 ? "+" : "") + t.fl.drift.toFixed(2) + " hPa") + row("Height above entrance", t.fl.h.toFixed(1) + " m") + row("Assumed storey height", CONFIG.FLOOR_HEIGHT_M + " m")
    : row("Raw pressure", t.raw.toFixed(2) + " hPa") + row("Weather reference", t.ref.toFixed(2) + " hPa");
  const tl = t.log.slice().sort((a, b) => a.ts - b.ts).map(l => `<li class="tl-${l.ev}"><i></i><div><b>${l.text}</b><span>${clock(l.ts)} · +${dur(l.ts - t.ts)}</span></div></li>`).join("");

  d.innerHTML = `
    <div class="d-head">${badge(t.kind, 26)}<div class="d-title"><small>TICKET</small><h3>${t.id}</h3></div>
      <span class="pill ${act ? "p-act" : "p-res"}">${act ? "ACTIVE" : "RESOLVED"}</span>
      <button class="x" type="button" data-close aria-label="Close ticket">✕</button></div>
    <div class="d-body" id="dbody">
      <div class="d-hero"><div><small>${act ? "Elapsed since SOS" : "Time to resolve"}</small><div class="big ${act ? "live" : ""}" data-el="${t.id}">${dur((t.resTs || Date.now()) - t.ts)}</div></div>
        <div class="hero-r">${tag(t.kind)}<span>SOS pressed ${clock(t.ts)}</span><span>${t.ackTs ? "Acknowledged in " + dur(t.ackTs - t.ts) : "<b class='warn'>Not acknowledged</b>"}</span></div></div>
      <section class="ds"><h4>Location</h4>${loc}</section>
      <section class="ds"><h4>Sensor data</h4>${sensor}</section>
      <section class="ds"><h4>Reporter</h4>${row("User ID", t.user)}${row("Category (in app)", TYPES[t.kind].full)}${row("Phone battery", t.bat + "%")}${row("Connection", t.net)}${row("Note (simulated)", t.note)}</section>
      <section class="ds"><h4>Timeline</h4><ol class="tl">${tl}</ol></section>
      <section class="ds future"><h4>Planned integration</h4><b>Responder dispatch &amp; live tracking</b><p class="hint">Show responder units en route to this ticket, with ETA.</p></section>
      <a class="ext" href="https://map.utdallas.edu/" target="_blank" rel="noopener">Open UTD campus map ↗</a>
    </div>
    <div class="d-foot">
      ${act && !t.ackTs ? `<button class="btn" type="button" data-ack="${t.id}">Acknowledge</button>` : ""}
      ${act ? `<button class="btn res" type="button" data-res="${t.id}">Mark resolved</button>` : `<div class="resdone">✓ Resolved ${clock(t.resTs)}</div>`}
    </div>`;
  $("dbody").scrollTop = sc;
}
