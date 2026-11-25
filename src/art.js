// Arte do protótipo: atlas de grafites e placas (desenhado em canvas, tudo original),
// skatistas com esqueleto e IK, prancha e a praça (pistas, escadão, prédios, adereços).
"use strict";
const ART = (() => {
  const { V, M, hex, Mesh, seg, ik } = E;

  // ---------- atlas ----------
  const AW = 2048, AH = 2048;
  const R = (x, y, w, h) => [x / AW, y / AH, (x + w) / AW, (y + h) / AH];
  const RECT = {
    piece: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => R((i % 2) * 512 + 4, Math.floor(i / 2) * 256 + 4, 504, 248)),
    shadow: R(0, 1024, 256, 256),
    ghost: R(256, 1024, 256, 128),
    arrow: R(256, 1152, 128, 128),
    star: R(384, 1152, 128, 128),
    letter: { P: R(512, 1024, 128, 128), L: R(640, 1024, 128, 128), A: R(768, 1024, 128, 128), Z: R(896, 1024, 128, 128) },
    manhole: R(512, 1152, 128, 128),
    zebra: R(640, 1152, 128, 128),
    emblem: R(768, 1152, 128, 128),
    bill: [R(0, 1280, 512, 256), R(512, 1280, 512, 256)],
    poster: [0, 1, 2, 3].map((i) => R(i * 256, 1536, 256, 384)),
    // Itaberá: letreiros de loja, placas de rua, placa verde e porta de aço
    town: [...[0, 1, 2, 3].map((i) => R(1024, 512 + i * 112, 512, 104)), R(1152, 962, 384, 60), R(768, 1922, 256, 60), R(768, 1986, 256, 60)],
    shop: [...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => R(1024 + (i % 2) * 512, 1024 + Math.floor(i / 2) * 112, 512, 104)), R(1536, 1792, 512, 104), R(1024, 1920, 512, 104), R(1536, 1920, 512, 104)],
    plate: [0, 1, 2, 3].map((i) => R(1024 + (i % 2) * 512, 1472 + Math.floor(i / 2) * 96, 512, 88)),
    road: R(1024, 1664, 512, 256),
    pav: R(1666, 1666, 124, 124),
    petit: R(1794, 1666, 124, 124),
    door: R(1536, 1664, 128, 128),
    face: { eye: R(0, 1920, 128, 128), wink: R(128, 1920, 128, 128), grin: R(256, 1944, 128, 80), smile: R(384, 1944, 128, 80), nerd: R(512, 1920, 128, 128), sun: R(640, 1920, 128, 128) },
  };
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const FONT = (px) => `900 ${px}px "Arial Black","Impact","Bungee","DejaVu Sans",sans-serif`;
  const INK = "#1b1530";
  function star(g, x, y, r, fill) {
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, rr = i % 2 ? r * 0.32 : r;
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.lineWidth = 5;
    g.strokeStyle = INK;
    g.stroke();
    g.fillStyle = fill;
    g.fill();
  }
  function blob(g, cx, cy, rx, ry, rnd, n = 14) {
    const p = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, k = 0.82 + rnd() * 0.3;
      p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = p[i % n], b = p[(i + 1) % n];
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (i === 0) g.moveTo(m[0], m[1]);
      else g.quadraticCurveTo(a[0], a[1], m[0], m[1]);
    }
    g.closePath();
  }
  // grafite estilo "bubble/wildstyle" com contorno grosso, 3D, degradê, escorridos e brilhos
  function piece(g, X, Y, W, H, word, pal, seed) {
    const rnd = rng(seed);
    g.save();
    g.beginPath();
    g.rect(X, Y, W, H);
    g.clip();
    // fundo: mancha de spray
    blob(g, X + W / 2, Y + H / 2, W * 0.47, H * 0.42, rnd, 16);
    g.fillStyle = pal.bg;
    g.fill();
    g.lineWidth = 7;
    g.strokeStyle = INK;
    g.stroke();
    for (let i = 0; i < 140; i++) {
      const a = rnd() * Math.PI * 2, d = 0.9 + rnd() * 0.25;
      g.fillStyle = pal.bg;
      g.globalAlpha = 0.5 + rnd() * 0.5;
      g.beginPath();
      g.arc(X + W / 2 + Math.cos(a) * W * 0.46 * d, Y + H / 2 + Math.sin(a) * H * 0.41 * d, 1 + rnd() * 3, 0, 7);
      g.fill();
    }
    g.globalAlpha = 1;
    // letras
    let fs = H * 0.6;
    g.font = FONT(fs);
    const chars = [...word];
    let tw = chars.reduce((s, c) => s + g.measureText(c).width * 0.92, 0);
    const k = Math.min(1, (W * 0.8) / tw);
    fs *= k;
    g.font = FONT(fs);
    tw *= k;
    const L = [];
    let x = X + (W - tw) / 2;
    for (const c of chars) {
      const w = g.measureText(c).width * 0.92;
      L.push({ c, x: x + w / 2, y: Y + H * 0.56 + (rnd() - 0.5) * H * 0.12, r: (rnd() - 0.5) * 0.36, s: 0.92 + rnd() * 0.2 });
      x += w;
    }
    const each = (fn) => {
      for (const l of L) {
        g.save();
        g.translate(l.x, l.y);
        g.rotate(l.r);
        g.scale(l.s, l.s);
        g.textAlign = "center";
        g.textBaseline = "middle";
        fn(l);
        g.restore();
      }
    };
    g.lineJoin = "round";
    // escorridos
    each((l) => {
      if (rnd() < 0.55) {
        const dx = (rnd() - 0.5) * fs * 0.4, len = fs * (0.25 + rnd() * 0.35);
        g.lineCap = "round";
        g.strokeStyle = INK;
        g.lineWidth = fs * 0.13;
        g.beginPath();
        g.moveTo(dx, fs * 0.2);
        g.lineTo(dx, fs * 0.2 + len);
        g.stroke();
        g.strokeStyle = pal.b;
        g.lineWidth = fs * 0.07;
        g.stroke();
      }
    });
    // sombra 3D
    each((l) => {
      g.fillStyle = INK;
      g.strokeStyle = INK;
      g.lineWidth = fs * 0.24;
      for (let i = 0; i < 6; i++) {
        g.strokeText(l.c, i * fs * 0.014, i * fs * 0.018);
      }
    });
    each((l) => {
      g.fillStyle = pal.d;
      g.strokeStyle = pal.d;
      g.lineWidth = fs * 0.12;
      for (let i = 1; i < 6; i++) {
        g.strokeText(l.c, i * fs * 0.013, i * fs * 0.017);
        g.fillText(l.c, i * fs * 0.013, i * fs * 0.017);
      }
    });
    // contorno + preenchimento
    each((l) => {
      g.strokeStyle = pal.o || "#fff";
      g.lineWidth = fs * 0.12;
      g.strokeText(l.c, 0, 0);
      g.strokeStyle = INK;
      g.lineWidth = fs * 0.05;
      g.strokeText(l.c, 0, 0);
      const gr = g.createLinearGradient(0, -fs * 0.4, 0, fs * 0.4);
      gr.addColorStop(0, pal.a);
      gr.addColorStop(0.52, pal.a);
      gr.addColorStop(0.53, pal.b);
      gr.addColorStop(1, pal.c);
      g.fillStyle = gr;
      g.fillText(l.c, 0, 0);
      // brilho
      g.fillStyle = "rgba(255,255,255,.85)";
      g.beginPath();
      g.ellipse(-fs * 0.14, -fs * 0.22, fs * 0.05, fs * 0.025, -0.5, 0, 7);
      g.fill();
    });
    for (let i = 0; i < 3; i++) star(g, X + W * (0.1 + rnd() * 0.8), Y + H * (0.12 + rnd() * 0.15) + (i === 2 ? H * 0.6 : 0), 10 + rnd() * 12, i ? "#fff" : pal.a);
    g.restore();
  }
  function makeAtlas() {
    const cv = document.createElement("canvas");
    cv.width = AW;
    cv.height = AH;
    const g = cv.getContext("2d");
    g.clearRect(0, 0, AW, AH);
    const P = [
      ["PLAZA", { bg: "#ff4fa3", a: "#fff36b", b: "#ffb52e", c: "#ff7a1a", d: "#7a1fa2" }],
      ["2001", { bg: "#ffe14d", a: "#7ff6ff", b: "#38a8ff", c: "#2457ff", d: "#1b2a8f" }],
      ["RUA!", { bg: "#8c5cff", a: "#d6ff6b", b: "#5be36a", c: "#1fae5a", d: "#123f5c" }],
      ["GIRO", { bg: "#2ad4c4", a: "#ffd1f0", b: "#ff5ca8", c: "#e0206b", d: "#5a1240" }],
      ["SOFT", { bg: "#ff9a3d", a: "#ffffff", b: "#d9c8ff", c: "#a07cff", d: "#3b2a7a" }],
      ["ZOOM", { bg: "#4fd2ff", a: "#fff36b", b: "#ff7a3d", c: "#ff3d3d", d: "#6a1030" }],
      ["VAI!", { bg: "#c6ff5a", a: "#ff8de0", b: "#b04bff", c: "#6a2bd9", d: "#22105a" }],
      ["ONDA", { bg: "#ff6f6f", a: "#bdfcff", b: "#43e0d0", c: "#14a3a3", d: "#0b3a4a" }],
    ];
    P.forEach(([w, pal], i) => piece(g, (i % 2) * 512 + 4, Math.floor(i / 2) * 256 + 4, 504, 248, w, pal, 77 + i * 13));
    // sombra redonda
    const sg = g.createRadialGradient(128, 1152, 10, 128, 1152, 120);
    sg.addColorStop(0, "rgba(0,0,0,1)");
    sg.addColorStop(0.6, "rgba(0,0,0,.8)");
    sg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = sg;
    g.fillRect(0, 1024, 256, 256);
    // moldura "fantasma" do ponto de grafite
    g.save();
    g.setLineDash([22, 14]);
    g.lineWidth = 10;
    g.strokeStyle = "#ffffff";
    g.fillStyle = "rgba(255,255,255,.18)";
    g.beginPath();
    g.roundRect ? g.roundRect(266, 1034, 236, 108, 26) : g.rect(266, 1034, 236, 108);
    g.fill();
    g.stroke();
    g.restore();
    g.font = FONT(70);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = 10;
    g.strokeStyle = INK;
    g.strokeText("TAG", 384, 1092);
    g.fillStyle = "#fff36b";
    g.fillText("TAG", 384, 1092);
    // seta pintada no chão
    g.save();
    g.translate(320, 1216);
    g.fillStyle = "#ffe14d";
    g.strokeStyle = INK;
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(-40, 40); g.lineTo(0, -45); g.lineTo(40, 40); g.lineTo(18, 40); g.lineTo(0, 0); g.lineTo(-18, 40); g.closePath();
    g.fill();
    g.stroke();
    g.restore();
    star(g, 448, 1216, 50, "#fff36b");
    // letras colecionáveis
    const lc = { P: "#ff4fa3", L: "#3fd0ff", A: "#ffd23f", Z: "#8c5cff" };
    Object.entries(RECT.letter).forEach(([ch], i) => {
      const x = 512 + i * 128 + 64, y = 1088;
      g.beginPath();
      g.arc(x, y, 56, 0, 7);
      g.fillStyle = "#fff";
      g.fill();
      g.lineWidth = 8;
      g.strokeStyle = INK;
      g.stroke();
      g.font = FONT(78);
      g.lineWidth = 12;
      g.strokeText(ch, x, y + 4);
      g.fillStyle = lc[ch];
      g.fillText(ch, x, y + 4);
    });
    // bueiro
    g.beginPath();
    g.arc(576, 1216, 56, 0, 7);
    g.fillStyle = "#6d6880";
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = "#3d3850";
    g.stroke();
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(576 - 40, 1216 + i * 12);
      g.lineTo(576 + 40, 1216 + i * 12);
      g.stroke();
    }
    // emblema da camiseta da K.F.: carinha de óculos escuros
    {
      const x = 832, y = 1216;
      g.beginPath(); g.arc(x, y, 58, 0, 7); g.fillStyle = "#e23b3b"; g.fill();
      g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
      g.beginPath(); g.arc(x, y, 44, 0, 7); g.fillStyle = "#ffe14d"; g.fill(); g.stroke();
      g.fillStyle = INK;
      g.beginPath(); g.roundRect ? g.roundRect(x - 36, y - 18, 32, 18, 6) : g.rect(x - 36, y - 18, 32, 18); g.fill();
      g.beginPath(); g.roundRect ? g.roundRect(x + 4, y - 18, 32, 18, 6) : g.rect(x + 4, y - 18, 32, 18); g.fill();
      g.fillRect(x - 6, y - 14, 12, 5);
      g.fillStyle = "#fff"; g.fillRect(x - 30, y - 15, 8, 4); g.fillRect(x + 10, y - 15, 8, 4);
      g.lineWidth = 6; g.beginPath(); g.arc(x, y + 6, 20, 0.25, Math.PI - 0.25); g.stroke();
    }
    // faixa de pedestre
    g.fillStyle = "#f4f1ea";
    g.fillRect(640, 1152, 128, 128);
    // outdoors (marcas inventadas)
    const bill = (x, title, sub, c1, c2, c3) => {
      const y = 1280;
      const gr = g.createLinearGradient(x, y, x + 512, y + 256);
      gr.addColorStop(0, c1);
      gr.addColorStop(1, c2);
      g.fillStyle = gr;
      g.fillRect(x, y, 512, 256);
      g.fillStyle = "rgba(255,255,255,.18)";
      for (let i = 0; i < 9; i++) g.fillRect(x + i * 64 - 20, y, 26, 256);
      g.font = FONT(64);
      g.textAlign = "left";
      g.lineWidth = 14;
      g.strokeStyle = INK;
      g.strokeText(title, x + 30, y + 110);
      g.fillStyle = "#fff";
      g.fillText(title, x + 30, y + 110);
      g.font = FONT(34);
      g.lineWidth = 8;
      g.strokeText(sub, x + 34, y + 190);
      g.fillStyle = c3;
      g.fillText(sub, x + 34, y + 190);
      star(g, x + 450, y + 60, 34, c3);
    };
    bill(0, "RÁDIO 2001", "FM 101,1 · SÓ GROOVE", "#ff4fa3", "#8c5cff", "#fff36b");
    bill(512, "RODA VIVA", "RODINHAS · SHAPES · LIXA", "#2ad4c4", "#2457ff", "#ffe14d");
    // cartazes lambe-lambe
    const post = (i, t1, t2, c1, c2) => {
      const x = i * 256, y = 1536;
      g.fillStyle = c1;
      g.fillRect(x + 6, y + 6, 244, 372);
      g.fillStyle = c2;
      g.beginPath();
      g.arc(x + 128, y + 180, 70, 0, 7);
      g.fill();
      g.lineWidth = 8;
      g.strokeStyle = INK;
      g.stroke();
      star(g, x + 128, y + 180, 36, "#fff");
      g.font = FONT(40);
      g.textAlign = "center";
      g.lineWidth = 10;
      g.strokeText(t1, x + 128, y + 70);
      g.fillStyle = "#fff";
      g.fillText(t1, x + 128, y + 70);
      g.font = FONT(28);
      g.lineWidth = 7;
      g.strokeText(t2, x + 128, y + 310);
      g.fillStyle = c2;
      g.fillText(t2, x + 128, y + 310);
      g.fillStyle = INK;
      g.fillRect(x + 40, y + 340, 176, 7);
    };
    post(0, "BAILE", "CROMADO", "#2457ff", "#ff4fa3");
    post(1, "CAMPEONATO", "DA PRAÇA", "#ff7a1a", "#fff36b");
    post(2, "VHS", "CLUBE", "#8c5cff", "#7ff6ff");
    post(3, "ONDA", "SEXTA 22H", "#1fae5a", "#ffe14d");
    // rostos desenhados (estilo cartum com contorno grosso)
    {
      const Y = 1920;
      // olho aberto com sobrancelha
      let x = 64, y = Y + 72;
      g.lineCap = "round"; g.lineJoin = "round";
      g.fillStyle = "#fff"; g.strokeStyle = INK; g.lineWidth = 9;
      g.beginPath(); g.moveTo(x - 40, y + 4); g.quadraticCurveTo(x - 6, y - 40, x + 40, y - 6); g.quadraticCurveTo(x + 10, y + 34, x - 40, y + 4); g.closePath(); g.fill(); g.stroke();
      g.save(); g.clip();
      g.fillStyle = "#4a2a18"; g.beginPath(); g.arc(x + 4, y - 2, 22, 0, 7); g.fill();
      g.fillStyle = INK; g.beginPath(); g.arc(x + 6, y - 2, 11, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(x + 12, y - 9, 6, 0, 7); g.fill();
      g.restore();
      g.lineWidth = 11; g.beginPath(); g.moveTo(x - 42, y + 2); g.quadraticCurveTo(x - 6, y - 44, x + 44, y - 8); g.stroke();
      g.lineWidth = 10; g.beginPath(); g.moveTo(x - 34, y - 42); g.quadraticCurveTo(x, y - 60, x + 38, y - 44); g.stroke();
      // piscadinha
      x = 192;
      g.lineWidth = 11; g.beginPath(); g.moveTo(x - 38, y - 4); g.quadraticCurveTo(x, y - 30, x + 40, y - 2); g.stroke();
      g.lineWidth = 7; for (const k of [-1, 0, 1]) { g.beginPath(); g.moveTo(x + 18 + k * 14, y - 18 + Math.abs(k) * 4); g.lineTo(x + 26 + k * 18, y - 32 + Math.abs(k) * 6); g.stroke(); }
      g.lineWidth = 10; g.beginPath(); g.moveTo(x - 34, y - 46); g.quadraticCurveTo(x, y - 56, x + 38, y - 40); g.stroke();
      // sorrisão aberto
      x = 320; y = Y + 76;
      g.fillStyle = "#5a1020"; g.lineWidth = 8;
      g.beginPath(); g.moveTo(x - 48, y - 16); g.quadraticCurveTo(x, y - 6, x + 48, y - 18); g.quadraticCurveTo(x + 30, y + 30, x, y + 30); g.quadraticCurveTo(x - 30, y + 30, x - 48, y - 16); g.closePath(); g.fill();
      g.save(); g.clip(); g.fillStyle = "#fff"; g.fillRect(x - 50, y - 24, 100, 18); g.fillStyle = "#ff7a8a"; g.beginPath(); g.ellipse(x, y + 28, 24, 14, 0, 0, 7); g.fill(); g.restore();
      g.beginPath(); g.moveTo(x - 48, y - 16); g.quadraticCurveTo(x, y - 6, x + 48, y - 18); g.quadraticCurveTo(x + 30, y + 30, x, y + 30); g.quadraticCurveTo(x - 30, y + 30, x - 48, y - 16); g.closePath(); g.stroke();
      // sorriso simples
      x = 448;
      g.lineWidth = 10; g.beginPath(); g.moveTo(x - 40, y - 12); g.quadraticCurveTo(x, y + 22, x + 40, y - 14); g.stroke();
      // emoji nerd (camiseta)
      x = 576; y = Y + 64;
      g.fillStyle = "#ffd43b"; g.lineWidth = 7; g.beginPath(); g.arc(x, y, 56, 0, 7); g.fill(); g.stroke();
      for (const s of [-1, 1]) { g.fillStyle = "#fff"; g.lineWidth = 7; g.beginPath(); g.arc(x + s * 22, y - 10, 19, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + s * 20, y - 8, 8, 0, 7); g.fill(); }
      g.lineWidth = 7; g.beginPath(); g.moveTo(x - 4, y - 12); g.lineTo(x + 4, y - 12); g.stroke();
      g.beginPath(); g.moveTo(x - 41, y - 14); g.lineTo(x - 54, y - 20); g.moveTo(x + 41, y - 14); g.lineTo(x + 54, y - 20); g.stroke();
      g.lineWidth = 7; g.beginPath(); g.moveTo(x - 26, y + 18); g.quadraticCurveTo(x, y + 40, x + 26, y + 18); g.stroke();
      g.fillStyle = "#fff"; g.fillRect(x - 11, y + 24, 10, 13); g.fillRect(x + 1, y + 24, 10, 13); g.strokeRect(x - 11, y + 24, 10, 13); g.strokeRect(x + 1, y + 24, 10, 13);
      // carinha de óculos escuros (reserva)
      x = 704;
      g.fillStyle = "#ffe14d"; g.beginPath(); g.arc(x, y, 56, 0, 7); g.fill(); g.stroke();
      g.fillStyle = INK; g.fillRect(x - 40, y - 22, 34, 20); g.fillRect(x + 6, y - 22, 34, 20); g.fillRect(x - 8, y - 18, 16, 5);
      g.beginPath(); g.arc(x, y + 10, 24, 0.3, Math.PI - 0.3); g.stroke();
    }
    // ---------- Itaberá ----------
    {
      g.clearRect(1024, 1024, 1024, 1024);
      const fit = (t, maxW, px) => { let f = px; g.font = FONT(f); while (g.measureText(t).width > maxW && f > 10) { f -= 2; g.font = FONT(f); } return f; };
      const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); };
      // letreiros pintados (nomes genéricos, de cidade pequena)
      const shop = (i, t, bg, fg, ln, icon) => {
        const x = 1024 + (i % 2) * 512, y = 1024 + Math.floor(i / 2) * 112;
        rr(x + 4, y + 4, 504, 96, 10); g.fillStyle = bg; g.fill();
        g.lineWidth = 6; g.strokeStyle = ln; g.stroke();
        let tx = x + 256;
        if (icon === "cruz") {
          g.fillStyle = "#1fae5a";
          g.fillRect(x + 34, y + 38, 54, 28); g.fillRect(x + 47, y + 25, 28, 54);
          tx += 40;
        }
        if (icon === "estrela") { star(g, x + 60, y + 52, 30, "#fff36b"); tx += 40; }
        g.textAlign = "center"; g.textBaseline = "middle";
        fit(t, icon ? 380 : 450, 66);
        g.lineWidth = 8; g.strokeStyle = ln; g.strokeText(t, tx, y + 56);
        g.fillStyle = fg; g.fillText(t, tx, y + 56);
      };
      shop(0, "FARMÁCIA", "#ffffff", "#2457c8", "#1b3a8f", "cruz");
      shop(1, "VARIEDADES", "#ffd23f", "#e0302b", "#7a1a10");
      shop(2, "LANCHES", "#e0302b", "#ffe14d", "#5a0f0a", "estrela");
      shop(3, "PADARIA", "#f6e7c8", "#9a4b1c", "#5a2a0e");
      shop(4, "BAZAR 1,99", "#2f6fdc", "#ffffff", "#123a7a");
      shop(5, "AUTO PEÇAS", "#ff8a1f", "#ffffff", "#5a2a00");
      shop(6, "SORVETERIA", "#ff8dc0", "#ffffff", "#8a1a52", "estrela");
      shop(7, "MERCADINHO", "#1fae5a", "#ffffff", "#0b4a22");
      // letreiros grandes da cidade (escola, mercado, banco) em outra parte do atlas
      const big = (x, y, t, bg, fg, ln) => {
        rr(x + 4, y + 4, 504, 96, 10); g.fillStyle = bg; g.fill(); g.lineWidth = 6; g.strokeStyle = ln; g.stroke();
        g.textAlign = "center"; g.textBaseline = "middle"; fit(t, 460, 60);
        g.lineWidth = 8; g.strokeStyle = ln; g.strokeText(t, x + 256, y + 56); g.fillStyle = fg; g.fillText(t, x + 256, y + 56);
      };
      big(1536, 1792, "ESCOLA ESTADUAL", "#ffffff", "#2457c8", "#123a7a");
      big(1024, 1920, "SUPERMERCADO", "#e0302b", "#ffffff", "#5a0f0a");
      big(1536, 1920, "BANCO", "#123a7a", "#ffd23f", "#0a1f4a");
      // placas da cidade nova (fora do bloco limpo acima: y 512-960)
      g.clearRect(1024, 512, 512, 448);
      big(1024, 512, "PREFEITURA MUNICIPAL", "#f3e6c8", "#123a7a", "#0a1f4a");
      big(1024, 624, "ESTAÇÃO ITABERÁ", "#2f5a46", "#fff6d8", "#13261d");
      big(1024, 736, "MERCADO MUNICIPAL", "#9a2a22", "#ffe14d", "#4a0f0a");
      big(1024, 848, "POSTO TREVO", "#1fae5a", "#ffffff", "#0b4a22");
      // placas da lan house e da loja de discos (cantinho livre do atlas)
      for (const [y, txt, bg, fg, ln] of [[1922, "LAN HOUSE", "#1b1530", "#3fd0ff", "#3fd0ff"], [1986, "DISCOS & CDs", "#ffd23f", "#1b1530", "#8a2a3a"]]) {
        const x = 768;
        rr(x + 3, y + 3, 250, 54, 10); g.fillStyle = bg; g.fill(); g.lineWidth = 5; g.strokeStyle = ln; g.stroke();
        g.textAlign = "center"; g.textBaseline = "middle"; fit(txt, 220, 34);
        g.lineWidth = 6; g.strokeStyle = "#000"; g.strokeText(txt, x + 128, y + 32); g.fillStyle = fg; g.fillText(txt, x + 128, y + 32);
      }
      // placa da sorveteria (faixa pequena livre embaixo das placas)
      {
        const x = 1152, y = 962;
        rr(x + 3, y + 3, 378, 54, 10); g.fillStyle = "#ffd6ec"; g.fill(); g.lineWidth = 5; g.strokeStyle = "#5a1a3a"; g.stroke();
        g.textAlign = "center"; g.textBaseline = "middle"; fit("SORVETERIA PINGUIM", 330, 34);
        g.lineWidth = 6; g.strokeStyle = "#5a1a3a"; g.strokeText("SORVETERIA PINGUIM", x + 192, y + 32); g.fillStyle = "#ff4fa3"; g.fillText("SORVETERIA PINGUIM", x + 192, y + 32);
      }
      // bloquete (calçada) e petit-pavê (praça), 128 px = um ladrilho
      {
        const x = 1664, y = 1664;
        g.fillStyle = "#d9cdbb"; g.fillRect(x, y, 128, 128);
        g.strokeStyle = "#b8aa95"; g.lineWidth = 3;
        for (let j = 0; j < 8; j++) for (let i = -1; i < 4; i++) {
          const ox = (j % 2) * 16;
          g.fillStyle = (i + j) % 3 ? "#d9cdbb" : "#cdbfaa";
          g.fillRect(x + i * 32 + ox + 1.5, y + j * 16 + 1.5, 29, 13);
        }
        g.globalCompositeOperation = "destination-over"; g.fillStyle = "#b8aa95"; g.fillRect(x, y, 128, 128); g.globalCompositeOperation = "source-over";
      }
      {
        const x = 1792, y = 1664;
        g.save(); g.beginPath(); g.rect(x, y, 128, 128); g.clip();
        g.fillStyle = "#f1ece3"; g.fillRect(x, y, 128, 128);
        g.fillStyle = "#6f6a86";
        for (const oy of [-64, 0, 64]) {
          g.beginPath();
          for (let k = 0; k <= 32; k++) { const xx = x + k * 4, yy = y + 22 + oy + Math.sin((k / 32) * Math.PI * 2) * 14; k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
          for (let k = 32; k >= 0; k--) { const xx = x + k * 4, yy = y + 46 + oy + Math.sin((k / 32) * Math.PI * 2) * 14; g.lineTo(xx, yy); }
          g.closePath(); g.fill();
        }
        g.restore();
      }
      // placas azuis de nome de rua
      const plate = (i, t) => {
        const x = 1024 + (i % 2) * 512, y = 1472 + Math.floor(i / 2) * 96;
        rr(x + 4, y + 4, 504, 80, 8); g.fillStyle = "#1d4fb8"; g.fill();
        g.lineWidth = 5; g.strokeStyle = "#ffffff"; rr(x + 12, y + 12, 488, 64, 5); g.stroke();
        g.textAlign = "center"; g.textBaseline = "middle";
        fit(t, 460, 40); g.fillStyle = "#fff"; g.fillText(t, x + 256, y + 46);
      };
      plate(0, "R. CEL. JOSÉ PEDRO DE LIMA");
      plate(1, "AV. SERVILIANO SILVA");
      plate(2, "R. CEL. AMANTINO");
      plate(3, "R. ELTORE ROSSI");
      // placa verde de estrada
      {
        const x = 1024, y = 1664;
        rr(x + 4, y + 4, 504, 248, 16); g.fillStyle = "#13804a"; g.fill();
        g.lineWidth = 6; g.strokeStyle = "#fff"; rr(x + 14, y + 14, 484, 228, 10); g.stroke();
        g.fillStyle = "#fff"; g.textBaseline = "middle"; g.textAlign = "center";
        fit("ITABERÁ", 440, 76); g.fillText("ITABERÁ", x + 256, y + 66);
        g.fillRect(x + 40, y + 112, 432, 4);
        g.textAlign = "left";
        fit("Centro", 300, 40); g.fillText("Centro", x + 40, y + 150);
        fit("Complexo Esportivo", 360, 34); g.fillText("Complexo Esportivo", x + 40, y + 206);
        const arrow = (cx, cy, ang) => {
          g.save(); g.translate(cx, cy); g.rotate(ang); g.beginPath();
          g.moveTo(0, -24); g.lineTo(20, 2); g.lineTo(7, 2); g.lineTo(7, 24); g.lineTo(-7, 24); g.lineTo(-7, 2); g.lineTo(-20, 2); g.closePath(); g.fill(); g.restore();
        };
        arrow(x + 448, y + 150, 0);
        arrow(x + 448, y + 206, Math.PI / 2);
      }
      // porta de aço de enrolar
      {
        const x = 1536, y = 1664;
        g.fillStyle = "#b9bcc4"; g.fillRect(x, y, 128, 128);
        for (let k = 0; k < 16; k++) { g.fillStyle = k % 2 ? "#a3a7b1" : "#c9ccd3"; g.fillRect(x, y + k * 8, 128, 4); }
        g.fillStyle = "#6b6f7a"; g.fillRect(x, y + 120, 128, 8); g.fillRect(x, y, 4, 128); g.fillRect(x + 124, y, 4, 128);
        g.fillStyle = "#4a4e58"; g.fillRect(x + 56, y + 108, 16, 6);
      }
    }
    if (typeof CHARS !== "undefined") CHARS.paint(g);
    return cv;
  }

  // ---------- skatistas ----------
  // (aparência dos personagens: ver chars.js — CHARS.LOOKS e CHARS.makeRig alimentam o jogo)
  function boardMesh(col) {
    const m = new Mesh();
    const grip = hex(0x2a2638), gfx = hex(col);
    const zs = [-0.41, -0.33, 0.33, 0.41], ys = [0.175, 0.125, 0.125, 0.175];
    const W = 0.11, T = 0.018;
    for (let i = 0; i < 3; i++) {
      const [z0, z1, y0, y1] = [zs[i], zs[i + 1], ys[i], ys[i + 1]];
      const w0 = i === 0 ? 0.08 : W, w1 = i === 2 ? 0.08 : W;
      m.quad([-w0, y0, z0], [w0, y0, z0], [w1, y1, z1], [-w1, y1, z1], grip);
      m.quad([-w0, y0 - T, z0], [-w1, y1 - T, z1], [w1, y1 - T, z1], [w0, y0 - T, z0], gfx);
      m.quad([w0, y0 - T, z0], [w0, y0, z0], [w1, y1, z1], [w1, y1 - T, z1], V.mul(gfx, 0.8));
      m.quad([-w0, y0, z0], [-w0, y0 - T, z0], [-w1, y1 - T, z1], [-w1, y1, z1], V.mul(gfx, 0.8));
    }
    m.quad([-0.08, 0.175, -0.41], [-0.08, 0.157, -0.41], [0.08, 0.157, -0.41], [0.08, 0.175, -0.41], gfx);
    m.quad([0.08, 0.175, 0.41], [0.08, 0.157, 0.41], [-0.08, 0.157, 0.41], [-0.08, 0.175, 0.41], gfx);
    // listra do grafismo embaixo
    m.quad([-0.06, 0.106, -0.2], [-0.06, 0.106, 0.2], [0.06, 0.106, 0.2], [0.06, 0.106, -0.2], hex(0xffffff));
    for (const z of [-0.25, 0.25]) {
      m.box(-0.07, 0.06, z - 0.025, 0.07, 0.107, z + 0.025, hex(0xd8dce8), { m: 1 });
      for (const x of [-0.1, 0.1]) m.tube([x - 0.025, 0.032, z], [x + 0.025, 0.032, z], 0.032, 0.032, 7, hex(0xfff6d8), 0, { capCol: hex(0xffd23f) });
    }
    return m.orient([0, 0.14, 0]);
  }
  // poses (espaço da prancha: +z = bico, +x = frente do corpo, y = cima)
  const POSES = {
    ride: { px: 0, py: 0.9, pz: 0, lean: 0.2, twist: 0.25, hy: -1.05, hp: 0.05, hF: [0.12, 0.92, 0.48], hB: [-0.05, 0.85, -0.46], lf: 0, lb: 0 },
    crouch: { px: 0.06, py: 0.64, pz: 0, lean: 0.55, twist: 0.2, hy: -0.95, hp: 0.1, hF: [0.38, 0.62, 0.36], hB: [0.3, 0.52, -0.36], lf: 0, lb: 0 },
    air: { px: 0, py: 0.8, pz: 0, lean: 0.3, twist: 0.2, hy: -0.9, hp: 0.1, hF: [0.05, 1.3, 0.62], hB: [-0.08, 1.2, -0.62], lf: 0.04, lb: 0.04 },
    flip: { px: 0, py: 0.9, pz: 0, lean: 0.34, twist: 0.25, hy: -0.75, hp: 0.35, hF: [0.18, 1.25, 0.6], hB: [-0.05, 1.1, -0.55], lf: 0.34, lb: 0.04, fxF: 0.16, fxB: -0.02 },
    grind: { px: 0, py: 0.86, pz: 0, lean: 0.22, twist: 0.4, hy: -1.1, hp: 0.05, hF: [0.0, 1.12, 0.7], hB: [0.0, 1.02, -0.68], lf: 0, lb: 0 },
    manual: { px: -0.04, py: 0.9, pz: -0.08, lean: -0.08, twist: 0.35, hy: -1.1, hp: -0.05, hF: [0.15, 1.15, 0.55], hB: [-0.15, 1.08, -0.55], lf: 0, lb: 0 },
    nmanual: { px: 0.04, py: 0.88, pz: 0.1, lean: 0.4, twist: 0.35, hy: -1.1, hp: 0.2, hF: [0.25, 1.0, 0.6], hB: [-0.2, 1.15, -0.5], lf: 0, lb: 0 },
    push: { px: 0.02, py: 0.86, pz: 0.08, lean: 0.25, twist: 0.95, hy: -0.55, hp: 0.05, hF: [0.25, 0.9, 0.42], hB: [-0.15, 0.85, -0.3], lf: 0, lb: 0, push: 0 },
    special: { px: 0, py: 0.95, pz: 0, lean: -0.3, twist: 0.0, hy: -0.2, hp: -0.4, hF: [0.1, 1.5, 0.7], hB: [0.1, 1.5, -0.7], lf: 0.45, lb: 0.45 },
  };
  const GRABS = {
    Indy: { hB: [0.12, 0.17, -0.02, 1] },
    Melon: { hF: [-0.12, 0.17, 0.05, 1], hB: [-0.1, 1.15, -0.62] },
    Stalefish: { hB: [-0.12, 0.17, -0.06, 1] },
    Nosegrab: { hF: [0.0, 0.17, 0.37, 1] },
    Tailgrab: { hB: [0.0, 0.17, -0.37, 1] },
    // parada de mão na borda da rampa (invert): uma mão no coping, a outra segura o shape
    Plant: { py: 0.95, lean: 0.05, hp: 0.3, hy: -0.2, hF: [0.12, 1.98, 0.08], hB: [0.12, 0.17, -0.02, 1], lf: 0.1, lb: 0.1 },
  };
  function grabPose(name) {
    const p = Object.assign({}, POSES.air, { py: 0.58, lean: 0.55, lf: 0.06, lb: 0.06, hy: -0.85, hp: 0.25, hF: [0.05, 1.25, 0.62], hB: [-0.08, 1.2, -0.62] });
    return Object.assign(p, GRABS[name] || {});
  }
  const FEET = { fzF: 0.13, fzB: -0.13, fxF: 0, fxB: 0 }; // pés dos patins (padrão quando a pose não diz)
  function lerpPose(a, b, t) {
    const o = {};
    for (const k in FEET) if (k in a || k in b) o[k] = (a[k] ?? FEET[k]) + ((b[k] ?? FEET[k]) - (a[k] ?? FEET[k])) * t;
    for (const k in a) {
      if (k in FEET) continue;
      if (Array.isArray(a[k])) {
        const bb = b[k] || a[k];
        o[k] = a[k].map((v, i) => (i === 3 ? (t > 0.5 ? bb[3] || 0 : v) : v + ((bb[i] ?? v) - v) * t));
        if (bb.length > 3 && t > 0.5) o[k][3] = bb[3];
      } else if (k === "push") o[k] = b.push !== undefined ? b.push : undefined;
      else o[k] = a[k] + ((b[k] ?? a[k]) - a[k]) * t;
    }
    if (b.push !== undefined && t > 0.5) o.push = b.push;
    if (b.push === undefined && t > 0.5) delete o.push;
    return o;
  }

  return { makeAtlas, RECT, rng, POSES, grabPose, lerpPose, boardMesh, FONT };
})();
