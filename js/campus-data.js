// Campus data: buildings (schematic position, entrance level g, top level), walkable paths,
// emergency types, and the schematic -> lat/lng mapping used by Google Maps.
//
// x/y are positions on the 800x520 schematic. Buildings are approximate: for the real map, add an
// accurate `ll: {lat, lng}` to each building (copy it from map.utdallas.edu / Google Maps) and it
// will be used instead of the schematic position.
const B = {
  GR:   { n: "Green Hall",              x: 560, y: 100, w: 110, h: 60, g: 1, top: 4 },
  ECSW: { n: "ECS West",                x: 120, y: 110, w: 120, h: 70, g: 2, top: 5 },
  SLC:  { n: "Science Learning Center", x: 300, y: 110, w: 110, h: 60, g: 2, top: 4 },
  MC:   { n: "McDermott Library",       x: 290, y: 190, w: 130, h: 55, g: 2, top: 5 },
  SU:   { n: "Student Union",           x: 130, y: 300, w: 110, h: 60, g: 2, top: 3 },
  SSA:  { n: "SSA",                     x: 490, y: 345, w: 90,  h: 50, g: 2, top: 4 },
  JSOM: { n: "JSOM",                    x: 620, y: 190, w: 110, h: 55, g: 2, top: 5 },
};
// g = entrance level. UTD convention: basement => entrance is Level 2 (Green Hall: Level 1).
const PATHS = [
  [[60, 270], [760, 270]], [[470, 50], [470, 480]], [[250, 270], [250, 430]],
  [[470, 330], [640, 330]], [[470, 135], [560, 135]],
];
const OUTDOOR_SPOTS = [[300, 270], [470, 200], [250, 350], [560, 330], [690, 270], [470, 420]];

// Emergency types. glyph = 24x24 SVG path (drawn white on pins, currentColor in the UI).
const TYPES = {
  medical: { name: "Medical", full: "Medical emergency", glyph: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" },
  fire:    { name: "Fire",    full: "Fire emergency",    glyph: "M12 2s5 4.5 5 10.5a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 1.5.8 2.5 1.7 2.5C11 8 11.5 5 12 2z" },
  safety:  { name: "Safety",  full: "Safety / security", glyph: "M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z" },
};

// Schematic px -> lat/lng (about 1.25 m per px around CONFIG.CENTER).
const toLL = (x, y) => ({ lat: CONFIG.CENTER.lat - (y - 260) * 0.0000112, lng: CONFIG.CENTER.lng + (x - 400) * 0.0000134 });
const nearestBuilding = (x, y) => Object.values(B).reduce((a, b) =>
  Math.hypot(b.x + b.w / 2 - x, b.y + b.h / 2 - y) < Math.hypot(a.x + a.w / 2 - x, a.y + a.h / 2 - y) ? b : a);
