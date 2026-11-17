// Map: Google Maps when a key is set in config.js, otherwise the built-in schematic SVG (works offline).
let gmap = null; const gm = {};
const mapNote = s => { const n = $("mapnote"); if (n) n.textContent = s; };

// Dark Google Maps style (used when the dashboard is in dark mode).
const GM_DARK = [
  { elementType: "geometry", stylers: [{ color: "#16211c" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9fb2a8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0c1511" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a3b32" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#13281d" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1a22" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];
const gStyles = () => (document.documentElement.dataset.theme === "dark" ? GM_DARK : null);
const applyMapTheme = () => { if (gmap) gmap.setOptions({ styles: gStyles() }); };

function initMap() {
  if (!CONFIG.GOOGLE_MAPS_API_KEY) { mapNote("Schematic campus map (demo). Add a Google Maps key in js/config.js for the real map."); return; }
  window.onGMaps = () => {
    $("map").innerHTML = "";
    gmap = new google.maps.Map($("map"), {
      center: CONFIG.CENTER, zoom: CONFIG.ZOOM, styles: gStyles(), clickableIcons: false,
      streetViewControl: false, fullscreenControl: false,
      mapTypeControl: true, mapTypeControlOptions: { mapTypeIds: ["roadmap", "hybrid"] },   // street / satellite
    });
    mapNote(""); renderMap();
  };
  window.gm_authFailure = () => { clearMarkers(); gmap = null; mapNote("Google Maps key rejected; showing schematic."); renderMap(); };
  const s = document.createElement("script");
  s.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&callback=onGMaps`; s.async = true;
  s.onerror = () => { mapNote("Could not load Google Maps; showing schematic."); };
  document.head.appendChild(s);
}
const renderMap = () => (gmap ? drawGoogle() : drawSvg());
function focusTicket(id) { const t = find(id); if (gmap && t) gmap.panTo(t.ll); }
function clearMarkers() { Object.values(gm).forEach(m => m.setMap(null)); for (const k in gm) delete gm[k]; }

// ---- pin artwork, drawn with the pin TIP at (0,0) so it works in both renderers --------------------
const PIN = "M0 0C0 0-15-18-15-27a15 15 0 0 1 30 0C15-18 0 0 0 0z";
function pinArt(t) {
  const c = isActive(t) ? "#d92d20" : "#1c9a4b";
  let s = `<path d="${PIN}" fill="${c}" stroke="#fff" stroke-width="2"/><g transform="translate(-8 -35) scale(.667)"><path d="${TYPES[t.kind].glyph}" fill="#fff"/></g>`;
  if (t.type === "indoor") {
    const txt = floorShort(t), w = txt.length * 7 + 12;
    s += `<rect x="12" y="-46" width="${w}" height="16" rx="8" fill="#0d1411" stroke="#fff" stroke-width="1.2"/><text x="${12 + w / 2}" y="-34.5" font-size="10.5" font-weight="700" fill="#fff" text-anchor="middle" font-family="Roboto,Arial,sans-serif">${txt}</text>`;
  }
  return s;
}
function pinIcon(t) {   // Google Maps marker icon (SVG data URL)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="52" viewBox="0 0 96 52"><g transform="translate(22 48)">${pinArt(t)}</g></svg>`;
  return { url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg), scaledSize: new google.maps.Size(96, 52), anchor: new google.maps.Point(22, 48) };
}

function drawGoogle() {
  E.forEach(t => {
    let m = gm[t.id];
    if (!m) { m = gm[t.id] = new google.maps.Marker({ map: gmap, position: t.ll, title: t.id }); m.addListener("click", () => openDetail(t.id)); }
    m.setIcon(pinIcon(t));
    m.setZIndex(isActive(t) ? 2 : 1);
    m.setAnimation(sel === t.id && isActive(t) ? google.maps.Animation.BOUNCE : null);
  });
  Object.keys(gm).forEach(id => { if (!find(id)) { gm[id].setMap(null); delete gm[id]; } });   // after "Reset demo"
}

function drawSvg() {
  const lawn = [[90, 70, 120, 55], [400, 60, 55, 30], [680, 130, 70, 40], [330, 420, 110, 45], [610, 430, 90, 40], [60, 440, 60, 35]];
  let s = `<rect width="800" height="520" fill="var(--map)"/>`;
  lawn.forEach(l => s += `<ellipse cx="${l[0]}" cy="${l[1]}" rx="${l[2]}" ry="${l[3]}" fill="var(--lawn)"/>`);
  s += `<ellipse cx="365" cy="270" rx="85" ry="26" fill="var(--lawn)"/>`;
  PATHS.forEach(p => { const pts = p.map(q => q.join(",")).join(" ");
    s += `<polyline points="${pts}" stroke="var(--roadln)" stroke-width="14" fill="none" stroke-linecap="round"/><polyline points="${pts}" stroke="var(--road)" stroke-width="10" fill="none" stroke-linecap="round"/>`; });
  for (const k in B) {
    const b = B[k];
    s += `<rect x="${b.x + 3}" y="${b.y + 4}" width="${b.w}" height="${b.h}" rx="6" fill="var(--shadow)"/><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="var(--bldg)" stroke="var(--bldgln)" stroke-width="1.5"/><text x="${b.x + b.w / 2}" y="${b.y + b.h - 8}" text-anchor="middle" font-size="11.5" font-weight="500" fill="var(--mut)">${b.n}</text>`;
  }
  // scale bar + north arrow
  s += `<g transform="translate(24 492)" fill="var(--mut)" font-size="10"><rect width="80" height="3" fill="var(--mut)"/><text y="-5">100 m</text></g><g transform="translate(770 34)" fill="var(--mut)" font-size="11" font-weight="700" text-anchor="middle"><path d="M0-16l6 16-6-4-6 4z"/><text y="14">N</text></g>`;
  const order = E.slice().sort((a, b) => (isActive(a) - isActive(b)) || (a.id === sel) - (b.id === sel));
  order.forEach(t => {
    const act = isActive(t), cy = -27;
    let g = "";
    if (act) g += `<circle class="pulse ${t.ackTs ? "" : "hot"}" cx="0" cy="${cy}" r="14" fill="var(--rd)"/><circle class="pulse d2 ${t.ackTs ? "" : "hot"}" cx="0" cy="${cy}" r="14" fill="var(--rd)"/>`;
    if (t.resTs && Date.now() - t.resTs < 1600) g += `<circle class="ripple" cx="0" cy="${cy}" r="14" fill="none" stroke="var(--gn)" stroke-width="4"/>`;
    if (sel === t.id) g += `<circle cx="0" cy="${cy}" r="23" fill="none" stroke="var(--acc)" stroke-width="3.5"/>`;
    s += `<g data-open="${t.id}" transform="translate(${t.x} ${t.y})" style="cursor:pointer"><title>${t.id}</title>${g}${pinArt(t)}</g>`;
  });
  $("map").innerHTML = `<svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Campus map">${s}</svg>`;
}
