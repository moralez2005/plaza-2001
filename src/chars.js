// Personagens: malha única e contínua por personagem, dobrando nas juntas por ossos
// (skinning no shader), rosto pintado em textura e cabelo como volume sólido.
// Todos os personagens, roupas e estampas são originais.
"use strict";
const CHARS = (() => {
  const { V, M, hex, Mesh, seg, ik } = E;
  const BONE = { torso: 0, head: 1, thighF: 2, shinF: 3, footF: 4, thighB: 5, shinB: 6, footB: 7, upF: 8, foreF: 9, upB: 10, foreB: 11 };
  const LEN0 = { thigh: 0.45, shin: 0.45, torso: 0.46, up: 0.29, fore: 0.27 };
  const lenOf = (look) => (look && look.len ? Object.assign({}, LEN0, look.len) : LEN0);
  const bindOf = (look) => { const L = lenOf(look); return Object.assign({}, BIND, { py: L.thigh + L.shin + 0.16 }); };
  const INK = "#1b1530";
  const AW = 2048, AH = 2048;
  const R = (x, y, w, h) => [x / AW, y / AH, (x + w) / AW, (y + h) / AH];
  const FACE = { kf: [1024, 0], kaua: [1280, 0], manu: [1536, 0], gabi: [1792, 0], kauane: [1024, 256], julie: [1280, 256] };
  for (let i = 0; i < 12; i++) FACE["npc" + i] = [1536 + (i % 4) * 128, 640 + Math.floor(i / 4) * 128, 128];
  FACE.dudu = [1920, 512, 128];
  FACE.vava = [1920, 1664, 128];
  const SPR = { cloud: R(1920, 256, 128, 128), dollar: R(1920, 384, 128, 128), checker: R(1024, 960, 64, 64), cat: R(1088, 960, 64, 64), nerd: R(512, 1920, 128, 128), shark: R(1536, 256, 128, 384), lion: R(1664, 256, 128, 384), crown: R(1792, 256, 128, 384) };

  const LOOKS = {
    kf: {
      cam: { body: 0xc9ced8, trim: 0xe8242c, lens: 0x2a2d38 },
      name: "K.F.", face: "kf", skin: 0xc68e62, hair: 0x2b170c, top: 0xff6a1a, top2: 0xd8460a, pants: 0x4f86d6, shoe: 0xe02a2a, shoeToe: 0xffffff, shoe2: 0xe02a2a, sole: 0xf4f1ea, tee: "loose", flare: 1.3,
      phones: 0xe8262b, deck: 0x3fd0ff, deckShape: "shark", hairStyle: "afro", sleeve: "short", belt: true, print: "nerd", walkman: true, earbud: "both", wristband: 0xe8262b,
      len: { thigh: 0.49, shin: 0.49, torso: 0.5, up: 0.31, fore: 0.29 }, headScale: 0.9, shoulder: 1.14, pantsR: 1.0, pyAdd: 0.06,
      headProf: "mature", stance: "regular", shades: true, ride: { lean: 0.2, twist: 0.32, hy: -1.05, hp: 0.02 }, idle: "peace",
    },
    kaua: {
      cam: { body: 0x2a5bd7, trim: 0xf6f8ff, lens: 0x1b1530, sticker: "dollar" },
      name: "Kauã", face: "kaua", skin: 0xf0c7a4, hair: 0xf5cf45, top: 0xf6f8ff, top2: 0xc9d4ec, pants: 0x1a1d2c, shoe: 0x2452d6, shoeToe: 0xf2f4fa, shoe2: 0x2a5bd7, sole: 0xf4f1ea, lace: 0xffffff, flare: 0.7,
      deck: 0x2fae6a, deckArt: "dollar", legArt: "dollar", hairStyle: "spiky", sleeve: "short", tie: 0x2a5bd7, glasses: true, buttons: true, stance: "goofy",
      len: { thigh: 0.47, shin: 0.47, torso: 0.48, up: 0.3, fore: 0.28 }, headScale: 0.93, shoulder: 1.02, pantsR: 0.95, pyAdd: 0.04,
      ride: { lean: 0.34, twist: 0.2, hy: -0.85, hp: 0.25 }, idle: "shy",
    },
    manu: {
      cam: { body: 0xff7ac0, trim: 0xffffff, lens: 0x3a2a4a, sticker: "cloud", charm: 0xffd23f },
      name: "Manu", face: "manu", skin: 0xf6d2bb, hair: 0xf7d76a, top: 0xffffff, top2: 0xe9e4ff, pants: 0x8a5cf0, dress: 0x8a5cf0, overall: true, shoe: 0xff7ac0, shoe2: 0xffffff,
      hairStyle: "long", beanie: 0x3f8fd8, skates: true, pyAdd: 0.1, socks: 0xffffff, scale: 0.8, print: "cloud", sleeve: "short",
      ride: { lean: 0.12, twist: 0.0, hy: -0.2, hp: -0.05 }, idle: "bounce",
    },
    gabi: {
      // prima: calma e acolhedora; cabelo castanho liso repartido no meio, delineado, batom vermelho, piercing no septo
      cam: { body: 0x3a4232, trim: 0xf7c531, lens: 0x1b1530, rasta: true },
      name: "Gabi", face: "gabi", skin: 0xf3cdb4, hair: 0x4a2c1c, browCol: 0x4a2c1c, top: 0x232029, top2: 0x34303c, pants: 0x3b4f7a, shoe: 0x1b1530, shoeToe: 0xffffff, sole: 0xf4f1ea, lace: 0xffffff,
      tee: "loose", sleeve: "short", flare: 0.7, pantsR: 0.86, hairStyle: "long", part: "center", streak: 0x2a8f94, septum: true, rasta: true,
      deck: 0x1f9a4a, deckArtLong: "lion", scale: 0.87, shoulder: 0.92, headScale: 0.96, stance: "regular",
      ride: { lean: 0.14, twist: 0.12, hy: -0.75, hp: 0.06 }, idle: "calm",
    },
    julie: {
      // a ruiva da pista: chanel bagunçado com franjinha, sardas, flanela xadrez aberta, jeans claro e tênis quadriculado
      cam: { body: 0xb79cff, trim: 0x1b1530, lens: 0x1b1530, sticker: "cat" },
      name: "Julie", face: "julie", skin: 0xf6d4bd, hair: 0xc4492a, browCol: 0xa8402a, top: 0xc8282e, top2: 0x5a1416, inner: 0xfafafa, pants: 0x8fb4e0, shoe: 0x1b1530, shoeToe: 0xffffff, sole: 0xf4f1ea, lace: 0xffffff,
      tee: "loose", jacket: true, flannel: true, flare: 0.6, pantsR: 0.95, hairStyle: "chanel", checkerShoe: true,
      deck: 0xb79cff, deckArt: "cat", scale: 0.95, shoulder: 0.94, headScale: 0.9, stance: "regular",
      ride: { lean: 0.18, twist: 0.22, hy: -0.9, hp: 0.0 }, idle: "kick",
    },
    kauane: {
      // irmã: rebelde e mandona; cabelo escuro liso com risca de lado, delineado gatinho, sardas, jaqueta creme felpuda
      cam: { body: 0x16141c, trim: 0xff2e7a, lens: 0x0d0c12, charm: 0xff2e7a },
      name: "Kauane", face: "kauane", skin: 0xc98d68, hair: 0x1e1411, browCol: 0x1e1411, top: 0xefe4d4, top2: 0xd8cab6, inner: 0x2f6fd8, pants: 0x1b1a22, shoe: 0x16141c, shoeToe: 0x16141c, sole: 0x2a2630, lace: 0x3a3644,
      tee: "loose", jacket: true, flare: 0.2, pantsR: 0.74, hairStyle: "long", part: "side", belt: true,
      deck: 0xe01e5a, deckArtLong: "crown", scale: 0.87, shoulder: 0.94, headScale: 0.96, stance: "goofy",
      ride: { lean: 0.26, twist: 0.3, hy: -0.95, hp: -0.06 }, idle: "boss",
    },
  };

  // ---------- moradores de Itaberá (mesmo modelo dos skatistas, rosto menor no atlas) ----------
  const TOWN = [
    { name: "Seu Zé", skin: 0xb07a52, hair: 0xd8d4cc, hairStyle: "hat", top: 0xf4efe2, top2: 0xd8d0bc, pants: 0x5a4a3a, shoe: 0x5a3a22, npc: { old: 1, mustache: 0xe8e4dc, mouth: "smile" }, stoop: 0.15 },
    { name: "Dona Cida", skin: 0xe8b894, hair: 0xb8b0bc, hairStyle: "bun", top: 0x8a5cc8, top2: 0x6a3ea8, pants: 0x2b3a7a, shoe: 0x1b1530, npc: { old: 1, glasses: 0x8a2a3a, lips: 0xc8506a, mouth: "smile" }, stoop: 0.12 },
    { name: "Tonho da feira", skin: 0xc98b62, hair: 0x2b170c, hairStyle: "short", top: 0x1fae5a, top2: 0x158a44, pants: 0x3a3a52, shoe: 0x2a2a2a, npc: { beard: 0x2b170c, mouth: "smile" } },
    { name: "Guarda Silva", skin: 0x8a5a3c, hair: 0x1b1530, hairStyle: "guard", top: 0x2457c8, top2: 0x1d3f8a, pants: 0x1d2a52, shoe: 0x111111, npc: { mouth: "flat", frown: 1 }, sleeve: "short" },
    { name: "Luana", skin: 0x6e452c, hair: 0x1b1210, hairStyle: "afro", top: 0xffd23f, top2: 0xff8a1f, pants: 0x2f6fd8, shoe: 0xffffff, npc: { lash: 1, lips: 0x8a3a4a, mouth: "smile" }, sleeve: "short" },
    { name: "Dona Rosa da padaria", skin: 0xf0c7a4, hair: 0x7a4a2a, hairStyle: "bun", top: 0xffffff, top2: 0xe8e8e8, pants: 0xe07a9a, shoe: 0xffffff, npc: { lips: 0xd04a5a, blush: 0.45, mouth: "smile" }, apron: 0xff8fc8 },
    { name: "Pedrinho", skin: 0xe8b894, hair: 0xc88a3a, hairStyle: "spiky", top: 0xe0302b, top2: 0xb8201b, pants: 0x3a5aa8, shoe: 0x1fae5a, npc: { freckles: 1, mouth: "o" }, sleeve: "short", kid: 1 },
    { name: "Seu Nonato", skin: 0x5a3a26, hair: 0xeae6e0, hairStyle: "bald", top: 0x9ad8f5, top2: 0x6ab8e0, pants: 0xd8cbb0, shoe: 0x6a4a2a, npc: { old: 1, mustache: 0xeae6e0, mouth: "flat" }, stoop: 0.2 },
    { name: "Mari", skin: 0xf3cdb4, hair: 0xd84a8a, hairStyle: "bob", top: 0x1b1530, top2: 0x2a2440, pants: 0x6a6a7a, shoe: 0xff4fa3, npc: { lash: 1, lips: 0x6a2a5a, mouth: "flat" }, sleeve: "short" },
    { name: "Seu Ditinho", skin: 0xc68e62, hair: 0x3a2a1a, hairStyle: "hat", hatCol: 0x6a4a2a, hatBand: 0x1b1530, top: 0xd84a3a, top2: 0xb83a2a, pants: 0x3a4a6a, shoe: 0x4a2a1a, npc: { mustache: 0x2a1a10, mouth: "smile" } },
    { name: "Bia do posto", skin: 0xd8a47e, hair: 0x2a1a10, hairStyle: "long", top: 0x1fae5a, top2: 0xffffff, pants: 0x1b1a22, shoe: 0x1b1530, npc: { lash: 1, lips: 0xb83a5a, mouth: "smile" }, sleeve: "short" },
    { name: "Padre Antônio", skin: 0xf0c7a4, hair: 0x8a8a8a, hairStyle: "short", top: 0x1b1530, top2: 0x2a2440, pants: 0x1b1530, shoe: 0x111111, npc: { old: 1, glasses: 0x2a2a2a, mouth: "smile" } },
  ];
  // variantes só pra cutscene: K.F. sem o fone grande (com fone de botão) e Julie com o outro lado do fone
  LOOKS.kf_ear = Object.assign({}, LOOKS.kf, { earbud: "one", name: "K.F." });
  LOOKS.julie_ear = Object.assign({}, LOOKS.julie, { earbud: true, earSide: -1, name: "Julie" });
  // Seu Vavá dos Discos: senhor de idade estiloso — chapéu de feltro preto com fita vermelha, óculos de aro
  // dourado, bigode e cavanhaque brancos, jaqueta de camurça com gola de pelúcia, camisa estampada e sapato bicolor
  LOOKS.vava = {
    name: "Seu Vavá", face: "vava", skin: 0x9a5e3a, hair: 0xeeeeea, hairStyle: "hat", hatCol: 0x22202a, hatBand: 0xc8202a,
    top: 0x7a4a2a, top2: 0x6a3e22, jacket: true, inner: 0xe8d8a8, pants: 0x2a2a36, shoe: 0xf4f1ea, shoeToe: 0x1b1530, sole: 0x2a2630, lace: 0x1b1530,
    belt: true, sleeve: "long", scale: 0.93, headScale: 0.98, pantsR: 0.78, flare: 0.12, stoop: 0.04,
    npc: { old: 1, mustache: 0xf2f2ee, beard: 0xf2f2ee, glasses: 0xd0a040, brow: 0xe8e8e4, mouth: "smile", iris: "#3a2210" },
  };
  // Manu sem os patins (dentro da loja de discos): de chinelo, pé de fora
  LOOKS.manu_chinelo = Object.assign({}, LOOKS.manu, { skates: false, chinelo: 0xffffff, strap: 0xff4fa3, shortLegs: true, socks: LOOKS.manu.skin, pyAdd: 0, shoeScale: 1, name: "Manu" });
  // Dudu da lan house: 24 anos, eterno moleque, anda de skate nas horas vagas e é o brother da turma
  LOOKS.dudu = { name: "Dudu da Lan", face: "dudu", skin: 0xf0c49c, hair: 0xd8702a, hairStyle: "spiky", top: 0x2ab0e8, top2: 0x1f86b8, pants: 0x8a7a5a, shoe: 0x1b1530, shoeToe: 0xffffff, sole: 0xf4f1ea, lace: 0xffffff,
    sleeve: "short", pantsR: 0.78, flare: 0.2, scale: 1.0, headScale: 0.95, npc: { freckles: 1, mouth: "smile", brow: 0xb85a20, iris: "#3a6a8a" } };
  TOWN.forEach((t, i) => (t.face = "npc" + i));
  TOWN.forEach((t, i) => (LOOKS["npc" + i] = Object.assign({ sleeve: "long", pantsR: 0.9, flare: 0.4, shoeToe: t.shoe, sole: 0x2a2630, lace: t.shoe, scale: t.kid ? 0.72 : t.old ? 0.88 : 0.92, headScale: t.kid ? 1.08 : 0.97, pantsR: 0.72, flare: 0.1 }, t)));
  // Neide da Sorveteria Pinguim: atendente de avental rosa e cabelo preso
  LOOKS.neide = Object.assign({}, LOOKS.npc10, { name: "Neide", top: 0xffffff, top2: 0xeeeeee, apron: 0xff8fc8, pants: 0x3a4a7a, hairStyle: "bun", sleeve: "short" });

  // ---------- rostos pintados (256x256 cada) ----------
  function face(g, key, L) {
    const [X0, Y0, SZ = 256] = FACE[key];
    const skin = "#" + L.skin.toString(16).padStart(6, "0");
    g.save();
    // rosto menor (moradores): desenha no mesmo espaço de 256 e encolhe
    if (SZ !== 256) { g.translate(X0, Y0); g.scale(SZ / 256, SZ / 256); }
    const X = SZ !== 256 ? 0 : X0, Y = SZ !== 256 ? 0 : Y0;
    g.beginPath();
    g.rect(X, Y, 256, 256);
    g.clip();
    g.fillStyle = skin;
    g.fillRect(X, Y, 256, 256);
    g.lineCap = "round";
    g.lineJoin = "round";
    const ex = (s) => X + 128 + s * 42, ey = Y + 118;
    const eye = (s, o = {}) => {
      const x = ex(s), y = ey, w = o.w || 30, h = o.h || 22;
      g.fillStyle = "#fff";
      g.strokeStyle = INK;
      g.lineWidth = 5;
      g.beginPath();
      g.ellipse(x, y, w, h, 0, 0, 7);
      g.fill();
      g.save();
      g.clip();
      g.fillStyle = o.iris || "#4a2a18";
      g.beginPath();
      const lx = o.lx || 0;
      g.arc(x + s * -2 + lx, y + (o.look || 0), h * 0.95, 0, 7);
      g.fill();
      g.fillStyle = INK;
      g.beginPath();
      g.arc(x + s * -2 + lx, y + (o.look || 0), h * 0.5, 0, 7);
      g.fill();
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(x + 6 + lx, y - 7 + (o.look || 0), h * 0.28, 0, 7);
      g.fill();
      g.restore();
      // pálpebra superior grossa (traço de mangá/cartum)
      g.lineWidth = 9;
      g.beginPath();
      g.ellipse(x, y, w + 1, h + 1, 0, Math.PI * 1.05, Math.PI * 1.95);
      g.stroke();
      if (o.lash) {
        g.lineWidth = 5;
        for (const k of [0, 1]) {
          g.beginPath();
          g.moveTo(x + s * (w - 2), y - h * 0.5 - k * 6);
          g.lineTo(x + s * (w + 12), y - h * 0.8 - k * 10);
          g.stroke();
        }
      }
    };
    const brow = (s, tilt = 0, yo = 0) => {
      g.strokeStyle = o2(L.browCol) || INK;
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(ex(s) - s * 26, ey - 40 + yo - tilt * s * 0);
      g.quadraticCurveTo(ex(s), ey - 50 + yo - tilt, ex(s) + s * 28, ey - 40 + yo + tilt);
      g.stroke();
      g.strokeStyle = INK;
    };
    const o2 = (c) => (c ? "#" + c.toString(16).padStart(6, "0") : null);
    const nose = () => {
      g.strokeStyle = "rgba(60,25,15,.55)";
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(X + 132, Y + 150);
      g.quadraticCurveTo(X + 140, Y + 168, X + 126, Y + 170);
      g.stroke();
      g.strokeStyle = INK;
    };
    const blush = (a = 0.35) => {
      g.fillStyle = `rgba(255,110,120,${a})`;
      for (const s of [-1, 1]) {
        g.beginPath();
        g.ellipse(ex(s) + s * 10, ey + 42, 20, 10, 0, 0, 7);
        g.fill();
      }
    };
    const my = Y + 196;
    if (key === "kf") {
      // olhos amendoados menores, pálpebra pesada; sobrancelhas grossas, uma arqueada; meio sorriso
      for (const sd of [-1, 1]) {
        const x = ex(sd), y = ey + 4;
        g.fillStyle = "#fff";
        g.strokeStyle = INK;
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(x - 26, y + 2);
        g.quadraticCurveTo(x - 4 * sd, y - 17, x + 26, y - 2);
        g.quadraticCurveTo(x + 2 * sd, y + 12, x - 26, y + 2);
        g.closePath();
        g.fill();
        g.save();
        g.clip();
        g.fillStyle = "#3a200f";
        g.beginPath();
        g.arc(x - sd * 3, y - 1, 12, 0, 7);
        g.fill();
        g.fillStyle = INK;
        g.beginPath();
        g.arc(x - sd * 3, y - 1, 6, 0, 7);
        g.fill();
        g.fillStyle = "#fff";
        g.beginPath();
        g.arc(x - sd * 3 + 4, y - 5, 3, 0, 7);
        g.fill();
        g.restore();
        // pálpebra de cima grossa, puxada pra fora
        g.lineWidth = 8;
        g.beginPath();
        g.moveTo(x - 27 * sd * -1 - 0, y + 1);
        g.moveTo(x + (sd < 0 ? 28 : -28), y + 2);
        g.quadraticCurveTo(x - 4 * sd, y - 18, x + (sd < 0 ? -30 : 30), y - 4);
        g.stroke();
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x - 20, y + 10);
        g.quadraticCurveTo(x, y + 14, x + 18, y + 8);
        g.stroke();
      }
      // sobrancelhas: grossas e afinando nas pontas
      const browK = (sd, lift) => {
        const x = ex(sd), y = ey - 30;
        g.fillStyle = "#24130a";
        g.beginPath();
        g.moveTo(x - sd * 30, y + 8);
        g.quadraticCurveTo(x - sd * 6, y - 8 - lift, x + sd * 30, y - 2 - lift * 0.4);
        g.quadraticCurveTo(x - sd * 4, y + 2 - lift, x - sd * 30, y + 14);
        g.closePath();
        g.fill();
      };
      browK(-1, 9);
      browK(1, 1);
      // nariz: dorso + asa
      g.strokeStyle = "rgba(70,30,12,.6)";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(X + 120, Y + 128);
      g.quadraticCurveTo(X + 116, Y + 152, X + 122, Y + 166);
      g.stroke();
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(X + 114, Y + 168);
      g.quadraticCurveTo(X + 128, Y + 176, X + 144, Y + 166);
      g.stroke();
      // maçãs do rosto (traço de sombra estilo cartum)
      g.strokeStyle = "rgba(90,40,15,.35)";
      g.lineWidth = 4;
      for (const sd of [-1, 1]) {
        g.beginPath();
        g.moveTo(X + 128 + sd * 70, Y + 146);
        g.lineTo(X + 128 + sd * 58, Y + 164);
        g.stroke();
      }
      // meio sorriso confiante
      g.strokeStyle = INK;
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(X + 102, my - 4);
      g.quadraticCurveTo(X + 132, my + 6, X + 158, my - 14);
      g.stroke();
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(X + 156, my - 18);
      g.lineTo(X + 162, my - 8);
      g.stroke();
      g.strokeStyle = "rgba(90,30,20,.35)";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(X + 116, my + 14);
      g.quadraticCurveTo(X + 130, my + 18, X + 144, my + 12);
      g.stroke();
    } else if (key === "kaua") {
      eye(-1, { look: 5, iris: "#3f7fd0", h: 20 });
      eye(1, { look: 5, iris: "#3f7fd0", h: 20 });
      g.strokeStyle = "#c79a3a";
      for (const s of [-1, 1]) {
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(ex(s) - s * 24, ey - 38);
        g.quadraticCurveTo(ex(s), ey - 34, ex(s) + s * 26, ey - 30);
        g.stroke();
      }
      nose();
      blush(0.5);
      // boquinha tímida torta
      g.strokeStyle = INK;
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(X + 112, my - 4);
      g.quadraticCurveTo(X + 128, my + 2, X + 146, my - 8);
      g.stroke();
      // sardinhas
      g.fillStyle = "rgba(170,100,60,.6)";
      for (const [dx, dy] of [[-62, 40], [-50, 46], [-56, 52], [52, 42], [62, 48], [56, 54]]) {
        g.beginPath();
        g.arc(X + 128 + dx, ey + dy, 3, 0, 7);
        g.fill();
      }
    } else if (key === "manu") {
      eye(-1, { lash: true, w: 28, h: 21, iris: "#2f9a52" });
      eye(1, { lash: true, w: 28, h: 21, iris: "#2f9a52" });
      brow(-1, 6, -6);
      brow(1, 6, -6);
      blush(0.55);
      g.strokeStyle = "rgba(60,25,15,.4)";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(X + 128, Y + 160);
      g.lineTo(X + 124, Y + 168);
      g.stroke();
      // sorriso aberto com fileira de dentes de cima (contorno só no lábio, sem círculo)
      const mouth = () => {
        g.beginPath();
        g.moveTo(X + 100, my - 12);
        g.quadraticCurveTo(X + 128, my - 2, X + 158, my - 14);
        g.quadraticCurveTo(X + 148, my + 16, X + 128, my + 17);
        g.quadraticCurveTo(X + 108, my + 15, X + 100, my - 12);
        g.closePath();
      };
      g.fillStyle = "#8a2440";
      mouth();
      g.fill();
      g.save();
      mouth();
      g.clip();
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.moveTo(X + 98, my - 14);
      g.quadraticCurveTo(X + 128, my - 4, X + 160, my - 16);
      g.lineTo(X + 160, my - 2);
      g.quadraticCurveTo(X + 128, my + 8, X + 98, my);
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(120,110,130,.6)";
      g.lineWidth = 2;
      for (const dx of [-16, -5, 6, 17]) {
        g.beginPath();
        g.moveTo(X + 128 + dx, my - 8);
        g.lineTo(X + 128 + dx, my + 3);
        g.stroke();
      }
      g.fillStyle = "#ff8fa0";
      g.beginPath();
      g.ellipse(X + 132, my + 17, 15, 8, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
      g.strokeStyle = INK;
      g.lineWidth = 6;
      mouth();
      g.stroke();
    } else if (key === "gabi" || key === "kauane") {
      const gb = key === "gabi";
      // pálpebra de cima mais baixa (olhar tranquilo na Gabi, de lado e desconfiado na Kauane)
      for (const sd of [-1, 1]) {
        eye(sd, gb ? { w: 27, h: 17, iris: "#6b6a3a", look: 3 } : { w: 28, h: 18, iris: "#3a2214", look: 2, lx: 7 });
        const x = ex(sd), y = ey;
        // delineado gatinho saindo do canto de fora
        g.strokeStyle = INK;
        g.fillStyle = INK;
        g.beginPath();
        g.moveTo(x + sd * 14, y - (gb ? 16 : 17));
        g.quadraticCurveTo(x + sd * 26, y - 12, x + sd * (gb ? 44 : 50), y - (gb ? 20 : 26));
        g.lineTo(x + sd * 27, y - 3);
        g.closePath();
        g.fill();
        // sobrancelhas
        g.fillStyle = "#" + L.browCol.toString(16).padStart(6, "0");
        g.beginPath();
        if (gb) {
          // finas e suaves
          g.moveTo(x - sd * 26, y - 36);
          g.quadraticCurveTo(x, y - 48, x + sd * 30, y - 38);
          g.quadraticCurveTo(x, y - 42, x - sd * 26, y - 30);
        } else {
          // retas e inclinadas pra dentro: cara de "não enche"
          g.moveTo(x - sd * 26, y - 28);
          g.lineTo(x + sd * 30, y - 46);
          g.lineTo(x + sd * 30, y - 38);
          g.lineTo(x - sd * 26, y - 20);
        }
        g.closePath();
        g.fill();
      }
      nose();
      blush(gb ? 0.3 : 0.22);
      if (!gb) {
        // sardas no nariz e nas bochechas
        g.fillStyle = "rgba(110,55,30,.55)";
        for (const [dx, dy] of [[-58, 36], [-46, 44], [-64, 48], [-36, 34], [52, 38], [64, 46], [44, 48], [34, 34], [-10, 30], [10, 32], [0, 40]]) {
          g.beginPath();
          g.arc(X + 128 + dx, ey + dy, 2.6, 0, 7);
          g.fill();
        }
      }
      // boca: Gabi de batom vermelho e sorriso calmo; Kauane com bico torto de deboche
      const lip = gb ? "#c8324a" : "#9a4256";
      g.fillStyle = lip;
      g.strokeStyle = INK;
      g.lineWidth = 4;
      g.beginPath();
      if (gb) {
        g.moveTo(X + 104, my - 6);
        g.quadraticCurveTo(X + 116, my - 18, X + 128, my - 10);
        g.quadraticCurveTo(X + 140, my - 18, X + 152, my - 6);
        g.quadraticCurveTo(X + 128, my + 14, X + 104, my - 6);
      } else {
        g.moveTo(X + 108, my - 2);
        g.quadraticCurveTo(X + 120, my - 14, X + 130, my - 8);
        g.quadraticCurveTo(X + 142, my - 16, X + 156, my - 14);
        g.quadraticCurveTo(X + 134, my + 12, X + 108, my - 2);
      }
      g.closePath();
      g.fill();
      g.stroke();
      g.strokeStyle = "rgba(40,10,20,.7)";
      g.lineWidth = 3;
      g.beginPath();
      if (gb) { g.moveTo(X + 108, my - 6); g.quadraticCurveTo(X + 128, my - 1, X + 148, my - 6); }
      else { g.moveTo(X + 112, my - 3); g.quadraticCurveTo(X + 132, my - 4, X + 152, my - 13); }
      g.stroke();
    } else if (key === "julie") {
      // olhar de desafio (olho verde meio fechado), delineado curtinho, muita sarda e sorrisinho torto
      for (const sd of [-1, 1]) {
        eye(sd, { w: 28, h: 19, iris: "#3f8a52", look: 2, lx: -3 });
        const x = ex(sd), y = ey;
        g.fillStyle = INK;
        g.beginPath(); g.moveTo(x + sd * 18, y - 17); g.quadraticCurveTo(x + sd * 28, y - 12, x + sd * 40, y - 18); g.lineTo(x + sd * 28, y - 4); g.closePath(); g.fill();
        g.fillStyle = "#" + L.browCol.toString(16).padStart(6, "0");
        g.beginPath(); g.moveTo(x - sd * 24, y - 32 + (sd > 0 ? -6 : 0)); g.quadraticCurveTo(x, y - 46 + (sd > 0 ? -8 : 0), x + sd * 30, y - 38 + (sd > 0 ? -4 : 0)); g.lineTo(x + sd * 30, y - 33 + (sd > 0 ? -4 : 0)); g.quadraticCurveTo(x, y - 40 + (sd > 0 ? -8 : 0), x - sd * 24, y - 27 + (sd > 0 ? -6 : 0)); g.closePath(); g.fill();
      }
      nose();
      blush(0.35);
      g.fillStyle = "rgba(170,80,40,.62)";
      const R = ART.rng(31);
      for (let i = 0; i < 34; i++) {
        const sd = i % 2 ? 1 : -1, dx = sd * (14 + R() * 62), dy = 26 + R() * 34 - Math.abs(dx) * 0.08;
        g.beginPath(); g.arc(X + 128 + dx, ey + dy, 2 + R() * 1.8, 0, 7); g.fill();
      }
      for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(X + 120 + R() * 18, ey + 22 + R() * 26, 2.2, 0, 7); g.fill(); }
      // sorrisinho torto, de canto de boca
      g.strokeStyle = INK; g.lineWidth = 6;
      g.beginPath(); g.moveTo(X + 104, my - 6); g.quadraticCurveTo(X + 128, my + 8, X + 156, my - 16); g.stroke();
      g.fillStyle = "rgba(200,80,90,.55)"; g.beginPath(); g.ellipse(X + 128, my + 8, 12, 4, 0, 0, 7); g.fill();
    } else if (L.npc) {
      // moradores: olho, sobrancelha, boca e detalhes (bigode, óculos, rugas, batom, sardas)
      const o = L.npc;
      for (const sd of [-1, 1]) eye(sd, { iris: o.iris || "#4a2a18", h: o.old ? 15 : 20, w: o.old ? 26 : 28, lash: o.lash, look: 3 });
      if (o.old) { g.strokeStyle = INK; g.lineWidth = 8; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(ex(sd) - 26, ey - 6); g.quadraticCurveTo(ex(sd), ey - 18, ex(sd) + 26, ey - 6); g.stroke(); } }
      g.fillStyle = "#" + (o.brow || 0x2a1a10).toString(16).padStart(6, "0");
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(ex(sd) - sd * 26, ey - 34 - (o.brow2 || 0) * sd); g.quadraticCurveTo(ex(sd), ey - 46, ex(sd) + sd * 30, ey - 36 + (o.frown ? 8 : 0)); g.lineTo(ex(sd) + sd * 30, ey - 30 + (o.frown ? 8 : 0)); g.quadraticCurveTo(ex(sd), ey - 38, ex(sd) - sd * 26, ey - 28); g.fill(); }
      nose();
      blush(o.blush ?? 0.25);
      if (o.freckles) { g.fillStyle = "rgba(120,60,30,.5)"; for (const [dx, dy] of [[-56, 40], [-46, 48], [52, 42], [60, 48], [-60, 50], [44, 38]]) { g.beginPath(); g.arc(X + 128 + dx, ey + dy, 3, 0, 7); g.fill(); } }
      if (o.old) { g.strokeStyle = "rgba(80,40,20,.35)"; g.lineWidth = 4; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(X + 128 + sd * 38, my - 24); g.quadraticCurveTo(X + 128 + sd * 46, my - 8, X + 128 + sd * 40, my + 6); g.stroke(); g.beginPath(); g.moveTo(ex(sd) + sd * 30, ey + 6); g.lineTo(ex(sd) + sd * 40, ey + 2); g.stroke(); } }
      if (o.lips) { g.fillStyle = "#" + o.lips.toString(16).padStart(6, "0"); g.beginPath(); g.moveTo(X + 106, my - 6); g.quadraticCurveTo(X + 128, my - 16, X + 150, my - 6); g.quadraticCurveTo(X + 128, my + 12, X + 106, my - 6); g.fill(); }
      g.strokeStyle = INK; g.lineWidth = 6; g.beginPath();
      if (o.mouth === "o") g.arc(X + 128, my - 2, 9, 0, 7);
      else if (o.mouth === "flat") { g.moveTo(X + 110, my - 4); g.lineTo(X + 146, my - 4); }
      else { g.moveTo(X + 104, my - 10); g.quadraticCurveTo(X + 128, my + 8, X + 152, my - 10); }
      g.stroke();
      if (o.mustache) { g.fillStyle = "#" + o.mustache.toString(16).padStart(6, "0"); g.beginPath(); g.moveTo(X + 96, my - 10); g.quadraticCurveTo(X + 112, my - 30, X + 128, my - 20); g.quadraticCurveTo(X + 144, my - 30, X + 160, my - 10); g.quadraticCurveTo(X + 128, my - 16, X + 96, my - 10); g.fill(); }
      if (o.beard) { g.fillStyle = "#" + o.beard.toString(16).padStart(6, "0"); g.globalAlpha = 0.85; g.beginPath(); g.moveTo(X + 70, my - 30); g.quadraticCurveTo(X + 80, my + 50, X + 128, my + 56); g.quadraticCurveTo(X + 176, my + 50, X + 186, my - 30); g.quadraticCurveTo(X + 170, my + 18, X + 128, my + 20); g.quadraticCurveTo(X + 86, my + 18, X + 70, my - 30); g.fill(); g.globalAlpha = 1; }
      if (o.glasses) { g.strokeStyle = "#" + o.glasses.toString(16).padStart(6, "0"); g.lineWidth = 7; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(ex(sd), ey, 34, 28, 0, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(ex(-1) + 34, ey - 4); g.lineTo(ex(1) - 34, ey - 4); g.stroke(); }
    } else {
      eye(-1, {});
      eye(1, {});
      brow(-1, 3);
      brow(1, 3);
      nose();
      g.strokeStyle = INK;
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(X + 100, my - 10);
      g.quadraticCurveTo(X + 128, my + 12, X + 158, my - 12);
      g.stroke();
    }
    g.restore();
  }
  function paint(g) {
    for (const k in FACE) face(g, k, LOOKS[k]);
    // nuvem da Manu
    {
      const x = 1984, y = 320;
      g.save();
      g.fillStyle = "#fff";
      g.strokeStyle = INK;
      g.lineWidth = 7;
      g.beginPath();
      g.arc(x - 26, y + 8, 22, Math.PI * 0.5, Math.PI * 1.5);
      g.arc(x - 6, y - 14, 26, Math.PI * 1.1, Math.PI * 1.9);
      g.arc(x + 24, y - 4, 22, Math.PI * 1.3, Math.PI * 0.5);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = INK;
      g.beginPath(); g.arc(x - 12, y + 2, 4, 0, 7); g.arc(x + 10, y + 2, 4, 0, 7); g.fill();
      g.lineWidth = 4;
      g.beginPath(); g.arc(x - 1, y + 8, 7, 0.2, Math.PI - 0.2); g.stroke();
      g.restore();
    }
    // tubarão da sola do shape do K.F. (desenho original, vertical: bico em cima)
    {
      const x = 1600, y = 256;
      g.save();
      g.fillStyle = "#1b1530";
      g.fillRect(x - 64, y, 128, 384);
      g.fillStyle = "#3fd0ff";
      g.fillRect(x - 64, y + 300, 128, 84);
      for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? "#ffd23f" : "#ff4fa3"; g.fillRect(x - 64, y + 300 + i * 6, 128, 3); }
      // corpo
      g.fillStyle = "#9fb4d0"; g.strokeStyle = "#fff"; g.lineWidth = 5;
      g.beginPath();
      g.moveTo(x, y + 22);
      g.quadraticCurveTo(x + 40, y + 120, x + 26, y + 250);
      g.lineTo(x + 44, y + 300); g.lineTo(x, y + 270); g.lineTo(x - 44, y + 300); g.lineTo(x - 26, y + 250);
      g.quadraticCurveTo(x - 40, y + 120, x, y + 22);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#e9eef7";
      g.beginPath(); g.moveTo(x, y + 60); g.quadraticCurveTo(x + 16, y + 140, x, y + 230); g.quadraticCurveTo(x - 16, y + 140, x, y + 60); g.fill();
      // nadadeiras
      g.fillStyle = "#9fb4d0";
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x + sd * 24, y + 140); g.lineTo(x + sd * 58, y + 190); g.lineTo(x + sd * 22, y + 175); g.closePath(); g.fill(); g.stroke(); }
      // boca e dentes
      g.fillStyle = "#e23b3b"; g.beginPath(); g.moveTo(x - 14, y + 70); g.quadraticCurveTo(x, y + 92, x + 14, y + 70); g.closePath(); g.fill();
      g.fillStyle = "#fff"; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * 5 - 2.5, y + 71); g.lineTo(x + i * 5 + 2.5, y + 71); g.lineTo(x + i * 5, y + 78); g.fill(); }
      g.fillStyle = "#1b1530"; for (const sd of [-1, 1]) { g.beginPath(); g.arc(x + sd * 11, y + 56, 4, 0, 7); g.fill(); }
      g.font = '900 30px "Arial Black","Impact","DejaVu Sans",sans-serif'; g.textAlign = "center";
      g.lineWidth = 6; g.strokeStyle = "#1b1530"; g.strokeText("SHARK", x, y + 350); g.fillStyle = "#fff"; g.fillText("SHARK", x, y + 350);
      g.restore();
    }
    // cifrão do shape do Kauã
    {
      const x = 1984, y = 448;
      g.save();
      g.font = '900 104px "Arial Black","Impact","DejaVu Sans",sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineWidth = 14;
      g.strokeStyle = INK;
      g.lineJoin = "round";
      g.strokeText("$", x, y + 6);
      g.fillStyle = "#ffd23f";
      g.fillText("$", x, y + 6);
      g.restore();
    }
    // xadrezinho do tênis da Julie e o gato preto do shape dela
    {
      const x = 1024, y = 960;
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? "#1b1530" : "#ffffff"; g.fillRect(x + i * 8, y + j * 8, 8, 8); }
      const cx = 1120, cy = 994;
      g.save(); g.beginPath(); g.rect(1088, 960, 64, 64); g.clip();
      g.fillStyle = "#b79cff"; g.fillRect(1088, 960, 64, 64);
      g.fillStyle = "#1b1530";
      g.beginPath(); g.ellipse(cx, cy + 8, 17, 15, 0, 0, 7); g.fill();
      g.beginPath(); g.arc(cx, cy - 8, 13, 0, 7); g.fill();
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(cx + sd * 4, cy - 18); g.lineTo(cx + sd * 13, cy - 26); g.lineTo(cx + sd * 12, cy - 11); g.fill(); }
      g.lineWidth = 5; g.strokeStyle = "#1b1530"; g.beginPath(); g.moveTo(cx + 15, cy + 16); g.quadraticCurveTo(cx + 30, cy + 10, cx + 26, cy - 6); g.stroke();
      g.fillStyle = "#ffd23f"; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(cx + sd * 5, cy - 9, 2.6, 3.4, 0, 0, 7); g.fill(); }
      g.fillStyle = "#ff8fc8"; g.beginPath(); g.arc(cx, cy - 4, 1.6, 0, 7); g.fill();
      g.restore();
    }
    // leão da Gabi: faixas vermelho/amarelo/verde e um leão de juba em raios (desenho original)
    {
      const x = 1728, y = 256;
      g.save();
      g.beginPath(); g.rect(x - 64, y, 128, 384); g.clip();
      [["#d62828", 0], ["#f7c531", 128], ["#1f9a4a", 256]].forEach(([c, o]) => { g.fillStyle = c; g.fillRect(x - 64, y + o, 128, 128); });
      g.fillStyle = "rgba(27,21,48,.18)";
      for (let i = 0; i < 9; i++) g.fillRect(x - 64, y + 40 * i + 18, 128, 3);
      const cx = x, cy = y + 192;
      g.lineJoin = "round";
      // juba: raios grossos alternando ferrugem e mel
      for (let i = 0; i < 18; i++) {
        const a0 = (i / 18) * Math.PI * 2, a1 = ((i + 0.5) / 18) * Math.PI * 2, a2 = ((i + 1) / 18) * Math.PI * 2;
        const R0 = 34, R1 = i % 2 ? 60 : 54;
        g.fillStyle = i % 2 ? "#8a3f12" : "#c46a1c";
        g.strokeStyle = INK; g.lineWidth = 4;
        g.beginPath();
        g.moveTo(cx + Math.cos(a0) * R0, cy + Math.sin(a0) * R0);
        g.lineTo(cx + Math.cos(a1) * R1, cy + Math.sin(a1) * R1);
        g.lineTo(cx + Math.cos(a2) * R0, cy + Math.sin(a2) * R0);
        g.closePath(); g.fill(); g.stroke();
      }
      // cara
      g.fillStyle = "#f2b84b"; g.strokeStyle = INK; g.lineWidth = 5;
      g.beginPath(); g.ellipse(cx, cy + 2, 38, 40, 0, 0, 7); g.fill(); g.stroke();
      for (const sd of [-1, 1]) {
        g.fillStyle = "#f2b84b"; g.beginPath(); g.arc(cx + sd * 30, cy - 32, 11, 0, 7); g.fill(); g.stroke();
        g.fillStyle = "#c46a1c"; g.beginPath(); g.arc(cx + sd * 30, cy - 32, 5, 0, 7); g.fill();
        // olhos calmos meio fechados
        g.strokeStyle = INK; g.lineWidth = 5;
        g.beginPath(); g.arc(cx + sd * 14, cy - 6, 7, Math.PI * 0.1, Math.PI * 0.9); g.stroke();
      }
      g.fillStyle = "#fbe3b0"; g.beginPath(); g.ellipse(cx, cy + 20, 22, 16, 0, 0, 7); g.fill();
      g.fillStyle = INK; g.beginPath(); g.moveTo(cx - 9, cy + 8); g.lineTo(cx + 9, cy + 8); g.lineTo(cx, cy + 18); g.closePath(); g.fill();
      g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy + 18); g.lineTo(cx, cy + 24);
      g.quadraticCurveTo(cx - 8, cy + 31, cx - 14, cy + 25); g.moveTo(cx, cy + 24); g.quadraticCurveTo(cx + 8, cy + 31, cx + 14, cy + 25); g.stroke();
      // estrelinhas
      g.fillStyle = "#fff";
      for (const [sx, sy] of [[-40, 40], [38, 80], [-34, 320], [40, 350]]) {
        g.beginPath();
        for (let k = 0; k < 8; k++) { const r = k % 2 ? 4 : 10, a = (k / 8) * Math.PI * 2; g.lineTo(x + sx + Math.cos(a) * r, y + sy + Math.sin(a) * r); }
        g.closePath(); g.fill();
      }
      g.restore();
    }
    // shape da Kauane: fundo preto, raio rosa-choque e coroa (quem manda aqui)
    {
      const x = 1856, y = 256;
      g.save();
      g.beginPath(); g.rect(x - 64, y, 128, 384); g.clip();
      g.fillStyle = "#16141c"; g.fillRect(x - 64, y, 128, 384);
      g.fillStyle = "#2a2632";
      for (let i = -4; i < 12; i++) { g.beginPath(); g.moveTo(x - 64, y + i * 40); g.lineTo(x + 64, y + i * 40 + 60); g.lineTo(x + 64, y + i * 40 + 70); g.lineTo(x - 64, y + i * 40 + 10); g.fill(); }
      g.lineJoin = "round"; g.strokeStyle = "#fff"; g.lineWidth = 6;
      // raio
      g.fillStyle = "#ff2e7a";
      g.beginPath();
      g.moveTo(x + 18, y + 120); g.lineTo(x - 34, y + 238); g.lineTo(x - 2, y + 238); g.lineTo(x - 22, y + 350);
      g.lineTo(x + 36, y + 214); g.lineTo(x + 4, y + 214); g.lineTo(x + 26, y + 120); g.closePath();
      g.fill(); g.stroke();
      // coroa
      g.fillStyle = "#ffd23f"; g.strokeStyle = INK; g.lineWidth = 6;
      g.beginPath();
      g.moveTo(x - 42, y + 96); g.lineTo(x - 48, y + 40); g.lineTo(x - 24, y + 66); g.lineTo(x, y + 28); g.lineTo(x + 24, y + 66); g.lineTo(x + 48, y + 40); g.lineTo(x + 42, y + 96);
      g.closePath(); g.fill(); g.stroke();
      for (const [dx, c] of [[-24, "#ff2e7a"], [0, "#3fd0ff"], [24, "#ff2e7a"]]) { g.fillStyle = c; g.beginPath(); g.arc(x + dx, y + 82, 6, 0, 7); g.fill(); g.stroke(); }
      g.restore();
    }
  }

  // ---------- esqueleto ----------
  const BIND = { px: 0, py: 1.06, pz: 0, lean: 0, twist: 0, hy: 0, hp: 0, hF: [0.06, 0.92, 0.42], hB: [0.06, 0.92, -0.42], lf: 0, lb: 0 };
  function frames(base, p, feetBase, look) {
    const LEN = lenOf(look);
    feetBase = feetBase || base;
    const F = new Array(12);
    const torso = M.mul(base, M.mul(M.T(p.px, p.py, p.pz), M.mul(M.RY(p.twist), M.mul(M.RZ(-p.lean), M.RX(p.roll || 0)))));
    F[BONE.torso] = torso;
    F[BONE.head] = M.mul(torso, M.mul(M.T(0, LEN.torso + 0.04, 0), M.mul(M.RY(p.hy), M.mul(M.RZ(p.hp || 0), M.RX(p.hr || 0)))));
    const fwd = M.dir(base, [1, 0, 0]), along = M.dir(base, [0, 0, 1]);
    for (const [s, hz, fz, lift] of [["F", 0.1, 0.2, p.lf], ["B", -0.1, -0.2, p.lb]]) {
      const hip = M.pt(torso, [0, -0.04, hz]);
      let foot, fb = feetBase, yawF = look.skates || p.walk ? 0 : s === "F" ? 0.25 : -0.2;
      const pushing = p.push !== undefined && !look.skates;
      const pd = p.pushDir || 1;
      if (pushing && s === (p.pushFoot || "B")) {
        // pé de trás no chão, ao lado do shape: pisa perto do truck da frente e varre pra trás
        fb = base;
        const ph = p.push;
        let zz, yy;
        if (ph < 0.5) { const u = ph / 0.5; zz = pd * (0.12 - 0.62 * u); yy = 0.075; }
        else { const u = (ph - 0.5) / 0.5; zz = pd * (-0.5 + 0.62 * u); yy = 0.075 + Math.sin(u * Math.PI) * 0.13; }
        foot = M.pt(base, [0.2, yy, zz]);
        yawF = (-Math.PI / 2) * pd * 0.88;
      } else if (pushing) {
        // pé da frente gira e aponta pra onde o skate vai, em cima dos parafusos
        foot = M.pt(feetBase, [0.0, 0.21, pd * 0.17]);
        yawF = (-Math.PI / 2) * pd;
      } else if (look.skates) {
        // patins: pés quase embaixo do quadril (afastados de leve) e joelho apontando pra frente
        const fzS = s === "F" ? (p.fzF ?? 0.13) : (p.fzB ?? -0.13);
        const fxS = (s === "F" ? p.fxF : p.fxB) ?? (p.fx || 0);
        foot = M.pt(feetBase, [0.02 + fxS, 0.21 + lift, fzS]);
      } else foot = M.pt(feetBase, [0.02 + ((s === "F" ? p.fxF : p.fxB) || p.fx || 0), 0.21 + lift, (s === "F" ? p.fzxF : p.fzxB) ?? (p.walk ? (s === "F" ? p.fzF : p.fzB) : fz)]);
      const hint = look.skates || p.walk ? V.add(fwd, V.mul(along, hz > 0 ? 0.04 : -0.04)) : V.add(fwd, V.mul(along, hz > 0 ? 0.2 : -0.2));
      const k = ik(hip, foot, LEN.thigh, LEN.shin, hint);
      F[BONE["thigh" + s]] = seg(hip, k.mid, along);
      F[BONE["shin" + s]] = seg(k.mid, k.end, along);
      const fl = M.pt(M.inv(fb), k.end);
      // fy = abre a ponta do pé pro lado; fp = levanta a ponta (pé apoiado no calcanhar, sola pra frente)
      const fy = (s === "F" ? p.fyF : p.fyB) || 0, fp = (s === "F" ? p.fpF : p.fpB) || 0;
      F[BONE["foot" + s]] = M.mul(fb, M.mul(M.T(fl[0], fl[1], fl[2]), M.mul(M.RY(yawF + fy), M.RZ(fp))));
    }
    for (const [s, sz, ht] of [["F", 0.19, p.hF], ["B", -0.19, p.hB]]) {
      const sh = M.pt(torso, [0, LEN.torso - 0.08, sz * (look.shoulder || 1)]);
      const tgt = M.pt(ht[3] ? feetBase : base, ht);
      const hint = M.dir(torso, [-0.4, -0.5, sz * 5]);
      const k = ik(sh, tgt, LEN.up, LEN.fore + 0.04, hint);
      F[BONE["up" + s]] = seg(sh, k.mid, fwd);
      F[BONE["fore" + s]] = seg(k.mid, k.end, fwd);
    }
    return F;
  }

  // ---------- construção da malha contínua ----------
  // Seções poligonais desenhadas à mão (x = frente, z = lado), em vez de círculos:
  // peito com plano frontal, calça com vinco na frente e traseira reta, membros hexagonais.
  const SEC = {
    torso: [[1, 0], [0.86, 0.62], [0.3, 1], [-0.55, 0.92], [-1, 0.35], [-1, -0.35], [-0.55, -0.92], [0.3, -1], [0.86, -0.62]],
    leg: [[1, 0], [0.5, 0.95], [-0.45, 1], [-1, 0.3], [-1, -0.3], [-0.45, -1], [0.5, -0.95]],
    limb: [[1, 0], [0.5, 0.87], [-0.5, 0.87], [-1, 0], [-0.5, -0.87], [0.5, -0.87]],
  };
  const FLAT = 0.25; // material de facetas chapadas (roupa, cabelo, calçado)
  // extrusão de um perfil lateral (x,y) com largura variável em z — calçados e patins
  function extrude(t, prof, wfn, col, mat = FLAT) {
    const st = t.v.length, n = prof.length;
    const L = prof.map(([x, y]) => [x, y, -wfn(x) / 2]), Rr = prof.map(([x, y]) => [x, y, wfn(x) / 2]);
    const cx = prof.reduce((s, p) => s + p[0], 0) / n, cy = prof.reduce((s, p) => s + p[1], 0) / n;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      t.quad(L[i], L[j], Rr[j], Rr[i], col, mat);
      t.tri([cx, cy, -wfn(cx) / 2], L[j], L[i], col, mat);
      t.tri([cx, cy, wfn(cx) / 2], Rr[i], Rr[j], col, mat);
    }
    t.orient([cx, cy, 0], st);
  }
  // lâmina pontuda (mechas, espetos): base retangular achatada + ponta
  function shard(t, base, tip, w, w2, col, mat = FLAT) {
    const st = t.v.length;
    const d = V.norm(V.sub(tip, base));
    let u = V.cross(d, [0, 1, 0]);
    if (V.len(u) < 0.1) u = V.cross(d, [1, 0, 0]);
    u = V.norm(u);
    const v = V.cross(d, u);
    const P = [V.add(V.add(base, V.mul(u, w)), V.mul(v, w2)), V.add(V.sub(base, V.mul(u, w)), V.mul(v, w2)), V.sub(V.sub(base, V.mul(u, w)), V.mul(v, w2)), V.sub(V.add(base, V.mul(u, w)), V.mul(v, w2))];
    for (let i = 0; i < 4; i++) t.tri(P[i], P[(i + 1) % 4], tip, col, mat);
    t.quad(P[3], P[2], P[1], P[0], col, mat);
    t.orient(V.lerp(base, tip, 0.3), st);
  }
  function build(look) {
    const LEN = lenOf(look);
    const m = new Mesh();
    const F = frames(M.I(), bindOf(look), null, look);
    const c = (h) => hex(h);
    const skin = c(look.skin), top = c(look.top), top2 = c(look.top2), pants = c(look.pants);
    // seção desenhada em volta de um osso (twist gira a seção pra gerar facetas diagonais)
    const sec = (bone, y, S, rx, rz, w, o = {}) => {
      const Fm = F[bone], tw = o.twist || 0, ct = Math.cos(tw), st = Math.sin(tw);
      const pts = S.map(([x, z], i) => {
        const k = o.f ? o.f(i) : 1;
        const xx = x * ct - z * st, zz = x * st + z * ct;
        return M.pt(Fm, [(o.ox || 0) + xx * rx * k, y, (o.oz || 0) + zz * rz * k]);
      });
      return { pts, w: w || [bone, bone, 0] };
    };
    const chain = (rings, cols, capA, capB, mat = 0) => {
      const n = rings[0].pts.length;
      for (let r = 0; r < rings.length - 1; r++) {
        const A = rings[r], B = rings[r + 1], col = Array.isArray(cols[0]) ? cols[r] || cols[cols.length - 1] : cols;
        const mm = Array.isArray(mat) ? mat[r] ?? mat[mat.length - 1] : mat;
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          m.tri(A.pts[i], B.pts[i], B.pts[j], col, mm, null, [A.w, B.w, B.w]);
          m.tri(A.pts[i], B.pts[j], A.pts[j], col, mm, null, [A.w, B.w, A.w]);
        }
      }
      const cap = (Rg, col, down, mm) => {
        const ctr = Rg.pts.reduce((s, p) => V.add(s, p), [0, 0, 0]).map((v) => v / n);
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          if (down) m.tri(ctr, Rg.pts[j], Rg.pts[i], col, mm, null, [Rg.w, Rg.w, Rg.w]);
          else m.tri(ctr, Rg.pts[i], Rg.pts[j], col, mm, null, [Rg.w, Rg.w, Rg.w]);
        }
      };
      const c0 = Array.isArray(cols[0]) ? cols[0] : cols, c1 = Array.isArray(cols[0]) ? cols[cols.length - 1] : cols;
      const m0 = Array.isArray(mat) ? mat[0] : mat, m1 = Array.isArray(mat) ? mat[mat.length - 1] : mat;
      if (capA) cap(rings[0], c0, true, m0);
      if (capB) cap(rings[rings.length - 1], c1, false, m1);
    };
    const rigid = (bone, build, sc = 1) => {
      const t = new Mesh();
      build(t);
      const Fm = F[bone];
      for (let i = 0; i < t.v.length; i += 12) {
        const p = M.pt(Fm, [t.v[i] * sc, t.v[i + 1] * sc, t.v[i + 2] * sc]);
        const n = M.dir(Fm, [t.v[i + 3], t.v[i + 4], t.v[i + 5]]);
        t.v[i] = p[0]; t.v[i + 1] = p[1]; t.v[i + 2] = p[2];
        t.v[i + 3] = n[0]; t.v[i + 4] = n[1]; t.v[i + 5] = n[2];
      }
      t.w = [];
      for (let i = 0; i < t.v.length / 12; i++) t.w.push(bone, bone, 0);
      m.merge(t);
    };
    const T0 = BONE.torso, HD = BONE.head, S9 = SEC.torso;
    const SHW = look.shoulder || 1, TL = LEN.torso;
    const loose = look.tee === "loose";
    const low = look.overall ? c(look.dress) : pants;
    const beltC = c(0x161320);
    // ----- tronco: quadril (calça) -> cinto -> barra da camiseta solta -> peito -> ombros -> pescoço -----
    const tor = [], tc = [], tm = [];
    const P = (y, rx, rz, col, mat, w) => { tor.push(sec(T0, y, S9, rx, rz, w)); if (col) { tc.push(col); tm.push(mat); } };
    P(-0.17, 0.11, 0.13, low, FLAT);
    P(-0.08, 0.14, 0.19, low, FLAT);
    P(0.0, 0.135, 0.18, look.belt ? beltC : low, look.belt ? 0 : FLAT);
    if (look.belt) P(0.075, 0.138, 0.183, top, FLAT);
    // ressalto da barra: a camiseta cai por cima da cintura
    const hem = look.overall ? 0.02 : loose ? 0.08 : 0.06;
    if (look.flannel) {
      // flanela: faixas claras e escuras na altura do tronco dão o xadrez
      const K = [[hem, loose ? 0.168 : 0.142, loose ? 0.215 : 0.185], [0.2, loose ? 0.158 : 0.132, (loose ? 0.208 : 0.17) * SHW], [0.31, 0.155, 0.21 * SHW], [0.4, 0.13, 0.235 * SHW]];
      const at = (y) => { let i = 0; while (i < K.length - 2 && K[i + 1][0] <= y) i++; const a = K[i], b = K[i + 1], k = Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0]))); return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; };
      const dark = c(look.top2);
      [hem, 0.1, 0.125, 0.2, 0.225, 0.29, 0.315, 0.37, 0.4].forEach((y, i) => { const [rx, rz] = at(y); P(y, rx, rz, i % 2 ? dark : top, FLAT); });
    } else {
    P(hem, loose ? 0.168 : 0.142, loose ? 0.215 : 0.185, top, FLAT);
    P(0.2, loose ? 0.158 : 0.132, loose ? 0.208 * SHW : 0.17, top, FLAT);
    P(0.31, 0.155, 0.21 * SHW, top, FLAT);
    P(0.4, 0.13, 0.235 * SHW, top, FLAT);
    }
    P(TL - 0.015, 0.09, 0.19 * SHW, look.hood ? top : skin, look.hood ? FLAT : 0);
    P(TL + 0.02, 0.058, 0.064, skin, 0);
    P(TL + 0.11, 0.054, 0.058, null, 0, [T0, HD, 0.6]);
    chain(tor, tc, true, false, tm);
    rigid(T0, (t) => {
      if (look.belt) {
        t.box(0.128, 0.008, -0.05, 0.168, 0.07, 0.05, c(0xd5dbe8), { m: 1 });
        t.box(0.163, 0.022, -0.028, 0.172, 0.056, 0.028, beltC);
        shard(t, [0.11, 0.04, 0.13], [0.06, -0.09, 0.17], 0.018, 0.006, beltC);
      }
      if (look.print) t.decal(look.overall ? [0.152, 0.17, 0] : [0.168, 0.29, 0], [0, 0, -1], [0, 1, 0], look.overall ? 0.11 : 0.18, look.overall ? 0.11 : 0.18, SPR[look.print]);
      if (look.hood) {
        t.ball([-0.11, TL - 0.02, 0], 0.13, V.mul(top, 0.85), FLAT, 7, 3, { sx: 0.65, sy: 0.55 });
        t.box(0.125, 0.12, -0.012, 0.145, TL - 0.05, 0.012, top2);
      }
      if (look.tie) {
        // gola em duas abas + gravata frouxa e torta
        for (const s of [-1, 1]) t.tri([0.06, TL + 0.01, s * 0.035], [0.135, TL - 0.075, s * 0.11], [0.05, TL - 0.03, s * 0.115], c(0xffffff), FLAT);
        t.box(0.11, TL - 0.075, -0.024, 0.145, TL - 0.035, 0.024, c(look.tie), { m: FLAT });
        t.quad([0.145, TL - 0.075, -0.02], [0.145, TL - 0.075, 0.02], [0.168, 0.15, 0.05], [0.168, 0.15, 0.0], c(look.tie), FLAT);
        t.tri([0.168, 0.15, 0.05], [0.168, 0.15, 0.0], [0.17, 0.105, 0.027], c(look.tie), FLAT);
        for (let i = 0; i < 3; i++) t.box(0.142, 0.12 + i * 0.08, 0.04, 0.152, 0.135 + i * 0.08, 0.055, c(0xffffff));
      }
      if (look.walkman) {
        t.tube([0.0, -0.04, 0.18], [0.0, -0.04, 0.215], 0.072, 0.072, 10, c(0xd5dbe8), 1, { capCol: c(0xe9edf5) });
        t.tube([0.0, -0.04, 0.215], [0.0, -0.04, 0.22], 0.038, 0.038, 10, c(0xe23b3b), 0);
        const wc = c(look.earbud ? 0xf4f4f4 : 0x1b1530);
        t.tube([0.06, -0.01, 0.18], [0.17, TL - 0.12, 0.12], 0.006, 0.006, 3, wc, 0, { cap: false });
        t.tube([0.17, TL - 0.12, 0.12], [0.06, TL + 0.04, 0.08], 0.006, 0.006, 3, wc, 0, { cap: false });
      }
      if (look.jacket) {
        // frente aberta mostrando a blusa (segue o contorno do peito) + gola de pelúcia
        const inner = c(look.inner), ys = [hem + 0.01, 0.2, 0.31, 0.4, TL - 0.03], rx = [0.17, 0.16, 0.157, 0.132, 0.094];
        for (let i = 0; i < ys.length - 1; i++) {
          const w0 = 0.03 + i * 0.008, w1 = 0.03 + (i + 1) * 0.008;
          t.quad([rx[i] + 0.004, ys[i], -w0], [rx[i] + 0.004, ys[i], w0], [rx[i + 1] + 0.004, ys[i + 1], w1], [rx[i + 1] + 0.004, ys[i + 1], -w1], inner, FLAT);
          for (const sd of [-1, 1]) t.box(rx[i] - 0.004, ys[i], sd * (w0 + 0.004) - 0.008, rx[i] + 0.014, ys[i + 1], sd * (w0 + 0.004) + 0.008, V.mul(top, 0.9), { m: FLAT });
        }
        if (look.flannel) for (const s2 of [-1, 1]) t.tri([0.07, TL + 0.0, s2 * 0.04], [0.15, TL - 0.09, s2 * 0.12], [0.05, TL - 0.04, s2 * 0.13], top, FLAT);
        for (let i = 0; i < (look.flannel ? 0 : 15); i++) {
          const a = -Math.PI * 0.85 + (i / 14) * Math.PI * 1.7;
          if (Math.abs(a) < 0.42) continue;
          t.ball([Math.cos(a) * 0.098 - 0.02, TL - 0.035 + Math.abs(Math.sin(a * 0.5)) * 0.025, Math.sin(a) * 0.165], 0.068, V.mul(top, i % 2 ? 0.97 : 0.9), FLAT, 6, 4, { sy: 0.75 });
        }
      }
      if (look.overall) {
        const d = c(look.dress);
        t.box(0.115, 0.0, -0.1, 0.152, 0.25, 0.1, d, { m: FLAT }); // peitilho
        for (const s of [-1, 1]) {
          t.quad([0.15, 0.25, s * 0.07], [0.15, 0.25, s * 0.11], [0.08, TL + 0.0, s * 0.125], [0.08, TL + 0.0, s * 0.085], d, FLAT);
          t.quad([0.08, TL, s * 0.125], [0.08, TL, s * 0.085], [-0.14, 0.2, s * 0.06], [-0.14, 0.2, s * 0.1], d, FLAT);
          t.ball([0.152, 0.235, s * 0.08], 0.014, c(0xffd23f), 1, 6, 3);
        }
      }
    });
    // ----- pernas -----
    for (const s of ["F", "B"]) {
      const TH = BONE["thigh" + s], SH = BONE["shin" + s], FT = BONE["foot" + s];
      const sg = s === "F" ? 1 : -1;
      if (look.skates || look.shortLegs) {
        // shortinho + perna fina + meião
        const sh = c(look.dress), sock = c(look.socks), L7 = SEC.leg;
        const R = [
          sec(TH, -0.05, L7, 0.13, 0.13, [T0, TH, 0.6]), sec(TH, 0.08, L7, 0.13, 0.135), sec(TH, 0.12, L7, 0.136, 0.14),
          sec(TH, 0.125, L7, 0.07, 0.072), sec(TH, LEN.thigh - 0.03, L7, 0.058, 0.06, [TH, SH, 0.3]),
          sec(SH, 0.03, L7, 0.056, 0.058, [TH, SH, 0.75]), sec(SH, 0.1, L7, 0.06, 0.062), sec(SH, 0.105, L7, 0.066, 0.068),
          sec(SH, 0.22, L7, 0.06, 0.062), sec(SH, LEN.shin - 0.02, L7, 0.05, 0.05, [SH, FT, 0.5]),
        ];
        chain(R, [sh, sh, sh, skin, skin, skin, sock, sock, sock], false, true, [FLAT, FLAT, FLAT, 0, 0, 0, FLAT, FLAT, FLAT]);
      } else {
        // calça larga em trapézio: abre do quadril até o chão e cobre metade do tênis
        const L7 = SEC.leg, pr = look.pantsR || 1, fl = look.flare || 1;
        const tw = (k) => sg * k * 0.16;
        const R = [
          sec(TH, -0.05, L7, 0.15, 0.15, [T0, TH, 0.6]),
          sec(TH, 0.1, L7, 0.16 * pr, 0.158 * pr, null, { twist: tw(1) }),
          sec(TH, 0.26, L7, 0.168 * pr, 0.164 * pr, null, { twist: tw(-1) }),
          sec(TH, LEN.thigh - 0.02, L7, 0.172 * pr, 0.168 * pr, [TH, SH, 0.35], { twist: tw(1) }),
          sec(SH, 0.06, L7, 0.168 * pr, 0.164 * pr, [TH, SH, 0.8], { twist: tw(-1) }),
          sec(SH, 0.2, L7, (0.17 + 0.012 * fl) * pr, (0.166 + 0.01 * fl) * pr, null, { twist: tw(1) }),
          sec(SH, 0.33, L7, (0.175 + 0.022 * fl) * pr, (0.17 + 0.016 * fl) * pr, null, { twist: tw(-1) }),
          sec(SH, LEN.shin - 0.05, L7, (0.18 + 0.032 * fl) * pr, (0.172 + 0.024 * fl) * pr, [SH, FT, 0.2], { twist: tw(1) }),
          sec(SH, LEN.shin - 0.01, L7, (0.178 + 0.03 * fl) * pr, (0.168 + 0.022 * fl) * pr, [SH, FT, 0.4]),
        ];
        const dk = V.mul(pants, 0.9);
        chain(R, [pants, pants, pants, pants, pants, pants, pants, dk], false, false, FLAT);
        // barra: vira pra dentro (borda grossa visível)
        const inner = sec(SH, LEN.shin - 0.04, L7, 0.13 * pr, 0.125 * pr, [SH, FT, 0.5]);
        chain([R[R.length - 1], inner], V.mul(pants, 0.6), false, false, FLAT);
      }
      if (look.legArt && s === "B") rigid(SH, (t) => t.decal([0.0, 0.22, -0.218], [1, 0, 0], [0, -1, 0], 0.14, 0.14, SPR[look.legArt]));
      // calçado por perfil extrudado
      rigid(FT, (t) => {
        if (look.skates) {
          const boot = c(look.shoe), trim = c(look.shoe2);
          extrude(t, [[-0.12, -0.12], [0.17, -0.12], [0.2, -0.09], [0.18, -0.045], [0.07, -0.015], [0.03, 0.08], [0.0, 0.19], [-0.12, 0.19], [-0.135, 0.02]], (x) => 0.13 - Math.max(0, x - 0.08) * 0.35, boot);
          extrude(t, [[-0.125, 0.15], [0.005, 0.15], [-0.005, 0.2], [-0.125, 0.2]], () => 0.14, trim);
          for (let i = 0; i < 3; i++) t.box(0.04 + i * 0.03, -0.01 + i * 0.03, -0.045, 0.06 + i * 0.03, 0.002 + i * 0.03, 0.045, trim);
          t.box(-0.13, -0.15, -0.06, 0.18, -0.12, 0.06, c(0xd5dbe8), { m: 1 });
          for (const x of [-0.08, 0.12]) for (const z of [-0.065, 0.065]) t.tube([x, -0.185, z - 0.022], [x, -0.185, z + 0.022], 0.036, 0.036, 7, c(0xffd23f), FLAT, { capCol: c(0xfff3b0) });
          shard(t, [0.19, -0.13, 0], [0.235, -0.18, 0], 0.03, 0.025, c(0xff4fa3));
        } else if (look.chinelo) {
          // chinelo de dedo: solado fino, pé de fora e a tira em V
          const sk = c(look.skin), sol = c(look.chinelo), st = c(look.strap);
          t.box(-0.15, -0.092, -0.058, 0.2, -0.07, 0.058, sol);
          t.box(-0.15, -0.096, -0.06, 0.2, -0.092, 0.06, V.mul(sol, 0.8));
          extrude(t, [[-0.14, -0.07], [0.15, -0.07], [0.19, -0.05], [0.16, -0.03], [0.06, -0.0], [-0.02, 0.03], [-0.1, 0.05], [-0.15, 0.0]], (x) => 0.095 - Math.max(0, x - 0.1) * 0.3, sk);
          for (const z of [-1, 1]) t.tube([0.13, -0.045, 0], [0.0, -0.035, z * 0.05], 0.012, 0.012, 4, st);
          t.tube([0.13, -0.07, 0], [0.13, -0.04, 0], 0.01, 0.01, 4, st);
        } else {
          const body = c(look.shoe), toe = c(look.shoeToe || 0xffffff), sole = c(look.sole || 0xf4f1ea), lace = c(look.lace || 0xffffff);
          const W = (x) => 0.17 - Math.max(0, x - 0.08) * 0.42;
          // sola grossa com ponta levantada
          extrude(t, [[-0.175, -0.088], [0.19, -0.088], [0.25, -0.06], [0.255, -0.035], [-0.18, -0.035]], (x) => W(x) + 0.012, sole);
          // cabedal cano médio
          extrude(t, [[-0.17, -0.036], [0.245, -0.036], [0.235, -0.005], [0.16, 0.035], [0.06, 0.06], [-0.02, 0.12], [-0.14, 0.13], [-0.18, 0.05]], W, body);
          // biqueira
          extrude(t, [[0.1, -0.034], [0.248, -0.034], [0.238, -0.004], [0.165, 0.037], [0.1, 0.045]], (x) => W(x) + 0.008, toe);
          // calcanhar reforçado + gola
          extrude(t, [[-0.185, -0.036], [-0.11, -0.036], [-0.1, 0.1], [-0.145, 0.135], [-0.188, 0.06]], (x) => W(x) + 0.008, toe);
          // língua e cadarço
          shard(t, [0.03, 0.06, 0], [-0.03, 0.17, 0], 0.045, 0.012, body);
          for (let i = 0; i < 3; i++) t.box(0.01 + i * 0.045, 0.072 - i * 0.017, -0.05, 0.03 + i * 0.045, 0.085 - i * 0.017, 0.05, lace);
          // faixa lateral reta (ou o xadrezinho do tênis da Julie)
          if (look.checkerShoe) for (const z of [-1, 1]) t.decal([0.02, 0.0, z * 0.093], [1, 0, 0], [0, 1, 0], 0.26, 0.075, SPR.checker);
          else for (const z of [-1, 1]) t.quad([-0.08, -0.03, z * 0.088], [0.08, -0.03, z * 0.083], [0.03, 0.02, z * 0.078], [-0.1, 0.04, z * 0.084], toe, FLAT);
        }
      }, look.skates ? 1 : look.shoeScale || 1.15);
    }
    // ----- braços: manga larga com aba + braço hexagonal + mão -----
    for (const s of ["F", "B"]) {
      const UP = BONE["up" + s], FO = BONE["fore" + s], L6 = SEC.limb;
      const short = look.sleeve === "short";
      const sl = look.overall ? c(look.top) : top;
      const R = [], C = [], MT = [];
      const add = (r, col, mt) => { R.push(r); if (col) { C.push(col); MT.push(mt); } };
      if (short) {
        add(sec(UP, -0.06, L6, 0.1, 0.1, [T0, UP, 0.5]), sl, FLAT);
        add(sec(UP, 0.05, L6, 0.108, 0.105), sl, FLAT);
        add(sec(UP, 0.13, L6, loose ? 0.122 : 0.1, loose ? 0.118 : 0.098), loose ? V.mul(sl, 0.8) : top2, FLAT); // aba da manga
        add(sec(UP, 0.135, L6, 0.052, 0.05), skin, 0);
        add(sec(UP, 0.2, L6, 0.054, 0.05), skin, 0);
      } else {
        add(sec(UP, -0.06, L6, 0.095, 0.095, [T0, UP, 0.5]), sl, FLAT);
        add(sec(UP, 0.14, L6, 0.082, 0.08), sl, FLAT);
      }
      const arm = short ? skin : sl, am = short ? 0 : FLAT;
      add(sec(UP, LEN.up - 0.005, L6, short ? 0.046 : 0.074, short ? 0.044 : 0.072, [UP, FO, 0.5]), arm, am);
      add(sec(FO, 0.1, L6, short ? 0.047 : 0.072, short ? 0.044 : 0.07), arm, am);
      add(sec(FO, LEN.fore - 0.03, L6, short ? 0.035 : 0.066, short ? 0.034 : 0.066), short ? skin : top2, am);
      const hand = look.glove ? c(look.glove) : skin;
      add(sec(FO, LEN.fore, L6, 0.04, 0.046), hand, 0);
      add(sec(FO, LEN.fore + 0.06, L6, 0.03, 0.058), hand, 0);
      add(sec(FO, LEN.fore + 0.11, L6, 0.024, 0.05), hand, 0);
      add(sec(FO, LEN.fore + 0.135, L6, 0.01, 0.028), null, 0);
      chain(R, C, true, true, MT);
      rigid(FO, (t) => {
        t.tube([0.0, LEN.fore + 0.02, 0.04], [0.03, LEN.fore + 0.08, 0.058], 0.017, 0.012, 5, hand);
        if (look.rasta && s === "B") [0xd62828, 0xf7c531, 0x1f9a4a].forEach((col, i) => extrude(t, [[-0.05, LEN.fore - 0.07 + i * 0.022], [0.05, LEN.fore - 0.07 + i * 0.022], [0.05, LEN.fore - 0.048 + i * 0.022], [-0.05, LEN.fore - 0.048 + i * 0.022]], () => 0.096, c(col)));
        if (look.wristband) extrude(t, [[-0.052, LEN.fore - 0.065], [0.052, LEN.fore - 0.065], [0.052, LEN.fore - 0.005], [-0.052, LEN.fore - 0.005]], () => 0.1, c(look.wristband));
      });
    }
    // ----- cabeça (rosto pintado por projeção frontal) -----
    const [FX, FY, FS = 256] = FACE[look.face];
    const uv = (p) => {
      if (p[0] < 0.03) return [(FX + 4) / AW, (FY + 4) / AH];
      const u = 0.5 - p[2] / 0.34, v = 0.5 - (p[1] - 0.21) / 0.34;
      return [(FX + Math.max(0.01, Math.min(0.99, u)) * FS) / AW, (FY + Math.max(0.01, Math.min(0.99, v)) * FS) / AH];
    };
    rigid(HD, (t) => {
      const N = 14;
      const prof = look.headProf === "mature" ? [
        [0.06, 0.03, 0.04, 0.062], [0.085, 0.072, 0.092, 0.046], [0.12, 0.115, 0.122, 0.02], [0.17, 0.132, 0.131, 0.004],
        [0.23, 0.139, 0.135, 0], [0.29, 0.139, 0.133, -0.004], [0.34, 0.124, 0.12, -0.01], [0.385, 0.085, 0.085, -0.012],
      ] : [
        [0.07, 0.035, 0.045, 0.055], [0.1, 0.085, 0.085, 0.035], [0.15, 0.125, 0.12, 0.012], [0.21, 0.142, 0.138, 0],
        [0.27, 0.146, 0.14, -0.003], [0.32, 0.136, 0.13, -0.008], [0.37, 0.104, 0.1, -0.012], [0.405, 0.05, 0.05, -0.012],
      ];
      const rings = prof.map(([y, rx, rz, cx]) => {
        const r = [];
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2;
          r.push([cx + Math.cos(a) * rx, y, Math.sin(a) * rz]);
        }
        return r;
      });
      const white = [1, 1, 1];
      for (let k = 0; k < rings.length - 1; k++)
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N, A = rings[k], B = rings[k + 1];
          t.tri(A[i], B[i], B[j], white, 4, [uv(A[i]), uv(B[i]), uv(B[j])]);
          t.tri(A[i], B[j], A[j], white, 4, [uv(A[i]), uv(B[j]), uv(A[j])]);
        }
      const topR = rings[rings.length - 1], bot = rings[0];
      const tc = [-0.012, 0.42, 0], bc = [0.055, 0.065, 0];
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        t.tri(tc, topR[i], topR[j], white, 4, [uv(tc), uv(topR[i]), uv(topR[j])]);
        t.tri(bc, bot[j], bot[i], white, 4, [uv(bc), uv(bot[j]), uv(bot[i])]);
      }
      shard(t, [0.13, 0.185, 0], [0.163, 0.152, 0], 0.016, 0.012, skin, 0); // nariz
      if (look.septum) {
        // argolinha prata pendurada embaixo da ponta do nariz
        const rp = (a) => [0.156 + Math.cos(a) * 0.011, 0.151 + Math.sin(a) * 0.011, 0];
        for (let i = 0; i < 7; i++) t.tube(rp(Math.PI * (0.05 + i * 0.13) - Math.PI), rp(Math.PI * (0.05 + (i + 1) * 0.13) - Math.PI), 0.0035, 0.0035, 4, c(0xeef1f7), 2, { cap: false });
      }
      for (const z of [-1, 1]) t.ball([-0.005, 0.2, z * 0.138], 0.032, V.mul(skin, 0.95), 0, 5, 3, { sz: 0.55 });
      hairAndGear(t, look);
    }, look.headScale || 1);
    return m;
  }
  // ---------- cabelo e acessórios (espaço local da cabeça) ----------
  // Cabelo = poucas massas grandes (volumes) + mechas/lâminas posicionadas na silhueta.
  function hairAndGear(t, L) {
    const c = (h) => hex(h);
    const hair = c(L.hair), hairD = V.mul(hair, 0.72), hairL = V.mul(hair, 1.3);
    const R = ART.rng(L.name.length * 7 + 3);
    // calota: casco que cobre o crânio com linha de cabelo (franja alta na frente, nuca atrás)
    const cap = (o) => {
      const N = 12, prof = o.prof, st = t.v.length;
      const rings = prof.map(([y, rx, rz, cx], k) => {
        const r = [];
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2, front = Math.cos(a);
          const edge = o.back + (o.bang - o.back) * Math.pow((front + 1) / 2, o.pow || 3);
          const yy = k === 0 ? edge : Math.max(y, edge + 0.03 * k);
          r.push([cx + Math.cos(a) * rx, yy, Math.sin(a) * rz]);
        }
        return r;
      });
      for (let k = 0; k < rings.length - 1; k++)
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N, A = rings[k], B = rings[k + 1];
          t.quad(A[i], A[j], B[j], B[i], o.col || hair, FLAT);
        }
      const tp = rings[rings.length - 1], tcen = [prof[prof.length - 1][3], prof[prof.length - 1][0] + 0.02, 0];
      for (let i = 0; i < N; i++) t.tri(tcen, tp[(i + 1) % N], tp[i], o.col || hair, FLAT);
      t.orient([-0.01, 0.22, 0], st);
    };
    const P = (s) => [[0, 0.155 * s, 0.15 * s, -0.01], [0.27, 0.16 * s, 0.154 * s, -0.005], [0.33, 0.15 * s, 0.144 * s, -0.01], [0.38, 0.118 * s, 0.114 * s, -0.015], [0.42, 0.06 * s, 0.06 * s, -0.015]];
    // massa irregular (bola de poucos gomos, achatada/esticada) — facetada
    const lump = (p, r, sx, sy, sz, col) => t.ball(p, r, col, FLAT, 6, 4, { sx, sy, sz });
    if (L.hairStyle === "afro") {
      cap({ prof: P(1.02), back: 0.1, bang: 0.33, pow: 3 });
      // 15 gomos grandes que se fundem num volume só (topo alto, mais largo atrás)
      const G = [
        [-0.03, 0.47, 0, 0.14], [0.06, 0.44, 0.1, 0.11], [0.06, 0.44, -0.1, 0.115], [-0.11, 0.46, 0.09, 0.125], [-0.11, 0.46, -0.1, 0.12],
        [0.02, 0.36, 0.17, 0.105], [0.02, 0.36, -0.17, 0.105], [-0.12, 0.35, 0.16, 0.12], [-0.12, 0.35, -0.16, 0.12],
        [-0.19, 0.33, 0.02, 0.125], [-0.17, 0.22, 0.09, 0.1], [-0.17, 0.22, -0.09, 0.1], [-0.12, 0.13, 0.0, 0.085],
        [0.11, 0.38, 0.04, 0.085], [0.11, 0.38, -0.07, 0.08],
      ];
      G.forEach(([x, y, z, r], i) => lump([x, y, z], r, 0.9 + R() * 0.25, 0.85 + R() * 0.25, 0.9 + R() * 0.25, i % 4 === 1 ? hairL : hair));
      // cachos de borda: ganchos curtos que quebram a silhueta (frente, lados e nuca)
      const hooks = [[0.13, 0.36, 0.13, 1], [0.13, 0.36, -0.14, -1], [-0.02, 0.55, 0.08, 1], [-0.16, 0.53, -0.06, -1], [-0.26, 0.38, 0.06, 1], [-0.24, 0.26, -0.12, -1], [-0.06, 0.29, 0.24, 1], [-0.06, 0.29, -0.24, -1], [-0.2, 0.12, 0.08, 1]];
      for (const [x, y, z, sgn] of hooks) {
        const o = [x, y, z], out = V.norm([x + 0.03, y - 0.3, z]);
        const mid = V.add(o, V.add(V.mul(out, 0.055), [0, 0, sgn * 0.02]));
        shard(t, V.sub(o, V.mul(out, 0.02)), mid, 0.034, 0.026, hairL);
        shard(t, mid, V.add(mid, V.add(V.mul(out, 0.03), [0, -0.03, -sgn * 0.03])), 0.026, 0.02, hair);
      }
    } else if (L.hairStyle === "taper") {
      // cacheado com taper: laterais e nuca baixinhas (degradê pra pele), volume de cachos em cima
      // e uma franja de cachos caindo na testa
      const skin = c(L.skin), fade = V.add(V.mul(hair, 0.5), V.mul(skin, 0.5));
      cap({ prof: P(1.0), back: 0.1, bang: 0.33, pow: 3, col: fade });
      cap({ prof: P(1.018), back: 0.25, bang: 0.335, pow: 2 });
      const TC = [
        // miolo (topo)
        [0.02, 0.47, 0, 0.085], [-0.08, 0.47, 0.065, 0.08], [-0.08, 0.47, -0.065, 0.08], [0.08, 0.445, 0.07, 0.07], [0.08, 0.445, -0.07, 0.07],
        [-0.16, 0.42, 0, 0.07], [-0.15, 0.405, 0.085, 0.06], [-0.15, 0.405, -0.085, 0.06],
        // laterais de cima (o volume para antes do degradê)
        [0.0, 0.4, 0.115, 0.064], [0.0, 0.4, -0.115, 0.064], [-0.09, 0.4, 0.115, 0.06], [-0.09, 0.4, -0.115, 0.06],
        // franja
        [0.12, 0.405, 0.0, 0.066], [0.13, 0.385, 0.075, 0.055], [0.13, 0.385, -0.075, 0.055], [0.155, 0.35, 0.03, 0.042], [0.155, 0.355, -0.045, 0.04],
      ];
      TC.forEach(([x, y, z, r], i) => lump([x, y, z], r, 0.95 + R() * 0.2, 0.82 + R() * 0.18, 0.95 + R() * 0.2, i % 3 === 1 ? hairL : i % 3 === 2 ? hairD : hair));
      // cachos: bolinhas (molinhas) espalhadas por cima do volume + poucos ganchinhos curtos na borda
      const cen = [-0.02, 0.385, 0];
      for (let k = 0; k < 34; k++) {
        const a = R() * Math.PI * 2, el = 0.12 + R() * 1.25, rr = 0.155 + R() * 0.02;
        const d = [Math.cos(a) * Math.cos(el) * 1.08, Math.sin(el) * 0.92, Math.sin(a) * Math.cos(el)];
        const q = V.add(cen, V.mul(d, rr));
        if (q[1] < 0.35 && q[0] < 0.08) continue; // não desce no degradê (só na franja)
        lump(q, 0.026 + R() * 0.008, 1, 0.85, 1, k % 3 ? hair : hairL);
      }
      // franja: molinhas caindo na testa
      for (const [z, y] of [[-0.085, 0.33], [-0.04, 0.315], [0.0, 0.322], [0.045, 0.312], [0.088, 0.33]]) lump([0.162 - Math.abs(z) * 0.25, y, z], 0.03, 1, 1.1, 1, z > 0 ? hairL : hair);
      const CU = [[0.06, 0.53, 0.04, 1], [-0.05, 0.545, -0.03, -1], [-0.14, 0.5, 0.05, 1], [0.03, 0.44, 0.165, 1], [0.03, 0.44, -0.165, -1], [-0.2, 0.45, -0.07, -1]];
      for (const [x, y, z, sgn] of CU) {
        const o = [x, y, z], out = V.norm(V.sub(o, cen));
        const mid = V.add(o, V.add(V.mul(out, 0.026), [0, 0, sgn * 0.012]));
        shard(t, V.sub(o, V.mul(out, 0.012)), mid, 0.026, 0.02, hairL);
        shard(t, mid, V.add(mid, V.add(V.mul(out, 0.01), [0, -0.02, -sgn * 0.018])), 0.02, 0.014, hair);
      }
      // costeleta curtinha
      for (const sd of [-1, 1]) t.box(0.035, 0.2, sd * 0.148 - 0.008, 0.075, 0.3, sd * 0.148 + 0.008, fade, { m: FLAT });
    } else if (L.hairStyle === "spiky") {
      cap({ prof: P(1.05), back: 0.13, bang: 0.28, pow: 3 });
      // espetos de tamanhos e direções variados, mais longos atrás e no topo
      const SP = [
        [0.0, 0.42, 0.0, 0.0, 1.0, 0.1, 0.17], [-0.08, 0.41, 0.08, -0.4, 0.9, 0.5, 0.2], [-0.08, 0.41, -0.08, -0.4, 0.9, -0.5, 0.2],
        [0.06, 0.4, 0.09, 0.3, 0.9, 0.6, 0.15], [0.06, 0.4, -0.09, 0.3, 0.9, -0.6, 0.15], [-0.16, 0.35, 0.0, -1, 0.5, 0.0, 0.22],
        [-0.15, 0.33, 0.1, -0.8, 0.3, 0.7, 0.2], [-0.15, 0.33, -0.1, -0.8, 0.3, -0.7, 0.2], [-0.15, 0.22, 0.06, -1, -0.3, 0.4, 0.17],
        [-0.15, 0.22, -0.06, -1, -0.3, -0.4, 0.17], [0.0, 0.34, 0.15, 0.1, 0.4, 1, 0.16], [0.0, 0.34, -0.15, 0.1, 0.4, -1, 0.16],
        [-0.07, 0.26, 0.15, -0.4, -0.2, 1, 0.14], [-0.07, 0.26, -0.15, -0.4, -0.2, -1, 0.14], [-0.04, 0.47, -0.04, -0.3, 1, -0.1, 0.13],
        [-0.12, 0.45, 0.02, -0.7, 0.8, 0.1, 0.15],
      ];
      SP.forEach(([x, y, z, dx, dy, dz, len], i) => {
        const b = [x, y, z], d = V.norm([dx, dy, dz]);
        shard(t, b, V.add(b, V.mul(d, len)), 0.055 + (i % 3) * 0.008, 0.03, i % 5 === 0 ? hairL : hair);
      });
      // franja em lâminas caindo sobre a testa (tímido)
      for (let i = 0; i < 5; i++) shard(t, [0.11, 0.35, -0.1 + i * 0.05], [0.18, 0.25 - (i % 2) * 0.03, -0.11 + i * 0.055], 0.04, 0.015, i % 2 ? hairL : hair);
    } else if (L.hairStyle === "long") {
      cap({ prof: P(1.05), back: 0.05, bang: 0.28, pow: 2.2 });
      // cortina de trás: painel curvo descendo até o meio das costas, ponta em zigue-zague
      const st = t.v.length, N = 9, rows = [];
      for (let k = 0; k < 5; k++) {
        const y = 0.3 - k * 0.17, w = 0.17 + k * 0.012, dep = 0.06 + k * 0.01;
        const r = [];
        for (let i = 0; i < N; i++) {
          const a = -Math.PI * 0.42 + (i / (N - 1)) * Math.PI * 0.84;
          const zig = k === 4 ? (i % 2 ? 0.07 : 0) : 0;
          r.push([-0.1 - Math.cos(a) * dep - k * 0.012, y + zig, Math.sin(a) * w]);
        }
        rows.push(r);
      }
      for (let k = 0; k < rows.length - 1; k++)
        for (let i = 0; i < N - 1; i++) t.quad(rows[k][i], rows[k][i + 1], rows[k + 1][i + 1], rows[k + 1][i], k % 2 ? hair : hairL, FLAT);
      t.orient([0.1, 0.0, 0], st);
      // mechas da frente sobre os ombros
      for (const z of [-1, 1]) {
        shard(t, [0.0, 0.24, z * 0.15], [0.03, -0.2, z * 0.18], 0.045, 0.02, hair);
        shard(t, [-0.04, 0.22, z * 0.16], [-0.03, -0.28, z * 0.2], 0.04, 0.02, L.streak && z > 0 ? c(L.streak) : hairL);
      }
      if (L.part) {
        // risca (no meio ou de lado): cortinas que se abrem a partir dela emoldurando o rosto
        const pz = L.part === "side" ? 0.05 : 0;
        for (const z of [-1, 1]) {
          const big = L.part === "side" && z < 0;
          shard(t, [0.1, 0.375, pz + z * 0.03], [0.1, 0.12, z * 0.18], big ? 0.055 : 0.04, 0.016, hair);
          shard(t, [0.05, 0.405, pz + z * 0.06], [0.04, 0.06, z * 0.2], 0.045, 0.018, hairL);
        }
        // risca de lado: mecha grande varrida por cima da testa
        if (L.part === "side") shard(t, [0.05, 0.415, pz + 0.01], [0.16, 0.275, -0.13], 0.05, 0.018, hair);
      } else {
        // franja em zigue-zague
        for (let i = 0; i < 6; i++) shard(t, [0.12, 0.34, -0.12 + i * 0.048], [0.165, 0.25 + (i % 2) * 0.02, -0.12 + i * 0.048], 0.03, 0.012, i % 2 ? hairL : hair);
      }
      if (L.beanie) {
        const b = c(L.beanie);
        t.ball([-0.01, 0.31, 0], 0.176, b, FLAT, 10, 4, { sy: 0.88, cut: 0.48 });
        t.tube([-0.01, 0.29, 0], [-0.01, 0.345, 0], 0.184, 0.18, 12, V.mul(b, 0.85), FLAT, { cap: false });
        lump([-0.04, 0.48, 0], 0.05, 1, 1, 1, c(0xffffff));
      }
    } else if (L.hairStyle === "bob") {
      cap({ prof: P(1.06), back: 0.06, bang: 0.28, pow: 5 });
      lump([-0.06, 0.24, 0], 0.17, 0.85, 0.95, 1.05, hair);
      shard(t, [-0.06, 0.37, 0.0], [-0.27, 0.47, 0.0], 0.06, 0.05, hair);
    } else if (L.hairStyle === "chanel") {
      cap({ prof: P(1.07), back: 0.08, bang: 0.3, pow: 4 });
      // volume dos lados até a linha do queixo e atrás
      for (const z of [-1, 1]) { lump([-0.02, 0.2, z * 0.135], 0.12, 0.95, 1.25, 0.55, hair); lump([0.04, 0.15, z * 0.14], 0.07, 0.8, 1.1, 0.6, hairL); }
      lump([-0.1, 0.22, 0], 0.17, 0.8, 1.05, 1.08, hair);
      // pontas bagunçadas viradas pra fora
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI * 0.9 + (i / 8) * Math.PI * 1.8, z = Math.sin(a) * 0.16, x = Math.cos(a) * 0.1 - 0.06;
        if (x > 0.06) continue;
        shard(t, [x, 0.16, z], [x - 0.02, 0.06 - (i % 2) * 0.03, z * 1.25], 0.035, 0.014, i % 3 ? hair : hairL);
      }
      // franjinha reta e meio desfiada
      for (let i = 0; i < 7; i++) shard(t, [0.115, 0.37, -0.12 + i * 0.04], [0.17, 0.28 - (i % 2) * 0.025, -0.125 + i * 0.042], 0.028, 0.012, i % 2 ? hairL : hair);
    } else if (L.hairStyle === "short") {
      cap({ prof: P(1.03), back: 0.12, bang: 0.32, pow: 3 });
    } else if (L.hairStyle === "bald") {
      // careca com cabelinho dos lados
      for (const z of [-1, 1]) lump([-0.04, 0.24, z * 0.13], 0.07, 1.3, 0.8, 0.5, hair);
      lump([-0.12, 0.22, 0], 0.08, 0.6, 0.8, 1.6, hair);
    } else if (L.hairStyle === "bun") {
      cap({ prof: P(1.04), back: 0.1, bang: 0.32, pow: 4 });
      lump([-0.14, 0.38, 0], 0.085, 1, 1, 1, hairL);
    } else if (L.hairStyle === "hat") {
      // chapéu de palha (aba larga) sobre cabelo curto
      cap({ prof: P(1.02), back: 0.12, bang: 0.3, pow: 3 });
      const straw = c(L.hatCol || 0xe8c878);
      t.tube([-0.01, 0.33, 0], [-0.01, 0.35, 0], 0.3, 0.3, 14, straw, FLAT);
      t.tube([-0.01, 0.35, 0], [-0.01, 0.48, 0], 0.17, 0.15, 12, straw, FLAT, { capCol: V.mul(straw, 0.9) });
      t.tube([-0.01, 0.36, 0], [-0.01, 0.4, 0], 0.175, 0.175, 12, c(L.hatBand || 0x7a3a1a), FLAT, { cap: false });
    } else if (L.hairStyle === "guard") {
      cap({ prof: P(1.03), back: 0.12, bang: 0.32, pow: 3 });
      const b = c(L.capCol || 0x1d3f8a);
      t.ball([0, 0.3, 0], 0.168, b, FLAT, 10, 4, { sy: 0.7, cut: 0.45 });
      t.box(0.06, 0.29, -0.11, 0.27, 0.31, 0.11, c(0x1b1530), { m: FLAT });
      t.box(0.14, 0.33, -0.03, 0.17, 0.37, 0.03, c(0xffd23f), { m: 1 });
    } else if (L.hairStyle === "cap") {
      cap({ prof: P(1.03), back: 0.14, bang: 0.24, pow: 2 });
      t.ball([0, 0.29, 0], 0.168, c(L.capC || 0xff4fa3), FLAT, 10, 4, { sy: 0.85, cut: 0.45 });
      t.box(-0.34, 0.305, -0.09, -0.08, 0.33, 0.09, c(L.capC || 0xff4fa3), { m: FLAT });
    }
    // fones
    if (L.earbud) {
      // fone de botão (intra-auricular) com o fio descendo pro discman; "both" = nas duas orelhas,
      // senão só num lado (o outro tá com a Julie)
      const sides = L.earbud === "both" ? [-1, 1] : [L.earSide || 1];
      for (const sd of sides) {
        const z = sd * (L.hairStyle === "afro" ? 0.255 : L.hairStyle === "taper" ? 0.152 : 0.14);
        t.ball([0.03, 0.19, z], 0.028, c(0xf4f4f4), FLAT, 6, 4);
      }
    } else if (L.walkman) {
      const big = L.hairStyle === "afro";
      const PZ = big ? 0.27 : 0.158, AY = big ? 0.3 : 0.27, AR = big ? 0.33 : 0.17, AZ = big ? 0.275 : 0.155;
      for (const s of [-1, 1]) {
        t.ball([0.01, 0.2, s * PZ], big ? 0.058 : 0.042, c(L.phones), FLAT, 8, 4, { sz: 0.5 });
        t.tube([0.01, 0.2, s * (PZ - 0.02)], [0.01, 0.2, s * (PZ - 0.05)], 0.026, 0.026, 6, c(0xd5dbe8), 1);
        t.box(-0.006, 0.2, s * (PZ - 0.004) - 0.005, 0.006, AY + 0.01, s * (PZ - 0.004) + 0.005, c(0xd5dbe8), { m: 1 });
      }
      for (let i = 0; i < 8; i++) {
        const a0 = (i / 8) * Math.PI, a1 = ((i + 1) / 8) * Math.PI;
        t.tube([0, AY + Math.sin(a0) * AR, Math.cos(a0) * AZ], [0, AY + Math.sin(a1) * AR, Math.cos(a1) * AZ], 0.011, 0.011, 4, c(0xd5dbe8), 1, { cap: false });
      }
    } else if (L.phones) {
      for (const s of [-1, 1]) t.tube([0, 0.2, s * 0.15], [0, 0.2, s * 0.21], 0.075, 0.075, 8, c(L.phones), FLAT);
      for (let i = 0; i < 6; i++) {
        const a0 = (i / 6) * Math.PI, a1 = ((i + 1) / 6) * Math.PI;
        t.tube([0, 0.2 + Math.sin(a0) * 0.22, Math.cos(a0) * 0.18], [0, 0.2 + Math.sin(a1) * 0.22, Math.cos(a1) * 0.18], 0.022, 0.022, 4, c(L.phones), 0, { cap: false });
      }
    }
    if (L.shades) {
      // óculos esportivos pretos anos 2000: duas lentes ovais envolventes, aro fino em cima, haste reta
      const frame = c(0x0e0d12), lens = c(0x17151f);
      const at = (a, y, r) => [Math.cos(a) * r - 0.004, y, Math.sin(a) * r];
      for (const sd of [-1, 1]) {
        const a0 = sd * 0.42, N = 10, pts = [];
        for (let i = 0; i < N; i++) {
          const u = (i / N) * Math.PI * 2;
          const top = Math.sin(u) > 0;
          const da = Math.cos(u) * 0.36, dy = Math.sin(u) * (top ? 0.026 : 0.03) - (top ? 0 : Math.abs(Math.cos(u)) * 0.006 * -sd * Math.sign(Math.cos(u)));
          pts.push(at(a0 + da, 0.228 + dy + Math.cos(u) * sd * 0.006, 0.158 - Math.abs(da + a0) * 0.012));
        }
        const ctr = at(a0, 0.228, 0.161);
        for (let i = 0; i < N; i++) t.tri(ctr, pts[i], pts[(i + 1) % N], lens, 0);
        // aro em volta (mais grosso em cima)
        for (let i = 0; i < N; i++) {
          const up = pts[i][1] > 0.228 && pts[(i + 1) % N][1] > 0.228;
          t.tube(pts[i], pts[(i + 1) % N], up ? 0.011 : 0.006, up ? 0.011 : 0.006, 4, frame, 0, { cap: false });
        }
        // reflexo discreto (faixa cinza-azulada)
        t.quad(at(a0 + 0.2, 0.248, 0.163), at(a0 + 0.08, 0.25, 0.164), at(a0 - 0.12, 0.214, 0.164), at(a0, 0.212, 0.163), c(0x5a6a8a), 2);
        // haste até a orelha
        const end = at(a0 + sd * 0.38, 0.235, 0.152);
        t.tube(end, [-0.06, 0.232, sd * 0.152], 0.009, 0.008, 4, frame, 0, { cap: false });
      }
      // ponte sobre o nariz
      t.tube(at(-0.08, 0.238, 0.162), at(0.08, 0.238, 0.162), 0.009, 0.009, 4, frame, 0, { cap: false });
    }
    if (L.glasses) {
      const fr = c(0x1b1530);
      for (const s of [-1, 1]) {
        const cz = s * 0.056, cx = 0.152 - Math.abs(cz) * 0.25, cy = 0.218;
        const pts = [];
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          pts.push([cx, cy + Math.sin(a) * 0.036, cz + Math.cos(a) * 0.046]);
        }
        for (let i = 0; i < 8; i++) t.tube(pts[i], pts[(i + 1) % 8], 0.009, 0.009, 4, fr, 0, { cap: false });
        t.tube([cx - 0.01, cy + 0.01, s * 0.1], [-0.02, 0.21, s * 0.142], 0.007, 0.007, 3, fr, 0, { cap: false });
      }
      t.tube([0.152, 0.225, -0.012], [0.152, 0.225, 0.012], 0.007, 0.007, 3, fr, 0, { cap: false });
    }
  }

  // shape old school anos 80 ("tubarão"): largo, bico pontudo, rabo de peixe, rails na sola, rodas grandes
  function sharkBoard(look) {
    const m = new Mesh();
    const grip = hex(0x2a2638), side = hex(look.deck || 0x3fd0ff), T = 0.024;
    const st = [[-0.375, 0.118], [-0.3, 0.124], [-0.18, 0.13], [0.0, 0.136], [0.15, 0.14], [0.26, 0.128], [0.34, 0.1], [0.4, 0.06], [0.44, 0.022]];
    const yAt = (z) => 0.125 + (z < -0.27 ? (-0.27 - z) * 0.55 : 0) + (z > 0.3 ? (z - 0.3) * 0.35 : 0);
    const P = (x, z, top) => [x, yAt(z) - (top ? 0 : T), z];
    const strip = (a, b) => {
      const [za, wa] = a, [zb, wb] = b;
      m.quad(P(-wa, za, 1), P(wa, za, 1), P(wb, zb, 1), P(-wb, zb, 1), grip);
      m.quad(P(-wa, za, 0), P(-wb, zb, 0), P(wb, zb, 0), P(wa, za, 0), side);
      m.quad(P(wa, za, 1), P(wa, za, 0), P(wb, zb, 0), P(wb, zb, 1), V.mul(side, 0.8));
      m.quad(P(-wa, za, 0), P(-wa, za, 1), P(-wb, zb, 1), P(-wb, zb, 0), V.mul(side, 0.8));
    };
    for (let i = 0; i < st.length - 1; i++) strip(st[i], st[i + 1]);
    // ponta do bico
    const [zn, wn] = st[st.length - 1];
    m.tri(P(-wn, zn, 1), P(wn, zn, 1), P(0, 0.455, 1), grip);
    m.tri(P(-wn, zn, 0), P(0, 0.455, 0), P(wn, zn, 0), side);
    // rabo de peixe (nadadeira do tubarão) com recorte no meio
    const tail = [[-0.118, -0.375], [-0.13, -0.455], [-0.02, -0.405], [0, -0.395], [0.02, -0.405], [0.13, -0.455], [0.118, -0.375]];
    for (let i = 1; i < tail.length - 1; i++) {
      m.tri(P(tail[0][0], tail[0][1], 1), P(tail[i][0], tail[i][1], 1), P(tail[i + 1][0], tail[i + 1][1], 1), grip);
      m.tri(P(tail[0][0], tail[0][1], 0), P(tail[i + 1][0], tail[i + 1][1], 0), P(tail[i][0], tail[i][1], 0), side);
    }
    for (let i = 0; i < tail.length - 1; i++) {
      const [xa, za] = tail[i], [xb, zb] = tail[i + 1];
      m.quad(P(xa, za, 1), P(xa, za, 0), P(xb, zb, 0), P(xb, zb, 1), V.mul(side, 0.8));
    }
    m.orient([0, 0.115, 0]);
    // arte embaixo e rails (frisos de plástico típicos da época)
    m.decal([0, 0.098, 0.03], [-1, 0, 0], [0, 0, 1], 0.22, 0.66, SPR.shark);
    for (const x of [-0.06, 0.06]) m.box(x - 0.008, 0.088, -0.24, x + 0.008, 0.1, 0.2, hex(0xffd23f));
    m.box(-0.04, 0.084, -0.37, 0.04, 0.1, -0.33, hex(0x1b1530)); // tail guard
    // trucks largos e rodas grandes macias
    for (const z of [-0.24, 0.24]) {
      m.box(-0.09, 0.07, z - 0.03, 0.09, 0.1, z + 0.03, hex(0xd8dce8), { m: 1 });
      m.tube([-0.13, 0.04, z], [0.13, 0.04, z], 0.012, 0.012, 6, hex(0xd8dce8), 1);
      for (const x of [-0.115, 0.115]) m.tube([x - 0.03, 0.04, z], [x + 0.03, 0.04, z], 0.04, 0.04, 9, hex(0xff4fa3), 0, { capCol: hex(0xffd23f) });
    }
    return m;
  }
  function boardMesh(look) {
    if (look.deckShape === "shark") return sharkBoard(look);
    const b = ART.boardMesh(look.deck || 0xff4fa3);
    if (look.deckArtLong) b.decal([0, 0.104, 0], [-1, 0, 0], [0, 0, 1], 0.2, 0.6, SPR[look.deckArtLong]);
    if (look.deckArt) b.decal([0, 0.104, 0], [-1, 0, 0], [0, 0, 1], 0.19, 0.19, SPR[look.deckArt]);
    return b;
  }

  // câmera digital compacta (lente aponta pra +z, tela atrás em -z), no tamanho "de brinquedo" do jogo
  function camMesh(look) {
    const m = new Mesh(), C = look.cam || { body: 0xc9ced8, trim: 0xe8242c, lens: 0x2a2d38 };
    const body = hex(C.body), trim = hex(C.trim), W = 0.075, Hh = 0.045, D = 0.02;
    m.box(-W, -Hh, -D, W, Hh, D, body, { m: FLAT });
    m.box(-W - 0.002, -Hh - 0.002, -D * 0.4, W + 0.002, -Hh + 0.012, D * 0.4, trim, { m: FLAT }); // faixa de baixo
    m.tube([0.018, -0.004, D], [0.018, -0.004, D + 0.024], 0.032, 0.03, 12, hex(0xd5dbe8), 1, { capCol: hex(C.lens) });
    m.tube([0.018, -0.004, D + 0.024], [0.018, -0.004, D + 0.03], 0.024, 0.024, 12, hex(C.lens), 3);
    m.box(-0.06, 0.016, D, -0.03, 0.034, D + 0.004, hex(0xfff6d8), { m: 2 }); // flash
    m.box(0.035, Hh, -0.008, 0.06, Hh + 0.008, 0.008, trim, { m: 1 }); // botão
    m.box(-0.058, -0.03, -D - 0.003, 0.03, 0.032, -D, hex(0x2c3e66), { m: 2 }); // tela
    if (C.sticker) m.decal([-0.048, -0.018, D + 0.002], [-1, 0, 0], [0, 1, 0], 0.03, 0.03, SPR[C.sticker]);
    // cordinha de pulso (com pingente ou nas cores rasta)
    const sc = C.rasta ? [0xd62828, 0xf7c531, 0x1f9a4a] : [C.trim];
    for (let i = 0; i < 6; i++) {
      const a0 = (i / 6) * Math.PI * 1.6 + 0.6, a1 = ((i + 1) / 6) * Math.PI * 1.6 + 0.6;
      m.tube([W + 0.01 + Math.sin(a0) * 0.035, -0.01 - (1 - Math.cos(a0)) * 0.05, 0], [W + 0.01 + Math.sin(a1) * 0.035, -0.01 - (1 - Math.cos(a1)) * 0.05, 0], 0.004, 0.004, 4, hex(sc[i % sc.length]), 0, { cap: false });
    }
    if (C.charm) m.ball([W + 0.012, -0.11, 0], 0.012, hex(C.charm), FLAT, 6, 3);
    return m;
  }

  function makeRig(Rn, look) {
    const g = Rn.upload(build(look), { smooth: true, skin: true });
    const body = { g, mo: null, bones: new Float32Array(16 * 12), inkw: 1.3 };
    const bindInv = frames(M.I(), bindOf(look), null, look).map((f) => M.inv(f));
    const board = { g: Rn.upload(boardMesh(look)), mo: M.I(), hidden: !!look.skates };
    const camera = { g: Rn.upload(camMesh(look)), mo: M.I(), hidden: true, inkw: 0.7 };
    const out = { objs: [body], board, camera, pose, look, F: null };
    const s = look.scale || 1;
    function pose(base, p, feetBase) {
      const rot = look.skates ? M.RY(-Math.PI / 2) : M.I();
      // no skate, encolher o corpo puxaria o pé pra dentro do shape: sobe a base pra sola continuar na lixa
      const lift = look.skates ? M.I() : M.T(0, 0.21 * (1 - s), 0);
      const b = M.mul(base, M.mul(lift, M.mul(M.S(s, s, s), rot)));
      const fb = feetBase ? M.mul(feetBase, M.mul(lift, M.mul(M.S(s, s, s), rot))) : b;
      const L = lenOf(look);
      const pp = p.stand ? Object.assign({}, p, { py: L.thigh + L.shin + 0.235 }) : look.pyAdd ? Object.assign({}, p, { py: p.py + look.pyAdd }) : p;
      const F = frames(b, pp, fb, look);
      for (let i = 0; i < 12; i++) body.bones.set(M.mul(F[i], bindInv[i]), i * 16);
      out.F = F;
    }
    return out;
  }

  // poses de parado (trejeitos)
  // selfie (x = pra onde o peito aponta, z = lado do braço da frente): braço esticado pra frente e pra cima
  const SELFIE = (k = 0) => ({ stand: 1, px: 0, py: 0.94, pz: 0, lean: -0.04, twist: 0.05, hy: 0, hp: -0.1, hF: [0.46, 1.66 + k * 0.25, 0.3], hB: [-0.02, 0.98, -0.29], lf: 0, lb: 0 });
  const IDLE = {
    peace: (t) => ({ stand: 1, px: 0, py: 0.94, pz: 0, lean: 0.05, twist: 0.15, hy: -0.35, hp: 0.05 + Math.sin(t * 2) * 0.03, hF: [0.22, 1.66, 0.28], hB: [-0.12, 0.98, -0.24], lf: 0, lb: 0 }),
    shy: (t) => ({ stand: 1, px: 0, py: 0.92, pz: 0, lean: 0.22, twist: 0.35, hy: -0.6, hp: 0.32, hF: [0.22, 1.38, 0.08], hB: [0.1, 0.82, -0.2], lf: 0, lb: 0 }),
    bounce: (t) => ({ stand: 1, px: 0, py: 0.94 + Math.abs(Math.sin(t * 4)) * 0.04, pz: 0, lean: 0.0, twist: 0.0, hy: Math.sin(t * 1.3) * 0.4, hp: -0.1, hF: [-0.16, 0.92, 0.15], hB: [-0.16, 0.92, -0.15], lf: 0, lb: 0 }),
    kick: (t) => ({ stand: 1, px: 0, py: 0.94, pz: 0, lean: 0.06, twist: 0.18 + Math.sin(t * 3) * 0.05, hy: -0.4 + Math.sin(t * 1.1) * 0.2, hp: 0.08, hF: [0.06, 0.96, 0.28], hB: [-0.04, 0.95, -0.27], fxF: Math.cos(t * 4) * 0.12, lf: 0.06 + Math.max(0, Math.sin(t * 4)) * 0.09, lb: 0 }),
    calm: (t) => ({ stand: 1, px: 0, py: 0.94, pz: 0, lean: 0.04 + Math.sin(t * 1.1) * 0.02, twist: 0.12, hy: -0.35 + Math.sin(t * 0.6) * 0.18, hp: 0.14, hF: [0.06, 1.58, 0.17], hB: [0.02, 0.92, -0.25], lf: 0, lb: 0 }),
    boss: (t) => ({ stand: 1, px: 0, py: 0.93, pz: 0, lean: -0.05, twist: 0.28, hy: -0.55 + Math.sin(t * 0.9) * 0.08, hp: -0.12, hF: [-0.03, 0.98, 0.29], hB: [-0.03, 0.98, -0.29], lf: Math.max(0, Math.sin(t * 9)) * 0.05, lb: 0 }),
    // sentado na cadeira de fio na calçada, olhando o movimento
    sit: (t) => ({ stand: 0, px: -0.06, py: 0.6, pz: 0, lean: -0.1 + Math.sin(t * 0.7) * 0.015, twist: 0, hy: Math.sin(t * 0.37) * 0.45, hp: 0.04, hF: [0.3, 0.66, 0.2], hB: [0.3, 0.66, -0.2], lf: 0, lb: 0, fxF: 0.36, fxB: 0.36 }),
    // conversando: mexe as mãos e a cabeça
    chat: (t) => ({ stand: 1, px: 0, py: 0.94, pz: 0, lean: 0.04, twist: 0.1 + Math.sin(t * 1.3) * 0.06, hy: Math.sin(t * 0.9) * 0.2, hp: 0.06 + Math.sin(t * 2.6) * 0.04, hF: [0.26 + Math.sin(t * 3.1) * 0.06, 1.18 + Math.sin(t * 2.3) * 0.08, 0.26], hB: [0.02, 0.97, -0.3], lf: 0, lb: 0 }),
    hips: (t) => ({ stand: 1, px: 0, py: 0.93, pz: 0, lean: 0.05, twist: 0.2, hy: -0.7, hp: 0, hF: [0.0, 0.98, 0.32], hB: [0.0, 0.98, -0.32], lf: 0, lb: 0 }),
  };

  return { LOOKS, TOWN, makeRig, paint, IDLE, SELFIE, BONE, frames, BIND, lenOf };
})();
ART.makeRig = CHARS.makeRig;
ART.LOOKS = CHARS.LOOKS;
