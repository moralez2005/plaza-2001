// Trilha original sintetizada na hora (WebAudio): três faixas curtas em loop no clima
// funk/breakbeat/eletro de jogo de rua do começo dos anos 2000. Nada sampleado.
"use strict";
const MUSIC = (ac, out) => {
  const noise = (() => {
    const b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const env = (g, t, a, peak, dec) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  };
  function kick(t, v = 1) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    env(g, t, 0.003, 0.9 * v, 0.28);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.32);
  }
  function snare(t, v = 1) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise;
    f.type = "bandpass";
    f.frequency.value = 1900;
    f.Q.value = 0.8;
    env(g, t, 0.002, 0.45 * v, 0.17);
    s.connect(f).connect(g).connect(out);
    s.start(t, Math.random() * 0.5);
    s.stop(t + 0.2);
    const o = ac.createOscillator(), g2 = ac.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    env(g2, t, 0.002, 0.25 * v, 0.08);
    o.connect(g2).connect(out);
    o.start(t);
    o.stop(t + 0.12);
  }
  function hat(t, open, v = 1) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise;
    f.type = "highpass";
    f.frequency.value = 7000;
    env(g, t, 0.001, 0.13 * v, open ? 0.2 : 0.035);
    s.connect(f).connect(g).connect(out);
    s.start(t, Math.random() * 0.5);
    s.stop(t + (open ? 0.25 : 0.06));
  }
  function bass(t, m, dur, v = 1, bright = 700) {
    const o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = "sawtooth";
    o2.type = "sine";
    o.frequency.value = mtof(m);
    o2.frequency.value = mtof(m - 12);
    f.type = "lowpass";
    f.Q.value = 7;
    f.frequency.setValueAtTime(bright * 2.2, t);
    f.frequency.exponentialRampToValueAtTime(bright * 0.4, t + dur);
    env(g, t, 0.005, 0.32 * v, dur);
    o.connect(f);
    o2.connect(f);
    f.connect(g).connect(out);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
  }
  function stab(t, notes, dur, v = 1, type = "square", fq = 1500) {
    const f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = "bandpass";
    f.frequency.value = fq;
    f.Q.value = 0.9;
    env(g, t, 0.004, 0.07 * v, dur);
    f.connect(g).connect(out);
    for (const n of notes)
      for (const d of [-6, 6]) {
        const o = ac.createOscillator();
        o.type = type;
        o.frequency.value = mtof(n);
        o.detune.value = d;
        o.connect(f);
        o.start(t);
        o.stop(t + dur + 0.05);
      }
  }
  function keys(t, notes, dur, v = 1) {
    const g = ac.createGain();
    env(g, t, 0.01, 0.06 * v, dur);
    g.connect(out);
    for (const n of notes) {
      const o = ac.createOscillator();
      o.type = "sine";
      o.frequency.value = mtof(n);
      const o2 = ac.createOscillator();
      o2.type = "triangle";
      o2.frequency.value = mtof(n + 12);
      const g2 = ac.createGain();
      g2.gain.value = 0.25;
      o.connect(g);
      o2.connect(g2).connect(g);
      o.start(t);
      o2.start(t);
      o.stop(t + dur + 0.05);
      o2.stop(t + dur + 0.05);
    }
  }
  function blip(t, m, dur, v = 1, type = "triangle") {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.value = mtof(m);
    env(g, t, 0.004, 0.09 * v, dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function scratch(t) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise;
    f.type = "bandpass";
    f.Q.value = 6;
    f.frequency.setValueAtTime(600, t);
    f.frequency.exponentialRampToValueAtTime(3000, t + 0.07);
    f.frequency.exponentialRampToValueAtTime(500, t + 0.15);
    f.frequency.exponentialRampToValueAtTime(2600, t + 0.22);
    env(g, t, 0.01, 0.3, 0.25);
    s.connect(f).connect(g).connect(out);
    s.start(t);
    s.stop(t + 0.3);
  }
  const ch = (r, ...iv) => iv.map((i) => r + i);
  const TRACKS = [
    {
      name: "Spray de Domingo", bpm: 98, swing: 0.14,
      chords: [ch(62, 0, 3, 7, 10, 14), ch(55, 0, 4, 10, 14, 17), ch(58, 0, 4, 7, 11, 14), ch(57, 0, 4, 7, 10, 15)],
      roots: [38, 43, 46, 45],
      K: ["x.........x.x...", "x.x.......x....x"], S: ["....x..o.o..x..o", "....x..o....x.oo"], H: "x.x.x.x.x.x.x.xo",
      B: ["0..0.7.0..3.5.7.", "0..0..c.0.3..5.7"], ST: "..x...x...x..x..", lead: [74, 72, 69, 67, 69, 72, 74, 77],
    },
    {
      name: "Rodinha Cromada", bpm: 124, swing: 0,
      chords: [ch(64, 0, 3, 7, 10, 14), ch(60, 0, 4, 7, 11), ch(57, 0, 3, 7, 10, 14), ch(59, 0, 4, 7, 10)],
      roots: [40, 36, 45, 47],
      K: ["x...x...x...x...", "x...x...x..xx.x."], S: ["....x.......x...", "....x.......x.xx"], H: "..x...x...x...x.",
      B: ["0.0c0.0c0.0c0.0c", "0.0c0.0c0.3c5.7c"], ST: "x.....x.....x...", arp: [0, 7, 12, 15, 19, 15, 12, 7],
    },
    {
      name: "Fio do Céu", bpm: 86, swing: 0.2,
      chords: [ch(65, 0, 4, 7, 11, 14), ch(64, 0, 3, 7, 10), ch(62, 0, 3, 7, 10, 14), ch(60, 0, 4, 7, 11)],
      roots: [41, 40, 38, 36],
      K: ["x......x..x.....", "x......x..x...x."], S: ["....x.......x...", "....x.......x..o"], H: "x.xxx.x.x.xxx.x.",
      B: ["0.......7...5...", "0.......7..5.3.."], keys: true, lead: [76, 74, 72, 69, 72, 74, 79, 77],
    },
  ];
  let cur = 0, timer = 0, next = 0, step = 0, on = false;
  function play(i, t) {
    const T = TRACKS[cur];
    const bar = Math.floor(i / 16) % 8, s = i % 16, ci = Math.floor(i / 16) % 4, half = bar >= 4 ? 1 : 0;
    const dur = 60 / T.bpm / 4;
    const P = (arr) => (Array.isArray(arr) ? arr[half] : arr)[s];
    const k = P(T.K);
    if (k === "x") kick(t);
    const sn = P(T.S);
    if (sn === "x") snare(t);
    else if (sn === "o") snare(t, 0.3);
    const h = T.H[s];
    if (h === "x") hat(t, false, s % 4 === 0 ? 1 : 0.7);
    else if (h === "o") hat(t, true);
    else if (cur === 1) hat(t, false, 0.25);
    const b = P(T.B);
    if (b !== ".") bass(t, T.roots[ci] + (b === "c" ? 12 : +b), cur === 2 ? dur * 6 : dur * 1.6, 1, cur === 1 ? 900 : 600);
    if (T.ST && T.ST[s] === "x") stab(t, T.chords[ci], cur === 1 ? 0.12 : 0.16, 1, cur === 1 ? "sawtooth" : "square", cur === 1 ? 2200 : 1500);
    if (T.keys && (s === 0 || s === 10)) keys(t, T.chords[ci], dur * 9);
    if (T.arp && half) blip(t, T.chords[ci][0] - 12 + T.arp[s % 8] + 12, dur * 0.9, 0.7, "square");
    if (T.lead && half && s % 2 === 0 && (s * 7 + bar * 3) % 5 < 3) blip(t, T.lead[(s / 2 + bar) % 8], dur * 1.8, 0.9);
    if (bar === 7 && s === 12 && cur !== 2) scratch(t);
  }
  function tick() {
    const T = TRACKS[cur];
    const dur = 60 / T.bpm / 4;
    while (next < ac.currentTime + 0.15) {
      const sw = step % 2 ? T.swing * dur : 0;
      play(step, next + sw);
      next += dur;
      step++;
    }
  }
  return {
    get name() { return TRACKS[cur].name; },
    get playing() { return on; },
    start() {
      if (on) return;
      on = true;
      next = ac.currentTime + 0.1;
      step = 0;
      timer = setInterval(tick, 30);
    },
    stop() {
      on = false;
      clearInterval(timer);
    },
    nextTrack() {
      cur = (cur + 1) % TRACKS.length;
      step = 0;
      next = ac.currentTime + 0.12;
      return TRACKS[cur].name;
    },
  };
};
