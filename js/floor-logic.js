// Barometer maths: pressure -> height -> floor level + confidence, plus GPS snapping to paths
const altitude = (p, ref) => 44330 * (1 - Math.pow(p / ref, 0.1903));          // hypsometric, metres above reference
const pressureAt = (h, ref) => ref * Math.pow(1 - h / 44330, 1 / 0.1903);       // inverse (used by the simulator)

function erf(x) { // Abramowitz-Stegun 7.1.26
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
}
const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));

// Returns the probability of each level (barometer noise = CONFIG.PRESSURE_SIGMA_M metres).
function floorFromPressure(raw, weatherRef, entranceP, bKey) {
  const b = B[bKey], H = CONFIG.FLOOR_HEIGHT_M, sg = CONFIG.PRESSURE_SIGMA_M;
  const h = altitude(raw, entranceP);          // entrance reading is weather-corrected at capture time
  const low = Math.max(1, b.g - 1), levels = [];
  for (let L = low; L <= b.top; L++) {
    const c = (L - b.g) * H;
    const lo = L === low ? 0 : Phi((c - H / 2 - h) / sg);
    const hi = L === b.top ? 1 : Phi((c + H / 2 - h) / sg);
    levels.push({ level: L, p: hi - lo });
  }
  const top = levels.slice().sort((a, c) => c.p - a.p).slice(0, 2);
  const conf = top[0].p;
  return {
    h, drift: raw - weatherRef, sigma: sg, levels, top, level: top[0].level, conf,
    ambiguous: top[1].p >= 0.25,
    confLabel: conf >= 0.8 ? "High" : conf >= 0.55 ? "Medium" : "Low",
  };
}

function snap(x, y) {
  let best = null, bd = 1e9;
  for (const [a, b] of PATHS) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
    const px = a[0] + t * dx, py = a[1] + t * dy, d = Math.hypot(px - x, py - y);
    if (d < bd) { bd = d; best = { x: px, y: py, d }; }
  }
  return best;
}
