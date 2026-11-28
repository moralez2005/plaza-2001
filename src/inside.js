// Dentro das lojas: a loja de discos e a lan house viram salas de verdade. O skatista desce do
// skate, encosta a prancha na porta e anda lá dentro. Aqui ficam a textura própria das salas
// (capas, rótulos, vinil, lombadas, cartazes e placas, tudo desenhado em canvas) e a montagem
// das duas salas: paredes, móveis, discos, PCs, luzes e os pontos onde dá pra mexer nas coisas.
"use strict";
const INSIDE = (() => {
  const { V, M, hex, Mesh } = E;
  // textura 2048 × 1024: a metade esquerda tem móveis, placas e cartazes; a direita, capas e rótulos (até 40 discos)
  const TW = 2048, TH = 2048, NCOV = 40, NLAB = 48; // metade de baixo (y >= 1024): placas do Aloha Club
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
    fNeon: RR(0, 1024, 1024, 192), fBar: RR(1024, 1024, 512, 256), fDJ: RR(1536, 1024, 512, 128), fSnack: RR(1536, 1152, 512, 64), fWelcome: RR(1536, 1216, 512, 64),
    sMenu: RR(1024, 832, 512, 192), sNeon: RR(1536, 832, 512, 64), sPicole: RR(1536, 896, 512, 64), sSabor: RR(1536, 960, 512, 64),
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
    // sorveteria: quadro de preços (giz), neon, adesivo do freezer de picolé e plaquinha de sabores
    {
      const [x, y, w, h] = P(T.sMenu);
      g.fillStyle = "#7a4a2a"; g.fillRect(x, y, w, h); g.fillStyle = "#1f3a2e"; g.fillRect(x + 8, y + 8, w - 16, h - 16);
      g.textBaseline = "middle"; g.fillStyle = "#ffe3f3"; g.font = "900 30px Rubik, Arial Black, sans-serif"; g.textAlign = "center"; g.fillText("SORVETES", x + w / 2, y + 30);
      g.font = "700 19px Rubik, Arial, sans-serif";
      const L = [["Casquinha 1 bola", "1,50"], ["Casquinha 2 bolas", "2,50"], ["Taça c/ calda", "4,00"], ["Milk-shake", "3,50"], ["Picolé de fruta", "1,00"], ["Açaí na tigela", "5,00"]];
      L.forEach(([n, v], i) => { const cx = x + 22 + (i % 2) * (w / 2), cy = y + 70 + Math.floor(i / 2) * 38; g.textAlign = "left"; g.fillStyle = "#f4f1e6"; g.fillText(n, cx, cy); g.textAlign = "right"; g.fillStyle = "#ffd23f"; g.fillText("R$ " + v, cx + w / 2 - 40, cy); });
    }
    { const [x, y, w, h] = P(T.sNeon); sign(g, x, y, w, h, "SORVETERIA PINGUIM", null, "#e6fbff", 42, "#3fd0ff"); }
    { const [x, y, w, h] = P(T.sPicole); sign(g, x, y, w, h, "PICOLÉ GELADINHO", "#2457c8", "#ffffff", 34); }
    { const [x, y, w, h] = P(T.sSabor); sign(g, x, y, w, h, "FLOCOS · CHOCOLATE · MORANGO · LIMÃO · CREME", "#fff7e8", "#c8287a", 22); }
    // Aloha Club: neon da casa, quadro do bar, faixa da cabine do DJ e plaquinhas
    { const [x, y, w, h] = P(T.fNeon); sign(g, x, y, w, h * 0.62, "ALOHA CLUB", null, "#fff0fa", 120, "#ff4fa3"); sign(g, x, y + h * 0.6, w, h * 0.4, "✿ LUAU TODA SEXTA ✿", null, "#e6fbff", 52, "#3fd0ff"); }
    {
      const [x, y, w, h] = P(T.fBar);
      g.fillStyle = "#6a4422"; g.fillRect(x, y, w, h); g.fillStyle = "#1e2a24"; g.fillRect(x + 10, y + 10, w - 20, h - 20);
      g.textBaseline = "middle"; g.textAlign = "center"; g.fillStyle = "#ffd23f"; g.font = "900 36px Rubik, Arial Black, sans-serif"; g.fillText("BAR DO KIKO", x + w / 2, y + 42);
      g.font = "700 24px Rubik, Arial, sans-serif";
      [["Refri lata", "1,50"], ["Suco de maracujá", "2,00"], ["Água de coco", "2,50"], ["Coquetel de frutas", "3,00"], ["Pastel / coxinha", "1,00"]].forEach(([n, v], i) => { const cy = y + 92 + i * 32; g.textAlign = "left"; g.fillStyle = "#f4f1e6"; g.fillText(n, x + 34, cy); g.textAlign = "right"; g.fillStyle = "#7dff9a"; g.fillText(v, x + w - 34, cy); });
    }
    { const [x, y, w, h] = P(T.fDJ); g.fillStyle = "#14121c"; g.fillRect(x, y, w, h); sign(g, x, y, w, h, "DJ LUSKINHA", null, "#f0ecff", 70, "#8c5cff"); }
    { const [x, y, w, h] = P(T.fSnack); sign(g, x, y, w, h, "SALGADINHOS · PODE PEGAR", "#ffd23f", "#1b1530", 30); }
    { const [x, y, w, h] = P(T.fWelcome); sign(g, x, y, w, h, "ALOHA! ✿ BEM-VINDOS", "#2fae6a", "#ffffff", 32); }
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
    neide: [
      "Calor desse jeito, o freezer não dá conta. Hoje o flocos tá saindo que nem água.",
      "Pode sentar na mesinha, fica à vontade.",
      "Vocês da pista passam aqui todo fim de tarde. Já sei o pedido de cada um.",
      "No verão o de limão é o mais pedido. Mas flocos nunca sai de moda.",
    ],
    dudu: [
      "E aí, mano! Escolhe um PC aí, a ficha é por minha conta.",
      "O 3 tá com o mouse meio ruim, mas dá pra jogar de boa.",
      "Sábado tem campeonato, bora montar um time?",
      "Depois que fechar aqui eu vou pra pista, me espera!",
      "Se o PC travar é só dar um tapinha no gabinete. Brincadeira... ou não.",
    ],
  };

  // ---------- Sorveteria Pinguim (onde o K.F. leva a Julie) ----------
  function buildSorveteria(Rn, tex) {
    const st = new Mesh(), fl = new Mesh(), thin = new Mesh();
    const W = 4, D = 9, H = 3.2, solids = [];
    const S = (x0, z0, x1, z1) => solids.push([x0, z0, x1, z1]);
    const mint = hex(0xbfeee0), cream = hex(0xfff7e8), pink = hex(0xff9ccf), pinkD = hex(0xe06aa8), white = hex(0xf6f6f2), blue = hex(0x2457c8);
    shell(st, fl, { wallLo: pinkD, wallHi: hex(0xfde6ef), floorA: mint, floorB: cream, tile: 0.5, W, D, H, outside: [hex(0xffe8c0), hex(0xffd29a), hex(0xbfae98)] });
    // ---- balcão-vitrine de sorvete (freezer com vidro curvo e as cubas de sabor) ----
    const cz0 = 5.3, cz1 = 6.0, cx0 = -3.0, cx1 = 2.2;
    st.box(cx0, 0, cz0, cx1, 0.85, cz1, white, { top: hex(0xe8e8e4) });
    st.box(cx0, 0.42, cz0 - 0.005, cx1, 0.5, cz0, pink);
    thin.box(cx0 + 0.05, 0.85, cz0 + 0.12, cx1 - 0.05, 1.22, cz0 + 0.16, hex(0xcfe8ff), { m: 3 });
    thin.box(cx0 + 0.05, 1.22, cz0 + 0.14, cx1 - 0.05, 1.25, cz1 - 0.1, hex(0xcfe8ff), { m: 3 });
    st.box(cx0, 0.85, cz1 - 0.1, cx1, 1.27, cz1, white);
    const flav = [0xf8f2e6, 0x5a3424, 0xff8fb0, 0xa8e07a, 0xfff0a0, 0x7a3aa8, 0xffb070, 0xd8f0ff, 0xc8282a, 0x3a2418];
    for (let i = 0; i < 10; i++) {
      const x = cx0 + 0.18 + i * ((cx1 - cx0 - 0.36) / 9.4), c = hex(flav[i]);
      st.box(x - 0.2, 0.85, cz0 + 0.2, x + 0.2, 0.9, cz1 - 0.15, hex(0xc8ccd4), { m: 1 });
      st.box(x - 0.18, 0.88, cz0 + 0.22, x + 0.18, 0.95, cz1 - 0.17, c);
      st.ball([x - 0.05, 0.96, cz0 + 0.38], 0.07, c, 0, 7, 4, { sy: 0.6 }); st.ball([x + 0.07, 0.95, cz0 + 0.45], 0.06, c, 0, 7, 4, { sy: 0.6 });
      if (i === 0) for (const [dx, dz] of [[-0.06, 0.34], [0.05, 0.42], [0.1, 0.36], [-0.02, 0.47]]) st.ball([x + dx, 0.995, cz0 + dz], 0.012, hex(0x2a1810), 2, 4, 3); // flocos
    }
    dec(fl, [-0.4, 0.62, cz0 - 0.012], [-1, 0, 0], [0, 1, 0], 2.6, 0.32, T.sSabor);
    S(cx0, cz0, cx1, cz1);
    // ---- balcão de trás: casquinhas, máquina de milk-shake e caixa registradora ----
    st.box(-3.6, 0, 8.25, 3.6, 0.92, D, cream, { top: hex(0xf0e2d0) }); S(-3.6, 8.25, 3.6, D);
    for (let k = 0; k < 6; k++) st.tube([-2.8 + k * 0.07, 0.92, 8.55], [-2.8 + k * 0.07, 1.12, 8.55], 0.01, 0.035, 6, hex(0xd8a25a));
    st.tube([-2.05, 0.92, 8.6], [-2.05, 1.35, 8.6], 0.09, 0.09, 10, hex(0xb8bcc4), 1); st.box(-2.15, 1.35, 8.5, -1.95, 1.45, 8.7, pink);
    for (let k = 0; k < 3; k++) st.tube([-1.7 + k * 0.16, 0.92, 8.55], [-1.7 + k * 0.16, 1.1, 8.55], 0.045, 0.06, 8, hex([0xff8fb0, 0xf8f2e6, 0x5a3424][k]));
    st.box(1.4, 0.92, 8.4, 1.85, 1.12, 8.8, hex(0x9a9aa2)); st.box(1.45, 1.12, 8.6, 1.8, 1.25, 8.8, hex(0x7a7a84)); thin.box(1.5, 1.14, 8.399, 1.75, 1.2, 8.4, hex(0x7dff9a), { m: 2 });
    dec(fl, [0, 2.15, D - 0.04], [-1, 0, 0], [0, 1, 0], 2.4, 0.9, T.sMenu);
    dec(fl, [-W + 0.04, 2.6, 4.6], [0, 0, -1], [0, 1, 0], 2.4, 0.3, T.sNeon, [1.6, 1.6, 1.6]);
    // ---- freezer horizontal de picolé (parede esquerda) ----
    st.box(-W, 0, 2.0, -W + 0.8, 0.82, 3.5, white, { top: hex(0xe4e4e0) });
    thin.box(-W + 0.08, 0.82, 2.08, -W + 0.72, 0.835, 3.42, hex(0xbfe0ff), { m: 3 });
    for (let k = 0; k < 7; k++) { const c = hex([0xff6a6a, 0xffd23f, 0x7ae07a, 0xff9ccf, 0x8c5cff, 0xff9a3a, 0x3fd0ff][k]); st.box(-W + 0.15 + (k % 3) * 0.2, 0.6, 2.2 + k * 0.17, -W + 0.27 + (k % 3) * 0.2, 0.8, 2.26 + k * 0.17, c); }
    dec(fl, [-W + 0.81, 0.55, 2.75], [0, 0, -1], [0, 1, 0], 1.2, 0.15, T.sPicole);
    S(-W, 2.0, -W + 0.8, 3.5);
    // ---- mesinhas redondas com cadeiras de plástico ----
    const tables = [[2.1, 2.0], [2.1, 3.9]];
    for (const [tx, tz] of tables) {
      st.tube([tx, 0, tz], [tx, 0.72, tz], 0.04, 0.04, 8, C.metal, 1); st.tube([tx, 0, tz], [tx, 0.03, tz], 0.25, 0.25, 12, C.metal, 1);
      st.tube([tx, 0.72, tz], [tx, 0.75, tz], 0.42, 0.42, 16, white);
      thin.box(tx - 0.05, 0.75, tz - 0.05, tx + 0.05, 0.86, tz + 0.05, hex(0xf4f4f4)); // porta-guardanapo
      for (const sd of [-1, 1]) {
        st.tf = M.mul(M.T(tx + sd * 0.72, 0, tz), M.RY(sd > 0 ? Math.PI : 0));
        const red = hex(0xe0302b);
        st.box(-0.2, 0.42, -0.2, 0.2, 0.46, 0.2, red);
        for (const [lx, lz] of [[-0.17, -0.17], [-0.17, 0.17], [0.17, -0.17], [0.17, 0.17]]) st.box(lx - 0.02, 0, lz - 0.02, lx + 0.02, 0.42, lz + 0.02, red);
        st.box(-0.22, 0.46, -0.2, -0.18, 0.86, 0.2, red);
        st.tf = null;
      }
      S(tx - 0.45, tz - 0.45, tx + 0.45, tz + 0.45);
    }
    // ---- mascote na porta: um pinguim de cachecol segurando uma casquinha ----
    {
      const px = -2.4, pz = 1.0, blk = hex(0x1d2130), wht = hex(0xf8f8f4), org = hex(0xff9a3a), sc = hex(0xff4fa3);
      st.tube([px, 0, pz], [px, 0.08, pz], 0.32, 0.32, 12, hex(0x3fd0ff));
      st.ball([px, 0.62, pz], 0.3, blk, 0, 10, 7, { sy: 1.6 }); st.ball([px + 0.08, 0.6, pz], 0.24, wht, 0, 10, 7, { sy: 1.5, sx: 0.9 });
      st.ball([px, 1.12, pz], 0.21, blk, 0, 10, 7); st.ball([px + 0.15, 1.13, pz], 0.12, wht, 0, 8, 5, { sx: 0.6 });
      for (const ez of [-0.07, 0.07]) { st.ball([px + 0.19, 1.17, pz + ez], 0.035, wht, 2, 6, 4); st.ball([px + 0.215, 1.17, pz + ez], 0.018, blk, 0, 5, 3); }
      st.ball([px + 0.25, 1.09, pz], 0.05, org, 0, 6, 4, { sx: 1.8, sy: 0.6 });
      st.tube([px, 0.96, pz], [px, 1.0, pz], 0.2, 0.2, 12, sc); st.box(px - 0.02, 0.72, pz + 0.12, px + 0.05, 0.98, pz + 0.2, sc);
      for (const ez of [-0.1, 0.1]) st.ball([px + 0.1, 0.12, pz + ez], 0.08, org, 0, 6, 4, { sx: 1.6, sy: 0.4 });
      st.ball([px + 0.02, 0.6, pz - 0.3], 0.08, blk, 0, 6, 4, { sy: 2 });
      st.tube([px + 0.12, 0.6, pz + 0.3], [px + 0.12, 0.8, pz + 0.3], 0.01, 0.05, 7, hex(0xd8a25a)); st.ball([px + 0.12, 0.84, pz + 0.3], 0.06, hex(0xff8fb0), 0, 7, 5);
      S(px - 0.35, pz - 0.35, px + 0.35, pz + 0.35);
    }
    // ---- teto: ventilador e pendentes coloridos ----
    for (const [x, z, c] of [[-1.6, 4.6, C.pink], [0.6, 4.6, C.cyan], [2.1, 3.0, hex(0xffd23f)]]) pendant(st, x, 2.2, z, c);
    st.tube([0, H, 2.8], [0, H - 0.35, 2.8], 0.02, 0.02, 6, C.metal, 1);
    const fan = new Mesh(); fan.ball([0, 0, 0], 0.08, white, 1, 8, 4); for (let k = 0; k < 4; k++) { fan.tf = M.RY(k * Math.PI / 2); fan.box(0.08, -0.01, -0.06, 0.7, 0.0, 0.06, hex(0xf0e2d0)); } fan.tf = null;
    const up = (m, o) => Rn.upload(m, o);
    const lights = [[-1.6, 2.2, 4.6], [0.6, 2.2, 4.6], [2.1, 2.2, 3.0], [0, 2.9, 7.5], [-3, 2.6, 2.7], [0, 2.4, 0.6]];
    const spots = [
      { id: "door", x: 0, z: 0.55, r: 0.62, act: "door", label: "Sair da sorveteria" },
      { id: "balcao", x: -0.5, z: 4.75, r: 0.7, act: "order", label: "Pedir sorvete", face: [-0.5, 5.6] },
      { id: "picole", x: -W + 1.25, z: 2.75, r: 0.6, act: "picole", label: "Pegar um picolé", face: [-W, 2.75] },
      { id: "neide", x: 1.2, z: 4.75, r: 0.55, act: "talk", who: "neide", label: "Falar com a Neide", face: [1.2, 6.8] },
      ...tables.map(([tx, tz], i) => ({ id: "mesa" + i, x: tx - 1.15, z: tz, r: 0.42, act: "seat", at: [tx - 0.72, tz], yaw: 0, label: "Sentar na mesinha", face: [tx, tz] })),
    ];
    return {
      id: "sorveteria", name: "SORVETERIA PINGUIM", W, D, H, base: [{ g: up(fl, { outline: false }), tex }, { g: up(st), tex }, { g: up(thin, { outline: false }), tex }],
      dyn: { fanS: { g: up(fan), mo: M.T(0, H - 0.35, 2.8) } }, decks: [], solids, spots, lights, tables,
      npcs: [
        { look: "neide", x: 0.4, z: 6.8, yaw: Math.PI / 2, idle: "calm", who: "neide" },
        { look: "julie", x: 0.35, z: 4.55, yaw: -Math.PI / 2 + 0.25, idle: "calm", who: "julie", julie: 1 },
        { look: "npc7", x: 2.1 + 0.72, z: 3.9, yaw: Math.PI, idle: "seat" },
      ],
      spawn: [0, 1.5, 0],
      scene: { sun: V.norm([0.18, 0.95, 0.22]), top: hex(0xfde6ef), mid: hex(0xfde6ef), hz: hex(0xfde6ef), fog: hex(0xfde6ef), fogd: 0.004, shade: hex(0xd4b4cc), ink: hex(0x1b1530), ink_w: 1.5, amb: [0.92, 0.88, 0.88], night: 0.36, wet: 0, winc: [9, 9, 9] },
    };
  }
  // ---------- Aloha Club: a festa do DJ Luskinha (dois andares, decoração havaiana) ----------
  // térreo: entrada com tochas, pista de luz no meio, palco com a cabine do DJ no fundo, bar embaixo do mezanino da
  // direita, mesa de salgadinhos embaixo do da esquerda; em cima, mezanino em U com guarda-corpo, mesinhas altas e
  // gente olhando a pista. Teto alto com cordão de luzinhas, folhas de palmeira penduradas e o globo.
  function buildFesta(Rn, tex) {
    const st = new Mesh(), fl = new Mesh(), thin = new Mesh();
    const W = 8.5, D = 20, H = 7.2, MY = 3.4, MX = 5.9, MZ0 = 7.0, MZB = 17.6, solids = [], solidsUp = [];
    const SU = (x0, z0, x1, z1) => solidsUp.push([x0, z0, x1, z1]);
    const S = (x0, z0, x1, z1) => solids.push([x0, z0, x1, z1]);
    const bamboo = hex(0xc8a05a), bambooD = hex(0x8a6a32), wood = hex(0x5a3a22), woodD = hex(0x3a2416), straw = hex(0xd8b870), leaf = hex(0x2f9a4a), leafD = hex(0x1f7a3a);
    const pink = hex(0xff4fa3), cyan = hex(0x3fd0ff), yel = hex(0xffd23f), purple = hex(0x8c5cff), blk = hex(0x16141c);
    shell(st, fl, { wallLo: bambooD, wallHi: hex(0x2a1f4a), floorA: hex(0x3a2418), floorB: hex(0x4a2e1e), tile: 1.0, W, D, H, outside: [hex(0x14123a), hex(0x221c4a), hex(0x2e2a3e)] });
    // bambu no rodapé das paredes
    for (const sx of [-1, 1]) for (let z = 0.15; z < D; z += 0.22) st.tube([sx * (W - 0.03), 0, z], [sx * (W - 0.03), 1.0, z], 0.06, 0.06, 5, ((z * 10) | 0) % 2 ? bamboo : bambooD, 0, { cap: false });
    const leafQ = (m, a, b, w, col) => {
      const d = V.sub(b, a), side = V.mul(V.norm(V.cross(d, [0, 1, 0.01])), w), mid = V.add(a, V.mul(d, 0.45));
      m.tri(a, V.add(mid, side), b, col, 0); m.tri(a, b, V.sub(mid, side), V.mul(col, 0.8), 0);
    };
    // ---- mezanino em U ----
    const deck = (x0, z0, x1, z1) => { st.box(x0, MY - 0.25, z0, x1, MY, z1, woodD, { top: wood }); };
    deck(-W, MZ0, -MX, D); deck(MX, MZ0, W, D); deck(-MX, MZB, MX, D);
    for (const [x, z] of [[-MX, MZ0], [-MX, 10.5], [-MX, 14.0], [-MX, MZB], [MX, MZ0], [MX, 10.5], [MX, 14.0], [MX, MZB], [-2.2, MZB], [2.2, MZB]]) { st.tube([x, 0, z], [x, MY - 0.25, z], 0.11, 0.11, 7, bamboo); S(x - 0.15, z - 0.15, x + 0.15, z + 0.15); }
    // guarda-corpo (borda de dentro do U e as pontas da frente)
    const rail = (a, b) => {
      const L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(1, Math.round(L / 0.6));
      for (let i = 0; i <= n; i++) { const p = V.lerp(a, b, i / n); st.tube(p, [p[0], MY + 1.0, p[2]], 0.025, 0.025, 4, bamboo); }
      st.tube([a[0], MY + 1.0, a[2]], [b[0], MY + 1.0, b[2]], 0.045, 0.045, 6, bambooD); st.tube([a[0], MY + 0.5, a[2]], [b[0], MY + 0.5, b[2]], 0.025, 0.025, 4, bamboo);
    };
    rail([-MX, MY, MZ0], [-MX, MY, MZB]); rail([-MX, MY, MZB], [MX, MY, MZB]); rail([MX, MY, MZB], [MX, MY, MZ0]); rail([MX, MY, MZ0], [W, MY, MZ0]); rail([-W + 1.2, MY, MZ0], [-MX, MY, MZ0]);
    // franja de palha embaixo da borda do mezanino (cara de quiosque) e colares de flor pendurados no guarda-corpo
    for (const [a, b] of [[[-MX, MZ0], [-MX, MZB]], [[-MX, MZB], [MX, MZB]], [[MX, MZB], [MX, MZ0]]]) {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 0.12);
      for (let i = 0; i < n; i++) { const u = i / n, x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u; st.box(x - 0.05, MY - 0.55 - (i % 3) * 0.06, z - 0.05, x + 0.05, MY - 0.25, z + 0.05, i % 2 ? straw : V.mul(straw, 0.85)); }
      for (let k = 0; k < L / 1.6; k++) for (let j = 0; j <= 8; j++) {
        const u = (k * 1.6 + j * 0.15) / L; if (u > 1) break;
        const x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u, sag = Math.sin((j / 8) * Math.PI) * 0.28;
        st.ball([x, MY + 0.98 - sag, z], 0.045, [pink, yel, hex(0xffffff), hex(0xff8a1f)][(j + k) % 4], 0, 5, 3);
      }
    }
    // escada pro mezanino (parede esquerda, sobe da entrada até a ponta do mezanino)
    {
      const n = 15, z0 = 1.2, z1 = MZ0, x0 = -W, x1 = -W + 1.15;
      for (let i = 0; i < n; i++) { const za = z0 + ((z1 - z0) * i) / n, zb = z0 + ((z1 - z0) * (i + 1)) / n, y = (MY * (i + 1)) / n; st.box(x0, 0, za, x1, y, zb, i % 2 ? wood : woodD, { top: hex(0x7a5232) }); }
      for (let i = 0; i <= 6; i++) { const u = i / 6, z = z0 + (z1 - z0) * u, y = MY * u; st.tube([x1, y, z], [x1, y + 0.95, z], 0.022, 0.022, 4, bamboo); }
      st.tube([x1, 0.95, z0], [x1, MY + 0.95, z1], 0.035, 0.035, 5, bambooD);
      S(x1 - 0.02, z0, x1 + 0.08, z1 - 0.6); // corrimão (a escada em si é andável: o jogo calcula a altura)
    }
    // ---- pista com piso de luz (as placas acendem pelo jogo) ----
    const PX0 = -4.5, PZ0 = 6.0, TS = 0.75, NX = 12, NZ = 10;
    st.box(PX0 - 0.12, 0, PZ0 - 0.12, PX0 + NX * TS + 0.12, 0.03, PZ0 + NZ * TS + 0.12, hex(0xb8bcc4), { m: 1 });
    const tileG = new Mesh(); tileG.box(-TS / 2 + 0.03, 0.03, -TS / 2 + 0.03, TS / 2 - 0.03, 0.05, TS / 2 - 0.03, hex(0xffffff), { m: 2 });
    // ---- palco e cabine do DJ ----
    st.box(-3.2, 0, 15.0, 3.2, 0.4, 17.4, blk, { top: hex(0x24202e) });
    st.box(-3.2, 0.04, 14.97, 3.2, 0.1, 15.0, pink, { m: 2 });
    S(-3.2, 15.0, 3.2, 17.4);
    st.box(-1.5, 0.4, 15.35, 1.5, 1.32, 15.85, hex(0x1c1a24), { top: hex(0x2a2632) });
    dec(fl, [0, 0.9, 15.34], [-1, 0, 0], [0, 1, 0], 2.6, 0.65, T.fDJ);
    for (const sx of [-0.78, 0.78]) {
      st.tf = M.T(sx, 1.32, 15.6);
      st.box(-0.3, 0, -0.22, 0.3, 0.08, 0.22, hex(0x2a2a32)); st.tube([0, 0.08, 0], [0, 0.095, 0], 0.17, 0.17, 18, hex(0x101014));
      st.tube([0, 0.095, 0], [0, 0.1, 0], 0.06, 0.06, 10, sx < 0 ? pink : cyan); st.box(0.2, 0.08, 0.1, 0.26, 0.12, 0.16, C.metal, { m: 1 });
      st.tf = null;
    }
    st.box(-0.24, 1.32, 15.42, 0.24, 1.42, 15.78, hex(0x2a2a32));
    for (let k = 0; k < 4; k++) st.box(-0.18 + k * 0.1, 1.42, 15.5, -0.14 + k * 0.1, 1.45, 15.7, [pink, cyan, yel, hex(0x7dff9a)][k], { m: 2 });
    for (const sx of [-1, 1]) {
      const x = sx * 2.75;
      st.box(x - 0.38, 0.4, 15.1, x + 0.38, 2.3, 15.8, blk);
      for (const [y, r] of [[0.85, 0.26], [1.55, 0.26], [2.05, 0.1]]) { st.tube([x, y, 15.09], [x, y, 15.07], r, r, 14, hex(0x2a2832)); st.tube([x, y, 15.07], [x, y, 15.06], r * 0.35, r * 0.35, 10, hex(0x4a4652), 1); }
    }
    // neon da casa no fundo (embaixo do mezanino de trás) e coqueiros de neon dos lados
    dec(fl, [0, 2.3, D - 0.04], [-1, 0, 0], [0, 1, 0], 4.6, 0.86, T.fNeon, [1.6, 1.6, 1.6]);
    const neonPalm = (m, x, y, z, nx, s = 1) => {
      // tronco curvo verde-água e folhas cor-de-rosa (tubos acesos)
      let p = [x, y, z];
      for (let i = 0; i < 6; i++) { const q = [x + Math.sin(i * 0.25) * 0.12 * s, y + (i + 1) * 0.28 * s, z]; m.tube(p, q, 0.03, 0.03, 5, hex(0x5fe0c0), 2, { cap: false }); p = q; }
      for (let k = 0; k < 6; k++) { const tip = [p[0] + (k - 2.5) * 0.24 * s, p[1] + Math.sin(k * 1.1) * 0.12 - 0.15 * s, p[2] - 0.04], mid = [(p[0] + tip[0]) / 2, p[1] + 0.12 * s, p[2] - 0.04]; m.tube(p, mid, 0.025, 0.025, 4, pink, 2); m.tube(mid, tip, 0.025, 0.02, 4, pink, 2); }
      void nx;
    };
    neonPalm(thin, 4.6, 0.45, D - 0.08, 0, 1.0); neonPalm(thin, -4.6, 0.45, D - 0.08, 0, 1.0);
    // ---- bar do Kiko (embaixo do mezanino da direita) ----
    {
      const x0 = 6.1, x1 = 6.65, z0 = 8.5, z1 = 15.5;
      st.box(x0, 0, z0, x1, 1.08, z1, bamboo, { top: hex(0x6a4422) });
      for (let z = z0 + 0.1; z < z1; z += 0.16) st.tube([x0 - 0.01, 0, z], [x0 - 0.01, 1.0, z], 0.045, 0.045, 5, ((z * 7) | 0) % 2 ? bamboo : bambooD, 0, { cap: false });
      S(x0, z0, x1, z1);
      st.box(W - 0.45, 0, z0, W, 0.9, z1, woodD, { top: wood });
      for (let k = 0; k < 2; k++) st.box(W - 0.4, 1.4 + k * 0.5, z0, W, 1.44 + k * 0.5, z1, wood);
      const bc = [0x2fae6a, 0xff8a1f, 0xffd23f, 0x3fd0ff, 0xff4fa3, 0x8a5a2a, 0xe0302b, 0xf4f4f4];
      for (let k = 0; k < 2; k++) for (let i = 0; i < 31; i++) { const z = z0 + 0.15 + i * 0.22, y = 1.44 + k * 0.5, c = hex(bc[(i * 3 + k) % bc.length]); st.tube([W - 0.22, y, z], [W - 0.22, y + 0.22, z], 0.04, 0.04, 6, c, 3); st.tube([W - 0.22, y + 0.22, z], [W - 0.22, y + 0.3, z], 0.04, 0.014, 6, c, 3); }
      // coco com canudinho, copos e abacaxi no balcão
      for (const [z, k] of [[9.2, 0], [10.8, 1], [12.6, 2], [14.4, 0]]) {
        if (k === 0) { st.ball([6.38, 1.17, z], 0.09, hex(0x5a8a2a), 0, 7, 5); st.tube([6.38, 1.22, z], [6.32, 1.36, z + 0.03], 0.008, 0.008, 3, pink); }
        else if (k === 1) for (let j = 0; j < 3; j++) st.tube([6.35, 1.08, z + j * 0.12], [6.35, 1.22, z + j * 0.12], 0.035, 0.04, 7, [yel, pink, hex(0xff8a1f)][j], 3);
        else { st.ball([6.38, 1.2, z], 0.1, hex(0xf0b030), 0, 7, 5, { sy: 1.3 }); for (let j = 0; j < 5; j++) leafQ(st, [6.38, 1.3, z], [6.38 + Math.cos(j * 1.25) * 0.08, 1.48, z + Math.sin(j * 1.25) * 0.08], 0.03, leaf); }
      }
      dec(fl, [W - 0.04, 2.45, 12.0], [0, 0, 1], [0, 1, 0], 1.6, 0.8, T.fBar);
      for (const z of [9.5, 12.0, 14.5]) pendant(st, 6.4, 2.35, z, [pink, yel, cyan][(z | 0) % 3]);
    }
    // ---- mesa de salgadinhos e refri (embaixo do mezanino da esquerda) ----
    {
      const x0 = -W, x1 = -7.55, z0 = 9.0, z1 = 12.4;
      st.box(x0, 0, z0, x1, 0.82, z1, hex(0xff4fa3), { top: hex(0xfff0f6) });
      for (let z = z0; z < z1; z += 0.3) st.box(x1 - 0.005, 0.5, z, x1 + 0.005, 0.82, z + 0.15, hex(0xffffff));
      S(x0, z0, x1, z1);
      for (const [z, c] of [[9.35, 0xd88a3a], [10.0, 0xe8b840], [10.7, 0xc8702a], [11.4, 0xe8c860]]) {
        st.tube([-8.0, 0.82, z], [-8.0, 0.9, z], 0.14, 0.2, 10, hex(0xf4f4f4));
        for (let j = 0; j < 6; j++) st.ball([-8.0 + Math.cos(j * 1.05) * 0.09, 0.93, z + Math.sin(j * 1.05) * 0.09], 0.045, hex(c), 0, 5, 3);
      }
      for (let j = 0; j < 4; j++) { const z = 11.75 + (j % 2) * 0.16, x = -8.2 + ((j / 2) | 0) * 0.16, c = hex([0x3a1a10, 0x2fae6a, 0xff8a1f, 0x3a1a10][j]); st.tube([x, 0.82, z], [x, 1.1, z], 0.045, 0.045, 7, c, 3); st.tube([x, 1.1, z], [x, 1.2, z], 0.045, 0.018, 7, c, 3); }
      for (let j = 0; j < 4; j++) st.tube([-7.75, 0.82 + j * 0.03, 9.1], [-7.75, 0.85 + j * 0.03, 9.1], 0.04, 0.045, 7, hex(0xf4f4f4));
      dec(fl, [-W + 0.04, 1.4, 10.6], [0, 0, -1], [0, 1, 0], 2.0, 0.25, T.fSnack);
    }
    // ---- entrada: tochas tiki, plantas grandes, mesinhas altas e boas-vindas ----
    for (const sx of [-1, 1]) {
      const x = sx * 2.4, z = 1.0;
      st.tube([x, 0, z], [x, 1.55, z], 0.045, 0.04, 6, bamboo); st.tube([x, 1.5, z], [x, 1.72, z], 0.08, 0.11, 8, woodD);
      thin.ball([x, 1.85, z], 0.08, hex(0xff9a2a), 2, 7, 5, { sy: 1.7 }); thin.ball([x, 1.8, z], 0.05, hex(0xffe14d), 2, 6, 4, { sy: 1.4 });
      S(x - 0.12, z - 0.12, x + 0.12, z + 0.12);
    }
    const plant = (x, z, s = 1) => {
      st.tube([x, 0, z], [x, 0.55 * s, z], 0.22 * s, 0.3 * s, 10, hex(0xb8603a)); st.tube([x, 0.5 * s, z], [x, 0.56 * s, z], 0.31 * s, 0.31 * s, 10, hex(0x9a4a2a));
      for (let k = 0; k < 9; k++) { const a = k * 0.7, r = (0.5 + (k % 3) * 0.18) * s, h = (1.1 + (k % 4) * 0.25) * s; leafQ(st, [x, 0.55 * s, z], [x + Math.cos(a) * r, h, z + Math.sin(a) * r], 0.16 * s, k % 2 ? leaf : leafD); }
      S(x - 0.32 * s, z - 0.32 * s, x + 0.32 * s, z + 0.32 * s);
    };
    plant(-6.4, 0.8); plant(7.6, 0.8); plant(-3.9, 16.6, 0.9); plant(3.9, 16.6, 0.9); plant(7.6, 16.6, 1.1); plant(-7.6, 16.6, 1.1);
    const tables = [[-3.6, 3.4], [3.6, 3.4], [-5.4, 5.0], [5.4, 5.0]];
    for (const [x, z] of tables) { st.tube([x, 0, z], [x, 1.05, z], 0.035, 0.035, 6, C.metal, 1); st.tube([x, 0, z], [x, 0.03, z], 0.22, 0.22, 10, C.metal, 1); st.tube([x, 1.05, z], [x, 1.08, z], 0.32, 0.32, 14, bamboo); S(x - 0.34, z - 0.34, x + 0.34, z + 0.34); }
    dec(fl, [0, 2.65, 0.04], [1, 0, 0], [0, 1, 0], 2.2, 0.28, T.fWelcome);
    // ---- pranchas de surfe nas paredes (lá em cima, acima do mezanino) ----
    for (const sx of [-1, 1]) for (const [k, z] of [[0, 9.5], [1, 12.5], [2, 15.5]]) {
      const x = sx * (W - 0.1), c = [hex(0xff8a1f), cyan, pink][(k + (sx > 0 ? 1 : 0)) % 3];
      st.ball([x, 5.4, z], 0.5, c, 0, 10, 6, { sx: 0.06, sy: 2.4, sz: 0.55 });
      st.box(x - 0.035, 4.35, z - 0.04, x + 0.035, 6.45, z + 0.04, hex(0xffffff));
    }
    // ---- mezanino: mesinhas altas com banquinhos ----
    for (const [x, z] of [[-7.4, 9.6], [-7.4, 13.6], [7.4, 9.6], [7.4, 13.6], [-3.8, 19.0], [3.8, 19.0]]) {
      SU(x - 0.32, z - 0.32, x + 0.32, z + 0.32);
      st.tube([x, MY, z], [x, MY + 1.0, z], 0.03, 0.03, 6, C.metal, 1); st.tube([x, MY + 1.0, z], [x, MY + 1.03, z], 0.28, 0.28, 12, bamboo);
      for (const d of [-0.45, 0.45]) { st.tube([x + (Math.abs(x) > 6 ? 0 : d), MY, z + (Math.abs(x) > 6 ? d : 0)], [x + (Math.abs(x) > 6 ? 0 : d), MY + 0.66, z + (Math.abs(x) > 6 ? d : 0)], 0.025, 0.025, 4, C.metal, 1); st.tube([x + (Math.abs(x) > 6 ? 0 : d), MY + 0.66, z + (Math.abs(x) > 6 ? d : 0)], [x + (Math.abs(x) > 6 ? 0 : d), MY + 0.7, z + (Math.abs(x) > 6 ? d : 0)], 0.16, 0.16, 10, pink); }
    }
    // ---- teto: folhas de palmeira penduradas e o cordão de luzinhas em zigue-zague ----
    for (let k = 0; k < 18; k++) {
      const x = -MX + 0.5 + (k % 9) * 1.35, z = k < 9 ? 6.4 : 14.2, a = k * 1.7;
      for (let j = 0; j < 4; j++) { const b = a + j * 1.57; leafQ(thin, [x, H, z], [x + Math.cos(b) * 0.9, H - 0.75 - (j % 2) * 0.3, z + Math.sin(b) * 0.9], 0.22, j % 2 ? leaf : leafD); }
    }
    const bulbs = [];
    for (let k = 0; k < 8; k++) {
      const z = 4.4 + k * 1.75, a = [-MX, H - 0.5, z], b = [MX, H - 0.5, z + 0.9];
      for (let j = 0; j <= 16; j++) { const u = j / 16, p = V.lerp(a, b, u); p[1] -= Math.sin(u * Math.PI) * 0.6; if (j) thin.tube(V.lerp(a, b, (j - 1) / 16).map((v, i) => (i === 1 ? H - 0.5 - Math.sin(((j - 1) / 16) * Math.PI) * 0.6 : v)), p, 0.006, 0.006, 3, blk, 0, { cap: false }); thin.ball(p, 0.04, [pink, yel, cyan, hex(0x7dff9a), purple][(j + k) % 5], 2, 5, 3); bulbs.push(p); }
    }
    const up = (m, o) => Rn.upload(m, o);
    const tileUp = up(tileG, { outline: false });
    // moving heads no teto (cabeça preta + feixe de luz) e lasers saindo da cabine do DJ
    const headG = up((() => { const m = new Mesh(); m.box(-0.14, -0.1, -0.14, 0.14, 0.12, 0.14, blk); m.tube([0, -0.1, 0], [0, -0.16, 0], 0.1, 0.1, 8, hex(0xffffff), 2); return m; })());
    const beamG = [pink, cyan, purple, yel, hex(0x5fe08a), hex(0xffffff)].map((c) => up((() => { const m = new Mesh(); m.tube([0, 0, 0], [0, -1, 0], 0.04, 0.38, 10, c, 6, { cap: false }); return m; })(), { outline: false }));
    const laserG = [hex(0x5fe08a), pink, cyan].map((c) => up((() => { const m = new Mesh(); m.tube([0, 0, 0], [0, 0, 1], 0.012, 0.012, 4, c, 2); return m; })(), { outline: false }));
    const heads = [], beams = [], lasers = [];
    for (let k = 0; k < 6; k++) { const x = -3.6 + k * 1.44, z = k % 2 ? 8.2 : 11.6; heads.push({ g: headG, mo: M.T(x, H - 0.25, z), x, z }); beams.push({ g: beamG[k], mo: M.I(), x, z, k }); }
    for (let k = 0; k < 6; k++) lasers.push({ g: laserG[k % 3], mo: M.I(), k, hidden: true });
    const floor = [];
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) floor.push({ g: tileUp, mo: M.T(PX0 + (i + 0.5) * TS, 0, PZ0 + (j + 0.5) * TS), tint: [1, 1, 1], i, j });
    // luzes: 0-5 pista (piscam no ritmo), 6-7 palco, 8-10 bar, 11 salgadinho, 12-14 entrada e tochas, 15-18 mezanino, 19 neon do fundo
    const lights = [[-3, 5.6, 7.5], [0, 5.6, 7.5], [3, 5.6, 7.5], [-3, 5.6, 12], [0, 5.6, 12], [3, 5.6, 12], [-1.5, 3.2, 16.2], [1.5, 3.2, 16.2], [6.6, 2.3, 9.6], [6.6, 2.3, 12.2], [6.6, 2.3, 14.6], [-7.6, 2.3, 10.6], [0, 2.4, 1.6], [-2.4, 2.0, 1.0], [2.4, 2.0, 1.0], [-7.2, 5.4, 11], [7.2, 5.4, 11], [-3, 5.4, 18.8], [3, 5.4, 18.8], [0, 2.4, 19.6]];
    const P2 = (x, z) => ({ x, z });
    const spots = [
      { id: "door", x: 0, z: 0.55, r: 0.62, act: "door", label: "Sair da festa" },
      { id: "snack", x: -7.05, z: 10.4, r: 0.6, act: "snack", label: "Pegar um salgadinho", face: [-8.2, 10.4] },
      { id: "bar", x: 5.6, z: 12.0, r: 0.6, act: "drink", label: "Pedir um refri no Kiko", face: [6.6, 12.0] },
      { id: "dj", x: 0, z: 14.55, r: 0.55, act: "talk", who: "lucas", label: "Falar com o DJ Luskinha", face: [0, 16.4] },
    ];
    void P2;
    return {
      id: "festa", name: "ALOHA CLUB", W, D, H, MY, base: [{ g: up(fl, { outline: false }), tex }, { g: up(st), tex }, { g: up(thin, { outline: false }), tex }],
      dyn: { floor, heads, beams, lasers }, decks: [], solids, solidsUp, spots, lights, tables, ball: [0, 10.0], floorRect: [PX0, PZ0, NX, NZ, TS], MX, MZ0, MZB, stairs: [-W, -W + 1.15, 1.2, MZ0],
      npcs: [],
      spawn: [0, 1.5, 0],
      scene: { sun: V.norm([0.18, 0.95, 0.22]), top: hex(0x0c0820), mid: hex(0x0c0820), hz: hex(0x0c0820), fog: hex(0x120a2a), fogd: 0.022, shade: hex(0x2a1a5a), ink: hex(0x05030c), ink_w: 1.5, amb: [0.46, 0.38, 0.7], night: 0.9, wet: 0, winc: [9, 9, 9], uv: 0.85 },
    };
  }
  return { T, makeTex, buildDiscos, buildLan, buildSorveteria, buildFesta, coverURL, labelURL, drawCover, palOf, LINES, phoneMesh };
})();
