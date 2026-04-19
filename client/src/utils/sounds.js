/** Tiny Web Audio beeps — no external files */

let ctx;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function beep(freq, duration = 0.08, type = "sine", vol = 0.12) {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(c.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      o.disconnect();
      g.disconnect();
    }, duration * 1000);
  } catch {
    /* ignore if audio blocked */
  }
}

export const sounds = {
  tap: () => beep(520, 0.05, "triangle", 0.08),
  success: () => {
    beep(660, 0.07, "sine", 0.1);
    setTimeout(() => beep(880, 0.1, "sine", 0.1), 80);
  },
  error: () => beep(200, 0.12, "square", 0.06),
};
