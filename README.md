# UMER Dispatch Console (prototype)
Open `index.html` in a browser. No build step. Script order in index.html matters (top to bottom).
Light/dark toggle is in the header (remembered per browser). Fonts: Roboto (Google Fonts, falls back to Arial offline).

```
index.html          page structure only
css/theme.css       colour tokens, light/dark, UTD green + orange
css/styles.css      layout + components
js/config.js        map key, centre, floor height, pressure noise, alert chime interval
js/campus-data.js   buildings, paths, emergency types (icons), schematic -> lat/lng
js/floor-logic.js   barometer -> floor + confidence %, GPS snapping
js/state.js         tickets, mock emergencies, ticket numbers, acknowledge/resolve
js/map.js           Google Maps (if key set) or schematic SVG; typed pins
js/render.js        event feed, active cards, footer stats, timers
js/detail.js        ticket detail drawer
js/alerts.js        new-SOS alert, pulsing border, soft chime until acknowledged
js/sync.js          multi-dispatcher sync (open two tabs)
js/main.js          events + startup
```

## Demo flow
1. **+ Simulate SOS** creates a ticket (UMER-####): card, pulsing red border, soft chime (repeats until acknowledged).
2. **Acknowledge & open ticket** opens the detail drawer: live elapsed timer, floor estimate with confidence, sensor data, timeline.
3. **Mark resolved** (drawer or card): pin turns green, footer counts update.
Sound needs one click on the page first (browser rule).

## Real map
Paste a key in `config.js`. For accurate pins add `ll: { lat, lng }` to each building in `campus-data.js`
(copy from map.utdallas.edu); otherwise positions come from the schematic and are approximate.

Next: Firebase (ticket numbers, sync), mobile SOS app, responder dispatch + live tracking.
