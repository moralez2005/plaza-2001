// Jogabilidade: física arcade de skate (ollie carregado, vert com 180 automático, flips e
// grabs por direção, grinds com equilíbrio, manual, revert, especial, gaps e combos com
// multiplicador) + coleta de latas e grafite nos pontos marcados.
"use strict";
const STREET = (() => {
  const { V, M, hex, Mesh } = E;
  const G = 16;
  const FLIPS = {
    none: { name: "Kickflip", pts: 100, r: (f) => M.RZ(f * Math.PI * 2) },
    right: { name: "Heelflip", pts: 100, r: (f) => M.RZ(-f * Math.PI * 2) },
    down: { name: "Pop Shove-it", pts: 125, r: (f) => M.RY(f * Math.PI) },
    up: { name: "Hardflip", pts: 150, r: (f) => M.mul(M.RX(f * Math.PI * 2), M.RY(f * Math.PI)) },
    left: { name: "Varial Kickflip", pts: 175, r: (f) => M.mul(M.RY(f * Math.PI), M.RZ(f * Math.PI * 2)) },
  };
  const GRABN = { none: "Indy", left: "Melon", right: "Stalefish", up: "Nosegrab", down: "Tailgrab" };
  const GRINDN = { none: "50-50", up: "Nosegrind", down: "5-0", left: "Boardslide", right: "Lipslide" };
  const SK_FLIP = { none: "Mortal", back: "Mortal de Costas", right: "Parafuso", down: "Mortal de Costas", up: "Estrela", left: "Pirueta Dupla" };
  // patins: o corpo inteiro gira (mortal pra frente no plano, mortal de costas na rampa)
  const SK_ROT = {
    none: (f) => M.RX(f * Math.PI * 2),
    back: (f) => M.RX(-f * Math.PI * 2),
    right: (f) => M.mul(M.RY(f * Math.PI * 2), M.RX(f * Math.PI * 2)),
    up: (f) => M.RZ(f * Math.PI * 2),
    left: (f) => M.RY(f * Math.PI * 4),
  };
  const SK_PTS = { none: 250, back: 450, right: 350, up: 350, left: 400 };
  const GRAB_POSE = { none: "Indy", left: "Melon", right: "Stalefish", up: "Nosegrab", down: "Tailgrab" };
  const SK_GRAB = { none: "Pegada no Patins", left: "Pernas Abertas", right: "Patins na Mão", up: "Joelho no Peito", down: "Pegada de Trás" };
  const SK_GRIND = { none: "Soul", up: "Royale", down: "Unity", left: "Makio", right: "Frontside" };
  const GOALS = [
    { id: "score", t: "Fazer 30.000 pontos numa sessão de 3 min" },
    { id: "combo5", t: "Fechar um combo de 5.000" },
    { id: "plaza", t: "Pegar as letras P · L · A · Z · A" },
    { id: "tags", t: "Grafitar os 6 pontos marcados (gasta lata)" },
    { id: "gaps", t: "Achar 4 gaps diferentes" },
    { id: "fio", t: "Grind no fio lá no alto do half norte" },
    { id: "combo15", t: "Combo insano de 15.000" },
  ];

  function Game(canvas, ui, opt = {}) {
    const Rn = E.Renderer(canvas, { lowH: opt.lowH || 400, keep: opt.keep });
    Rn.setAtlas(ART.makeAtlas());
    const L = LEVEL.build(ART.RECT);
    const H = L.heightAt;
    const objs = [];
    const add = (g, mo, extra) => { const o = Object.assign({ g, mo: mo || null }, extra || {}); objs.push(o); return o; };
    add(Rn.upload(L.flat, { outline: false }));
    add(Rn.upload(L.solid));
    add(Rn.upload(L.deco, { outline: false }));
    add(Rn.upload(L.far, { outline: false }));
    add(Rn.upload(L.clouds), null, { tint: [1.05, 1.05, 1.05] });
    for (const t of L.tags) {
      t.go = add(Rn.upload(t.ghost, { outline: false }));
      t.ao = add(Rn.upload(t.art, { outline: false }), null, { hidden: true });
    }
    // lata de spray
    const canM = new Mesh();
    canM.tube([0, -0.17, 0], [0, 0.13, 0], 0.11, 0.11, 8, hex(0xffffff));
    canM.tube([0, -0.05, 0], [0, 0.07, 0], 0.113, 0.113, 8, hex(0xff4fa3), 0, { cap: false });
    canM.ball([0, 0.13, 0], 0.11, hex(0xd5dbe8), 1, 8, 3, { sy: 0.6, cut: 0.5 });
    canM.tube([0, 0.18, 0], [0, 0.24, 0], 0.035, 0.035, 6, hex(0x1b1530));
    const canG = Rn.upload(canM, { smooth: true });
    const cans = L.cans.map((p) => ({ p, o: add(canG, M.I()), got: false }));
    const letterG = {};
    for (const ch of "PLAZ") letterG[ch] = Rn.upload(new Mesh().decal([0, 0, 0], [1, 0, 0], [0, 1, 0], 1.1, 1.1, ART.RECT.letter[ch], [1, 1, 1], 4), { outline: false });
    const letters = L.letters.map((l, i) => ({ ...l, i, o: add(letterG[l.ch], M.I()), got: false }));
    // sombra, faíscas, spray
    const shadow = add(Rn.upload(new Mesh().decal([0, 0, 0], [1, 0, 0], [0, 0, -1], 1.3, 1.3, ART.RECT.shadow, [1, 1, 1], 5), { outline: false }), M.I());
    const sparkG = Rn.upload(new Mesh().box(-0.03, -0.03, -0.03, 0.03, 0.03, 0.03, hex(0xffe14d), { m: 2 }), { outline: false });
    const sparks = Array.from({ length: 10 }, () => add(sparkG, M.I(), { hidden: true, v: [0, 0, 0], p: [0, 0, 0], life: 0 }));
    const puffG = [0xff4fa3, 0xffe14d, 0x3fd0ff, 0x8c5cff].map((c) => Rn.upload(new Mesh().ball([0, 0, 0], 0.18, hex(c), 2, 6, 4), { outline: false }));
    const puffs = Array.from({ length: 28 }, (_, i) => add(puffG[i % 4], M.I(), { hidden: true, v: [0, 0, 0], p: [0, 0, 0], life: 0 }));
    // ---------- fachada da Vavá Discos: um vinil gigante girando acima da porta e o letreiro em neon ----------
    const vava = (() => {
      const cv = document.createElement("canvas");
      cv.width = 1024; cv.height = 512;
      const g = cv.getContext("2d");
      // vinil (512 × 512 à esquerda)
      const cx = 256, cy = 256, R0 = 250;
      g.fillStyle = "#0d0c12"; g.beginPath(); g.arc(cx, cy, R0, 0, Math.PI * 2); g.fill();
      for (let r = 96; r < R0 - 6; r += 3.2) { g.strokeStyle = (r | 0) % 7 < 3 ? "#26232e" : "#18161e"; g.lineWidth = 1.4; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); }
      g.strokeStyle = "#8a84a0"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R0 - 4, 0, Math.PI * 2); g.stroke();
      // brilho (gira junto: é ele que mostra o disco rodando)
      for (const a0 of [-0.9, Math.PI - 0.9]) {
        const gr = g.createRadialGradient(cx, cy, 90, cx, cy, R0);
        gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.6, "rgba(200,190,255,0.22)"); gr.addColorStop(1, "rgba(255,255,255,0.05)");
        g.fillStyle = gr; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R0 - 6, a0, a0 + 0.55); g.closePath(); g.fill();
      }
      // rótulo do meio
      g.fillStyle = "#ff4fa3"; g.beginPath(); g.arc(cx, cy, 92, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(cx, cy, 92, Math.PI, Math.PI * 2); g.fill();
      g.strokeStyle = "#1b1530"; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 90, 0, Math.PI * 2); g.stroke();
      g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#1b1530";
      g.font = "900 40px Rubik, Arial Black, sans-serif"; g.fillText("VAVÁ", cx, cy - 38);
      g.font = "800 22px Rubik, Arial, sans-serif"; g.fillStyle = "#fff6e6"; g.fillText("DISCOS · 33⅓", cx, cy + 40);
      g.fillStyle = "#0d0c12"; g.beginPath(); g.arc(cx, cy, 9, 0, Math.PI * 2); g.fill();
      // letreiro (512 × 256 à direita): placa escura com neon rosa e azul
      const x = 512, y = 0, w = 512, h = 256;
      g.fillStyle = "#1b1530"; g.beginPath(); g.roundRect ? g.roundRect(x + 6, y + 6, w - 12, h - 12, 28) : g.rect(x + 6, y + 6, w - 12, h - 12); g.fill();
      g.lineWidth = 8; g.strokeStyle = "#ff4fa3"; g.shadowColor = "#ff4fa3"; g.shadowBlur = 18; g.stroke();
      // neon: brilho em volta e depois o texto nítido por cima
      for (const [txt, ty, fs, glow, core, tube] of [["VAVÁ", 100, 128, "#ff4fa3", "#fff0f8", "#ff7ac0"], ["D I S C O S", 196, 62, "#3fd0ff", "#f0fcff", "#7ae0ff"]]) {
        g.font = "900 " + fs + "px Rubik, Arial Black, sans-serif";
        g.shadowColor = glow; g.shadowBlur = 26; g.fillStyle = tube; g.fillText(txt, x + w / 2, y + ty);
        g.shadowBlur = 0; g.lineWidth = 7; g.strokeStyle = tube; g.strokeText(txt, x + w / 2, y + ty); g.fillStyle = core; g.fillText(txt, x + w / 2, y + ty);
      }
      const tex = Rn.texture(cv);
      const U = (x0, y0, x1, y1) => [x0 / 1024, y0 / 512, x1 / 1024, y1 / 512];
      // prédio da loja: x -25..-16, frente em z = 44 (olha pra -z), telhado em ~7.5
      const SW = 0.14, cz = 43.78;
      const dM = new Mesh().decal([0, 0, 0], [-1, 0, 0], [0, 1, 0], 4.3, 4.3, U(4, 4, 508, 508), [1.08, 1.08, 1.08], 4);
      const disc = add(Rn.upload(dM, { outline: false }), M.I(), { tex });
      const at = M.T(-18.3, SW + 7.15, cz);
      // espessura e suporte do disco (de lado não parece papel)
      const back = new Mesh();
      back.tube([-18.3, SW + 7.15, cz + 0.02], [-18.3, SW + 7.15, cz + 0.12], 2.13, 2.13, 28, hex(0x0d0c12));
      back.tube([-18.3, SW + 7.15, cz + 0.12], [-18.3, SW + 7.15, 44.02], 0.12, 0.12, 8, hex(0xb8bcc4), 1);
      add(Rn.upload(back), M.I());
      const sM = new Mesh().decal([-22.55, SW + 6.05, 43.94], [-1, 0, 0], [0, 1, 0], 3.9, 1.95, U(516, 6, 1020, 250), [1.25, 1.25, 1.25], 4);
      add(Rn.upload(sM, { outline: false }), M.I(), { tex });
      const plate = new Mesh();
      plate.box(-24.62, SW + 5.0, 43.95, -20.48, SW + 7.1, 44.0, hex(0x15111f));
      add(Rn.upload(plate), M.I());
      return { disc, at, spin: (t) => { disc.mo = M.mul(at, M.RZ(-t * 0.55)); } };
    })();
    vava.spin(0);
    // skatista
    let look = ART.LOOKS[opt.look || "kf"];
    let skFwd = opt.skatesForward !== false;
    let rig = ART.makeRig(Rn, look);
    let rigObjs = [...rig.objs, rig.board, rig.camera];
    objs.push(...rigObjs);
    function setLook(k) {
      look = ART.LOOKS[k];
      for (const o of rigObjs) o.hidden = true;
      for (const o of rigObjs) objs.splice(objs.indexOf(o), 1);
      rig = ART.makeRig(Rn, look);
      rigObjs = [...rig.objs, rig.board, rig.camera];
      objs.push(...rigObjs);
    }
    const fName = (k) => (look.skates ? SK_FLIP[k] : FLIPS[k].name);
    const gName = (k) => (look.skates ? SK_GRAB[k] : GRABN[k]);
    const grName = (k) => (look.skates ? SK_GRIND[k] : GRINDN[k]);
    const scene = {
      sun: V.norm([-0.45, 0.78, 0.42]), top: hex(0x1f78ff), mid: hex(0x6cc4ff), hz: hex(0xffe2b0),
      fog: hex(0xf3e2cf), fogd: 0.0046, shade: hex(0x8f7fd6), ink: hex(0x1b1530), ink_w: 1.5, objects: objs,
      amb: [1, 1, 1], night: 0, wet: 0, winc: L.winC, lights: new Float32Array(72),
    };

    // ---------- moradores: andam pelas calçadas ou ficam parados nos seus cantos ----------
    // k = morador (CHARS.TOWN), path = caminho (loop ou vai-e-volta), at/dir = lugar fixo e pra onde olha
    const NPC_DEF = [
      { k: 1, path: [[-36.4, 110.6], [34.4, 110.6], [34.4, 198.4], [-36.4, 198.4]], loop: 1, sp: 0.85 },
      { k: 4, path: [[-35, 42.6], [33, 42.6]], sp: 1.3 },
      { k: 6, path: [[-34, 211.6], [32, 211.6], [32, 241.2], [-34, 241.2]], loop: 1, sp: 1.7 },
      { k: 8, path: [[55, 141.5], [101, 141.5]], sp: 1.05 },
      { k: 11, path: [[-48.6, 113], [-48.6, 196]], sp: 0.9 },
      { k: 0, at: [-12, 126.4], dir: [0, -1], idle: "calm" },
      { k: 2, at: [-16, 218.6], dir: [0, -1], idle: "hips" },
      { k: 3, at: [10.2, 167.5], dir: [0, -1], idle: "boss" },
      { k: 5, at: [6, 226.6], dir: [0, -1], idle: "calm" },
      { k: 7, at: [90, 143.5], dir: [0, -1], idle: "calm" },
      { k: 9, at: [-50.6, 150], dir: [-1, 0], idle: "peace" },
      { k: 10, at: [72, 228], dir: [0, -1], idle: "hips" },
    ];
    // figurantes: gente que só passeia ou trabalha nas lojas (mesmos rostos dos moradores, outras roupas e cabelos)
    {
      const HAIRS = ["short", "long", "bun", "cap", "afro", "bob", "spiky", "taper", "long", "bald"];
      const HC = [0x1b1210, 0x2b170c, 0x6a3a1a, 0xc88a3a, 0x1b1530, 0x8a5a2a, 0xd84a8a, 0x2a1a10];
      const TOPS = [0x2457c8, 0xe0302b, 0x1fae5a, 0xffd23f, 0xff8fc8, 0x8c5cff, 0xf5f1e6, 0x1b1530, 0xff8a1f, 0x3fd0ff, 0x7a4a9a, 0x2a8a7a];
      const PANTS = [0x2b3a7a, 0x3a3a52, 0x5a4a3a, 0x1b1a22, 0x6a6a7a, 0xd8cbb0, 0x2f6fd8];
      const dk = (c) => (((c >> 16) & 255) * 0.78) << 16 | (((c >> 8) & 255) * 0.78) << 8 | ((c & 255) * 0.78);
      // cada figurante ganha um jeito de vestir (camiseta larga, jaqueta, camisa xadrez, moletom, avental),
      // chapéu ou boné de cor própria, óculos escuros às vezes e altura um pouco diferente
      const HATS = [0xe8c878, 0x22202a, 0xf4f1ea, 0x6a4a2a, 0x2457c8];
      const CAPS = [0xe0302b, 0x2457c8, 0x1b1530, 0x1fae5a, 0xffd23f, 0xf5f1e6];
      const PRINTS = [undefined, "cloud", "dollar", "nerd", undefined, undefined];
      for (let i = 0; i < 52; i++) {
        const src = ART.LOOKS["npc" + ((i * 5 + 3) % 12)], top = TOPS[(i * 7 + 2) % TOPS.length];
        const old = src.npc && src.npc.old, kind = (i * 7 + 3) % 6;
        let hairStyle = old ? src.hairStyle : HAIRS[(i * 3 + 1) % HAIRS.length];
        const hat = !old && i % 9 === 4 ? "hat" : !old && i % 7 === 2 ? "cap" : null;
        if (hat) hairStyle = hat;
        const L = Object.assign({}, src, {
          name: "", hairStyle, hair: old ? src.hair : HC[(i * 5) % HC.length], hatCol: hat === "hat" ? HATS[i % HATS.length] : undefined, hatBand: hat === "hat" ? TOPS[(i + 3) % TOPS.length] : undefined, capC: CAPS[i % CAPS.length],
          top, top2: dk(top), pants: PANTS[(i * 5 + 1) % PANTS.length], apron: kind === 5 && i >= 18 ? TOPS[(i + 4) % TOPS.length] : undefined, sleeve: i % 3 ? "short" : "long",
          scale: (src.scale || 0.92) * (0.94 + ((i * 13) % 7) * 0.02),
        });
        if (kind === 0) Object.assign(L, { tee: "loose", print: PRINTS[i % PRINTS.length] });
        else if (kind === 1) Object.assign(L, { jacket: true, inner: TOPS[(i * 3 + 5) % TOPS.length], top: [0x3a3a46, 0x6a3e22, 0x1f3a6a, 0x2a2a2a][i % 4], sleeve: "long" });
        else if (kind === 2) Object.assign(L, { jacket: true, flannel: true, inner: 0xf5f1e6, sleeve: "long" });
        else if (kind === 3) Object.assign(L, { hood: true, sleeve: "long" });
        else if (kind === 4) Object.assign(L, { belt: true, tee: "loose" });
        L.top2 = dk(L.top);
        if (!old && i % 5 === 3) L.shades = true;
        ART.LOOKS["fig" + i] = L;
      }

      // calçadas por onde eles andam (anel da cidade velha, quadra da prefeitura, Av. Brasil e R. São Pedro)
      const W = [
        [[-48.6, -42.6], [46.6, -42.6], [46.6, 42.6], [-48.6, 42.6]],
        [[-48.6, 110.4], [34.4, 110.4], [34.4, 198.6], [-48.6, 198.6]],
        [[-98, 210.4], [110, 210.4]],
        [[-48.6, -98], [-48.6, 298]],
        [[-98, 42.6], [-50, 42.6]],
        [[110, 110.4], [36, 110.4]],
        [[-37.2, -102], [-37.2, -198.6], [34.8, -198.6], [34.8, -102]],
        [[-98, -199.2], [-49, -199.2]],
        [[4.2, -104], [4.2, -171]],
      ];
      const plan = [0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 3, 3, 6, 6, 6, 7, 8];
      plan.forEach((w, i) => {
        let path = W[w].slice();
        const loop = path.length > 2;
        if (loop && i % 2) path = path.reverse();
        NPC_DEF.push({ look: "fig" + i, path, loop, sp: 1.0 + ((i * 37) % 10) / 20, seg0: loop ? i % path.length : 0, u0: ((i * 0.37) % 1), extra: 1 });
      });
      // atendentes nas portas das lojas abertas
      const IDL = ["calm", "hips", "boss", "peace", "shy"];
      (L.shops || []).slice(0, 12).forEach((sh, i) => NPC_DEF.push({ look: "fig" + (18 + i), at: [sh.x, sh.z], dir: [sh.nx, sh.nz], idle: IDL[i % IDL.length], extra: 1 }));
      // vida de interior: gente sentada na cadeira de fio na calçada, rodinhas de conversa,
      // criançada brincando e gente esperando o circular no ponto
      let fi = 30;
      const P = (at, dir, idle, chair) => NPC_DEF.push({ look: "fig" + (fi++ % 52), at, dir, idle, chair, extra: 1 });
      // Ladeira: posições escritas como no projeto (z 300..440) e espelhadas pro sul (z' = 200 - z)
      const PL = (at, dir, idle, chair) => P([at[0], 200 - at[1]], [dir[0], -dir[1]], idle, chair);
      P([-88, 43.2], [0, -1], "sit", 1); P([-86.9, 43.2], [0.3, -1], "sit", 1); P([-70, 43.2], [0, -1], "sit", 1);
      PL([-36.75, 320], [-1, 0], "sit", 1); PL([-36.75, 321.1], [-1, 0.3], "sit", 1); PL([-36.75, 352], [-1, 0], "sit", 1);
      PL([34.75, 330], [1, 0], "sit", 1); PL([34.75, 362], [1, 0], "sit", 1);
      PL([-80, 398.8], [0, 1], "sit", 1); PL([-78.9, 398.8], [-0.3, 1], "sit", 1); PL([80, 398.8], [0, 1], "sit", 1);
      P([-4.6, 130.6], [1, 0], "chat"); P([-3.0, 130.6], [-1, 0], "chat");
      PL([-0.8, 393.5], [1, 0.2], "chat"); PL([0.7, 393.8], [-1, -0.1], "chat"); PL([0, 392.6], [0, 1], "calm");
      P([70, 141.5], [1, 0], "chat"); P([71.4, 141.5], [-1, 0], "chat");
      PL([-10, 377], [0, 1], "bounce"); PL([-8.6, 377.4], [0, -1], "bounce"); P([2.6, 139.5], [-1, 0], "bounce"); P([-56, 43.0], [0, -1], "bounce");
      // Dudu na porta da lan house e o Seu Vavá na loja de discos
      NPC_DEF.push({ look: "dudu", at: [-27.4, 43.1], dir: [0, -1], idle: "bounce", extra: 1 });
      NPC_DEF.push({ look: "vava", at: [-18.2, 43.1], dir: [0, -1], idle: "calm", extra: 1 });
      for (const [x, z, y] of L.stops || []) { P([x - 2.6, z - 0.1], [0, z > 300 ? 1 : -1], "calm"); P([x + 0.4, z + 0.05], [0, z > 300 ? 1 : -1], "sit", 0); }
    }
    // cadeira de fio (aquela de área, colorida)
    const chairG = (() => {
      const m = new Mesh(), fr = hex(0xc8ccd6), cols = [0xe0302b, 0x2457c8, 0xffd23f, 0x1fae5a].map(hex);
      for (const sz of [-0.24, 0.24]) {
        m.tube([0.22, 0, sz], [0.18, 0.42, sz], 0.018, 0.018, 4, fr);
        m.tube([-0.22, 0, sz], [-0.2, 0.42, sz], 0.018, 0.018, 4, fr);
        m.tube([0.18, 0.42, sz], [-0.2, 0.42, sz], 0.018, 0.018, 4, fr);
        m.tube([-0.2, 0.42, sz], [-0.36, 0.95, sz], 0.018, 0.018, 4, fr);
      }
      for (let k = 0; k < 6; k++) { const x = 0.16 - k * 0.07; m.box(x - 0.02, 0.41, -0.24, x + 0.02, 0.435, 0.24, cols[k % 4]); }
      for (let k = 0; k < 7; k++) { const t = k / 6, x = -0.2 - t * 0.16, y = 0.47 + t * 0.46; m.box(x - 0.015, y - 0.02, -0.24, x + 0.015, y + 0.02, 0.24, cols[(k + 1) % 4]); }
      return Rn.upload(m);
    })();
    const NPCS = NPC_DEF.map((d, i) => {
      const look = ART.LOOKS[d.look || "npc" + d.k], r = ART.makeRig(Rn, look), body = r.objs[0];
      objs.push(body);
      if (d.chair) {
        const yaw = Math.atan2(-d.dir[1], d.dir[0]), gy = H(d.at[0], d.at[1]);
        add(chairG, M.mul(M.T(d.at[0] - Math.cos(yaw) * 0.04, gy, d.at[1] + Math.sin(yaw) * 0.04), M.RY(yaw)));
      }
      let p0 = d.at || d.path[0];
      if (d.path && d.seg0 != null) { const A = d.path[d.seg0], B = d.path[(d.seg0 + 1) % d.path.length]; p0 = [A[0] + (B[0] - A[0]) * d.u0, A[1] + (B[1] - A[1]) * d.u0]; }
      const n = { d, look, rig: r, body, x: p0[0], z: p0[1], seg: d.seg0 || 0, u: d.u0 || 0, dirS: 1, ph: i * 1.7, yaw: 0, wait: 0, name: look.name };
      n.ob = { x: n.x, z: n.z, r: 0.32, y1: 0 };
      n.yaw = d.dir ? Math.atan2(-d.dir[1], d.dir[0]) : 0;
      return n;
    });
    function npcFrame(dt, t) {
      const e = cam.eye;
      for (const n of NPCS) {
        const far = Math.hypot(n.x - e[0], n.z - e[2]);
        n.body.hidden = far > 85;
        if (far > 85) continue;
        const d = n.d, look = n.look;
        let pose;
        if (d.path) {
          // segue o caminho; espera se o skatista estiver bem na frente
          const P = d.path, a = P[n.seg], b = P[(n.seg + 1) % P.length];
          const L2 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, dx = (b[0] - a[0]) / L2, dz = (b[1] - a[1]) / L2;
          const fx = n.dirS * dx, fz = n.dirS * dz;
          // morador com missão para quando você chega perto devagar (pra dar pra conversar)
          const talk = d.k != null && !d.extra && Math.hypot(S.x - n.x, S.z - n.z) < 3.6 && S.speed < 4.5;
          const close = talk || Math.hypot(S.x - n.x - fx * 0.9, S.z - n.z - fz * 0.9) < 1.1;
          n.talk = talk;
          if (!close) {
            n.u += (d.sp * dt * n.dirS) / L2;
            n.ph += d.sp * dt * 5.2;
          }
          if (n.u > 1) { if (d.loop) { n.seg = (n.seg + 1) % P.length; n.u -= 1; } else if (n.seg + 2 < P.length) { n.seg++; n.u -= 1; } else { n.u = 1; n.dirS = -1; } }
          if (n.u < 0) { if (n.seg > 0) { n.seg--; n.u += 1; } else { n.u = 0; n.dirS = 1; } }
          const A = P[n.seg], B = P[(n.seg + 1) % P.length];
          n.x = A[0] + (B[0] - A[0]) * n.u;
          n.z = A[1] + (B[1] - A[1]) * n.u;
          const want = n.talk ? Math.atan2(-(S.z - n.z), S.x - n.x) : Math.atan2(-fz, fx);
          let dd = want - n.yaw;
          while (dd > Math.PI) dd -= Math.PI * 2;
          while (dd < -Math.PI) dd += Math.PI * 2;
          n.yaw += dd * Math.min(1, dt * 6);
          const sw = close ? 0 : Math.sin(n.ph);
          pose = { stand: 1, walk: 1, px: 0, py: 0.94, pz: 0, lean: 0.05 + (look.stoop || 0), twist: sw * 0.07, hy: 0, hp: 0.04, fxF: sw * 0.2, fxB: -sw * 0.2, fzF: 0.1, fzB: -0.1, lf: close ? 0 : Math.max(0, Math.cos(n.ph)) * 0.07, lb: close ? 0 : Math.max(0, -Math.cos(n.ph)) * 0.07, hF: [-sw * 0.18, 0.93, 0.27], hB: [sw * 0.18, 0.93, -0.27] };
        } else {
          pose = Object.assign({}, CHARS.IDLE[d.idle](t + n.ph));
          pose.lean += look.stoop || 0;
          // vira o rosto pro skatista quando ele chega perto
          if (far < 6) pose.hy = Math.max(-0.9, Math.min(0.9, -(Math.atan2(-(S.z - n.z), S.x - n.x) - n.yaw)));
        }
        const gy = H(n.x, n.z);
        n.rig.pose(M.mul(M.T(n.x, gy - 0.1, n.z), M.RY(n.yaw)), pose);
        n.ob.x = n.x; n.ob.z = n.z; n.ob.y1 = gy + 1.6;
      }
    }

    // ---------- missões dos moradores e desafios de cada skatista ----------
    const FLIP_N = new Set([...Object.values(FLIPS).map((f) => f.name), ...Object.values(SK_FLIP)]);
    const near = (e, x, z, r) => Math.hypot(e.x - x, e.z - z) < r;
    const clipHas = (c, f) => (c.ev || []).some(f);
    let jSelfies = 0;
    try { jSelfies = +localStorage.getItem("plaza-selfies-julie") || 0; } catch (e) {}
    // relógio do jogo e registro dos pontos (pra desafios de "some X pontos em Y segundos")
    let NOW = 0;
    const PTS = [];
    const ptsIn = (win, f) => PTS.filter((p) => NOW - p.t <= win && (!f || f(p))).reduce((a, p) => a + p.pts, 0);
    const FLIP_SORT = () => [...FLIP_N].sort((a, b) => b.length - a.length);
    const baseFlip = (n) => (FLIP_N.has(n) ? n : FLIP_SORT().find((f) => n.endsWith(" " + f)) || null);
    const fmt = (n) => Math.floor(n).toLocaleString("pt-BR");
    const recTricks = () => (REC ? distinctTricks({ ev: REC.events }) : 0);
    const distinctTricks = (c) => new Set((c.ev || []).filter((e) => e.type === "trick" && !e.name.startsWith("GAP")).map((e) => e.name)).size;
    // k = morador que pede; check(e) recebe cada evento do jogo
    const MISSIONS = [
      { k: 3, title: "Desça a escadaria da prefeitura", line: "Aqui não é pista, hein... Brincadeira. Se descer a escadaria da prefeitura de uma vez, eu finjo que não vi.", check: (e) => e.type === "gap" && e.name === "ESCADARIA DA PREFEITURA" },
      { k: 1, title: "Deslize na borda do chafariz", line: "Meu neto jurava que dava pra deslizar na borda do chafariz. Me mostra, querido?", check: (e) => e.type === "grind" && e.rail === "borda do chafariz" },
      { k: 6, title: "Ache as 5 bolinhas de gude (60 s)", line: "Perdi minhas bolinhas de gude pela feira! São cinco. Me ajuda a achar rapidinho?", time: 60, items: [[-21.5, 221], [0.5, 229], [12, 237.5], [-10, 213], [24, 221]] },
      { k: 2, title: "Deslize em cima de uma banca da feira", line: "Ô, skatista! Faz uma manobra em cima da minha banca que eu te dou uma laranja!", check: (e) => e.type === "grind" && e.rail === "banca da feira" },
      { k: 0, title: "Pule por cima do chafariz", line: "No meu tempo a molecada pulava o chafariz inteiro de bicicleta. E você, pula?", check: (e) => e.type === "gap" && e.name === "SOBRE O CHAFARIZ" },
      { k: 7, title: "Deslize no trilho do trem", line: "O trem não passa mais aqui faz tempo... Desliza no trilho pra mim, pra eu lembrar do barulho.", check: (e) => e.type === "grind" && e.rail === "trilho do trem" },
      { k: 10, title: "Some 3.000 pontos no posto (60 s)", line: "Movimento tá fraco hoje. Faz 3.000 pontos aqui no posto em um minuto pra animar?", time: 60, score: 3000, where: (e) => e.x > 46 && e.x < 112 && e.z > 210 && e.z < 247 },
      { k: 9, title: "Deslize no travessão do gol", line: "Aposto um pastel que você não desliza no travessão do gol.", check: (e) => e.type === "grind" && e.rail === "travessão do gol" },
      { k: 8, title: "Tire uma foto sua na estação", line: "Tô montando um zine sobre a cidade. Tira uma foto sua aqui na estação? (F abre a câmera)", check: (e) => e.type === "photo" && e.x > 46 && e.z > 108 && e.z < 162 },
      { k: 4, title: "Filme 3 manobras diferentes", line: "Grava um vídeo com três manobras diferentes pro meu fotolog! (R liga a filmadora)", check: (e) => e.type === "clip" && distinctTricks(e.clip) >= 3 },
      { k: 11, title: "Pule do teto do vagão", line: "Se você pular lá do teto do vagão, eu rezo pelos seus joelhos, meu filho.", check: (e) => e.type === "gap" && e.name === "TETO DO VAGÃO" },
      { k: 5, title: "Leve o pão pra Dona Cida (90 s)", line: "Leva esse pão quentinho pra Dona Cida? Ela tá passeando em volta da praça da prefeitura. Corre que esfria!", time: 90, deliver: 1 },
    ];
    // desafios de cada skatista: ok(e) conclui; score = some X pontos dentro de "win" segundos;
    // prog() mostra o andamento no canto da tela; hint diz como fazer
    const DESAFIOS = {
      kf: [
        { t: "Some 4.000 pontos em 60 s", hint: "emende manobras: cada combo soma", score: 4000, win: 60 },
        { t: "Grave um vídeo com 4 manobras diferentes", hint: "R liga a filmadora · R de novo salva", ok: (e) => e.type === "clip" && distinctTricks(e.clip) >= 4, prog: () => (REC ? [recTricks(), 4] : null) },
        { t: "Filme um gap na cidade nova", at: [0, 163], hint: "R grava · escadaria da prefeitura, chafariz, vagão", ok: (e) => e.type === "clip" && clipHas(e.clip, (v) => v.type === "gap" && v.z > 100) },
        { t: "Selfie à noite em frente à prefeitura", at: [-1, 150], hint: "Hora: Noite (menu) · F abre a câmera · Espaço tira", ok: (e) => e.type === "photo" && e.night > 0.5 && e.view === "selfie" && near(e, -1, 155, 30) },
        { t: "Tire 4 selfies com a Julie, cada uma com uma pose", hint: "pare perto dela e aperte F · cada foto ela muda a pose", ok: (e) => e.type === "photo" && e.julie && jSelfies >= 4, prog: () => [Math.min(4, jSelfies), 4] },
      ],
      manu: [
        { t: "Some 3.500 pontos em 60 s", hint: "manobras na rampa rendem mais", score: 3500, win: 60 },
        { t: "Grave uma Parada de Mão na rampa", at: [0, -23], hint: "R grava · no alto da rampa segure L", ok: (e) => e.type === "clip" && clipHas(e.clip, (v) => v.type === "trick" && v.name === "Parada de Mão") },
        { t: "Grave um grind na borda do chafariz", at: [-1, 136], hint: "R grava · K em cima da borda do chafariz", ok: (e) => e.type === "clip" && clipHas(e.clip, (v) => v.type === "grind" && v.rail === "borda do chafariz") },
        { t: "Selfie no meio da feira", at: [-4, 226], hint: "F abre a câmera · Espaço tira", ok: (e) => e.type === "photo" && e.view === "selfie" && near(e, -4, 226, 22) },
      ],
      kaua: [
        { t: "Some 5.000 pontos em 60 s", hint: "flip + grind + manual no mesmo combo", score: 5000, win: 60 },
        { t: "Grave um flip e um grind no mesmo vídeo", hint: "R grava · J flip · K grind", ok: (e) => e.type === "clip" && clipHas(e.clip, (v) => v.type === "grind") && clipHas(e.clip, (v) => v.type === "trick" && baseFlip(v.name)) },
        { t: "Foto de amigo no campo de várzea", at: [-75, 154], hint: "F câmera · V troca pra AMIGO · Espaço tira", ok: (e) => e.type === "photo" && e.view === "amigo" && near(e, -75, 154, 32) },
      ],
      gabi: [
        { t: "Foto no campo de várzea com o céu de tarde", at: [-75, 154], hint: "Hora: Fim de tarde · F câmera · Espaço tira", ok: (e) => e.type === "photo" && near(e, -75, 154, 32) && e.night < 0.4 },
        { t: "Grave um grind no trilho do trem", at: [78, 130.5], hint: "R grava · K no trilho, na estação", ok: (e) => e.type === "clip" && clipHas(e.clip, (v) => v.type === "grind" && v.rail === "trilho do trem") },
        { t: "Grave 20 segundos de rolê sem cair", hint: "R grava · se cair, recomeça", ok: (e) => e.type === "clip" && e.clip.len >= 20 && !clipHas(e.clip, (v) => v.type === "bail"), prog: () => (REC ? [REC.events.some((v) => v.type === "bail") ? 0 : Math.floor(REC.t), 20, "s"] : null) },
        { t: "Some 3.000 pontos em 60 s", hint: "sem pressa, só não para", score: 3000, win: 60 },
      ],
      kauane: [
        { t: "Some 5.000 pontos em 45 s", hint: "rápido e sem cair", score: 5000, win: 45 },
        { t: "Filme a escadaria da prefeitura", at: [0, 163], hint: "R grava · desça a escadaria pulando", ok: (e) => e.type === "clip" && clipHas(e.clip, (v) => v.type === "gap" && v.name === "ESCADARIA DA PREFEITURA") },
        { t: "Selfie debaixo de chuva", hint: "Chuva: Chovendo (menu) · F câmera · Espaço tira", ok: (e) => e.type === "photo" && e.view === "selfie" && e.rain > 0.4 },
      ],
      julie: [
        { t: "Mande um Hardflip", hint: "no ar: J + W", ok: (e) => e.type === "trick" && baseFlip(e.name) === "Hardflip" },
        { t: "Grind no corrimão da prefeitura", at: [0, 163], hint: "K em cima do corrimão da escadaria", ok: (e) => e.type === "grind" && (e.rail === "corrimão da prefeitura" || e.rail === "corrimão do meio") },
        { t: "Some 6.000 pontos em 60 s", hint: "combo grande ou vários seguidos", score: 6000, win: 60 },
        { t: "Filme um Varial Kickflip", hint: "R grava · no ar: J + A", ok: (e) => e.type === "clip" && clipHas(e.clip, (v) => v.type === "trick" && baseFlip(v.name) === "Varial Kickflip") },
        { t: "Selfie à noite na estação", at: [70, 141], hint: "Hora: Noite (menu) · F câmera · Espaço tira", ok: (e) => e.type === "photo" && e.view === "selfie" && e.night > 0.5 && e.x > 46 && e.z > 115 && e.z < 162 },
      ],
    };
    for (const k in DESAFIOS) for (const c of DESAFIOS[k]) if (c.score) {
      c.ok = (e) => e.type === "combo" && ptsIn(c.win) >= c.score;
      c.prog = () => [ptsIn(c.win), c.score, "pts"];
    }
    // celebração na tela + fumacinha colorida em volta do skatista
    function celebrate(kind, title, sub) {
      sfx.goal();
      // anel de fumacinha colorida subindo em volta do skatista
      puffs.forEach((p, i) => {
        const an = (i / puffs.length) * Math.PI * 2;
        p.hidden = false;
        p.life = 0.7 + Math.random() * 0.3;
        p.p = [S.x + Math.cos(an) * 0.7, S.y + 0.4, S.z + Math.sin(an) * 0.7];
        p.v = [Math.cos(an) * 1.6, 2.6 + Math.random() * 1.6, Math.sin(an) * 1.6];
      });
      ui.win && ui.win({ kind, title, sub });
    }
    let mDone = {}, dDone = {};
    try { mDone = JSON.parse(localStorage.getItem("plaza-missoes") || "{}"); dDone = JSON.parse(localStorage.getItem("plaza-desafios") || "{}"); } catch (e) {}
    const saveM = () => { try { localStorage.setItem("plaza-missoes", JSON.stringify(mDone)); localStorage.setItem("plaza-desafios", JSON.stringify(dDone)); } catch (e) {} };
    let MA = null, offer = null;
    const npcOf = (k) => NPCS.find((n) => n.d.k === k);
    // "!" amarelo em cima de quem tem missão
    const markM = new Mesh();
    markM.box(-0.07, 0.25, -0.07, 0.07, 0.75, 0.07, hex(0xffd23f), { m: 2 });
    markM.box(-0.07, 0, -0.07, 0.07, 0.14, 0.07, hex(0xffd23f), { m: 2 });
    const markG = Rn.upload(markM);
    const marks = MISSIONS.map(() => add(markG, M.I(), { hidden: true }));
    const itemG = Rn.upload(new Mesh().ball([0, 0, 0], 0.16, hex(0x3fd0ff), 2, 8, 5));
    const items = Array.from({ length: 5 }, () => add(itemG, M.I(), { hidden: true }));
    function emit(type, d) {
      const e = Object.assign({ type, x: S.x, z: S.z, t: REC ? REC.t : 0 }, d);
      if (REC && type !== "clip") REC.events.push(e);
      if (type === "combo") { PTS.push({ t: NOW, pts: e.pts, x: e.x, z: e.z }); if (PTS.length > 300) PTS.shift(); }
      if (MA && MA.m.check && MA.m.check(e)) missionDone();
      if (MA && MA.m.score && type === "combo" && (!MA.m.where || MA.m.where(e))) { MA.pts += e.pts; if (MA.pts >= MA.m.score) missionDone(); }
      storyEvent(e);
      const key = lookKey(), list = DESAFIOS[key];
      if (list) list.forEach((c, i) => {
        const id = key + i;
        if (!dDone[id] && c.ok(e)) {
          dDone[id] = 1;
          saveM();
          const left = list.filter((_, j) => !dDone[key + j]).length;
          celebrate("DESAFIO CONCLUÍDO", c.t, left ? `${look.name}: faltam ${left}` : `${look.name}: todos os desafios feitos!`);
          ui.mission && ui.mission("challenge", { t: c.t, who: look.name });
        }
      });
    }
    function missionDone() {
      const m = MA.m;
      mDone[MISSIONS.indexOf(m)] = 1;
      saveM();
      S.score += 1000;
      celebrate("MISSÃO CUMPRIDA", m.title.replace(/ \(\d+ s\)$/, ""), `${npcOf(m.k).name} agradece · +1.000`);
      items.forEach((o) => (o.hidden = true));
      ui.mission && ui.mission("done", { title: m.title, who: npcOf(m.k).name });
      MA = null;
    }
    const curChal = () => { const key = lookKey(), list = DESAFIOS[key] || []; const i = list.findIndex((_, j) => !dDone[key + j]); return i < 0 ? null : list[i]; };
    const cMark = add(Rn.upload((() => { const m = new Mesh(); m.box(-0.09, 0.3, -0.09, 0.09, 0.95, 0.09, hex(0xff4fa3), { m: 2 }); m.box(-0.09, 0, -0.09, 0.09, 0.18, 0.09, hex(0xff4fa3), { m: 2 }); return m; })()), M.I(), { hidden: true });
    function trackFrame() {
      const cc = curChal();
      cMark.hidden = !(cc && cc.at) || !!CUT || !!PH;
      if (!cMark.hidden) cMark.mo = M.mul(M.T(cc.at[0], H(cc.at[0], cc.at[1]) + 2.6 + Math.sin(NOW * 3) * 0.12, cc.at[1]), M.RY(NOW * 2));
      const key = lookKey(), list = DESAFIOS[key] || [];
      const i = list.findIndex((_, j) => !dDone[key + j]);
      if (i < 0) return ui.track && ui.track(null);
      const c = list[i], pr = c.prog && c.prog();
      ui.track && ui.track({ n: i + 1, of: list.length, t: c.t, hint: c.hint, prog: pr ? (pr[2] === "pts" ? `${fmt(Math.min(pr[0], pr[1]))}/${fmt(pr[1])}` : `${pr[0]}/${pr[1]}${pr[2] === "s" ? " s" : ""}`) : null, pct: pr ? Math.min(1, pr[0] / pr[1]) : null });
    }
    function missionFrame(dt, t) {
      // marcadores e oferta quando o skatista para perto
      MISSIONS.forEach((m, i) => {
        const n = npcOf(m.k), o = marks[i];
        o.hidden = !!mDone[i] || n.body.hidden || (MA && MA.m === m && !m.deliver);
        if (!o.hidden) o.mo = M.mul(M.T(n.x, H(n.x, n.z) + 2.05 * (n.look.scale || 1) + Math.sin(t * 3 + i) * 0.08, n.z), M.RY(t * 2));
      });
      // dá pra conversar com qualquer morador do "!" amarelo, mesmo no meio de outra missão (aí troca)
      if (!SA && !soffer && S.running && !PH && !REC && !CUT) {
        let best = null;
        MISSIONS.forEach((m, i) => { if (mDone[i] || (MA && MA.m === m)) return; const n = npcOf(m.k), d = Math.hypot(n.x - S.x, n.z - S.z); if (d < 3.2 && Math.abs(S.y - H(n.x, n.z)) < 1.6 && (!best || d < best.d)) best = { m, n, d }; });
        if (best && S.speed < 4 && (!offer || offer.m !== best.m)) { offer = best; ui.mission && ui.mission("offer", { who: best.n.name, line: best.m.line, title: best.m.title + (MA ? " (troca a missão atual)" : "") }); }
        if (offer && (!best || best.m !== offer.m)) { offer = null; ui.mission && ui.mission("hide"); if (MA) ui.mission && ui.mission("start", { title: MA.m.title }); }
      }
      if (!MA) return;
      const m = MA.m;
      if (m.time) {
        MA.left -= S.running ? dt : 0;
        if (MA.left <= 0) { say("MISSÃO FALHOU", 2, true); sfx.nocan(); ui.mission && ui.mission("fail", { title: m.title }); items.forEach((o) => (o.hidden = true)); MA = null; return; }
      }
      if (m.items) {
        MA.got.forEach((g, i) => {
          const o = items[i];
          if (g) return (o.hidden = true);
          const [x, z] = m.items[i], y = H(x, z) + 0.55 + Math.sin(t * 3 + i) * 0.1;
          o.hidden = false;
          o.mo = M.T(x, y, z);
          if (Math.hypot(S.x - x, S.y + 0.6 - y, S.z - z) < 1.3) { MA.got[i] = true; sfx.can(); say(`BOLINHA ${MA.got.filter(Boolean).length}/5`, 1); }
        });
        if (MA.got.every(Boolean)) return missionDone();
      }
      if (m.deliver != null) {
        const n = npcOf(m.deliver);
        if (Math.hypot(n.x - S.x, n.z - S.z) < 2.4) return missionDone();
      }
      ui.mission && ui.mission("tick", { title: m.title, left: m.time ? MA.left : null, prog: m.items ? `${MA.got.filter(Boolean).length}/5` : m.score ? `${fmt(MA.pts)}/${fmt(m.score)}` : null });
    }
    // lugares onde dá pra entrar: lan house (minigames) e loja de discos (ouvir álbuns)
    const PLACES = [
      { id: "lan", at: [-30, 42.4], who: "Dudu da Lan", line: "E aí, mano! Bora jogar um pouco? Pra vocês a ficha é por minha conta... só não conta pro meu chefe, kkkk.", title: "Entrar na Lan House" },
      { id: "sorveteria", at: [15.5, 42.4], who: "Neide da Sorveteria", line: "Entra que tá fresquinho aqui dentro! Hoje o flocos tá caprichado.", title: "Entrar na Sorveteria Pinguim" },
      { id: "festa", at: [27, 42.4], who: "Lucas (DJ Luskinha)", line: "Chega mais! A festa tá começando... hoje o som vai ser pesado, só pedrada dos anos 90!", title: "Entrar no Aloha Club" },
      { id: "discos", at: [-20.5, 42.4], who: "Seu Vavá dos Discos", line: "Chegou coisa nova! Pode escutar à vontade na cabine, só não risca meus vinis, hein.", title: "Entrar na Vavá Discos" },
    ];
    let poffer = null;
    function placeFrame() {
      const iceOn = SA && SA.def.kind === "ice";
      if ((SA && !iceOn) || soffer || PH || REC || CUT || offer) { if (poffer && (offer || soffer)) poffer = null; return; }
      const manu = /^manu/.test(lookKey() || "");
      const p = PLACES.find((q) => (!iceOn || q.id === "sorveteria") && !(manu && q.id === "festa") && Math.hypot(S.x - q.at[0], S.z - q.at[1]) < 2.4) || null;
      if (manu && Math.hypot(S.x - 27, S.z - 42.4) < 2.4 && S.speed < 4) { if (!placeFrame.mn) { placeFrame.mn = 1; say("A MANU PREFERE FICAR EM CASA (VIDEOGAME E SORVETE)", 2.6, true); } } else placeFrame.mn = 0;
      if (p && S.speed < 4 && poffer !== p) { poffer = p; ui.mission && ui.mission("offer", { who: p.who, line: p.line, title: p.title, place: 1 }); }
      if (!p && poffer) { poffer = null; ui.mission && ui.mission("hide"); if (MA) ui.mission && ui.mission("start", { title: MA.m.title }); }
    }
    // ---------- dentro das lojas: desce do skate e anda a pé ----------
    let IN = null, inTex = null, inCv = null, inAlbs = null;
    const ROOMS = {};
    const noteG = Rn.upload(new Mesh().ball([0, 0, 0], 0.035, hex(0xff4fa3), 2, 6, 4, { sy: 0.8 }).box(0.022, 0, -0.006, 0.034, 0.13, 0.006, hex(0xff4fa3), { m: 2 }).box(0.022, 0.1, -0.006, 0.08, 0.13, 0.006, hex(0xff4fa3), { m: 2 }), { outline: false });
    // par de patins da Manu (fica na porta enquanto ela anda de chinelo lá dentro)
    const skatePropG = (() => {
      const m = new Mesh(), L = ART.LOOKS.manu || {}, boot = hex(L.shoe || 0xff7ac0), trim = hex(L.shoe2 || 0xffffff);
      for (const [x, z, r] of [[0.84, 0.3, 0.25], [1.06, 0.38, -0.15]]) {
        m.tf = M.mul(M.T(x, 0, z), M.RY(Math.PI / 2 + r));
        m.box(-0.13, 0.05, -0.045, 0.17, 0.072, 0.045, hex(0xd5dbe8), { m: 1 });
        for (const wx of [-0.08, 0.12]) for (const wz of [-0.05, 0.05]) m.tube([wx, 0.036, wz - 0.02], [wx, 0.036, wz + 0.02], 0.036, 0.036, 7, hex(0xffd23f));
        m.box(-0.12, 0.072, -0.058, 0.16, 0.16, 0.058, boot); m.box(-0.12, 0.16, -0.056, 0.03, 0.34, 0.056, boot);
        m.box(-0.125, 0.31, -0.062, 0.035, 0.36, 0.062, trim); m.box(0.16, 0.035, -0.03, 0.21, 0.08, 0.03, hex(0xff4fa3));
        for (let i = 0; i < 3; i++) m.box(0.02 + i * 0.035, 0.16 + i * 0.035, -0.06, 0.04 + i * 0.035, 0.172 + i * 0.035, 0.06, trim);
      }
      m.tf = null;
      return Rn.upload(m);
    })();
    function shopAlbums() { if (!inAlbs) inAlbs = RADIO_ ? RADIO_.albums() : []; return inAlbs; }
    function roomOf(id) {
      if (ROOMS[id]) return ROOMS[id];
      if (!inCv) {
        inCv = INSIDE.makeTex(shopAlbums(), (cv) => { inTex = Rn.texture(cv, inTex); });
        inTex = Rn.texture(inCv, inTex);
      }
      const R = id === "lan" ? INSIDE.buildLan(Rn, inTex) : id === "sorveteria" ? INSIDE.buildSorveteria(Rn, inTex) : id === "festa" ? INSIDE.buildFesta(Rn, inTex) : INSIDE.buildDiscos(shopAlbums(), Rn, inTex);
      if (id === "festa") R.npcs = FESTA_CAST.map((c) => Object.assign({}, c));
      R.npcR = R.npcs.map((d, i) => Object.assign({ rig: ART.makeRig(Rn, ART.LOOKS[d.look] || ART.LOOKS.npc0), ph: i * 1.9 }, d));
      R.scene.lights = new Float32Array(R.lights.flat());
      R.notes = Array.from({ length: 8 }, (_, i) => ({ g: noteG, mo: M.I(), hidden: true, t: i * 0.45, sp: i % 2 }));
      ROOMS[id] = R;
      return R;
    }
    const POSE = (o) => Object.assign({ stand: 1, walk: 1, px: 0, py: 0.94, pz: 0, lean: 0.04, twist: 0, hy: 0, hp: 0.04, hr: 0, roll: 0, hF: [0.04, 0.95, 0.27], hB: [0.02, 0.95, -0.27], lf: 0, lb: 0, fxF: 0, fxB: 0, fzF: 0.1, fzB: -0.1 }, o);
    const SITP = (t, o) => POSE(Object.assign({ stand: 0, walk: 0, px: -0.06, py: 0.68, lean: 0.14, hp: 0.12, hF: [0.42, 0.86, 0.13], hB: [0.42, 0.86, -0.13], fxF: 0.36, fxB: 0.36, fzF: 0.1, fzB: -0.1 }, o));
    function enterPlace(id) {
      const R = roomOf(id);
      if (REC) recStop();
      if (PH) photoOff();
      for (const k in keys) keys[k] = false;
      IN = { id, R, x: R.spawn[0], z: R.spawn[1], yaw: -Math.PI / 2, yawT: null, v: 0, ph: 0, spot: null, hold: false, sit: null, talk: null, li: 0, pose: POSE({}), play: null, prog: 0, ang: 0, spin: 0, armA: 0, armY: 0, carry: null, ds: {}, anim: null, needle: null, curTi: 0, lb: null, phones: false, phoneDeck: null, lounge: null, vol: 0, cam: { eye: [0, 2.5, -1.2], at: [0, 1.1, 3], fov: 1.08 }, synth: false, t: 0 };
      if (music && music.playing) { music.stop(); IN.synth = true; }
      // patins não entram na loja de discos: a Manu tira na porta e calça o chinelo
      const ck = lookKey() + "_chinelo";
      if ((id === "discos" || id === "sorveteria") && look.skates && ART.LOOKS[ck]) { IN.skates = { prev: lookKey(), key: ck }; setLook(ck); IN.change = 0; }
      ui.inside && ui.inside("enter", { id, name: R.name, skates: !!IN.skates });
      if (id === "festa") festaEnter(R);
      return true;
    }
    function exitPlace() {
      if (!IN) return;
      const p = PLACES.find((q) => q.id === IN.id);
      // sai na calçada olhando pro lado (a câmera fica na calçada, não dentro da loja)
      Object.assign(S, { x: p.at[0] + 0.6, z: p.at[1] - 1.0, head: Math.PI / 2, camYaw: Math.PI / 2, speed: 0, vy: 0, mode: "ground", air: null, grind: null, man: null, hop: null });
      S.y = H(S.x, S.z);
      cam.eye = [S.x - 4, S.y + 2.4, S.z + 0.6]; cam.at = [S.x + 2, S.y + 1, S.z];
      if (IN.skates && lookKey() === IN.skates.key) setLook(IN.skates.prev);
      rig.board.hidden = !!look.skates;
      if (IN.synth && music && !music.playing && !opt.noMusic) music.start();
      const id = IN.id;
      IN = null;
      poffer = p;
      ui.inside && ui.inside("exit", { id });
    }
    function blockedIn(x, z) {
      const RW = IN.R.W - 0.28, RD = IN.R.D - 0.28;
      if (x < -RW || x > RW || z < 0.28 || z > RD) return true;
      const r = 0.27;
      for (const [x0, z0, x1, z1] of IN.R.solids) if (x > x0 - r && x < x1 + r && z > z0 - r && z < z1 + r) return true;
      for (const n of IN.R.npcR) if (!n.off && !n.hide && !((n.y || 0) > 1) && Math.hypot(x - n.x, z - n.z) < 0.5) return true;
      // portas das cabines: fechada tranca a frente; aberta fica pra fora, do lado da dobradiça
      for (const b of IN.R.booths || []) {
        const d = b.door, Q = d.a < 0.6 ? [b.bx - b.w, b.z0 - 0.06, b.bx + b.w, b.z0 + 0.06] : [b.bx - b.w - 0.25, b.z0 - 1.1, b.bx - b.w + 0.02, b.z0 - 0.02];
        if (x > Q[0] - r && x < Q[2] + r && z > Q[1] - r && z < Q[3] + r) return true;
      }
      return false;
    }
    const boothAt = (x, z) => (IN.R.booths || []).find((b) => Math.abs(x - b.bx) < b.w && z > b.z0 && z < b.z1);
    // abre/fecha a porta da cabine onde você está (ou da que está na sua frente)
    function doorToggle() {
      if (!IN || !IN.R.booths || IN.hold) return false;
      const b = boothAt(IN.x, IN.z) || IN.R.booths.find((q) => Math.abs(IN.x - q.bx) < 0.7 && IN.z > q.z0 - 1.3 && IN.z <= q.z0);
      if (!b) return false;
      b.open = b.open === false;
      if (b.open === false && !boothAt(IN.x, IN.z)) { b.open = true; return false; }
      IN.lb = null;
      return true;
    }
    function inInteract() {
      if (IN && IN.cut) { cutEnd(); return true; }
      if (!IN || IN.hold || IN.sit || !S.running) return false;
      const s = IN.spot;
      if (!s) return false;
      if (IN.R.id === "festa" && s.act !== "door") { if (s.face) IN.yawT = Math.atan2(-(s.face[1] - IN.z), s.face[0] - IN.x); return festaAct(s); }
      if (s.act === "door") {
        if (IN.carry) { IN.carry = null; vavaSay("Ô, menino! Disco só sai daqui pago, hein. Deixa que eu guardo."); return true; }
        ui.inside && ui.inside("leave");
        return true;
      }
      if (s.act === "deck") return deckInteract(s);
      if (s.act === "lounge") { IN.lounge = { c: s.chair, t: 0, from: [IN.x, IN.z, IN.yaw] }; IN.hold = true; ui.inside && ui.inside("lounge", { on: true }); return true; }
      if (s.face) IN.yawT = Math.atan2(-(s.face[1] - IN.z), s.face[0] - IN.x);
      if (s.act === "talk") {
        const L = INSIDE.LINES[s.who];
        sayIn(s.who, L[IN.li++ % L.length], 4);
        return true;
      }
      // sorveteria: pedir no balcão, pegar picolé no freezer, sentar na mesinha
      if (s.act === "order") {
        const ice = SA && SA.def.kind === "ice";
        if (IN.sayQ && IN.sayQ.length) return true;
        if (ice && !SA.phase) {
          sayIn("julie", "Pra mim, de flocos!", 2.2);
          IN.sayQ = [{ t: 2.3, who: "kf", line: "Faz dois de flocos, por favor. Deixa que eu pago." },
            { t: 2.6, who: "neide", line: "Dois de flocos, então. Aqui, ó.", give: 1 },
            { t: 2.3, who: "julie", line: "Ah, não precisava... valeu, K.F.! Da próxima é por minha conta." },
            { t: 3.0, who: "julie", line: "Bora ver o pôr do sol lá em cima da rampa?" }];
        } else if (IN.cone || IN.pop) sayIn("neide", "Termina esse primeiro, hein!");
        else {
          const F = [["flocos", 0xf8f2e6], ["chocolate", 0x5a3424], ["morango", 0xff8fb0], ["limão", 0xa8e07a], ["creme", 0xfff0a0]], f = F[(IN.li++) % F.length];
          IN.cone = { kf: 1, c: f[1] }; sfx.can();
          sayIn("neide", "Uma de " + f[0] + "? Tá na mão!");
        }
        return true;
      }
      if (s.act === "picole") {
        if (IN.cone || IN.pop) { sayIn("neide", "Termina esse primeiro, hein!"); return true; }
        IN.pop = [0xff6a6a, 0xffd23f, 0x7ae07a, 0xff9ccf, 0x8c5cff][(IN.li++) % 5]; sfx.can();
        sayIn("neide", "Pode pegar. Depois acerta ali no caixa.");
        return true;
      }
      if (s.act === "seat") {
        IN.sit = { s, t: 0, from: [IN.x, IN.z, IN.yaw], at: s.at, yaw: s.yaw, stand: false, opened: true, seat: true };
        IN.hold = true;
        ui.inside && ui.inside("lounge", { on: true, seat: true });
        return true;
      }
      if (s.act === "pc") {
        const p = s.pc;
        const at = p ? [p.cx + p.sd * 0.04, p.z] : [-2.95, 0.95];
        IN.sit = { s, t: 0, from: [IN.x, IN.z, IN.yaw], at, yaw: p ? (p.sd > 0 ? 0 : Math.PI) : Math.PI, stand: !p, opened: false };
        IN.hold = true;
        return true;
      }
      IN.hold = true;
      ui.inside && ui.inside("open", { act: s.act, fmt: s.fmt, start: s.start || 0, alb: s.alb });
      return true;
    }
    // a página fecha a tela (disco, vitrola, PC) e o skatista volta a andar
    function inRelease() {
      if (!IN) return;
      if (IN.sit) { const [x, z, y] = IN.sit.from, seat = IN.sit.seat; IN.x = x; IN.z = z; IN.yaw = y + Math.PI; IN.yawT = null; IN.sit = null; if (seat) ui.inside && ui.inside("lounge", { on: false }); }
      if (IN.lounge) { const [x, z] = IN.lounge.from; IN.x = x; IN.z = z; IN.yaw = Math.PI; IN.yawT = null; IN.lounge = null; ui.inside && ui.inside("lounge", { on: false }); }
      IN.hold = false;
      IN.spot = null;
    }
    // ângulo do braço da vitrola pra agulha cair no raio r do disco
    function armFor(r) {
      let best = 0, be = 9;
      for (let a = 0; a <= 1.3; a += 0.01) {
        const c = Math.cos(a), s = Math.sin(a), x = 0.19 + c * -0.02 + s * -0.235, z = 0.13 + -s * -0.02 + c * -0.235;
        const e = Math.abs(Math.hypot(x, z) - r);
        if (e < be) { be = e; best = a; }
      }
      return best;
    }
    // ---------- vitrolas, aparelhos de CD e o rádio: põe o disco com a mão, mexe na agulha ----------
    const progOf = (ai, ti) => { const a = shopAlbums()[ai]; if (!a) return 0; ti = Math.max(0, Math.min(a.faixas.length - 1, ti)); return a.um ? a.faixas[ti].s / a.fim : ti / a.faixas.length; };
    const deckOf = (id) => IN && IN.R.decks.find((d) => d.id === id);
    const dsOf = (id) => (IN.ds[id] = IN.ds[id] || { lp: null, cd: null, ang: 0, spin: 0, armA: 0, armY: 0, trayK: 0, drop: null });
    const WHO = { vava: "Seu Vavá", dudu: "Dudu", neide: "Neide", julie: "Julie", kf: "K.F." };
    function sayIn(who, line, t = 3.5) { IN.talk = { who, t }; ui.inside && ui.inside("say", { who: WHO[who] || who, line }); }
    function vavaSay(line) { IN.talk = { who: "vava", t: 3.5 }; ui.inside && ui.inside("say", { who: "Seu Vavá", line }); }
    // qual formato o aparelho vai usar agora (cabine tem os dois; o rádio só CD)
    function deckFmt(s, d) {
      if (s.fmt) return s.fmt;
      if (!d.TT) return "cd";
      const c = IN.carry, ds = dsOf(d.id);
      if (c) return c.fmt;
      if (IN.play && IN.play.deck === d.id) return IN.play.fmt;
      return ds.lp != null ? "lp" : ds.cd != null ? "cd" : "lp";
    }
    function spotLabel(s) {
      const c = IN.carry;
      if (s.act === "deck") {
        const d = deckOf(s.deck), ds = dsOf(d.id), f = deckFmt(s, d), loaded = ds.lp != null || ds.cd != null;
        const bt = s.booth && IN.R.booths.find((b) => "b" + b.k === d.id);
        const fone = s.booth ? (IN.phones && IN.phoneDeck === d.id ? " · F tira o fone" : " · F põe o fone") + (bt && bt.open === false ? " · Q abre" : " · Q fecha") : "";
        if (d.box) return (c ? (c.fmt === "cd" ? "Pôr o CD no rádio" : "O rádio só toca CD") : ds.cd != null ? "Trocar faixa do rádio" : "Rádio de CD (traga um CD)");
        if (s.booth) return (c ? (c.fmt === "lp" ? "Pôr o disco na vitrola da cabine" : "Pôr o CD no aparelho da cabine") : loaded ? "Trocar faixa" : "Cabine livre") + fone;
        if (f === "lp") return c ? (c.fmt === "lp" ? "Pôr o disco na vitrola" : "CD vai no aparelho do lado →") : ds.lp != null ? "Mexer na agulha (trocar faixa)" : "Vitrola vazia";
        return c ? (c.fmt === "cd" ? "Pôr o CD no aparelho" : "← Vinil vai na vitrola") : ds.cd != null ? "Trocar faixa do CD" : "Aparelho de CD vazio";
      }
      if (s.act === "dig" && c) return "Trocar o disco da mão";
      if (s.act === "insp" && c) return s.label.replace("Pegar:", "Trocar por:");
      if (s.act === "door" && c) return "Sair (o disco fica)";
      return s.label;
    }
    // deitado na poltrona: recostado, mãos atrás da cabeça, pernas esticadas no pufe e tornozelos cruzados,
    // calcanhares apoiados com a ponta do pé pra cima (a sola fica virada pra frente); o pé de cima balança no ritmo
    function LOUNGE(t, br) {
      const sw = Math.sin(t * 2.1) * 0.05;
      return POSE({ stand: 0, walk: 0, px: -0.06, py: 0.47 + br, pz: 0, lean: -0.72, twist: 0.04, hy: Math.sin(t * 0.25) * 0.2, hp: 0.32, hr: 0.05,
        hF: [-0.5, 1.02, 0.15], hB: [-0.52, 1.0, -0.15],
        fxF: 0.75, fxB: 0.7, fzxF: -0.015, fzxB: 0.03, lf: 0.56, lb: 0.44, fyF: 0.14 + sw, fyB: -0.12, fpF: 1.38 + sw, fpB: 1.32 });
    }
    // ---------- modo discoteca: em certas músicas desce o globo do teto, o chão ganha luzes e as paredes, brilhos ----------
    function discoFx(R, D, dt, t) {
      const on = !!(IN.disco && IN.disco.on);
      IN.discoK = Math.max(0, Math.min(1, (IN.discoK || 0) + (on ? dt / 2.2 : -dt / 1.2)));
      const k = IN.discoK, e = k * k * (3 - 2 * k);
      if (!D.disco) {
        const bm = new Mesh();
        bm.ball([0, 0, 0], 0.26, hex(0xd8dde8), 0.25, 12, 8);
        for (let i = 0; i < 18; i++) { const a = i * 2.4, b = (i % 6) / 6 * 2.2 - 1.1; bm.ball([Math.cos(a) * Math.cos(b) * 0.25, Math.sin(b) * 0.25, Math.sin(a) * Math.cos(b) * 0.25], 0.035, hex(0xffffff), 2, 4, 2); }
        const ch = new Mesh(); ch.tube([0, 0, 0], [0, 1, 0], 0.008, 0.008, 4, hex(0x9a9aa2), 1);
        const cols = [0xff4fa3, 0x3fd0ff, 0xffe14d, 0x8c5cff, 0x2fe08a, 0xff8a3a];
        const spotG = cols.map((c) => { const m = new Mesh(); m.tube([0, 0, 0], [0, 0.006, 0], 0.42, 0.42, 18, hex(c), 2); return Rn.upload(m, { outline: false }); });
        const sparkG = Rn.upload(new Mesh().box(-0.03, -0.03, -0.03, 0.03, 0.03, 0.03, hex(0xffffff), { m: 2 }), { outline: false });
        D.disco = [{ g: Rn.upload(bm), mo: M.I(), hidden: true }, { g: Rn.upload(ch, { outline: false }), mo: M.I(), hidden: true },
          ...Array.from({ length: 8 }, (_, i) => ({ g: spotG[i % 6], mo: M.I(), hidden: true })), ...Array.from({ length: 28 }, () => ({ g: sparkG, mo: M.I(), hidden: true }))];
        R.ambBase = R.scene.amb.slice();
      }
      const [ball, chain] = D.disco, [BX, BZ] = R.ball || [0, 6.4], H = R.H || 3.4, hide = k <= 0.001;
      const by = H + 0.35 - e * 0.95;
      ball.hidden = chain.hidden = hide;
      ball.mo = M.mul(M.T(BX, by, BZ), M.RY(t * 1.1));
      chain.mo = M.mul(M.T(BX, by + 0.25, BZ), M.S(1, Math.max(0.01, H - by - 0.25), 1));
      D.disco.slice(2, 10).forEach((o, i) => { o.hidden = k < 0.5; const a = t * (0.6 + i * 0.07) * (i % 2 ? -1 : 1) + i * 0.785, r = 0.9 + (i % 3) * 1.05; o.mo = M.T(BX + Math.cos(a) * r * 1.3, 0.014, BZ + Math.sin(a) * r * 1.5); });
      D.disco.slice(10).forEach((o, i) => {
        o.hidden = k < 0.5;
        const a = t * 0.55 + i * (Math.PI * 2 / 28), el = ((i * 37) % 11) / 11 * 0.8 - 0.45, d = [Math.cos(a), el, Math.sin(a)];
        let best = 99;
        for (const [ax, w] of [[0, R.W], [0, -R.W], [2, R.D], [2, 0]]) { const dd = d[ax]; if (Math.abs(dd) < 1e-3) continue; const tt = (w - (ax ? BZ : BX)) / dd; if (tt > 0 && tt < best) best = tt; }
        const q = [BX + d[0] * best * 0.995, Math.max(0.3, Math.min(H - 0.1, by + d[1] * best)), BZ + d[2] * best * 0.995];
        o.mo = M.T(q[0], q[1], q[2]);
      });
      if (R.ambBase) {
        const cyc = [[1, 0.35, 0.7], [0.35, 0.8, 1], [0.75, 0.45, 1], [1, 0.9, 0.4]], ph = (t * 1.6) % 4, i0 = Math.floor(ph), u = ph - i0, A = cyc[i0], B = cyc[(i0 + 1) % 4];
        R.scene.amb = R.ambBase.map((v, j) => v * (1 - e * 0.5) + (A[j] + (B[j] - A[j]) * u) * e * 0.45);
      }
    }
    // casquinha na mão do K.F. (e da Julie, na missão) e picolé
    const scoopG = {}, popG = {};
    const scoopOf = (c) => scoopG[c] || (scoopG[c] = Rn.upload((() => { const m = new Mesh(); m.tube([0, -0.16, 0], [0, 0, 0], 0.005, 0.045, 7, hex(0xd8a25a)); m.ball([0, 0.04, 0], 0.052, hex(c), 0, 7, 5); if (c === 0xf8f2e6) { m.ball([0.02, 0.07, 0.01], 0.012, hex(0x3a2418), 2, 4, 3); m.ball([-0.02, 0.05, -0.02], 0.01, hex(0x3a2418), 2, 4, 3); } return m; })()));
    const popOf = (c) => popG[c] || (popG[c] = Rn.upload((() => { const m = new Mesh(); m.box(-0.008, -0.12, -0.004, 0.008, 0, 0.004, hex(0xe8d0a0)); m.box(-0.03, 0, -0.016, 0.03, 0.13, 0.016, hex(c)); return m; })()));
    function iceFrame(R, D) {
      if (!D.ice) D.ice = [{ g: coneG, mo: M.I(), hidden: true }, { g: coneG, mo: M.I(), hidden: true }, { g: scoopOf(0xff8fb0), mo: M.I(), hidden: true }];
      const [a, b, cc] = D.ice;
      const cl = R.npcR.find((n) => n.idle === "seat"), hc = cl && cl.rig.F ? handOf(cl.rig, ART.LOOKS[cl.look], "F") : null;
      cc.hidden = !hc; if (hc) cc.mo = M.mul(M.T(hc[0], hc[1] + 0.05, hc[2]), M.RZ(0.25));
      const h = rig.F ? handOf(rig, look, "F") : null;
      a.hidden = !(h && (IN.cone || IN.pop));
      if (!a.hidden) { a.g = IN.pop ? popOf(IN.pop) : scoopOf(IN.cone.c); a.mo = M.mul(M.T(h[0], h[1] + 0.05, h[2]), M.RZ(0.25)); }
      const j = R.npcR.find((n) => n.julie && !n.off), hj = j && IN.cone && IN.cone.julie && j.rig.F ? handOf(j.rig, ART.LOOKS.julie, "F") : null;
      b.hidden = !hj;
      if (hj) { b.g = scoopOf(0xf8f2e6); b.mo = M.mul(M.T(hj[0], hj[1] + 0.05, hj[2]), M.RZ(0.25)); }
    }
    function needleInfo() {
      const N = IN.needle, ds = dsOf(N.deck), ai = ds[N.fmt], a = shopAlbums()[ai];
      ui.inside && ui.inside("needle", { on: true, fmt: N.fmt, ti: N.ti, n: a.faixas.length, t: a.faixas[N.ti].t, lado: a.faixas[N.ti].lado || "", a: a.a, playing: !!(IN.play && IN.play.deck === N.deck && IN.play.fmt === N.fmt) });
    }
    function deckInteract(s) {
      const d = deckOf(s.deck), ds = dsOf(d.id), c = IN.carry, fmt = deckFmt(s, d);
      if (c && c.fmt !== fmt) { vavaSay(d.box ? "Esse rádio só toca CD, menino!" : fmt === "lp" ? "Isso é CD, menino! Vai no aparelho do lado." : "Vinil vai na vitrola, ali do lado!"); return true; }
      if (fmt === "lp" && !d.TT) { vavaSay("Esse rádio só toca CD!"); return true; }
      if (s.face) IN.yawT = Math.atan2(-(s.face[1] - IN.z), s.face[0] - IN.x);
      if (c) {
        if (IN.play && IN.play.deck === d.id && IN.play.fmt === fmt) ui.inside && ui.inside("lift", {});
        IN.anim = { kind: fmt, ai: c.ai, t: 0, deck: d.id, from: null };
        ds[fmt] = null;
        IN.hold = true;
        return true;
      }
      if (ds[fmt] == null) { vavaSay(d.box ? "Escolhe um CD na estante e põe aí no rádio, que todo mundo escuta." : s.booth ? "Pega um disco ou um CD e leva pra cabine. Lá dentro é só você e o som." : fmt === "lp" ? "Pega um disco nas gôndolas ou na parede e traz aqui." : "Os CDs tão na estante do outro lado. Escolhe um e traz."); return true; }
      IN.needle = { deck: d.id, fmt, ti: IN.play && IN.play.deck === d.id && IN.play.fmt === fmt ? IN.curTi || 0 : 0 };
      IN.hold = true;
      needleInfo();
      return true;
    }
    function needleMove(d) { if (!IN || !IN.needle) return; const N = IN.needle, n = shopAlbums()[dsOf(N.deck)[N.fmt]].faixas.length; N.ti = (N.ti + d + n) % n; needleInfo(); }
    function needleDrop() {
      if (!IN || !IN.needle) return;
      const N = IN.needle, ds = dsOf(N.deck);
      if (N.fmt === "cd") ui.inside && ui.inside("drop", { ai: ds.cd, fmt: "cd", ti: N.ti, deck: N.deck });
      else ds.drop = { ti: N.ti };
      needleExit();
    }
    function needleLift() { if (!IN || !IN.needle) return; const N = IN.needle; if (IN.play && IN.play.deck === N.deck && IN.play.fmt === N.fmt) ui.inside && ui.inside("lift", {}); needleInfo(); }
    function needleTake() {
      if (!IN || !IN.needle) return;
      const N = IN.needle, ds = dsOf(N.deck);
      if (IN.play && IN.play.deck === N.deck && IN.play.fmt === N.fmt) ui.inside && ui.inside("lift", {});
      IN.carry = { ai: ds[N.fmt], fmt: N.fmt };
      ds[N.fmt] = null;
      needleExit();
    }
    function needleExit() { if (!IN) return; IN.needle = null; IN.hold = false; IN.spot = null; ui.inside && ui.inside("needle", { on: false }); }
    // fone de ouvido: só nas cabines. Põe e tira com F; sai da cabine, ele volta pro gancho.
    const phoneCache = {};
    function phoneG() {
      const k = lookKey();
      if (phoneCache[k]) return phoneCache[k];
      const hs = look.hairStyle, big = hs === "afro";
      const pz = big ? 0.27 : look.beanie ? 0.178 : hs === "spiky" ? 0.168 : hs === "taper" ? 0.172 : 0.166;
      const r = big ? 0.33 : look.beanie ? 0.24 : hs === "spiky" ? 0.27 : hs === "taper" ? 0.31 : 0.21;
      return (phoneCache[k] = Rn.upload(INSIDE.phoneMesh(r, pz, 0.2)));
    }
    const hookG = Rn.upload(INSIDE.phoneMesh(0.16, 0.13, 0.0));
    function phonesToggle() {
      if (!IN || IN.R.id !== "discos") return false;
      const s = IN.spot;
      if (IN.phones) { IN.phones = false; IN.lb = null; return true; }
      if (!s || !s.booth || IN.hold || IN.sit) return false;
      IN.phones = true; IN.phoneDeck = s.deck; IN.lb = null;
      return true;
    }
    function discosFrame(R, Dy, dt, t, fx, fz, px, pz, yaw) {
      const P = IN.play, A = IN.anim, G = R.G;
      if (A) A.t += dt;
      for (const b of R.booths || []) {
        // andando pra fora com a porta fechada, ela abre sozinha
        const inside = Math.abs(px - b.bx) < b.w && pz > b.z0 && pz < b.z1;
        if (b.open === false && inside && Math.abs(IN.v) > 0.1 && fz * Math.sign(IN.v) < -0.3) { b.open = true; IN.lb = null; }
        const tgt = b.open === false ? 0 : 1.75;
        b.door.a += (tgt - b.door.a) * Math.min(1, dt * 5);
        b.door.mo = M.mul(M.T(b.bx - b.w, 0, b.z0), M.RY(b.door.a));
      }
      const ease = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
      const L3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
      const ya = Math.atan2(fx, fz);
      const sdx = Math.sin(yaw), sdz = Math.cos(yaw), cdh = IN.carry && IN.carry.fmt === "cd";
      const chest = [px + sdx * 0.3 + fx * 0.04, cdh ? 0.82 : 0.66, pz + sdz * 0.3 + fz * 0.04];
      // na mão
      Dy.heldLP.hidden = Dy.heldCD.hidden = true;
      Dy.flyDisc.hidden = Dy.flyLab.hidden = Dy.flySleeve.hidden = Dy.flyCD.hidden = true;
      const c = IN.carry;
      if (c && !A) {
        const o = c.fmt === "cd" ? Dy.heldCD : Dy.heldLP;
        o.g = (c.fmt === "cd" ? G.caseG : G.nowG)[c.ai];
        o.hidden = false;
        o.mo = M.mul(M.T(...chest), M.mul(M.RY(ya), M.T(0, c.fmt === "cd" ? -0.071 : -0.155, 0)));
      }
      let anyPub = false;
      for (const d of R.decks) {
        const ds = dsOf(d.id), O = d.objs, mine = A && A.deck === d.id;
        const playingHere = P && P.deck === d.id;
        // ---- vitrola ----
        if (d.TT) {
          const TT = d.TT, TTm = M.T(...TT);
          ds.spin += ((ds.lp != null ? 1 : 0) - ds.spin) * Math.min(1, dt * 1.6);
          ds.ang += dt * 3.49 * ds.spin;
          const standM = d.booth ? M.mul(M.T(d.booth.bx - 0.4, 0, d.booth.z1 - 0.75), M.mul(M.RY(Math.PI / 2), M.RX(0.22))) : M.mul(M.T(TT[0], TT[1], TT[2] + 0.38), M.RX(0.18));
          O.disc.hidden = ds.lp == null; O.lab.hidden = ds.lp == null;
          if (ds.lp != null) { const dm = M.mul(TTm, M.mul(M.T(0, 0.124, 0), M.RY(-ds.ang))); O.disc.mo = dm; O.lab.mo = dm; O.lab.g = G.labG[ds.lp]; }
          if (!O.nowP) O.nowP = { g: G.nowG[0], mo: standM, tex: Dy.fan && O.disc.tex, hidden: true };
          O.nowP.hidden = ds.lp == null; if (ds.lp != null) { O.nowP.g = G.nowG[ds.lp]; O.nowP.mo = standM; }
          if (mine && A.kind === "lp") {
            if (!A.from) { A.from = chest.slice(); IN.carry = null; }
            const over = [TT[0], TT[1] + 0.3, TT[2] - 0.12], k1 = ease(0, 0.55, A.t), slv = L3(A.from, over, k1), k3 = ease(1.25, 2.0, A.t);
            if (A.t < 2.0) {
              const S2 = Dy.flySleeve; S2.hidden = false; S2.g = G.nowG[A.ai];
              const tgt = [standM[12], standM[13], standM[14]];
              S2.mo = M.mul(M.T(...L3(slv, tgt, k3)), M.mul(M.RY(ya * (1 - k3)), M.T(0, -0.155 * (1 - k3), 0)));
            }
            const rise = ease(0.55, 1.15, A.t) * 0.3, k2 = ease(1.15, 1.9, A.t);
            const pp = L3([slv[0], slv[1] + rise, slv[2] - 0.01], [TT[0], TT[1] + 0.124, TT[2]], k2);
            pp[1] += Math.sin(k2 * Math.PI) * 0.08;
            if (A.t > 0.55) { const fm = M.mul(M.T(...pp), M.mul(M.RY(ya * (1 - k2)), M.RX((-Math.PI / 2) * (1 - k2)))); Dy.flyDisc.hidden = Dy.flyLab.hidden = false; Dy.flyDisc.mo = Dy.flyLab.mo = fm; Dy.flyLab.g = G.labG[A.ai]; }
            if (A.t >= 2.05) { ds.lp = A.ai; IN.anim = null; ds.drop = { ti: 0 }; IN.hold = false; IN.spot = null; IN.lb = null; }
          }
          let tp = null, lifted = true;
          if (ds.lp != null) {
            if (ds.drop) { tp = progOf(ds.lp, ds.drop.ti); lifted = false; }
            else if (IN.needle && IN.needle.deck === d.id && IN.needle.fmt === "lp") tp = progOf(ds.lp, IN.needle.ti);
            else if (playingHere && P.fmt === "lp") { tp = IN.prog; lifted = false; }
          }
          const tgt = tp == null ? 0 : armFor(0.145 - Math.max(0, Math.min(1, tp)) * 0.08);
          const da = tgt - ds.armA;
          ds.armA += Math.sign(da) * Math.min(Math.abs(da), dt * 0.9);
          const down = tp != null && !lifted && Math.abs(da) < 0.02;
          ds.armY += ((down ? -0.016 : tp != null ? 0.012 : 0) - ds.armY) * Math.min(1, dt * 6);
          O.arm.mo = M.mul(TTm, M.mul(M.T(0.19, 0.165 + ds.armY, 0.13), M.RY(ds.armA)));
          if (ds.drop && down && ds.armY < -0.012) { const ti = ds.drop.ti; ds.drop = null; ui.inside && ui.inside("drop", { ai: ds.lp, fmt: "lp", ti, deck: d.id }); }
          if (playingHere && P.fmt === "lp" && down && d.pub) anyPub = d;
        }
        // ---- CD (aparelho ou rádio) ----
        if (d.CDP) {
          const CDP = d.CDP, ty = d.box ? 0.025 : 0.045, tz = d.box ? -0.125 : -0.16;
          let trayK = 0, cdM = null;
          if (mine && A.kind === "cd") {
            if (!A.from) { A.from = chest.slice(); IN.carry = null; }
            trayK = ease(0, 0.45, A.t) * (1 - ease(1.2, 1.6, A.t));
            const over = [CDP[0], CDP[1] + 0.25, CDP[2] - 0.3], k1 = ease(0, 0.5, A.t), cs = L3(A.from, over, k1);
            O.case.hidden = false; O.case.g = G.caseG[A.ai];
            O.case.mo = A.t < 1.0 ? M.mul(M.T(...cs), M.RY(ya)) : M.mul(M.T(...d.caseAt), M.RX(Math.PI / 2));
            if (A.t > 0.45) { const k2 = ease(0.5, 1.0, A.t); cdM = M.T(...L3([cs[0], cs[1] + 0.07, cs[2] - 0.01], [CDP[0], CDP[1] + ty, CDP[2] + tz + 0.07 + 0.14 * (1 - trayK) - 0.14], k2)); }
            if (A.t >= 1.65) { ds.cd = A.ai; IN.anim = null; IN.hold = false; IN.spot = null; IN.lb = null; ui.inside && ui.inside("drop", { ai: A.ai, fmt: "cd", ti: 0, deck: d.id }); }
          } else {
            O.case.hidden = ds.cd == null;
            if (ds.cd != null) { O.case.g = G.caseG[ds.cd]; O.case.mo = M.mul(M.T(...d.caseAt), M.RX(Math.PI / 2)); }
          }
          O.tray.mo = M.mul(M.T(...CDP), M.T(0, ty, tz + 0.14 * (1 - trayK)));
          O.cdDisc.hidden = !cdM;
          if (cdM) O.cdDisc.mo = M.mul(cdM, M.T(0, 0, 0.07));
          const cdPlay = playingHere && P.fmt === "cd";
          O.led.tint = cdPlay ? [1.25, 1.25, 1.25] : ds.cd != null ? [0.6, 0.8, 0.6] : [0.25, 0.4, 0.3];
          if (cdPlay && d.pub) anyPub = d;
        }
        // fone pendurado no gancho da cabine
        if (d.booth) {
          if (!O.hang) O.hang = { g: hookG, mo: M.mul(M.T(...d.booth.hook), M.RY(Math.PI / 2)), hidden: false };
          O.hang.hidden = !!(IN.phones && IN.phoneDeck === d.id);
        }
      }
      // notas saindo das caixas de quem está tocando pra loja toda
      for (const nt of R.notes) {
        nt.t += dt;
        if (nt.t > 3.2) nt.t -= 3.2;
        nt.hidden = !anyPub;
        if (!anyPub) continue;
        const k = nt.t / 3.2, src = anyPub.notes[nt.sp % anyPub.notes.length];
        nt.mo = M.mul(M.T(src[0] + Math.sin(k * 7 + nt.sp * 2) * 0.18, src[1] + k * 1.3, src[2] - k * 0.5), M.mul(M.RY(Math.sin(t * 2 + nt.sp) * 0.6), M.S(1 - k * 0.6, 1 - k * 0.6, 1 - k * 0.6)));
      }
      // volume: perto das caixas mais alto; na cabine, só com o fone fica alto
      // volume: cabine com o próprio disco toca alto lá dentro (com o fone, mais ainda); de porta fechada o
      // som de fora quase some e o de dentro quase não vaza
      let vol = 60;
      const myB = boothAt(px, pz);
      if (P) {
        const d = deckOf(P.deck);
        if (d && d.booth) {
          const b = d.booth, closed = R.booths[b.k].open === false;
          if (myB && myB.k === b.k) vol = IN.phones ? 100 : closed ? 96 : 90;
          else vol = closed ? 6 : 22;
        } else if (d) {
          const src = d.TT && P.fmt === "lp" ? d.TT : d.CDP, dist = Math.hypot(px - src[0], pz - src[2]);
          vol = Math.round(100 * Math.max(0.62, Math.min(1, 1 - (dist - 3) / 14)));
          if (myB) vol = Math.round(vol * (myB.open === false ? 0.18 : 0.6));
          if (IN.phones) vol = Math.round(vol * 0.35);
        }
      }
      if (Math.abs(vol - (IN.vol || 0)) >= 3) { IN.vol = vol; ui.inside && ui.inside("vol", { v: vol }); }
      // fone na cabeça
      if (!Dy.headP) Dy.headP = { g: phoneG(), mo: M.I(), hidden: true };
      Dy.headP.hidden = !IN.phones || !rig.F;
      if (IN.phones && rig.F) { Dy.headP.g = phoneG(); Dy.headP.mo = M.mul(rig.F[CHARS.BONE.head], M.S(look.headScale || 1, look.headScale || 1, look.headScale || 1)); }
    }
    // ================= festa no Aloha Club =================
    // elenco: a turma (quem você não está jogando aparece como NPC), Julie, DJ Luskinha, Mila, Diogo, os primos
    // Cabeça e Breno, Ana Lívia e a galera dançando (alguns lá em cima no mezanino)
    const FESTA_CAST = [
      { look: "lucas", who: "lucas", x: 0, z: 12.55, y: 0.4, yaw: Math.PI / 2, idle: "dj" },
      { look: "julie", who: "julie", x: 3.25, z: 8.25, yaw: Math.PI * 0.62 },
      { look: "kf", who: "kf", x: 3.0, z: 9.2, yaw: -Math.PI * 0.4 },
      { look: "kaua", who: "kaua", x: -4.95, z: 8.9, yaw: Math.PI, idle: "shy" },
      { look: "mila", who: "mila", x: -1.9, z: 9.75, yaw: Math.PI * 0.55, dance: 3 },
      { look: "gabi", who: "gabi", x: 2.2, z: 3.0, yaw: 0.1 },
      { look: "diogo", who: "diogo", x: 3.4, z: 3.65, yaw: Math.PI * 0.85 },
      { look: "kauane", who: "kauane", x: -2.2, z: 3.05, yaw: Math.PI },
      { look: "cabeca", who: "cabeca", x: -3.45, z: 3.7, yaw: -0.5 },
      { look: "breno", who: "breno", x: -3.55, z: 2.4, yaw: 0.5 },
      { look: "analivia", who: "analivia", x: -2.45, z: 2.3, yaw: 2.6 },
      { look: "fx0", who: "fx", x: -2.2, z: 5.9, yaw: 0.4, dance: 0 },
      { look: "fx1", who: "fx", x: -0.6, z: 5.6, yaw: -1.2, dance: 1 },
      { look: "fx2", who: "fx", x: 1.0, z: 6.1, yaw: 2.2, dance: 3 },
      { look: "fx3", who: "fx", x: 2.3, z: 5.7, yaw: 1.4, dance: 2 },
      { look: "fx4", who: "fx", x: -1.4, z: 7.3, yaw: -0.6, dance: 5 },
      { look: "fx5", who: "fx", x: 1.6, z: 7.6, yaw: 2.8, dance: 6 },
      { look: "fx6", who: "fx", x: -0.2, z: 7.1, yaw: 0.9, dance: 4 },
      { look: "fx7", who: "fx", x: 0.3, z: 8.9, yaw: -2.0, dance: 0 },
      { look: "fx8", who: "fx", x: 2.2, z: 6.6, yaw: 2.1, dance: 3 },
      { look: "fx9", who: "fx", x: 0.9, z: 10.0, yaw: 1.6, dance: 1 },
      { look: "fx10", who: "fx", x: -4.7, z: 9.0, y: 3.2, yaw: 0, idle: "rail" },
      { look: "fx11", who: "fx", x: 1.2, z: 13.85, y: 3.2, yaw: Math.PI / 2, idle: "rail" },
    ];
    Object.assign(WHO, { lucas: "DJ Luskinha", mila: "Mila", diogo: "Diogo", cabeca: "Cabeça", breno: "Breno", analivia: "Ana Lívia", kaua: "Kauã", gabi: "Gabi", kauane: "Kauane", fx: "" });
    const FLINES = {
      lucas: ["Fala, parceiro! Tá curtindo o set?", "Hoje eu trouxe só pedrada dos anos 90. Segura essa!", "Quer outra? Aperta N que eu solto a próxima.", "Daqui a pouco tem surpresa... fica ligado."],
      julie: ["Esse DJ é muito bom, né?", "Você dança, garoto tubarão? Hehe.", "Que bom que você veio."],
      kf: ["Olha a pista, mano! Tá lotada.", "O Lucas é brabo demais, falei pra você.", "Bora dançar, sem vergonha!"],
      kaua: ["Essa coxinha tá muito boa...", "Tá cheio, né? Nunca vi tanta gente junta.", "Eu tô de boa aqui, sério."],
      mila: ["Essa música é muito boa!", "Gostei do seu estilo.", "O Lucas manda bem demais."],
      diogo: ["Fala aí! Curtindo a festa?", "Esse som tá demais, mas falta um reggaezinho, hein.", "Já pegou água de coco? Tá geladinha."],
      cabeca: ["E aí, firmeza?", "Essa festa tá pegando fogo!", "Ó o meu tênis novo, nem pisa."],
      breno: ["Fala, tudo certo?", "Ambiente maneiro, né?", "O Kiko do bar faz um coquetel de frutas brabo."],
      analivia: ["Ai, amei a decoração!", "Você viu a Kauane? Ela tá linda hoje.", "Esse colar de flor combina com tudo, né?"],
      gabi: ["Que festa massa!", "Já foi no bar? Tem água de coco.", "Olha a decoração... parece praia."],
      kauane: ["Hmpf. Até que tá legal.", "Se alguém pisar no meu tênis, briga.", "O Lucas manda bem, vai."],
      fx: ["Essa música é muito boa!", "Já pegou um colar de flor? Deram na porta!", "O DJ tá on fire hoje!", "Bora pra pista!", "Aloha! Hahaha."],
    };
    // passinhos (no tempo da música, ~125 bpm): 0 dois-pra-lá, 1 sobe-e-desce com a mão pra cima, 2 corridinha,
    // 3 balanço de quadril com mão no cabelo, 4 dedo pro alto (discoteca), 5 robô, 6 pulinho eurodance, 7 só balança a cabeça
    function DANCE(k, t, ph) {
      const b = (t + ph * 0.13) * Math.PI * 2 * 2.08, s = Math.sin(b), c = Math.cos(b), h = Math.sin(b / 2), up = Math.abs(s);
      switch (k % 8) {
        case 0: return POSE({ py: 0.92 + up * 0.03, twist: h * 0.25, hy: h * 0.2, hp: 0.04, fzF: 0.12 + Math.max(0, h) * 0.12, fzB: -0.12 + Math.min(0, h) * 0.12, hF: [0.25, 1.05 + up * 0.08, 0.22], hB: [0.25, 1.05 + up * 0.08, -0.22], lf: Math.max(0, s) * 0.05, lb: Math.max(0, -s) * 0.05 });
        case 1: return POSE({ py: 0.9 + up * 0.05, lean: -0.04, hp: -0.12, twist: h * 0.12, hF: [0.12, 1.75 + up * 0.15, 0.22], hB: [0.12, 1.75 + up * 0.15, -0.22] });
        case 2: return POSE({ py: 0.92 + up * 0.03, lean: 0.12, fxF: s * 0.18, fxB: -s * 0.18, lf: Math.max(0, c) * 0.12, lb: Math.max(0, -c) * 0.12, hF: [-s * 0.2 + 0.1, 1.1, 0.25], hB: [s * 0.2 + 0.1, 1.1, -0.25] });
        case 3: return POSE({ py: 0.92 + up * 0.02, twist: h * 0.35, roll: h * 0.08, hy: -h * 0.3, hp: 0.0, hF: [0.05, 1.72, 0.12], hB: [0.05, 1.0 + up * 0.1, -0.28] });
        case 4: { const hi = h > -0.2; return POSE({ py: 0.92 + up * 0.035, lean: 0.06, twist: h * 0.28, hy: h * 0.35, hp: -0.04, hF: hi ? [0.2, 1.78, 0.34] : [0.06, 0.98, 0.3], hB: [0.04, 0.98, -0.3], lf: Math.max(0, s) * 0.05, lb: Math.max(0, -s) * 0.05 }); }
        case 5: { const st = Math.round(h * 2) / 2; return POSE({ py: 0.93, lean: 0.02, twist: st * 0.3, hy: -st * 0.4, hp: 0.05, hF: [0.32, 1.25 + st * 0.15, 0.3], hB: [0.32, 1.25 - st * 0.15, -0.3] }); }
        case 6: { const j = Math.max(0, s); return POSE({ py: 0.9 + j * 0.12, lean: -0.02, hp: -0.15, hF: [0.1, 1.85, 0.3], hB: [0.1, 1.85, -0.3], lf: j * 0.12, lb: j * 0.12 }); }
        default: return POSE({ py: 0.94, lean: 0.04, hp: 0.06 + up * 0.08, hy: h * 0.1, hF: [0.28, 1.2, 0.2], hB: [0.02, 0.95, -0.27] });
      }
    }
    const SLOW_A = (t, gap) => POSE({ py: 0.94, lean: 0.05, twist: Math.sin(t * 1.3) * 0.08, hp: 0.12, hF: [0.25 + gap * 0.2, 1.08, 0.17], hB: [0.25 + gap * 0.2, 1.08, -0.17], fzF: 0.1, fzB: -0.1, fxF: Math.sin(t * 1.3) * 0.05, fxB: -Math.sin(t * 1.3) * 0.05 });
    const SLOW_B = (t, gap) => POSE({ py: 0.94, lean: 0.05, twist: -Math.sin(t * 1.3) * 0.08, hp: -0.06, hF: [0.24 + gap * 0.2, 1.45, 0.17], hB: [0.24 + gap * 0.2, 1.45, -0.17], fzF: 0.1, fzB: -0.1, fxF: -Math.sin(t * 1.3) * 0.05, fxB: Math.sin(t * 1.3) * 0.05 });
    const GIGGLE = (t) => POSE({ lean: 0.08 + Math.abs(Math.sin(t * 9)) * 0.03, twist: 0.15, hp: 0.14, hy: 0.25, hF: [0.2, 1.52, 0.05], hB: [0.18, 1.47, -0.07] });
    const SHY = (t) => POSE({ lean: 0.14, twist: 0.3, hy: -0.4, hp: 0.25, hF: [0.24, 1.66, 0.02], hB: [0.02, 0.98, -0.32] });
    const yawTo = (x, z, tx, tz) => Math.atan2(-(tz - z), tx - x);
    let FS = null;
    const pkey = () => (lookKey() || "kf").replace(/_.*/, "");
    function festaEnter(R) {
      const pk = pkey();
      FS = { pk, t: 0, main: 0, step: 0, slow: 0, slowAt: 0, slowK: 0, cup: null, wait: 0, call: 0 };
      for (const n of R.npcR) {
        if (!n.home) n.home = { x: n.x, z: n.z, yaw: n.yaw, dance: n.dance, idle: n.idle };
        Object.assign(n, n.home); n.ov = null; n.hide = n.who === pk; n.off = n.hide;
      }
      IN.disco = { on: true }; IN.ov = null; IN.cut = null; IN.cutCam = null; IN.dancing = null; IN.cup = null; IN.snack = 0;
      ui.festa && ui.festa("on", { i: 0 });
      const hint = { kf: "A Julie tá perto do bar... vai lá dar um oi.", kaua: "Que tanto de gente... a mesa de salgadinho parece um bom esconderijo.", gabi: "Aquele cara de camiseta de reggae tá olhando sua pulseira...", kauane: "Ih... o Cabeça e o Breno tão ali na mesinha da esquerda.", julie: "O K.F. tá ali perto do bar." }[pk] || "Bora curtir a festa!";
      IN.sayQ = [{ t: 1.2, who: "", line: hint }];
    }
    const fNpc = (who) => IN.R.npcR.find((n) => n.who === who || n.look === who);
    // posiciona alguém (NPC ou você, se for o seu personagem) numa cena: x, z, yaw e a pose da hora
    function place2(who, x, z, yaw, pose) {
      if (who === FS.pk) { IN.ov = { x, z, yaw, pose }; IN.x = x; IN.z = z; IN.yaw = yaw; return; }
      const n = fNpc(who); if (n) n.ov = { x, z, yaw, pose };
    }
    function setHome(who, x, z, yaw, extra) {
      if (who === FS.pk) { IN.x = x; IN.z = z; IN.yaw = yaw; return; }
      const n = fNpc(who); if (!n) return;
      Object.assign(n, { x, z, yaw, dance: null, idle: null }, extra || {});
    }
    function cutStart(shots, done) { IN.cut = { shots, t: 0, i: -1, done }; IN.dancing = null; IN.talk = null; ui.cut && ui.cut("start"); ui.inside && ui.inside("spot", null); }
    function cutEnd() {
      const C = IN.cut; if (!C) return;
      IN.cut = null; IN.cutCam = null; IN.ov = null; IN.cam.fov = 1.08;
      for (const n of IN.R.npcR) n.ov = null;
      ui.cut && ui.cut("end");
      C.done && C.done();
    }
    function cutTick(dt) {
      const C = IN.cut; C.t += dt;
      let acc = 0, i = 0;
      while (i < C.shots.length && C.t > acc + C.shots[i].dur) { acc += C.shots[i].dur; i++; }
      if (i >= C.shots.length) return cutEnd();
      const sh = C.shots[i], lt = C.t - acc, u = lt / sh.dur;
      if (i !== C.i) { C.i = i; ui.cut && ui.cut("line", { who: sh.who ? WHO[sh.who] || sh.who : "", text: sh.text || "" }); if (sh.on) sh.on(); }
      const cm = sh.cam(u); IN.cutCam = cm;
      if (C.act) C.act(C.t, u, i);
    }
    // ---- cena: o Kauã esbarra na Mila ----
    function cutBump() {
      const KX0 = -4.6, KZ0 = 8.95, KX = -2.45, KZ = 9.6, MXp = -1.9, MZp = 9.75;
      const shots = [
        { dur: 2.6, who: "kaua", text: "Licença... licença...", cam: (u) => ({ eye: [-3.3 + u * 0.6, 1.75, 7.0], at: [-3.4 + u * 1.0, 1.15, 9.3] }) },
        { dur: 1.5, who: "", text: "", on: () => { sfx.nocan && sfx.nocan(); }, cam: () => ({ eye: [-2.15, 1.45, 8.1], at: [-2.15, 1.05, 9.7] }) },
        { dur: 3.2, who: "kaua", text: "Foi mal! Foi mal mesmo, eu não vi...", cam: () => ({ eye: [-2.2, 1.62, 8.0], at: [-2.17, 1.42, 9.68] }) },
        { dur: 3.2, who: "mila", text: "Relaxa, não foi nada. Era só refri.", cam: () => ({ eye: [-3.05, 1.78, 8.75], at: [-1.9, 1.5, 9.75] }) },
        { dur: 4.2, who: "mila", text: "Gostei do cabelo. Espetado assim... tem personalidade.", cam: (u) => ({ eye: [-3.05 + u * 0.12, 1.78, 8.75], at: [-1.9, 1.5, 9.75] }) },
        { dur: 2.8, who: "kaua", text: "Ah... v-valeu.", cam: () => ({ eye: [-1.15, 1.72, 9.2], at: [-2.45, 1.52, 9.6] }) },
        { dur: 3.0, who: "mila", text: "Eu sou a Mila. E você?", cam: () => ({ eye: [-3.05, 1.78, 8.75], at: [-1.9, 1.5, 9.75] }) },
        { dur: 2.4, who: "kaua", text: "Kauã. Prazer.", cam: () => ({ eye: [-1.15, 1.72, 9.2], at: [-2.45, 1.52, 9.6] }) },
        { dur: 3.8, who: "kf", text: "Cara... quem te viu, quem te vê, hein, amigão! Hehehe.", cam: () => ({ eye: [1.9, 1.75, 10.1], at: [3.05, 1.5, 8.8] }) },
        { dur: 2.6, who: "julie", text: "Hihi...", cam: () => ({ eye: [2.2, 1.7, 9.9], at: [3.25, 1.5, 8.25] }) },
      ];
      cutStart(shots, () => {
        setHome("kaua", KX, KZ, yawTo(KX, KZ, MXp, MZp), { idle: "talk2" });
        setHome("mila", MXp, MZp, yawTo(MXp, MZp, KX, KZ), { idle: "talk2" });
        FS.main = 1; FS.slowAt = FS.t + 8;
      });
      IN.cut.act = (T, u, i) => {
        const tk = Math.min(1, T / 2.6), kx = KX0 + (KX - KX0) * tk, kz = KZ0 + (KZ - KZ0) * tk;
        const walkP = (ph) => POSE({ lean: 0.08, twist: Math.sin(ph) * 0.07, fxF: Math.sin(ph) * 0.2, fxB: -Math.sin(ph) * 0.2, lf: Math.max(0, Math.cos(ph)) * 0.07, lb: Math.max(0, -Math.cos(ph)) * 0.07, hF: [0.1, 0.95, 0.27], hB: [-0.1, 0.95, -0.27] });
        const kp = i === 0 ? walkP(T * 9) : i === 1 ? POSE({ lean: -0.12, hp: -0.1, hF: [0.3, 1.3, 0.25], hB: [0.3, 1.3, -0.25] }) : i === 5 || i === 7 ? SHY(T) : POSE({ lean: 0.06, hp: 0.1, twist: 0.1, hF: [0.3, 1.15, 0.2], hB: [0.02, 0.95, -0.27] });
        place2("kaua", kx, kz, yawTo(KX0, KZ0, KX, KZ), kp);
        const turned = i >= 1, my = turned ? yawTo(MXp, MZp, KX, KZ) : Math.PI * 0.55;
        const mp = i === 0 ? DANCE(3, T, 0) : i === 1 ? POSE({ lean: -0.08, hp: -0.15, hF: [0.25, 1.25, 0.25], hB: [0.1, 0.95, -0.3] }) : POSE({ lean: 0.03, twist: 0.12, hp: 0.04, hy: 0.15, hF: [0.12, 1.0, 0.28], hB: [0.05, 1.68, -0.12] });
        place2("mila", MXp, MZp, my, mp);
        // copo da Mila caindo
        FS.cup = i === 0 ? { x: MXp + 0.15, y: 1.25, z: MZp - 0.2 } : i === 1 ? { x: MXp - 0.15 - u * 0.2, y: Math.max(0.03, 1.2 - u * u * 3), z: MZp - 0.3, r: u * 3 } : { x: MXp - 0.35, y: 0.03, z: MZp - 0.3, r: 1.57 };
        place2("kf", 3.0, 9.2, yawTo(3.0, 9.2, KX, KZ), i === 8 ? POSE({ twist: 0.15, hp: 0.0, hF: [0.25, 1.2 + Math.sin(T * 6) * 0.05, 0.25], hB: [0.02, 0.95, -0.27] }) : POSE({ hp: 0.05, hF: [0.03, 0.95, 0.27], hB: [0.02, 0.95, -0.27] }));
        place2("julie", 3.25, 8.25, yawTo(3.25, 8.25, KX, KZ), i === 9 ? GIGGLE(T) : POSE({ hp: 0.05, hF: [0.03, 0.95, 0.27], hB: [0.02, 0.95, -0.27] }));
      };
    }
    // ---- cena: a música lenta (o DJ chama os casais; K.F. e Julie, Kauã e Mila; o primeiro beijo do K.F. e da Julie) ----
    const SLOW_PAIRS = [["fx0", "fx2", 2.4, 9.5, 0.4], ["fx3", "fx4", -2.9, 6.0, -0.3], ["fx5", "fx7", 2.6, 5.9, 2.4], ["fx1", "fx8", -3.3, 10.4, 1.2]], SLOW_SOLO = [["fx6", -3.5, 9.9], ["fx9", 3.5, 7.4]];
    function cutSlow() {
      FS.slow = 1;
      ui.festa && ui.festa("slow");
      const KJ = [0.5, 7.4], KM = [-1.6, 8.75];
      const shots = [
        { dur: 3.8, who: "lucas", text: "Agora a gente vai diminuir o ritmo um pouquinho...", cam: (u) => ({ eye: [0.3 - u * 0.4, 2.0, 9.5], at: [0, 1.75, 12.5] }) },
        { dur: 3.4, who: "lucas", text: "Chama o seu par e vem pra pista!", cam: () => ({ eye: [-0.2, 1.95, 10.1], at: [0, 1.8, 12.5] }) },
        { dur: 4.2, who: "", text: "♪", cam: (u) => ({ eye: [-4.1 + u * 0.6, 5.2, 13.0], at: [0, 0.8, 7.8] }) },
        { dur: 4.4, who: "julie", text: "Sabe que eu nunca dancei música lenta com ninguém?", cam: () => ({ eye: [KJ[0] - 0.95, 1.78, KJ[1] - 0.7], at: [KJ[0] + 0.24, 1.48, KJ[1]] }) },
        { dur: 4.0, who: "kf", text: "Nem eu. Mas acho que a gente tá indo bem.", cam: () => ({ eye: [KJ[0] + 0.95, 1.72, KJ[1] - 0.7], at: [KJ[0] - 0.24, 1.6, KJ[1]] }) },
        { dur: 3.6, who: "mila", text: "Relaxa... é só ir no balanço.", cam: () => ({ eye: [KM[0] - 0.95, 1.72, KM[1] - 0.7], at: [KM[0] + 0.24, 1.48, KM[1]] }) },
        { dur: 3.2, who: "kaua", text: "Tô tentando! Acho que tô pegando o jeito.", cam: () => ({ eye: [KM[0] + 0.95, 1.68, KM[1] - 0.7], at: [KM[0] - 0.24, 1.55, KM[1]] }) },
        { dur: 5.6, who: "", text: "", cam: (u) => ({ eye: [KJ[0] + 0.05, 1.85 - u * 0.1, KJ[1] - 1.05 + u * 0.12], at: [KJ[0], 1.6, KJ[1]], fov: 0.85 }) },
        { dur: 4.4, who: "", text: "♪ ♪ ♪", cam: (u) => ({ eye: [3.6 - u * 0.8, 4.4, 3.2], at: [0, 2.6, 8.0] }) },
      ];
      cutStart(shots, () => {
        FS.slowDone = 1; FS.slowEnd = FS.t + 150;
        SLOW_PAIRS.forEach(([a, b2, x, z, r]) => { setHome(a, x - Math.cos(r) * 0.24, z + Math.sin(r) * 0.24, r, { idle: "slowA" }); setHome(b2, x + Math.cos(r) * 0.24, z - Math.sin(r) * 0.24, r + Math.PI, { idle: "slowB" }); });
        for (const [lk, x, z] of SLOW_SOLO) setHome(lk, x, z, yawTo(x, z, KJ[0], KJ[1]), { idle: "talk2" });
        setHome("kf", KJ[0] - 0.24, KJ[1], 0, { idle: "slowA", pair: 1 }); setHome("julie", KJ[0] + 0.24, KJ[1], Math.PI, { idle: "slowB", pair: 1 });
        setHome("kaua", KM[0] - 0.24, KM[1], 0, { idle: "slowA" }); setHome("mila", KM[0] + 0.24, KM[1], Math.PI, { idle: "slowB" });
        if (FS.pk === "kf" || FS.pk === "julie" || FS.pk === "kaua") IN.ov = null;
      });
      IN.cut.act = (T, u, i) => {
        // gap: distância entre os dois; no beijo eles chegam pertinho e inclinam a cabeça
        const kiss = i === 7 ? Math.min(1, Math.max(0, (u - 0.15) / 0.45)) : i === 8 ? 1 : 0, ke = kiss * kiss * (3 - 2 * kiss), g = 0.24 - ke * 0.05;
        const A = SLOW_A(T, 0), B = SLOW_B(T, 0);
        if (ke > 0) { A.hp = 0.12 + ke * 0.16; A.lean = 0.05 + ke * 0.08; A.hy = -ke * 0.12; B.hp = -0.06 - ke * 0.18; B.lean = 0.05 + ke * 0.06; B.hy = ke * 0.12; A.twist = B.twist = 0; }
        place2("kf", KJ[0] - g, KJ[1], 0, A); place2("julie", KJ[0] + g, KJ[1], Math.PI, B);
        place2("kaua", KM[0] - 0.24, KM[1], 0, SLOW_A(T + 0.7, 0)); place2("mila", KM[0] + 0.24, KM[1], Math.PI, SLOW_B(T + 0.7, 0));
        SLOW_PAIRS.forEach(([a, b2, x, z, r], k) => { place2(a, x - Math.cos(r) * 0.24, z + Math.sin(r) * 0.24, r, SLOW_A(T + k, 0)); place2(b2, x + Math.cos(r) * 0.24, z - Math.sin(r) * 0.24, r + Math.PI, SLOW_B(T + k, 0)); });
        for (const [lk, x, z] of SLOW_SOLO) place2(lk, x, z, yawTo(x, z, KJ[0], KJ[1]), POSE({ hp: 0.05, twist: Math.sin(T * 0.8) * 0.06, hF: [0.25, 1.1, 0.2], hB: [0.02, 0.95, -0.27] }));
        if (i === 0 || i === 1) { const n = fNpc("lucas"); if (n) n.ov = { x: n.x, z: n.z, yaw: n.yaw, pose: POSE({ lean: 0.02, hp: -0.02, twist: 0.1, hF: [0.32, 1.62, 0.06], hB: [0.42, 1.3, -0.25] }) }; }
        // quem não tem par na hora assiste do canto
        if (FS.pk === "gabi") place2("gabi", 2.5, 4.4, yawTo(2.5, 4.4, KJ[0], KJ[1]), POSE({ hp: 0.05, hy: Math.sin(T * 0.5) * 0.2, hF: [0.2, 1.1, 0.2], hB: [0.02, 0.95, -0.27] }));
        if (FS.pk === "kauane") place2("kauane", -2.6, 4.2, yawTo(-2.6, 4.2, KJ[0], KJ[1]), POSE({ hp: 0.05, hF: [0.25, 1.05, 0.12], hB: [0.25, 1.05, -0.12] }));
      };
    }
    function festaTalk(who) {
      const pk = FS.pk, L = FLINES[who] || FLINES.fx;
      const Q = (arr) => { IN.sayQ = arr.map(([w, line], k) => ({ t: k ? 2.9 : 0.05, who: w, line })); };
      const busy = IN.sayQ && IN.sayQ.length;
      if (busy) return true;
      if ((pk === "kf" && who === "julie") || (pk === "julie" && who === "kf")) {
        if (!FS.greet) {
          FS.greet = 1;
          Q([["julie", "Oi, garoto tubarão!"], ["gabi", "...garoto tubarão?"], ["kauane", "Oxe. Que apelido é esse?"], ["kf", "E aí, Julie! Nem sabia que você vinha."], ["julie", "O Lucas é meu vizinho. Não ia perder o set dele por nada."], ["kf", "O cara tá brabo hoje, né?"], ["julie", "Tá demais! Fica aqui com a gente... quer dizer, comigo. Hehe."], ["julie", "Ei... o Kauã tá sozinho lá no salgadinho. Chama ele pra cá!"]]);
          return true;
        }
      }
      if ((pk === "kf" || pk === "julie") && who === "kaua" && FS.greet && !FS.main) {
        Q([[pk === "julie" ? "julie" : "kf", pk === "julie" ? "Kauã! Vem ficar com a gente lá no bar!" : "Ô Kauã, cola aqui com a gente!"], ["kaua", "Já vou, já vou..."]]);
        IN.sayQ.push({ t: 1.6, who: "", line: "", fn: () => cutBump() });
        return true;
      }
      if (pk === "kaua" && who === "mila" && FS.main && !FS.milaTalk) {
        FS.milaTalk = 1;
        Q([["mila", "Então, Kauã... você anda de skate também?"], ["kaua", "Ando. Comecei faz pouco tempo, mas tô pegando o jeito."], ["mila", "Eu ando na pista do centro. Um dia a gente racha uma sessão."], ["kaua", "S-sério? Fechou!"]]);
        return true;
      }
      if (pk === "gabi" && who === "diogo" && !FS.main) {
        Q([["diogo", "Opa! Pulseira da hora essa. Curte reggae?"], ["gabi", "Demais. Lá em casa só toca Cidade Negra e Natiruts."], ["diogo", "Sério? Eu toco numa banda com uns amigos. Uns covers e umas nossas."], ["gabi", "Mentira! Qual o nome?"], ["diogo", "Raízes. Tá até na camiseta, ó. Hahaha."], ["gabi", "Hahaha, propaganda gratuita. Gostei."], ["diogo", "Sábado tem ensaio na garagem do meu primo. Cola lá com a galera!"], ["gabi", "Fechou! Valeu, Diogo."]]);
        IN.sayQ.push({ t: 2.9, who: "", line: "", fn: () => { FS.main = 1; FS.slowAt = FS.t + 6; } });
        return true;
      }
      if (pk === "kauane" && (who === "cabeca" || who === "breno") && !FS.main) {
        Q([["cabeca", "Olha só quem chegou... a rainha da ladeira."], ["kauane", "Vai começar, Cabeça?"], ["cabeca", "Calma, calma! Na real... foi mal por aquele dia. A gente foi muito mal perdedor."], ["breno", "Foi feio mesmo. Você desceu aquela ladeira voando."], ["kauane", "...Tá. Desculpa também por ter chamado vocês de criança. Mas que pareceram, pareceram."], ["cabeca", "Hahaha! Justo. Ó, fiquei sabendo que você tá treinando uma manobra nova."], ["kauane", "Tô. Mas é segredo. Quando sair, vocês vão ver."], ["breno", "Então já é. Quando for lançar, chama a gente."], ["analivia", "Viu? Eu falei que ela não era brava, só marrenta! Hihi."], ["kauane", "Ana Lívia!"]]);
        IN.sayQ.push({ t: 2.9, who: "", line: "", fn: () => { FS.main = 1; FS.slowAt = FS.t + 6; } });
        return true;
      }
      sayIn(who, L[IN.li++ % L.length], 3.5);
      return true;
    }
    // falar com quem está perto: os pontos de conversa acompanham as pessoas
    function festaSpots(R) {
      R.spots = R.spots.filter((s) => !s.npc);
      for (const n of R.npcR) {
        if (n.hide || (n.y || 0) > 1 || n.who === "lucas") continue;
        const nm = n.who === "fx" ? ART.LOOKS[n.look].name : WHO[n.who];
        R.spots.push({ id: "t_" + n.look, npc: 1, x: n.x - Math.cos(n.yaw) * -0.0, z: n.z, r: 0.95, act: "ftalk", who: n.who, look: n.look, label: "Falar com " + nm, face: [n.x, n.z] });
      }
    }
    const cupG = Rn.upload((() => { const m = new Mesh(); m.tube([0, -0.06, 0], [0, 0.06, 0], 0.035, 0.042, 8, hex(0xe0302b)); m.tube([0, 0.06, 0], [0, 0.065, 0], 0.042, 0.042, 8, hex(0xffffff)); m.tube([0.01, 0.06, 0], [0.03, 0.15, 0], 0.005, 0.005, 3, hex(0xff4fa3)); return m; })());
    const coxG = Rn.upload((() => { const m = new Mesh(); m.ball([0, 0.02, 0], 0.04, hex(0xd88a3a), 0, 7, 5, { sy: 1.25 }); return m; })());
    function festaFrame(R, D, dt, t) {
      if (!FS) return;
      FS.t += dt;
      // piso de luz: acende no tempo da música, em ondas coloridas; na música lenta fica roxinho e calmo
      FS.slowK = Math.max(0, Math.min(1, FS.slowK + ((FS.slow && (IN.cut || FS.slowDone) && FS.t - (FS.slowStart || 0) < 140) ? dt / 2 : -dt / 3)));
      const beat = FS.t * 2.08, PAL = [[1, 0.3, 0.65], [0.3, 0.8, 1], [1, 0.85, 0.25], [0.55, 0.35, 1], [0.35, 1, 0.55]];
      for (const o of D.floor) {
        const w = (o.i + o.j + Math.floor(beat)) % 5, on = ((o.i * 3 + o.j * 5 + Math.floor(beat)) % 4) !== 0, c = PAL[w], lv = on ? 1 : 0.25, sk = FS.slowK;
        o.tint = [(c[0] * lv) * (1 - sk) + 0.45 * sk, (c[1] * lv) * (1 - sk) + 0.25 * sk, (c[2] * lv) * (1 - sk) + 0.75 * sk];
      }
      discoFx(R, D, dt, t);
      if (FS.slowK > 0 && R.scene.amb) R.scene.amb = R.scene.amb.map((v) => v * (1 - FS.slowK * 0.35));
      // copo que cai na cena do esbarrão
      if (!D.cup) D.cup = { g: cupG, mo: M.I(), hidden: true };
      D.cup.hidden = !(IN.cut && FS.cup);
      if (!D.cup.hidden) D.cup.mo = M.mul(M.T(FS.cup.x, FS.cup.y, FS.cup.z), M.RZ(FS.cup.r || 0));
      // na mão: refri do bar ou coxinha (comendo)
      if (!D.hand) D.hand = { g: cupG, mo: M.I(), hidden: true };
      const h = !IN.cut && (IN.cup || IN.snack > 0) && rig.F ? handOf(rig, look, "F") : null;
      D.hand.hidden = !h;
      if (h) { D.hand.g = IN.snack > 0 ? coxG : cupG; D.hand.mo = M.T(h[0], h[1] + 0.04, h[2]); }
      if (IN.snack > 0) IN.snack -= dt;
      if (IN.cut) { cutTick(dt); return; }
      festaSpots(R);
      // Kauã (jogando com ele): depois de um tempo no salgadinho, o K.F. chama; indo até eles, esbarra na Mila
      if (FS.pk === "kaua" && !FS.main) {
        if (!FS.call && ((FS.ate && FS.t > FS.ate + 3.5) || FS.t > 25)) { FS.call = 1; IN.sayQ = [{ t: 0.4, who: "kf", line: "Ô Kauã! Larga essa coxinha e cola aqui com a gente!" }, { t: 3.2, who: "julie", line: "Vem, Kauã! A gente tá aqui perto do bar." }]; }
        if (FS.call && IN.x > -3.6 && !(IN.sayQ && IN.sayQ.length)) cutBump();
      }
      if (FS.main && !FS.slow && FS.t > FS.slowAt && !(IN.sayQ && IN.sayQ.length)) { FS.slowStart = FS.t; cutSlow(); }
      if (FS.slowEnd && FS.t > FS.slowEnd) {
        FS.slowEnd = 0;
        for (const n of R.npcR) if (n.who === "fx") Object.assign(n, { x: n.home.x, z: n.home.z, yaw: n.home.yaw, dance: n.home.dance, idle: n.home.idle });
        for (const w of ["kf", "julie", "kaua", "mila"]) { const n = fNpc(w); if (n && n.idle && /^slow/.test(n.idle)) n.idle = "talk2"; }
      }
    }
    function festaAct(s) {
      if (s.act === "ftalk") { IN.dancing = null; return festaTalk(s.who); }
      if (s.act === "talk" && s.who === "lucas") return festaTalk("lucas");
      if (s.act === "snack") { IN.snack = 2.2; IN.cup = null; FS.ate = FS.ate || FS.t; sayIn(FS.pk, ["Hmm, coxinha quentinha.", "Mais uma não faz mal...", "Esse pastelzinho tá bom demais."][IN.li++ % 3], 2.2); return true; }
      if (s.act === "drink") { IN.cup = true; IN.snack = 0; sayIn("", "Kiko do bar: Refri geladinho saindo! Por conta da casa hoje.", 2.6); return true; }
      if (s.act === "dance") { IN.dancing = IN.dancing ? null : { s: (IN.li++ % 7) }; IN.cup = null; return true; }
      return false;
    }
    function inFrame(dt, t) {
      const R = IN.R;
      IN.t += dt;
      const walk = S.running && !IN.hold && !IN.sit && IN.change == null && !IN.lounge && !IN.cut;
      if (IN.dancing && (keys.up || keys.down)) IN.dancing = null;
      let mv = 0;
      if (walk) {
        const turn = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
        if (turn) IN.yawT = null;
        IN.yaw += turn * dt * 2.7;
        mv = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
      }
      if (IN.yawT != null) {
        let d = IN.yawT - IN.yaw;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        IN.yaw += d * Math.min(1, dt * 8);
        if (Math.abs(d) < 0.01) IN.yawT = null;
      }
      const want = mv > 0 ? 1.9 : mv < 0 ? -1.0 : 0;
      IN.v += (want - IN.v) * Math.min(1, dt * 10);
      const fx = Math.cos(IN.yaw), fz = -Math.sin(IN.yaw);
      if (Math.abs(IN.v) > 0.01 && !IN.sit) {
        const nx = IN.x + fx * IN.v * dt, nz = IN.z + fz * IN.v * dt;
        if (!blockedIn(nx, IN.z)) IN.x = nx;
        if (!blockedIn(IN.x, nz)) IN.z = nz;
      }
      IN.ph += Math.abs(IN.v) * dt * 5.4;
      // ponto de interação mais perto
      if (!IN.hold && !IN.sit) {
        let sp = null, bd = 9;
        for (const s of R.spots) { const d = Math.hypot(IN.x - s.x, IN.z - s.z); if (d < s.r && d < bd) { sp = s; bd = d; } }
        if (IN.phones && !(sp && sp.deck === IN.phoneDeck)) { IN.phones = false; ui.inside && ui.inside("say", { who: "", line: "Fone de volta no gancho", mini: 1 }); }
        const lb = sp ? spotLabel(sp) : null;
        if (sp !== IN.spot || lb !== IN.lb) { IN.spot = sp; IN.lb = lb; ui.inside && ui.inside("spot", sp ? { label: lb, act: sp.act } : null); }
      }
      // sentando no PC / fliperama
      let yaw = IN.yaw, px = IN.x, pz = IN.z, tp;
      if (IN.sit) {
        const Z = IN.sit;
        Z.t += dt;
        const k = Math.min(1, Z.t / 0.6), e = k * k * (3 - 2 * k);
        px = Z.from[0] + (Z.at[0] - Z.from[0]) * e; pz = Z.from[1] + (Z.at[1] - Z.from[1]) * e;
        let d = Z.yaw - Z.from[2];
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        yaw = Z.from[2] + d * e;
        IN.x = px; IN.z = pz; IN.yaw = yaw;
        if (Z.seat) tp = k < 1 ? POSE({ py: 0.94 - 0.26 * e }) : SITP(t, { lean: 0.06, hp: 0.04, hy: Math.sin(t * 0.3) * 0.25, hF: IN.cone || IN.pop ? [0.3, 1.12, 0.16] : [0.36, 0.8, 0.14], hB: [0.36, 0.78, -0.14] });
        else tp = Z.stand ? POSE({ lean: 0.1, hp: -0.05, hF: [0.42, 1.08, 0.12], hB: [0.4, 1.05, -0.14] }) : k < 1 ? POSE({ py: 0.94 - 0.26 * e }) : SITP(t, { hp: 0.1 + Math.sin(t * 7) * 0.02, hF: [0.44, 0.87 + Math.sin(t * 9) * 0.01, 0.13], hB: [0.44, 0.86, -0.15] });
        if (k >= 1 && !Z.opened) { Z.opened = true; ui.inside && ui.inside("open", { act: "pc", game: Z.s.game }); }
      } else if (IN.lounge) {
        // deita na poltrona: vai até ela, vira de costas, senta e reclina
        const Lg = IN.lounge, ch = Lg.c;
        Lg.t += dt;
        const k = Math.min(1, Lg.t / 0.7), e = k * k * (3 - 2 * k);
        px = Lg.from[0] + (ch.x - 0.05 - Lg.from[0]) * e; pz = Lg.from[1] + (ch.z - Lg.from[1]) * e;
        let d = Math.PI - Lg.from[2];
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        yaw = Lg.from[2] + d * e;
        IN.x = px; IN.z = pz; IN.yaw = yaw;
        const br = Math.sin(t * 0.8) * 0.01;
        tp = k < 1 ? POSE({ py: 0.94 - 0.3 * e }) : LOUNGE(t, br);
      } else if (IN.dancing && Math.abs(IN.v) < 0.12) {
        tp = DANCE(IN.dancing.s, t, 0);
      } else if (Math.abs(IN.v) > 0.12) {
        const sw = Math.sin(IN.ph), cw = Math.cos(IN.ph), sg = IN.v < 0 ? -1 : 1;
        tp = POSE({ lean: 0.06, twist: sw * 0.07, fxF: sw * 0.2 * sg, fxB: -sw * 0.2 * sg, lf: Math.max(0, cw) * 0.07, lb: Math.max(0, -cw) * 0.07, hF: [-sw * 0.18 * sg, 0.93, 0.27], hB: [sw * 0.18 * sg, 0.93, -0.27] });
      } else if (IN.hold && IN.spot) {
        const a = IN.spot.act;
        if (a === "dig") tp = IN.spot.fmt === "cd" ? POSE({ lean: 0.02, hp: -0.08, hF: [0.5, 1.36 + Math.sin(t * 2.2) * 0.04, 0.08], hB: [0.08, 0.95, -0.27] }) : POSE({ lean: 0.36, hp: 0.48, hF: [0.46, 1.08, 0.12 + Math.sin(t * 3) * 0.04], hB: [0.44, 1.06, -0.16] });
        else if (a === "vit") tp = POSE({ lean: 0.22, hp: 0.32, hF: [0.48, 1.0, 0.1], hB: [0.06, 0.95, -0.27] });
        else tp = POSE({ lean: 0.08, hp: 0.0, hF: [0.42, 1.25, 0.18], hB: [0.4, 1.22, -0.18] });
      } else if (IN.talk) {
        tp = POSE({ twist: 0.1 + Math.sin(t * 1.3) * 0.05, hy: Math.sin(t * 0.9) * 0.15, hp: 0.04, hF: [0.24 + Math.sin(t * 3.1) * 0.06, 1.16 + Math.sin(t * 2.3) * 0.07, 0.26] });
      } else tp = POSE({ lean: 0.04 + Math.sin(t * 1.1) * 0.015, hy: Math.sin(t * 0.45) * 0.35, hp: 0.1, hF: [0.03, 0.95, 0.27], hB: [0.02, 0.95, -0.27] });
      if (IN.talk) { IN.talk.t -= dt; if (IN.talk.t <= 0) IN.talk = null; }
      // tirando os patins: agacha, mexe no pé e levanta
      if (IN.change != null) {
        IN.change += dt;
        if (IN.change < 1.5) { const k = Math.sin(Math.min(1, IN.change / 1.5) * Math.PI); tp = POSE({ lean: 0.2 + 0.5 * k, hp: 0.3 + 0.4 * k, py: 0.94 - 0.3 * k, stand: k > 0.05 ? 0 : 1, hF: [0.3, 0.94 - 0.55 * k, 0.12], hB: [0.28, 0.94 - 0.5 * k, -0.14 + Math.sin(t * 9) * 0.03], fxF: 0.12 * k }); }
        else IN.change = null;
      }
      // disco (ou CD) na mão: as duas mãos seguram nas bordas, na frente do peito
      if (IN.carry && !IN.sit && !(IN.hold && IN.spot && IN.spot.act === "dig")) { tp.hF = IN.carry.fmt === "cd" ? [0.04, 1.0, 0.3] : [0.04, 0.88, 0.3]; tp.twist = 0; }
      if (IN.anim || IN.needle) { tp = POSE({ lean: 0.2, hp: 0.36, hF: [0.5, 1.0 + Math.sin(t * 2) * 0.02, 0.08], hB: [0.1, 0.95, -0.27] }); if (IN.anim && IN.anim.t < 1.4) { const w = IN.anim.kind === "cd" ? 0.075 : 0.16; tp.hF = [0.5, 1.12, w]; tp.hB = [0.5, 1.1, -w]; } }
      if ((IN.cone || IN.pop || IN.cup) && !IN.sit && !IN.anim && !IN.lounge && !IN.dancing) tp.hF = [0.3, 1.22, 0.2];
      if (IN.snack > 0) tp.hF = IN.snack > 1.1 ? [0.22, 1.55, 0.06] : [0.3, 1.2, 0.2];
      IN.pose = ART.lerpPose(IN.pose, tp, Math.min(1, dt * 10));
      for (const k of ["stand", "walk", "hr", "roll"]) IN.pose[k] = tp[k];
      if (IN.ov) { px = IN.ov.x; pz = IN.ov.z; yaw = IN.ov.yaw; IN.pose = ART.lerpPose(IN.pose, IN.ov.pose, Math.min(1, dt * 12)); }
      const sk = look.skates ? Math.PI / 2 : 0;
      rig.pose(M.mul(M.T(px, look.skates ? 0 : -0.1, pz), M.RY(yaw + sk)), IN.pose);
      rig.board.hidden = true;
      // gente lá dentro
      if (IN.sayQ && IN.sayQ.length) { IN.sayQ[0].t -= dt; if (IN.sayQ[0].t <= 0) { const q = IN.sayQ.shift(); if (q.line) sayIn(q.who, q.line); if (q.fn) q.fn(); if (q.give && SA && SA.def.kind === "ice") { SA.phase = 1; IN.cone = { kf: 1, julie: 1, c: 0xf8f2e6 }; sfx.can(); } } }
      for (const n of R.npcR) {
        n.rig.objs[0].hidden = !!n.hide;
        if (n.hide) continue;
        if (n.julie) { const vis = !!(SA && SA.def.kind === "ice"); n.rig.objs[0].hidden = !vis; n.off = !vis; if (!vis) continue; }
        const near = Math.hypot(IN.x - n.x, IN.z - n.z) < 3.2;
        const talking = IN.talk && IN.talk.who === n.who;
        let p;
        if (n.idle === "play") p = SITP(t, { hp: 0.14, hy: Math.sin(t * 0.7 + n.ph) * 0.12, hF: [0.44, 0.87 + Math.abs(Math.sin(t * 8 + n.ph)) * 0.02, 0.13], hB: [0.44, 0.86, -0.15], lean: 0.18 + Math.sin(t * 0.5 + n.ph) * 0.04 });
        else if (n.idle === "browse") p = POSE({ lean: 0.04, hp: -0.05 + Math.sin(t * 0.6) * 0.05, hy: Math.sin(t * 0.3 + 1) * 0.2, hF: [0.48, 1.3 + Math.sin(t * 1.3 + n.ph) * 0.08, 0.06], hB: [0.04, 0.95, -0.27] });
        else if (talking) p = POSE({ twist: 0.1 + Math.sin(t * 1.3) * 0.06, hp: 0.06 + Math.sin(t * 2.6) * 0.04, hF: [0.26 + Math.sin(t * 3.1) * 0.06, 1.18 + Math.sin(t * 2.3) * 0.08, 0.26] });
        else if (n.idle === "seat") p = SITP(t, { lean: 0.05, hp: 0.05 + Math.sin(t * 0.7 + n.ph) * 0.04, hy: Math.sin(t * 0.4 + n.ph) * 0.2, hF: [0.3, 1.08 + Math.max(0, Math.sin(t * 1.7 + n.ph)) * 0.12, 0.14], hB: [0.36, 0.78, -0.14] });
        else if (n.idle === "bounce") p = POSE({ py: 0.94 + Math.abs(Math.sin(t * 4)) * 0.03, hy: Math.sin(t * 1.3) * 0.4, hp: -0.06, hF: [-0.14, 0.92, 0.15], hB: [-0.14, 0.92, -0.15] });
        else if (n.idle === "dj") { const b = t * Math.PI * 2 * 2.08, ph = Math.floor(t / 4) % 3; p = POSE({ lean: 0.16, hp: 0.22 + Math.abs(Math.sin(b)) * 0.08, twist: Math.sin(b / 2) * 0.08, hF: ph === 2 ? [0.08, 1.62, 0.16] : [0.46, 1.38 + Math.sin(b * 2) * 0.012, 0.3 + Math.sin(b / 2) * 0.04], hB: [0.46, 1.38, -0.32 + (ph === 1 ? Math.sin(b * 2) * 0.05 : 0)] }); }
        else if (n.idle === "rail") p = POSE({ lean: 0.22, hp: 0.32 + Math.sin(t * 0.7 + n.ph) * 0.05, hy: Math.sin(t * 0.4 + n.ph) * 0.3, hF: [0.4, 1.0, 0.2], hB: [0.4, 1.0, -0.2] });
        else if (n.idle === "shy") p = POSE({ lean: 0.1, hp: 0.18, hy: Math.sin(t * 0.5) * 0.2, hF: [0.42, 1.0 + Math.max(0, Math.sin(t * 0.9 + n.ph)) * 0.45, 0.12], hB: [0.02, 0.95, -0.27] });
        else if (n.idle === "talk2") p = POSE({ twist: 0.08 + Math.sin(t * 1.1 + n.ph) * 0.06, hp: 0.06, hy: Math.sin(t * 0.7 + n.ph) * 0.12, hF: [0.22 + Math.sin(t * 2.7 + n.ph) * 0.05, 1.12 + Math.sin(t * 2.1) * 0.06, 0.24], hB: [0.02, 0.95, -0.27] });
        else if (n.idle === "slowA") p = SLOW_A(t, 0);
        else if (n.idle === "slowB") p = SLOW_B(t, 0);
        else if (n.dance != null) p = DANCE(n.dance, t, n.ph);
        else p = POSE({ lean: 0.04 + Math.sin(t * 1.1 + n.ph) * 0.02, twist: 0.1, hy: -0.3 + Math.sin(t * 0.6 + n.ph) * 0.2, hp: 0.12, hF: [0.06, 1.0, 0.2], hB: [0.02, 0.92, -0.25] });
        const dance = n.who === "vava" && IN.disco && IN.disco.vava && (IN.discoK || 0) > 0.4 && !talking;
        if (dance) {
          // passinho de discoteca: quica no tempo, gira o quadril e alterna o dedo pro alto com a mão na cintura
          const b = t * Math.PI * 2, up = Math.sin(b / 2) > -0.2;
          p = POSE({ py: 0.92 + Math.abs(Math.sin(b)) * 0.035, lean: 0.06, twist: Math.sin(b / 2) * 0.28, hy: Math.sin(b / 2) * 0.35, hp: -0.04 + Math.sin(b) * 0.05,
            hF: up ? [0.2, 1.78, 0.34] : [0.06, 0.98, 0.3], hB: [0.04, 0.98, -0.3], lf: Math.max(0, Math.sin(b)) * 0.05, lb: Math.max(0, -Math.sin(b)) * 0.05 });
        }
        if (n.julie && IN.cone && IN.cone.julie && !talking) p.hF = [0.28, 1.2, 0.2];
        if (!dance && (near || talking) && n.idle !== "play" && n.idle !== "browse" && n.idle !== "seat") p.hy = Math.max(-1, Math.min(1, -(Math.atan2(-(IN.z - n.z), IN.x - n.x) - n.yaw)));
        if (n.ov) { n.x = n.ov.x; n.z = n.ov.z; n.yaw = n.ov.yaw; p = n.ov.pose; }
        if ((n.dance != null || /^slow|dj|rail/.test(n.idle || "")) && !talking && !n.ov) { /* dançando: não vira pra olhar */ } else if (!n.ov && (near || talking) && !dance && n.idle !== "play" && n.idle !== "browse" && n.idle !== "seat" && R.id === "festa") p.hy = Math.max(-1, Math.min(1, -(Math.atan2(-(IN.z - n.z), IN.x - n.x) - n.yaw)));
        n.pose = n.pose ? ART.lerpPose(n.pose, p, Math.min(1, dt * 8)) : p;
        n.pose.stand = p.stand; n.pose.walk = p.walk;
        n.rig.pose(M.mul(M.T(n.x, -0.1 + (n.y || 0), n.z), M.RY(n.yaw)), n.pose);
      }
      // ventilador, vitrola, notas saindo das caixas
      const D = R.dyn;
      if (D.fan) D.fan.mo = M.mul(M.T(0, 2.95, 5.2), M.RY(t * 2.4));
      if (D.fanS) D.fanS.mo = M.mul(M.T(0, R.H - 0.35, 2.8), M.RY(t * 2.8));
      if (R.id === "sorveteria") iceFrame(R, D);
      if (R.id === "discos") { discosFrame(R, D, dt, t, fx, fz, px, pz, yaw); discoFx(R, D, dt, t); }
      if (R.id === "festa") festaFrame(R, D, dt, t);
      // câmera: atrás e acima; quando mexe em alguma coisa, chega perto por cima do ombro
      let eye, at;
      const sx = -fz, sz = fx;
      if (IN.sit) { eye = [px - fx * 1.05 + sx * 0.35, 1.62, pz - fz * 1.05 + sz * 0.35]; at = [px + fx * 1.2, 0.95, pz + fz * 1.2]; }
      else if (IN.anim || IN.needle) { const dd = deckOf(IN.anim ? IN.anim.deck : IN.needle.deck), dk = (IN.anim ? IN.anim.kind : IN.needle.fmt) === "cd" ? dd.CDP : dd.TT, cm = dd.cam; eye = [dk[0] + cm[0], dk[1] + cm[1], dk[2] + cm[2]]; at = [dk[0] - 0.05, dk[1] + 0.12, dk[2] - 0.05]; }
      else if (IN.lounge) { const ch = IN.lounge.c; eye = [ch.x - 2.1, 1.55, ch.z + 1.15]; at = [ch.x - 0.1, 0.75, ch.z]; }
      else if (IN.hold && IN.spot && IN.spot.face) { const f = IN.spot.face; eye = [px - fx * 1.25 + sx * 0.45, 2.05, pz - fz * 1.25 + sz * 0.45]; at = [(px + f[0]) / 2, 1.0, (pz + f[1]) / 2]; }
      else { eye = [px - fx * 2.4, 2.55, pz - fz * 2.4]; at = [px + fx * 0.9, 1.05, pz + fz * 0.9]; }
      eye[0] = Math.max(-R.W + 0.25, Math.min(R.W - 0.25, eye[0])); eye[2] = Math.max(0.12, Math.min(R.D - 0.2, eye[2])); eye[1] = Math.min(R.H - 0.3, eye[1]);
      if (R.id === "festa" && !IN.cutCam) { const under = (Math.abs(eye[0]) > 4.0 && eye[2] > 5.6) || eye[2] > 13.3 || (Math.abs(px) > 4.2 && pz > 5.8); eye[1] = under ? Math.min(eye[1], 2.4) : Math.min(eye[1] + 0.35, R.H - 0.3); }
      if (IN.cutCam) { IN.cam.eye = IN.cutCam.eye.slice(); IN.cam.at = IN.cutCam.at.slice(); IN.cam.fov = IN.cutCam.fov || 0.95; }
      else {
      if (IN.t < 0.05) { IN.cam.eye = eye.slice(); IN.cam.at = at.slice(); }
      IN.cam.eye = V.lerp(IN.cam.eye, eye, Math.min(1, dt * 4.5));
      IN.cam.at = V.lerp(IN.cam.at, at, Math.min(1, dt * 7));
      }
      const sc = R.scene;
      sc.objects = R.base.concat(Object.values(D).flat(), ...R.decks.map((d) => Object.values(d.objs)), (R.booths || []).map((b) => b.door), R.npcR.map((n) => n.rig.objs[0]), rig.objs, R.notes);
      if (IN.skates) sc.objects.push({ g: skatePropG, mo: M.I() });
      else if (!look.skates) sc.objects.push({ g: rig.board.g, mo: M.mul(M.T(0.95, 0.42, 0.16), M.mul(M.RY(0.25), M.mul(M.RX(1.3), M.RZ(Math.PI)))) });
      Rn.draw(sc, window.__cam || IN.cam);
    }
    function acceptMission() {
      if (soffer) return acceptStory();
      if (poffer) { const p = poffer; ui.mission && ui.mission("hide"); ui.place && ui.place(p.id); return true; }
      if (!offer) return false;
      if (MA) { items.forEach((o) => (o.hidden = true)); say("TROCOU DE MISSÃO", 1.4); }
      MA = { m: offer.m, left: offer.m.time || 0, pts: 0, got: offer.m.items ? offer.m.items.map(() => false) : null };
      offer = null;
      sfx.beep();
      ui.mission && ui.mission("start", { title: MA.m.title });
      return true;
    }

    // ---------- história: capítulos por skatista, com save (o do K.F. é com a Julie) ----------
    let HS = {}, julieOn = false;
    try { HS = JSON.parse(localStorage.getItem("plaza-historia") || "{}"); julieOn = localStorage.getItem("plaza-julie") === "1"; } catch (e) {}
    const saveHS = () => { try { localStorage.setItem("plaza-historia", JSON.stringify(HS)); localStorage.setItem("plaza-julie", julieOn ? "1" : "0"); } catch (e) {} };
    const STORY = {
      kf: [
        { title: "A garota da pista", line: "Ei, você do shape de tubarão. Até que você anda... Faz 2.000 pontos em 90 segundos que eu quero ver.", kind: "score", pts: 2000, time: 90 },
        { title: "Game de S.K.A.T.E. com a Julie", line: "Ok, ok, não foi ruim. Mas aguenta um game de S.K.A.T.E. comigo? 5 rodadas: eu mando, você repete, depois inverte. Errou, ganha letra. Uma tentativa só, hein!", kind: "skate" },
        { title: "Rolê com a Julie até a estação", line: "Tá bom, você anda bem. Bora dar um rolê? Me leva até a estação de trem, lá na cidade nova.", kind: "ride", to: [48, 112, 109, 160] },
        { title: "Sorvete na pista", line: "Tá um calor, hein... bora tomar um sorvete? A Sorveteria Pinguim é ali do outro lado da rua. Depois a gente senta lá em cima da rampa pra ver o pôr do sol.", kind: "ice" },
      ],
    };
    const JULIE_HOME = [8, 16];
    // rolê da Julie pela pista: atravessa o funbox, sobe as duas rampas e volta (kickturn lá em cima)
    const JPATH = [[8, 16], [4, 10], [0, 6.5], [0, 0], [0, -7], [3, -16], [5, -22], [6, -27.6, 1], [8, -20], [11, -12], [10, -4], [9, 6], [10, 14], [11, 21], [12, 27.6, 1], [11, 19]];
    const julie = (() => {
      const look = ART.LOOKS.julie, r = ART.makeRig(Rn, look);
      objs.push(r.objs[0], r.board);
      return { look, rig: r, pi: 0, posed: false, perf: null, x: JULIE_HOME[0], z: JULIE_HOME[1], head: 0, pitch: 0, follow: false, trail: [], wp: 1, v: 0, act: null, nextTrick: 4, cur: Object.assign({}, ART.POSES.ride), state: "ride" };
    })();
    // poses dela quando você tira foto perto (troca a cada foto)
    const JPOSES = [
      { n: "paz e amor", p: (t) => ({ stand: 1, px: 0, py: 0.94, pz: 0, lean: 0.02, twist: -0.1, hy: 0.3, hp: 0.14 + Math.sin(t * 2) * 0.02, hF: [-0.05, 0.98, 0.28], hB: [0.26, 1.7, -0.22], lf: 0, lb: 0 }) },
      { n: "uhuuul", p: (t) => ({ stand: 1, px: 0, py: 0.96 + Math.abs(Math.sin(t * 5)) * 0.03, pz: 0, lean: -0.08, twist: 0, hy: 0, hp: -0.18, hF: [0.12, 1.98, 0.34], hB: [0.12, 1.98, -0.34], lf: 0, lb: 0 }) },
      { n: "coração", p: (t) => ({ stand: 1, px: 0, py: 0.94, pz: 0, lean: 0.05, twist: 0, hy: 0.12, hp: 0.12, hF: [0.34, 1.5, 0.07], hB: [0.34, 1.5, -0.07], lf: 0, lb: 0 }) },
      { n: "joinha", p: (t) => ({ stand: 1, px: 0, py: 0.94, pz: 0, lean: 0.06, twist: 0.2, hy: 0.25, hp: 0.1, hF: [-0.02, 0.98, 0.3], hB: [0.46, 1.38, -0.12], lf: 0, lb: 0.1 }) },
    ];
    const angTo = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
    const jSlope = (x, z, h) => (H(x + Math.sin(h) * 0.3, z + Math.cos(h) * 0.3) - H(x - Math.sin(h) * 0.3, z - Math.cos(h) * 0.3)) / 0.6;
    // a Julie faz uma manobra de verdade: pula, o shape gira; se errar, cai e o shape escapa
    function jTrick(key, ok) {
      julie.act = { key, t: 0, dur: 0.78, ok, ft: 0 };
      if (Math.hypot(S.x - julie.x, S.z - julie.z) < 30) sfx.pop();
    }
    // sequência de manobra da Julie no game: vai até o canteiro, pula, desliza, desce e volta
    function jRoutine(st, ok) {
      const key = FKEY[st.f] || "none", R = [];
      if (st.grind) {
        R.push({ go: [13.6, 10.5] }, { go: [15, 6.4] });
        if (ok) R.push({ air: [[15, 0, 6.4], [15, 0.9, 2.6]], dur: 0.72, h: 0.7, key, dbl: st.dbl }, { grind: [[15, 0.9, 2.6], [15, 0.9, -2.8]] }, { air: [[15, 0.9, -2.8], [15, 0, -5.6]], dur: 0.62, h: 0.45, grab: st.grab ? "Indy" : null });
        else R.push({ air: [[15, 0, 6.4], [15, 0, 3.7]], dur: 0.72, h: 0.75, key, dbl: st.dbl, fail: true });
        R.push({ go: [12.5, -7.5] }, { go: [10, 4] }, { go: JULIE_HOME });
      } else {
        R.push({ go: [9.2, 12.5] });
        const last = !st.grab;
        R.push({ air: [[9.2, 0, 12.5], [9.6, 0, 9.4]], dur: st.dbl ? 0.95 : 0.78, h: st.dbl ? 1.05 : 0.8, key, dbl: st.dbl, fail: !ok && last });
        if (st.grab && (ok || true)) R.push({ go: [9.8, 7.2] }, { air: [[9.8, 0, 7.2], [10.2, 0, 3.6]], dur: 0.85, h: 1.0, grab: "Indy", fail: !ok });
        R.push({ go: [11.5, 2] }, { go: [11, 10] }, { go: JULIE_HOME });
      }
      julie.perf = { R, i: 0, t: 0 };
    }
    // casquinhas de sorvete (flocos) e o fio do fone dividido
    const coneG = Rn.upload((() => { const m = new Mesh(); m.tube([0, -0.16, 0], [0, 0, 0], 0.005, 0.045, 7, hex(0xd8a25a)); m.ball([0, 0.04, 0], 0.052, hex(0xf8f2e6), 0, 7, 5); m.ball([0.02, 0.07, 0.01], 0.012, hex(0x3a2418), 2, 4, 3); m.ball([-0.02, 0.05, -0.02], 0.01, hex(0x3a2418), 2, 4, 3); return m; })());
    const cones = [add(coneG, M.I(), { hidden: true }), add(coneG, M.I(), { hidden: true })];
    const cableG = Rn.upload(new Mesh().box(-0.0025, -0.0025, 0, 0.0025, 0.0025, 1, hex(0xf4f4f4), { m: 2 }), { outline: false });
    const cable = [add(cableG, M.I(), { hidden: true }), add(cableG, M.I(), { hidden: true })];
    const lineM = (a, b) => {
      const z = V.sub(b, a), L0 = V.len ? V.len(z) : Math.hypot(z[0], z[1], z[2]), zn = V.mul(z, 1 / (L0 || 1));
      let x = V.cross([0, 1, 0], zn); const xl = Math.hypot(x[0], x[1], x[2]) || 1; x = V.mul(x, 1 / xl);
      const y = V.cross(zn, x);
      return [x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, a[0], a[1], a[2], 1];
    };
    const handOf = (rig, look, side = "F") => { if (!rig.F) return null; const Lh = CHARS.lenOf(look); return M.pt(rig.F[CHARS.BONE["fore" + side]], [0, Lh.fore + 0.08, 0]); };
    const coneAt = (o, p) => { o.hidden = !p; if (p) o.mo = M.mul(M.T(p[0], p[1] + 0.05, p[2]), M.RZ(0.25)); };
    let EAR = null;
    const jSparks = Array.from({ length: 8 }, () => add(sparkG, M.I(), { hidden: true, v: [0, 0, 0], p: [0, 0, 0], life: 0 }));
    const jMark = add(Rn.upload((() => { const m = new Mesh(); m.box(-0.07, 0.25, -0.07, 0.07, 0.75, 0.07, hex(0xff4fa3), { m: 2 }); m.box(-0.07, 0, -0.07, 0.07, 0.14, 0.07, hex(0xff4fa3), { m: 2 }); return m; })()), M.I(), { hidden: true });
    // lugar marcado em frente à rampa grande (missão do sorvete): chegando lá com a Julie, começa a cena do pôr do sol
    const SUNSPOT = [0, 23.4];
    const sunMark = add(Rn.upload((() => { const m = new Mesh(); m.tube([0, 0, 0], [0, 0.03, 0], 1.0, 1.0, 24, hex(0xff4fa3), 2); m.tube([0, 0.03, 0], [0, 0.04, 0], 0.82, 0.82, 24, hex(0xffd23f), 2); m.box(-0.06, 0.3, -0.06, 0.06, 2.6, 0.06, hex(0xff4fa3), { m: 2 }); return m; })(), { outline: false }), M.I(), { hidden: true });
    let SA = null, soffer = null, replay = null;
    const stepOf = (k) => HS[k] || 0;
    const LET = "SKATE";
    const letters5 = (n) => LET.split("").map((c, i) => (i < n ? c : "_")).join(" ");
    // ---------- game de S.K.A.T.E.: 5 rodadas (Julie manda nas ímpares, você nas pares) ----------
    const FKEY = Object.fromEntries(Object.entries(FLIPS).map(([k, f]) => [f.name, k]));
    const FHINT = { Kickflip: "J", Heelflip: "J + D", "Pop Shove-it": "J + S", Hardflip: "J + W", "Varial Kickflip": "J + A" };
    const GRIND_N = new Set([...Object.values(GRINDN), ...Object.values(SK_GRIND)]);
    const GRAB_N = new Set([...Object.values(GRABN), ...Object.values(SK_GRAB)]);
    const J_SETS = [
      [{ n: "Kickflip", f: "Kickflip" }, { n: "Heelflip", f: "Heelflip" }, { n: "Pop Shove-it", f: "Pop Shove-it" }],
      [{ n: "Hardflip", f: "Hardflip" }, { n: "Varial Kickflip", f: "Varial Kickflip" }, { n: "Kickflip + grind", f: "Kickflip", grind: 1 }, { n: "Heelflip + grab", f: "Heelflip", grab: 1 }],
      [{ n: "Varial Kickflip + grind", f: "Varial Kickflip", grind: 1 }, { n: "Hardflip + grind", f: "Hardflip", grind: 1 }, { n: "Double Kickflip", f: "Kickflip", dbl: 1 }, { n: "Pop Shove-it + grab", f: "Pop Shove-it", grab: 1 }],
    ];
    const setHint = (st) => [FHINT[st.f] + (st.dbl ? " (segure o J)" : "") + " no ar", st.grind && "K no corrimão", st.grab && "L no ar"].filter(Boolean).join(" · ");
    const comboHas = (names, st) => names.some((n) => baseFlip(n) === st.f && (!st.dbl || /^(Double|Triple|\d+x) /.test(n))) && (!st.grind || names.some((n) => GRIND_N.has(n))) && (!st.grab || names.some((n) => GRAB_N.has(n)));
    // chance da Julie repetir o que você mandou: quanto mais difícil, mais ela erra
    function julieChance(names) {
      const fl = names.map(baseFlip).filter(Boolean);
      const B = { Kickflip: 0.82, Heelflip: 0.8, "Pop Shove-it": 0.86, Hardflip: 0.6, "Varial Kickflip": 0.56 };
      let p = Math.min(...fl.map((f) => B[f] ?? 0.65));
      if (names.some((n) => /^(Double|Triple|\d+x) /.test(n) && baseFlip(n))) p *= 0.72;
      if (new Set(fl).size > 1) p *= 0.82;
      if (names.some((n) => GRIND_N.has(n))) p *= 0.82;
      if (names.some((n) => GRAB_N.has(n))) p *= 0.86;
      return Math.max(0.2, Math.min(0.9, p));
    }
    const describe = (names) => [...new Set(names.filter((n) => !n.startsWith("GAP") && n !== "GRAFITE"))].slice(0, 4).join(" + ");
    function storyEvent(e) {
      if (!SA) return;
      const st = SA.def;
      if (st.kind === "score" && e.type === "combo") { SA.pts += e.pts; if (SA.pts >= st.pts) storyStepDone(); }
      if (st.kind === "skate") {
        const G = SA.g;
        if (G.phase !== "copy" && G.phase !== "pset") return;
        if (e.type === "bail") G.att = { bail: true };
        if (e.type === "combo" && e.names && e.names.some((n) => baseFlip(n))) G.att = { names: e.names };
      }
    }
    function storyStepDone() {
      const k = lookKey(), st = SA.def;
      if (SA.replay) {
        // capítulo rejogado: comemora, mas não mexe no save
        ui.mission && ui.mission("done", { title: st.title, who: "Julie" });
        celebrate("CAPÍTULO REJOGADO", st.title, "");
        replay = null; SA = null;
        return;
      }
      HS[k] = stepOf(k) + 1;
      ui.mission && ui.mission("done", { title: st.title, who: "Julie" });
      const nx = STORY.kf[HS[k]];
      celebrate(`CAPÍTULO ${HS[k]} CONCLUÍDO`, st.title, nx ? `Próximo: ${nx.title} · fale com a Julie` : "");
      if (st.kind === "ride") {
        julieOn = true;
        celebrate("JULIE DESBLOQUEADA ♡", "Agora dá pra jogar com ela", "escolha a Julie no menu · rádio Travessura FM");
        ui.mission && ui.mission("unlock", { who: "Julie" });
      }
      saveHS();
      SA = null;
    }
    function skateFrame(dt) {
      const G = SA.g;
      const head = () => `S.K.A.T.E. · rodada ${Math.min(G.round, 5)}${G.round > 5 ? "+ desempate" : "/5"} · você ${letters5(G.pl)} · Julie ${letters5(G.ju)}`;
      const tick = (txt, left) => ui.mission && ui.mission("tick", { title: `${head()} · ${txt}`, left: left ?? null });
      const next = () => {
        // fim: depois da 5ª rodada (ou de cada par de desempate) quem tiver menos letras ganha
        if (G.round >= 5 && G.pl !== G.ju && (G.round === 5 || G.round % 2 === 0)) {
          if (G.pl < G.ju) {
            say("VOCÊ GANHOU O GAME!", 2.4, true);
            const def = SA.def, rp = SA.replay;
            SA = null;
            ui.mission && ui.mission("hide");
            // cena dos dois e depois a comemoração do capítulo
            setTimeout(() => { if (!CUT_ON.game || !playCut("game", () => { SA = { def, replay: rp }; storyStepDone(); })) { SA = { def, replay: rp }; storyStepDone(); } }, 1400);
            return;
          }
          say("A JULIE GANHOU! fala com ela pra revanche", 2.8, true); sfx.nocan();
          ui.mission && ui.mission("fail", { title: "Game de S.K.A.T.E." });
          SA = null; return;
        }
        if (G.round === 5 && G.pl === G.ju) say("EMPATE! DESEMPATE!", 2, true);
        G.round++;
        Object.assign(G, { phase: G.round % 2 ? "jprep" : "pprep", t: 2.2, att: null });
      };
      G.t -= dt;
      if (G.phase === "jprep") {
        tick("vez da Julie…");
        if (G.t > 0 || julie.state !== "park") return;
        const tier = J_SETS[G.round >= 5 ? 2 : G.round >= 3 ? 1 : 0];
        G.set = tier[Math.floor(Math.random() * tier.length)];
        G.jok = Math.random() < (G.round >= 5 ? 0.72 : G.round >= 3 ? 0.82 : 0.92);
        jRoutine(G.set, G.jok);
        say(`A JULIE VAI DE ${G.set.n.toUpperCase()}`, 1.8);
        G.phase = "jset";
      } else if (G.phase === "jset") {
        tick(`a Julie manda: ${G.set.n}`);
        if (julie.act || julie.perf || julie.state !== "park") return;
        if (!G.jok) { say("A JULIE ERROU A PRÓPRIA MANOBRA! sem letra", 2.2, true); return next(); }
        say(`REPITA: ${G.set.n.toUpperCase()}`, 2, true);
        Object.assign(G, { phase: "copy", t: 15, att: null });
      } else if (G.phase === "copy") {
        tick(`repita ${G.set.n} (${setHint(G.set)}) · uma tentativa`, G.t);
        const a = G.att;
        if (!a && G.t > 0) return;
        if (a && a.names && comboHas(a.names, G.set)) { say("ACERTOU!", 1.6, true); sfx.combo(true); }
        else { G.pl++; say(`${!a ? "TEMPO ESGOTADO" : a.bail ? "CAIU" : "NÃO FOI ESSA"}! letra ${LET[G.pl - 1]} pra você`, 2, true); sfx.nocan(); }
        next();
      } else if (G.phase === "pprep") {
        tick("sua vez de mandar…");
        if (G.t > 0) return;
        say("SUA VEZ! mande uma manobra com flip", 2, true);
        Object.assign(G, { phase: "pset", t: 15, att: null });
      } else if (G.phase === "pset") {
        tick("mande um flip (dá pra emendar grind e grab) · uma tentativa", G.t);
        const a = G.att;
        if (!a && G.t > 0) return;
        if (!a || a.bail) { say(a ? "VOCÊ CAIU NA SUA! sem letra" : "TEMPO ESGOTADO, sem letra", 2, true); return next(); }
        G.mine = describe(a.names);
        G.jp = julieChance(a.names);
        const fl = a.names.map(baseFlip).find(Boolean);
        // o que a Julie precisa repetir: o flip + grind/grab se você emendou
        G.pst = { f: fl, grind: a.names.some((n) => GRIND_N.has(n)), grab: a.names.some((n) => GRAB_N.has(n)), dbl: a.names.some((n) => /^(Double|Triple|\d+x) /.test(n) && baseFlip(n)) };
        say(`VOCÊ MANDOU: ${G.mine.toUpperCase()}`, 1.8, true);
        Object.assign(G, { phase: "jtry", t: 1.4, fl });
      } else if (G.phase === "jtry") {
        tick(`a Julie tenta: ${G.mine}`);
        if (G.t > 0) return;
        if (!G.tried) { G.tried = true; G.jok = Math.random() < G.jp; jRoutine(G.pst, G.jok); return; }
        if (julie.act || julie.perf || julie.state !== "park") return;
        G.tried = false;
        if (G.jok) say("A JULIE ACERTOU", 1.8);
        else { G.ju++; say(`A JULIE ERROU! letra ${LET[G.ju - 1]} pra ela`, 2, true); sfx.combo(true); }
        next();
      }
    }
    function storyFrame(dt, t) {
      const k = lookKey(), steps = STORY.kf, kfStep = stepOf("kf");
      const isJulie = k === "julie";
      julie.rig.objs[0].hidden = julie.rig.board.hidden = isJulie;
      if (isJulie) { jMark.hidden = true; if (soffer) { soffer = null; ui.mission && ui.mission("hide"); } return; }
      if (CUT) return;
      // trilha do skatista (pra Julie seguir atrás e do lado)
      julie.trail.push([S.x, S.z, S.head, t]);
      while (julie.trail.length && t - julie.trail[0][3] > 1.2) julie.trail.shift();
      const following = julie.follow && k === "kf";
      const dPl = Math.hypot(S.x - julie.x, S.z - julie.z);
      const faceP = () => Math.atan2(S.x - julie.x, S.z - julie.z) - Math.PI / 2;
      const flatHere = Math.abs(jSlope(julie.x, julie.z, julie.head)) < 0.03 && H(julie.x, julie.z) < 0.05;
      const game = SA && SA.def.kind === "skate";
      const talkable = k === "kf" && !following && !game && !MA;
      let target = null, want = Object.assign({}, ART.POSES.ride, julie.look.ride), wantHead = julie.head;
      for (const sp of jSparks) {
        if (sp.life > 0) { sp.life -= dt; sp.v[1] -= 12 * dt; sp.p = V.add(sp.p, V.mul(sp.v, dt)); sp.mo = M.T(sp.p[0], sp.p[1], sp.p[2]); }
        sp.hidden = sp.life <= 0;
      }
      // manobra em sequência (game): controla posição, pose e shape direto
      const P = julie.perf;
      let perfBoard = null;
      if (P && !julie.act) {
        const st = P.R[P.i];
        julie.state = "perf";
        if (!st) { julie.perf = null; julie.state = "go"; }
        else if (st.go) {
          const dx = st.go[0] - julie.x, dz = st.go[1] - julie.z, d = Math.hypot(dx, dz);
          julie.v += (4.2 - julie.v) * Math.min(1, dt * 3);
          wantHead = Math.atan2(dx, dz);
          julie.head = angTo(julie.head, wantHead, Math.min(1, dt * 9));
          const stepL = Math.min(d, julie.v * dt);
          julie.x += (dx / (d || 1)) * stepL;
          julie.z += (dz / (d || 1)) * stepL;
          if (d < 0.25) { P.i++; P.t = 0; }
        } else if (st.air) {
          if (P.t === 0 && dPl < 30) sfx.pop();
          P.t += dt;
          const f = Math.min(1, P.t / st.dur), [a0, a1] = st.air;
          julie.x = a0[0] + (a1[0] - a0[0]) * f;
          julie.z = a0[2] + (a1[2] - a0[2]) * f;
          julie.head = angTo(julie.head, Math.atan2(a1[0] - a0[0], a1[2] - a0[2]), Math.min(1, dt * 9));
          const y = a0[1] + (a1[1] - a0[1]) * f + Math.sin(f * Math.PI) * st.h;
          const e = f * f * (3 - 2 * f), k = Math.sin(f * Math.PI);
          const rideP = Object.assign({}, ART.POSES.ride, julie.look.ride);
          want = st.grab ? ART.lerpPose(rideP, ART.grabPose(st.grab), Math.min(1, k * 1.6)) : ART.lerpPose(rideP, ART.POSES.flip, k);
          julie.cur = ART.lerpPose(julie.cur, want, Math.min(1, dt * 14));
          const base = M.mul(M.T(julie.x, y, julie.z), M.RY(julie.head));
          const fm = st.key ? FLIPS[st.key].r((st.fail ? 0.7 : st.dbl ? 2 : 1) * e) : null;
          perfBoard = { base, bm: fm ? M.mul(base, M.mul(M.T(0, 0.12, 0), M.mul(fm, M.T(0, -0.09, 0)))) : base };
          if (f >= 1) {
            P.i++; P.t = 0;
            if (st.fail) {
              // errou: cai e depois volta pra casa
              julie.act = { key: st.key || "none", t: 1, dur: 0.78, ok: false, ft: 0 };
              while (P.R[P.i] && !P.R[P.i].go) P.i++;
            } else if (dPl < 30) sfx.land();
          }
        } else if (st.grind) {
          const [a0, a1] = st.grind, L0 = Math.hypot(a1[0] - a0[0], a1[2] - a0[2]);
          P.t += dt;
          const f = Math.min(1, (P.t * 4.2) / L0);
          julie.x = a0[0] + (a1[0] - a0[0]) * f;
          julie.z = a0[2] + (a1[2] - a0[2]) * f;
          julie.head = Math.atan2(a1[0] - a0[0], a1[2] - a0[2]);
          want = Object.assign({}, ART.POSES.grind);
          julie.cur = ART.lerpPose(julie.cur, want, Math.min(1, dt * 14));
          const base = M.mul(M.T(julie.x, a0[1] + (a1[1] - a0[1]) * f, julie.z), M.RY(julie.head));
          perfBoard = { base, bm: base };
          for (const sp of jSparks) if (sp.life <= 0 && Math.random() < 0.5) {
            sp.life = 0.15 + Math.random() * 0.2;
            sp.p = [julie.x, a0[1] + 0.02, julie.z];
            sp.v = [(Math.random() - 0.5) * 3 - Math.sin(julie.head) * 2, Math.random() * 3, (Math.random() - 0.5) * 3 - Math.cos(julie.head) * 2];
          }
          if (f >= 1) { P.i++; P.t = 0; }
        }
      }
      // foto: se ela tá perto, chega do seu lado (do lado contrário da mão da câmera) e faz pose
      const hh = PH && dPl < 7 && !julie.act && !game ? handAndHead() : null;
      if (julie.perf || perfBoard) {
        // já tratado acima
      } else if (hh) {
        if (julie.state !== "pose") { julie.state = "pose"; julie.posed = false; }
        let sx = hh.hand[0] - hh.head[0], sz = hh.hand[2] - hh.head[2];
        const sl0 = Math.hypot(sx, sz) || 1;
        sx /= sl0; sz /= sl0;
        const f = V.norm([hh.fwd[0], 0, hh.fwd[2]]), sc = look.scale || 1;
        const tx = hh.head[0] - sx * 1.0 * sc + f[0] * 0.28, tz = hh.head[2] - sz * 1.0 * sc + f[2] * 0.28;
        julie.x += (tx - julie.x) * Math.min(1, dt * 6);
        julie.z += (tz - julie.z) * Math.min(1, dt * 6);
        julie.v = 0;
        const c = PH.cam.eye;
        wantHead = Math.atan2(c[0] - julie.x, c[2] - julie.z) - Math.PI / 2;
        want = JPOSES[julie.pi % JPOSES.length].p(t);
        if (!julie.posed && Math.hypot(tx - julie.x, tz - julie.z) < 0.3) { julie.posed = true; say(`A JULIE ENTROU NA FOTO: ${JPOSES[julie.pi % JPOSES.length].n.toUpperCase()}`, 1.6); }
      } else if (following) {
        julie.state = "follow";
        let tp = julie.trail[0];
        for (const q of julie.trail) if (t - q[3] >= 0.35) tp = q;
        const side = [Math.cos(tp[2]), -Math.sin(tp[2])];
        const tx = tp[0] + side[0] * 1.3, tz = tp[1] + side[1] * 1.3;
        if (Math.hypot(tx - julie.x, tz - julie.z) > 25) { julie.x = tx; julie.z = tz; }
        julie.x += (tx - julie.x) * Math.min(1, dt * 7);
        julie.z += (tz - julie.z) * Math.min(1, dt * 7);
        wantHead = tp[2];
        if (S.speed < 0.6) { want = CHARS.IDLE.kick(t); wantHead = faceP(); }
      } else {
        // pra onde ela vai: casa (no game), parar pra conversar, ou seguir o rolê
        if (game) target = JULIE_HOME;
        else if (julie.state === "wait") { if (dPl > 11 || !talkable) julie.state = "ride"; }
        else if (talkable && dPl < 8 && flatHere && !julie.act) julie.state = "wait";
        if (target) {
          const dx = target[0] - julie.x, dz = target[1] - julie.z, d = Math.hypot(dx, dz);
          if (d > 0.3) { julie.state = "go"; julie.v = Math.min(4.5, d * 2 + 0.5); wantHead = Math.atan2(dx, dz); }
          else { julie.state = "park"; julie.v = 0; julie.x = target[0]; julie.z = target[1]; want = CHARS.IDLE.kick(t); wantHead = faceP(); }
        } else if (julie.state === "wait") {
          julie.v = Math.max(0, julie.v - dt * 8);
          if (julie.v < 0.5) { want = CHARS.IDLE.kick(t); wantHead = faceP(); }
        } else {
          if (julie.state !== "ride") {
            // volta pro rolê pelo ponto mais perto
            let bi = 0, bd = 1e9;
            JPATH.forEach((q, i) => { const dd = Math.hypot(q[0] - julie.x, q[1] - julie.z); if (dd < bd) { bd = dd; bi = i; } });
            julie.wp = (bi + 1) % JPATH.length;
            julie.state = "ride";
          }
          const w = JPATH[julie.wp], dx = w[0] - julie.x, dz = w[1] - julie.z, d = Math.hypot(dx, dz);
          const h = H(julie.x, julie.z);
          julie.v += ((w[2] ? 2.6 : 5) * Math.max(0.45, 1 - h * 0.22) - julie.v) * Math.min(1, dt * 2);
          wantHead = Math.atan2(dx, dz);
          const passed = d < 1.6 && dx * Math.sin(julie.head) + dz * Math.cos(julie.head) < 0;
          if (d < (w[2] ? 0.35 : 0.9) || passed) {
            julie.wp = (julie.wp + 1) % JPATH.length;
            if (w[2]) { julie.head += Math.PI; julie.v = 1.2; } // kickturn no alto da rampa
          }
          // de vez em quando manda um flip no chão liso
          julie.nextTrick -= dt;
          if (julie.nextTrick <= 0 && flatHere && !julie.act && !game) {
            julie.nextTrick = 5 + Math.random() * 5;
            const ks = Object.keys(FLIPS);
            jTrick(ks[Math.floor(Math.random() * ks.length)], true);
          }
        }
        if (julie.state !== "park" && !(julie.state === "wait" && julie.v < 0.5)) {
          julie.x += Math.sin(julie.head) * julie.v * dt;
          julie.z += Math.cos(julie.head) * julie.v * dt;
        }
      }
      if (!julie.perf) julie.head = angTo(julie.head, wantHead, Math.min(1, dt * (julie.state === "ride" ? 5 : julie.state === "pose" ? 12 : 8)));
      // inclina o shape com a rampa
      const sl = (julie.state === "park" || julie.state === "wait" || julie.state === "pose") ? 0 : jSlope(julie.x, julie.z, julie.head);
      julie.pitch += (Math.atan(Math.max(-2.5, Math.min(2.5, sl))) - julie.pitch) * Math.min(1, dt * 12);
      if (Math.abs(sl) > 0.25 && julie.state === "ride") want = ART.lerpPose(want, ART.POSES.crouch, Math.min(0.6, Math.abs(sl) * 0.5));
      // manobra em andamento
      let hop = 0, flipM = null, fall = 0, up = 0;
      const A = julie.act;
      if (A) {
        A.t += dt;
        const f = Math.min(1, A.t / A.dur);
        if (f < 1) {
          hop = Math.sin(f * Math.PI) * 0.8;
          const e = f * f * (3 - 2 * f);
          flipM = FLIPS[A.key].r(A.ok ? e : e * 0.7);
          want = ART.lerpPose(Object.assign({}, ART.POSES.ride, julie.look.ride), ART.POSES.flip, Math.sin(f * Math.PI));
        } else if (A.ok) { julie.act = null; if (dPl < 30) sfx.land(); }
        else {
          if (!A.ft) { if (dPl < 30) sfx.bail(); A.bx = julie.x; A.bz = julie.z; A.bh = julie.head; }
          A.ft += dt;
          const ss = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
          fall = ss(0, 0.3, A.ft); up = ss(1.1, 1.6, A.ft);
          want = ART.lerpPose(ART.POSES.crouch, CHARS.IDLE.kick(t), up);
          if (A.ft > 1.7) julie.act = null;
        }
      }
      if (!perfBoard) julie.cur = ART.lerpPose(julie.cur, want, Math.min(1, dt * 10));
      const gy = H(julie.x, julie.z) + hop;
      const base = M.mul(M.T(julie.x, gy, julie.z), M.mul(M.RY(julie.head), M.RX(-julie.pitch)));
      if (perfBoard) {
        julie.rig.pose(perfBoard.base, julie.cur, perfBoard.bm);
        julie.rig.board.mo = perfBoard.bm;
      } else if (A && !A.ok && A.ft > 0) {
        // caiu: tomba sentada e o shape escapa de cabeça pra baixo
        const ang = 1.2 * fall * (1 - up);
        const body = M.mul(M.T(julie.x, gy, julie.z), M.mul(M.RY(julie.head), M.RX(ang)));
        julie.rig.pose(body, julie.cur);
        const away = 1.5 * fall;
        julie.rig.board.mo = M.mul(M.T(A.bx + Math.sin(A.bh) * away, H(A.bx, A.bz) + 0.05, A.bz + Math.cos(A.bh) * away), M.mul(M.RY(A.bh + fall * 0.7), M.RZ(Math.PI * fall)));
      } else {
        const bm = flipM ? M.mul(base, M.mul(M.T(0, 0.12, 0), M.mul(flipM, M.T(0, -0.09, 0)))) : base;
        julie.rig.pose(base, julie.cur, bm);
        julie.rig.board.mo = bm;
      }
      // "!" rosa quando tem capítulo pra fazer com o K.F.
      const hasStep = k === "kf" && (kfStep < steps.length || replay != null) && !SA;
      jMark.hidden = !hasStep || !!PH;
      if (hasStep) jMark.mo = M.mul(M.T(julie.x, gy + 2.15, julie.z), M.RY(t * 2));
      // oferta: chegou perto da Julie parada
      // andando junto, ela só pergunta se quer parar quando vocês voltam pra pista dela
      const near = dPl < 3.4 && S.speed < 4 && S.running && !PH && !REC && !MA && !SA && !julie.act &&
        (following ? Math.hypot(S.x - JULIE_HOME[0], S.z - JULIE_HOME[1]) < 7 : julie.state === "wait" && julie.v < 0.5);
      if (near && k === "kf" && !soffer) {
        if (replay != null) soffer = { step: replay, line: steps[replay].line, title: steps[replay].title + " (de novo)" };
        else if (kfStep < steps.length) soffer = { step: kfStep, line: steps[kfStep].line, title: steps[kfStep].title };
        else soffer = { toggle: true, line: julie.follow ? "Já vou indo... amanhã a gente anda de novo?" : "Bora dar um rolê?", title: julie.follow ? "Deixar a Julie em casa" : "Andar com a Julie" };
        ui.mission && ui.mission("offer", { who: "Julie", line: soffer.line, title: soffer.title });
      } else if (!near && soffer) { soffer = null; ui.mission && ui.mission("hide"); }
      if (!SA || SA.def.kind !== "ice" || !SA.phase) sunMark.hidden = true;
      if (!SA) return;
      if (SA.def.kind === "skate") skateFrame(dt);
      else if (SA.def.kind === "ride") {
        const [x0, x1, z0, z1] = SA.def.to;
        ui.mission && ui.mission("tick", { title: SA.def.title });
        if (S.x > x0 && S.x < x1 && S.z > z0 && S.z < z1 && Math.hypot(S.x - julie.x, S.z - julie.z) < 20) storyStepDone();
      } else if (SA.def.kind === "ice") {
        const sv = L.sorveteria || [15.5, 42.4];
        if (!SA.phase) {
          if (!poffer) ui.mission && ui.mission("tick", { title: "Leve a Julie na Sorveteria Pinguim e peça dois de flocos" });
        } else {
          ui.mission && ui.mission("tick", { title: "Vá com a Julie até o lugar marcado na rampa grande" });
          sunMark.hidden = false; sunMark.mo = M.mul(M.T(SUNSPOT[0], H(SUNSPOT[0], SUNSPOT[1]) + 0.02, SUNSPOT[1]), M.RY(t * 0.8));
          coneAt(cones[0], (() => { const h = handAndHead(); return h && h.hand; })());
          coneAt(cones[1], handOf(julie.rig, julie.look, "F"));
          if (Math.hypot(S.x - SUNSPOT[0], S.z - SUNSPOT[1]) < 2.2 && S.mode === "ground" && S.speed < 6 && dPl < 22) {
            sunMark.hidden = true;
            const def = SA.def, rp = SA.replay;
            SA = null;
            ui.mission && ui.mission("hide");
            cones.forEach((o) => (o.hidden = true));
            if (!CUT_ON.sorvete || !playCut("sorvete", () => { SA = { def, replay: rp }; storyStepDone(); })) { SA = { def, replay: rp }; storyStepDone(); }
          }
        }
      } else if (SA.def.kind === "score") {
        SA.left -= S.running ? dt : 0;
        ui.mission && ui.mission("tick", { title: SA.def.title, prog: `${fmt(SA.pts)}/${fmt(SA.def.pts)}`, left: SA.left });
        if (SA.left <= 0) { say("NÃO DEU! fala com a Julie e tenta de novo", 2.6, true); sfx.nocan(); ui.mission && ui.mission("fail", { title: SA.def.title }); SA = null; }
      }
    }
    // ---------- cutscene (estilo PS1/PS2): barras pretas, cortes de câmera e poses mais vivas ----------
    let CUT = null;
    // por enquanto só a cena do pôr do sol (sorvete) toca dentro da história; as outras passam pelo menu (pra revisar)
    const CUT_ON = { sorvete: true };
    const ez = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const STD = (o) => Object.assign({ stand: 1, px: 0, py: 0.94, pz: 0, lean: 0.02, twist: 0.05, hy: 0, hp: 0.02, hF: [0.02, 0.97, 0.3], hB: [0.02, 0.97, -0.3], lf: 0, lb: 0 }, o);
    // poses do K.F. e da Julie (peito pra +x; mão da frente em +z)
    const KP = {
      stand: (t) => STD({ py: 0.94 + Math.sin(t * 2.2) * 0.006, hy: Math.sin(t * 0.9) * 0.08 }),
      scratch: (t) => STD({ lean: 0.06, twist: 0.15, hy: 0.25 + Math.sin(t * 6) * 0.05, hp: 0.14, hF: [-0.1, 1.74 + Math.sin(t * 14) * 0.025, 0.16] }),
      proud: (t) => STD({ py: 0.95, lean: -0.12, twist: 0, hy: -0.05, hp: -0.18 + Math.sin(t * 3) * 0.02, hF: [-0.02, 1.0, 0.33], hB: [-0.02, 1.0, -0.33] }),
      recoil: (t) => STD({ px: -0.06, py: 0.93, lean: -0.14, twist: -0.4, hy: 0.35, hp: 0.05, hF: [0.12, 1.36, -0.1] }),
      laugh: (t) => STD({ py: 0.94 + Math.abs(Math.sin(t * 12)) * 0.015, lean: 0.14, twist: 0.1, hy: 0.1, hp: -0.18 + Math.sin(t * 12) * 0.07, hF: [0.2, 1.05, 0.14] }),
      wave: (t) => STD({ twist: 0.1, hp: -0.06, hF: [0.12, 1.9, 0.4 + Math.sin(t * 11) * 0.17] }),
    };
    const JPc = {
      cross: (t) => STD({ py: 0.94 + Math.sin(t * 2) * 0.008, lean: -0.05, twist: 0.12 + Math.sin(t * 1.5) * 0.05, hy: -0.18, hp: -0.1, hF: [0.24, 1.24, -0.07], hB: [0.24, 1.2, 0.07] }),
      shrug: (t) => STD({ py: 0.96, lean: 0.02, twist: 0.05, hy: 0.28, hp: 0.14, hF: [0.3, 1.14, 0.5], hB: [0.3, 1.14, -0.5] }),
      // risada: primeiro joga a cabeça pra trás com a mão na boca, depois dobra de rir
      laugh: (t) => t < 0.9
        ? STD({ py: 0.95 + Math.abs(Math.sin(t * 14)) * 0.02, lean: -0.2, twist: 0.1, hy: 0.1, hp: -0.5 + Math.sin(t * 14) * 0.06, hF: [0.22, 1.02, 0.12], hB: [0.3, 1.52, -0.04] })
        : STD({ py: 0.84 + Math.abs(Math.sin(t * 16)) * 0.03, lean: 0.72 + Math.sin(t * 16) * 0.09, twist: 0.2, hy: 0.2, hp: 0.45 + Math.sin(t * 16) * 0.1, hF: [0.42, 0.72, 0.16], hB: [0.44, 0.76, -0.14], lf: 0.04 }),
      punch: (t) => { const k = Math.sin(Math.min(1, t / 0.32) * Math.PI); return STD({ lean: 0.1 + 0.18 * k, twist: -0.1 - 0.3 * k, hy: -0.1, hp: 0.05, hF: [0.25 + 0.5 * k, 1.3 + 0.08 * k, 0.18], hB: [0.1, 1.0, -0.3] }); },
      point: (t) => STD({ py: 0.94 + Math.abs(Math.sin(t * 4)) * 0.01, lean: 0.08, twist: -0.15, hy: -0.12, hp: 0.12, hF: [0.64, 1.42, 0.12], hB: [-0.02, 0.98, -0.32] }),
      wave: (t) => STD({ twist: 0.2, hy: 0.15, hp: 0.05, hF: [0.1, 1.86, 0.38 + Math.sin(t * 12) * 0.17] }),
    };
    const SCENES = {
      game: () => {
        const K = [5.6, 15.0], J = [7.8, 15.8];
        const dl = Math.hypot(J[0] - K[0], J[1] - K[1]), d = [(J[0] - K[0]) / dl, (J[1] - K[1]) / dl], pp = [-d[1], d[0]];
        const M = [(K[0] + J[0]) / 2, (K[1] + J[1]) / 2];
        const at3 = (b, a, s, y) => [b[0] + d[0] * a + pp[0] * s, y, b[1] + d[1] * a + pp[1] * s];
        return {
          K, J, d,
          shots: [
            { dur: 4.4, who: "Julie", text: "Tá bom, tá bom... você ganhou. Mas foi sorte, hein!",
              cam: (u) => ({ eye: at3(M, -1.6 + u * 1.2, 5.2 - u * 0.6, 1.9), at: at3(M, 0, 0, 1.05), fov: 0.85 }),
              kf: (t) => KP.stand(t), ju: (t) => (t < 1.8 ? JPc.cross(t) : JPc.shrug(t)) },
            { dur: 3.4, who: "K.F.", text: "Sorte? Isso aí se chama talento.",
              cam: (u) => ({ eye: at3(J, 1.1, 0.55, 1.62), at: at3(K, 0, -0.1 + u * 0.05, 1.55), fov: 0.66 - u * 0.04 }),
              kf: (t) => (t < 1.5 ? KP.scratch(t) : KP.proud(t)), ju: (t) => JPc.cross(t) },
            { dur: 4.0, who: "Julie", text: "Hahaha! Você é muito convencido, sabia?",
              cam: (u) => ({ eye: at3(J, -1.8, 0.5, 1.3 + u * 0.05), at: at3(J, 0, 0, 1.0), fov: 0.74 }),
              kf: (t) => KP.proud(t), ju: (t) => JPc.laugh(t) },
            { dur: 3.8, who: "Julie", text: "Mas até que você anda bem, tubarão.",
              cam: (u) => ({ eye: at3(M, 0.3 - u * 0.5, 3.3, 1.4), at: at3(M, 0, 0, 1.08), fov: 0.75 }),
              kf: (t) => (t < 0.25 ? KP.proud(t) : t < 1.4 ? KP.recoil(t) : KP.laugh(t)), ju: (t) => (t < 0.9 ? JPc.punch(t) : JPc.point(t)) },
            { dur: 4.6, who: "Julie", text: "Amanhã tem mais. Não se atrasa!",
              cam: (u) => ({ eye: at3(K, -1.7, 0.7, 1.6), at: at3(J, 1 + u * 3.5, 0, 1.0), fov: 0.8 }),
              kf: (t) => (t < 1.2 ? KP.stand(t) : KP.wave(t)), ju: (t) => (t < 1.0 ? JPc.wave(t) : null),
              jmove: (t) => (t < 1.0 ? null : { a: Math.pow((t - 1.0) / 3.6, 1.3) * 9 }) },
          ],
        };
      },
    };
    // sentados na borda da rampa grande, de frente pra pista (pôr do sol atrás da cidade)
    const SIT = (o) => STD(Object.assign({ stand: 0, px: -0.04, py: 0.6, lean: -0.06, twist: 0, hy: 0, hp: 0.06, hF: [0.3, 0.66, 0.2], hB: [0.12, 0.62, -0.3], lf: -0.12, lb: -0.06, fxF: 0.44, fxB: 0.4 }, o));
    SCENES.sorvete = () => {
      const RAD = L.RAD || 3.2, ZC = 28.32, Y = RAD - 0.5;
      return {
        K: [-0.34, ZC], J: [0.34, ZC], d: [1, 0], ky: Y, jy: Y, kHead: Math.PI / 2, jHead: Math.PI / 2, ear: true, sit: true,
        shots: [
          { dur: 4.6, who: "Julie", text: "Flocos é o melhor sabor que existe. Nem tenta discutir.",
            cam: (u) => ({ eye: [1.2 - u * 0.9, 1.5 + u * 0.2, 23.2], at: [0, RAD + 0.4, ZC], fov: 0.6 }), cones: 1,
            kf: (t) => SIT({ hF: [0.24, 1.38 + Math.max(0, Math.sin(t * 2.2)) * 0.12, 0.1], hy: 0.15 }), ju: (t) => SIT({ hF: [0.24, 1.34 + Math.max(0, Math.sin(t * 2.6 + 1)) * 0.1, 0.08], hy: -0.2, hp: 0.1 }) },
          { dur: 3.6, who: "K.F.", text: "Ei... escuta essa aqui.",
            cam: (u) => ({ eye: [-0.9, RAD + 1.45, ZC - 1.6], at: [-0.34, RAD + 0.75, ZC], fov: 0.62 }), cones: 1,
            kf: (t) => { const k = Math.min(1, t / 1.4), e = k * k * (3 - 2 * k); return SIT({ hF: [0.08 + e * 0.26, 1.62 - e * 0.42, 0.26 + e * 0.12], hy: 0.35, hp: 0.12 }); }, ju: (t) => SIT({ hF: [0.24, 1.3, 0.08], hy: -0.35 }) },
          { dur: 4.4, who: "Julie", text: "...ah, essa eu conheço.", kfEar: 1, juEar: 1, cable: 1, music: 1,
            cam: (u) => ({ eye: [0.15, RAD + 1.0, ZC - 1.35], at: [0, RAD + 0.88, ZC + 0.05], fov: 0.64 }),
            kf: (t) => SIT({ hB: [0.3, 0.66, -0.2], hF: [0.3 - Math.min(1, t / 1.2) * 0.1, 0.9, 0.32], hy: 0.45, hp: 0.12 }), ju: (t) => SIT({ hB: [0.02, 1.36, -0.24], hy: -0.3, hp: 0.15 }) },
          { dur: 3.6, who: "", text: "♪ ♪ ♪", kfEar: 1, juEar: 1, cable: 1, lean: 1,
            cam: (u) => ({ eye: [0.55 - u * 0.15, RAD + 1.05, ZC - 2.3 + u * 0.2], at: [-0.04, RAD + 0.82, ZC], fov: 0.66 }) },
          { dur: 5.4, who: "", text: "♪ ♪ ♪", kfEar: 1, juEar: 1, cable: 1, lean: 2,
            cam: (u) => ({ eye: [0.4 + u * 0.4, RAD + 1.6 + u * 0.9, ZC + 3.2 + u * 2.4], at: [0, RAD + 0.7, ZC - 4], fov: 0.86 }) },
        ],
      };
    };
    function playCut(key, onEnd) {
      if (CUT || !SCENES[key] || lookKey() !== "kf") return false;
      const sc = SCENES[key]();
      CUT = { sc, i: -1, t: 0, onEnd, eye: cam.eye.slice(), at: cam.at.slice(), fov: 0.8, kfPose: null };
      if (PH) photoOff();
      if (REC) recStop();
      julie.perf = null; julie.act = null; julie.follow = false;
      Object.assign(S, { x: sc.K[0], z: sc.K[1], y: sc.ky ?? H(sc.K[0], sc.K[1]), speed: 0, mode: "ground", air: null, grind: null, man: null, hop: null, fakie: false, head: sc.kHead ?? Math.atan2(sc.d[0], sc.d[1]) - Math.PI / 2 });
      julie.x = sc.J[0]; julie.z = sc.J[1]; julie.head = sc.jHead ?? Math.atan2(-sc.d[0], -sc.d[1]) - Math.PI / 2;
      if (sc.ear && !EAR) { EAR = { kf: ART.makeRig(Rn, ART.LOOKS.kf_ear), ju: ART.makeRig(Rn, ART.LOOKS.julie_ear), kfN: ART.makeRig(Rn, ART.LOOKS.kf) }; objs.push(EAR.kf.objs[0], EAR.ju.objs[0], EAR.kfN.objs[0]); }
      if (EAR) EAR.kf.objs[0].hidden = EAR.ju.objs[0].hidden = EAR.kfN.objs[0].hidden = true;
      if (sc.sit) rig.board.hidden = julie.rig.board.hidden = true;
      if (soffer) { soffer = null; }
      ui.mission && ui.mission("hide");
      ui.cut && ui.cut("start");
      if (RADIO_ && RADIO_.special && !sc.ear) RADIO_.special("juntos");
      return true;
    }
    function endCut() {
      const c = CUT;
      CUT = null;
      ui.cut && ui.cut("end");
      julie.state = "go";
      if (EAR) EAR.kf.objs[0].hidden = EAR.ju.objs[0].hidden = EAR.kfN.objs[0].hidden = true;
      rig.objs[0].hidden = false; rig.board.hidden = false; julie.rig.board.hidden = false;
      cones.forEach((o) => (o.hidden = true)); cable.forEach((o) => (o.hidden = true));
      if (c && c.sc.sit) { S.y = H(S.x, S.z); S.z -= 2.5; S.y = H(S.x, S.z); julie.z -= 2.5; }
      if (RADIO_ && RADIO_.special && !julie.follow) RADIO_.special(null);
      if (c && c.onEnd) c.onEnd();
    }
    function cutFrame(dt, t) {
      const C = CUT, shots = C.sc.shots;
      C.t += dt;
      let acc = 0, i = 0;
      while (i < shots.length && C.t > acc + shots[i].dur) { acc += shots[i].dur; i++; }
      if (i >= shots.length) return endCut();
      const sh = shots[i], lt = C.t - acc, u = lt / sh.dur;
      if (i !== C.i) { C.i = i; ui.cut && ui.cut("line", { who: sh.who, text: sh.text, n: i }); }
      const cv = sh.cam(u);
      C.eye = cv.eye; C.at = cv.at; C.fov = cv.fov;
      if (sh.lean) {
        // com calma: os dois lado a lado, curtindo o som e balançando a cabeça (sem deitar no ombro)
        const k = sh.lean === 2 ? 1 : Math.min(1, Math.max(0, (lt - 0.5) / 1.6)), e = k * k * (3 - 2 * k), bob = Math.sin(lt * 4.2) * 0.04 * e;
        sh.jx = () => 0.34 - 0.03 * e;
        sh.kf = (t) => SIT({ hy: 0.06 + 0.05 * e, hp: 0.04 + bob, hr: 0.03 * e, twist: 0.04 });
        sh.ju = (t) => SIT({ roll: -0.04 * e, lean: -0.03, hy: -0.08 * e, hp: 0.02 * e - bob, hr: -0.06 * e, hB: [0.22, 0.72, -0.22], hF: [0.3, 0.66, 0.2] });
      }
      C.kfPose = sh.kf(lt);
      const sc = C.sc;
      if (sh.music && !C.musicOn) { C.musicOn = true; if (RADIO_ && RADIO_.special) RADIO_.special("juntos"); }
      // K.F. com o fone de botão (rig só da cena) ou o normal
      if (sc.sit && EAR) {
        // cena sentada: K.F. é um boneco só da cena (com ou sem o fone grande)
        rig.objs[0].hidden = true; rig.board.hidden = true;
        const kr0 = sh.kfEar ? EAR.kf : EAR.kfN;
        EAR.kf.objs[0].hidden = kr0 !== EAR.kf; EAR.kfN.objs[0].hidden = kr0 !== EAR.kfN;
        C.kfCur = ART.lerpPose(C.kfCur || C.kfPose, C.kfPose, Math.min(1, dt * 12));
        C.kfCur.stand = C.kfPose.stand; C.kfCur.hr = C.kfPose.hr || 0; C.kfCur.roll = C.kfPose.roll || 0;
        const kb = M.mul(M.T(S.x, S.y, S.z), M.RY(S.head));
        kr0.pose(kb, C.kfCur, kb);
      } else {
        rig.objs[0].hidden = false; if (EAR) EAR.kf.objs[0].hidden = true;
        if (sc.sit) rig.board.hidden = true;
      }
      // Julie
      let jp = sh.ju(lt);
      const mv = sh.jmove && sh.jmove(lt);
      let base;
      if (mv) {
        const d = C.sc.d, J = C.sc.J;
        julie.x = J[0] + d[0] * mv.a; julie.z = J[1] + d[1] * mv.a;
        julie.head = angTo(julie.head, Math.atan2(d[0], d[1]), Math.min(1, dt * 8));
        jp = Object.assign({}, ART.POSES.ride, julie.look.ride);
      }
      if (sh.jx) julie.x = sh.jx(lt);
      else if (sc.sit) julie.x = sc.J[0];
      julie.cur = ART.lerpPose(julie.cur, jp || julie.cur, Math.min(1, dt * 12));
      if (jp) { julie.cur.hr = jp.hr || 0; julie.cur.roll = jp.roll || 0; julie.cur.stand = jp.stand; for (const k of ["fxF", "fxB"]) if (k in jp) julie.cur[k] = jp[k]; }
      base = M.mul(M.T(julie.x, sc.jy ?? H(julie.x, julie.z), julie.z), M.RY(julie.head));
      const jr = sh.juEar && EAR ? EAR.ju : julie.rig;
      julie.rig.objs[0].hidden = jr !== julie.rig;
      julie.rig.board.hidden = !!sc.sit;
      if (EAR) EAR.ju.objs[0].hidden = jr === julie.rig;
      jr.pose(base, julie.cur, base);
      if (!sc.sit) julie.rig.board.mo = base;
      jMark.hidden = true;
      // casquinhas nas mãos e o fio do fone ligando os dois
      const kr = sc.sit && EAR ? (sh.kfEar ? EAR.kf : EAR.kfN) : rig, kl = look;
      if (sh.cones) { coneAt(cones[0], handOf(kr, kl, "F")); coneAt(cones[1], handOf(jr, julie.look, "F")); }
      else cones.forEach((o) => (o.hidden = true));
      if (sh.cable && EAR && EAR.kf.F && EAR.ju.F) {
        const ks = (ART.LOOKS.kf_ear.scale || 1), js = (julie.look.scale || 1);
        const a = M.pt(EAR.kf.F[CHARS.BONE.head], [0.03 * ks, 0.19 * ks, 0.255 * ks]);
        const b = M.pt(EAR.ju.F[CHARS.BONE.head], [0.03 * js, 0.19 * js, -0.14 * js]);
        const mid = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 0.2, (a[2] + b[2]) / 2 - 0.1];
        cable[0].mo = lineM(a, mid); cable[1].mo = lineM(mid, b);
        cable.forEach((o) => (o.hidden = false));
      } else cable.forEach((o) => (o.hidden = true));
    }
    function acceptStory() {
      if (!soffer) return false;
      const o = soffer;
      soffer = null;
      if (o.toggle) {
        julie.follow = !julie.follow;
        if (RADIO_ && RADIO_.special) RADIO_.special(julie.follow ? "juntos" : null);
        ui.mission && ui.mission("hide");
        say(julie.follow ? "A JULIE TÁ ANDANDO COM VOCÊ" : "TCHAU, JULIE!", 1.8, true);
        return true;
      }
      const def = STORY.kf[o.step];
      SA = { def, pts: 0, left: def.time || 0, replay: replay != null };
      if (def.kind === "skate") SA.g = { round: 1, pl: 0, ju: 0, phase: "jprep", t: 1.5, att: null };
      if (def.kind === "ride" || def.kind === "ice") { julie.follow = true; if (RADIO_ && RADIO_.special) RADIO_.special("juntos"); }
      sfx.beep();
      ui.mission && ui.mission("start", { title: def.title });
      return true;
    }
    const RADIO_ = typeof RADIO !== "undefined" ? RADIO : null;

    // ---------- clima: hora do dia e chuva ----------
    // paletas por hora (0 = fim de tarde, ciclo completo em CYCLE segundos)
    const SKY = [
      { t: 0.0, sun: [-0.45, 0.78, 0.42], top: 0x1f78ff, mid: 0x6cc4ff, hz: 0xffe2b0, fog: 0xf3e2cf, shade: 0x8f7fd6, amb: [1, 1, 1], night: 0 },
      { t: 0.22, sun: [-0.8, 0.3, 0.45], top: 0x3550c0, mid: 0xf08f78, hz: 0xffb46e, fog: 0xf2bf9c, shade: 0x7a62b8, amb: [1.02, 0.9, 0.84], night: 0 },
      { t: 0.32, sun: [-0.85, 0.16, 0.4], top: 0x241f6e, mid: 0xb4588c, hz: 0xff8a5c, fog: 0xb07a8c, shade: 0x5a4a9a, amb: [0.78, 0.66, 0.78], night: 0.35 },
      { t: 0.42, sun: [0.42, 0.72, -0.3], top: 0x080c28, mid: 0x18225a, hz: 0x3c3474, fog: 0x1e2250, shade: 0x2c3170, amb: [0.34, 0.38, 0.64], night: 1 },
      { t: 0.8, sun: [0.42, 0.72, -0.3], top: 0x080c28, mid: 0x18225a, hz: 0x3c3474, fog: 0x1e2250, shade: 0x2c3170, amb: [0.34, 0.38, 0.64], night: 1 },
      { t: 0.9, sun: [0.8, 0.22, -0.4], top: 0x3d5ccc, mid: 0xf3b6c8, hz: 0xffd6ae, fog: 0xf0cfc6, shade: 0x8676c6, amb: [0.86, 0.82, 0.9], night: 0.2 },
      { t: 1.0, sun: [-0.45, 0.78, 0.42], top: 0x1f78ff, mid: 0x6cc4ff, hz: 0xffe2b0, fog: 0xf3e2cf, shade: 0x8f7fd6, amb: [1, 1, 1], night: 0 },
    ].map((k) => ({ ...k, sun: V.norm(k.sun), top: hex(k.top), mid: hex(k.mid), hz: hex(k.hz), fog: hex(k.fog), shade: hex(k.shade) }));
    const CYCLE = 480;
    // hora fixa de cada modo: dia, pôr do sol (dourado), noite
    const TOD = { dia: 0.02, tarde: 0.25, noite: 0.6 };
    const ATM = { mode: opt.time || "tarde", rainMode: opt.rain || "off", tod: TOD[opt.time || "tarde"] ?? 0.25, rain: 0, rainT: 0, raining: false, nextW: 40 };
    const lerpA = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
    const allLights = L.lights;
    let lightT = 0;
    // chuva: riscos finos num bloco que acompanha a câmera e desce em loop
    const RAIN_H = 14, RAIN_W = 34;
    const rainM = new Mesh();
    {
      const R = ART.rng(77), col = [0.78, 0.84, 0.98];
      for (let i = 0; i < 900; i++) {
        const x = (R() - 0.5) * RAIN_W, z = (R() - 0.5) * RAIN_W, y = R() * RAIN_H, len = 0.45 + R() * 0.35;
        const a = [x, y, z], b = [x + 0.05, y + len, z + 0.03], w = 0.008;
        rainM.quad([a[0] - w, a[1], a[2]], [a[0] + w, a[1], a[2]], [b[0] + w, b[1], b[2]], [b[0] - w, b[1], b[2]], col, 2);
        rainM.quad([a[0], a[1], a[2] - w], [a[0], a[1], a[2] + w], [b[0], b[1], b[2] + w], [b[0], b[1], b[2] - w], col, 2);
      }
    }
    const rainG = Rn.upload(rainM, { outline: false });
    const rainO = [add(rainG, M.I(), { hidden: true }), add(rainG, M.I(), { hidden: true })];
    function atmos(dt, t) {
      if (ATM.mode === "ciclo") ATM.tod = (ATM.tod + dt / CYCLE) % 1;
      else {
        const want = TOD[ATM.mode] ?? 0.25;
        ATM.tod += (want - ATM.tod) * Math.min(1, dt * 1.5);
      }
      // chuva às vezes: troca o tempo de tempos em tempos
      if (ATM.rainMode === "auto") {
        ATM.nextW -= dt;
        if (ATM.nextW <= 0) { ATM.raining = !ATM.raining && Math.random() < 0.6; ATM.nextW = ATM.raining ? 70 + Math.random() * 60 : 90 + Math.random() * 90; }
      } else ATM.raining = ATM.rainMode === "on";
      ATM.rain += ((ATM.raining ? 1 : 0) - ATM.rain) * Math.min(1, dt * 0.35);
      scene.wet += ((ATM.rain > 0.3 ? 1 : 0) - scene.wet) * Math.min(1, dt * (ATM.rain > 0.3 ? 0.18 : 0.05));
      let i = 0;
      while (i < SKY.length - 2 && SKY[i + 1].t <= ATM.tod) i++;
      const A = SKY[i], B = SKY[i + 1], k0 = (ATM.tod - A.t) / Math.max(1e-4, B.t - A.t), k = k0 * k0 * (3 - 2 * k0);
      const r = ATM.rain;
      const grey = (c, g) => lerpA(c, [g, g, g * 1.06], r * 0.55);
      scene.sun = V.norm(lerpA(A.sun, B.sun, k));
      const nt = A.night + (B.night - A.night) * k;
      scene.top = grey(lerpA(A.top, B.top, k), 0.42 - nt * 0.3);
      scene.mid = grey(lerpA(A.mid, B.mid, k), 0.6 - nt * 0.45);
      scene.hz = grey(lerpA(A.hz, B.hz, k), 0.7 - nt * 0.5);
      scene.fog = grey(lerpA(A.fog, B.fog, k), 0.66 - nt * 0.5);
      scene.shade = lerpA(A.shade, B.shade, k);
      scene.amb = lerpA(A.amb, B.amb, k).map((v) => v * (1 - r * 0.18));
      scene.night = Math.min(1, nt + r * 0.25);
      scene.fogd = 0.0046 * (1 + r * 1.6);
      // postes mais próximos da câmera (o shader ilumina até 24)
      lightT -= dt;
      if (lightT <= 0 && scene.night > 0.01) {
        lightT = 0.3;
        const e = cam.eye;
        const near = allLights.map((p) => [p, (p[0] - e[0]) ** 2 + (p[2] - e[2]) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, 24);
        scene.lights = new Float32Array(near.length * 3);
        near.forEach(([p], j) => scene.lights.set(p, j * 3));
      }
      const on = r > 0.04;
      const e = cam.eye, fall = (t * 16) % RAIN_H;
      rainO.forEach((o, j) => { o.hidden = !on; o.mo = M.T(e[0], e[1] - RAIN_H * 0.7 - fall + j * RAIN_H, e[2]); });
      if (ac && rainN) rainN.gain.setTargetAtTime(r * 0.11, ac.currentTime, 0.3);
    }

    // ---------- estado ----------
    const S = {
      mode: "ground", x: 0, y: 0, z: 14, head: Math.PI, speed: 0, vy: 0, vx: 0, vz: 0, fakie: false,
      air: null, grind: null, man: null, hop: null, bailT: 0, charge: 0, charging: false, landT: 0,
      combo: [], grace: 0, graceRevert: 0, revertOK: 0, special: 0, specialOn: false,
      score: 0, time: 120, run: "free", running: false, over: false, endWait: 0,
      cans: 2, tags: 0, letters: [], gapsFound: {}, bal: 0, balV: 0, balT: 0,
      msg: "", msgT: 0, msgBig: false, pitch: 0, camYaw: Math.PI, pushPh: 0, needCanT: 0, lastLand: "",
      bestCombo: 0,
    };
    let goals = {};
    try { goals = JSON.parse(localStorage.getItem("plaza2001-metas") || "{}"); } catch (e) {}
    const saveGoals = () => { try { localStorage.setItem("plaza2001-metas", JSON.stringify(goals)); } catch (e) {} };
    function goal(id) {
      if (goals[id]) return;
      goals[id] = 1;
      saveGoals();
      const g = GOALS.find((x) => x.id === id);
      ui.goal && ui.goal(g.t);
      sfx.goal();
    }

    // ---------- entrada ----------
    const keys = {};
    const edge = {};
    const lastTap = { up: -9, down: -9 };
    let clock = 0;
    function press(k, v) {
      if (v && !keys[k]) {
        edge[k] = true;

      }
      keys[k] = v;
      if (k === "jump" && !v) edge.jumpUp = true;
    }
    const dirKey = () => (keys.up ? "up" : keys.down ? "down" : keys.left ? "left" : keys.right ? "right" : "none");

    // ---------- som ----------
    let ac = null, sfxOut = null, musOut = null, music = null, roll = null, grindN = null, rainN = null;
    const sfx = {};
    function initAudio() {
      if (ac) return;
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      const comp = ac.createDynamicsCompressor();
      comp.connect(ac.destination);
      sfxOut = ac.createGain();
      sfxOut.gain.value = 0.6;
      sfxOut.connect(comp);
      musOut = ac.createGain();
      musOut.gain.value = 0.3;
      musOut.connect(comp);
      music = MUSIC(ac, musOut);
      const nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const loop = (type, f, q) => {
        const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
        s.buffer = nb;
        s.loop = true;
        fl.type = type;
        fl.frequency.value = f;
        fl.Q.value = q;
        g.gain.value = 0;
        s.connect(fl).connect(g).connect(sfxOut);
        s.start();
        return g;
      };
      roll = loop("lowpass", 420, 0.7);
      rainN = loop("bandpass", 2400, 0.35);
      grindN = loop("bandpass", 2600, 3);
      const tone = (f0, f1, dur, v, type = "triangle", delay = 0) => {
        const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + delay;
        o.type = type;
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f1, t + dur);
        g.gain.setValueAtTime(v, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(sfxOut);
        o.start(t);
        o.stop(t + dur + 0.02);
      };
      const hiss = (dur, v, f = 5000) => {
        const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
        s.buffer = nb;
        fl.type = "highpass";
        fl.frequency.value = f;
        g.gain.setValueAtTime(v, t);
        g.gain.linearRampToValueAtTime(v * 0.7, t + dur * 0.8);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        s.connect(fl).connect(g).connect(sfxOut);
        s.start(t);
        s.stop(t + dur);
      };
      Object.assign(sfx, {
        pop: () => { tone(900, 200, 0.04, 0.25, "square"); tone(160, 60, 0.12, 0.35, "sine"); },
        land: () => { tone(120, 50, 0.16, 0.45, "sine"); hiss(0.06, 0.08, 2000); },
        bail: () => { tone(200, 40, 0.5, 0.4, "sawtooth"); hiss(0.3, 0.15, 800); },
        bump: () => tone(110, 70, 0.1, 0.3, "square"),
        flip: () => hiss(0.05, 0.05, 3000),
        can: () => { tone(880, 1760, 0.12, 0.18); tone(1320, 2640, 0.14, 0.14, "triangle", 0.07); },
        letter: () => { [0, 4, 7, 12].forEach((n, i) => tone(523 * Math.pow(2, n / 12), 523 * Math.pow(2, n / 12), 0.1, 0.15, "square", i * 0.06)); },
        spray: () => { hiss(0.9, 0.22, 3500); tone(1200, 1200, 0.05, 0.1, "square"); },
        combo: (big) => { tone(660, 990, 0.12, 0.15, "triangle"); if (big) tone(990, 1480, 0.18, 0.15, "triangle", 0.08); },
        special: () => [0, 4, 7, 11, 14].forEach((n, i) => tone(440 * Math.pow(2, n / 12), 880 * Math.pow(2, n / 12), 0.2, 0.12, "sawtooth", i * 0.05)),
        goal: () => [0, 7, 12, 16, 19].forEach((n, i) => tone(392 * Math.pow(2, n / 12), 392 * Math.pow(2, n / 12), 0.18, 0.16, "square", i * 0.09)),
        nocan: () => tone(300, 200, 0.15, 0.15, "square"),
        snap: () => { tone(2600, 1800, 0.03, 0.12, "square"); hiss(0.07, 0.2, 4500); tone(900, 600, 0.05, 0.08, "square", 0.08); },
        beep: () => tone(1760, 1760, 0.09, 0.1, "sine"),
      });
    }
    for (const k of ["pop", "land", "bail", "bump", "flip", "can", "letter", "spray", "combo", "special", "goal", "nocan", "snap", "beep"]) sfx[k] = () => {};

    // ---------- combo ----------
    const say = (t, d = 1.6, big = false) => { S.msg = t; S.msgT = d; S.msgBig = big; };
    function addTrick(name, pts) {
      emit("trick", { name });
      const rep = S.combo.filter((c) => c.name === name).length;
      const p = Math.round(pts * Math.pow(0.6, rep));
      S.combo.push({ name, pts: p });
    }
    const comboBase = () => S.combo.reduce((s, c) => s + c.pts, 0);
    function commit() {
      if (!S.combo.length) return;
      const tot = comboBase() * S.combo.length;
      emit("combo", { pts: tot, names: S.combo.map((c) => c.name) });
      S.score += tot;
      S.bestCombo = Math.max(S.bestCombo, tot);
      const lbl = tot >= 15000 ? "INSANO!!" : tot >= 5000 ? "IRADO!" : tot >= 1500 ? "BOA!" : "";
      say(`${lbl ? lbl + "  " : ""}+${tot.toLocaleString("pt-BR")}`, 1.8, tot >= 1500);
      sfx.combo(tot >= 1500);
      if (!S.specialOn) {
        S.special = Math.min(1, S.special + tot / 3500);
        if (S.special >= 1) {
          S.specialOn = true;
          sfx.special();
          say("ESPECIAL PRONTO! aperte E", 1.8, true);
        }
      }
      if (tot >= 5000) goal("combo5");
      if (tot >= 15000) goal("combo15");
      if (S.run === "session" && S.score >= 30000) goal("score");
      S.combo = [];
      S.grace = 0;
    }
    function bail(why) {
      emit("bail", {});
      S.mode = "bail";
      S.bailT = 1.5;
      S.combo = [];
      S.grace = 0;
      S.air = null;
      S.grind = null;
      S.man = null;
      S.hop = null;
      S.special = 0;
      S.specialOn = false;
      const sp = S.mode === "air" ? Math.hypot(S.vx || 0, S.vz || 0) : S.speed;
      S.bailBoard = { x: S.x, y: S.y, z: S.z, vx: Math.sin(S.head) * sp * 0.9, vz: Math.cos(S.head) * sp * 0.9, vy: 2.5 + sp * 0.15, r: 0 };
      S.bailHead = S.head;
      S.bailT = 1.9;
      S.bailV = Math.max(1.2, sp * 0.7);
      S.bailRoll = Math.random() < 0.5 ? -1 : 1;
      S.bailY = S.y;
      say(why || "TOMBO!", 1.3, true);
      sfx.bail();
    }

    // ---------- corrimãos ----------
    function railNear(x, y, z, hr, below, above) {
      let best = null;
      for (const r of L.rails) {
        const dx = r.b[0] - r.a[0], dz = r.b[2] - r.a[2], L2 = dx * dx + dz * dz;
        let t = ((x - r.a[0]) * dx + (z - r.a[2]) * dz) / L2;
        if (t < 0.01 || t > 0.99) continue;
        const px = r.a[0] + dx * t, pz = r.a[2] + dz * t, py = r.a[1] + (r.b[1] - r.a[1]) * t;
        const d = Math.hypot(x - px, z - pz);
        const dy = y - py;
        if (d < hr && dy > -below && dy < above) {
          const sc = d + Math.abs(dy) * 0.5;
          if (!best || sc < best.sc) best = { r, t, sc, p: [px, py, pz] };
        }
      }
      return best;
    }
    function startGrind(n, dirName) {
      const r = n.r;
      const d3 = V.sub(r.b, r.a), len = V.len(d3);
      const hv = [Math.sin(S.head), Math.cos(S.head)];
      const sgn = hv[0] * d3[0] + hv[1] * d3[2] >= 0 ? 1 : -1;
      // pousar no grind no meio de um flip = tombo
      if (S.air && S.air.flip && S.air.flip.t > 0.32 && S.air.flip.t < 0.6) return bail();
      finishAir(false);
      let name = grName(dirName) || grName("none");
      if (r.kind === "wire") name = "Fio: " + name;
      if (r.kind === "coping" && dirName === "none") name = "Lip 50-50";
      S.mode = "grind";
      S.grind = { r, t: n.t, sgn, len, name, el: 0, startT: n.t, type: dirName, special: false };
      emit("grind", { rail: r.name || r.kind, name });
      S.speed = Math.max(S.speed, 4.2);
      S.bal = (Math.random() - 0.5) * 0.2;
      S.balV = 0;
      S.balT = 0;
      S.y = n.p[1];
      if (r.kind === "wire" && !S.gapsFound["FIO NO CÉU"]) { gapHit("FIO NO CÉU", 750); goal("fio"); }
      else if (r.kind === "wire") gapHit("FIO NO CÉU", 750);
      sfx.land();
    }
    function endGrindTrick() {
      const g = S.grind;
      const base = g.special ? 800 : 100;
      const rate = g.special ? 450 : 150;
      addTrick(g.special ? "Faísca Longa" : g.name, base + g.el * rate);
      if (g.r.stair && Math.abs(g.t - g.startT) > 0.8) gapHit("CORRIMÃO INTEIRO", 250);
    }
    function gapHit(name, pts) {
      emit("gap", { name });
      addTrick("GAP: " + name, pts);
      if (!S.gapsFound[name]) {
        S.gapsFound[name] = 1;
        if (Object.keys(S.gapsFound).length >= 4) goal("gaps");
      }
    }

    function startPlant(qq) {
      const a = S.air;
      if (a.grab) { addTrick(a.grab.name, 150 + Math.round(a.grab.t * 260)); a.grab = null; }
      S.mode = "plant";
      S.plant = { t: 0, dur: 1.2, cop: [S.x, L.RAD, qq.q.zLip], y0: S.y, head0: a.vert.head0 };
      S.air = null;
      S.vy = 0;
      sfx.land();
    }
    // ---------- ar ----------
    function goAir(vy, vx, vz, vert) {
      S.mode = "air";
      S.vy = vy;
      S.vx = vx;
      S.vz = vz;
      S.air = { t: 0, spin: 0, spinV: 0, flip: null, flips: {}, grab: null, vert: vert || null, take: { x: S.x, y: S.y, z: S.z }, special: null, grabbed: 0 };
      S.grace = 0;
    }
    function finishAir(landing) {
      const a = S.air;
      if (!a) return;
      if (a.grab) {
        addTrick(a.grab.name, 150 + Math.round(a.grab.t * 260));
        a.grab = null;
      }
      if (landing) {
        const k = Math.round(a.spin / Math.PI);
        if (k !== 0) {
          const n = Math.abs(k) * 180;
          addTrick(`${a.spin > 0 ? "FS" : "BS"} ${n}`, Math.abs(k) * 90 + k * k * 30);
        }
      }
    }
    function land() {
      const a = S.air;
      const g = H(S.x, S.z);
      // checagens de tombo
      if (a.flip && a.flip.t > 0.32 && a.flip.t < 0.6) return bail();
      // flip quase terminado conta (o shape "assenta" no pé)
      if (a.flip && a.flip.t >= 0.6) {
        const f = a.flip;
        a.flips[f.key] = (a.flips[f.key] || 0) + 1;
        addTrick(fName(f.key), look.skates ? SK_PTS[f.key] || 250 : FLIPS[f.key].pts);
        a.flip = null;
      }
      if (a.grab && keys.grab && a.grab.t < 0.05) return bail();
      if (a.special && a.special.t < a.special.dur * 0.55) return bail();
      const k = Math.round(a.spin / Math.PI);
      const err = Math.abs(a.spin - k * Math.PI);
      if (err > 1.22) return bail("TORTO! TOMBO");
      finishAir(true);
      for (const gp of L.gaps) {
        if (gp.cond && !gp.cond(S)) continue;
        if (gp.from(a.take) && gp.to(S)) gapHit(gp.name, gp.pts);
      }
      if (a.t > 1.55 && !a.vert) gapHit("HANG TIME", 300);
      if (k % 2) S.fakie = !S.fakie;
      S.y = g;
      if (a.vert) {
        S.head = a.vert.head0 + Math.PI;
        S.speed = Math.min(12, Math.abs(S.vy) * 0.95);
        S.revertOK = 0.45;
      } else {
        const vhz = Math.hypot(S.vx, S.vz);
        const vh = Math.atan2(S.vx, S.vz);
        if (vhz > 0.3) S.head = vh;
        // projeta a velocidade na superfície: descida aproveita a queda, subida perde
        const s = slopeAt(S.x, S.z, Math.sin(S.head), Math.cos(S.head));
        const ca = 1 / Math.sqrt(1 + s * s), sa = s * ca;
        const along = vhz * ca + S.vy * sa; // vy negativo
        S.speed = Math.min(10, Math.max(0, along * (s < -0.05 ? 1 : 0.92)));
        S.lastSlope = s;
      }
      S.vy = 0;
      S.mode = "ground";
      S.air = null;
      S.landT = 0.22;
      sfx.land();
      if (S.combo.length) S.grace = 0.42;
    }

    // ---------- obstáculos sólidos (postes, troncos, cones, lixeira...) ----------
    const OB = L.obstacles || [];
    for (const n of NPCS) OB.push(n.ob);

    // ---------- carros rodando pelas ruas (param se tiver gente ou outro carro na frente) ----------
    const CARS = (() => {
      const carG = [0xe0302b, 0xf5f1e6, 0x3f63c8, 0x1fae5a, 0xffd166, 0x7cc8ff, 0xff8fc8, 0x1b1530].map((col) => {
        const m = new Mesh(), c = hex(col), Lc = 3.9, Wc = 1.76, dark = hex(0x1b1a22);
        m.box(-Wc / 2, 0.3, -Lc / 2, Wc / 2, 0.95, Lc / 2, c, { top: V.mul(c, 1.04) });
        m.box(-Wc * 0.42, 0.95, -Lc * 0.32, Wc * 0.42, 1.5, Lc * 0.18, hex(0x3a4a7a), { top: c });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.tube([sx * (Wc / 2 - 0.02), 0.33, sz * (Lc / 2 - 0.75)], [sx * (Wc / 2 + 0.1), 0.33, sz * (Lc / 2 - 0.75)], 0.33, 0.33, 8, dark);
        for (const sx of [-0.55, 0.55]) {
          const f = Lc / 2 + 0.01, b = -Lc / 2 - 0.01;
          m.quad([sx - 0.18, 0.62, f], [sx + 0.18, 0.62, f], [sx + 0.18, 0.8, f], [sx - 0.18, 0.8, f], hex(0xfff6d8), 2);
          m.quad([sx + 0.18, 0.62, b], [sx - 0.18, 0.62, b], [sx - 0.18, 0.8, b], [sx + 0.18, 0.8, b], hex(0xe0302b), 2);
        }
        return Rn.upload(m);
      });
      const shG = Rn.upload(new Mesh().decal([0, 0.03, 0], [1, 0, 0], [0, 0, -1], 2.4, 4.6, ART.RECT.shadow, [1, 1, 1], 5), { outline: false });
      const shBus = Rn.upload(new Mesh().decal([0, 0.03, 0], [1, 0, 0], [0, 0, -1], 3.2, 11.4, ART.RECT.shadow, [1, 1, 1], 5), { outline: false });
      const wheel = (m, x, z, r = 0.45) => { const d = x > 0 ? 1 : -1; m.tube([x - d * 0.02, r, z], [x + d * 0.12, r, z], r, r, 8, hex(0x1b1a22)); };
      // ônibus circular: branco com faixa azul e amarela, janelas escuras e letreiro aceso
      const busG = (() => {
        const m = new Mesh(), Lb = 10.4, Wb = 2.5, body = hex(0xf4f1e8), blue = hex(0x2457c8), yel = hex(0xffd23f), glass = hex(0x2b3a67);
        m.box(-Wb / 2, 0.35, -Lb / 2, Wb / 2, 3.0, Lb / 2, body, { top: hex(0xdcd8cc) });
        for (const sx of [-1, 1]) {
          const x = sx * (Wb / 2 + 0.012);
          const q = (y0, y1, z0, z1, c, mm = 0) => sx > 0 ? m.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], c, mm) : m.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], c, mm);
          q(1.55, 2.6, -Lb / 2 + 0.4, Lb / 2 - 1.2, glass);
          q(0.9, 1.2, -Lb / 2 + 0.1, Lb / 2 - 0.1, blue);
          q(1.2, 1.32, -Lb / 2 + 0.1, Lb / 2 - 0.1, yel);
          wheel(m, sx * Wb / 2, Lb / 2 - 1.8); wheel(m, sx * Wb / 2, -Lb / 2 + 2.2);
        }
        const f = Lb / 2 + 0.012;
        m.quad([-1.1, 1.4, f], [1.1, 1.4, f], [1.1, 2.6, f], [-1.1, 2.6, f], glass);
        m.quad([-0.9, 2.66, f], [0.9, 2.66, f], [0.9, 2.92, f], [-0.9, 2.92, f], hex(0xffb03a), 2);
        for (const sx of [-0.9, 0.9]) {
          m.quad([sx - 0.15, 0.6, f], [sx + 0.15, 0.6, f], [sx + 0.15, 0.8, f], [sx - 0.15, 0.8, f], hex(0xfff6d8), 2);
          m.quad([sx + 0.15, 0.6, -f], [sx - 0.15, 0.6, -f], [sx - 0.15, 0.8, -f], [sx + 0.15, 0.8, -f], hex(0xe0302b), 2);
        }
        m.quad([1.1, 1.0, -f], [-1.1, 1.0, -f], [-1.1, 2.4, -f], [1.1, 2.4, -f], glass);
        // para-choque traseiro (onde dá pra pegar rabeira)
        m.box(-1.2, 0.35, -Lb / 2 - 0.18, 1.2, 0.55, -Lb / 2, hex(0x6a6a7a));
        return Rn.upload(m);
      })();
      // Kombi da pamonha: saia e frente brancas, teto e meio verde, alto-falante no teto
      const kombiG = (() => {
        const m = new Mesh(), Lk = 4.4, Wk = 1.75, w = hex(0xf5f1e6), g = hex(0x3fae5c);
        m.box(-Wk / 2, 0.3, -Lk / 2, Wk / 2, 1.05, Lk / 2, g, { top: g });
        m.box(-Wk / 2, 1.05, -Lk / 2, Wk / 2, 1.95, Lk / 2, w, { top: w });
        for (const sx of [-1, 1]) {
          const x = sx * (Wk / 2 + 0.012);
          const q = (y0, y1, z0, z1, c) => sx > 0 ? m.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], c) : m.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], c);
          q(1.25, 1.75, -Lk / 2 + 0.3, Lk / 2 - 0.4, hex(0x2b3a67));
          wheel(m, sx * Wk / 2, Lk / 2 - 0.7, 0.33); wheel(m, sx * Wk / 2, -Lk / 2 + 0.8, 0.33);
        }
        const f = Lk / 2 + 0.012;
        m.quad([-0.8, 1.2, f], [0.8, 1.2, f], [0.8, 1.8, f], [-0.8, 1.8, f], hex(0x2b3a67));
        m.quad([-0.2, 0.75, f], [0.2, 0.75, f], [0.2, 1.05, f], [-0.2, 1.05, f], hex(0xc0c6d2));
        for (const sx of [-0.62, 0.62]) m.quad([sx - 0.13, 0.62, f], [sx + 0.13, 0.62, f], [sx + 0.13, 0.82, f], [sx - 0.13, 0.82, f], hex(0xfff6d8), 2);
        m.box(-0.5, 1.95, -0.9, 0.5, 2.0, 0.9, hex(0x6a6a7a));
        m.tube([0, 2.15, 0.2], [0, 2.15, 0.75], 0.12, 0.32, 8, hex(0xd5dbe8));
        m.tube([0, 2.0, 0.2], [0, 2.15, 0.2], 0.05, 0.05, 5, hex(0x6a6a7a));
        return Rn.upload(m);
      })();
      // rotas: anel da cidade velha e anel da cidade nova, nos dois sentidos (mão direita)
      const RT = [
        [[-42.5, -204.5], [40.5, -204.5], [40.5, 36.5], [-42.5, 36.5]],
        [[-42.5, 104.5], [40.5, 104.5], [40.5, 204.5], [-42.5, 204.5]],
      ];
      const lanes = [];
      for (const P0 of RT) for (const rev of [false, true]) {
        const P = rev ? P0.slice().reverse() : P0, n = P.length, LANE = 1.6;
        const corners = P.map((b, i) => {
          const a = P[(i - 1 + n) % n], c = P[(i + 1) % n];
          const d1 = V.norm([b[0] - a[0], 0, b[1] - a[1]]), d2 = V.norm([c[0] - b[0], 0, c[1] - b[1]]);
          return { p: [b[0] + (-d1[2] - d2[2]) * LANE, b[1] + (d1[0] + d2[0]) * LANE], d1, d2 };
        });
        // cada esquina vira 3 pontos (5 m antes, a esquina, 5 m depois): a curva fica dentro do cruzamento
        let pts = [];
        for (const c of corners) pts.push([c.p[0] - c.d1[0] * 5, c.p[1] - c.d1[2] * 5], c.p, [c.p[0] + c.d2[0] * 5, c.p[1] + c.d2[2] * 5]);
        // arredonda as esquinas (Chaikin) e guarda o comprimento acumulado
        for (let it = 0; it < 4; it++) {
          const q = [];
          pts.forEach((a, i) => { const b = pts[(i + 1) % pts.length]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); });
          pts = q;
        }
        const cum = [0];
        for (let i = 1; i <= pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i % pts.length][0] - pts[i - 1][0], pts[i % pts.length][1] - pts[i - 1][1]));
        lanes.push({ pts, cum, len: cum[cum.length - 1] });
      }
      const at = (ln, s) => {
        s = ((s % ln.len) + ln.len) % ln.len;
        let lo = 0, hi = ln.cum.length - 1;
        while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ln.cum[m] <= s) lo = m; else hi = m; }
        const a = ln.pts[lo], b = ln.pts[(lo + 1) % ln.pts.length], f = (s - ln.cum[lo]) / (ln.cum[lo + 1] - ln.cum[lo] || 1);
        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(b[0] - a[0], b[1] - a[1])];
      };
      const list = [];
      // quem roda em cada pista: ônibus circular nos dois anéis, a Kombi da pamonha no anel velho
      const stopsNear = (ln) => (L.stops || []).filter((st) => { for (let q = 0; q < ln.len; q += 1) { const p = at(ln, q); if (Math.hypot(p[0] - st[0], p[1] - st[1]) < 6) return true; } return false; }).length;
      const sc = lanes.map(stopsNear), PLAN = [];
      for (let r = 0; r < lanes.length; r += 2) {
        const busL = sc[r + 1] > sc[r] ? r + 1 : r;
        PLAN[busL] = ["bus", "car", "car"];
        PLAN[busL === r ? r + 1 : r] = r === 0 ? ["kombi", "car", "car"] : ["car", "car", "car"];
      }
      lanes.forEach((ln, li) => {
        const kinds = PLAN[li] || ["car", "car", "car"], N = kinds.length;
        kinds.forEach((kind, i) => {
          const len = kind === "bus" ? 10.4 : kind === "kombi" ? 4.4 : 3.9;
          const c = { kind, len, ln, pos: (q) => at(ln, q), s: (ln.len * (i + (li % 2) * 0.5)) / N, v: 6, vmax: kind === "bus" ? 6.2 : kind === "kombi" ? 4.2 : 6.5 + ((i * 3 + li) % 4) * 0.6, head: 0, x: 0, z: 0, wait: 0, honk: 0, stopT: 0, served: -1 };
          c.o = add(kind === "bus" ? busG : kind === "kombi" ? kombiG : carG[(li * 3 + i) % carG.length], M.I());
          c.sh = add(kind === "bus" ? shBus : shG, M.I());
          const n = kind === "bus" ? 4 : 2;
          c.obs = Array.from({ length: n }, () => ({ x: 0, z: 0, r: kind === "bus" ? 1.3 : 0.95, y1: 1.5 }));
          OB.push(...c.obs);
          // pontos de ônibus que essa pista passa perto
          c.stops = [];
          if (kind === "bus") for (const st of L.stops || []) {
            let best = null;
            for (let q = 0; q < ln.len; q += 0.5) { const p = at(ln, q), d = Math.hypot(p[0] - st[0], p[1] - st[1]); if (!best || d < best.d) best = { q, d }; }
            if (best && best.d < 6.0) c.stops.push(best.q);
          }
          list.push(c);
        });
      });
      return list;
    })();
    // rabeira: segura (L) no para-choque do ônibus e vai junto
    let HITCH = null;
    function hitchFrame(dt) {
      if (!HITCH) {
        if (!keys.grab || S.mode !== "ground" || CUT || PH) return;
        for (const c of CARS) {

          const fx = Math.sin(c.head), fz = Math.cos(c.head);
          const bx = c.x - fx * (c.len / 2 + 0.9), bz = c.z - fz * (c.len / 2 + 0.9);
          if (Math.hypot(S.x - bx, S.z - bz) < 1.8) { HITCH = { c }; say(c.kind === "bus" ? "RABEIRA NO CIRCULAR! (solte o L pra largar)" : c.kind === "kombi" ? "RABEIRA NA KOMBI DA PAMONHA!" : "RABEIRA NO CARRO! (solte o L pra largar)", 2, true); sfx.bump(); break; }
        }
        return;
      }
      const c = HITCH.c, fx = Math.sin(c.head), fz = Math.cos(c.head);
      if (!keys.grab || S.mode !== "ground") { HITCH = null; S.speed = Math.max(S.speed, c.v); say("SOLTOU!", 1); return; }
      S.x = c.x - fx * (c.len / 2 + 0.75); S.z = c.z - fz * (c.len / 2 + 0.75);
      S.y = H(S.x, S.z);
      S.head = c.head; S.speed = c.v; S.fakie = false;
      S.score += dt * c.v * 3;
    }
    function carFrame(dt) {
      const e = cam.eye;
      for (const c of CARS) {
        const [x, z, hd] = c.pos(c.s);
        const fx = Math.sin(hd), fz = Math.cos(hd);
        // tem alguém na frente? (skatista, morador ou outro carro)
        let block = 0, byPlayer = false;
        const chk = (px, pz, py) => {
          const rx = px - x, rz = pz - z, along = rx * fx + rz * fz, lat = Math.abs(-rx * fz + rz * fx);
          return along > 1.2 && along < 8.5 && lat < 1.5 && (py == null || py < 2.5) ? along : 0;
        };
        const half = (c.len - 3.9) / 2;
        const pb = HITCH && HITCH.c === c ? 0 : chk(S.x, S.z, S.y - H(S.x, S.z));
        if (pb) { block = Math.max(0.01, pb - half); byPlayer = true; }
        for (const n of NPCS) { let b = chk(n.x, n.z); if (b) { b = Math.max(0.01, b - half); if (!block || b < block) block = b; } }
        for (const o of CARS) if (o !== c && o.ln === c.ln) {
          let gap = ((o.s - c.s) % c.ln.len + c.ln.len) % c.ln.len;
          gap -= (c.len + o.len) / 2 - 3.9;
          if (gap > -3 && gap < 8.5 && (!block || gap < block)) block = Math.max(0.01, gap);
        }
        // ônibus encosta no ponto e espera um pouco
        if (c.kind === "bus") {
          for (const q of c.stops) {
            const ahead = ((q - c.s) % c.ln.len + c.ln.len) % c.ln.len;
            if (c.served === q) { if (ahead > 2 && ahead < c.ln.len - 20) c.served = -1; continue; }
            if (ahead < 0.6 || ahead > c.ln.len - 1) { c.stopT += dt; block = 0.01; if (c.stopT > 4.5) { c.served = q; c.stopT = 0; } }
            else if (ahead < 14) { const b = 2.6 + ahead; if (!block || b < block) block = b; }
          }
        }
        const want = block ? Math.max(0, (block - 2.6) * 1.6) : c.vmax;
        c.v += (Math.min(want, c.vmax) - c.v) * Math.min(1, dt * (want < c.v ? 5 : 1.2));
        if (c.v < 0.05) c.v = 0;
        c.s += c.v * dt;
        // buzina quando o skatista fica parado na frente
        if (byPlayer && c.v < 0.3) { c.wait += dt; if (c.wait > 1.6 && c.honk <= 0 && Math.hypot(S.x - x, S.z - z) < 12) { sfx.beep(); say("BII-BIII!", 0.9); c.honk = 5; } }
        else c.wait = 0;
        c.honk -= dt;
        c.head = hd;
        const y = H(x, z);
        c.x = x; c.z = z;
        // inclina na ladeira
        const sl = (H(x + fx * 1.4, z + fz * 1.4) - H(x - fx * 1.4, z - fz * 1.4)) / 2.8;
        c.pitch = (c.pitch || 0) + (Math.atan(sl) - (c.pitch || 0)) * Math.min(1, dt * 6);
        c.o.mo = M.mul(M.T(x, y, z), M.mul(M.RY(hd), M.RX(-c.pitch)));
        c.sh.mo = M.mul(M.T(x, y, z), M.mul(M.RY(hd), M.RX(-c.pitch)));
        const far = Math.hypot(x - e[0], z - e[2]) > 160;
        c.o.hidden = c.sh.hidden = far;
        const nO = c.obs.length, span = c.len / 2 - (c.kind === "bus" ? 1.3 : 0.95);
        c.obs.forEach((ob, k) => {
          const a = nO > 1 ? -span + (2 * span * k) / (nO - 1) : 0;
          ob.x = x + fx * a; ob.z = z + fz * a;
          ob.y1 = HITCH && HITCH.c === c ? -99 : y + (c.kind === "bus" ? 3.0 : c.kind === "kombi" ? 1.95 : 1.5);
        });
        // Kombi da pamonha anunciando no alto-falante
        if (c.kind === "kombi") {
          c.ann = (c.ann || 6) - dt;
          if (c.ann <= 0 && Math.hypot(S.x - x, S.z - z) < 26 && !CUT) { c.ann = 9; say(["🔊 PAMONHA FRESQUINHA, CURAU E BOLO DE MILHO!", "🔊 OLHA A PAMONHA! É DE MILHO VERDE, FREGUESA!", "🔊 PAMONHA DOCE, PAMONHA SALGADA!"][Math.floor(Math.random() * 3)], 2.6); }
        }
      }
    }
    function blocked(x, z, y) {
      for (const o of OB) {
        if (y > o.y1) continue;
        if (o.r) { if (Math.hypot(x - o.x, z - o.z) < o.r + 0.28) return o; }
        else if (x > o.x0 - 0.28 && x < o.x1 + 0.28 && z > o.z0 - 0.28 && z < o.z1 + 0.28) return o;
      }
      return null;
    }
    // ---------- chão ----------
    function slopeAt(x, z, dx, dz) {
      return (H(x + dx * 0.25, z + dz * 0.25) - H(x - dx * 0.25, z - dz * 0.25)) / 0.5;
    }
    function moveGround(dt, push) {
      const dx = Math.sin(S.head), dz = Math.cos(S.head);
      const s = Math.max(-12, Math.min(12, slopeAt(S.x, S.z, dx, dz)));
      const ca = 1 / Math.sqrt(1 + s * s), sa = s * ca;
      S.speed -= 9.8 * sa * dt * (sa > 0 ? 0.72 : 0.92);
      // atrito de rolagem: o skate para sozinho se ninguém remar (sem "andar sozinho")
      const brake = keys.down && S.mode === "ground" ? 5.5 : 0;
      if (Math.abs(s) < 0.05) S.speed -= (0.45 + 0.06 * S.speed + brake) * dt;
      else S.speed -= (0.06 * S.speed + brake) * dt;
      const maxV = look.skates ? 9.5 : 9;
      // dá pra remar em ladeira (até ~30%); rampa de pista continua sem remada
      if (push && keys.up && Math.abs(s) < 0.3) {
        // remada: só empurra quando o pé está no chão (primeira parte do ciclo)
        S.pushPh += dt * (look.skates ? 1.9 : 1.45);
        const ph = S.pushPh % 1;
        if (ph < 0.5 && S.speed < maxV) S.speed += ((look.skates ? 7.5 : 8.5) + Math.max(0, s) * 14) * dt;
      } else if (S.pushPh > 0) {
        // termina a passada antes de voltar o pé pro shape
        const ph = S.pushPh % 1;
        S.pushPh = ph > 0.5 ? S.pushPh + dt * 1.6 : 0;
        if (S.pushPh % 1 < ph) S.pushPh = 0;
      }
      if (!(push && keys.up) && Math.abs(s) < 0.05 && S.speed < 0.08) S.speed = 0;
      if (S.speed < 0) {
        S.speed = -S.speed;
        S.head += Math.PI;
        S.fakie = !S.fakie;
        // patins sempre de frente: ela gira o corpo na volta da rampa em vez de estalar 180°
        if (look.skates && skFwd) S.turnOff = (S.turnOff || 0) - Math.PI;
        return null;
      }
      const ndx = Math.sin(S.head), ndz = Math.cos(S.head);
      const st = S.speed * ca * dt;
      const nx = S.x + ndx * st, nz = S.z + ndz * st;
      // vert: chegou na parte reta do quarter pipe
      const q = L.qpAt(nx, nz);
      if (q && q.d > L.RAD - 0.14 && ndz * -q.q.dir < -0.35) {
        const d = L.RAD - 0.08;
        S.z = q.q.zBot + q.q.dir * d;
        S.x = nx;
        S.y = H(S.x, S.z);
        const vy0 = Math.min(9.5, Math.max(3, S.speed * 1.0 + 1.0));
        goAir(vy0, 0, 0, { head0: S.head, T: (2 * vy0) / G });
        return "vert";
      }
      const h1 = H(nx, nz);
      const ob = blocked(S.x, S.z, S.y) ? null : blocked(nx, nz, S.y);
      if (h1 - S.y > 0.14 || ob) {
        let bx, bz;
        if (ob) { bx = !!blocked(nx, S.z, S.y); bz = !!blocked(S.x, nz, S.y); }
        else { bx = H(nx, S.z) - S.y > 0.14; bz = H(S.x, nz) - S.y > 0.14; }
        // de frente e rápido: tombo; de raspão: desliza junto da parede
        const head_on = (bx && Math.abs(ndx) > 0.8) || (bz && Math.abs(ndz) > 0.8) || (bx && bz);
        if (head_on && S.speed > 8.8) { bail("BATEU!"); return "bail"; }
        let vx = ndx, vz = ndz;
        if (bx) vx = 0;
        if (bz) vz = 0;
        if (!bx && !bz) { vx = -ndx; vz = -ndz; }
        if (Math.hypot(vx, vz) < 0.2) { vx = -ndx; vz = -ndz; S.speed *= 0.3; }
        else S.speed *= 0.7;
        S.head = Math.atan2(vx, vz);
        sfx.bump();
        return "bump";
      }
      if (S.y - h1 > 0.1 + (S.landT > 0 ? 0.12 : 0) && S.speed > 1) {
        const ls = Math.max(0, S.lastSlope || 0);
        S.x = nx;
        S.z = nz;
        goAir(ls * S.speed * ca * 0.95, ndx * S.speed * ca, ndz * S.speed * ca);
        return "air";
      }
      S.x = nx;
      S.z = nz;
      S.y = h1;
      S.lastSlope = slopeAt(S.x, S.z, ndx, ndz);
      return null;
    }
    function ollie(extra = 0) {
      const ls = Math.max(0, Math.min(2.5, S.lastSlope || 0));
      const ca = 1 / Math.sqrt(1 + ls * ls);
      const vy = 5.4 + S.charge * 2.2 + ls * S.speed * ca * 0.75 + extra;
      const dx = Math.sin(S.head), dz = Math.cos(S.head);
      goAir(vy, dx * S.speed * ca, dz * S.speed * ca);
      S.air.ollied = true;
      S.charge = 0;
      sfx.pop();
    }

    // ---------- passo de simulação ----------
    function step(dt) {
      clock += dt;
      S.msgT -= dt;
      S.needCanT -= dt;
      S.landT = Math.max(0, S.landT - dt);
      S.revertOK = Math.max(0, S.revertOK - dt);
      if (S.run === "session" && S.running && !S.over) {
        S.time = Math.max(0, S.time - dt);
        if (S.time <= 0) {
          S.endWait += dt;
          if ((S.mode === "ground" && !S.combo.length) || S.mode === "bail" || S.endWait > 6) {
            commit();
            if (S.score >= 30000) goal("score");
            S.over = true;
            S.running = false;
            ui.end && ui.end(S);
          }
        }
      }
      const turn = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
      const dk = dirKey();
      if (S.mode === "bail") {
        S.bailT -= dt;
        const b = S.bailBoard;
        b.vy -= G * dt;
        b.x += b.vx * dt;
        b.z += b.vz * dt;
        b.y += b.vy * dt;
        b.r += dt * 9;
        const g = H(b.x, b.z);
        if (b.y < g) { b.y = g; b.vy = Math.abs(b.vy) * 0.3; b.vx *= 0.6; b.vz *= 0.6; }
        // o corpo desliza pra frente perdendo velocidade (sem atravessar parede)
        const nx = S.x + Math.sin(S.bailHead) * S.bailV * dt, nz = S.z + Math.cos(S.bailHead) * S.bailV * dt;
        if (H(nx, nz) - H(S.x, S.z) < 0.3 && !blocked(nx, nz, S.y)) { S.x = nx; S.z = nz; }
        else S.bailV = 0;
        S.bailV = Math.max(0, S.bailV - 7 * dt);
        const gy = H(S.x, S.z);
        S.bailY = Math.max(gy, S.bailY - dt * 6);
        S.y = S.bailY;
        if (S.bailT <= 0) {
          S.mode = "ground";
          S.speed = 0;
          S.fakie = false;
          S.y = H(S.x, S.z);
        }
        return;
      }
      if (S.mode === "ground") {
        if (S.grace > 0) {
          S.grace -= dt;
          if (S.grace <= 0) commit();
        }
        const rate = (look.skates ? 3.1 : 2.5) * (0.55 + 0.45 * Math.min(1, S.speed / 6));
        S.head += turn * rate * dt;
        if (keys.jump) {
          S.charging = true;
          S.charge = Math.min(1, S.charge + dt * 2.6);
        }
        if (edge.jumpUp && S.charging) {
          S.charging = false;
          if (S.grace > 0) commit();
          ollie();
          return;
        }
        // especial no chão: pula sozinho e já sai girando
        if (edge.special && S.specialOn) {
          if (S.grace > 0) commit();
          ollie(1.2);
          S.air.special = { t: 0, dur: 0.95 };
          sfx.special();
          return;
        }
        if (edge.grind || keys.grind) {
          let n = null;
          for (const ahead of [0, 0.7, 1.4]) {
            n = railNear(S.x + Math.sin(S.head) * ahead, S.y, S.z + Math.cos(S.head) * ahead, 1.4, 1.5, 0.4);
            if (n) break;
          }
          if (n) {
            if (S.grace > 0) commit();
            S.hop = { n, from: [S.x, S.y, S.z], el: 0, dur: 0.26, dir: dirKey() };
            S.mode = "hop";
            sfx.pop();
            return;
          }
        }
        const ev = moveGround(dt, true);
        if (ev === "air" && S.grace > 0) { /* combo segue no ar */ }
        return;
      }
      if (S.mode === "hop") {
        const h = S.hop;
        h.el += dt;
        const t = Math.min(1, h.el / h.dur);
        const p = V.lerp(h.from, h.n.p, t);
        S.x = p[0];
        S.z = p[2];
        S.y = p[1] + Math.sin(t * Math.PI) * 0.45;
        if (t >= 1) {
          S.air = { t: 0, spin: 0, flip: null, take: { x: S.x, y: S.y, z: S.z } };
          startGrind(h.n, h.dir);
          S.air = null;
          S.hop = null;
        }
        return;
      }
      if (S.mode === "manual") {
        const m = S.man;
        m.el += dt;
        S.balT += dt;
        const inp = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
        S.balV += ((Math.random() - 0.5) * 2.2 + S.bal * 1.6) * (0.45 + S.balT * 0.16) * dt * (m.special ? 0.4 : 1) - inp * 4.8 * dt * (m.nose ? -1 : 1);
        S.bal += S.balV * dt;
        if (Math.abs(S.bal) > 1) return bail();
        S.head += turn * 2.2 * dt;
        if (edge.special && S.specialOn && !m.special) { m.special = true; m.name = "Pião no Manual"; }
        if (m.special) S.spinVis = (S.spinVis || 0) + dt * 9;
        if (edge.jump) {
          endManual();
          ollie(-0.4);
          return;
        }
        const ev = moveGround(dt, false);
        if (ev === "air" || ev === "vert") { endManual(true); return; }
        if (S.speed < 0.6) { endManual(); S.mode = "ground"; commit(); }
        return;
      }
      if (S.mode === "grind") {
        const g = S.grind, r = g.r;
        g.el += dt;
        S.balT += dt;
        const d3 = V.mul(V.sub(r.b, r.a), 1 / g.len);
        S.speed -= 9.8 * d3[1] * g.sgn * dt * 0.85;
        S.speed = Math.max(3.6, Math.min(13, S.speed));
        g.t += (g.sgn * S.speed * dt) / g.len;
        const p = V.lerp(r.a, r.b, Math.max(0, Math.min(1, g.t)));
        S.x = p[0]; S.y = p[1]; S.z = p[2];
        S.head = Math.atan2(d3[0] * g.sgn, d3[2] * g.sgn);
        const inp = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        S.balV += ((Math.random() - 0.5) * 2.3 + S.bal * 1.7) * (0.45 + S.balT * 0.18) * dt * (g.special ? 0.35 : 1) + inp * 5 * dt;
        S.bal += S.balV * dt;
        if (Math.abs(S.bal) > 1) return bail("CAIU DO CORRIMÃO!");
        if (edge.special && S.specialOn && !g.special) {
          endGrindTrick();
          g.el = 0;
          g.special = true;
          g.name = "Faísca Longa";
          sfx.special();
        }
        if (false) {
          endGrindTrick();
          g.type = dk;
          g.name = (r.kind === "wire" ? "Fio: " : "") + grName(dk);
          g.el = 0;
        }
        if (edge.jump) {
          endGrindTrick();
          S.grind = null;
          const hd = S.head + turn * 0.35;
          goAir(5.0 + Math.max(0, d3[1] * g.sgn) * S.speed, Math.sin(hd) * S.speed * 0.9, Math.cos(hd) * S.speed * 0.9);
          sfx.pop();
          return;
        }
        if (g.t < 0 || g.t > 1) {
          endGrindTrick();
          S.grind = null;
          goAir(1.6 + d3[1] * g.sgn * S.speed * 0.6, Math.sin(S.head) * S.speed, Math.cos(S.head) * S.speed);
        }
        return;
      }
      if (S.mode === "plant") {
        const p = S.plant;
        p.t += dt;
        if (p.t >= p.dur || (!keys.grab && p.t > 0.5)) {
          addTrick(look.skates ? "Parada de Mão" : "Handplant", 350 + Math.round(p.t * 320));
          S.plant = null;
          S.y = L.RAD + 0.25;
          goAir(-0.3, 0, 0, { head0: p.head0, T: 0.3 });
        }
        return;
      }
      if (S.mode === "air") {
        const a = S.air;
        a.t += dt;
        // giro
        const tv = turn * 7.6;
        a.spinV += (tv - a.spinV) * Math.min(1, dt * 14);
        a.spin += a.spinV * dt;
        // flips
        if (a.flip) {
          a.flip.t += dt / (look.skates ? 0.55 : 0.36);
          if (a.flip.t >= 1) {
            const f = a.flip;
            a.flips[f.key] = (a.flips[f.key] || 0) + 1;
            const n = a.flips[f.key];
            const pre = n === 2 ? "Double " : n === 3 ? "Triple " : n > 3 ? n + "x " : "";
            if (n > 1) {
              const last = S.combo[S.combo.length - 1];
              if (last && last.name.endsWith(fName(f.key))) S.combo.pop();
            }
            addTrick(pre + fName(f.key), (look.skates ? SK_PTS[f.key] || 250 : FLIPS[f.key].pts) * n * (n > 1 ? 1.4 : 1));
            a.flip = keys.flip ? { key: f.key, t: 0 } : null;
            if (a.flip) sfx.flip();
          }
        } else if (edge.flip && !a.grab && !a.special) {
          const dk = dirKey();
          a.flip = { key: look.skates ? (a.vert || dk === "down" ? "back" : dk) : dk, t: 0 };
          sfx.flip();
        }
        // grabs
        if (a.grab) {
          if (keys.grab) a.grab.t += dt;
          else {
            addTrick(a.grab.name, 150 + Math.round(a.grab.t * 260));
            a.grab = null;
          }
        } else if (edge.grab && !a.flip && !a.special) {
          const qq = a.vert ? L.qpAt(S.x, S.z) : null;
          if (qq && S.y > L.RAD - 0.35 && S.y < L.RAD + 1.25) { startPlant(qq); return; }
          const dk = dirKey();
          a.grab = { name: gName(dk), gkey: GRAB_POSE[dk], t: 0 };
        }
        // especial
        if (edge.special && S.specialOn && !a.special && !a.flip && !a.grab) {
          a.special = { t: 0, dur: 0.95 };
          sfx.special();
        }
        if (a.special) {
          a.special.t += dt;
          if (a.special.t >= a.special.dur && !a.special.done) {
            a.special.done = true;
            addTrick("Estrela 2001", 1500);
          }
        }
        // grind no ar
        if (keys.grind || edge.grind) a.kBuf = 0.45;
        if (edge.jumpUp && !a.ollied && !a.vert && a.t < 0.16 && S.charging) {
          a.ollied = true;
          S.vy = Math.max(S.vy, 0) + 5.4 + S.charge * 2.2;
          S.charge = 0;
          S.charging = false;
          sfx.pop();
        }
        if (!keys.jump && !edge.jumpUp) S.charging = false;
        a.kBuf = (a.kBuf || 0) - dt;
        if (a.kBuf > 0 && S.vy < 2.5) {
          const n = railNear(S.x, S.y, S.z, a.vert ? 0.9 : 0.75, 0.55, 0.9);
          if (n) { startGrind(n, dirKey()); return; }
        }
        S.vy -= G * dt;
        if (!a.vert) {
          const nx = S.x + S.vx * dt, nz = S.z + S.vz * dt;
          // só é parede se a altura "salta" (degrau/prédio); rampa contínua é pouso normal
          const here = H(S.x, S.z);
          const inOb = blocked(S.x, S.z, S.y);
          if ((H(nx, S.z) > S.y + 0.25 && H(nx, S.z) - here > 0.45) || (!inOb && blocked(nx, S.z, S.y))) { S.vx = 0; sfx.bump(); }
          if ((H(S.x, nz) > S.y + 0.25 && H(S.x, nz) - here > 0.45) || (!inOb && blocked(S.x, nz, S.y))) { S.vz = 0; sfx.bump(); }
          S.x += S.vx * dt;
          S.z += S.vz * dt;
        }
        S.y += S.vy * dt;
        const g = H(S.x, S.z);
        if (S.y <= g && S.vy <= 0) land();
        else if (S.y < g - 0.4) { S.y = g; land(); }
        return;
      }
    }
    function startManual(nose) {
      S.mode = "manual";
      S.man = { el: 0, nose, special: false, name: nose ? "Nose Manual" : "Manual" };
      S.bal = (Math.random() - 0.5) * 0.15;
      S.balV = 0;
      S.balT = 0;
      S.grace = 0;
    }
    function endManual(toAir) {
      const m = S.man;
      if (!m) return;
      addTrick(m.special ? "Pião no Manual" : m.name, (m.special ? 600 : 50) + Math.round(m.el * (m.special ? 350 : 110)));
      S.man = null;
      S.spinVis = 0;
      if (!toAir && S.mode === "manual") S.mode = "ground";
    }

    // ---------- coletáveis e grafite ----------
    function collect() {
      const cx = S.x, cy = S.y + 0.9, cz = S.z;
      for (const c of cans) {
        if (c.got) continue;
        if (Math.hypot(c.p[0] - cx, c.p[1] - cy, c.p[2] - cz) < 1.15) {
          c.got = true;
          c.o.hidden = true;
          S.cans++;
          sfx.can();
          say(`+1 LATA (${S.cans})`, 1);
        }
      }
      for (const l of letters) {
        if (l.got) continue;
        if (Math.hypot(l.p[0] - cx, l.p[1] - cy, l.p[2] - cz) < 1.2) {
          l.got = true;
          l.o.hidden = true;
          S.letters.push(l.i);
          sfx.letter();
          say(`LETRA ${l.ch}!`, 1.2, true);
          if (S.letters.length >= 5) { goal("plaza"); say("P-L-A-Z-A COMPLETO!", 2, true); }
        }
      }
      for (const t of L.tags) {
        if (t.done) continue;
        if (Math.hypot(t.trigger[0] - cx, t.trigger[1] - cy, t.trigger[2] - cz) < 2.7) {
          if (S.cans <= 0) {
            if (S.needCanT <= 0) { say("SEM LATA! pegue latas de spray", 1.5); sfx.nocan(); S.needCanT = 2.5; }
            continue;
          }
          S.cans--;
          t.done = true;
          t.go.hidden = true;
          t.ao.hidden = false;
          S.tags++;
          sfx.spray();
          puffAt(t.c, t.n);
          if (S.mode === "ground" && !S.combo.length) {
            S.score += 300;
            say(`GRAFITE! ${S.tags}/6  +300`, 1.6, true);
          } else {
            addTrick("GRAFITE", 300);
            say(`GRAFITE! ${S.tags}/6`, 1.4, true);
          }
          if (S.tags >= 6) goal("tags");
        }
      }
    }
    function puffAt(c, n) {
      puffs.forEach((p, i) => {
        p.hidden = false;
        p.life = 0.5 + Math.random() * 0.4;
        p.p = V.add(V.add(c, V.mul(n, 0.3)), [(Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 3.5]);
        p.v = V.add(V.mul(n, 1.5 + Math.random() * 2), [(Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2]);
      });
    }

    // ---------- visual do skatista ----------
    let curPose = Object.assign({}, ART.POSES.ride);
    let pitchVis = 0;
    // sentido da viagem no espaço do boneco: +1 = pro bico (regular andando pra frente)
    const lead = () => ((look.stance === "goofy") !== !!(S.fakie && !(look.skates && skFwd)) ? -1 : 1);
    // espelha uma pose pra quem anda com o outro pé na frente
    function mirror(p, sg) {
      if (sg > 0 || !p) return p;
      const m = (h) => (h ? [h[0], h[1], -h[2], h[3]] : h);
      const o = Object.assign({}, p, { hy: -(p.hy || 0), twist: -(p.twist || 0), pz: -(p.pz || 0), hF: m(p.hB), hB: m(p.hF), lf: p.lb, lb: p.lf, fxF: p.fxB, fxB: p.fxF });
      if (o.hF && o.hF[3] === undefined) o.hF.length = 3;
      if (o.hB && o.hB[3] === undefined) o.hB.length = 3;
      return o;
    }
    function pushPose(sg) {
      const ph = S.pushPh % 1;
      const sw = Math.sin(ph * Math.PI * 2);
      return {
        px: 0.02, py: 0.86 - Math.max(0, Math.sin(ph * Math.PI * 2)) * 0.05, pz: 0.04 * sg, lean: 0.32, twist: -1.2 * sg, hy: -0.15 * sg, hp: 0.1,
        hF: [0.32 - sw * 0.12, 0.88, 0.1 * sg + sw * 0.14], hB: [0.1 + sw * 0.12, 0.86, -0.12 * sg - 0.1], lf: 0, lb: 0,
        push: ph, pushFoot: sg > 0 ? "B" : "F", pushDir: sg,
      };
    }
    function targetPose() {
      const P = ART.POSES;
      const sg = look.skates ? 1 : lead();
      if (window.__pose) return typeof window.__pose === "string" ? (P[window.__pose] || ART.grabPose(window.__pose)) : window.__pose;
      if (CUT && CUT.kfPose) return CUT.kfPose;
      if (PH) return mirror(CHARS.SELFIE(PH.arm), sg);
      if (S.mode === "plant") return mirror(ART.grabPose("Plant"), sg);
      if (S.mode === "air") {
        const a = S.air;
        if (a.special) return P.special;
        if (a.grab) return mirror(ART.grabPose(a.grab.gkey || a.grab.name), sg);
        if (a.flip) return look.skates ? Object.assign({}, P.air, { py: 0.62, lean: 0.6, lf: 0.15, lb: 0.15, hF: [0.25, 0.75, 0.25], hB: [0.25, 0.75, -0.25] }) : mirror(P.flip, sg);
        if (a.t < 0.12) return mirror(P.crouch, sg);
        return mirror(P.air, sg);
      }
      if (S.mode === "hop") return mirror(P.crouch, sg);
      if (S.mode === "grind") return mirror(P.grind, sg);
      if (S.mode === "manual") return S.man.nose ? P.nmanual : P.manual;
      if (S.charging || S.landT > 0) return mirror(P.crouch, sg);
      if (S.pushPh > 0) {
        if (look.skates) {
          // passada de patins: empurra pra fora com um pé de cada vez, balançando os braços
          // cada pé empurra pra fora e pra trás enquanto o outro desliza embaixo do corpo
          const ph = S.pushPh * Math.PI * 2, sw = Math.sin(ph), oF = Math.max(0, sw), oB = Math.max(0, -sw);
          return Object.assign({}, P.ride, look.ride || {}, {
            lean: 0.34, py: 0.99, twist: 0, hp: -0.05,
            fzF: 0.12 + oF * 0.17, fxF: -oF * 0.16 + oB * 0.05, lf: oB * 0.05,
            fzB: -0.12 - oB * 0.17, fxB: -oB * 0.16 + oF * 0.05, lb: oF * 0.05,
            roll: -sw * 0.07, hy: -sw * 0.18, hF: [0.16 - sw * 0.26, 0.98, 0.3], hB: [0.16 + sw * 0.26, 0.98, -0.3],
          });
        }
        return pushPose(sg);
      }
      if (S.speed < 0.25 && S.idleT > 1.2 && look.idle && CHARS.IDLE[look.idle]) return CHARS.IDLE[look.idle](clock);
      if (look.skates) {
        // patins andando sem remar: deslizando com balanço leve
        const sw = Math.sin(clock * 3);
        return Object.assign({}, P.ride, look.ride || {}, { lean: 0.2, py: 1.02, twist: 0, roll: sw * 0.04, fxF: 0.07, fxB: -0.07, fzF: 0.12, fzB: -0.12, hF: [0.12, 0.95, 0.32 + sw * 0.05], hB: [0.12, 0.95, -0.32 + sw * 0.05] });
      }
      return mirror(Object.assign({}, P.ride, look.ride || {}), sg);
    }
    function rigFrame(dt) {
      S.idleT = S.mode === "ground" && S.speed < 0.25 ? (S.idleT || 0) + dt : 0;
      const tp = targetPose();
      curPose = ART.lerpPose(curPose, tp, Math.min(1, dt * (S.mode === "air" ? 16 : 11)));
      curPose.stand = tp.stand;
      curPose.fx = tp.fx || 0;
      if (tp.push !== undefined) { curPose.push = tp.push; curPose.pushFoot = tp.pushFoot; curPose.pushDir = tp.pushDir; }
      else delete curPose.push;
      // fk = corpo virado de costas pro movimento. Com "Manu sempre de frente" ela anda de fakie
      // olhando pra frente, então inclinação e giro usam fk (não S.fakie) pra não afundar na rampa.
      const fk = S.fakie && !(look.skates && skFwd);
      const fs = fk ? -1 : 1;
      if (S.turnOff) {
        const d = S.turnOff * Math.min(1, dt * 7);
        S.turnOff = Math.abs(S.turnOff - d) < 0.01 ? 0 : S.turnOff - d;
      }
      let yaw = S.head + (fk ? Math.PI : 0) + (S.turnOff || 0), pitch = 0, roll = 0, y = S.y;
      let flipM = null, lift = 0;
      if (S.mode === "ground" || S.mode === "manual") {
        const dx = Math.sin(S.head), dz = Math.cos(S.head);
        const s = slopeAt(S.x, S.z, dx, dz);
        pitch = Math.atan(s) * fs;
        if (S.mode === "manual") pitch += (S.man.nose ? -0.22 : 0.22) * fs;
        if (S.man && S.man.special) yaw += S.spinVis || 0;
        roll = -((keys.left ? 1 : 0) - (keys.right ? 1 : 0)) * (look.skates ? 0.22 : 0.12) * Math.min(1, S.speed / 5);
      }
      if (S.mode === "air") {
        const a = S.air;
        yaw += a.spin;
        if (a.vert) {
          const p = Math.min(1, a.t / a.vert.T);
          yaw = a.vert.head0 + Math.PI * (p * p * (3 - 2 * p)) + a.spin + (fk ? Math.PI : 0);
          pitch = (Math.PI / 2) * (1 - 2 * p) * 0.92 * fs;
        } else pitch = Math.max(-0.45, Math.min(0.45, Math.atan2(S.vy, Math.hypot(S.vx, S.vz) + 2) * 0.6)) * fs;
        if (a.flip) {
          const f = Math.min(1, a.flip.t);
          const e = f * f * (3 - 2 * f);
          flipM = look.skates ? (SK_ROT[a.flip.key] || SK_ROT.none)(e) : FLIPS[a.flip.key].r(f);
          lift = Math.sin(f * Math.PI) * 0.22;
        }
        if (a.special) {
          flipM = M.mul(M.RY(a.special.t * 14), M.RZ(Math.sin(a.special.t * 6) * 0.6));
          lift = 0.35;
        }
      }
      if (S.mode === "grind") {
        const g = S.grind;
        const d3 = V.norm(V.sub(g.r.b, g.r.a));
        yaw = Math.atan2(d3[0] * g.sgn, d3[2] * g.sgn) + (fk ? Math.PI : 0);
        pitch = Math.asin(d3[1] * g.sgn) * fs;
        if (g.type === "left" || g.type === "right" || g.special) yaw += Math.PI / 2;
        if (g.type === "up") pitch -= 0.2;
        if (g.type === "down") pitch += 0.2;
        roll = S.bal * 0.35;
        y -= g.type === "left" || g.type === "right" || g.special ? 0.13 : 0.05;
      }
      if (S.mode === "hop") yaw += 0;
      if (S.revertAnim > 0) { S.revertAnim -= dt; yaw += Math.PI * (S.revertAnim / 0.35); }
      // suaviza a inclinação
      let dp = pitch - pitchVis;
      pitchVis += dp * Math.min(1, dt * (S.mode === "air" ? 30 : 14));
      let base = M.mul(M.T(S.x, y, S.z), M.mul(M.RY(yaw), M.mul(M.RX(-pitchVis), M.RZ(roll))));
      if (S.mode === "plant") {
        // gira em volta do coping até ficar de ponta-cabeça, com a mão apoiada na borda
        const p = S.plant, k = Math.min(1, p.t / 0.24), e = k * k * (3 - 2 * k);
        const h0 = p.cop[1] - p.y0, h1 = 1.9 * (look.scale || 1), h = h0 + (h1 - h0) * e;
        base = M.mul(M.T(p.cop[0], p.cop[1], p.cop[2]), M.mul(M.RY(p.head0 + (fk ? Math.PI : 0)), M.mul(M.RX(Math.PI * e), M.T(0, -h, 0))));
      }
      let boardM = base;
      if (flipM) boardM = M.mul(base, M.mul(M.T(0, 0.12 + lift, 0), M.mul(flipM, M.T(0, -0.09, 0))));
      const goofy = !look.skates && look.stance === "goofy" ? M.RY(Math.PI) : null;
      if (S.mode === "bail") {
        const b = S.bailBoard;
        const t = 1.9 - S.bailT;
        const ss = (a, b2, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b2 - a))); return u * u * (3 - 2 * u); };
        const fall = ss(0, 0.32, t), up = ss(1.45, 1.9, t);
        const rollA = ss(0.25, 1.15, t) * Math.PI * 2 * S.bailRoll * (1 - up);
        const ang = 1.42 * fall * (1 - up);
        // cai pra frente (no sentido do movimento), rola de lado no chão e levanta
        const rb = M.mul(M.T(S.x, S.y + 0.14 * fall * (1 - up), S.z), M.mul(M.RY(S.bailHead), M.mul(M.RZ(rollA), M.mul(M.RX(ang), M.RY(-Math.PI / 2)))));
        const fl = Math.sin(t * 15) * (1 - fall * 0.6);
        const bp = {
          px: 0, py: 0.86 - 0.1 * fall, pz: 0, lean: 0.25 - 0.4 * fall, twist: 0, hy: 0, hp: -0.2 * fall,
          hF: [0.15 + fl * 0.2, 1.2 + fl * 0.25 - fall * 0.2, 0.55], hB: [0.15 - fl * 0.2, 1.15 - fl * 0.25 - fall * 0.2, -0.55], lf: 0.25 * fall, lb: 0.1 * fall,
        };
        rig.pose(rb, up > 0 ? ART.lerpPose(bp, ART.POSES.ride, up) : bp);
        rig.board.mo = M.mul(M.T(b.x, b.y, b.z), M.mul(M.RY(S.bailHead + b.r * 0.3), M.RZ(Math.PI + b.r)));
      } else if (look.skates) {
        const bb = flipM ? M.mul(base, M.mul(M.T(0, 0.45 + lift, 0), M.mul(flipM, M.T(0, -0.45, 0)))) : base;
        rig.pose(bb, curPose, bb);
      } else {
        const rb = goofy ? M.mul(base, goofy) : base;
        const fb = flipM ? (goofy ? M.mul(boardM, goofy) : boardM) : rb;
        rig.pose(rb, curPose, fb);
        rig.board.mo = boardM;
      }
      // sombra
      const gh = H(S.x, S.z);
      const sc = Math.max(0.35, 1 - (S.y - gh) * 0.15);
      shadow.mo = M.mul(M.T(S.x, gh + 0.025, S.z), M.S(sc, 1, sc));
      shadow.hidden = gh > 50;
      // faíscas no grind
      sparks.forEach((s, i) => {
        if (S.mode === "grind" && Math.random() < 0.6 && s.life <= 0) {
          s.life = 0.15 + Math.random() * 0.2;
          s.p = [S.x, S.y + 0.02, S.z];
          s.v = [(Math.random() - 0.5) * 3 - Math.sin(S.head) * 2, Math.random() * 3, (Math.random() - 0.5) * 3 - Math.cos(S.head) * 2];
        }
        if (s.life > 0) {
          s.life -= dt;
          s.v[1] -= 12 * dt;
          s.p = V.add(s.p, V.mul(s.v, dt));
          s.mo = M.mul(M.T(s.p[0], s.p[1], s.p[2]), M.S(S.grind && S.grind.special ? 2 : 1, 1, 1));
        }
        s.hidden = s.life <= 0;
      });
      for (const p of puffs) {
        if (p.life > 0) {
          p.life -= dt;
          p.p = V.add(p.p, V.mul(p.v, dt));
          p.v = V.mul(p.v, 0.96);
          const s = 0.4 + (0.9 - p.life) * 1.4;
          p.mo = M.mul(M.T(p.p[0], p.p[1], p.p[2]), M.S(s, s, s));
        }
        p.hidden = p.life <= 0;
      }
    }

    // ---------- câmera ----------
    const cam = { eye: [0, 3, 22], at: [0, 1, 14], fov: 1.15 };
    let camMode = 0;
    const CAMS = ["CÂMERA TRASEIRA", "CÂMERA FRONTAL", "CÂMERA LATERAL"];
    function camFrame(dt) {
      if (CUT) { cam.eye = CUT.eye; cam.at = CUT.at; cam.fov = CUT.fov; return; }
      let want = S.head;
      if (S.mode === "air" && S.air.vert) want = S.air.vert.head0;
      if (S.mode === "plant") want = S.plant.head0;
      if (S.mode === "bail") want = S.camYaw;
      let d = want - S.camYaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const k = S.mode === "air" ? (S.air.vert ? 0 : 1.5) : S.mode === "grind" ? 5 : 3.2;
      S.camYaw += d * Math.min(1, dt * k);
      const tgt = [S.x, S.y + 1.15, S.z];
      const dist = 3.05 + Math.min(1.2, S.speed * 0.08);
      let fx = Math.sin(S.camYaw), fz = Math.cos(S.camYaw);
      let hgt = 1.15;
      // frontal: a câmera vai na frente olhando pro personagem; lateral: do lado
      if (camMode === 1) { fx = -fx; fz = -fz; hgt = 0.75; }
      if (camMode === 2) { const t = fx; fx = fz; fz = -t; hgt = 0.6; }
      let want3 = [tgt[0] - fx * (camMode ? dist * 0.95 : dist), tgt[1] + hgt, tgt[2] - fz * (camMode ? dist * 0.95 : dist)];
      if ((S.mode === "air" && S.air.vert) || S.mode === "plant") {
        const ty = S.mode === "plant" ? S.plant.y0 : S.air.take.y;
        want3 = [tgt[0] - fx * (dist + 1.5), Math.max(ty + 2.2, tgt[1] + 0.6), tgt[2] - fz * (dist + 1.5)];
      }
      // não entrar em parede/prédio
      for (let i = 1; i <= 10; i++) {
        const p = V.lerp(tgt, want3, i / 10);
        if (H(p[0], p[2]) > p[1] - 0.35) {
          want3 = V.lerp(tgt, want3, Math.max(0.15, (i - 1.5) / 10));
          want3[1] = Math.max(want3[1], H(want3[0], want3[2]) + 0.6);
          break;
        }
      }
      const kk = Math.min(1, dt * 7);
      cam.eye = V.lerp(cam.eye, want3, kk);
      const look = camMode ? V.add(tgt, [0, -0.15, 0]) : V.add(tgt, [fx * 1.4, -0.1, fz * 1.4]);
      cam.at = V.lerp(cam.at, look, Math.min(1, dt * 10));
      cam.fov = 1.12 + Math.min(0.14, S.speed * 0.012);
    }

    // ---------- laço ----------
    let tPrev = performance.now(), acc = 0, frames = 0, slow = 0, lowIdx = 0;
    const LOWS = [opt.lowH || 400, 320, 260];
    function frame(now) {
      requestAnimationFrame(frame);
      const rawDt = (now - tPrev) / 1000;
      tPrev = now;
      const dt = Math.min(0.04, rawDt);
      if (window.__freeze) {
        render(0);
        return;
      }
      vava.spin(now / 1000);
      if (PLAY) {
        playFrame(dt, now / 1000);
        return;
      }
      if (IN) {
        inFrame(dt, now / 1000);
        return;
      }
      if (!PH && !CUT && (S.running || S.mode !== "ground" || S.speed > 0)) {
        // passos fixos curtos pra física estável
        let left = dt;
        while (left > 0) {
          const h = Math.min(1 / 120, left);
          if (S.running) step(h);
          for (const k in edge) delete edge[k];
          left -= h;
        }
        if (S.running) collect();
      }
      // gira os coletáveis
      const t = now / 1000;
      cans.forEach((c, i) => (c.o.mo = M.mul(M.T(c.p[0], c.p[1] + Math.sin(t * 2 + i) * 0.1, c.p[2]), M.mul(M.RY(t * 2.4 + i), M.RZ(0.35)))));
      letters.forEach((l, i) => (l.o.mo = M.mul(M.T(l.p[0], l.p[1] + Math.sin(t * 2.5 + i) * 0.12, l.p[2]), M.RY(S.camYaw + Math.PI + Math.sin(t * 3 + i) * 0.5))));
      L.tags.forEach((tg, i) => { if (!tg.done) tg.go.tint = [1, 1, 1].map(() => 0.75 + 0.25 * Math.sin(t * 4 + i)); });
      atmos(dt, t);
      npcFrame(dt, t);
      carFrame(dt);
      hitchFrame(dt);
      NOW = t;
      missionFrame(dt, t);
      placeFrame();
      storyFrame(dt, t);
      if (CUT) cutFrame(dt, t);
      trackFrame();
      render(dt);
      if (REC) recFrame(dt);
      // som de rodinha
      if (ac && roll) {
        const rv = (S.mode === "ground" || S.mode === "manual") && S.running ? Math.min(1, S.speed / 9) * 0.09 : 0;
        roll.gain.setTargetAtTime(rv, ac.currentTime, 0.05);
        grindN.gain.setTargetAtTime(S.mode === "grind" ? 0.06 : 0, ac.currentTime, 0.03);
      }
      // desempenho: baixa a resolução se estiver pesado
      acc += rawDt;
      frames++;
      if (acc > 2) {
        const avg = acc / frames;
        if (avg > 0.03 && lowIdx < LOWS.length - 1 && !window.__lowLock) { lowIdx++; Rn.size(LOWS[lowIdx]); }
        acc = 0;
        frames = 0;
      }
      ui.hud && ui.hud(S, hudInfo());
    }
    function render(dt) {
      rigFrame(dt || 0.016);
      camFrame(dt || 0.016);
      if (PH) photoCam(dt || 0.016);
      else rig.camera.hidden = true;
      if (REC) filmerCam(dt || 0.016);
      const c = window.__cam || (PH ? PH.cam : REC ? REC.cam : cam);
      Rn.draw(scene, c);
    }

    // ---------- câmera digital (modo foto / selfie) ----------
    let PH = null;
    const handAndHead = () => {
      const F = rig.F, Lh = CHARS.lenOf(look), s = look.scale || 1;
      if (!F) return null;
      const hand = M.pt(F[CHARS.BONE.foreF], [0, Lh.fore + 0.11, 0]);
      const head = M.pt(F[CHARS.BONE.head], [0.06 * s, 0.24 * s, 0]);
      const fwd = V.norm(M.dir(F[CHARS.BONE.head], [1, 0, 0]));
      return { hand, head, fwd };
    };
    function photoCam(dt) {
      const hh = handAndHead();
      if (!hh) return;
      const turn = (keys.left ? 1 : 0) - (keys.right ? 1 : 0), lift = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
      if (PH.view === "selfie") {
        S.head += turn * dt * 1.4;
        PH.arm = Math.max(-0.6, Math.min(0.6, PH.arm + lift * dt * 0.8));
      } else {
        PH.yaw += turn * dt * 1.6;
        PH.pitch = Math.max(-0.15, Math.min(1.2, PH.pitch + lift * dt * 0.9));
      }
      // câmera na mão, lente virada pro rosto
      const z = V.norm(V.sub(hh.head, hh.hand)), x = V.norm(V.cross([0, 1, 0], z)), y = V.cross(z, x);
      rig.camera.mo = [x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, hh.hand[0], hh.hand[1], hh.hand[2], 1];
      rig.camera.hidden = PH.view === "selfie";
      const c = PH.cam;
      if (PH.view === "selfie") {
        // na frente do rosto, de cima (ângulo clássico de foto de perfil)
        const s = look.scale || 1, f = V.norm([hh.fwd[0], 0, hh.fwd[2]]);
        // com a Julie na foto, o braço estica e a câmera pega os dois
        const jw = julie.state === "pose" && !julie.rig.objs[0].hidden ? 1 : 0;
        PH.jw = (PH.jw || 0) + (jw - (PH.jw || 0)) * Math.min(1, dt * 5);
        const jh = [julie.x, H(julie.x, julie.z) + 1.38 * (julie.look.scale || 1), julie.z];
        const mid = V.add(V.lerp(hh.head, jh, 0.45 * PH.jw), [0, -0.12 * PH.jw, 0]), dd = (0.78 + 0.62 * PH.jw) * s;
        c.eye = V.add(mid, [f[0] * dd, (0.2 + PH.arm * 0.5 + 0.08 * PH.jw) * s, f[2] * dd]);
        c.at = V.add(mid, [0, -0.05 * s, 0]);
      } else {
        const tgt = [S.x, S.y + 1.0 * (look.scale || 1), S.z], d = PH.dist;
        const want = [tgt[0] + Math.sin(PH.yaw) * Math.cos(PH.pitch) * d, tgt[1] + Math.sin(PH.pitch) * d, tgt[2] + Math.cos(PH.yaw) * Math.cos(PH.pitch) * d];
        want[1] = Math.max(want[1], H(want[0], want[2]) + 0.3);
        c.eye = V.lerp(c.eye, want, Math.min(1, dt * 10));
        c.at = tgt;
      }
      c.fov = PH.fov;
    }
    function photoOn() {
      if (PH) return true;
      if (REC) recStop();
      if (S.mode !== "ground" || S.speed > 2.5) { say("PARA NO CHÃO PRA TIRAR FOTO", 1.4); return false; }
      S.speed = 0;
      const hh0 = handAndHead();
      PH = { view: "selfie", arm: 0.15, yaw: hh0 ? Math.atan2(hh0.fwd[0], hh0.fwd[2]) + 0.5 : S.head, pitch: 0.25, dist: 3.2, fov: 1.15, cam: { eye: cam.eye.slice(), at: cam.at.slice(), fov: 1.15 } };
      ui.media && ui.media("photo-on", { look: lookKey() });
      return true;
    }
    function photoOff() {
      if (!PH) return;
      PH = null;
      rig.camera.hidden = true;
      for (const k in edge) delete edge[k];
      ui.media && ui.media("photo-off");
    }
    const lookKey = () => Object.keys(ART.LOOKS).find((k) => ART.LOOKS[k] === look);
    // tira a foto numa resolução maior e devolve a imagem crua (o filtro de cada câmera é aplicado na página)
    function snap() {
      const prev = LOWS[lowIdx];
      Rn.size(Math.max(prev, 720));
      render(0);
      const url = canvas.toDataURL("image/png");
      const withJ = julie.state === "pose" && julie.posed;
      if (withJ && PH && PH.view === "selfie") { jSelfies++; try { localStorage.setItem("plaza-selfies-julie", jSelfies); } catch (e) {} }
      emit("photo", { view: PH ? PH.view : "", night: scene.night, tod: ATM.tod, rain: ATM.rain, julie: withJ });
      // na próxima foto ela faz outra pose
      if (withJ) { julie.pi++; julie.posed = false; }
      Rn.size(prev);
      sfx.snap();
      return url;
    }

    // ---------- filmadora: grava a linha e passa a fita depois ----------
    let REC = null, PLAY = null;
    const tapes = [];
    const FPS = 30, MAXT = 30;
    function filmerCam(dt) {
      // amigo filmando: baixo, de lado e atrás, lente olho de peixe e mão tremida
      const R = REC, fwd = [Math.sin(S.camYaw), 0, Math.cos(S.camYaw)], side = [fwd[2], 0, -fwd[0]];
      const tgt = [S.x, S.y + 0.55, S.z];
      const t = performance.now() / 1000;
      const want = V.add(tgt, V.add(V.mul(fwd, -2.3), V.add(V.mul(side, 1.25), [0, 0.15, 0])));
      want[1] = Math.max(want[1], H(want[0], want[2]) + 0.25);
      R.cam.eye = V.lerp(R.cam.eye, want, Math.min(1, dt * 6));
      R.cam.at = V.lerp(R.cam.at, V.add(tgt, V.add(V.mul(fwd, 1.2), [Math.sin(t * 7.1) * 0.03, Math.sin(t * 5.3) * 0.03, 0])), Math.min(1, dt * 9));
      R.cam.fov = 1.62;
    }
    function recStart() {
      if (PLAY || PH) return false;
      REC = { events: [], frames: [], t: 0, acc: 0, look: lookKey(), cam: { eye: cam.eye.slice(), at: cam.at.slice(), fov: 1.6 }, score0: S.score };
      sfx.beep();
      ui.media && ui.media("rec-on");
      return true;
    }
    function recFrame(dt) {
      REC.t += dt;
      REC.acc += dt;
      if (REC.acc >= 1 / FPS) {
        REC.acc %= 1 / FPS;
        REC.frames.push({
          b: rig.objs[0].bones.slice(), bd: Array.from(rig.board.mo), bh: rig.board.hidden, sh: Array.from(shadow.mo), shh: shadow.hidden,
          e: REC.cam.eye.slice(), a: REC.cam.at.slice(), f: REC.cam.fov, tr: S.combo.length ? S.combo[S.combo.length - 1].name : "",
        });
      }
      ui.media && ui.media("rec-tick", { t: REC.t });
      if (REC.t >= MAXT) recStop();
    }
    function recStop() {
      if (!REC) return null;
      sfx.beep();
      const clip = { frames: REC.frames, look: REC.look, len: REC.frames.length / FPS, when: new Date(), tricks: [...new Set(REC.frames.map((f) => f.tr).filter(Boolean))], ev: REC.events };
      REC = null;
      emit("clip", { clip });
      if (clip.frames.length > 10) { tapes.unshift(clip); if (tapes.length > 6) tapes.pop(); }
      ui.media && ui.media("rec-off", { clip });
      return clip;
    }
    let lookBeforePlay = null;
    function playStart(i) {
      const clip = tapes[i || 0];
      if (!clip) return false;
      if (REC) recStop();
      if (PH) photoOff();
      if (clip.look !== lookKey()) { lookBeforePlay = lookKey(); setLook(clip.look); }
      PLAY = { clip, t: 0, paused: false, cam: { eye: [0, 0, 0], at: [0, 0, 1], fov: 1.6 } };
      ui.media && ui.media("play-on", { clip });
      return true;
    }
    function playFrame(dt, t) {
      const P = PLAY, n = P.clip.frames.length;
      if (!P.paused) P.t += dt;
      if (P.t * FPS >= n) { P.t = (n - 1) / FPS; if (!P.ended) { P.ended = true; ui.media && ui.media("play-end"); } }
      const f = P.clip.frames[Math.min(n - 1, Math.floor(P.t * FPS))];
      rig.objs[0].bones.set(f.b);
      rig.board.mo = f.bd;
      rig.board.hidden = f.bh;
      rig.camera.hidden = true;
      shadow.mo = f.sh;
      shadow.hidden = f.shh;
      sparks.forEach((s) => (s.hidden = true));
      P.cam.eye = f.e; P.cam.at = f.a; P.cam.fov = f.f;
      atmos(dt, t);
      Rn.draw(scene, P.cam);
      ui.media && ui.media("play-tick", { t: P.t, len: P.clip.len, tr: f.tr });
    }
    function playStop() {
      if (!PLAY) return;
      PLAY = null;
      if (lookBeforePlay) { setLook(lookBeforePlay); lookBeforePlay = null; }
      ui.media && ui.media("play-off");
    }
    function hudInfo() {
      const base = comboBase();
      return {
        comboText: S.combo.map((c) => c.name).slice(-5).join(" + ") + (S.mode === "grind" ? (S.combo.length ? " + " : "") + S.grind.name : "") + (S.mode === "manual" ? (S.combo.length ? " + " : "") + S.man.name : "") + (S.mode === "air" && S.air.grab ? (S.combo.length ? " + " : "") + S.air.grab.name : ""),
        comboPts: base,
        mult: S.combo.length + (S.mode === "grind" || S.mode === "manual" ? 1 : 0),
        bal: S.mode === "grind" ? { kind: "h", v: S.bal } : S.mode === "manual" ? { kind: "v", v: S.bal } : null,
        goals: GOALS.map((g) => ({ ...g, done: !!goals[g.id] })),
        letters: L.letters.map((l, i) => ({ ch: l.ch, got: S.letters.includes(i) })),
        track: music ? music.name : "",
        charge: S.charging ? S.charge : 0,
      };
    }
    requestAnimationFrame(frame);
    addEventListener("resize", () => Rn.size());

    // cada um começa onde é a primeira missão da sua história
    const SPAWN = { kf: [0, 14, Math.PI], julie: [15.5, 39.4, Math.PI], manu: [76, -48.5, Math.PI], gabi: [-1, 124.5, 0], kaua: [64, 213.5, 0], kauane: [0, -176, Math.PI] };
    const SPW = () => SPAWN[lookKey()] || SPAWN.kf;
    function reset(run) {
      if (IN) { const sk = IN.skates; IN = null; if (sk && lookKey() === sk.key) setLook(sk.prev); rig.board.hidden = !!look.skates; ui.inside && ui.inside("exit", { reset: 1 }); }
      if (soffer) ui.mission && ui.mission("hide");
      SA = null; soffer = null; julie.follow = false;
      Object.assign(S, {
        mode: "ground", x: SPW()[0], y: H(SPW()[0], SPW()[1]), z: SPW()[1], head: SPW()[2], camYaw: SPW()[2], speed: 0, vy: 0, fakie: false, air: null, grind: null, man: null, hop: null,
        combo: [], grace: 0, score: 0, time: 180, run, running: true, over: false, endWait: 0, cans: 2, tags: 0, letters: [], gapsFound: {},
        special: 0, specialOn: false, bestCombo: 0, charge: 0, charging: false,
      });
      cans.forEach((c) => { c.got = false; c.o.hidden = false; });
      letters.forEach((l) => { l.got = false; l.o.hidden = false; });
      L.tags.forEach((t) => { t.done = false; t.go.hidden = false; t.ao.hidden = true; });
      cam.eye = [0, 3, 20.5];
      cam.at = [0, 1, 12];
    }
    return {
      S, press, setLook, goals: () => GOALS.map((g) => ({ ...g, done: !!goals[g.id] })),
      // o = { radio: true } quando o skatista tem rádio própria (aí a trilha sintetizada fica quieta)
      start(run, o) {
        initAudio();
        if (ac && ac.state === "suspended") ac.resume();
        if (o && o.radio) {
          if (music && music.playing) music.stop();
        } else if (music && !music.playing && !opt.noMusic) music.start();
        reset(run || "session");
      },
      setSkatesForward(v) { skFwd = !!v; },
      enterPlace, exitPlace, interact: inInteract, release: inRelease, shopAlbums,
      get inside() { return IN ? IN.id : null; },
      shopPlay(ai, fmt, deck) { if (IN) { IN.play = { ai, fmt, deck: deck || "main" }; } },
      phones: () => phonesToggle(),
      door: () => doorToggle(),
      get lounging() { return !!(IN && (IN.lounge || (IN.sit && IN.sit.seat))); },
      shopProg(p, ti) { if (IN) { IN.prog = p; if (ti != null) IN.curTi = ti; } },
      carry(ai, fmt) { if (IN) IN.carry = { ai, fmt }; },
      get carrying() { return IN ? IN.carry : null; },
      get needleOn() { return !!(IN && IN.needle); },
      needleMove, needleDrop, needleLift, needleTake, needleExit,
      shopStop() { if (IN) { IN.play = null; IN.disco = null; } },
      disco(on, vava) { if (IN) IN.disco = on ? { on: true, vava: !!vava } : null; },
      // cantos da tela da TV em pixels da tela (pra pôr o vídeo do comercial em cima); null se não dá pra ver
      tvQuad() {
        if (!IN || !IN.R.tv) return null;
        const cam = window.__cam || IN.cam, W = canvas.clientWidth, Hh = canvas.clientHeight;
        const VP = M.mul(M.persp(cam.fov || 1.1, W / Hh, 0.12, 650), M.look(cam.eye, cam.at, [0, 1, 0]));
        const pts = [];
        for (const q of IN.R.tv.corners) {
          const x = VP[0] * q[0] + VP[4] * q[1] + VP[8] * q[2] + VP[12], y = VP[1] * q[0] + VP[5] * q[1] + VP[9] * q[2] + VP[13], w = VP[3] * q[0] + VP[7] * q[1] + VP[11] * q[2] + VP[15];
          if (w < 0.2) return null;
          pts.push([((x / w + 1) / 2) * W, ((1 - y / w) / 2) * Hh]);
        }
        const c = IN.R.tv.c;
        // a tela está virada pra câmera?
        if ((cam.eye[2] - c[2]) > -0.05) return null;
        return { pts, dist: Math.hypot(IN.x - c[0], IN.z - c[2]) };
      },
      acceptMission, dropMission() { if (MA) { MA = null; items.forEach((o) => (o.hidden = true)); ui.mission && ui.mission("hide"); } },
      get offering() { return (!!offer && !MA) || !!soffer; },
      playCut: (k) => playCut(k || "game"),
      cutList: () => [{ k: "game", n: "Depois do game de S.K.A.T.E." }, { k: "sorvete", n: "Sorvete em cima da rampa" }],
      cutSkip() { if (CUT) endCut(); },
      get cutOn() { return !!CUT; },
      storyInfo: () => ({ kf: { step: stepOf("kf"), total: STORY.kf.length, next: STORY.kf[stepOf("kf")] ? STORY.kf[stepOf("kf")].title : null }, julie: julieOn, active: SA ? SA.def.title : null }),
      storyReset() { HS = {}; julieOn = false; julie.follow = false; SA = null; replay = null; saveHS(); },
      storyReplay(i) { if (i < 0 || i >= STORY.kf.length || i >= Math.max(1, stepOf("kf"))) return false; replay = i; julie.follow = false; return true; },
      continueStory() { return lookKey() === "kf"; },
      missionList: () => MISSIONS.map((m, i) => ({ who: npcOf(m.k).name, title: m.title, done: !!mDone[i], on: !!(MA && MA.m === m) })),
      challenges: (k) => (DESAFIOS[k || lookKey()] || []).map((c, i) => ({ t: c.t, done: !!dDone[(k || lookKey()) + i] })),
      missionMarks: () => {
        const out = MISSIONS.map((m, i) => (mDone[i] || (MA && MA.m === m) ? null : { x: npcOf(m.k).x, z: npcOf(m.k).z, on: false })).filter(Boolean);
        if (MA && MA.m.deliver != null) { const n = npcOf(MA.m.deliver); out.push({ x: n.x, z: n.z, on: true }); }
        if (MA && MA.m.items) MA.m.items.forEach(([x, z], i) => { if (!MA.got[i]) out.push({ x, z, on: true }); });
        { const key = lookKey(); (DESAFIOS[key] || []).forEach((c, j) => { if (c.at && !dDone[key + j]) out.push({ x: c.at[0], z: c.at[1], on: false, c: "#ff4fa3" }); }); }
        out.push({ x: -30, z: 42.4, on: false, c: "#3fd0ff", t: "L" }, { x: -20.5, z: 42.4, on: false, c: "#ffd23f", t: "♪" });
        if (SA && SA.def.kind === "ice" && !SA.phase && L.sorveteria) out.push({ x: L.sorveteria[0], z: L.sorveteria[1], on: true, c: "#ff4fa3" });
        if (SA && SA.def.kind === "ice" && SA.phase) out.push({ x: SUNSPOT[0], z: SUNSPOT[1], on: true, c: "#ffd23f" });
        if (lookKey() === "kf" && (stepOf("kf") < STORY.kf.length || replay != null) && !SA) out.push({ x: julie.x, z: julie.z, on: false, c: "#ff4fa3" });
        return out;
      },
      // câmera digital e filmadora
      photo(v) { return v ? photoOn() : (photoOff(), false); },
      get photoMode() { return PH ? PH.view : null; },
      photoView() { if (PH) PH.view = PH.view === "selfie" ? "amigo" : "selfie"; return PH && PH.view; },
      photoZoom(d) { if (PH) PH.fov = Math.max(0.55, Math.min(1.55, PH.fov + d)); },
      snap,
      rec() { if (REC) return recStop(), false; return recStart(); },
      get recording() { return !!REC; },
      tapes: () => tapes.map((c) => ({ len: c.len, look: c.look, when: c.when, tricks: c.tricks })),
      play: playStart, stopPlay: playStop,
      playPause() { if (PLAY) PLAY.paused = !PLAY.paused; return PLAY && PLAY.paused; },
      playRestart() { if (PLAY) { PLAY.t = 0; PLAY.ended = false; PLAY.paused = false; } },
      playSeek(d) { if (PLAY) { PLAY.t = Math.max(0, Math.min(PLAY.clip.len - 0.01, PLAY.t + d)); PLAY.ended = false; } },
      get playing() { return !!PLAY; },
      // clima: time = "tarde" | "noite" | "ciclo"; rain = "off" | "on" | "auto"
      setWeather(o) {
        if (o.time) { ATM.mode = o.time; if (o.now) ATM.tod = TOD[o.time] ?? ATM.tod; }
        if (o.tod != null) ATM.tod = o.tod;
        if (o.rain) { ATM.rainMode = o.rain; if (o.rain === "auto") ATM.nextW = 20; if (o.now) ATM.rain = o.rain === "on" ? 1 : 0; }
      },
      get weather() { return { tod: ATM.tod, rain: ATM.rain, mode: ATM.mode, rainMode: ATM.rainMode }; },
      synthOn() { initAudio(); if (music && !music.playing && !opt.noMusic) music.start(); },
      pause(v) { S.running = !v; },
      cycleCam() { camMode = (camMode + 1) % 3; say(CAMS[camMode], 1.2); return camMode; },
      nextTrack() { initAudio(); if (music) { if (!music.playing) music.start(); return music.nextTrack(); } return ""; },
      toggleMusic() { initAudio(); if (!music) return false; if (music.playing) music.stop(); else music.start(); return music.playing; },
      resetGoals() { goals = {}; saveGoals(); },
      cam, scene, L, Rn,
      isolate(v) { objs.forEach((o, i) => { if (i === 0 || rigObjs.includes(o) || o === shadow) return; o.hiddenSave = o.hiddenSave ?? o.hidden; o.hidden = v ? true : o.hiddenSave; }); },
    };
  }
  return { Game, GOALS };
})();
