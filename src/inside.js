// Dentro das lojas: a loja de discos e a lan house viram salas de verdade. O skatista desce do
// skate, encosta a prancha na porta e anda lá dentro. Aqui ficam a textura própria das salas
// (capas, rótulos, vinil, lombadas, cartazes e placas, tudo desenhado em canvas) e a montagem
// das duas salas: paredes, móveis, discos, PCs, luzes e os pontos onde dá pra mexer nas coisas.
"use strict";
const INSIDE = (() => {
  const { V, M, hex, Mesh } = E;
  // textura 2048 × 1024: a metade esquerda tem móveis, placas e cartazes; a direita, capas e rótulos (até 40 discos)
  const TW = 2048, TH = 1024, NCOV = 40, NLAB = 48;
  const RR = (x, y, w, h) => [x / TW, y / TH, (x + w) / TW, (y + h) / TH];
  const T = {
    covers: Array.from({ length: NCOV }, (_, i) => RR(1024 + (i % 8) * 128 + 2, Math.floor(i / 8) * 128 + 2, 124, 124)),
    vinyl: RR(0, 256, 256, 256),
    labels: Array.from({ length: NLAB }, (_, i) => RR(1024 + (i % 16) * 64, 640 + Math.floor(i / 16) * 64, 64, 64)),
    cd: RR(256, 384, 128, 128),
    spinesCD: RR(384, 384, 384, 64),
    booth: RR(768, 384, 256, 64),
    spinesLP: RR(384, 448, 640, 64),
    posters: [0, 1, 2, 3].map((i) => RR(i * 192 + 2, 514, 188, 284)),
    screens: Array.from({ length: 6 }, (_, i) => RR(768 + (i % 2) * 128 + 2, 512 + Math.floor(i / 2) * 96 + 2, 124, 92)),
    ouca: RR(0, 800, 512, 96), precos: RR(512, 800, 512, 96),
    neonD: RR(0, 896, 512, 64), semana: RR(512, 896, 256, 64), neonL: RR(768, 896, 256, 64),
    tags: Array.from({ length: 8 }, (_, i) => RR(i * 128 + 2, 962, 124, 60)),
  };
  const FONT = (px, w = 900) => `${w} ${px}px Rubik, "Arial Black", Arial, sans-serif`;
  function rnd(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const PAL = [["#ff4fa3", "#ffd23f", "#1b1530"], ["#3fd0ff", "#1b1530", "#f5f1e6"], ["#ff8a1f", "#2457c8", "#f5f1e6"], ["#1fae5a", "#ffd23f", "#14213a"], ["#8c5cff", "#ff8fc8", "#120f24"], ["#e0302b", "#f5f1e6", "#1b1530"], ["#2a8a7a", "#f2c14e", "#0f1c1a"], ["#f5f1e6", "#e0302b", "#1b1530"]];
  const palOf = (a) => PAL[hash(a.a + (a.t || "")) % PAL.length];
  // texto que encolhe até caber
  function fit(g, t, maxW, px, w) { let f = px; g.font = FONT(f, w); while (g.measureText(t).width > maxW && f > 6) { f -= 1; g.font = FONT(f, w); } return f; }

  // ---------- capa gerada (álbuns sem foto): arte original, só formas e o nome ----------
  function drawCover(g, a, x, y, s) {
    g.save();
    g.beginPath(); g.rect(x, y, s, s); g.clip();
    if (a.img) { g.drawImage(a.img, x, y, s, s); g.restore(); return; }
    const r = rnd(hash(a.a)), [c1, c2, c3] = palOf(a), st = hash(a.a) % 4;
    g.fillStyle = c3; g.fillRect(x, y, s, s);
    if (st === 0) {
      for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? c1 : c2; g.fillRect(x, y + s * (0.5 + i * 0.07), s, s * 0.035); }
      g.fillStyle = c1; g.beginPath(); g.arc(x + s * 0.5, y + s * 0.5, s * 0.26, Math.PI, 0); g.fill();
    } else if (st === 1) {
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { g.fillStyle = (i + j) % 3 ? c1 : c2; const k = 0.25 + r() * 0.6; g.beginPath(); g.arc(x + s * (0.12 + i * 0.152), y + s * (0.12 + j * 0.152), s * 0.06 * k, 0, 7); g.fill(); }
    } else if (st === 2) {
      g.translate(x + s / 2, y + s / 2); g.rotate(-0.5);
      for (let i = -4; i < 5; i++) { g.fillStyle = i % 2 ? c1 : c2; g.fillRect(-s, i * s * 0.12, s * 2, s * 0.06); }
      g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.rect(x, y, s, s); g.clip();
    } else {
      for (let i = 6; i > 0; i--) { g.fillStyle = i % 2 ? c1 : c2; g.beginPath(); g.arc(x + s * 0.62, y + s * 0.42, s * 0.07 * i, 0, 7); g.fill(); }
    }
    g.fillStyle = c3; g.globalAlpha = 0.85; g.fillRect(x, y + s * 0.74, s, s * 0.26); g.globalAlpha = 1;
    g.fillStyle = c1 === "#f5f1e6" ? c2 : "#f5f1e6"; g.textAlign = "left"; g.textBaseline = "alphabetic";
    fit(g, a.a.toUpperCase(), s * 0.88, Math.round(s * 0.13)); g.fillText(a.a.toUpperCase(), x + s * 0.06, y + s * 0.88);
    g.fillStyle = c1; fit(g, a.t || "", s * 0.88, Math.round(s * 0.075), 700); g.fillText(a.t || "", x + s * 0.06, y + s * 0.96);
    g.restore();
  }
  // rótulo do vinil (o meio do disco)
  function drawLabel(g, a, cx, cy, r, side) {
    const [c1, c2, c3] = palOf(a), R = a.rot || { bg: c1, fg: c3, ac: c2 };
    g.save();
    g.fillStyle = R.bg; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.strokeStyle = R.ac; g.lineWidth = Math.max(1, r * 0.04); g.beginPath(); g.arc(cx, cy, r * 0.9, 0, 7); g.stroke();
    g.fillStyle = R.fg; g.textAlign = "center"; g.textBaseline = "middle";
    fit(g, a.a.toUpperCase(), r * 1.4, Math.round(r * 0.22)); g.fillText(a.a.toUpperCase(), cx, cy - r * 0.45);
    fit(g, a.t || "", r * 1.5, Math.round(r * 0.13), 700); g.fillText(a.t || "", cx, cy + r * 0.42);
    g.font = FONT(Math.round(r * 0.14)); g.fillStyle = R.ac; g.fillText(side ? "LADO " + side : "33⅓", cx, cy + r * 0.68);
    g.fillStyle = "#050507"; g.beginPath(); g.arc(cx, cy, r * 0.07, 0, 7); g.fill();
    g.restore();
  }
  function drawVinyl(g, cx, cy, r, glow) {
    g.save();
    g.fillStyle = "#0c0c10"; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    for (let i = 0; i < 46; i++) { const rr = r * (0.36 + (i / 46) * 0.6); g.strokeStyle = i % 2 ? "#17171d" : "#101015"; g.lineWidth = r * 0.008; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.stroke(); }
    // faixas entre as músicas (anéis mais lisos)
    for (const k of [0.5, 0.63, 0.75, 0.86]) { g.strokeStyle = "#24242c"; g.lineWidth = r * 0.012; g.beginPath(); g.arc(cx, cy, r * k, 0, 7); g.stroke(); }
    // brilho de luz no sulco
    for (const [a0, al] of [[-0.9, glow ? 0.22 : 0.16], [2.24, glow ? 0.16 : 0.11]]) {
      for (let i = 0; i < 8; i++) { g.strokeStyle = `rgba(220,225,255,${al * (1 - i / 8)})`; g.lineWidth = r * 0.5; g.beginPath(); g.arc(cx, cy, r * 0.66, a0 - 0.05 * (8 - i), a0 + 0.05 * (8 - i)); g.stroke(); }
    }
    g.strokeStyle = "#2a2a33"; g.lineWidth = r * 0.02; g.beginPath(); g.arc(cx, cy, r * 0.985, 0, 7); g.stroke();
    g.restore();
  }
  function drawCD(g, cx, cy, r) {
    g.save();
    const cg = g.createConicGradient ? g.createConicGradient(0, cx, cy) : null;
    if (cg) { ["#dfe4ea", "#b9f0ff", "#ffd1f0", "#fff6c2", "#c9ffd8", "#dfe4ea", "#d6c9ff", "#ffe0c2", "#dfe4ea"].forEach((c, i, A) => cg.addColorStop(i / (A.length - 1), c)); g.fillStyle = cg; }
    else g.fillStyle = "#d6dbe2";
    g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.fillStyle = "rgba(240,244,250,.85)"; g.beginPath(); g.arc(cx, cy, r * 0.32, 0, 7); g.fill();
    g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(cx, cy, r * 0.11, 0, 7); g.fill();
    g.restore();
  }
  function spines(g, x, y, w, h, seed, thin) {
    const r = rnd(seed); let px = x;
    const C = ["#1b1530", "#f5f1e6", "#e0302b", "#2457c8", "#ffd23f", "#1fae5a", "#ff8fc8", "#8c5cff", "#ff8a1f", "#3fd0ff", "#6a4a3a", "#c9ced8", "#2a8a7a", "#101018"];
    while (px < x + w) {
      const sw = thin ? 3 + Math.floor(r() * 3) : 8 + Math.floor(r() * 4), c = C[Math.floor(r() * C.length)];
      g.fillStyle = c; g.fillRect(px, y, sw, h);
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(px + sw - 1, y, 1, h);
      if (!thin) { g.fillStyle = c === "#f5f1e6" || c === "#ffd23f" || c === "#c9ced8" ? "rgba(27,21,48,.65)" : "rgba(255,255,255,.7)"; const n = 2 + Math.floor(r() * 3); for (let k = 0; k < n; k++) g.fillRect(px + sw / 2 - 1, y + 6 + r() * (h - 18), 2, 3 + r() * 9); }
      else if (r() < 0.4) { g.fillStyle = "rgba(255,255,255,.4)"; g.fillRect(px + 1, y + h * 0.3, 1, h * 0.3); }
      px += sw;
    }
  }
  function poster(g, x, y, w, h, k) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.textAlign = "center"; g.textBaseline = "alphabetic";
    const T2 = (t, yy, px, c, wt) => { g.fillStyle = c; fit(g, t, w * 0.86, px, wt); g.fillText(t, x + w / 2, y + yy); };
    if (k === 0) {
      g.fillStyle = "#ff8a1f"; g.fillRect(x, y, w, h);
      g.fillStyle = "#1b1530"; for (let i = 0; i < 16; i++) { g.save(); g.translate(x + w / 2, y + h * 0.42); g.rotate((i / 16) * Math.PI * 2); g.fillRect(0, -3, w, 6); g.restore(); }
      g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(x + w / 2, y + h * 0.42, w * 0.24, 0, 7); g.fill();
      T2("ROCK", h * 0.17, 46, "#1b1530"); T2("NA PRAÇA", h * 0.27, 30, "#1b1530");
      g.fillStyle = "#1b1530"; g.fillRect(x, y + h * 0.66, w, h * 0.34);
      T2("OS CALANGOS", h * 0.74, 18, "#ffd23f"); T2("FERRUGEM · LUA DE LATA", h * 0.81, 13, "#f5f1e6"); T2("SÁBADO 21H · PRAÇA DA MATRIZ", h * 0.9, 11, "#ff8a1f", 700); T2("ENTRADA: 1 KG DE ALIMENTO", h * 0.96, 10, "#f5f1e6", 700);
    } else if (k === 1) {
      const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, "#2a1450"); gr.addColorStop(1, "#ff4fa3"); g.fillStyle = gr; g.fillRect(x, y, w, h);
      drawVinyl(g, x + w / 2, y + h * 0.45, w * 0.36, 1); g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(x + w / 2, y + h * 0.45, w * 0.12, 0, 7); g.fill();
      T2("NOITE DO", h * 0.11, 26, "#f5f1e6"); T2("VINIL", h * 0.2, 44, "#ffd23f");
      T2("TODA SEXTA · 20H", h * 0.8, 18, "#f5f1e6"); T2("TRAGA SEU DISCO", h * 0.87, 15, "#1b1530"); T2("DJ SEU VAVÁ", h * 0.94, 13, "#1b1530", 700);
    } else if (k === 2) {
      g.fillStyle = "#3fd0ff"; g.fillRect(x, y, w, h); g.fillStyle = "#ffd23f"; g.fillRect(x, y + h * 0.58, w, h * 0.42);
      g.save(); g.translate(x + w / 2, y + h * 0.42); g.rotate(-0.35);
      g.fillStyle = "#1b1530"; g.beginPath(); g.roundRect ? g.roundRect(-w * 0.36, -10, w * 0.72, 20, 10) : g.rect(-w * 0.36, -10, w * 0.72, 20); g.fill();
      g.fillStyle = "#ff4fa3"; for (const sx of [-0.22, 0.22]) { g.beginPath(); g.arc(w * sx, 16, 9, 0, 7); g.fill(); }
      g.restore();
      T2("SKATE JAM", h * 0.15, 40, "#1b1530"); T2("PLAZA 2001", h * 0.25, 26, "#f5f1e6");
      T2("CAMPEONATO NA PRAÇA", h * 0.72, 16, "#1b1530"); T2("INSCRIÇÕES AQUI NA LOJA", h * 0.81, 13, "#1b1530", 700); T2("PRÊMIO: SHAPE NOVO", h * 0.9, 14, "#e0302b");
    } else {
      g.fillStyle = "#0f1c3a"; g.fillRect(x, y, w, h);
      g.strokeStyle = "#1fae5a"; g.lineWidth = 2; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(x, y + h * 0.35 + i * 12); g.lineTo(x + w, y + h * 0.35 + i * 12 - 30); g.stroke(); }
      T2("CAMPEONATO", h * 0.13, 30, "#3fd0ff"); T2("5 x 5", h * 0.27, 54, "#ffd23f");
      T2("LAN MEGABYTE", h * 0.74, 20, "#f5f1e6"); T2("SÁBADO · 14H", h * 0.82, 16, "#3fd0ff"); T2("PRÊMIO: 10 HORAS GRÁTIS", h * 0.91, 12, "#ffd23f", 700);
    }
    g.restore();
  }
  function screen(g, x, y, w, h, k) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    if (k === 0) { const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, "#6cc4ff"); gr.addColorStop(1, "#ffe2b0"); g.fillStyle = gr; g.fillRect(x, y, w, h); g.fillStyle = "#8f7fd6"; g.beginPath(); g.moveTo(x, y + h); g.quadraticCurveTo(x + w * 0.2, y + h * 0.35, x + w * 0.45, y + h); g.fill(); g.fillStyle = "#1b1530"; g.fillRect(x + w * 0.55, y + h * 0.62, 18, 4); g.fillStyle = "#ff4fa3"; g.fillRect(x + w * 0.57, y + h * 0.45, 8, 14); g.fillStyle = "#1b1530"; g.font = FONT(10); g.fillText("COMBO x4", x + 6, y + 14); }
    else if (k === 1) { g.fillStyle = "#9bbc0f"; g.fillRect(x, y, w, h); g.fillStyle = "#306230"; for (let i = 0; i < 9; i++) g.fillRect(x + 20 + i * 8, y + 40, 7, 7); for (let i = 0; i < 4; i++) g.fillRect(x + 84, y + 40 - i * 8, 7, 7); g.fillRect(x + 30, y + 70, 7, 7); }
    else if (k === 2) { g.fillStyle = "#06060c"; g.fillRect(x, y, w, h); g.fillStyle = "#3fd0ff"; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) g.fillRect(x + 14 + i * 17, y + 12 + j * 13, 10, 7); g.fillStyle = "#ff4fa3"; g.fillRect(x + w / 2 - 7, y + h - 14, 14, 7); }
    else if (k === 3) { g.fillStyle = "#1f7a8a"; g.fillRect(x, y, w, h); g.fillStyle = "#c9ced8"; g.fillRect(x, y + h - 10, w, 10); g.fillStyle = "#2457c8"; g.fillRect(x + 2, y + h - 8, 22, 6); for (let i = 0; i < 4; i++) { g.fillStyle = "#ffd23f"; g.fillRect(x + 8, y + 8 + i * 18, 10, 10); } g.fillStyle = "#f5f1e6"; g.fillRect(x + 40, y + 14, 70, 50); g.fillStyle = "#2457c8"; g.fillRect(x + 40, y + 14, 70, 8); }
    else if (k === 4) { g.fillStyle = "#3a2a1a"; g.fillRect(x, y, w, h); g.fillStyle = "#6a4a2a"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.4, y + h * 0.35); g.lineTo(x + w * 0.4, y + h * 0.7); g.lineTo(x, y + h); g.fill(); g.beginPath(); g.moveTo(x + w, y); g.lineTo(x + w * 0.6, y + h * 0.35); g.lineTo(x + w * 0.6, y + h * 0.7); g.lineTo(x + w, y + h); g.fill(); g.fillStyle = "#8a8a8a"; g.fillRect(x + w * 0.62, y + h * 0.7, 30, 26); g.fillStyle = "#ffd23f"; g.fillRect(x + w / 2 - 1, y + h / 2 - 5, 2, 10); g.fillRect(x + w / 2 - 5, y + h / 2 - 1, 10, 2); }
    else { g.fillStyle = "#e8eef8"; g.fillRect(x, y, w, h); g.fillStyle = "#2457c8"; g.fillRect(x, y, w, 12); g.fillStyle = "#1b1530"; g.font = FONT(9, 700); ["kf: bora pista?", "julie: bora!! 5h", "manu: levo o som", "kaua: tô indo"].forEach((t, i) => g.fillText(t, x + 6, y + 26 + i * 14)); }
    g.restore();
  }
  function sign(g, x, y, w, h, t, bg, fg, px, neon) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    if (bg) { g.fillStyle = bg; g.fillRect(x, y, w, h); }
    g.textAlign = "center"; g.textBaseline = "middle"; fit(g, t, w * 0.9, px);
    if (neon) { g.shadowColor = neon; g.shadowBlur = 14; g.fillStyle = neon; g.fillText(t, x + w / 2, y + h / 2 + 2); g.shadowBlur = 4; g.fillStyle = fg; g.fillText(t, x + w / 2, y + h / 2 + 2); }
    else { g.fillStyle = fg; g.fillText(t, x + w / 2, y + h / 2 + 2); }
    g.restore();
  }

  // monta a textura das salas; albs = álbuns da loja (cada um ganha uma capa e um rótulo)
  function makeTex(albs, onUpdate) {
    const cv = document.createElement("canvas");
    cv.width = TW; cv.height = TH;
    const g = cv.getContext("2d");
    const P = (r) => [r[0] * TW, r[1] * TH, (r[2] - r[0]) * TW, (r[3] - r[1]) * TH];
    const paintAlb = (a, i) => {
      const [x, y, w] = P(T.covers[i % NCOV]);
      g.clearRect(x - 2, y - 2, w + 4, w + 4);
      drawCover(g, a, x, y, w);
      const [lx, ly, lw] = P(T.labels[i % NLAB]);
      g.clearRect(lx, ly, lw, lw);
      drawLabel(g, a, lx + lw / 2, ly + lw / 2, lw / 2 - 1);
    };
    albs.forEach(paintAlb);
    { const [x, y, w] = P(T.vinyl); drawVinyl(g, x + w / 2, y + w / 2, w / 2 - 2); }
    { const [x, y, w] = P(T.cd); drawCD(g, x + w / 2, y + w / 2, w / 2 - 2); }
    { const [x, y, w, h] = P(T.spinesCD); spines(g, x, y, w, h, 7); }
    { const [x, y, w, h] = P(T.spinesLP); spines(g, x, y, w, h, 19, 1); }
    T.posters.forEach((r, k) => { const [x, y, w, h] = P(r); poster(g, x, y, w, h, k); });
    T.screens.forEach((r, k) => { const [x, y, w, h] = P(r); screen(g, x, y, w, h, k); });
    { const [x, y, w, h] = P(T.ouca); sign(g, x, y, w, h, "OUÇA ANTES DE COMPRAR", "#c8282f", "#f5f1e6", 52); g.strokeStyle = "#f5f1e6"; g.lineWidth = 4; g.strokeRect(x + 6, y + 6, w - 12, h - 12); }
    { const [x, y, w, h] = P(T.precos); g.fillStyle = "#6a4422"; g.fillRect(x, y, w, h); g.fillStyle = "#1e2a24"; g.fillRect(x + 7, y + 7, w - 14, h - 14); sign(g, x, y, w, h, "LP R$ 15 · CD R$ 18 · K7 R$ 5", null, "#f2efe6", 38); }
    { const [x, y, w, h] = P(T.neonD); sign(g, x, y, w, h, "VAVÁ DISCOS", null, "#ffe3f3", 50, "#ff4fa3"); }
    { const [x, y, w, h] = P(T.semana); sign(g, x, y, w, h, "DISCO DA SEMANA", "#ffd23f", "#1b1530", 26); }
    { const [x, y, w, h] = P(T.neonL); sign(g, x, y, w, h, "MEGABYTE", null, "#e6fbff", 44, "#3fd0ff"); }
    { const [x, y, w, h] = P(T.booth); g.fillStyle = "#1b1418"; g.fillRect(x, y, w, h); sign(g, x + 4, y + 6, w - 8, h - 12, "OUÇA AQUI", "#f4efe0", "#1b1418", 34); }
    ["ROCK", "NACIONAL", "POP", "ANOS 90", "CLÁSSICOS", "PROMOÇÃO", "R$ 2 / HORA", "SKATE NA PORTA ;)"].forEach((t, i) => {
      const [x, y, w, h] = P(T.tags[i]);
      sign(g, x, y, w, h, t, i === 5 ? "#ffd23f" : i === 6 ? "#3fd0ff" : i === 7 ? "#f5f1e6" : "#f5f1e6", i === 7 ? "#e0302b" : "#1b1530", 26);
    });
    // fotos de capa chegam depois (decodificar a imagem é assíncrono)
    albs.forEach((a, i) => {
      if (!a.capa || a.img) return;
      const im = new Image();
      im.onload = () => { a.img = im; paintAlb(a, i); onUpdate && onUpdate(cv); };
      im.src = a.capa;
    });
    return cv;
  }
  // capa, verso e rótulo em tamanho grande pra tela de olhar o disco (HTML)
  function coverURL(a, s = 320) {
    const c = document.createElement("canvas"); c.width = c.height = s; drawCover(c.getContext("2d"), a, 0, 0, s); return c.toDataURL("image/jpeg", 0.9);
  }
  function labelURL(a, side, s = 220) {
    const c = document.createElement("canvas"); c.width = c.height = s; drawLabel(c.getContext("2d"), a, s / 2, s / 2, s / 2 - 2, side); return c.toDataURL();
  }

  // ---------- peças ----------
  const C = {
    wood: hex(0x7a4a2a), woodD: hex(0x4a2c1c), woodL: hex(0xc8955a), woodT: hex(0x2b1a12), teal: hex(0x2c6e6b), cream: hex(0xeadfc6), wine: hex(0x5a2433),
    ceil: hex(0x2b2236), metal: hex(0xb8bcc4), dark: hex(0x1d1a22), black: hex(0x0f0f14), white: hex(0xf2efe6), beige: hex(0xd8d0b8), navy: hex(0x2f3e66), navyD: hex(0x22283a),
    pink: hex(0xff4fa3), cyan: hex(0x3fd0ff), lamp: hex(0xfff2d0), green: hex(0x2fae4a), terra: hex(0xb8603a), red: hex(0xc8282f), blue: hex(0x2457c8),
  };
  // sala: paredes, piso, teto, vitrine e porta (a rua lá fora é um painel aceso)
  function shell(st, fl, o) {
    const { wallLo, wallHi, floorA, floorB, tile } = o, W = o.W || 4, D = o.D || 10, H = o.H || 3.3;
    for (let i = 0; i < (2 * W) / tile; i++) for (let j = 0; j < D / tile; j++) {
      const x = -W + i * tile, z = j * tile;
      fl.quad([x, 0, z], [x, 0, z + tile], [x + tile, 0, z + tile], [x + tile, 0, z], (i + j) % 2 ? floorA : floorB);
    }
    st.box(-W - 0.1, 0, 0, -W, 1.0, D, wallLo); st.box(-W - 0.1, 1.0, 0, -W, H, D, wallHi);
    st.box(W, 0, 0, W + 0.1, 1.0, D, wallLo); st.box(W, 1.0, 0, W + 0.1, H, D, wallHi);
    st.box(-W, 0, D, W, 1.0, D + 0.1, wallLo); st.box(-W, 1.0, D, W, H, D + 0.1, wallHi);
    for (const [x0, x1] of [[-W, -W + 0.03], [W - 0.03, W]]) st.box(x0, 0.97, 0, x1, 1.05, D, C.woodT);
    st.box(-W, 0.97, D - 0.03, W, 1.05, D, C.woodT);
    for (const [x0, x1] of [[-W, -W + 0.02], [W - 0.02, W]]) fl.box(x0, 0, 0, x1, 0.1, D, C.woodT);
    // fachada por dentro: porta de vidro no meio e duas vitrines
    const wx = W - 0.4;
    const fw = (x0, y0, x1, y1) => st.box(x0, y0, -0.1, x1, y1, 0, wallHi);
    fw(-W, 0, -wx, H); fw(wx, 0, W, H); fw(-1.2, 0, -0.7, H); fw(0.7, 0, 1.2, H);
    fw(-wx, 0, -1.2, 0.55); fw(1.2, 0, wx, 0.55); fw(-wx, 2.4, -1.2, H); fw(1.2, 2.4, wx, H); fw(-0.7, 2.3, 0.7, H);
    // rua lá fora (acesa): céu, prédios do outro lado, calçada
    const out = o.outside || [hex(0xffe0b0), hex(0xffc98a), hex(0xbfa890)];
    fl.quad([-W, 1.5, -0.9], [W, 1.5, -0.9], [W, H, -0.9], [-W, H, -0.9], out[0], 2);
    fl.quad([-W, 0.35, -0.9], [W, 0.35, -0.9], [W, 1.5, -0.9], [-W, 1.5, -0.9], out[1], 2);
    fl.quad([-W, 0, -0.9], [W, 0, -0.9], [W, 0.35, -0.9], [-W, 0.35, -0.9], out[2], 2);
    for (let k = 0; k < Math.ceil((2 * W) / 1.4); k++) { const x = -W + 0.2 + k * 1.4, h = 1.6 + ((k * 37) % 5) * 0.18; fl.quad([x, 0.35, -0.85], [x + 1.1, 0.35, -0.85], [x + 1.1, h, -0.85], [x, h, -0.85], [out[1][0] * 0.82, out[1][1] * 0.78, out[1][2] * 0.8], 2); }
    const glass = hex(0xcfe8ff);
    for (const [x0, y0, x1, y1] of [[-wx, 0.55, -1.2, 2.4], [1.2, 0.55, wx, 2.4], [-0.7, 0, 0.7, 2.3]]) {
      fl.quad([x0, y0, -0.05], [x1, y0, -0.05], [x1, y1, -0.05], [x0, y1, -0.05], glass, 3);
      st.box(x0, y0, -0.07, x1, y0 + 0.05, -0.02, C.metal); st.box(x0, y1 - 0.05, -0.07, x1, y1, -0.02, C.metal);
      st.box(x0, y0, -0.07, x0 + 0.05, y1, -0.02, C.metal); st.box(x1 - 0.05, y0, -0.07, x1, y1, -0.02, C.metal);
    }
    st.box(-0.02, 0, -0.07, 0.02, 2.3, -0.02, C.metal);
    st.box(-0.45, 1.0, -0.02, -0.12, 1.04, 0.03, C.metal); st.box(0.12, 1.0, -0.02, 0.45, 1.04, 0.03, C.metal);
    st.box(-W - 0.1, H, -0.1, W + 0.1, H + 0.1, D + 0.1, C.ceil);
    for (let z = 2.5; z < D; z += 2.5) st.box(-W, H - 0.16, z - 0.08, W, H, z + 0.08, C.woodT);
    fl.box(-0.8, 0, 0.12, 0.8, 0.012, 1.15, hex(0x8a2a2a)); fl.box(-0.7, 0.012, 0.2, 0.7, 0.016, 1.07, hex(0x6a1e22));
  }
  // luminária pendente (cúpula + lâmpada acesa)
  function pendant(st, x, y, z, col = C.pink) {
    st.tube([x, 3.3, z], [x, y + 0.2, z], 0.008, 0.008, 4, C.dark);
    st.tube([x, y + 0.22, z], [x, y, z], 0.035, 0.2, 10, col, 0, { cap: false });
    st.ball([x, y + 0.02, z], 0.07, C.lamp, 2, 8, 4);
  }
  function tube(st, x0, x1, y, z) {
    st.box(x0 - 0.05, y + 0.02, z - 0.09, x1 + 0.05, y + 0.07, z + 0.09, C.metal);
    st.box(x0, y - 0.02, z - 0.035, x1, y + 0.02, z + 0.035, hex(0xf8f4ea), { m: 2 });
  }
  const dec = (m, c, r, u, w, h, rect, col, mat) => m.decal(c, r, u, w, h, rect, col || [1, 1, 1], mat || 4);

  // ---------- loja de discos ----------
  // peças de tocar: vitrola (TT), aparelho de CD (CDP) e o rádio (boombox). Tudo virado pra -z
  // (quem usa fica na frente, do lado do z menor).
  function addTT(st, P) {
    st.tf = M.T(...P);
    st.box(-0.26, 0, -0.2, 0.26, 0.1, 0.2, hex(0x8a5a32)); st.box(-0.25, 0.1, -0.19, 0.25, 0.106, 0.19, C.metal, { m: 1 });
    st.tube([0, 0.106, 0], [0, 0.124, 0], 0.158, 0.158, 22, hex(0x26262c));
    st.tube([0.19, 0.106, 0.13], [0.19, 0.165, 0.13], 0.026, 0.022, 8, C.metal, 1);
    st.box(0.17, 0.106, -0.17, 0.23, 0.13, -0.12, C.dark); st.ball([-0.21, 0.11, -0.16], 0.018, hex(0x7dff9a), 2, 6, 3);
    st.tf = null;
  }
  function addCDP(st, P) {
    st.tf = M.T(...P);
    st.box(-0.22, 0, -0.16, 0.22, 0.09, 0.16, hex(0xc9ced8), { m: 1 }); st.box(-0.18, 0.045, -0.165, 0.06, 0.055, -0.16, C.dark);
    st.tf = null;
  }
  // rádio de CD (3 em 1 portátil): caixas dos lados, gaveta no meio, alça e antena
  function addBox(st, P) {
    st.tf = M.T(...P);
    const body = hex(0x2a2a32), sil = hex(0xb8bcc4);
    st.box(-0.36, -0.02, -0.12, 0.36, 0.3, 0.1, body); st.box(-0.34, 0.3, -0.1, 0.34, 0.32, 0.08, sil, { m: 1 });
    for (const sx of [-1, 1]) {
      st.tube([sx * 0.24, 0.13, -0.121], [sx * 0.24, 0.13, -0.13], 0.1, 0.1, 14, sil, 1); st.tube([sx * 0.24, 0.13, -0.13], [sx * 0.24, 0.13, -0.135], 0.085, 0.085, 14, C.black);
      st.ball([sx * 0.24, 0.13, -0.135], 0.035, hex(0x4a4a55), 1, 8, 4, { sz: 0.4 });
    }
    st.box(-0.1, 0.2, -0.125, 0.1, 0.26, -0.12, hex(0x1d3a2a)); st.box(-0.08, 0.215, -0.127, 0.06, 0.245, -0.124, hex(0x7dff9a), { m: 2 });
    st.box(-0.11, 0.02, -0.125, 0.11, 0.06, -0.12, C.dark);
    for (const sx of [-0.3, 0.3]) st.tube([sx, 0.32, 0], [sx, 0.42, 0], 0.012, 0.012, 4, sil, 1);
    st.tube([-0.3, 0.42, 0], [0.3, 0.42, 0], 0.014, 0.014, 6, sil, 1);
    st.tube([0.3, 0.32, 0.06], [0.36, 0.78, 0.1], 0.005, 0.003, 4, sil, 1);
    st.tf = null;
  }
  // cabine de audição no formato da cabine telefônica inglesa (vermelha, vidrinhos em grade, teto abaulado)
  function addBooth(st, fl, thin, bx, z0, z1) {
    const red = hex(0xc8202a), redD = hex(0x9a1820), glass = hex(0xcfe8ff), w = 0.55, H = 2.45;
    // pilares
    for (const sx of [-1, 1]) for (const zz of [z0, z1 - 0.08]) st.box(bx + sx * w - (sx > 0 ? 0.08 : 0), 0, zz, bx + sx * w + (sx < 0 ? 0.08 : 0), H, zz + 0.08, red);
    // paredes dos lados e do fundo: moldura vermelha + vidrinhos em grade
    const panel = (x0, za, x1, zb) => {
      st.box(x0, 0, za, x1, 0.75, zb, red);
      st.box(x0, 2.05, za, x1, H - 0.05, zb, red);
      const vx = Math.abs(x1 - x0) > Math.abs(zb - za);
      const L = vx ? x1 - x0 : zb - za;
      for (let i = 0; i <= 3; i++) { const u = i / 3; if (vx) st.box(x0 + u * L - 0.015, 0.75, za, x0 + u * L + 0.015, 2.05, zb, red); else st.box(x0, 0.75, za + u * L - 0.015, x1, 2.05, za + u * L + 0.015, red); }
      for (let j = 0; j <= 6; j++) { const y = 0.75 + (j / 6) * 1.3; st.box(vx ? x0 : x0, y - 0.012, vx ? za : za, vx ? x1 : x1, y + 0.012, vx ? zb : zb, red); }
      const mx = (x0 + x1) / 2, mz = (za + zb) / 2;
      if (vx) thin.quad([x0, 0.75, mz], [x1, 0.75, mz], [x1, 2.05, mz], [x0, 2.05, mz], glass, 3);
      else thin.quad([mx, 0.75, za], [mx, 0.75, zb], [mx, 2.05, zb], [mx, 2.05, za], glass, 3);
    };
    panel(bx - w, z0 + 0.08, bx - w + 0.06, z1 - 0.08);
    panel(bx + w - 0.06, z0 + 0.08, bx + w, z1 - 0.08);
    panel(bx - w + 0.08, z1 - 0.07, bx + w - 0.08, z1 - 0.01);
    // faixa de cima com a placa "OUÇA AQUI" (frente e lados) e o teto abaulado
    st.box(bx - w - 0.03, H - 0.32, z0 - 0.03, bx + w + 0.03, H, z1 + 0.03, red);
    dec(thin, [bx, H - 0.16, z0 - 0.035], [-1, 0, 0], [0, 1, 0], 0.8, 0.2, T.booth);
    for (const sx of [-1, 1]) dec(thin, [bx + sx * (w + 0.035), H - 0.16, (z0 + z1) / 2], [0, 0, sx > 0 ? 1 : -1], [0, 1, 0], 0.8, 0.2, T.booth);
    st.box(bx - w - 0.06, H, z0 - 0.06, bx + w + 0.06, H + 0.06, z1 + 0.06, redD);
    st.tf = M.mul(M.T(bx, H + 0.06, (z0 + z1) / 2), M.S(1, 0.35, 1.05));
    st.ball([0, 0, 0], w + 0.04, red, 0, 10, 4, { cut: 0.5 });
    st.tf = null;
    // porta (presa na dobradiça da esquerda), com vidrinhos: é uma peça à parte, que abre e fecha
    const door = new Mesh();
    door.box(0, 0.02, -0.03, 1.08, 0.75, 0.02, red); door.box(0, 2.0, -0.03, 1.08, 2.35, 0.02, red);
    for (let i = 0; i <= 3; i++) door.box(i * 0.36 - 0.015, 0.75, -0.03, i * 0.36 + 0.015, 2.0, 0.02, red);
    for (let j = 0; j <= 5; j++) door.box(0, 0.75 + j * 0.25 - 0.012, -0.03, 1.08, 0.75 + j * 0.25 + 0.012, 0.02, red);
    for (const zz of [-0.06, 0.05]) door.box(0.97, 1.2, zz, 1.0, 1.3, zz + 0.03, C.metal, { m: 1 });
    door.quad([0, 0.75, 0], [1.08, 0.75, 0], [1.08, 2.0, 0], [0, 2.0, 0], glass, 3);
    // bancada com a vitrola e prateleira de cima com o aparelho de CD
    st.box(bx - w + 0.08, 0, z1 - 0.48, bx + w - 0.08, 0.86, z1 - 0.08, C.woodD, { top: C.woodT });
    st.box(bx - w + 0.08, 1.22, z1 - 0.38, bx + w - 0.08, 1.25, z1 - 0.08, C.woodT);
    // luz do teto da cabine e o gancho do fone
    st.box(bx - 0.12, H - 0.36, (z0 + z1) / 2 - 0.12, bx + 0.12, H - 0.33, (z0 + z1) / 2 + 0.12, C.lamp, { m: 2 });
    st.box(bx + w - 0.1, 1.55, z1 - 0.5, bx + w - 0.06, 1.58, z1 - 0.44, C.metal, { m: 1 });
    return door;
  }
  // fone de ouvido (aro + conchas). r = raio do aro, pz = distância das conchas pro meio
  function phoneMesh(r, pz, y0) {
    const m = new Mesh(), band = hex(0x1b1530), pad = hex(0x2a2a32), cup = hex(0xe8262b);
    for (const s of [-1, 1]) {
      m.tube([0, y0, s * (pz + 0.035)], [0, y0, s * pz], 0.062, 0.062, 10, cup, 0);
      m.tube([0, y0, s * pz], [0, y0, s * (pz - 0.025)], 0.058, 0.058, 10, pad, 0);
      m.box(-0.012, y0, s * (pz + 0.02) - 0.01, 0.012, y0 + 0.09, s * (pz + 0.02) + 0.01, C.metal, { m: 1 });
    }
    const N = 10;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI, a1 = ((i + 1) / N) * Math.PI;
      m.tube([0, y0 + 0.09 + Math.sin(a0) * r, Math.cos(a0) * (pz + 0.02)], [0, y0 + 0.09 + Math.sin(a1) * r, Math.cos(a1) * (pz + 0.02)], 0.016, 0.016, 5, band, 0, { cap: false });
    }
    return m;
  }
  function buildDiscos(albs, Rn, tex) {
    const st = new Mesh(), fl = new Mesh(), thin = new Mesh();
    const W = 5.5, D = 13;
    const solids = [];
    const S = (x0, z0, x1, z1) => solids.push([x0, z0, x1, z1]);
    shell(st, fl, { wallLo: C.wood, wallHi: C.teal, floorA: C.wine, floorB: C.cream, tile: 0.5, W, D, H: 3.4 });
    const N = albs.length, all = albs.map((a, i) => i);
    // discos escolhidos (os de verdade, com capa) ficam na parede; o resto nas gôndolas
    let wall = all.filter((i) => albs[i].parede && (albs[i].fmt || ["lp"]).includes("lp"));
    if (!wall.length) wall = all.filter((i) => albs[i].capa && (albs[i].fmt || ["lp"]).includes("lp")).slice(0, 5);
    let bins = all.filter((i) => !wall.includes(i) && (albs[i].fmt || ["lp"]).includes("lp"));
    if (!bins.length) bins = wall.slice();
    const cdI = all.filter((i) => (albs[i].fmt || ["cd"]).includes("cd"));
    const colOf = (i) => hex(parseInt((palOf(albs[i % N])[0]).slice(1), 16));
    // vitrines da frente
    for (const [x0, x1] of [[-W + 0.4, -1.2], [1.2, W - 0.4]]) {
      st.box(x0, 0, 0, x1, 0.5, 0.6, C.red, { top: C.woodT });
      for (let k = 0; k < 4; k++) { thin.tf = M.mul(M.T(x0 + 0.5 + k * 0.95, 0.5, 0.3), M.RX(-0.12)); thin.box(-0.155, 0, -0.003, 0.155, 0.31, 0.003, C.white); thin.tf = null; }
      S(x0, 0, x1, 0.62);
    }
    // ---- parede esquerda (x = -W): estante de CDs ----
    const cz0 = 4.4, cz1 = 10.2, cx = -W;
    st.box(cx, 0, cz0, cx + 0.38, 0.12, cz1, C.woodD); st.box(cx, 2.4, cz0, cx + 0.42, 2.48, cz1, C.woodD);
    const segs = [];
    for (let z = cz0; z < cz1 - 0.1; z += (cz1 - cz0) / 4) segs.push([z + 0.05, z + (cz1 - cz0) / 4]);
    for (const [z0] of segs) st.box(cx, 0, z0 - 0.05, cx + 0.4, 2.4, z0, C.woodD);
    st.box(cx, 0, cz1 - 0.05, cx + 0.4, 2.4, cz1, C.woodD);
    const rowsY = [0.12, 0.5, 0.88, 1.26, 1.64, 2.02];
    for (const y of rowsY.slice(1)) st.box(cx, y - 0.025, cz0, cx + 0.38, y, cz1, C.wood);
    rowsY.forEach((y, r) => segs.forEach(([z0, z1], s) => {
      if (r === 3 && s === 2) return;
      fl.box(cx, y, z0, cx + 0.28, y + 0.142, z1, C.dark);
      const R = T.spinesCD, du = (R[2] - R[0]) * 0.8, off = (((r * 4 + s) * 0.37) % 0.2) * (R[2] - R[0]);
      const rect = (r + s) % 2 ? [R[0] + off, R[1], R[0] + off + du, R[3]] : [R[0] + off + du, R[1], R[0] + off, R[3]];
      dec(fl, [cx + 0.285, y + 0.071, (z0 + z1) / 2], [0, 0, -1], [0, 1, 0], z1 - z0, 0.142, rect);
    }));
    {
      const y = 1.26, [z0, z1] = segs[2], n = Math.min(6, cdI.length);
      fl.box(cx, y, z0, cx + 0.2, y + 0.15, z1, C.dark);
      for (let k = 0; k < n; k++) {
        const z = z0 + 0.15 + k * ((z1 - z0 - 0.3) / Math.max(1, n - 1)), ai = cdI[k];
        thin.tf = M.mul(M.T(cx + 0.26, y, z), M.RZ(0.1));
        thin.box(-0.012, 0, -0.072, 0.012, 0.142, 0.072, hex(0xdfe6ee));
        dec(thin, [0.0125, 0.071, 0], [0, 0, -1], [0, 1, 0], 0.122, 0.122, T.covers[ai % NCOV]);
        thin.tf = null;
      }
      dec(fl, [cx + 0.4, y + 0.33, (z0 + z1) / 2], [0, 0, -1], [0, 1, 0], 0.5, 0.25, T.tags[4]);
    }
    S(cx, cz0, cx + 0.48, cz1);
    // ---- parede direita (x = +W): os discos escolhidos, um do lado do outro, cada um com sua luz ----
    const wallZ0 = 5.0, wallZ1 = 10.2, nW = Math.max(1, wall.length), wsp = Math.min(1.15, (wallZ1 - wallZ0) / nW);
    const wallSlots = wall.map((ai, k) => ({ ai, z: wallZ0 + (k + 0.5) * wsp }));
    st.box(W - 0.16, 1.18, wallZ0 - 0.1, W, 1.22, wallZ0 + nW * wsp + 0.1, C.woodT);
    st.box(W - 0.2, 1.18, wallZ0 - 0.1, W - 0.16, 1.26, wallZ0 + nW * wsp + 0.1, C.woodT);
    wallSlots.forEach(({ ai, z }, k) => {
      thin.box(W - 0.05, 1.22, z - 0.24, W - 0.03, 1.72, z + 0.24, C.dark);
      dec(thin, [W - 0.075, 1.47, z], [0, 0, 1], V.norm([0.05, 1, 0]), 0.46, 0.46, T.covers[ai % NCOV], [1.1, 1.1, 1.1]);
      st.tube([W - 0.02, 2.35, z], [W - 0.3, 2.22, z], 0.03, 0.06, 8, C.dark, 0, { cap: false }); st.ball([W - 0.29, 2.22, z], 0.03, C.lamp, 2, 6, 3);
      if (k === 0) dec(fl, [W - 0.02, 1.95, z], [0, 0, 1], [0, 1, 0], 0.56, 0.14, T.semana);
    });
    // ---- cantinho das poltronas (frente, lado direito): deita e curte o som ----
    const chairs = [];
    for (const z of [1.55, 3.25]) {
      const cxp = W - 0.62;
      st.tf = M.mul(M.T(cxp, 0, z), M.RY(Math.PI));
      const leather = hex(0x7a3a22), leatherD = hex(0x5a2a18);
      st.box(-0.42, 0, -0.42, 0.42, 0.18, 0.42, leatherD);
      st.box(-0.38, 0.18, -0.36, 0.36, 0.38, 0.36, leather, { top: hex(0x8a4a2a) });
      for (const sz of [-1, 1]) st.box(-0.42, 0.18, sz * 0.42 - (sz > 0 ? 0.1 : 0), 0.4, 0.62, sz * 0.42 + (sz < 0 ? 0.1 : 0), leatherD, { top: leather });
      st.tf = M.mul(M.mul(M.T(cxp, 0, z), M.RY(Math.PI)), M.mul(M.T(-0.38, 0.3, 0), M.RZ(0.38)));
      st.box(-0.12, 0, -0.34, 0.05, 0.85, 0.34, leather); st.ball([-0.02, 0.86, 0], 0.18, leatherD, 0, 8, 4, { sz: 1.9, sy: 0.6 });
      st.tf = M.mul(M.T(cxp, 0, z), M.RY(Math.PI));
      st.box(0.42, 0, -0.32, 0.9, 0.36, 0.32, leatherD, { top: leather }); // pufe pros pés
      st.tf = null;
      S(cxp - 0.95, z - 0.45, W, z + 0.45);
      chairs.push({ x: cxp, z });
    }
    fl.box(W - 2.4, 0, 0.9, W - 0.2, 0.012, 3.95, hex(0x3a6a5a)); fl.box(W - 2.3, 0.012, 1.0, W - 0.3, 0.016, 3.85, hex(0x2c5a4c));
    // abajur de pé e violão no pedestal
    st.tube([W - 0.35, 0, 4.35], [W - 0.35, 1.55, 4.35], 0.02, 0.02, 6, C.dark); st.tube([W - 0.35, 1.45, 4.35], [W - 0.35, 1.75, 4.35], 0.17, 0.11, 10, hex(0xf2c14e), 0, { cap: false }); st.ball([W - 0.35, 1.55, 4.35], 0.06, C.lamp, 2, 6, 3);
    {
      const g0 = [W - 0.4, 0, 0.8];
      st.tube([g0[0] - 0.1, 0, g0[2]], [g0[0] - 0.05, 0.32, g0[2]], 0.012, 0.012, 4, C.dark); st.tube([g0[0] + 0.1, 0, g0[2]], [g0[0] - 0.05, 0.32, g0[2]], 0.012, 0.012, 4, C.dark);
      st.tf = M.mul(M.T(g0[0] - 0.03, 0.12, g0[2]), M.mul(M.RY(-Math.PI / 2), M.RX(0.16)));
      st.ball([0, 0.2, 0], 0.2, hex(0xc8722a), 0, 12, 6, { sz: 0.25 }); st.ball([0, 0.46, 0], 0.15, hex(0xc8722a), 0, 12, 6, { sz: 0.25 });
      st.tube([0, 0.33, -0.052], [0, 0.33, -0.054], 0.05, 0.05, 10, C.black);
      st.box(-0.025, 0.5, -0.03, 0.025, 1.02, 0.01, C.woodT); st.box(-0.04, 1.02, -0.035, 0.04, 1.16, 0.0, C.woodT);
      st.tf = null;
      S(W - 0.65, 0.6, W, 1.05);
    }
    // ---- gôndolas do meio com caixotes ----
    const crates = [];
    const table = (z0, z1) => {
      st.box(-1.35, 0.72, z0, 1.35, 0.77, z1, C.woodD, { top: C.wood });
      for (const [x, z] of [[-1.28, z0 + 0.07], [1.28, z0 + 0.07], [-1.28, z1 - 0.07], [1.28, z1 - 0.07]]) st.box(x - 0.04, 0, z - 0.04, x + 0.04, 0.72, z + 0.04, C.woodD);
      st.box(-1.25, 0.12, z0 + 0.1, 1.25, 0.15, z1 - 0.1, C.woodD);
      [-0.85, 0, 0.85].forEach((bxc, c) => {
        const za = z0 + 0.12, zb = z1 - 0.12, yt = 0.77, wc = 0.2, cc = C.woodL;
        for (const [hy0, hy1] of [[0, 0.1], [0.14, 0.24]]) {
          st.box(bxc - wc - 0.02, yt + hy0, za, bxc - wc, yt + hy1, zb, cc); st.box(bxc + wc, yt + hy0, za, bxc + wc + 0.02, yt + hy1, zb, cc);
          st.box(bxc - wc, yt + hy0, za - 0.02, bxc + wc, yt + hy1, za, cc); st.box(bxc - wc, yt + hy0, zb, bxc + wc, yt + hy1, zb + 0.02, cc);
        }
        fl.box(bxc - wc, yt, za, bxc + wc, yt + 0.01, zb, C.woodT);
        const n = 26, ci = crates.length;
        for (let k = 0; k < n; k++) {
          const z = za + 0.05 + k * ((zb - za - 0.08) / n), ai = bins[(ci * 5 + k * 3) % bins.length];
          thin.tf = M.mul(M.T(bxc, yt + 0.012, z), M.RX(0.2 + Math.sin(k * 1.7 + c) * 0.03));
          thin.box(-0.155, 0, -0.002, 0.155, 0.31, 0.002, k % 5 === 0 ? C.white : colOf(ai));
          thin.tf = null;
        }
        const a0 = bins[(ci * 2) % bins.length];
        thin.tf = M.mul(M.T(bxc, yt + 0.012, za + 0.04), M.RX(0.34));
        thin.box(-0.155, 0, -0.002, 0.155, 0.31, 0.002, C.white);
        dec(thin, [0, 0.155, -0.003], [-1, 0, 0], [0, 1, 0], 0.305, 0.305, T.covers[a0 % NCOV]);
        thin.tf = M.mul(M.T(bxc, yt + 0.012, za + 0.35), M.RX(0.22));
        thin.box(-0.16, 0, -0.002, 0.16, 0.36, 0.002, hex(0xd9c9a0));
        dec(thin, [0, 0.395, -0.003], [-1, 0, 0], [0, 1, 0], 0.2, 0.095, T.tags[[0, 1, 2, 3, 5][ci % 5]]);
        thin.box(-0.1, 0.35, -0.0015, 0.1, 0.445, 0.0015, hex(0xd9c9a0));
        thin.tf = null;
        crates.push({ x: bxc, z: za });
      });
      S(-1.4, z0 - 0.05, 1.4, z1 + 0.05);
    };
    table(3.6, 4.9);
    table(6.5, 7.8);
    // ---- balcão do Seu Vavá (fundo à esquerda), com o rádio de CD em cima ----
    const kz0 = 10.8, kz1 = 11.45;
    st.box(-W + 0.2, 0, kz0, -2.3, 0.95, kz1, hex(0x6b3b24)); st.box(-W + 0.15, 0.95, kz0 - 0.05, -2.25, 1.0, kz1 + 0.05, C.woodT);
    dec(fl, [-4.0, 0.55, kz0 - 0.015], [-1, 0, 0], [0, 1, 0], 1.6, 0.3, T.precos);
    st.box(-2.3, 0, kz1, -2.22, 0.95, 12.45, hex(0x6b3b24));
    st.tf = M.T(-4.75, 1.0, 11.1);
    st.box(-0.21, 0, -0.18, 0.21, 0.12, 0.19, hex(0x7a7f8a)); st.box(-0.19, 0.12, -0.13, 0.19, 0.2, 0.07, hex(0x5a5f6a));
    st.box(-0.17, 0.2, 0.07, 0.17, 0.36, 0.17, hex(0x7a7f8a)); st.box(-0.11, 0.27, 0.065, 0.11, 0.33, 0.07, hex(0x7dff9a), { m: 2 });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) st.box(-0.15 + i * 0.08, 0.2, -0.11 + j * 0.06, -0.1 + i * 0.08, 0.215, -0.07 + j * 0.06, C.white);
    st.tf = null;
    for (let k = 0; k < 6; k++) { thin.tf = M.mul(M.T(-3.9, 1.0 + k * 0.012, 11.15), M.RY(k * 0.09 - 0.2)); thin.box(-0.155, 0, -0.155, 0.155, 0.01, 0.155, k === 5 ? C.white : colOf(k)); thin.tf = null; }
    const BOX = [-2.95, 1.02, 11.1];
    addBox(st, BOX);
    S(-W, kz0 - 0.08, -2.2, kz1 + 0.08); S(-2.32, kz1, -2.2, 12.5);
    st.box(-W + 0.05, 0, 12.55, -2.3, 2.35, D, C.woodD);
    for (const y of [0.15, 0.68, 1.21, 1.74]) {
      fl.box(-W + 0.1, y, 12.62, -2.35, y + 0.33, D - 0.04, C.dark);
      const R = T.spinesLP, off = ((y * 7) % 0.4) * (R[2] - R[0]);
      dec(fl, [(-W + 0.1 - 2.35) / 2, y + 0.165, 12.615], [-1, 0, 0], [0, 1, 0], W - 2.45, 0.33, [R[0] + off, R[1], R[0] + off + (R[2] - R[0]) * 0.6, R[3]]);
      st.box(-W + 0.05, y - 0.03, 12.58, -2.3, y, D, C.wood);
    }
    S(-W, 12.5, -2.25, D);
    dec(fl, [-3.9, 2.9, D - 0.04], [-1, 0, 0], [0, 1, 0], 2.0, 0.25, T.neonD, [1.6, 1.6, 1.6]);
    // TV de tubo num suporte de parede (passa os comerciais da loja); a imagem do vídeo vai por cima da tela
    {
      const tz0 = D - 0.66, tz1 = D - 0.12, grey = hex(0x3a3a42), bez = hex(0x4e4e58);
      st.box(-2.19, 2.11, tz0 + 0.07, -1.31, 2.79, tz1, grey, { top: hex(0x45454e) });
      st.box(-2.19, 2.11, tz0, -1.31, 2.79, tz0 + 0.07, bez);
      st.box(-2.05, 2.2, tz1, -1.45, 2.68, tz1 + 0.07, grey); // traseira do tubo
      thin.box(-2.0, 2.18, tz0 - 0.006, -1.38, 2.66, tz0, hex(0x0c1014), { m: 2 });
      thin.box(-2.15, 2.3, tz0 - 0.008, -2.05, 2.32, tz0, hex(0x8a8a90));
      for (const ky of [2.46, 2.58]) thin.ball([-2.1, ky, tz0 - 0.012], 0.024, hex(0x9a9aa2), 1, 8, 4);
      thin.box(-2.13, 2.19, tz0 - 0.008, -2.07, 2.22, tz0, hex(0xff3a3a), { m: 2 }); // luzinha de ligado
      // suporte: prateleira de ferro presa na parede + mão-francesa
      st.box(-2.1, 2.06, tz0 + 0.05, -1.4, 2.11, D, C.metal, { m: 1 });
      st.tube([-1.75, 1.62, D], [-1.75, 2.06, tz0 + 0.3], 0.028, 0.028, 6, C.metal, 1);
    }
    for (const y of [2.72, 3.08]) st.tube([-4.95, y, D - 0.05], [-2.85, y, D - 0.05], 0.012, 0.012, 4, C.pink, 2);
    // ---- cantinho de audição com caixas de som (fundo, no meio) ----
    const mz = 12.25, TT = [-0.42, 0.82, mz], CDP = [0.42, 0.82, mz];
    st.box(-0.95, 0, mz - 0.5, 0.95, 0.82, mz + 0.5, C.woodD, { top: C.woodT });
    st.box(-0.9, 0.12, mz - 0.52, -0.02, 0.75, mz - 0.5, C.wood); st.box(0.02, 0.12, mz - 0.52, 0.9, 0.75, mz - 0.5, C.wood);
    addTT(st, TT); addCDP(st, CDP);
    for (const x of [-1.5, 1.04]) {
      st.box(x, 0, mz - 0.25, x + 0.46, 1.05, mz + 0.25, hex(0x2a2226));
      st.tube([x + 0.23, 0.36, mz - 0.251], [x + 0.23, 0.36, mz - 0.27], 0.16, 0.16, 14, C.black); st.ball([x + 0.23, 0.36, mz - 0.265], 0.06, hex(0x3a3a44), 0, 8, 4, { sz: 0.4 });
      st.tube([x + 0.23, 0.8, mz - 0.251], [x + 0.23, 0.8, mz - 0.265], 0.06, 0.06, 10, C.black); st.ball([x + 0.23, 0.8, mz - 0.265], 0.03, C.metal, 1, 6, 3, { sz: 0.4 });
    }
    S(-1.55, mz - 0.55, 1.55, D);
    dec(fl, [0, 2.05, D - 0.04], [-1, 0, 0], [0, 1, 0], 1.5, 0.28, T.ouca);
    st.box(-0.6, 1.32, D - 0.07, -0.56, 1.36, D, C.metal);
    // ---- três cabines de audição (fundo à direita) ----
    const booths = [];
    [2.35, 3.55, 4.75].forEach((bx, k) => {
      const z0 = 11.15, z1 = 12.45;
      const door = addBooth(st, fl, thin, bx, z0, z1);
      const bTT = [bx, 0.86, z1 - 0.29], bCD = [bx, 1.25, z1 - 0.22];
      addTT(st, bTT); addCDP(st, bCD);
      S(bx - 0.6, z0, bx - 0.47, z1); S(bx + 0.47, z0, bx + 0.6, z1); S(bx - 0.6, z1 - 0.5, bx + 0.6, D);
      booths.push({ k, bx, z0, z1, w: 0.55, TT: bTT, CDP: bCD, hook: [bx + 0.44, 1.5, z1 - 0.47], doorM: door });
    });
    // cartazes, planta, ventilador e luzes
    dec(fl, [-W + 0.01, 1.75, 0.95], [0, 0, -1], [0, 1, 0], 0.5, 0.75, T.posters[2]);
    dec(fl, [W - 0.01, 2.1, 2.4], [0, 0, 1], [0, 1, 0], 0.5, 0.75, T.posters[1]);
    dec(fl, [1.5, 2.65, D - 0.04], [-1, 0, 0], [0, 1, 0], 0.45, 0.68, T.posters[0]);
    dec(fl, [-0.95, 1.65, 0.005], [1, 0, 0], [0, 1, 0], 0.4, 0.2, T.tags[7]);
    st.tube([-W + 0.45, 0, 2.6], [-W + 0.45, 0.36, 2.6], 0.16, 0.2, 10, C.terra);
    for (let k = 0; k < 7; k++) { const a = k * 0.9; st.ball([-W + 0.45 + Math.cos(a) * 0.14, 0.62 + (k % 3) * 0.16, 2.6 + Math.sin(a) * 0.14], 0.16, C.green, 0, 6, 4, { sy: 1.4 }); }
    S(-W, 2.35, -W + 0.75, 2.85);
    st.tube([0, 3.4, 5.6], [0, 3.08, 5.6], 0.02, 0.02, 6, C.dark); st.ball([0, 3.05, 5.6], 0.1, C.dark, 1, 8, 4, { sy: 0.6 });
    tube(st, -0.9, 0.9, 3.14, 4.25); tube(st, -0.9, 0.9, 3.14, 7.15); tube(st, -W + 0.7, -W + 1.9, 3.14, 7.3);
    pendant(st, -3.8, 2.55, 11.1, C.pink); pendant(st, 0, 2.55, 11.6, C.cyan); pendant(st, W - 1.4, 2.5, 2.4, hex(0xf2c14e));
    const lights = [[0, 3.0, 4.25], [0, 3.0, 7.15], [-3.8, 2.5, 11.1], [0, 2.5, 11.6], [W - 1.4, 2.45, 2.4], [W - 0.6, 2.2, 7.6], [-W + 1.3, 2.9, 7.3], [0, 2.2, 0.6], [W - 0.35, 1.6, 4.35]];
    booths.forEach((b) => lights.push([b.bx, 2.05, (b.z0 + b.z1) / 2]));
    // ---- partes que mexem: ventilador, e em cada aparelho o disco, rótulo, braço, gaveta e luz ----
    const up = (m, o) => Rn.upload(m, o);
    const fan = new Mesh();
    for (let k = 0; k < 4; k++) { fan.tf = M.RY((k * Math.PI) / 2); fan.box(0.08, -0.012, -0.07, 0.62, 0.0, 0.07, C.woodL); fan.tf = null; }
    const disc = new Mesh();
    disc.tube([0, 0, 0], [0, 0.003, 0], 0.15, 0.15, 24, C.black, 0, { cap: true });
    dec(disc, [0, 0.0035, 0], [1, 0, 0], [0, 0, -1], 0.3, 0.3, T.vinyl);
    const discG = up(disc);
    const labG = albs.map((a, i) => { const m = new Mesh(); dec(m, [0, 0.0045, 0], [1, 0, 0], [0, 0, -1], 0.1, 0.1, T.labels[i % NLAB]); return up(m, { outline: false }); });
    const arm = new Mesh();
    arm.tube([0, 0, 0], [0, 0, -0.2], 0.006, 0.006, 5, C.metal, 1); arm.tube([0, 0, -0.2], [-0.02, -0.005, -0.235], 0.006, 0.006, 5, C.metal, 1);
    arm.box(-0.035, -0.02, -0.25, -0.005, 0.0, -0.225, C.dark); arm.tube([0, 0, 0], [0, 0, 0.07], 0.012, 0.012, 6, C.metal, 1); arm.tube([0, 0, 0.07], [0, 0, 0.1], 0.025, 0.025, 8, C.dark);
    const armG = up(arm);
    const nowG = albs.map((a, i) => { const m = new Mesh(); m.box(-0.155, 0, -0.004, 0.155, 0.31, 0.0, C.white); dec(m, [0, 0.155, -0.0045], [-1, 0, 0], [0, 1, 0], 0.305, 0.305, T.covers[i % NCOV]); return up(m, { outline: false }); });
    const caseG = albs.map((a, i) => { const m = new Mesh(); m.box(-0.071, 0, -0.012, 0.071, 0.142, 0, hex(0xdfe6ee)); dec(m, [0, 0.071, -0.0125], [-1, 0, 0], [0, 1, 0], 0.124, 0.124, T.covers[i % NCOV]); m.box(-0.071, 0, -0.0128, -0.062, 0.142, -0.012, hex(0xf4f8fc)); return up(m, { outline: false }); });
    const trayG = up(new Mesh().box(-0.075, 0, -0.14, 0.075, 0.008, 0, hex(0x2a2a30)));
    const cdD = new Mesh(); dec(cdD, [0, 0.0105, -0.07], [1, 0, 0], [0, 0, -1], 0.12, 0.12, T.cd);
    const cdDG = up(cdD, { outline: false });
    const ledG = up(new Mesh().box(0.08, 0.045, -0.166, 0.19, 0.075, -0.16, hex(0x7dff9a), { m: 2 }), { outline: false });
    const boxLedG = up(new Mesh().box(-0.08, 0.215, -0.128, 0.06, 0.245, -0.125, hex(0x7dff9a), { m: 2 }), { outline: false });
    const mkDeck = (o) => {
      const d = Object.assign({ objs: {} }, o), O = d.objs;
      if (d.TT) { O.disc = { g: discG, mo: M.I(), tex, hidden: true }; O.lab = { g: labG[0], mo: M.I(), tex, hidden: true }; O.arm = { g: armG, mo: M.I(), inkw: 0.6 }; }
      if (d.stand) O.nowP = { g: nowG[0], mo: M.mul(M.T(d.TT[0], d.TT[1], d.TT[2] + 0.38), M.RX(0.18)), tex, hidden: true };
      if (d.CDP) { O.tray = { g: trayG, mo: M.I(), inkw: 0.6 }; O.cdDisc = { g: cdDG, mo: M.I(), tex, hidden: true }; O.led = { g: d.box ? boxLedG : ledG, mo: M.T(...d.CDP), tint: [0.25, 0.4, 0.3] }; O.case = { g: caseG[0], mo: M.I(), tex, hidden: true }; }
      return d;
    };
    booths.forEach((b) => { b.door = { g: up(b.doorM), mo: M.mul(M.T(b.bx - b.w, 0, b.z0), M.RY(1.75)), a: 1.75 }; delete b.doorM; });
    const decks = [
      mkDeck({ id: "main", TT, CDP, stand: true, pub: true, cam: [0.95, 0.96, -0.72], notes: [[-1.27, 1.15, mz - 0.3], [1.27, 1.15, mz - 0.3]], caseAt: [CDP[0] + 0.32, CDP[1], CDP[2] - 0.05] }),
      ...booths.map((b) => mkDeck({ id: "b" + b.k, TT: b.TT, CDP: b.CDP, booth: b, cam: [0.34, 1.22, -0.72], caseAt: [b.CDP[0] + 0.12, b.CDP[1] + 0.09, b.CDP[2]] })),
      mkDeck({ id: "box", CDP: [BOX[0], BOX[1] + 0.02, BOX[2] - 0.01], box: true, pub: true, cam: [0.8, 0.7, -1.0], notes: [[BOX[0] - 0.24, 1.3, BOX[2] - 0.2], [BOX[0] + 0.24, 1.3, BOX[2] - 0.2]], caseAt: [BOX[0] + 0.55, BOX[1], BOX[2] - 0.05] }),
    ];
    const dyn = {
      fan: { g: up(fan), mo: M.T(0, 3.05, 5.6) },
      heldLP: { g: nowG[0], mo: M.I(), tex, hidden: true },
      heldCD: { g: caseG[0], mo: M.I(), tex, hidden: true },
      flyDisc: { g: discG, mo: M.I(), tex, hidden: true }, flyLab: { g: labG[0], mo: M.I(), tex, hidden: true },
      flySleeve: { g: nowG[0], mo: M.I(), tex, hidden: true }, flyCD: { g: cdDG, mo: M.I(), tex, hidden: true },
    };
    const G = { labG, nowG, caseG };
    const spots = [
      { id: "door", x: 0, z: 0.55, r: 0.62, act: "door", label: "Sair da loja" },
      { id: "lpA", x: 0, z: 3.2, r: 0.95, act: "dig", fmt: "lp", start: 0, label: "Fuçar nas gôndolas", face: [0, 4.2] },
      { id: "lpB", x: 0, z: 6.0, r: 0.7, act: "dig", fmt: "lp", start: 4, label: "Fuçar nas gôndolas", face: [0, 7.0] },
      { id: "cd", x: -W + 0.95, z: 7.3, r: 2.2, act: "dig", fmt: "cd", start: 0, label: "Ver os CDs", face: [-W, 7.3] },
      { id: "box", x: BOX[0], z: kz0 - 0.5, r: 0.5, act: "deck", deck: "box", label: "Rádio de CD", face: [BOX[0], BOX[2]] },
      { id: "vava", x: -4.0, z: kz0 - 0.55, r: 0.8, act: "talk", who: "vava", label: "Falar com o Seu Vavá", face: [-4.0, 12.0] },
      { id: "tt", x: TT[0], z: mz - 0.85, r: 0.48, act: "deck", deck: "main", fmt: "lp", label: "Vitrola", face: [TT[0], TT[2]] },
      { id: "cdp", x: CDP[0], z: mz - 0.85, r: 0.42, act: "deck", deck: "main", fmt: "cd", label: "Aparelho de CD", face: [CDP[0], CDP[2]] },
    ];
    wallSlots.forEach(({ ai, z }) => spots.push({ id: "w" + ai, x: W - 0.95, z, r: Math.min(0.5, wsp / 2), act: "insp", alb: ai, fmt: "lp", label: "Pegar: " + (albs[ai].t || albs[ai].a), face: [W, z] }));
    booths.forEach((b) => spots.push({ id: "b" + b.k, x: b.bx, z: (b.z0 + b.z1) / 2 - 0.15, r: 0.36, act: "deck", deck: "b" + b.k, booth: 1, label: "Cabine", face: [b.bx, D] }));
    chairs.forEach((c, i) => spots.push({ id: "chair" + i, x: c.x - 1.15, z: c.z, r: 0.42, act: "lounge", chair: c, label: "Deitar na poltrona", face: [W, c.z] }));
    return {
      tv: { corners: [[-1.38, 2.66, D - 0.667], [-2.0, 2.66, D - 0.667], [-2.0, 2.18, D - 0.667], [-1.38, 2.18, D - 0.667]], c: [-1.69, 2.42, D - 0.66] },
      id: "discos", name: "VAVÁ DISCOS", W, D, H: 3.4, booths, base: [{ g: up(fl, { outline: false }), tex }, { g: up(st), tex }, { g: up(thin, { outline: false }), tex }], dyn, decks, G, solids, spots, lights, crates, wall, bins,
      npcs: [
        { look: "vava", x: -4.0, z: 12.0, yaw: Math.PI / 2, idle: "calm", who: "vava" },
        { look: "fig12", x: -W + 0.95, z: 5.0, yaw: Math.PI, idle: "browse", who: "cli" },
      ],
      spawn: [0, 1.5, 0],
      scene: { sun: V.norm([0.18, 0.95, 0.22]), top: hex(0x2b2236), mid: hex(0x2b2236), hz: hex(0x2b2236), fog: hex(0x2a1e22), fogd: 0.006, shade: hex(0xb4a4c4), ink: hex(0x1b1530), ink_w: 1.5, amb: [0.98, 0.9, 0.84], night: 0.42, wet: 0, winc: [9, 9, 9] },
    };
  }

  // ---------- lan house ----------
  function buildLan(Rn, tex) {
    const st = new Mesh(), fl = new Mesh(), thin = new Mesh();
    const solids = [];
    const S = (x0, z0, x1, z1) => solids.push([x0, z0, x1, z1]);
    shell(st, fl, { wallLo: C.navyD, wallHi: C.navy, floorA: hex(0x3a4252), floorB: hex(0x343b4a), tile: 1, outside: [hex(0xffe8c0), hex(0xffd29a), hex(0xbfae98)] });
    const pcs = [];
    // bancadas de PC nas duas paredes (4 de cada lado)
    for (const sd of [-1, 1]) {
      const xw = 4 * sd, xd = 3.25 * sd;
      st.box(Math.min(xw, xd), 0.72, 1.55, Math.max(xw, xd), 0.77, 8.45, hex(0xe8e2d0), { side: hex(0xb8b0a0) });
      for (const z of [1.6, 8.4]) st.box(Math.min(xw, xd), 0, z - 0.03, Math.max(xw, xd), 0.72, z + 0.03, hex(0xb8b0a0));
      [2.35, 3.95, 5.55, 7.15].forEach((z, k) => {
        const T0 = M.mul(M.T(3.62 * sd, 0.77, z), M.RY(sd > 0 ? Math.PI : 0));
        st.tf = T0;
        // monitor de tubo (bege), teclado, mouse e gabinete
        st.box(-0.3, 0.02, -0.17, -0.02, 0.36, 0.17, C.beige); st.box(-0.06, 0.0, -0.2, 0.1, 0.4, 0.2, hex(0xe2dac4)); st.box(-0.1, -0.0, -0.09, 0.05, 0.03, 0.09, C.beige);
        st.box(0.2, 0, -0.2, 0.34, 0.025, 0.2, hex(0xd8d0bc)); st.box(0.22, 0.025, 0.24, 0.29, 0.045, 0.29, hex(0xd8d0bc));
        st.tf = M.mul(M.T(3.84 * sd, 0, z + 0.32), M.RY(sd > 0 ? Math.PI : 0));
        st.box(-0.12, 0, -0.1, 0.12, 0.46, 0.1, C.beige); st.box(0.121, 0.36, -0.03, 0.125, 0.38, -0.01, hex(0x7dff9a), { m: 2 });
        st.tf = null;
        // tela acesa
        thin.tf = T0;
        dec(thin, [0.103, 0.2, 0], [0, 0, -1], [0, 1, 0], 0.3, 0.24, T.screens[(k * 2 + (sd > 0 ? 1 : 0)) % 6], [1.35, 1.35, 1.35], 4);
        thin.tf = null;
        // divisória azul e cadeira
        if (k) st.box(Math.min(xw, 3.3 * sd), 0.77, z - 0.82, Math.max(xw, 3.3 * sd), 1.25, z - 0.78, C.blue);
        const cx = 2.78 * sd;
        st.tf = M.mul(M.T(cx, 0, z), M.RY(sd > 0 ? Math.PI : 0));
        st.tube([0, 0.05, 0], [0, 0.42, 0], 0.025, 0.025, 6, C.dark);
        for (let a = 0; a < 5; a++) { const an = (a / 5) * Math.PI * 2; st.tube([0, 0.05, 0], [Math.cos(an) * 0.26, 0.03, Math.sin(an) * 0.26], 0.015, 0.015, 4, C.dark); }
        st.box(-0.22, 0.42, -0.22, 0.22, 0.5, 0.22, hex(0x1b1530)); st.box(0.2, 0.5, -0.2, 0.26, 0.98, 0.2, hex(0x1b1530));
        st.tf = null;
        pcs.push({ sd, z, cx, k });
      });
      S(Math.min(xw, xd) - 0.05, 1.5, Math.max(xw, xd) + 0.05, 8.5);
    }
    // balcão do Dudu, baleiro e estante de jogos
    st.box(-1.6, 0, 8.0, 1.6, 1.0, 8.6, hex(0x2457c8)); st.box(-1.65, 1.0, 7.95, 1.65, 1.05, 8.65, hex(0xe8e2d0));
    dec(fl, [0.9, 0.62, 7.985], [-1, 0, 0], [0, 1, 0], 0.7, 0.33, T.tags[6]);
    st.box(-1.2, 1.05, 8.2, -0.8, 1.38, 8.5, C.beige); dec(thin, [-1.0, 1.22, 8.195], [-1, 0, 0], [0, 1, 0], 0.3, 0.22, T.screens[3], [1.3, 1.3, 1.3]);
    st.tube([0.4, 1.05, 8.3], [0.4, 1.12, 8.3], 0.06, 0.05, 8, C.red); st.ball([0.4, 1.26, 8.3], 0.14, hex(0xcfe8ff), 3, 10, 6);
    for (let k = 0; k < 9; k++) st.ball([0.33 + (k % 3) * 0.07, 1.16 + Math.floor(k / 3) * 0.06, 8.27 + ((k * 7) % 3) * 0.03], 0.028, [C.pink, hex(0xffd23f), C.cyan][k % 3], 0, 5, 3);
    S(-1.7, 7.9, 1.7, 8.7);
    st.box(-3.2, 0, 9.55, 3.2, 2.2, 10, C.navyD);
    for (const y of [0.2, 0.75, 1.3]) {
      fl.box(-3.1, y, 9.6, 3.1, y + 0.3, 9.96, C.dark);
      const R = T.spinesCD, off = ((y * 5) % 0.25) * (R[2] - R[0]);
      dec(fl, [0, y + 0.15, 9.595], [-1, 0, 0], [0, 1, 0], 6.2, 0.3, [R[0] + off, R[1], R[0] + off + (R[2] - R[0]) * 0.75, R[3]]);
      st.box(-3.2, y - 0.03, 9.57, 3.2, y, 10, hex(0x3a4a7a));
    }
    S(-3.3, 9.5, 3.3, 10);
    dec(fl, [0, 2.72, 9.96], [-1, 0, 0], [0, 1, 0], 2.2, 0.55, T.neonL, [1.6, 1.6, 1.6]);
    for (const y of [2.42, 3.02]) st.tube([-1.15, y, 9.95], [1.15, y, 9.95], 0.012, 0.012, 4, C.cyan, 2);
    // fliperama perto da porta
    {
      st.tf = M.mul(M.T(-3.45, 0, 0.95), M.RY(0));
      st.box(-0.3, 0, -0.32, 0.3, 1.75, 0.32, hex(0x8c5cff)); st.box(0.3, 0.85, -0.3, 0.48, 0.95, 0.3, hex(0x1b1530));
      st.box(0.3, 1.0, -0.26, 0.32, 1.4, 0.26, C.black); st.box(0.3, 1.55, -0.3, 0.36, 1.72, 0.3, hex(0xffd23f), { m: 2 });
      st.ball([0.4, 0.98, 0.1], 0.035, C.red, 0, 6, 3); st.tube([0.4, 0.95, -0.1], [0.4, 1.02, -0.1], 0.01, 0.01, 4, C.dark); st.ball([0.4, 1.03, -0.1], 0.025, C.red, 0, 6, 3);
      st.tf = null;
      dec(thin, [-3.125, 1.2, 0.95], [0, 0, -1], [0, 1, 0], 0.48, 0.36, T.screens[2], [1.4, 1.4, 1.4]);
      S(-3.8, 0.6, -3.0, 1.3);
    }
    // sofá e pufes no fundo à direita? cartazes e luz
    dec(fl, [2.4, 1.85, 9.96], [-1, 0, 0], [0, 1, 0], 0.5, 0.75, T.posters[3]);
    dec(fl, [-2.4, 1.85, 9.96], [-1, 0, 0], [0, 1, 0], 0.5, 0.75, T.posters[2]);
    dec(fl, [-0.95, 1.65, 0.005], [1, 0, 0], [0, 1, 0], 0.4, 0.2, T.tags[7]);
    st.box(3.3, 2.5, 4.4, 4, 2.85, 5.4, C.white); st.box(3.29, 2.55, 4.45, 3.3, 2.6, 5.35, hex(0x9aa0aa));
    for (const z of [2.6, 5.4]) { tube(st, -2.0, -0.4, 3.04, z); tube(st, 0.4, 2.0, 3.04, z); }
    for (let k = 0; k < 6; k++) st.box(-3.95, 0.02, 1.3 + k * 1.3, -3.85, 0.06, 1.35 + k * 1.3, hex(0x1b1530));
    const lights = [[-1.2, 2.9, 2.6], [1.2, 2.9, 2.6], [-1.2, 2.9, 5.4], [1.2, 2.9, 5.4], [0, 2.6, 8.4], [-3.4, 1.6, 1.0]];
    const base = [
      { g: Rn.upload(fl, { outline: false }), tex },
      { g: Rn.upload(st), tex },
      { g: Rn.upload(thin, { outline: false }), tex },
    ];
    const spots = [
      { id: "door", x: 0, z: 0.55, r: 0.62, act: "door", label: "Sair da lan" },
      { id: "dudu", x: 0, z: 7.3, r: 1.0, act: "talk", who: "dudu", label: "Falar com o Dudu", face: [0, 9] },
      { id: "fli", x: -2.6, z: 0.95, r: 0.7, act: "pc", game: "inv", label: "Jogar no fliperama", face: [-4, 0.95] },
    ];
    // PCs livres (os outros têm gente jogando)
    const busy = new Set([1, 6]);
    pcs.forEach((p, i) => { if (!busy.has(i)) spots.push({ id: "pc" + i, x: p.cx - p.sd * 0.55, z: p.z, r: 0.55, act: "pc", pc: p, game: ["rush", "snake", "inv"][i % 3], label: "Sentar e jogar", face: [p.sd * 4, p.z] }); });
    return {
      id: "lan", name: "LAN HOUSE MEGABYTE", W: 4, D: 10, H: 3.3, base, dyn: {}, decks: [], solids, spots, lights, pcs,
      npcs: [
        { look: "dudu", x: 0, z: 9.05, yaw: Math.PI / 2, idle: "bounce", who: "dudu" },
        { look: "fig7", x: pcs[1].cx, z: pcs[1].z, yaw: pcs[1].sd > 0 ? 0 : Math.PI, idle: "play" },
        { look: "fig23", x: pcs[6].cx, z: pcs[6].z, yaw: pcs[6].sd > 0 ? 0 : Math.PI, idle: "play" },
        { look: "fig33", x: pcs[6].cx - 0.75, z: pcs[6].z + 0.45, yaw: 0.25, idle: "watch" },
      ],
      spawn: [0, 1.5, 0],
      scene: { sun: V.norm([0.18, 0.95, 0.22]), top: hex(0x1a1e2e), mid: hex(0x1a1e2e), hz: hex(0x1a1e2e), fog: hex(0x161a28), fogd: 0.006, shade: hex(0xa8b0d0), ink: hex(0x0f0d1e), ink_w: 1.5, amb: [0.9, 0.94, 1.02], night: 0.38, wet: 0, winc: [9, 9, 9] },
    };
  }

  // falas de quem trabalha lá
  const LINES = {
    vava: [
      "Vinil é que nem skate, menino: tem que cuidar, senão empena.",
      "Esse do prisma é clássico. Põe na vitrola e escuta de olho fechado.",
      "Pode fuçar à vontade, só não deixa digital no vinil, hein!",
      "Tem disco chegando semana que vem. Me fala o que você quer que eu encomendo.",
      "O CD é prático, mas o chiadinho do vinil... não tem igual.",
      "Seu skate tá bem ali na porta, ninguém mexe. Aqui é família.",
    ],
    dudu: [
      "E aí, mano! Escolhe um PC aí, a ficha é por minha conta.",
      "O 3 tá com o mouse meio ruim, mas dá pra jogar de boa.",
      "Sábado tem campeonato, bora montar um time?",
      "Depois que fechar aqui eu vou pra pista, me espera!",
      "Se o PC travar é só dar um tapinha no gabinete. Brincadeira... ou não.",
    ],
  };
  return { T, makeTex, buildDiscos, buildLan, coverURL, labelURL, drawCover, palOf, LINES, phoneMesh };
})();
