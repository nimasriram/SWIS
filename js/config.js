// Settings you are most likely to change.
const CONFIG = {
  GOOGLE_MAPS_API_KEY: "",                  // paste your key to switch from the schematic map to real Google Maps
  CENTER: { lat: 32.9860, lng: -96.7500 },  // approximate UTD campus centre
  ZOOM: 17,
  FLOOR_HEIGHT_M: 3.6,                      // metres per storey; tune per building
  PRESSURE_SIGMA_M: 1.0,                   // +/- metres of barometer + weather noise; drives the floor-confidence %
  ALERT_REPEAT_MS: 6000,                    // soft chime repeats this often until the alert is acknowledged
  DEMO_AUTO_SOS_MS: 0,                      // >0 fires one simulated SOS this many ms after page load (0 = off, use the button)
};
