// Event listeners and startup
document.addEventListener("pointerdown", unlockAudio, { once: true });   // browsers only allow sound after a click

document.addEventListener("click", ev => {
  const q = s => ev.target.closest(s); let x;
  if ((x = q("[data-res]"))) return resolve(x.dataset.res);
  if ((x = q("[data-ackopen]"))) { ack(x.dataset.ackopen); return openDetail(x.dataset.ackopen); }
  if ((x = q("[data-ack]"))) return ack(x.dataset.ack);
  if (q("[data-close]")) return closeDetail();
  if (q("#accBtn")) return toggleAcc();
  if ((x = q("[data-open]"))) return openDetail(x.dataset.open);
});
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && detailId) closeDetail(); });

function toggleAcc() {
  const closed = $("pAct").classList.toggle("closed");
  $("accBtn").setAttribute("aria-expanded", !closed);
  try { localStorage.setItem("umer-acc", closed ? "0" : "1"); } catch (e) { }
}
function setTheme(th) {
  document.documentElement.dataset.theme = th;
  try { localStorage.setItem("umer-theme", th); } catch (e) { }
  $("thmLbl").textContent = th === "dark" ? "Light" : "Dark";
  applyMapTheme();
}

$("sim").onclick = simulate;
$("rst").onclick = () => { clearMarkers(); detailId = null; $("drawer").classList.remove("on"); seed(); refreshAlert(); render(); };
$("snd").onclick = () => setSound(!soundOn);
$("thm").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");

try { if (localStorage.getItem("umer-acc") === "0") { $("pAct").classList.add("closed"); $("accBtn").setAttribute("aria-expanded", "false"); } } catch (e) { }
$("thmLbl").textContent = document.documentElement.dataset.theme === "dark" ? "Light" : "Dark";

seed(); renderLegend(); render(); tick(); initMap();
setInterval(tick, 1000);
if (CONFIG.DEMO_AUTO_SOS_MS > 0) setTimeout(simulate, CONFIG.DEMO_AUTO_SOS_MS);
