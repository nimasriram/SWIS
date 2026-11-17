// Multi-dispatcher sync (BroadcastChannel now, Firebase later). Open the page in two tabs to try it.
let bc;
try { bc = new BroadcastChannel("umer"); } catch (x) { }
const send = m => { try { bc && bc.postMessage(m); } catch (x) { } };
if (bc) bc.onmessage = ev => {
  const m = ev.data;
  if (m.t === "new") {
    const t = m.e, dup = find(t.id);
    if (dup && dup.ts === t.ts) return;
    if (dup) t.id = nextId();                 // two consoles picked the same number: re-key ours
    E.push(t); render(); alertNew(t);
  }
  if (m.t === "ack") ack(m.id, m.ts, true);
  if (m.t === "res") resolve(m.id, m.ts, true);
};
