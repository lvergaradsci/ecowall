// =============================================================
// sound.js — Efectos de sonido sutiles para Knowledge Wall
// Web Audio API pura, sin archivos externos
// =============================================================

const WallSound = (() => {
  let ctx = null;
  let master = null;
  let muted = false;

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
    } catch(e) {}
  }

  function resume() {
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  function tone(freq, type, start, dur, vol = 0.3) {
    if (!ctx || muted) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.connect(g); g.connect(master);
    o.start(start); o.stop(start + dur + 0.02);
  }

  // ── Despegue de nota: papel que se levanta ──────────────
  // Crujido suave de papel + clic mecánico
  function playPeel() {
    if (!ctx || muted) return;
    resume();
    const now = ctx.currentTime;
    // Ruido de papel (burst de noise filtrado)
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src    = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gNoise = ctx.createGain();
    filter.type = "bandpass"; filter.frequency.value = 2800; filter.Q.value = 0.8;
    src.buffer = buf;
    gNoise.gain.value = 0.18;
    src.connect(filter); filter.connect(gNoise); gNoise.connect(master);
    src.start(now);
    // Clic de despegue
    tone(1200, "sine", now,        0.03, 0.12);
    tone(900,  "sine", now + 0.03, 0.05, 0.08);
  }

  // ── Punto asignado a un equipo: nota académica limpia ──
  function playPoint(team) {
    if (!ctx || muted) return;
    resume();
    const now = ctx.currentTime;
    if (team === "A") {
      // Equipo A: intervalo ascendente (Do-Sol) — limpio y satisfactorio
      tone(523, "triangle", now,        0.18, 0.28);
      tone(784, "triangle", now + 0.12, 0.25, 0.28);
      tone(1047,"sine",     now + 0.26, 0.30, 0.20);
    } else {
      // Equipo B: intervalo ascendente diferente (Re-La)
      tone(587, "triangle", now,        0.18, 0.28);
      tone(880, "triangle", now + 0.12, 0.25, 0.28);
      tone(1175,"sine",     now + 0.26, 0.30, 0.20);
    }
  }

  // ── Reto doble: fanfarria breve ─────────────────────────
  function playDouble() {
    if (!ctx || muted) return;
    resume();
    const now = ctx.currentTime;
    [523, 659, 784, 659, 1047].forEach((f, i) => {
      tone(f, "square", now + i * 0.08, 0.10, 0.18);
    });
  }

  // ── Tablero completo: fin de juego ──────────────────────
  function playFinale() {
    if (!ctx || muted) return;
    resume();
    const now = ctx.currentTime;
    const mel = [523,659,784,1047,784,880,1047,1319];
    mel.forEach((f, i) => {
      tone(f, "triangle", now + i * 0.1, 0.18, 0.22);
      tone(f/2, "sine",   now + i * 0.1, 0.14, 0.10);
    });
  }

  // ── Clic de UI sutil ────────────────────────────────────
  function playClick() {
    if (!ctx || muted) return;
    resume();
    tone(1400, "sine", ctx.currentTime, 0.03, 0.08);
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.22;
    return muted;
  }

  function isMuted() { return muted; }

  return { init, playPeel, playPoint, playDouble, playFinale, playClick, toggleMute, isMuted };
})();
