// A praça: geometria visual + mapa de altura + corrimãos/bordas pra grind + pontos de grafite,
// latas, letras e gaps. Tudo alinhado aos eixos pra física simples e previsível.
"use strict";
const LEVEL = (() => {
  const { V, M, hex, Mesh } = E;
  const C = {
    floor: hex(0xd3ccdf), floor2: hex(0xcac3d8), line: hex(0xffd23f), white: hex(0xf6f3ee),
    ramp: hex(0x3ec9d6), ramp2: hex(0x31aebb), deck: hex(0xece8f2), side: hex(0xff5e8a), side2: hex(0x8c5cff),
    fun: hex(0xffd23f), funS: hex(0x7a5cff), terr: hex(0xe9dfcf), terr2: hex(0xddd1bf), wall: hex(0xff7a59),
    stair: hex(0xd8d2c4), nose: hex(0xffd23f), rail: hex(0xffd23f), metal: hex(0xd5dbe8), ledge: hex(0xb7b0c9),
    brick: hex(0xd9603b), leaf: hex(0x45c46b), leaf2: hex(0x2fa85a), trunk: hex(0x8a5a3c), dark: hex(0x2b2640),
    glass: hex(0x7fd3ff), win: hex(0x2b3a67), winL: hex(0xfff2b0),
    // Itaberá
    conc: hex(0xcfccc4), conc2: hex(0xb3b0a8), wire: hex(0x2b2640), gradil: hex(0x4f6b5c),
    palm: hex(0x9b8466), palm2: hex(0x8a7458), frond: hex(0x3fae5c), frond2: hex(0x2f9450),
    pav: hex(0xd6cab8), pav2: hex(0xc7b8a3), curb: hex(0xffd23f), curbS: hex(0xe8b81f),
    wood: hex(0x7a4a2c), pasto: hex(0xa8cf86),
  };
  const BUILD = [0xff6b8b, 0xffd166, 0x6be3d9, 0x9b7bff, 0xff9f45, 0xf5f1e6, 0x7cc8ff, 0xc6ff5a].map(hex);
  // casinhas de Itaberá: paredes pintadas e telhado de barro
  const CASA = [0xf5f1e6, 0xf2c14e, 0x8fd3a8, 0xf1e3c2, 0x7cc8ff, 0xf28db2, 0xf08a6a, 0xc9b6ff].map(hex);
  const TELHA = [0xc8643c, 0xb85a36, 0xd0714a].map(hex);

  // troca x<->z (perfis feitos com prof() que extruda em x)
  function swapXZ(m) {
    for (let i = 0; i < m.v.length; i += 12) {
      const x = m.v[i], nx = m.v[i + 3];
      m.v[i] = m.v[i + 2]; m.v[i + 2] = x;
      m.v[i + 3] = m.v[i + 5]; m.v[i + 5] = nx;
    }
    return m;
  }
  function build(RECT) {
    const solid = new Mesh(); // com contorno
    const flat = new Mesh(); // chão e coisas rentes (sem contorno)
    const deco = new Mesh(); // janelas, decalques, faixas (sem contorno)
    const lights = []; // cabeças de luminária (acendem à noite e iluminam o chão em volta)
    const feats = [];
    const rails = [];
    const shops = []; // lojas abertas (pra pôr atendente na porta)
    const fbox = (x0, z0, x1, z1, h) => feats.push({ x0, z0, x1, z1, f: () => h });
    const framp = (x0, z0, x1, z1, h0, h1, ax) =>
      feats.push({ x0, z0, x1, z1, f: (x, z) => { const t = ax === "x" ? (x - x0) / (x1 - x0) : (z - z0) / (z1 - z0); return h0 + (h1 - h0) * t; } });
    const rail = (a, b, kind, name, extra = {}) => rails.push(Object.assign({ a, b, kind, name }, extra));
    const RAD = 3.2;
    const qps = [];

    // ---------- chão ----------
    for (let x = -38; x < 36; x += 4)
      for (let z = -32; z < 32; z += 4) {
        const c = (((x + 2 + z) / 4) % 2 + 2) % 2 === 0 ? C.floor : C.floor2;
        const xb = Math.min(36, x + 4);
        flat.quad([x, 0, z], [x, 0, z + 4], [xb, 0, z + 4], [xb, 0, z], c);
      }
    // faixas pintadas e setas
    const stripe = (x0, z0, x1, z1, c) => deco.quad([x0, 0.01, z0], [x0, 0.01, z1], [x1, 0.01, z1], [x1, 0.01, z0], c);
    stripe(-20, -24.6, 36, -24.3, C.line);
    stripe(-20, 24.3, 36, 24.6, C.line);
    for (let i = 0; i < 7; i++) stripe(-9 + i * 2.4, 14, -8 + i * 2.4, 19, C.white);
    for (const [x, z, r] of [[4, -18, 0], [-8, 8, Math.PI], [22, -2, -Math.PI / 2]])
      deco.decal([x, 0.015, z], [Math.cos(r), 0, -Math.sin(r)], [Math.sin(r), 0, Math.cos(r)], 2.2, 2.2, RECT.arrow);
    deco.decal([10, 0.012, 18], [1, 0, 0], [0, 0, -1], 1.4, 1.4, RECT.manhole);
    deco.decal([-6, 0.012, -6], [1, 0, 0], [0, 0, -1], 1.4, 1.4, RECT.manhole);
    // grafite gigante no chão
    deco.decal([12, 0.013, 4], [0, 0, 1], [1, 0, 0], 9, 4.4, RECT.piece[7]);

    // ---------- quarter pipes norte e sul ----------
    function qp(x0, x1, zBot, dir, deckTo, colA, colB) {
      const zLip = zBot + dir * RAD;
      const pts = [];
      for (let i = 0; i <= 9; i++) {
        const d = (i / 9) * RAD * 0.995;
        pts.push([zBot + dir * d, RAD - Math.sqrt(RAD * RAD - d * d)]);
      }
      if (dir < 0) pts.reverse();
      // superfície (faixas alternadas)
      for (let i = 0; i < pts.length - 1; i++) {
        const [za, ya] = pts[i], [zb, yb] = pts[i + 1];
        solid.quad([x0, ya, za], [x0, yb, zb], [x1, yb, zb], [x1, ya, za], i % 2 ? colA : colB);
      }
      // laterais
      for (const x of [x0, x1]) {
        const st = solid.v.length;
        for (let i = 0; i < pts.length - 1; i++) {
          const [za, ya] = pts[i], [zb, yb] = pts[i + 1];
          solid.quad([x, 0, za], [x, ya, za], [x, yb, zb], [x, 0, zb], C.side);
        }
        const zs = [zLip, deckTo].sort((a, b) => a - b);
        solid.quad([x, 0, zs[0]], [x, RAD, zs[0]], [x, RAD, zs[1]], [x, 0, zs[1]], C.side);
        solid.orient([x === x0 ? x + 1 : x - 1, 1, zBot], st);
      }
      // deck
      const zd = [zLip, deckTo].sort((a, b) => a - b);
      solid.box(x0, RAD - 0.12, zd[0], x1, RAD, zd[1], C.deck, { top: C.deck, side: C.side2 });
      solid.box(x0, 0, zd[0], x1, RAD - 0.12, zd[1], C.side2, { noBottom: true });
      // coping
      solid.tube([x0, RAD - 0.03, zLip], [x1, RAD - 0.03, zLip], 0.06, 0.06, 7, C.metal, 1);
      // grade no deck
      const zr = deckTo - dir * 0.15;
      for (let x = x0 + 0.5; x <= x1 - 0.4; x += 2.5) solid.tube([x, RAD, zr], [x, RAD + 1.0, zr], 0.04, 0.04, 5, C.metal, 1);
      solid.tube([x0 + 0.5, RAD + 1.0, zr], [x1 - 0.5, RAD + 1.0, zr], 0.05, 0.05, 6, C.rail, 1);
      feats.push({
        x0, x1, z0: Math.min(zBot, zLip), z1: Math.max(zBot, zLip),
        f: (x, z) => { const d = Math.min(RAD, Math.abs(z - zBot)); return RAD - Math.sqrt(Math.max(0, RAD * RAD - d * d)); },
      });
      fbox(x0, zd[0], x1, zd[1], RAD);
      qps.push({ x0, x1, zBot, zLip, dir });
      rail([x0 + 0.2, RAD, zLip], [x1 - 0.2, RAD, zLip], "coping", "coping");
    }
    qp(-14, 14, -24.8, -1, -31.5, C.ramp, C.ramp2);
    qp(-14, 14, 24.8, 1, 31.5, C.ramp, C.ramp2);
    // grafites decorativos nas laterais


    // fio de luz pra grind lá no alto
    rail([-12.6, 5.7, -28.2], [12.6, 5.7, -28.2], "wire", "fio");
    for (let i = 0; i < 12; i++) {
      const xa = -12.6 + (i / 12) * 25.2, xb = -12.6 + ((i + 1) / 12) * 25.2;
      const sag = (x) => 5.7 - 0.0 * x;
      solid.tube([xa, sag(xa), -28.2], [xb, sag(xb), -28.2], 0.035, 0.035, 5, C.dark, 0, { cap: false });
    }
    for (const x of [-13, 13]) {
      solid.tube([x, 5.7, -29.4], [x * 0.97, 5.7, -28.2], 0.045, 0.045, 5, C.conc2);
      solid.tube([x, 6.6, -29.4], [x * 0.97, 5.72, -28.2], 0.025, 0.025, 4, C.dark);
    }

    // ---------- funbox central ----------
    solid.box(-3, 0, -2, 3, 0.8, 2, C.funS, { top: C.fun, side: C.funS });
    for (const s of [-1, 1]) {
      const zA = s * 2, zB = s * 4.4;
      solid.prof(s > 0 ? [[zA, 0.8], [zB, 0]] : [[zB, 0], [zA, 0.8]], -3, 3, C.ramp, C.funS);
      framp(-3, Math.min(zA, zB), 3, Math.max(zA, zB), s > 0 ? 0.8 : 0, s > 0 ? 0 : 0.8, "z");
    }
    fbox(-3, -2, 3, 2, 0.8);
    for (const x of [-3, 3]) solid.tube([x, 0.79, -2], [x, 0.79, 2], 0.04, 0.04, 6, C.metal, 1);
    rail([-3, 0.8, -1.9], [-3, 0.8, 1.9], "ledge", "borda");
    rail([3, 0.8, -1.9], [3, 0.8, 1.9], "ledge", "borda");
    // corrimão em cima do funbox
    for (const z of [-1.7, 1.7]) solid.tube([0, 0.8, z], [0, 1.18, z], 0.04, 0.04, 5, C.rail, 1);
    solid.tube([0, 1.18, -1.9], [0, 1.18, 1.9], 0.05, 0.05, 7, C.rail, 1);
    rail([0, 1.18, -1.9], [0, 1.18, 1.9], "rail", "corrimão do funbox");
    deco.decal([3.006, 0.4, 0], [0, 0, -1], [0, 1, 0], 1.55, 0.76, RECT.piece[6]);
    deco.decal([-3.006, 0.4, 0], [0, 0, 1], [0, 1, 0], 1.55, 0.76, RECT.piece[1]);

    // ---------- terraço oeste com escadão ----------
    const TH = 1.5;
    solid.box(-38, 0, -14, -20, TH, 14, C.wall, { top: C.terr, side: C.wall, noBottom: true });
    for (let x = -38; x < -20; x += 2) for (let z = -14; z < 14; z += 2)
      if ((x + z) % 4 === 0) deco.quad([x, TH + 0.01, z], [x, TH + 0.01, z + 2], [x + 2, TH + 0.01, z + 2], [x + 2, TH + 0.01, z], C.terr2);
    fbox(-38, -14, -20, -4, TH);
    fbox(-38, 4, -20, 14, TH);
    fbox(-38, -4, -20, 4, TH);
    // escadas: 5 degraus de -20 até -15.5
    const NS = 5, tread = 4.5 / NS, rise = TH / NS;
    for (let i = 0; i < NS; i++) {
      const xa = -20 + i * tread, h = TH - (i + 1) * rise;
      if (h <= 0.001) break;
      solid.box(xa, 0, -4, xa + tread, h, 4, C.stair, { top: C.stair, noBottom: true });
      deco.quad([xa + tread - 0.12, h + 0.008, -4], [xa + tread - 0.12, h + 0.008, 4], [xa + tread, h + 0.008, 4], [xa + tread, h + 0.008, -4], C.nose);
    }
    feats.push({
      x0: -20, z0: -4, x1: -15.5, z1: 4,
      f: (x) => Math.max(0, TH - (Math.floor((x + 20) / tread) + 1) * rise),
    });
    // muretas laterais da escada
    for (const z of [-4.3, 4.3]) {
      solid.merge(swapXZ(new Mesh().prof([[-20, TH + 0.12], [-15.5, 0.3]], z - 0.15, z + 0.15, C.deck, C.wall)));
      feats.push({ x0: -20, z0: z - 0.15, x1: -15.5, z1: z + 0.15, f: (x) => TH + 0.12 + ((x + 20) / 4.5) * (0.3 - TH - 0.12) });
    }
    // corrimãos inclinados
    for (const z of [-2.2, 2.2]) {
      const a = [-20.6, TH + 0.85, z], b = [-15.2, 0.85, z];
      solid.tube(a, b, 0.05, 0.05, 7, C.rail, 1);
      for (const t of [0.08, 0.5, 0.92]) {
        const p = V.lerp(a, b, t);
        const fl = t < 0.05 ? TH : Math.max(0, TH - (Math.floor((p[0] + 20) / tread) + 1) * rise);
        solid.tube([p[0], p[0] < -20 ? TH : fl, z], p, 0.04, 0.04, 5, C.rail, 1);
      }
      rail(a, b, "rail", "corrimão do escadão", { stair: true });
    }
    // bordas do terraço (grind)
    rail([-20, TH, 4.4], [-20, TH, 6.8], "ledge", "borda do terraço");
    solid.tube([-20, TH - 0.02, -14], [-20, TH - 0.02, -4], 0.045, 0.045, 6, C.metal, 1);
    // rampa (bank) pra subir no terraço
    solid.merge(swapXZ(new Mesh().prof([[-20, TH], [-14, 0]], 7, 13, C.ramp, C.wall)));
    framp(-20, 7, -14, 13, TH, 0, "x");
    rail([-38, TH, -13.8], [-38, TH, -4.2], "ledge", "borda do terraço (rua)");
    rail([-38, TH, 4.2], [-38, TH, 13.8], "ledge", "borda do terraço (rua)");
    solid.tube([-38, TH - 0.02, -14], [-38, TH - 0.02, 14], 0.045, 0.045, 6, C.metal, 1);
    solid.merge(swapXZ(new Mesh().prof([[-44, 0], [-38, TH]], -4, 4, C.ramp, C.wall)));
    framp(-44, -4, -38, 4, 0, TH, "x");
    // bancos (ledges) no terraço
    for (const [z0, z1] of [[-12, -5], [6, 12]]) {
      solid.box(-30, TH, z0, -28.6, TH + 0.46, z1, C.ledge, { top: C.deck });
      solid.tube([-30, TH + 0.45, z0], [-30, TH + 0.45, z1], 0.035, 0.035, 5, C.metal, 1);
      solid.tube([-28.6, TH + 0.45, z0], [-28.6, TH + 0.45, z1], 0.035, 0.035, 5, C.metal, 1);
      fbox(-30, z0, -28.6, z1, TH + 0.46);
      rail([-30, TH + 0.46, z0 + 0.1], [-30, TH + 0.46, z1 - 0.1], "ledge", "banco");
      rail([-28.6, TH + 0.46, z0 + 0.1], [-28.6, TH + 0.46, z1 - 0.1], "ledge", "banco");
    }
    // árvores no terraço
    const tree = (x, y, z, s = 1) => {
      solid.tube([x, y, z], [x, y + 2.2 * s, z], 0.16 * s, 0.12 * s, 6, C.trunk);
      solid.ball([x, y + 2.8 * s, z], 1.1 * s, C.leaf, 0, 7, 5);
      solid.ball([x + 0.6 * s, y + 2.4 * s, z + 0.3], 0.75 * s, C.leaf2, 0, 6, 4);
      solid.ball([x - 0.5 * s, y + 3.3 * s, z - 0.3], 0.7 * s, C.leaf, 0, 6, 4);
      deco.decal([x, y + 0.02, z], [1, 0, 0], [0, 0, -1], 2.6 * s, 2.6 * s, RECT.shadow, [1, 1, 1], 5);
    };
    // palmeira (como as da Av. Pref. Carlos Rodrigues dos Santos)
    const palm = (x, y, z, s = 1, lx = 0.35, lz = 0.15) => {
      let p = [x, y, z];
      const N = 6, Hh = 4.8 * s;
      for (let i = 0; i < N; i++) {
        const t = (i + 1) / N;
        const q = [x + lx * t * t * s, y + Hh * t, z + lz * t * t * s];
        solid.tube(p, q, 0.2 * s * (1 - 0.3 * i / N), 0.2 * s * (1 - 0.3 * (i + 1) / N), 6, i % 2 ? C.palm : C.palm2);
        p = q;
      }
      const top = p;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2 + 0.3, d = [Math.cos(a), 0, Math.sin(a)], sd = [-Math.sin(a), 0, Math.cos(a)];
        const L1 = (1.0 + (k % 3) * 0.15) * s, L2 = (2.2 + (k % 2) * 0.35) * s;
        const m1 = V.add(top, V.add(V.mul(d, L1), [0, 0.42 * s, 0])), e = V.add(top, V.add(V.mul(d, L2), [0, -0.7 * s, 0]));
        const col = k % 2 ? C.frond : C.frond2;
        deco.quad(V.add(top, V.mul(sd, -0.06)), V.add(top, V.mul(sd, 0.06)), V.add(m1, V.mul(sd, 0.34 * s)), V.add(m1, V.mul(sd, -0.34 * s)), col);
        deco.quad(V.add(m1, V.mul(sd, -0.34 * s)), V.add(m1, V.mul(sd, 0.34 * s)), V.add(e, V.mul(sd, 0.05)), V.add(e, V.mul(sd, -0.05)), col);
      }
      for (let k = 0; k < 3; k++) solid.ball(V.add(top, [Math.cos(k * 2.1) * 0.2 * s, -0.2 * s, Math.sin(k * 2.1) * 0.2 * s]), 0.13 * s, hex(0x6b4a2a), 0, 6, 4);
      deco.decal([x + lx * s, y + 0.02, z + lz * s], [1, 0, 0], [0, 0, -1], 3.6 * s, 3.6 * s, RECT.shadow, [1, 1, 1], 5);
    };
    palm(-33, TH, -9);
    palm(-33, TH, 9, 0.9, -0.3, 0.2);
    tree(-25, TH, 0, 0.8);

    // ---------- mirante: guarda-corpo de ferro com X (como o da Av. Serviliano Silva) ----------
    const GX = -20.2, GZ0 = -13.85, GZ1 = -4.45, GH = 1.0;
    {
      const nseg = 5, sl = (GZ1 - GZ0) / nseg;
      for (let i = 0; i <= nseg; i++) solid.tube([GX, TH, GZ0 + i * sl], [GX, TH + GH, GZ0 + i * sl], 0.05, 0.05, 4, C.gradil, 1);
      solid.tube([GX, TH + GH, GZ0 - 0.05], [GX, TH + GH, GZ1 + 0.05], 0.055, 0.055, 6, C.gradil, 1);
      solid.tube([GX, TH + 0.14, GZ0], [GX, TH + 0.14, GZ1], 0.035, 0.035, 4, C.gradil, 1);
      for (let i = 0; i < nseg; i++) {
        const za = GZ0 + i * sl, zb = za + sl;
        solid.tube([GX, TH + 0.14, za], [GX, TH + GH, zb], 0.03, 0.03, 4, C.gradil, 1);
        solid.tube([GX, TH + GH, za], [GX, TH + 0.14, zb], 0.03, 0.03, 4, C.gradil, 1);
      }
      rail([GX, TH + GH, GZ0 + 0.1], [GX, TH + GH, GZ1 - 0.1], "rail", "guarda-corpo do mirante");
      // banco de concreto do mirante
      const bc = hex(0xdcd6ca);
      solid.box(-23.3, TH + 0.36, -11, -22.5, TH + 0.48, -7.4, bc, { top: hex(0xe8e3d8) });
      for (const z of [-10.6, -7.8]) solid.box(-23.1, TH, z - 0.18, -22.7, TH + 0.36, z + 0.18, C.conc2, { noBottom: true });
      fbox(-23.3, -11, -22.5, -7.4, TH + 0.48);
      rail([-23.3, TH + 0.48, -10.9], [-23.3, TH + 0.48, -7.5], "ledge", "banco do mirante");
      rail([-22.5, TH + 0.48, -10.9], [-22.5, TH + 0.48, -7.5], "ledge", "banco do mirante");
    }

    // ---------- leste: kicker, canteiro, ledge comprido, manual pad, corrimãos ----------
    {
      const pts = [];
      for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        pts.push([11 + t * 2.4, 0.78 * Math.pow(t, 1.6)]);
      }
      solid.merge(swapXZ(new Mesh().prof(pts, -2, 2, hex(0xff4fa3), C.side2)));
      solid.box(13.4, 0, -2, 13.5, 0.78, 2, C.side2);
      feats.push({ x0: 11, z0: -2, x1: 13.4, z1: 2, f: (x) => 0.78 * Math.pow(Math.max(0, (x - 11) / 2.4), 1.6), kicker: true });
    }
    // canteiro
    solid.box(15, 0, -3, 19, 0.9, 3, C.brick, { top: hex(0x6b4a3a) });
    for (let i = 0; i < 6; i++) solid.ball([15.7 + (i % 3) * 1.3, 1.15, -1.8 + Math.floor(i / 3) * 3.4], 0.6, i % 2 ? C.leaf : C.leaf2, 0, 6, 4);
    palm(17, 0.9, 0, 0.85, 0.25, -0.2);
    fbox(15, -3, 19, 3, 0.9);
    rail([15, 0.9, -2.9], [15, 0.9, 2.9], "ledge", "canteiro");
    rail([19, 0.9, -2.9], [19, 0.9, 2.9], "ledge", "canteiro");
    rail([15.1, 0.9, -3], [18.9, 0.9, -3], "ledge", "canteiro");
    rail([15.1, 0.9, 3], [18.9, 0.9, 3], "ledge", "canteiro");
    // ledge comprido
    solid.box(26, 0, -14, 27.2, 0.55, 14, C.ledge, { top: C.deck });
    for (const x of [26, 27.2]) solid.tube([x, 0.54, -14], [x, 0.54, 14], 0.035, 0.035, 5, C.metal, 1);
    fbox(26, -14, 27.2, 14, 0.55);
    rail([26, 0.55, -13.8], [26, 0.55, 13.8], "ledge", "ledge comprido");
    rail([27.2, 0.55, -13.8], [27.2, 0.55, 13.8], "ledge", "ledge comprido");
    deco.decal([25.99, 0.28, 0], [0, 0, 1], [0, 1, 0], 1.1, 0.5, RECT.piece[5]);
    // manual pad
    solid.box(19.5, 0, 8, 23, 0.2, 16, C.ledge, { top: hex(0xf2ede4) });
    fbox(19.5, 8, 23, 16, 0.2);
    // corrimão reto ao longo de z
    for (const z of [-13.5, -9, -4.5]) solid.tube([8, 0, z], [8, 0.55, z], 0.045, 0.045, 5, C.rail, 1);
    solid.tube([8, 0.55, -14], [8, 0.55, -4], 0.05, 0.05, 7, C.rail, 1);
    rail([8, 0.55, -14], [8, 0.55, -4], "rail", "corrimão reto");
    for (const x of [12.5, 16, 19.5]) solid.tube([x, 0, 10.5], [x, 0.6, 10.5], 0.045, 0.045, 5, C.metal, 1);
    solid.tube([12, 0.6, 10.5], [20, 0.6, 10.5], 0.05, 0.05, 7, C.metal, 1);
    rail([12, 0.6, 10.5], [20, 0.6, 10.5], "rail", "corrimão do pad");
    // banco de concreto perto do sul
    solid.box(-6, 0, 8, -1, 0.45, 9.2, C.ledge, { top: C.deck });
    fbox(-6, 8, -1, 9.2, 0.45);
    rail([-5.9, 0.45, 8], [-1.1, 0.45, 8], "ledge", "banco");
    rail([-5.9, 0.45, 9.2], [-1.1, 0.45, 9.2], "ledge", "banco");

    // ---------- prédios em volta: centro de Itaberá ----------
    let bi = 0, ci = 0, ri = 0;
    const windows = (o, r, u, w, h, y0, floors, cols, lit) => {
      for (let f = 0; f < floors; f++)
        for (let c = 0; c < cols; c++) {
          const cx = -w / 2 + (c + 0.5) * (w / cols), cy = y0 + f * 2.6 + 1.3;
          const p = V.add(o, V.add(V.mul(r, cx), V.mul(u, cy)));
          const L = (f * 7 + c * 3 + bi) % 5 === 0 && lit;
          const ww = Math.min(1.3, (w / cols) * 0.6);
          const qq = (dx, dy, wx, hy, col, m) => {
            const c0 = V.add(p, V.add(V.mul(r, dx), V.mul(u, dy)));
            const n = V.cross(u, r);
            const cc = V.add(c0, V.mul(n, -0.02));
            const R2 = V.mul(r, wx / 2), U2 = V.mul(u, hy / 2);
            deco.quad(V.sub(V.sub(cc, R2), U2), V.sub(V.add(cc, R2), U2), V.add(V.add(cc, R2), U2), V.add(V.sub(cc, R2), U2), col, m);
          };
          qq(0, 0, ww + 0.24, 1.7, C.white, 0);
          qq(0, 0, ww, 1.46, L ? C.winL : C.win, L ? 2 : 0);
          qq(0, 0.15, ww, 0.06, C.white, 0);
        }
    };
    // referencial da fachada: o = centro embaixo, r = direita (vista de fora), n = pra fora
    const facade = (x0, z0, x1, z1, face) => {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      if (face === "z") return { o: [cx, 0, z1], r: [1, 0, 0], n: [0, 0, 1], w: x1 - x0 };
      if (face === "-z") return { o: [cx, 0, z0], r: [-1, 0, 0], n: [0, 0, -1], w: x1 - x0 };
      if (face === "x") return { o: [x1, 0, cz], r: [0, 0, -1], n: [1, 0, 0], w: z1 - z0 };
      return { o: [x0, 0, cz], r: [0, 0, 1], n: [-1, 0, 0], w: z1 - z0 };
    };
    const fpt = (F, s, y, off = 0.03) => V.add(V.add(F.o, V.mul(F.n, off)), V.add(V.mul(F.r, s), [0, y, 0]));
    const fq = (F, s, y, w, h, col, m = 0, off = 0.03) => {
      const c = fpt(F, s, y, off), R2 = V.mul(F.r, w / 2), U2 = [0, h / 2, 0];
      deco.quad(V.sub(V.sub(c, R2), U2), V.sub(V.add(c, R2), U2), V.add(V.add(c, R2), U2), V.add(V.sub(c, R2), U2), col, m);
    };
    const fdecal = (F, s, y, w, h, rect, off = 0.045) => deco.decal(fpt(F, s, y, off), F.r, [0, 1, 0], w, h, rect);
    // telhado de 4 águas (u = ao longo da fachada, v = profundidade)
    function roof(P, u0, u1, va, vb, hc, rh = 2.0) {
      const ov = 0.45, d = vb - va, vc = (va + vb) / 2;
      let r0 = u0 + d / 2, r1 = u1 - d / 2;
      if (r0 > r1) r0 = r1 = (u0 + u1) / 2;
      const st = solid.v.length, rc = TELHA[ri++ % TELHA.length];
      const a = P(u0 - ov, va - ov, hc), b = P(u1 + ov, va - ov, hc), c = P(u1 + ov, vb + ov, hc), e = P(u0 - ov, vb + ov, hc);
      const R0 = P(r0, vc, hc + rh), R1 = P(r1, vc, hc + rh);
      solid.quad(e, c, R1, R0, rc);
      solid.quad(b, a, R0, R1, rc);
      solid.tri(a, e, R0, V.mul(rc, 0.92));
      solid.tri(c, b, R1, V.mul(rc, 0.92));
      solid.orient(P((u0 + u1) / 2, vc, hc - 2), st);
    }
    // fileira de casinhas térreas com telhado de barro
    function casas(x0, z0, x1, z1, face) {
      const F = facade(x0, z0, x1, z1, face);
      const isZ = face === "z" || face === "-z";
      const ua = isZ ? x0 : z0, ub = isZ ? x1 : z1, va = isZ ? z0 : x0, vb = isZ ? z1 : x1;
      const P = (u, v, y) => (isZ ? [u, y, v] : [v, y, u]);
      const vf = face === "z" || face === "x" ? vb : va;
      const k = Math.max(1, Math.round((ub - ua) / 6.5)), sw = (ub - ua) / k;
      for (let i = 0; i < k; i++) {
        const u0 = ua + i * sw, u1 = u0 + sw, col = CASA[ci++ % CASA.length];
        const hc = 3.3 + ((i * 7 + ci) % 3) * 0.3;
        const A = P(u0, va, 0), B = P(u1, vb, hc);
        solid.box(Math.min(A[0], B[0]), 0, Math.min(A[2], B[2]), Math.max(A[0], B[0]), hc, Math.max(A[2], B[2]), col, { noBottom: true });
        roof(P, u0, u1, va, vb, hc);
        // fachada da casinha: barrado, porta, janelas
        const uc = (u0 + u1) / 2, o = P(uc, vf, 0);
        const G = { o, r: F.r, n: F.n };
        fq(G, 0, 0.35, sw - 0.06, 0.7, V.mul(col, 0.78));
        const sd = (i % 2 ? 1 : -1) * sw * 0.26;
        fq(G, sd, 1.08, 1.05, 2.16, C.wood);
        fq(G, sd + 0.3, 1.1, 0.08, 0.08, hex(0xffd23f), 2, 0.05);
        for (const sx of [-sd * 0.2, -sd * 1.05]) {
          fq(G, sx, 1.75, 1.5, 1.3, C.white);
          fq(G, sx, 1.75, 1.22, 1.04, (i + ci) % 3 ? C.win : C.winL, (i + ci) % 3 ? 0 : 2, 0.04);
          fq(G, sx, 1.75, 0.06, 1.04, C.white, 0, 0.05);
        }
      }
      fbox(x0, z0, x1, z1, 60);
    }
    // prédio ("predio": apartamentos em cima, loja embaixo) ou loja de 2 andares ("loja": portas de aço e letreiro)
    function building(x0, z0, x1, z1, h, face, opt = {}) {
      if (opt.style === "casas") return casas(x0, z0, x1, z1, face);
      const col = opt.col != null ? hex(opt.col) : BUILD[bi % BUILD.length];
      bi++;
      solid.box(x0, 0, z0, x1, h, z1, col, { top: V.mul(col, 0.85), noBottom: true });
      solid.box(x0 - 0.15, h, z0 - 0.15, x1 + 0.15, h + 0.4, z1 + 0.15, C.white, { noBottom: true });
      const F = facade(x0, z0, x1, z1, face), w = F.w, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const { o, r, n } = F;
      const o2 = V.add(o, V.mul(n, 0.03));
      if (opt.style === "loja") {
        const nd = Math.max(1, Math.min(4, Math.floor((w - 1) / 3.6)));
        const open = opt.shop != null || !!opt.sign;
        const PROD = [0xe0302b, 0xffd23f, 0x1fae5a, 0x3f63c8, 0xff8fc8, 0xff8a1f, 0xf5f1e6, 0x8c5cff];
        for (let i = 0; i < nd; i++) {
          const sx = -((nd - 1) / 2) * 3.6 + i * 3.6;
          fq(F, sx, 1.42, 3.2, 2.84, V.mul(col, 0.7));
          if (!open) { fdecal(F, sx, 1.35, 2.9, 2.7, RECT.door); continue; }
          // porta de aço levantada: interior aceso com prateleiras, produtos e balcão
          fdecal(F, sx, 2.62, 2.9, 0.3, RECT.door);
          fq(F, sx, 1.24, 2.9, 2.36, hex(0xffe6b8), 2, 0.04);
          for (let k = 0; k < 2; k++) {
            const yy = 1.45 + k * 0.62;
            fq(F, sx, yy, 2.7, 0.07, hex(0x6b4a34), 0, 0.05);
            for (let j = 0; j < 6; j++) fq(F, sx - 1.12 + j * 0.45, yy + 0.21, 0.3, 0.34, hex(PROD[(i * 5 + j * 3 + k) % PROD.length]), 2, 0.055);
          }
          fq(F, sx, 0.5, 2.9, 1.0, hex(0x8a5a3a), 0, 0.06);
          fq(F, sx, 1.02, 2.95, 0.07, hex(0xd8b48a), 0, 0.065);
        }
        if (open) {
          // toldo listrado em cima das portas
          const sw = Math.min(w - 0.6, nd * 3.6 + 0.4), g0 = V.add(F.o, V.mul(F.n, 0.05)), n8 = Math.max(6, Math.round(sw / 1.1));
          for (let i = 0; i < n8; i++) {
            const a = V.add(V.add(g0, V.mul(F.r, -sw / 2 + (i * sw) / n8)), [0, 2.62, 0]);
            const b = V.add(a, V.mul(F.r, sw / n8));
            const out = V.mul(F.n, 1.2);
            deco.quad(a, b, V.add(V.add(b, out), [0, -0.42, 0]), V.add(V.add(a, out), [0, -0.42, 0]), i % 2 ? C.white : V.mul(col, 0.85));
          }
          const pp = fpt(F, nd > 1 ? 1.8 : 0, 0, 1.1);
          shops.push({ x: pp[0], z: pp[2], nx: F.n[0], nz: F.n[2] });
        }
        fq(F, 0, 3.3, 5.7, 1.32, V.mul(col, 0.6), 0, 0.035);
        if (opt.sign) fdecal(F, 0, 3.3, opt.signW || 5.6, (opt.signW || 5.6) / (opt.signA || 6.4), opt.sign);
        else if (opt.shop != null) fdecal(F, 0, 3.3, 5.4, 1.1, RECT.shop[opt.shop]);
        windows(o2, r, [0, 1, 0], w, h, 3.75, Math.max(1, Math.floor((h - 4.6) / 2.6)), Math.max(2, Math.floor(w / 3)), true);
      } else {
        const floors = Math.floor((h - 4) / 2.6);
        windows(o2, r, [0, 1, 0], w, h, 3.6, floors, Math.max(2, Math.floor(w / 2.6)), true);
        // térreo: vitrine + toldo listrado
        const sw = Math.min(w - 1, 8);
        const g0 = V.add(o, V.mul(n, 0.05));
        const Rr = V.mul(r, sw / 2);
        deco.quad(V.sub(g0, Rr), V.add(g0, Rr), V.add(V.add(g0, Rr), [0, 2.4, 0]), V.add(V.sub(g0, Rr), [0, 2.4, 0]), C.glass, 2);
        for (let i = 0; i < 8; i++) {
          const a = V.add(V.add(g0, V.mul(r, -sw / 2 + (i * sw) / 8)), [0, 2.9, 0]);
          const b = V.add(a, V.mul(r, sw / 8));
          const out = V.mul(n, 1.1);
          deco.quad(a, b, V.add(V.add(b, out), [0, -0.5, 0]), V.add(V.add(a, out), [0, -0.5, 0]), i % 2 ? C.white : col);
        }
        if (opt.shop != null) fdecal(F, 0, 3.45, 4.2, 0.85, RECT.shop[opt.shop]);
      }
      // caixa d'água azul de fibra / antena
      if (bi % 2) {
        solid.tube([cx, h + 0.4, cz], [cx, h + 1.5, cz], 0.85, 0.75, 10, hex(0x3d7fd6));
        solid.tube([cx, h + 1.5, cz], [cx, h + 1.75, cz], 0.78, 0.2, 10, hex(0x3d7fd6));
      } else solid.tube([cx, h + 0.4, cz], [cx, h + 3.2, cz], 0.08, 0.05, 5, C.dark);
      fbox(x0, z0, x1, z1, 60);
      return { o, r, n };
    }
    // outdoors
    const billboard = (p, r, rect, h) => {
      const n = V.cross(r, [0, 1, 0]);
      solid.box(p[0] - 0.15, p[1] - 3.2, p[2] - 0.15, p[0] + 0.15, p[1] - 1.3, p[2] + 0.15, C.dark);
      solid.box(p[0] - Math.abs(r[0]) * 4.2 - Math.abs(n[0]) * 0.15, p[1] - 1.4, p[2] - Math.abs(r[2]) * 4.2 - Math.abs(n[2]) * 0.15, p[0] + Math.abs(r[0]) * 4.2 + Math.abs(n[0]) * 0.15, p[1] + 2.6, p[2] + Math.abs(r[2]) * 4.2 + Math.abs(n[2]) * 0.15, C.white);
      deco.decal(V.add(p, V.add([0, 0.6, 0], V.mul(n, 0.17))), r, [0, 1, 0], 7.8, 3.7, rect);
    };
    // cartazes nas fachadas e muretas
    const poster = (p, r, i) => deco.decal(p, r, [0, 1, 0], 0.9, 1.8, RECT.poster[i]);
    poster([14.18, 1.5, -29], [0, 0, 1], 1);
    poster([14.18, 1.5, -27.9], [0, 0, 1], 2);
    poster([-19.97, 0.75, -12], [0, 0, -1], 3);
    // muros/fechamento entre terraço e sul/norte (pra não vazar)
    fbox(-38, -31.5, -14, -14, 60);
    solid.box(-38, 0, -31.5, -14.2, 3, -14, hex(0x8c5cff), { top: C.white, noBottom: true });
    fbox(-38, 14, -14, 31.5, 60);
    solid.box(-38, 0, 14, -14.2, 3, 31.5, hex(0x2ad4c4), { top: C.white, noBottom: true });
    deco.decal([-14.18, 1.5, -22], [0, 0, -1], [0, 1, 0], 6, 2.9, RECT.piece[0]);
    deco.decal([-14.18, 1.5, 22], [0, 0, -1], [0, 1, 0], 6, 2.9, RECT.piece[3]);
    fbox(14, -31.5, 36, -26, 60);
    solid.box(14.2, 0, -31.5, 36, 3.2, -26, hex(0xffd166), { top: C.white, noBottom: true });
    fbox(14, 26, 36, 31.5, 60);
    solid.box(14.2, 0, 26, 36, 3.2, 31.5, hex(0xff6b8b), { top: C.white, noBottom: true });
    deco.decal([25, 1.6, -25.98], [1, 0, 0], [0, 1, 0], 6, 2.9, RECT.piece[2]);
    deco.decal([25, 1.6, 25.98], [-1, 0, 0], [0, 1, 0], 6, 2.9, RECT.piece[4]);

    // adereços: postes, cones, lixeira, hidrante
    const lamp = (x, z, y = 0) => {
      solid.tube([x, y, z], [x, y + 4.6, z], 0.08, 0.06, 6, C.dark);
      solid.tube([x, y + 4.6, z], [x + 0.9, y + 4.9, z], 0.05, 0.05, 5, C.dark);
      solid.box(x + 0.6, y + 4.65, z - 0.25, x + 1.3, y + 4.9, z + 0.25, C.dark, { side: C.dark });
      deco.quad([x + 0.65, y + 4.63, z - 0.2], [x + 1.25, y + 4.63, z - 0.2], [x + 1.25, y + 4.63, z + 0.2], [x + 0.65, y + 4.63, z + 0.2], C.winL, 2);
      lights.push([x + 0.95, y + 4.45, z]);
    };
    lamp(-17, -18); lamp(-17, 18);
    // ---------- postes de concreto com fiação (como em toda rua de Itaberá) ----------
    const fio = (a, b, sag) => {
      const N = 10;
      let p = a;
      for (let i = 1; i <= N; i++) {
        const t = i / N, q = V.add(V.lerp(a, b, t), [0, -sag * 4 * t * (1 - t), 0]);
        deco.tube(p, q, 0.022, 0.022, 3, C.wire, 0, { cap: false });
        p = q;
      }
    };
    // devolve os 3 pontos dos isoladores (ax: direção da cruzeta)
    const poste = (x, z, y0 = 0, o = {}) => {
      const h = o.h || 8.6, top = y0 + h, ax = o.ax || "x", L = 0.9;
      solid.tube([x, y0, z], [x, top, z], 0.18, 0.11, 4, C.conc, 0, { phase: Math.PI / 4 });
      if (ax === "x") solid.box(x - L, top - 0.55, z - 0.07, x + L, top - 0.41, z + 0.07, C.conc2);
      else solid.box(x - 0.07, top - 0.55, z - L, x + 0.07, top - 0.41, z + L, C.conc2);
      const pts = [];
      for (const k of [-0.72, 0, 0.72]) {
        const p = ax === "x" ? [x + k, top - 0.41, z] : [x, top - 0.41, z + k];
        solid.tube(p, V.add(p, [0, 0.16, 0]), 0.055, 0.04, 5, hex(0xe9eef2));
        pts.push(V.add(p, [0, 0.16, 0]));
      }
      if (o.arm) {
        const a = [x, top - 1.7, z], b = [x + o.arm[0] * 2.2, top - 1.15, z + o.arm[1] * 2.2];
        solid.tube(a, b, 0.055, 0.045, 5, C.conc2);
        const e = V.add(b, [o.arm[0] * 0.35, 0, o.arm[1] * 0.35]);
        lights.push(V.add(V.lerp(b, e, 0.5), [0, -0.2, 0]));
        solid.box(Math.min(b[0], e[0]) - 0.14, b[1] - 0.12, Math.min(b[2], e[2]) - 0.14, Math.max(b[0], e[0]) + 0.14, b[1] + 0.06, Math.max(b[2], e[2]) + 0.14, C.dark);
        deco.quad([Math.min(b[0], e[0]) - 0.1, b[1] - 0.13, Math.min(b[2], e[2]) - 0.1], [Math.max(b[0], e[0]) + 0.1, b[1] - 0.13, Math.min(b[2], e[2]) - 0.1], [Math.max(b[0], e[0]) + 0.1, b[1] - 0.13, Math.max(b[2], e[2]) + 0.1], [Math.min(b[0], e[0]) - 0.1, b[1] - 0.13, Math.max(b[2], e[2]) + 0.1], C.winL, 2);
      }
      if (o.trafo) {
        const tx = x + (ax === "x" ? 0 : 0.5), tz = z + (ax === "x" ? 0.5 : 0);
        solid.tube([tx, top - 2.9, tz], [tx, top - 1.9, tz], 0.34, 0.34, 8, hex(0x8e969c));
        solid.tube([tx, top - 1.9, tz], [tx, top - 1.75, tz], 0.3, 0.12, 8, hex(0x7a8288));
      }
      return pts;
    };
    // calçada leste
    const pE = [[33.4, -25.3], [33, -12], [33, 0], [33, 12], [33.4, 25.3]].map(([x, z], i) =>
      poste(x, z, 0, { arm: i > 0 && i < 4 ? [-1, 0] : null, trafo: i === 2 }));
    for (let i = 0; i < pE.length - 1; i++) for (let k = 0; k < 3; k++) fio(pE[i][k], pE[i + 1][k], 0.55 + k * 0.08);
    // ramais pras casas e lojas do lado leste
    for (const [i, z, y] of [[1, -20, 5.2], [3, 20, 5.2]]) fio(pE[i][2], [47.98, y, z], 0.7);
    // semáforo pendurado no poste da esquina
    {
      const y = 5.5;
      solid.tube([33.4, y, -25.3], [30.1, y, -25.3], 0.06, 0.06, 5, C.dark);
      solid.box(29.86, y - 1.2, -25.47, 30.34, y - 0.05, -25.13, hex(0x2b2b30));
      const lit = [hex(0xff3d3d), hex(0x5a4a1a), hex(0x1a4a2a)];
      [0.3, 0.65, 1.0].forEach((d, i) => solid.ball([30.1, y - d - 0.08, -25.1], 0.13, lit[i], i === 0 ? 2 : 0, 8, 5));
      solid.tube([30.1, y - 0.05, -25.3], [30.1, y, -25.3], 0.03, 0.03, 4, C.dark);
    }
    // postes dos decks (o do norte segura o fio de grind)
    const pN = [-13, 13].map((x) => poste(x, -29.4, RAD, { h: 5.2 }));
    const pS = [-13, 13].map((x) => poste(x, 29.4, RAD, { h: 5.2, trafo: x > 0 }));
    for (let k = 0; k < 3; k++) { fio(pN[0][k], pN[1][k], 0.9); fio(pS[0][k], pS[1][k], 0.9); }
    fio(pN[1][2], pE[0][0], 0.6);
    fio(pS[1][2], pE[4][0], 0.6);
    // terraço (mirante)
    const pW = [[-36.6, -10], [-36.6, 10]].map(([x, z]) => poste(x, z, TH, { ax: "x", arm: [1, 0] }));
    for (let k = 0; k < 3; k++) fio(pW[0][k], pW[1][k], 1.0);
    fio(pW[0][1], pN[0][0], 0.8);
    fio(pW[1][1], pS[0][0], 0.8);

    // ---------- guia amarela + calçada de bloquete no leste ----------
    solid.box(29.6, 0, -26, 29.92, 0.14, 26, C.curbS, { top: C.curb, noBottom: true });
    solid.box(35.7, 0, -26, 36, 0.14, 26, C.curbS, { top: C.curb, noBottom: true });
    fbox(29.6, -26, 36, 26, 0.14);
    rail([29.6, 0.14, -25.6], [29.6, 0.14, 25.6], "ledge", "guia amarela");
    rail([36, 0.14, -25.6], [36, 0.14, 25.6], "ledge", "guia amarela");
    for (let z = -26; z < 26; z += 0.5)
      for (let x = 29.92, j = 0; x < 35.7; j++) {
        const w = j === 0 && (Math.round(z * 2) % 2) ? 0.5 : 1;
        const xb = Math.min(35.7, x + w);
        flat.quad([x, 0.146, z], [x, 0.146, z + 0.5], [xb, 0.146, z + 0.5], [xb, 0.146, z], (Math.round(z * 2) + j) % 2 ? C.pav : C.pav2);
        x = xb;
      }

    // ---------- placas ----------
    // placa verde de estrada na calçada leste
    for (const z of [-15.8, -12.2]) solid.tube([34.9, 0, z], [34.9, 4.3, z], 0.06, 0.06, 6, C.metal, 1);
    solid.box(34.92, 2.6, -15.7, 35.0, 4.2, -12.3, hex(0x0e5a34));
    deco.decal([34.9, 3.4, -14], [0, 0, 1], [0, 1, 0], 3.3, 1.65, RECT.road);
    // placas azuis de nome de rua nas esquinas
    // a cidade em volta (city.js): ruas, quarteirões e picos
    const withY = (dy, fn) => {
      const s0 = solid.v.length, d0 = deco.v.length;
      const r = fn();
      if (dy) {
        for (let i = s0; i < solid.v.length; i += 12) solid.v[i + 1] += dy;
        for (let i = d0; i < deco.v.length; i += 12) deco.v[i + 1] += dy;
      }
      return r;
    };
    const CT = CITY.build({ rails, shops, solid, flat, deco, feats, fbox, framp, rail, building, poste, fio, palm, tree, withY, C, CASA, TELHA, RECT, V, hex, billboard, lights });
    const B = CITY.BOUNDS;
    for (const [x, z] of [[30, -24], [30.8, -23.2], [-10, 12.5]]) {
      solid.tube([x, 0, z], [x, 0.7, z], 0.2, 0.03, 7, hex(0xff7a1a));
      solid.tube([x, 0.25, z], [x, 0.4, z], 0.15, 0.12, 7, C.white, 0, { cap: false });
      solid.box(x - 0.25, 0, z - 0.25, x + 0.25, 0.06, z + 0.25, hex(0xff7a1a));
    }
    solid.tube([33, 0, 10], [33, 0.9, 10], 0.28, 0.3, 8, hex(0x3fa35a));
    solid.tube([33, 0.9, 10], [33, 1.0, 10], 0.32, 0.32, 8, C.dark);
    solid.tube([33.6, 0, -10], [33.6, 0.7, -10], 0.16, 0.16, 7, hex(0xff3d3d));
    solid.ball([33.6, 0.72, -10], 0.17, hex(0xff3d3d), 0, 7, 4);
    // máquina de refri inventada (emissiva)
    solid.box(34.6, 0, 2, 35.6, 2.1, 3.3, hex(0xff4fa3));
    deco.quad([34.58, 0.9, 2.1], [34.58, 0.9, 3.2], [34.58, 2.0, 3.2], [34.58, 2.0, 2.1], hex(0xbdfcff), 2);

    // ---------- paisagem: pasto, morros com casinhas, a lona do Complexo Esportivo, ginásio e antenas ----------
    const far = new Mesh();
    const fr = ART.rng(5);
    const inCity = (x, z, m = 6) => x > B.x0 - m && x < B.x1 + m && z > B.z0 - m && z < B.z1 + m;
    {
      // pasto só em volta da cidade (embaixo dela brigaria com o asfalto na profundidade)
      const E = 560, y = -0.02, g = (x0, z0, x1, z1, c) => far.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], c);
      g(-E, -E, E, B.z0, C.pasto); g(-E, B.z1, E, E, C.pasto); g(-E, B.z0, B.x0, B.z1, C.pasto); g(B.x1, B.z0, E, B.z1, C.pasto);
    }
    const hills = [];
    for (let i = 0; i < 26; i++) {
      // morros em volta da cidade inteira (centro em z = 100 desde que a cidade cresceu pro sul)
      const a = (i / 26) * Math.PI * 2 + fr() * 0.2, r = 55 + fr() * 35, top = 20 + fr() * 30;
      let d = 325 + fr() * 70;
      // empurra o morro pra fora se ele encostar na cidade (que agora vai até a Ladeira)
      const rectD = (x, z) => Math.hypot(Math.max(B.x0 - x, 0, x - B.x1), Math.max(B.z0 - z, 0, z - B.z1));
      while (rectD(6 + Math.cos(a) * d, 100 + Math.sin(a) * d) < r + 20) d += 10;
      const c = [6 + Math.cos(a) * d, -r * 0.12, 100 + Math.sin(a) * d], sy = (top + r * 0.12) / r;
      far.ball(c, r, V.lerp(hex(0x8cc06c), hex(0x6fae5e), fr()), 0, 14, 6, { sy });
      hills.push({ c, r, sy });
    }
    const groundAt = (x, z) => {
      let y = 0;
      for (const h of hills) {
        const dd = Math.hypot(x - h.c[0], z - h.c[2]);
        if (dd < h.r) y = Math.max(y, h.c[1] + h.sy * Math.sqrt(h.r * h.r - dd * dd));
      }
      return y;
    };
    const casinha = (x, z, s) => {
      const y = groundAt(x, z) - 0.2, w = (2.6 + fr() * 2) * s, dpt = (2.4 + fr() * 1.6) * s, hh = (2.2 + fr() * 0.8) * s;
      far.box(x - w / 2, y, z - dpt / 2, x + w / 2, y + hh, z + dpt / 2, CASA[Math.floor(fr() * CASA.length)], { noBottom: true });
      const rc = TELHA[Math.floor(fr() * 3)], rh = 1.1 * s, ov = 0.3 * s;
      const A = [x - w / 2 - ov, y + hh, z - dpt / 2 - ov], Bq = [x + w / 2 + ov, y + hh, z - dpt / 2 - ov], Cc = [x + w / 2 + ov, y + hh, z + dpt / 2 + ov], D = [x - w / 2 - ov, y + hh, z + dpt / 2 + ov], T = [x, y + hh + rh, z];
      const st = far.v.length;
      far.tri(A, Bq, T, rc); far.tri(Bq, Cc, T, V.mul(rc, 0.9)); far.tri(Cc, D, T, rc); far.tri(D, A, T, V.mul(rc, 0.9));
      far.orient([x, y, z], st);
    };
    const CXc = 168, CZc = 24;
    for (let i = 0; i < 190; i++) {
      const a = fr() * Math.PI * 2, d = 120 + fr() * 220;
      const x = 6 + Math.cos(a) * d, z = 100 + Math.sin(a) * d;
      if (inCity(x, z) || Math.hypot(x - CXc, z - CZc) < 40) continue;
      casinha(x, z, 1.2 + d / 200);
    }
    for (let i = 0; i < 80; i++) {
      const a = fr() * Math.PI * 2, d = 118 + fr() * 220, x = 6 + Math.cos(a) * d, z = 100 + Math.sin(a) * d, y = groundAt(x, z);
      if (inCity(x, z) || Math.hypot(x - CXc, z - CZc) < 38) continue;
      const r = 2.5 + fr() * 3;
      far.ball([x, y + r * 0.9, z], r, V.lerp(hex(0x3f9a55), hex(0x5cb562), fr()), 0, 7, 4);
    }
    // ---------- sudoeste paulista no horizonte: araucárias, eucaliptal, plantação e silos da cooperativa ----------
    {
      const arauc = (x, z, s) => {
        const y = groundAt(x, z) - 0.3, h = (14 + fr() * 6) * s;
        far.tube([x, y, z], [x, y + h, z], 0.35 * s, 0.22 * s, 6, hex(0x6a4a34));
        const g1 = hex(0x2f6a3e), g2 = hex(0x3a7a48);
        for (let k = 0; k < 4; k++) {
          const yy = y + h - k * 1.1 * s, rr = (2.2 + k * 1.3) * s;
          far.ball([x, yy, z], rr, k % 2 ? g1 : g2, 0, 9, 3, { sy: 0.22 });
        }
      };
      for (let i = 0; i < 70; i++) {
        const a = fr() * Math.PI * 2, d = 150 + fr() * 260, x = 6 + Math.cos(a) * d, z = 100 + Math.sin(a) * d;
        if (inCity(x, z, 14)) continue;
        arauc(x, z, 0.9 + fr() * 0.6);
      }
      // eucaliptal em fileiras (leste)
      for (let r = 0; r < 7; r++) for (let c = 0; c < 18; c++) {
        const x = 180 + c * 7 + fr() * 2, z = 250 + r * 9 + fr() * 2;
        if (inCity(x, z, 14)) continue;
        const y = groundAt(x, z), h = 15 + fr() * 5;
        far.tube([x, y, z], [x, y + h, z], 0.25, 0.18, 5, hex(0xd8d0c0));
        far.ball([x, y + h, z], 2.2, V.lerp(hex(0x6f9a7a), hex(0x5d8a6a), fr()), 0, 6, 4, { sy: 1.9 });
      }
      // plantação (milho e soja) em faixas perto da cooperativa
      const fieldY = -0.01;
      for (let i = 0; i < 26; i++) {
        const x0 = -300 + i * 6, c = i % 2 ? hex(0xc9b45a) : hex(0x8fb85a);
        far.quad([x0, fieldY, 120], [x0, fieldY, 260], [x0 + 6, fieldY, 260], [x0 + 6, fieldY, 120], c);
      }
      // silos e armazém da cooperativa
      const SX = -205, SZ = 190;
      for (let i = 0; i < 4; i++) {
        const x = SX + i * 9, z = SZ, y = groundAt(x, z);
        far.tube([x, y, z], [x, y + 16, z], 4, 4, 14, hex(0xd5dbe8));
        far.tube([x, y + 16, z], [x, y + 19.5, z], 4.1, 0.4, 14, hex(0xbfc6d4));
        for (let k = 1; k < 5; k++) far.tube([x, y + k * 3.2, z], [x, y + k * 3.2 + 0.25, z], 4.05, 4.05, 14, hex(0xa9b0be));
      }
      far.box(SX - 6, groundAt(SX, SZ + 14), SZ + 8, SX + 34, groundAt(SX, SZ + 14) + 9, SZ + 22, hex(0xe8dcc0), { top: hex(0xc94f3a) });
      far.box(SX + 36, groundAt(SX, SZ), SZ - 3, SX + 40, groundAt(SX, SZ) + 30, SZ + 3, hex(0xd5dbe8));
    }
    // a lona de circo do Complexo Esportivo (vista lá de cima do mirante), o ginásio e as antenas
    {
      const X = CXc, Z = CZc, Rr = 13, Hw = 6, Ht = 19, N = 20;
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2, c = i % 2 ? hex(0xe0302b) : hex(0xfafafa);
        const p0 = [X + Math.cos(a0) * Rr, 0, Z + Math.sin(a0) * Rr], p1 = [X + Math.cos(a1) * Rr, 0, Z + Math.sin(a1) * Rr];
        far.quad(p0, p1, V.add(p1, [0, Hw, 0]), V.add(p0, [0, Hw, 0]), c);
        const q0 = [X + Math.cos(a0) * (Rr + 0.6), Hw, Z + Math.sin(a0) * (Rr + 0.6)], q1 = [X + Math.cos(a1) * (Rr + 0.6), Hw, Z + Math.sin(a1) * (Rr + 0.6)];
        far.tri(q0, q1, [X, Ht, Z], c);
      }
      far.tube([X, Ht - 0.5, Z], [X, Ht + 3, Z], 0.12, 0.08, 5, hex(0x8a8a8a));
      far.quad([X, Ht + 3, Z], [X + 2, Ht + 2.6, Z], [X + 2, Ht + 1.8, Z], [X, Ht + 2, Z], hex(0xffd23f));
      const gx0 = 150, gx1 = 174, gz0 = -30, gz1 = -12, gh = 7;
      far.box(gx0, 0, gz0, gx1, gh, gz1, hex(0xeae4d6), { noBottom: true });
      const NR = 10;
      for (let i = 0; i < NR; i++) {
        const t0 = (i / NR) * Math.PI, t1 = ((i + 1) / NR) * Math.PI, rr = (gz1 - gz0) / 2, zc = (gz0 + gz1) / 2;
        const z0 = zc - Math.cos(t0) * rr, y0 = gh + Math.sin(t0) * rr * 0.55, z1 = zc - Math.cos(t1) * rr, y1 = gh + Math.sin(t1) * rr * 0.55;
        far.quad([gx0, y0, z0], [gx1, y0, z0], [gx1, y1, z1], [gx0, y1, z1], hex(0x7d8aa3));
      }
      for (const [x, z, hgt] of [[192, 52, 48], [200, 36, 42]]) {
        const NS = 8;
        for (let i = 0; i < NS; i++) far.tube([x, (i / NS) * hgt, z], [x, ((i + 1) / NS) * hgt, z], 0.5 - i * 0.04, 0.5 - (i + 1) * 0.04, 4, i % 2 ? hex(0xe0302b) : hex(0xfafafa));
      }
    }
    const clouds = new Mesh();
    for (let i = 0; i < 14; i++) {
      const a = fr() * Math.PI * 2, d = 70 + fr() * 50, y = 34 + fr() * 22;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      for (let k = 0; k < 5; k++) clouds.ball([x + (k - 2) * 4.5 + fr() * 2, y + fr() * 2 - Math.abs(k - 2) * 1.2, z + fr() * 3], 3.5 + fr() * 2.5 - Math.abs(k - 2) * 0.6, hex(0xffffff), 0, 7, 4, { sy: 0.7 });
    }

    // ---------- pontos de grafite (meta), latas, letras, gaps ----------
    const tags = [
      { c: [-19.95, 0.78, -9], r: [0, 0, -1], n: [1, 0, 0], w: 3.2, h: 1.45, piece: 2 },
      ...CT.tags,
    ];
    for (const t of tags) {
      const ghost = new Mesh().decal(V.add(t.c, V.mul(t.n, 0.02)), t.r, [0, 1, 0], t.w * 0.9, t.h * 0.9, RECT.ghost);
      const art = new Mesh().decal(V.add(t.c, V.mul(t.n, 0.03)), t.r, [0, 1, 0], t.w, t.h, RECT.piece[t.piece]);
      t.ghost = ghost;
      t.art = art;
      t.trigger = V.add(t.c, V.mul(t.n, 1.2));
    }
    const cans = [
      [0, 1.95, 0], [-17.6, 2.3, 0], [-17.9, 2.25, 2.2], [17, 2.6, 0], [8, 1.3, -9.5], [26.6, 1.3, 0],
      [-6, 6.3, -27.95], [6, 6.0, 27.95], [-29.3, TH + 1.25, -8], [-17, 2.4, 10], [-3.5, 1.3, 8.6], [21.3, 1.0, 12],
      [0, 6.45, -28.2], [16, 1.35, 10.5],
      ...CT.cans,
    ];
    const letters = [
      { ch: "P", p: [0, 2.7, -3.2] },
      { ch: "L", p: [-15.6, 1.7, -2.2] },
      { ch: "A", p: [17.6, 3.3, 0] },
      { ch: "Z", p: [5, 7.2, -27.95] },
      { ch: "A", p: [-6, 6.5, -28.2] },
    ];
    const gaps = [
      { name: "ESCADÃO", pts: 500, from: (s) => s.x < -19.3 && s.y > 1.3 && Math.abs(s.z) < 4.3, to: (s) => s.x > -15.4 },
      { name: "CANTEIRO", pts: 400, from: (s) => s.x > 10.5 && s.x < 14 && Math.abs(s.z) < 2.2, to: (s) => s.x > 19.1 },
      { name: "SOBRE O FUNBOX", pts: 300, from: (s) => s.z < -2.5 && Math.abs(s.x) < 3, to: (s) => s.z > 2.6 },
      { name: "SOBRE O FUNBOX", pts: 300, from: (s) => s.z > 2.5 && Math.abs(s.x) < 3, to: (s) => s.z < -2.6 },
      { name: "TERRAÇO → PRAÇA", pts: 250, from: (s) => s.x < -20 && s.y > 1.3, to: (s) => s.x > -14 && s.y < 0.2 },
      { name: "PULA O LEDGE", pts: 200, from: (s) => s.x < 25.6, to: (s) => s.x > 27.6, cond: (s) => Math.abs(s.z) < 14 },
      { name: "PULA O LEDGE", pts: 200, from: (s) => s.x > 27.6, to: (s) => s.x < 25.6, cond: (s) => Math.abs(s.z) < 14 },
      ...CT.gaps,
    ];

    // ---------- mapa de altura ----------
    function heightAt(x, z) {
      if (x < B.x0 || x > B.x1 || z < B.z0 || z > B.z1) return 60;
      let h = CT.baseAt ? CT.baseAt(x, z) : 0;
      for (const f of feats) {
        if (x < f.x0 || x > f.x1 || z < f.z0 || z > f.z1) continue;
        const v = f.f(x, z);
        if (v > h) h = v;
      }
      return h;
    }
    function qpAt(x, z) {
      for (const q of qps) {
        if (x < q.x0 || x > q.x1) continue;
        const d = (z - q.zBot) * q.dir;
        if (d >= 0 && d <= RAD) return { q, d };
      }
      return null;
    }
    // obstáculos sólidos que o mapa de altura não cobre (postes, troncos, cones, corrimãos baixos...)
    const obstacles = [
      ...[[33.4, -25.3], [33, -12], [33, 0], [33, 12], [33.4, 25.3]].map(([x, z]) => ({ x, z, r: 0.17, y1: 8.6 })),
      { x: -33, z: -9, r: 0.2, y1: TH + 4.8 }, { x: -33, z: 9, r: 0.2, y1: TH + 4.4 }, { x: -25, z: 0, r: 0.15, y1: TH + 1.8 },
      { x: 17, z: 0, r: 0.18, y1: 0.9 + 4.1 },
      { x: -36.6, z: -10, r: 0.17, y1: TH + 8.6 }, { x: -36.6, z: 10, r: 0.17, y1: TH + 8.6 },
      { x: -13, z: 29.4, r: 0.17, y1: RAD + 5.2 }, { x: 13, z: 29.4, r: 0.17, y1: RAD + 5.2 },
      { x: 34.9, z: -15.8, r: 0.08, y1: 4.3 }, { x: 34.9, z: -12.2, r: 0.08, y1: 4.3 },
      { x0: GX - 0.06, x1: GX + 0.06, z0: GZ0, z1: GZ1, y1: TH + GH - 0.05 },
      ...[[30, -24], [30.8, -23.2], [-10, 12.5]].map(([x, z]) => ({ x, z, r: 0.22, y1: 0.7 })),
      { x: 33, z: 10, r: 0.3, y1: 1.0 }, { x: 33.6, z: -10, r: 0.17, y1: 0.8 },
      { x0: 34.6, x1: 35.6, z0: 2, z1: 3.3, y1: 2.1 },
      { x: -13, z: -29.4, r: 0.17, y1: RAD + 5.2 }, { x: 13, z: -29.4, r: 0.17, y1: RAD + 5.2 },
      { x0: 7.95, x1: 8.05, z0: -14, z1: -4, y1: 0.5 },
      { x0: 12, x1: 20, z0: 10.45, z1: 10.55, y1: 0.55 },
      { x0: -0.05, x1: 0.05, z0: -1.9, z1: 1.9, y1: 1.13 },
      ...CT.obstacles,
    ];
    const map = { ...B, rects: [{ x0: -38, z0: -32, x1: 36, z1: 32, c: "#d3ccdf", name: "praça" }, { x0: -38, z0: -14, x1: -20, z1: 14, c: "#e9dfcf" }, { x0: -14, z0: -31.5, x1: 14, z1: -24.8, c: "#3ec9d6" }, { x0: -14, z0: 24.8, x1: 14, z1: 31.5, c: "#3ec9d6" }, ...CT.map] };
    return { sorveteria: CT.sorveteria, stops: CT.stops, shops, solid, flat, deco, far, clouds, rails, tags, cans, letters, gaps, heightAt, qpAt, RAD, TH, obstacles, map, lights, winC: C.win };
  }
  return { build };
})();
