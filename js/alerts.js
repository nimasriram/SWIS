// New-SOS alert: card + dim + pulsing red border + soft repeating chime. Stays until a dispatcher acknowledges.
let soundOn = true, actx = null, chimeT = null;

function audio() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } return actx; }
function unlockAudio() { const c = audio(); if (c && c.state === "suspended") c.resume().catch(() => { }); }
function chime() {                                   // two soft sine tones, quiet on purpose
  if (!soundOn) return;
  const c = audio(); if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => { });
  const t0 = c.currentTime;
  [[880, 0], [659, .2]].forEach(([f, d]) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0 + d); g.gain.linearRampToValueAtTime(.07, t0 + d + .03); g.gain.exponentialRampToValueAtTime(.0001, t0 + d + .8);
    o.connect(g); g.connect(c.destination); o.start(t0 + d); o.stop(t0 + d + .85);
  });
}
function setSound(on) {
  soundOn = on; const b = $("snd");
  b.textContent = on ? "Sound on" : "Sound off"; b.setAttribute("aria-pressed", on);
  if (on) { unlockAudio(); chime(); }
}

const unacked = () => E.filter(t => isActive(t) && !t.ackTs).sort((a, b) => b.ts - a.ts);

function alertNew(t) {
  sel = t.id; chime(); focusTicket(t.id);
  $("pAct").classList.remove("closed"); $("accBtn").setAttribute("aria-expanded", "true");
  refreshAlert(); render();
}

// Shows the newest unacknowledged ticket; hides everything once none are left.
function refreshAlert() {
  const u = unacked(), box = $("alert");
  if (!u.length) {
    box.classList.remove("on"); box.dataset.tid = ""; $("dim").classList.remove("on"); $("fx").classList.remove("on");
    clearInterval(chimeT); chimeT = null; return;
  }
  const t = u[0], more = u.length - 1;
  box.innerHTML = `<div class="a-top"><span class="a-dot"></span>NEW SOS${more ? `<span class="a-more">+${more} more waiting</span>` : ""}<span class="a-el" data-el="${t.id}">${dur(Date.now() - t.ts)}</span></div>
    <div class="a-id">${badge(t.kind, 28)}<div><b>${t.id}</b><div>${tag(t.kind)} <span class="m">User ${t.user}</span></div></div></div>
    <div class="a-loc">${t.label}</div>
    <div class="a-row">${confChip(t)}<span class="m">${t.type === "indoor" ? "Indoor" : "Outdoor"} · ${clock(t.ts)}</span></div>
    <div class="a-btns"><button class="btn pri" type="button" data-ackopen="${t.id}">Acknowledge &amp; open ticket</button><button class="btn" type="button" data-ack="${t.id}">Acknowledge</button></div>`;
  box.classList.toggle("right", t.x < 400);          // keep the card off the new pin
  if (box.dataset.tid !== t.id) { box.classList.remove("on"); void box.offsetWidth; box.dataset.tid = t.id; }
  box.classList.add("on"); $("dim").classList.add("on"); $("fx").classList.add("on");
  if (!chimeT) chimeT = setInterval(chime, CONFIG.ALERT_REPEAT_MS);
}
