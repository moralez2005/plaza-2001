// A cidade em volta da praça (inspirada em Itaberá-SP): ruas de asfalto, calçadas de bloquete com
// guia amarela (dá grind), quarteirões com lojas e casinhas e um pico de skate em cada um:
// Praça da Matriz (igreja, escadaria, coreto), escola (escada e rampas com corrimão), avenida que sobe
// até o mirante, mercado com estacionamento, banco com escadaria e quadra com arquibancada.
// Tudo alinhado aos eixos, no mesmo esquema do resto do mapa (mapa de altura + trilhos de grind).
"use strict";
const CITY = (() => {
  const BOUNDS = { x0: -100, x1: 112, z0: -100, z1: 300 };
  const Z1 = 100; // fim da cidade antiga (a cidade nova vai de 100 a 300)
  function build(X) {
    const { solid, flat, deco, feats, fbox, framp, rail, building, poste, fio, palm, tree, withY, C, CASA, TELHA, RECT, V, hex, billboard, lights } = X;
    const OB = [], TAGS = [], CANS = [], GAPS = [], MAP = [];
    const SW = 0.14; // altura da calçada
    const ASF = hex(0x8a8698), ASF2 = hex(0x817d90), LINE = hex(0xf2f0ea), YEL = hex(0xffd23f);
    const R = ART.rng(77);

    // ---------- ajudantes ----------
    // chão texturizado em ladrilhos (bloquete, petit-pavê...), com altura opcional variando em x
    function pave(x0, z0, x1, z1, y, rect, t = 2, yfn = null, col = [1, 1, 1]) {
      const [u0, v0, u1, v1] = rect;
      for (let x = x0; x < x1 - 1e-6; x += t) {
        const xb = Math.min(x1, x + t);
        for (let z = z0; z < z1 - 1e-6; z += t) {
          const zb = Math.min(z1, z + t);
          const uu = u0 + (u1 - u0) * ((xb - x) / t), vv = v0 + (v1 - v0) * ((zb - z) / t);
          const Y = (xx) => (yfn ? yfn(xx) : y);
          flat.quad([x, Y(x), z], [x, Y(x), zb], [xb, Y(xb), zb], [xb, Y(xb), z], col, 4, [[u0, v0], [u0, vv], [uu, vv], [uu, v0]]);
        }
      }
    }
    // chão liso (asfalto, cimento) em placas
    function plain(x0, z0, x1, z1, y, col, t = 8, col2 = null, yfn = null) {
      for (let x = x0, i = 0; x < x1 - 1e-6; x += t, i++) {
        const xb = Math.min(x1, x + t);
        for (let z = z0, j = 0; z < z1 - 1e-6; z += t, j++) {
          const zb = Math.min(z1, z + t);
          const Y = (xx) => (yfn ? yfn(xx) : y);
          flat.quad([x, Y(x), z], [x, Y(x), zb], [xb, Y(xb), zb], [xb, Y(xb), z], col2 && (i + j) % 2 ? col2 : col);
        }
      }
    }
    const stripe = (x0, z0, x1, z1, y, c) => deco.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], c);
    // prisma inclinado (rampa / canteiro na avenida): altura h0 em a0 até h1 em a1 ao longo do eixo
    function wedge(x0, z0, x1, z1, h0, h1, ax, top, side, base = 0) {
      const H = (x, z) => (ax === "x" ? h0 + ((h1 - h0) * (x - x0)) / (x1 - x0) : h0 + ((h1 - h0) * (z - z0)) / (z1 - z0));
      const st = solid.v.length;
      const p = (x, z, top_) => [x, top_ ? H(x, z) : base, z];
      solid.quad(p(x0, z0, 1), p(x0, z1, 1), p(x1, z1, 1), p(x1, z0, 1), top);
      solid.quad(p(x0, z0, 0), p(x1, z0, 0), p(x1, z0, 1), p(x0, z0, 1), side);
      solid.quad(p(x0, z1, 0), p(x0, z1, 1), p(x1, z1, 1), p(x1, z1, 0), side);
      solid.quad(p(x0, z0, 0), p(x0, z0, 1), p(x0, z1, 1), p(x0, z1, 0), side);
      solid.quad(p(x1, z0, 0), p(x1, z1, 0), p(x1, z1, 1), p(x1, z0, 1), side);
      solid.orient([(x0 + x1) / 2, base - 1, (z0 + z1) / 2], st);
      solid.orient([(x0 + x1) / 2, (H((x0 + x1) / 2, (z0 + z1) / 2) + base) / 2, (z0 + z1) / 2], st);
    }
    // escada: degraus do topo (borda a0) até embaixo (a1) ao longo do eixo; b0..b1 é a largura
    function stairs(ax, a0, a1, b0, b1, hTop, hBot, n, name) {
      const dir = Math.sign(a1 - a0), tread = Math.abs(a1 - a0) / n, rise = (hTop - hBot) / n;
      for (let i = 0; i < n; i++) {
        const sa = a0 + dir * i * tread, sb = sa + dir * tread, h = hTop - (i + 1) * rise;
        if (h <= 0.001) continue;
        const [lo, hi] = [Math.min(sa, sb), Math.max(sa, sb)];
        if (ax === "z") {
          solid.box(b0, 0, lo, b1, h, hi, C.stair, { top: C.stair, noBottom: true });
          const e = dir > 0 ? hi : lo;
          deco.quad([b0, h + 0.008, e - dir * 0.12], [b1, h + 0.008, e - dir * 0.12], [b1, h + 0.008, e], [b0, h + 0.008, e], C.nose);
        } else {
          solid.box(lo, 0, b0, hi, h, b1, C.stair, { top: C.stair, noBottom: true });
          const e = dir > 0 ? hi : lo;
          deco.quad([e - dir * 0.12, h + 0.008, b0], [e, h + 0.008, b0], [e, h + 0.008, b1], [e - dir * 0.12, h + 0.008, b1], C.nose);
        }
      }
      const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
      const f = (x, z) => {
        const t = Math.abs((ax === "z" ? z : x) - a0);
        return Math.max(hBot, hTop - (Math.floor(t / tread) + 1) * rise);
      };
      if (ax === "z") feats.push({ x0: b0, z0: lo, x1: b1, z1: hi, f });
      else feats.push({ x0: lo, z0: b0, x1: hi, z1: b1, f });
    }
    // corrimão inclinado ou reto, com postes até o chão
    function handrail(a, b, name, groundAt, col = C.rail) {
      solid.tube(a, b, 0.05, 0.05, 7, col, 1);
      for (const t of [0.06, 0.5, 0.94]) {
        const p = V.lerp(a, b, t);
        solid.tube([p[0], groundAt(p[0], p[2]), p[2]], p, 0.04, 0.04, 5, col, 1);
      }
      rail(a, b, "rail", name, { stair: Math.abs(a[1] - b[1]) > 0.2 });
    }
    // caixa com contorno + mapa de altura + trilhos nas bordas de cima (ledge)
    function ledgeBox(x0, z0, x1, z1, y0, h, col, top, name, edges = "nsew") {
      solid.box(x0, y0, z0, x1, h, z1, col, { top, noBottom: true });
      fbox(x0, z0, x1, z1, h);
      const m = 0.12;
      if (edges.includes("n")) rail([x0 + m, h, z0], [x1 - m, h, z0], "ledge", name);
      if (edges.includes("s")) rail([x0 + m, h, z1], [x1 - m, h, z1], "ledge", name);
      if (edges.includes("w")) rail([x0, h, z0 + m], [x0, h, z1 - m], "ledge", name);
      if (edges.includes("e")) rail([x1, h, z0 + m], [x1, h, z1 - m], "ledge", name);
    }
    // quarteirão: base de calçada (0,14), bloquete na faixa de 3 m e guia amarela nos lados de rua
    function block(x0, z0, x1, z1, sides, name, mapCol) {
      fbox(x0, z0, x1, z1, SW);
      const y = SW + 0.006, w = 3;
      if (sides.includes("n")) pave(x0, z0, x1, z0 + w, y, RECT.pav);
      if (sides.includes("s")) pave(x0, z1 - w, x1, z1, y, RECT.pav);
      const za = sides.includes("n") ? z0 + w : z0, zb = sides.includes("s") ? z1 - w : z1;
      if (sides.includes("w")) pave(x0, za, x0 + w, zb, y, RECT.pav);
      if (sides.includes("e")) pave(x1 - w, za, x1, zb, y, RECT.pav);
      const cw = 0.3, m = 0.4;
      if (sides.includes("n")) { solid.box(x0, 0, z0, x1, SW, z0 + cw, C.curbS, { top: C.curb, noBottom: true }); rail([x0 + m, SW, z0], [x1 - m, SW, z0], "ledge", "guia amarela"); }
      if (sides.includes("s")) { solid.box(x0, 0, z1 - cw, x1, SW, z1, C.curbS, { top: C.curb, noBottom: true }); rail([x0 + m, SW, z1], [x1 - m, SW, z1], "ledge", "guia amarela"); }
      if (sides.includes("w")) { solid.box(x0, 0, z0, x0 + cw, SW, z1, C.curbS, { top: C.curb, noBottom: true }); rail([x0, SW, z0 + m], [x0, SW, z1 - m], "ledge", "guia amarela"); }
      if (sides.includes("e")) { solid.box(x1 - cw, 0, z0, x1, SW, z1, C.curbS, { top: C.curb, noBottom: true }); rail([x1, SW, z0 + m], [x1, SW, z1 - m], "ledge", "guia amarela"); }
      MAP.push({ x0, z0, x1, z1, c: mapCol || "#d8cbbb", name });
    }
    // fileira de prédios: facade em `fixed`, ao longo do eixo de a0 até a1, com profundidade
    function row(face, fixed, a0, a1, depth, items, yAt) {
      let a = a0;
      for (let i = 0; i < items.length && a < a1 - 0.5; i++) {
        const it = items[i];
        let w = Math.min(it.w, a1 - a);
        if (i === items.length - 1) w = a1 - a;
        const b = a + w;
        if (!it.gap) {
          let x0, z0, x1, z1;
          if (face === "z") { x0 = a; x1 = b; z0 = fixed - depth; z1 = fixed; }
          if (face === "-z") { x0 = a; x1 = b; z0 = fixed; z1 = fixed + depth; }
          if (face === "x") { z0 = a; z1 = b; x0 = fixed - depth; x1 = fixed; }
          if (face === "-x") { z0 = a; z1 = b; x0 = fixed; x1 = fixed + depth; }
          const dy = yAt ? yAt(a, b) : SW;
          withY(dy, () => building(x0, z0, x1, z1, it.h || 7.4, face, { style: it.style, shop: it.shop, col: it.col, sign: it.sign, signW: it.signW, signA: it.signA }));
        }
        a = b;
      }
    }
    // mistura de casinhas e lojas pra preencher uma fileira
    function mix(span, seed, lojas = 0.45) {
      const r = ART.rng(seed), out = [];
      let s = 0;
      while (s < span - 0.5) {
        const k = r();
        let it;
        if (k < lojas) it = { w: 9 + Math.floor(r() * 4), style: "loja", h: 7.2 + r() * 0.8, shop: r() < 0.5 ? Math.floor(r() * 8) : null };
        else if (k < lojas + 0.12) it = { w: 10 + Math.floor(r() * 4), h: 9.5 + r() * 1.5 };
        else it = { w: 13 + Math.floor(r() * 7), style: "casas" };
        out.push(it);
        s += it.w;
      }
      return out;
    }
    // miolo do quarteirão (ninguém entra; só não deixa buraco visível)
    function fill(x0, z0, x1, z1, h = 4.6) {
      solid.box(x0, 0, z0, x1, h, z1, hex(0xd9c6b4), { top: hex(0xb96a48), noBottom: true });
      fbox(x0, z0, x1, z1, 60);
    }
    const ob = (x, z, r, y1) => OB.push({ x, z, r, y1 });
    // placa azul de rua num poste
    function plate(x, z, i, ry = 0) {
      solid.tube([x, 0, z], [x, 2.9, z], 0.05, 0.05, 5, C.metal, 1);
      const r = [Math.cos(ry), 0, Math.sin(ry)];
      deco.decal([x + Math.sin(ry) * 0.06, 2.75, z - Math.cos(ry) * 0.06], r, [0, 1, 0], 1.9, 0.33, RECT.plate[i]);
      deco.decal([x - Math.sin(ry) * 0.06, 2.75, z + Math.cos(ry) * 0.06], V.mul(r, -1), [0, 1, 0], 1.9, 0.33, RECT.plate[i]);
      ob(x, z, 0.07, 2.9);
    }
    // carro estacionado (dá pra subir no capô e no teto)
    function car(x, z, along, col, y = SW) {
      col = hex(col);
      const L = 3.9, W = 1.76, hx = along === "x" ? L / 2 : W / 2, hz = along === "x" ? W / 2 : L / 2;
      solid.box(x - hx, y + 0.3, z - hz, x + hx, y + 0.95, z + hz, col, { top: V.mul(col, 1.04) });
      const cx = along === "x" ? 0.62 : 0.42 * W, cz = along === "x" ? 0.42 * W : 0.62;
      const ox = along === "x" ? -0.25 : 0, oz = along === "x" ? 0 : -0.25;
      solid.box(x + ox - cx, y + 0.95, z + oz - cz, x + ox + cx, y + 1.5, z + oz + cz, hex(0x3a4a7a), { top: col });
      for (const s1 of [-1, 1])
        for (const s2 of [-1, 1]) {
          const wx = along === "x" ? x + s1 * (hx - 0.75) : x + s2 * hx, wz = along === "x" ? z + s2 * hz : z + s1 * (hz - 0.75);
          const a = along === "x" ? [wx, y + 0.33, wz - s2 * 0.02] : [wx - s2 * 0.02, y + 0.33, wz];
          const b = along === "x" ? [wx, y + 0.33, wz + s2 * 0.12] : [wx + s2 * 0.12, y + 0.33, wz];
          solid.tube(a, b, 0.33, 0.33, 8, C.dark);
        }
      const fr = along === "x" ? [x + hx + 0.01, z] : [x, z + hz + 0.01];
      for (const s of [-0.55, 0.55]) {
        if (along === "x") { deco.quad([fr[0], y + 0.62, fr[1] + s - 0.18], [fr[0], y + 0.62, fr[1] + s + 0.18], [fr[0], y + 0.8, fr[1] + s + 0.18], [fr[0], y + 0.8, fr[1] + s - 0.18], C.winL, 2); }
        else { deco.quad([fr[0] + s - 0.18, y + 0.62, fr[1]], [fr[0] + s + 0.18, y + 0.62, fr[1]], [fr[0] + s + 0.18, y + 0.8, fr[1]], [fr[0] + s - 0.18, y + 0.8, fr[1]], C.winL, 2); }
      }
      fbox(x - hx, z - hz, x + hx, z + hz, y + 0.95);
      fbox(x + ox - cx, z + oz - cz, x + ox + cx, z + oz + cz, y + 1.5);
    }
    // ipê florido (árvore de rua)
    function ipe(x, z, y = SW, col = 0xff8fc8) {
      solid.tube([x, y, z], [x, y + 2.4, z], 0.16, 0.11, 6, C.trunk);
      const c = hex(col), c2 = V.mul(c, 0.85);
      solid.ball([x, y + 3.1, z], 1.25, c, 0, 7, 5);
      solid.ball([x + 0.7, y + 2.7, z + 0.4], 0.8, c2, 0, 6, 4);
      solid.ball([x - 0.6, y + 3.5, z - 0.3], 0.75, c, 0, 6, 4);
      deco.decal([x, y + 0.02, z], [1, 0, 0], [0, 0, -1], 3 * 1, 3 * 1, RECT.shadow, [1, 1, 1], 5);
      ob(x, z, 0.18, y + 2.4);
    }
    // poste de praça (ferro verde com globo)
    function lampPraca(x, z, y = SW) {
      solid.tube([x, y, z], [x, y + 3.3, z], 0.09, 0.06, 6, hex(0x2f5a46));
      solid.ball([x, y + 3.55, z], 0.28, hex(0xfff6d8), 2, 8, 5);
      lights.push([x, y + 3.4, z]);
      ob(x, z, 0.1, y + 3.3);
    }
    // lata de lixo laranja
    function lixeira(x, z, y = SW) {
      solid.tube([x, y, z], [x, y + 0.95, z], 0.05, 0.05, 5, C.metal, 1);
      solid.tube([x, y + 0.55, z + 0.18], [x, y + 1.05, z + 0.18], 0.22, 0.2, 8, hex(0xff8a1f));
      ob(x, z, 0.12, y + 1.05);
    }
    // linha de postes com fiação ao longo de x ou z
    function posteLine(ax, fixed, a0, a1, step, armDir, yAt = () => SW) {
      const pts = [];
      for (let a = a0; a <= a1 + 0.01; a += step) {
        const x = ax === "x" ? a : fixed, z = ax === "x" ? fixed : a;
        // não deixa poste cair no meio da rua (onde a fileira cruza um cruzamento)
        if ((x > -47.6 && x < -37.4) || (x > 35.4 && x < 45.6) || [[-41, -32], [32, 41], [100, 109], [200, 209]].some(([z0, z1]) => z > z0 - 0.6 && z < z1 + 0.6)) continue;
        const y = yAt(x, z);
        pts.push(poste(x, z, y, { ax: ax === "x" ? "z" : "x", arm: armDir, trafo: R() < 0.25 }));
        ob(x, z, 0.17, y + 8.6);
      }
      for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < 3; k++) fio(pts[i][k], pts[i + 1][k], 0.5 + k * 0.08);
      return pts;
    }

    // ---------- ruas ----------
    const roads = [
      [BOUNDS.x0, -41, BOUNDS.x1, -32, "Rua Cel. Amantino"],
      [BOUNDS.x0, 32, BOUNDS.x1, 41, "Rua Eltore Rossi"],
      [-47, BOUNDS.z0, -38, BOUNDS.z1, "Rua São Pedro"],
      [36, BOUNDS.z0, 45, BOUNDS.z1, "R. Cel. José Pedro de Lima"],
    ];
    for (const [x0, z0, x1, z1] of roads) { plain(x0, z0, x1, z1, 0, ASF, 8, ASF2); MAP.push({ x0, z0, x1, z1, c: "#8a8698" }); }
    // faixas: amarela dupla no meio, tracejada branca nas avenidas, faixas de pedestre perto da praça
    const dash = (ax, fixed, a0, a1) => {
      for (let a = a0; a < a1; a += 4) {
        const b = Math.min(a1, a + 2);
        if (ax === "x") stripe(a, fixed - 0.07, b, fixed + 0.07, 0.012, YEL);
        else stripe(fixed - 0.07, a, fixed + 0.07, b, 0.012, YEL);
      }
    };
    dash("x", -36.5, BOUNDS.x0, -47); dash("x", -36.5, -38, 36); dash("x", -36.5, 45, BOUNDS.x1);
    dash("x", 36.5, BOUNDS.x0, -47); dash("x", 36.5, -38, 36); dash("x", 36.5, 45, BOUNDS.x1);
    dash("z", -42.5, BOUNDS.z0, -41); dash("z", -42.5, -32, 32); dash("z", -42.5, 41, BOUNDS.z1);
    dash("z", 40.5, BOUNDS.z0, -41); dash("z", 40.5, -32, 32); dash("z", 40.5, 41, BOUNDS.z1);
    const zebra = (ax, x0, z0, x1, z1) => {
      if (ax === "x") for (let x = x0; x < x1; x += 1.2) stripe(x, z0, x + 0.6, z1, 0.013, LINE);
      else for (let z = z0; z < z1; z += 1.2) stripe(x0, z, x1, z + 0.6, 0.013, LINE);
    };
    zebra("z", 36.3, -30, 44.7, -27.6); zebra("z", 36.3, 27.6, 44.7, 30);
    zebra("x", 47.6, -40.7, 50, -32.3); zebra("x", 47.6, 32.3, 50, 40.7);
    zebra("x", -36, -40.7, -33.6, -32.3); zebra("x", -36, 32.3, -33.6, 40.7);
    for (const [x, z] of [[40, -15], [-42, 20], [70, -36.5], [-70, 36.5], [12, 36.5], [40, 70]]) deco.decal([x, 0.012, z], [1, 0, 0], [0, 0, -1], 1.3, 1.3, RECT.manhole);
    // muros no fim das ruas (borda da cidade)
    const fim = (x0, z0, x1, z1, n, piece) => {
      solid.box(x0, 0, z0, x1, 3.2, z1, hex(0xf1e3c2), { top: C.white, noBottom: true });
      const c = [n[0] > 0 ? x1 + 0.02 : n[0] < 0 ? x0 - 0.02 : (x0 + x1) / 2, 1.6, n[2] > 0 ? z1 + 0.02 : n[2] < 0 ? z0 - 0.02 : (z0 + z1) / 2];
      const r = n[0] > 0 ? [0, 0, -1] : n[0] < 0 ? [0, 0, 1] : n[2] > 0 ? [1, 0, 0] : [-1, 0, 0];
      deco.decal(c, r, [0, 1, 0], 6.5, 2.9, RECT.piece[piece]);
    };
    fim(BOUNDS.x0 - 0.6, -41, BOUNDS.x0, -32, [1, 0, 0], 2);
    fim(BOUNDS.x0 - 0.6, 32, BOUNDS.x0, 41, [1, 0, 0], 5);
    fim(BOUNDS.x1, -41, BOUNDS.x1 + 0.6, -32, [-1, 0, 0], 7);
    fim(BOUNDS.x1, 32, BOUNDS.x1 + 0.6, 41, [-1, 0, 0], 0);
    // (no sul as duas ruas continuam descendo pro bairro da Ladeira; no norte terminam no muro)
    fim(-47, BOUNDS.z1, -38, BOUNDS.z1 + 0.6, [0, 0, -1], 1);
    fim(36, BOUNDS.z1, 45, BOUNDS.z1 + 0.6, [0, 0, -1], 4);

    // ---------- NO: casinhas ----------
    block(BOUNDS.x0, BOUNDS.z0, -47, -41, "se", "casas");
    row("z", -44, BOUNDS.x0, -50, 11, mix(50, 11, 0.3));
    row("x", -50, BOUNDS.z0, -55, 11, mix(45, 12, 0.3));
    fill(BOUNDS.x0, BOUNDS.z0, -61, -55);

    // ---------- SO: casinhas e uma lanchonete de esquina ----------
    block(BOUNDS.x0, 41, -47, Z1, "ne", "casas");
    row("-z", 44, BOUNDS.x0, -50, 11, [...mix(38, 21, 0.3), { w: 12, style: "loja", shop: 2, col: 0xe0483e }]);
    row("x", -50, 55, Z1, 11, mix(45, 22, 0.3));
    fill(BOUNDS.x0, 55, -61, Z1);
    for (const [x, z] of [[-55.5, 42.3], [-52, 42.3]]) {
      solid.tube([x, SW, z], [x, SW + 0.72, z], 0.05, 0.05, 5, hex(0xe0302b));
      solid.tube([x, SW + 0.72, z], [x, SW + 0.76, z], 0.45, 0.45, 10, hex(0xe0302b));
      ob(x, z, 0.45, SW + 0.76);
    }

    // ---------- O: supermercado + estacionamento ----------
    block(BOUNDS.x0, -32, -47, 32, "nse", "mercado", "#d8cbbb");
    row("-z", -29, BOUNDS.x0, -50, 10, mix(50, 31, 0.5));
    row("z", 29, BOUNDS.x0, -50, 10, mix(50, 32, 0.5));
    withY(SW, () => building(-100, -19, -80, 19, 8.5, "x", { col: 0xf5f1e6, shop: 9 }));
    MAP.push({ x0: -80, z0: -19, x1: -50, z1: 19, c: "#c9c3d6", name: "estacionamento" });
    plain(-80, -19, -50, 19, SW + 0.005, hex(0xb9b4c6), 6);
    // vagas
    for (let z = -18; z <= 18; z += 3) {
      stripe(-74.5, z - 0.06, -68.5, z + 0.06, SW + 0.012, LINE);
      stripe(-61.5, z - 0.06, -55.5, z + 0.06, SW + 0.012, LINE);
    }
    // batentes (dá grind) na cabeceira das vagas
    for (let z = -16.5; z <= 16.5; z += 3) {
      for (const x of [-74.2, -55.8]) {
        solid.box(x - 0.15, SW, z - 0.8, x + 0.15, SW + 0.15, z + 0.8, hex(0xf2c14e), { top: hex(0xffd23f) });
        fbox(x - 0.15, z - 0.8, x + 0.15, z + 0.8, SW + 0.15);
        rail([x, SW + 0.15, z - 0.7], [x, SW + 0.15, z + 0.7], "ledge", "batente");
      }
    }
    car(-71.5, -15, "x", 0xe0302b);
    car(-71.5, -6, "x", 0xf5f1e6);
    car(-71.5, 9, "x", 0x3f63c8);
    car(-58.5, -3, "x", 0x1fae5a);
    car(-58.5, 12, "x", 0xffd166);
    // doca de carga do mercado (ledge alto)
    ledgeBox(-80, -17, -77, -7, 0, SW + 1.0, hex(0xb3b0a8), hex(0xd6d2c6), "doca do mercado", "e");
    solid.box(-80, SW + 1.0, -17, -77, SW + 1.06, -7, hex(0xffd23f));
    stairs("z", -7, -4.6, -79.6, -77.4, SW + 1.0, SW, 3, "escada da doca");
    // carrinhos de supermercado
    for (const [x, z] of [[-66, 3.5], [-64.8, 3.5]]) {
      solid.box(x - 0.35, SW + 0.45, z - 0.5, x + 0.35, SW + 1.0, z + 0.5, hex(0xd5dbe8), { top: hex(0xd5dbe8) });
      for (const [a, b] of [[-0.3, -0.42], [0.3, -0.42], [-0.3, 0.42], [0.3, 0.42]]) solid.tube([x + a, SW, z + b], [x + a, SW + 0.45, z + b], 0.03, 0.03, 4, C.metal);
      ob(x, z, 0.5, SW + 1.0);
    }
    for (const z of [-12, 12]) lampPraca(-65, z);

    // ---------- N: escola estadual ----------
    block(-38, BOUNDS.z0, 36, -41, "wse", "escola", "#d8cbbb");
    row("z", -44, -35, -24, 12, [{ w: 11, style: "loja", shop: 1 }]);
    row("z", -44, 24, 33, 12, [{ w: 9, style: "loja", shop: 6 }]);
    row("-x", -35, BOUNDS.z0, -70, 11, mix(30, 41, 0.4));
    row("x", 33, BOUNDS.z0, -70, 11, mix(30, 42, 0.4));
    withY(SW, () => building(-24, BOUNDS.z0 + 12, 22, -66, 9.2, "z", { col: 0xf1e3c2, shop: 8 }));
    fill(-24, BOUNDS.z0, 22, BOUNDS.z0 + 12, 6);
    MAP.push({ x0: -35, z0: -70, x1: 33, z1: -44, c: "#ece6d8", name: "escola" });
    plain(-35, -70, 33, -44, SW + 0.005, hex(0xe7e1d3), 4, hex(0xdfd8c8));
    // varanda, escada e rampas com corrimão
    const PY = SW + 0.9;
    solid.box(-10, 0, -66, 10, PY, -62, C.ledge, { top: C.deck, noBottom: true });
    fbox(-10, -66, 10, -62, PY);
    rail([-9.9, PY, -62], [-3.1, PY, -62], "ledge", "varanda da escola");
    rail([3.1, PY, -62], [9.9, PY, -62], "ledge", "varanda da escola");
    stairs("z", -62, -58, -3, 3, PY, SW, 4, "escada da escola");
    handrail([-1.6, PY + 0.85, -62.3], [-1.6, SW + 0.85, -57.7], "corrimão da escola", () => SW);
    handrail([1.6, PY + 0.85, -62.3], [1.6, SW + 0.85, -57.7], "corrimão da escola", () => SW);
    for (const s of [-1, 1]) {
      const xa = s * 10, xb = s * 22;
      wedge(Math.min(xa, xb), -66, Math.max(xa, xb), -62, s > 0 ? PY : SW, s > 0 ? SW : PY, "x", C.ramp, C.ledge);
      framp(Math.min(xa, xb), -66, Math.max(xa, xb), -62, s > 0 ? PY : SW, s > 0 ? SW : PY, "x");
      const g = (x) => PY + ((SW - PY) * (Math.abs(x) - 10)) / 12;
      handrail([s * 10.3, g(10.3) + 0.85, -61.85], [s * 21.7, g(21.7) + 0.85, -61.85], "corrimão da rampa", (x) => g(x));
    }
    // mastro e bancos do pátio
    solid.tube([-16, SW, -50], [-16, SW + 7, -50], 0.07, 0.05, 6, C.metal, 1);
    deco.quad([-16, SW + 6.9, -50], [-14.4, SW + 6.9, -50], [-14.4, SW + 5.9, -50], [-16, SW + 5.9, -50], hex(0x1fae5a));
    ob(-16, -50, 0.1, SW + 7);
    for (const s of [-1, 1]) ledgeBox(s * 20 - 0.45, -57, s * 20 + 0.45, -48, SW, SW + 0.46, C.ledge, C.deck, "banco do pátio");

    // ---------- NE: Praça da Matriz ----------
    block(45, BOUNDS.z0, BOUNDS.x1, -41, "ws", "praça da matriz", "#e2d6c2");
    MAP.push({ x0: 48, z0: -70, x1: 104, z1: -44, c: "#cfe3c4", name: "praça" });
    pave(48, -77, 104, -44, SW + 0.006, RECT.petit, 2.4);
    // igreja: nave com frontão e torre na frente (forma genérica)
    {
      const cr = hex(0xf4ecd8), tr = hex(0xffffff), tl = hex(0xc8643c);
      const X = 78, Y0 = SW + 1.0;
      solid.box(69, 0, BOUNDS.z0, 87, 11, -82, cr, { noBottom: true });
      solid.quad([68.4, 11, BOUNDS.z0], [68.4, 11, -82], [X, 16, -82], [X, 16, BOUNDS.z0], tl);
      solid.quad([87.6, 11, BOUNDS.z0], [X, 16, BOUNDS.z0], [X, 16, -82], [87.6, 11, -82], tl);
      solid.tri([69, 11, -81.99], [87, 11, -81.99], [X, 16, -81.99], cr);
      solid.box(X - 3.5, 0, -84, X + 3.5, 26, -77, cr, { noBottom: true });
      for (const y of [11, 18.5, 26]) solid.box(X - 3.85, y, -84.35, X + 3.85, y + 0.7, -76.65, tr);
      deco.quad([X - 1.3, 20, -76.97], [X + 1.3, 20, -76.97], [X + 1.3, 25.4, -76.97], [X - 1.3, 25.4, -76.97], hex(0x5a6a8a));
      deco.quad([X - 1.5, Y0, -76.97], [X + 1.5, Y0, -76.97], [X + 1.5, Y0 + 4.6, -76.97], [X - 1.5, Y0 + 4.6, -76.97], hex(0x7a4a2c));
      solid.ball([X, 14.6, -76.9], 1.15, tr, 0, 10, 4, { sz: 0.15 });
      solid.tube([X, 14.6, -76.75], [X + 0.6, 15.2, -76.75], 0.05, 0.05, 4, C.dark);
      const T = [X, 34, -80.5], b = 26.7;
      const st = solid.v.length;
      for (const [p, q] of [[[X - 3.7, b, -84.2], [X + 3.7, b, -84.2]], [[X + 3.7, b, -84.2], [X + 3.7, b, -76.8]], [[X + 3.7, b, -76.8], [X - 3.7, b, -76.8]], [[X - 3.7, b, -76.8], [X - 3.7, b, -84.2]]]) solid.tri(p, q, T, hex(0x6f8fb8));
      solid.orient([X, b, -80.5], st);
      solid.box(X - 0.16, 34, -80.66, X + 0.16, 38, -80.34, tr);
      solid.box(X - 1.2, 36.1, -80.66, X + 1.2, 36.5, -80.34, tr);
      fbox(69, BOUNDS.z0, 87, -82, 60);
      fbox(X - 3.5, -84, X + 3.5, -77, 60);
      // adro + escadaria com corrimão no meio + muretas
      solid.box(60, 0, -77, 96, Y0, -70, hex(0xe6dccb), { top: hex(0xefe7d8), noBottom: true });
      fbox(60, -77, 96, -70, Y0);
      rail([60.2, Y0, -70], [71.8, Y0, -70], "ledge", "mureta do adro");
      rail([84.2, Y0, -70], [95.8, Y0, -70], "ledge", "mureta do adro");
      stairs("z", -70, -66, 72, 84, Y0, SW, 5, "escadaria da igreja");
      handrail([78, Y0 + 0.85, -70.35], [78, SW + 0.85, -65.65], "corrimão da igreja", () => SW);
      for (const x of [62, 94]) { solid.tube([x, Y0, -71], [x, Y0 + 1.2, -71], 0.25, 0.22, 8, C.white); ob(x, -71, 0.25, Y0 + 1.2); }
      MAP.push({ x0: 69, z0: -100, x1: 87, z1: -77, c: "#f4ecd8", name: "igreja" });
    }
    row("z", -77, 48, 60, 23, [{ w: 12, style: "casas" }]);
    row("z", -77, 96, BOUNDS.x1, 23, [{ w: 16, style: "casas" }]);
    fill(60, BOUNDS.z0, 69, -77); fill(87, BOUNDS.z0, 96, -77); fill(104, -77, BOUNDS.x1, -70);
    row("-x", 104, -70, -44, 8, [{ w: 13, style: "loja", shop: 3, col: 0xf2c14e }, { w: 13, style: "loja", shop: 0, col: 0x7cc8ff }]);
    // coreto octogonal
    {
      const CX = 76, CZ = -57, Rr = 4.2, H = SW + 0.7;
      const ang = (i) => (i * Math.PI) / 4 + Math.PI / 8;
      const P = (i, r = Rr, y = H) => [CX + Math.cos(ang(i)) * r, y, CZ + Math.sin(ang(i)) * r];
      let st = solid.v.length;
      for (let i = 0; i < 8; i++) {
        solid.tri([CX, H, CZ], P(i + 1), P(i), hex(0xefe7d8));
        solid.quad(P(i, Rr, 0), P(i + 1, Rr, 0), P(i + 1), P(i), hex(0xc9b9a6));
      }
      solid.orient([CX, H * 0.4, CZ], st);
      for (let i = 0; i < 8; i++) rail(P(i, Rr - 0.02), P(i + 1, Rr - 0.02), "ledge", "beirada do coreto");
      const inR = Rr * Math.cos(Math.PI / 8);
      feats.push({
        x0: CX - Rr, z0: CZ - Rr, x1: CX + Rr, z1: CZ + Rr,
        f: (x, z) => {
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4 + Math.PI / 4;
            if ((x - CX) * Math.cos(a) + (z - CZ) * Math.sin(a) > inR) return -9;
          }
          return H;
        },
      });
      for (let i = 0; i < 8; i++) {
        const p = P(i, 3.55, H);
        solid.tube(p, V.add(p, [0, 2.9, 0]), 0.09, 0.09, 6, C.white);
        ob(p[0], p[2], 0.1, H + 2.9);
      }
      st = solid.v.length;
      for (let i = 0; i < 8; i++) solid.tri(P(i, 4.7, H + 2.9), P(i + 1, 4.7, H + 2.9), [CX, H + 4.7, CZ], i % 2 ? hex(0x3fae9a) : hex(0x2f9488));
      solid.orient([CX, H + 2.5, CZ], st);
      st = solid.v.length;
      for (let i = 0; i < 8; i++) solid.quad(P(i, 4.7, H + 2.9), P(i + 1, 4.7, H + 2.9), P(i + 1, 4.7, H + 2.6), P(i, 4.7, H + 2.6), C.white);
      solid.orient([CX, H + 2.75, CZ], st);
      solid.ball([CX, H + 4.85, CZ], 0.22, YEL, 0, 6, 4);
      // rampinha pra subir no coreto (leste)
      wedge(CX + inR - 0.2, CZ - 1.4, CX + inR + 3.6, CZ + 1.4, H, SW, "x", C.ramp, hex(0xc9b9a6));
      framp(CX + inR - 0.2, CZ - 1.4, CX + inR + 3.6, CZ + 1.4, H, SW, "x");
      MAP.push({ x0: CX - Rr, z0: CZ - Rr, x1: CX + Rr, z1: CZ + Rr, c: "#3fae9a", name: "coreto" });
    }
    // canteiros com palmeira, bancos e postes da praça
    for (const [x, z] of [[58, -50], [94, -50], [58, -63], [94, -63]]) {
      ledgeBox(x - 3, z - 2, x + 3, z + 2, 0, SW + 0.5, C.brick, hex(0x6b4a3a), "canteiro da praça");
      for (let i = 0; i < 4; i++) solid.ball([x - 2 + i * 1.33, SW + 0.75, z + (i % 2 ? 1 : -1)], 0.5, i % 2 ? C.leaf : C.leaf2, 0, 6, 4);
      palm(x, SW + 0.5, z, 0.95, 0.3, 0.1);
      ob(x, z, 0.2, SW + 5);
    }
    for (const [x0, x1, z] of [[66, 71, -46.2], [81, 86, -46.2], [66, 71, -67.8], [81, 86, -67.8]]) ledgeBox(x0, z - 0.4, x1, z + 0.4, SW, SW + 0.46, C.ledge, C.deck, "banco da praça");
    for (const [x, z] of [[68, -51], [84, -51], [68, -63], [84, -63], [50, -46], [102, -46]]) lampPraca(x, z);

    // ---------- avenida que sobe até o mirante (Av. Serviliano Silva) ----------
    const AX0 = 45, AX1 = 100, AH = 5;
    const yr = (x) => (x <= AX0 ? 0 : x >= AX1 ? AH : (AH * (x - AX0)) / (AX1 - AX0));
    plain(AX0, -5, AX1, -1, 0, ASF, 55, null, yr);
    plain(AX0, 1, AX1, 5, 0, ASF, 55, null, yr);
    framp(AX0, -5, AX1, 5, 0, AH, "x");
    for (let x = AX0 + 2; x < AX1 - 2; x += 4) {
      deco.quad([x, yr(x) + 0.012, -3.07], [x, yr(x) + 0.012, -2.93], [x + 2, yr(x + 2) + 0.012, -2.93], [x + 2, yr(x + 2) + 0.012, -3.07], LINE);
      deco.quad([x, yr(x) + 0.012, 2.93], [x, yr(x) + 0.012, 3.07], [x + 2, yr(x + 2) + 0.012, 3.07], [x + 2, yr(x + 2) + 0.012, 2.93], LINE);
    }
    // calçadas inclinadas com guia
    for (const [z0, z1, zc] of [[-7, -5, -5], [5, 7, 5]]) {
      pave(AX0, z0, AX1, z1, 0, RECT.pav, 2, (x) => yr(x) + SW + 0.006);
      framp(AX0, z0, AX1, z1, SW, AH + SW, "x");
      const zz = zc < 0 ? [zc - 0.3, zc] : [zc, zc + 0.3];
      wedge(AX0, zz[0], AX1, zz[1], SW, AH + SW, "x", C.curb, C.curbS, 0);
      rail([AX0 + 0.5, yr(AX0 + 0.5) + SW, zc], [AX1 - 0.5, yr(AX1 - 0.5) + SW, zc], "ledge", "guia da avenida");
    }
    // canteiro central com grama e palmeiras (ledge inclinado dos dois lados)
    {
      const m0 = AX0 + 3, m1 = AX1 - 3, mh = 0.45;
      wedge(m0, -1, m1, 1, yr(m0) + mh, yr(m1) + mh, "x", hex(0x6fbf5c), hex(0xd6d2c6), 0);
      framp(m0, -1, m1, 1, yr(m0) + mh, yr(m1) + mh, "x");
      rail([m0 + 0.3, yr(m0 + 0.3) + mh, -1], [m1 - 0.3, yr(m1 - 0.3) + mh, -1], "ledge", "canteiro da avenida");
      rail([m0 + 0.3, yr(m0 + 0.3) + mh, 1], [m1 - 0.3, yr(m1 - 0.3) + mh, 1], "ledge", "canteiro da avenida");
      for (let x = m0 + 6; x < m1 - 3; x += 12) { palm(x, yr(x) + mh, 0, 0.9, 0.2, 0.1); ob(x, 0, 0.2, yr(x) + mh + 4.5); }
      MAP.push({ x0: AX0, z0: -7, x1: BOUNDS.x1, z1: 7, c: "#9b97ab", name: "avenida" });
      MAP.push({ x0: m0, z0: -1, x1: m1, z1: 1, c: "#6fbf5c" });
    }
    // mirante no alto: guarda-corpo de ferro com X (grind), banco e a luneta
    {
      const MY = AH + SW;
      fbox(AX1, -7, BOUNDS.x1, 7, MY);
      solid.box(AX1, 0, -7, BOUNDS.x1, MY, 7, hex(0xd6d2c6), { noBottom: true, top: hex(0xe2dccf) });
      pave(AX1, -7, BOUNDS.x1, 7, MY + 0.006, RECT.pav);
      const GX = BOUNDS.x1 - 0.7, n = 7, z0 = -6.8, z1 = 6.8, sl = (z1 - z0) / n;
      for (let i = 0; i <= n; i++) solid.tube([GX, MY, z0 + i * sl], [GX, MY + 1, z0 + i * sl], 0.05, 0.05, 4, C.gradil, 1);
      solid.tube([GX, MY + 1, z0 - 0.05], [GX, MY + 1, z1 + 0.05], 0.055, 0.055, 6, C.gradil, 1);
      solid.tube([GX, MY + 0.14, z0], [GX, MY + 0.14, z1], 0.035, 0.035, 4, C.gradil, 1);
      for (let i = 0; i < n; i++) {
        const a = z0 + i * sl, b = a + sl;
        solid.tube([GX, MY + 0.14, a], [GX, MY + 1, b], 0.03, 0.03, 4, C.gradil, 1);
        solid.tube([GX, MY + 1, a], [GX, MY + 0.14, b], 0.03, 0.03, 4, C.gradil, 1);
      }
      rail([GX, MY + 1, z0 + 0.1], [GX, MY + 1, z1 - 0.1], "rail", "guarda-corpo do mirante");
      OB.push({ x0: GX - 0.06, x1: GX + 0.06, z0, z1, y1: MY + 0.95 });
      ledgeBox(105, -6.2, 108.5, -5.4, MY, MY + 0.48, hex(0xdcd6ca), hex(0xe8e3d8), "banco do mirante");
      ledgeBox(105, 5.4, 108.5, 6.2, MY, MY + 0.48, hex(0xdcd6ca), hex(0xe8e3d8), "banco do mirante");
      solid.tube([109.6, MY, 0], [109.6, MY + 1.1, 0], 0.06, 0.06, 6, C.dark);
      solid.tube([109.3, MY + 1.25, 0], [110, MY + 1.4, 0], 0.16, 0.12, 8, hex(0x2f9488));
      ob(109.6, 0, 0.18, MY + 1.4);
      for (const z of [-5.6, 5.6]) palm(102, MY, z, 0.9, 0.2, z > 0 ? -0.2 : 0.2);
      ob(102, -5.6, 0.2, MY + 4.5); ob(102, 5.6, 0.2, MY + 4.5);
    }
    // quarteirões da avenida (os prédios acompanham a subida)
    block(45, -32, BOUNDS.x1, -7, "nw", "avenida norte", "#d8cbbb");
    block(45, 7, BOUNDS.x1, 32, "sw", "avenida sul", "#d8cbbb");
    const yAv = (a) => yr(a) + SW;
    row("-z", -29, 48, BOUNDS.x1, 11, mix(64, 51, 0.5));
    row("z", 29, 48, BOUNDS.x1, 11, mix(64, 52, 0.5));
    // lan house (do Dudu) e loja de discos na avenida, do lado da pista
    row("z", -7, 48, AX1, 11, [{ w: 8, style: "loja", shop: 0, col: 0xf5f1e6 }, { w: 8, style: "casas" }, { w: 7, style: "loja", shop: 3 }, { w: 8, style: "casas" }, { w: 9, style: "loja", shop: 5 }, { w: 6, style: "casas" }, { w: 6, style: "casas" }], (a) => yAv(a));
    row("-z", 7, 48, AX1, 11, [{ w: 7, style: "casas" }, { w: 9, style: "loja", shop: 2 }, { w: 8, style: "casas" }, { w: 8, style: "loja", shop: 1 }, { w: 7, style: "casas" }, { w: 7, style: "loja", shop: 6 }, { w: 6, style: "casas" }], (a) => yAv(a));
    withY(AH + SW, () => { building(AX1, -18, BOUNDS.x1, -7, 7.4, "z", { style: "casas" }); building(AX1, 7, BOUNDS.x1, 18, 7.4, "-z", { style: "casas" }); });

    // ---------- S: comércio + banco com escadaria ----------
    block(-38, 41, 36, Z1, "wne", "comércio", "#d8cbbb");
    // lan house e loja de discos: no plano, de frente pra pista (do lado da sorveteria)
    row("-z", 44, -35, -6, 12, [{ w: 10, style: "loja", sign: RECT.town[5], signW: 4.6, signA: 4.27, col: 0x2b2a55 }, { w: 9, style: "loja", sign: RECT.town[6], signW: 4.6, signA: 4.27, col: 0xf2c14e }, { w: 10, h: 10, col: 0xffd166 }]);
    // sorveteria Pinguim (ponto de encontro com a Julie), do outro lado da rua da pista
    row("-z", 44, 10, 33, 12, [{ w: 11, style: "loja", sign: RECT.town[4], col: 0xff9ccf, h: 7.6 }, { w: 12, style: "loja", shop: 7 }]);
    // pontos de ônibus: banco + placa (o circular para aqui)
    const STOPS = [[0, 43.55, 0], [-4, 111.0, 0], [-20, -199.3, -10]];
    for (const [x, z, y] of STOPS) {
      solid.box(x - 1.4, y + SW + 0.42, z - 0.25, x + 1.4, y + SW + 0.5, z + 0.25, hex(0x2457c8), { top: hex(0x3f7ae8) });
      for (const dx of [-1.2, 1.2]) solid.box(x + dx - 0.05, y + SW, z - 0.2, x + dx + 0.05, y + SW + 0.42, z + 0.2, C.metal);
      fbox(x - 1.4, z - 0.25, x + 1.4, z + 0.25, y + SW + 0.5);
      rail([x - 1.3, y + SW + 0.5, z - 0.25], [x + 1.3, y + SW + 0.5, z - 0.25], "ledge", "banco do ponto");
      solid.tube([x + 1.9, y + SW, z], [x + 1.9, y + SW + 2.6, z], 0.05, 0.05, 6, C.metal, 1);
      solid.box(x + 1.55, y + SW + 2.1, z - 0.04, x + 2.25, y + SW + 2.7, z + 0.04, hex(0x2457c8), { top: hex(0x2457c8) });
      deco.quad([x + 1.6, y + SW + 2.2, z - 0.05], [x + 2.2, y + SW + 2.2, z - 0.05], [x + 2.2, y + SW + 2.6, z - 0.05], [x + 1.6, y + SW + 2.6, z - 0.05], hex(0xffd23f), 2);
      deco.quad([x + 2.2, y + SW + 2.2, z + 0.05], [x + 1.6, y + SW + 2.2, z + 0.05], [x + 1.6, y + SW + 2.6, z + 0.05], [x + 2.2, y + SW + 2.6, z + 0.05], hex(0xffd23f), 2);
      OB.push({ x: x + 1.9, z, r: 0.08, y1: y + SW + 2.6 });
    }
    row("x", 33, 56, Z1, 11, mix(44, 61, 0.5));
    row("-x", -35, 56, Z1, 11, mix(44, 62, 0.5));
    withY(SW, () => building(-6, 52, 10, 66, 9.6, "-z", { col: 0xeef3ff, shop: 10 }));
    fill(-24, 56, 22, Z1);
    {
      const BY = SW + 0.8;
      solid.box(-4, 0, 48, 8, BY, 52, C.ledge, { top: C.deck, noBottom: true });
      fbox(-4, 48, 8, 52, BY);
      stairs("z", 48, 44, -4, 8, BY, SW, 4, "escada do banco");
      handrail([2, BY + 0.85, 48.3], [2, SW + 0.85, 43.7], "corrimão do banco", () => SW);
      for (const [x0, x1] of [[-6, -4], [8, 10]]) {
        ledgeBox(x0, 44, x1, 52, 0, BY + 0.45, C.brick, hex(0x6b4a3a), "floreira do banco");
        for (let i = 0; i < 4; i++) solid.ball([(x0 + x1) / 2, BY + 0.65, 45 + i * 2], 0.55, i % 2 ? C.leaf : C.leaf2, 0, 6, 4);
      }
      MAP.push({ x0: -6, z0: 44, x1: 10, z1: 52, c: "#cfc6e6", name: "banco" });
    }
    // ponto de ônibus
    {
      const x = 22, z = 42.4;
      solid.box(x - 2, SW + 2.4, z - 0.6, x + 2, SW + 2.55, z + 1.0, hex(0x2f6fdc));
      for (const dx of [-1.9, 1.9]) { solid.tube([x + dx, SW, z + 0.9], [x + dx, SW + 2.4, z + 0.9], 0.05, 0.05, 5, C.metal, 1); ob(x + dx, z + 0.9, 0.06, SW + 2.4); }
      deco.quad([x - 1.9, SW + 0.5, z + 0.95], [x + 1.9, SW + 0.5, z + 0.95], [x + 1.9, SW + 2.3, z + 0.95], [x - 1.9, SW + 2.3, z + 0.95], C.glass, 3);
      ledgeBox(x - 1.7, z + 0.3, x + 1.7, z + 0.8, SW, SW + 0.46, hex(0x2f6fdc), hex(0x7cc8ff), "banco do ponto");
    }

    // ---------- SE: quadra, arquibancada e parquinho ----------
    block(45, 41, BOUNDS.x1, Z1, "wn", "quadra", "#d8cbbb");
    row("-x", 104, 44, Z1, 8, [{ w: 14, style: "casas" }, { w: 12, style: "loja", shop: 5 }, { w: 33, style: "casas" }]);
    withY(SW, () => building(48, 82, 104, Z1, 9, "-z", { col: 0xeae4d6 }));
    plain(48, 44, 104, 82, SW + 0.005, hex(0xe7e1d3), 4);
    MAP.push({ x0: 58, z0: 50, x1: 96, z1: 72, c: "#4fb59a", name: "quadra" });
    plain(58, 50, 96, 72, SW + 0.01, hex(0x4fb59a), 38);
    {
      const y = SW + 0.016, L2 = (x0, z0, x1, z1) => stripe(x0, z0, x1, z1, y, LINE);
      L2(58.2, 50.2, 95.8, 50.4); L2(58.2, 71.6, 95.8, 71.8); L2(58.2, 50.2, 58.4, 71.8); L2(95.6, 50.2, 95.8, 71.8); L2(76.9, 50.2, 77.1, 71.8);
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, b = ((i + 1) / 24) * Math.PI * 2; deco.quad([77 + Math.cos(a) * 3, y, 61 + Math.sin(a) * 3], [77 + Math.cos(a) * 3.2, y, 61 + Math.sin(a) * 3.2], [77 + Math.cos(b) * 3.2, y, 61 + Math.sin(b) * 3.2], [77 + Math.cos(b) * 3, y, 61 + Math.sin(b) * 3], LINE); }
      for (const x of [58.6, 95.4]) {
        const s = x < 77 ? -1 : 1;
        for (const z of [59.5, 62.5]) { solid.tube([x, SW, z], [x, SW + 2, z], 0.06, 0.06, 5, C.white); ob(x, z, 0.08, SW + 2); }
        solid.tube([x, SW + 2, 59.5], [x, SW + 2, 62.5], 0.06, 0.06, 5, C.white);
        solid.tube([x, SW + 2, 59.5], [x + s * 1.1, SW, 59.5], 0.03, 0.03, 4, C.white);
        solid.tube([x, SW + 2, 62.5], [x + s * 1.1, SW, 62.5], 0.03, 0.03, 4, C.white);
      }
      // arquibancada: 4 degraus altos (cada beirada dá grind)
      for (let i = 0; i < 4; i++) {
        const z0 = 74 + i * 2, h = SW + 0.45 * (i + 1);
        solid.box(60, 0, z0, 94, h, z0 + 2, i % 2 ? hex(0xd8d2c4) : hex(0xccc5b6), { top: i % 2 ? hex(0x7cc8ff) : hex(0xff8dc0), noBottom: true });
        fbox(60, z0, 94, z0 + 2, h);
        rail([60.2, h, z0], [93.8, h, z0], "ledge", "arquibancada");
      }
      MAP.push({ x0: 60, z0: 74, x1: 94, z1: 82, c: "#ff8dc0", name: "arquibancada" });
      // parquinho
      const px = 100, pz = 49;
      solid.box(px - 0.8, SW, pz - 0.8, px + 0.8, SW + 1.6, pz + 0.8, hex(0xff8a1f), { top: hex(0xffd23f) });
      fbox(px - 0.8, pz - 0.8, px + 0.8, pz + 0.8, SW + 1.6);
      solid.box(px - 0.7, SW + 1.6, pz - 0.7, px + 0.7, SW + 2.6, pz + 0.7, hex(0x2f6fdc), { top: hex(0xe0302b) });
      wedge(px - 0.5, pz + 0.8, px + 0.5, pz + 4.4, SW + 1.6, SW + 0.2, "z", hex(0x3fd0ff), hex(0x2f6fdc));
      framp(px - 0.5, pz + 0.8, px + 0.5, pz + 4.4, SW + 1.6, SW + 0.2, "z");
      for (const dz of [0, 1.5]) { solid.tube([px - 3, SW, pz + 6 + dz], [px - 3, SW + 2.2, pz + 6 + dz], 0.06, 0.06, 5, hex(0xe0302b)); }
      solid.tube([px - 3, SW + 2.2, pz + 6], [px - 3, SW + 2.2, pz + 7.5], 0.06, 0.06, 5, hex(0xe0302b));
      ob(px - 3, pz + 6, 0.08, SW + 2.2); ob(px - 3, pz + 7.5, 0.08, SW + 2.2);
    }

    // ---------- árvores, postes e placas ao longo das ruas ----------
    posteLine("x", -43.2, -96, -52, 16, [0, 1]);
    posteLine("x", 43.2, -96, -52, 16, [0, -1]);
    posteLine("x", -43.2, -34, 32, 22, [0, 1]);
    posteLine("x", 43.2, -34, 32, 22, [0, -1]);
    posteLine("x", -30.6, 50, 108, 14.5, [0, -1]);
    posteLine("x", 30.6, 50, 108, 14.5, [0, 1]);
    posteLine("z", -48.8, -96, -46, 16, [1, 0]);
    posteLine("z", -48.8, 46, 96, 16, [1, 0]);
    posteLine("z", 46.4, 46, 96, 16, [-1, 0]);
    posteLine("x", -6.4, 50, 94, 11, [0, 1], (x) => yr(x) + SW);
    posteLine("x", 6.4, 50, 94, 11, [0, -1], (x) => yr(x) + SW);
    for (const [x, z, c] of [[-60, -42.6, 0xff8fc8], [-86, -42.6, 0xffd23f], [-80, 42.6, 0xff8fc8], [-25, 42.6, 0xffd23f], [-20, -42.6, 0xff8fc8], [66, -30.4, 0xffd23f], [92, 30.4, 0xff8fc8], [-48.6, 70, 0xffd23f], [46.6, -60, 0xff8fc8], [46.6, 64, 0xffd23f]])
      ipe(x, z, SW, c);
    for (const [x, z] of [[-36.5, -50], [46.6, -20], [-48.5, 20], [-36.5, 50], [46.6, 50], [30, -42.8]]) lixeira(x, z);
    plate(46.4, -42.6, 0, Math.PI / 2);
    plate(46.6, 8.2, 1, 0);
    plate(-48.6, -42.6, 2, 0);
    plate(-48.6, 42.6, 3, 0);
    // placa verde na entrada da avenida
    solid.tube([46.2, SW, -9], [46.2, SW + 4.3, -9], 0.06, 0.06, 6, C.metal, 1);
    solid.tube([46.2, SW, -12.4], [46.2, SW + 4.3, -12.4], 0.06, 0.06, 6, C.metal, 1);
    deco.decal([46.12, SW + 3.4, -10.7], [0, 0, 1], [0, 1, 0], 3.3, 1.65, RECT.road);
    ob(46.2, -9, 0.08, SW + 4.3); ob(46.2, -12.4, 0.08, SW + 4.3);
    // carros parados na rua
    car(44.0, -60, "z", 0xf5f1e6, 0);
    car(44.0, 66, "z", 0x7cc8ff, 0);
    car(-75, -33.0, "x", 0xffd166, 0);
    car(86, 40.0, "x", 0xe0302b, 0);
    // outdoors em cima de prédios
    billboard([8, SW + 9.2 + 3.2, -84], [1, 0, 0], RECT.bill[0]);
    billboard([-11, SW + 10 + 3.2, 50], [-1, 0, 0], RECT.bill[1]);


    // =====================================================================================
    // ---------- cidade nova (z 100 a 300): prefeitura, estação, campo, mercadão e posto ----------
    // =====================================================================================
    {
      const X0 = BOUNDS.x0, X1 = BOUNDS.x1, Z2 = BOUNDS.z1;
      // ruas: R. XV de Novembro (z 100-109) e Av. Brasil (z 200-209)
      for (const [x0, z0, x1, z1] of [[X0, 100, X1, 109], [X0, 200, X1, 209]]) { plain(x0, z0, x1, z1, 0, ASF, 8, ASF2); MAP.push({ x0, z0, x1, z1, c: "#8a8698" }); }
      dash("x", 104.5, X0, -47); dash("x", 104.5, -38, 36); dash("x", 104.5, 45, X1);
      dash("x", 204.5, X0, -47); dash("x", 204.5, -38, 36); dash("x", 204.5, 45, X1);
      zebra("z", 36.3, 110.4, 44.7, 112.8); zebra("z", -46.7, 110.4, -38.3, 112.8); zebra("z", 36.3, 196.2, 44.7, 198.6);
      fim(X0 - 0.6, 100, X0, 109, [1, 0, 0], 3); fim(X0 - 0.6, 200, X0, 209, [1, 0, 0], 6);
      fim(X1, 100, X1 + 0.6, 109, [-1, 0, 0], 1); fim(X1, 200, X1 + 0.6, 209, [-1, 0, 0], 2);
      // fundos das quadras antigas viram calçada com guia pra rua nova
      for (const [x0, x1] of [[X0, -47], [-38, 36], [45, X1]]) {
        solid.box(x0, 0, 99.7, x1, SW, 100, C.curbS, { top: C.curb, noBottom: true });
        rail([x0 + 0.4, SW, 100], [x1 - 0.4, SW, 100], "ledge", "guia amarela");
      }
      const TB = hex(0xf3e6c8), TBw = C.white;

      // ---------- prefeitura e praça cívica (centro) ----------
      block(-38, 109, 36, 200, "wnes", "praça cívica", "#d3ccdf");
      pave(-35, 112, 33, 166, SW + 0.006, RECT.petit, 2);
      // chafariz redondo: borda dá grind (octógono), água por dentro
      {
        // baixo e menor que antes pra dar pra pular por cima: só a borda e um bico no meio; o jato d'água não bate
        const cx = -1, cz = 136, R1 = 2.4, Hc = SW + 0.42;
        solid.tube([cx, SW, cz], [cx, Hc, cz], R1, R1, 16, hex(0xe9e2d2), 0, { capCol: hex(0xe9e2d2) });
        solid.tube([cx, Hc - 0.18, cz], [cx, Hc - 0.16, cz], R1 - 0.35, R1 - 0.35, 16, hex(0x4fb6e8), 3, { capCol: hex(0x6cc8f2) });
        solid.tube([cx, Hc - 0.2, cz], [cx, Hc + 0.3, cz], 0.45, 0.32, 8, hex(0xe9e2d2));
        deco.tube([cx, Hc + 0.3, cz], [cx, Hc + 1.5, cz], 0.07, 0.03, 6, hex(0xbfeaff), 2);
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; deco.tube([cx, Hc + 1.45, cz], [cx + Math.cos(a) * 0.9, Hc + 0.2, cz + Math.sin(a) * 0.9], 0.03, 0.02, 4, hex(0x9ad8f5), 2); }
        feats.push({ x0: cx - R1, z0: cz - R1, x1: cx + R1, z1: cz + R1, f: (x, z) => { const d = Math.hypot(x - cx, z - cz); return d > R1 ? 0 : d > R1 - 0.4 ? Hc : d < 0.5 ? Hc + 0.3 : Hc - 0.18; } });
        for (let i = 0; i < 8; i++) {
          const a0 = (i / 8) * Math.PI * 2 + Math.PI / 8, a1 = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8;
          rail([cx + Math.cos(a0) * (R1 - 0.12), Hc, cz + Math.sin(a0) * (R1 - 0.12)], [cx + Math.cos(a1) * (R1 - 0.12), Hc, cz + Math.sin(a1) * (R1 - 0.12)], "ledge", "borda do chafariz");
        }
      }
      // canteiros com palmeira e bancos (ledges)
      for (const [x, z] of [[-24, 122], [22, 122], [-24, 150], [22, 150]]) {
        ledgeBox(x - 3.5, z - 1.6, x + 3.5, z + 1.6, SW, SW + 0.55, hex(0xd8d2c4), hex(0x6fbf5a), "canteiro da praça");
        palm(x, SW + 0.55, z, 0.9);
        OB.push({ x, z, r: 0.3, y1: SW + 5 });
      }
      for (const [x, z] of [[-12, 125], [10, 125], [-12, 147], [10, 147]]) ledgeBox(x - 1.6, z - 0.32, x + 1.6, z + 0.32, SW, SW + 0.46, hex(0x9a6a3e), hex(0xb57d4a), "banco da praça");
      for (const [x, z] of [[-30, 114], [28, 114], [-30, 162], [28, 162], [-12, 114], [10, 114]]) lampPraca(x, z);
      // mastros com bandeiras (cores inventadas: verde/amarelo, vermelho/branco/preto e azul/branco)
      [[-7, [0x1f9a4a, 0xffd23f]], [-1, [0xe0302b, 0xffffff, 0x1b1530]], [5, [0x2457c8, 0xffffff]]].forEach(([x, cols]) => {
        solid.tube([x, SW, 163], [x, SW + 9, 163], 0.07, 0.05, 6, C.metal, 1);
        cols.forEach((c, i) => deco.quad([x + 0.08, SW + 8.7 - i * 0.45, 163], [x + 2.2, SW + 8.7 - i * 0.45, 163], [x + 2.2, SW + 8.25 - i * 0.45, 163], [x + 0.08, SW + 8.25 - i * 0.45, 163], hex(c)));
        OB.push({ x, z: 163, r: 0.1, y1: SW + 9 });
      });
      // terraço da prefeitura com escadaria e corrimãos
      const TH = SW + 1.4;
      ledgeBox(-26, 166, 24, 176, SW, TH, hex(0xe9e2d2), hex(0xf1ece3), "terraço da prefeitura", "nwe");
      stairs("z", 166, 161, -9, 7, TH, SW, 7, "escadaria da prefeitura");
      const gy = (x, z) => (z > 166 ? TH : z < 161 ? SW : SW + ((z - 161) / 5) * (TH - SW));
      handrail([-9.4, TH + 0.85, 166], [-9.4, SW + 0.85, 161], "corrimão da prefeitura", gy);
      handrail([7.4, TH + 0.85, 166], [7.4, SW + 0.85, 161], "corrimão da prefeitura", gy);
      handrail([-1, TH + 0.85, 166], [-1, SW + 0.85, 161], "corrimão do meio", gy);
      // prédio: dois andares, colunas, frontão com relógio
      {
        const y0 = TH, x0 = -22, x1 = 20, z0 = 176, z1 = 196, h = 10;
        solid.box(x0, y0, z0, x1, y0 + h, z1, TB, { top: V.mul(TB, 0.9), noBottom: true });
        solid.box(x0 - 0.3, y0 + h, z0 - 0.3, x1 + 0.3, y0 + h + 0.6, z1 + 0.3, TBw, { noBottom: true });
        solid.box(x0 - 0.2, y0 + 4.6, z0 - 0.2, x1 + 0.2, y0 + 5.0, z1 + 0.2, TBw, { noBottom: true });
        fbox(x0, z0, x1, z1, 60);
        const F = { o: [(x0 + x1) / 2, y0, z0 - 0.03], r: [-1, 0, 0], n: [0, 0, -1] };
        for (let f = 0; f < 2; f++) for (let i = 0; i < 12; i++) {
          if (f === 0 && i > 3 && i < 8) continue;
          const x = x0 + 1.4 + i * 3.4, yy = y0 + 1.1 + f * 4.6, zf = z0 - 0.03;
          deco.quad([x + 1.5, yy, zf], [x, yy, zf], [x, yy + 2.6, zf], [x + 1.5, yy + 2.6, zf], C.white);
          deco.quad([x + 1.3, yy + 0.15, zf - 0.01], [x + 0.2, yy + 0.15, zf - 0.01], [x + 0.2, yy + 2.45, zf - 0.01], [x + 1.3, yy + 2.45, zf - 0.01], (i + f) % 4 ? C.win : C.winL, (i + f) % 4 ? 0 : 2);
        }
        // pórtico: 6 colunas e frontão triangular
        for (let i = 0; i < 6; i++) {
          const x = -9 + i * 3.2;
          solid.tube([x, y0, z0 - 1.6], [x, y0 + 8.2, z0 - 1.6], 0.42, 0.38, 10, TBw);
          solid.box(x - 0.55, y0, z0 - 2.15, x + 0.55, y0 + 0.4, z0 - 1.05, TBw);
          OB.push({ x, z: z0 - 1.6, r: 0.45, y1: y0 + 8.2 });
        }
        solid.box(-10.5, y0 + 8.2, z0 - 2.4, 8.5, y0 + 9, z0, TBw, { noBottom: true });
        const st = solid.v.length, pt = [-1, y0 + 12.4, z0 - 2.4];
        solid.tri([-10.8, y0 + 9, z0 - 2.4], [8.8, y0 + 9, z0 - 2.4], pt, TB);
        solid.tri([-10.8, y0 + 9, z0], pt.map((v, i) => (i === 2 ? z0 : v)), [8.8, y0 + 9, z0], TB);
        solid.quad([-10.8, y0 + 9, z0 - 2.4], pt, pt.map((v, i) => (i === 2 ? z0 : v)), [-10.8, y0 + 9, z0], V.mul(TB, 0.8));
        solid.quad([8.8, y0 + 9, z0 - 2.4], [8.8, y0 + 9, z0], pt.map((v, i) => (i === 2 ? z0 : v)), pt, V.mul(TB, 0.8));
        solid.orient([-1, y0 + 10, z0 - 1.2], st);
        // relógio
        solid.tube([-1, y0 + 10.4, z0 - 2.45], [-1, y0 + 10.4, z0 - 2.55], 0.95, 0.95, 14, C.white, 0, { capCol: hex(0xfff8e6) });
        solid.box(-1.04, y0 + 10.4, z0 - 2.6, -0.96, y0 + 11.1, z0 - 2.56, C.dark);
        solid.box(-1, y0 + 10.36, z0 - 2.6, -0.45, y0 + 10.44, z0 - 2.56, C.dark);
        deco.decal([-1, y0 + 6.6, z0 - 0.06], [-1, 0, 0], [0, 1, 0], 9, 1.8, RECT.town[0]);
        deco.quad([-3, y0, z0 - 0.04], [1, y0, z0 - 0.04], [1, y0 + 3.4, z0 - 0.04], [-3, y0 + 3.4, z0 - 0.04], hex(0x6b3e22));
        MAP.push({ x0, z0, x1, z1, c: "#f3e6c8", name: "prefeitura" });
      }
      fill(-35, 176, -24, 197); fill(22, 176, 33, 197);
      fill(-24, 196, 22, 197, 6);

      // ---------- estação ferroviária antiga (leste) ----------
      block(45, 109, X1, 200, "wns", "estação", "#d8cbbb");
      // brita, dormentes e trilhos (dá grind no trilho)
      plain(48, 126, X1, 135, SW + 0.004, hex(0x8f7f6e), 4, hex(0x86776a));
      for (let x = 48.5; x < X1 - 0.5; x += 0.8) solid.box(x - 0.14, SW, 127.2, x + 0.14, SW + 0.1, 133.8, hex(0x5a3a26), { noBottom: true });
      for (const z of [129.2, 131.8]) {
        solid.box(48, SW + 0.1, z - 0.05, X1, SW + 0.24, z + 0.05, hex(0xb8bcc6), { top: hex(0xe1e4ea), noBottom: true });
        rail([48.5, SW + 0.24, z], [X1 - 0.5, SW + 0.24, z], "rail", "trilho do trem");
      }
      // plataforma com escada nas pontas e beirada amarela
      const PH = SW + 1.05;
      ledgeBox(52, 136, 104, 146, SW, PH, hex(0xc9b9a0), hex(0xe6dccb), "beirada da plataforma", "n");
      deco.quad([52, PH + 0.006, 136], [104, PH + 0.006, 136], [104, PH + 0.006, 136.5], [52, PH + 0.006, 136.5], C.curb);
      stairs("x", 52, 48.5, 136, 146, PH, SW, 5, "escada da estação");
      stairs("x", 104, 107.5, 136, 146, PH, SW, 5, "escada da estação");
      // prédio da estação: amarelo-ocre, beiral sobre a plataforma, relógio e placa
      {
        const y0 = PH, x0 = 62, x1 = 94, z0 = 145, z1 = 158, col = hex(0xe8c36a);
        solid.box(x0, y0, z0, x1, y0 + 5.2, z1, col, { top: V.mul(col, 0.9), noBottom: true });
        solid.box(x0 - 0.2, y0 + 5.2, z0 - 0.2, x1 + 0.2, y0 + 5.6, z1 + 0.2, C.white, { noBottom: true });
        fbox(x0, z0, x1, z1, 60);
        const F = { o: [(x0 + x1) / 2, y0, z0 - 0.03], r: [-1, 0, 0], n: [0, 0, -1] };
        for (let i = 0; i < 7; i++) { const x = x0 + 2.4 + i * 4.5; deco.quad([x, y0, z0 - 0.03], [x + 1.6, y0, z0 - 0.03], [x + 1.6, y0 + 2.8, z0 - 0.03], [x, y0 + 2.8, z0 - 0.03], i % 2 ? C.win : hex(0x7a4a2a)); }
        // telhado em duas águas
        const st = solid.v.length, ry = y0 + 5.6, rt = y0 + 7.8, mz = (z0 + z1) / 2;
        solid.quad([x0 - 0.6, ry, z0 - 0.6], [x1 + 0.6, ry, z0 - 0.6], [x1 + 0.6, rt, mz], [x0 - 0.6, rt, mz], C.telha || hex(0xb85a3a));
        solid.quad([x1 + 0.6, ry, z1 + 0.6], [x0 - 0.6, ry, z1 + 0.6], [x0 - 0.6, rt, mz], [x1 + 0.6, rt, mz], hex(0xa04e34));
        solid.tri([x0 - 0.6, ry, z0 - 0.6], [x0 - 0.6, rt, mz], [x0 - 0.6, ry, z1 + 0.6], col);
        solid.tri([x1 + 0.6, ry, z0 - 0.6], [x1 + 0.6, ry, z1 + 0.6], [x1 + 0.6, rt, mz], col);
        solid.orient([(x0 + x1) / 2, y0 + 3, mz], st);
        // beiral de madeira sobre a plataforma (colunas de ferro)
        solid.box(x0 - 4, y0 + 3.6, 138.4, x1 + 4, y0 + 3.85, z0, hex(0x7a4a2a), { top: hex(0xb85a3a) });
        for (let x = x0 - 3; x <= x1 + 3; x += 7) { solid.tube([x, y0, 139], [x, y0 + 3.6, 139], 0.09, 0.09, 6, hex(0x2f5a46)); OB.push({ x, z: 139, r: 0.12, y1: y0 + 3.6 }); }
        solid.tube([78, y0 + 3.6, 139.5], [78, y0 + 3.0, 139.5], 0.03, 0.03, 4, C.dark);
        solid.tube([78, y0 + 2.75, 139.4], [78, y0 + 2.75, 139.6], 0.38, 0.38, 12, C.white, 0, { capCol: hex(0xfff8e6) });
        deco.decal([78, y0 + 4.5, z0 - 0.06], [-1, 0, 0], [0, 1, 0], 9, 1.8, RECT.town[1]);
        MAP.push({ x0, z0, x1, z1, c: "#e8c36a", name: "estação" });
      }
      // viaduto (pontilhão) passando por cima da linha do trem, no fim da quadra da estação
      {
        const VX0 = 105.6, VX1 = 111.4, VH = SW + 5.2, A = 111.6, B = 124, C2 = 137, D = 149.4;
        const CON = hex(0xa8a4b4), CON2 = hex(0x8f8aa0);
        wedge(VX0, A, VX1, B, SW, VH, "z", ASF, CON, SW);
        framp(VX0, A, VX1, B, SW, VH, "z");
        solid.box(VX0, VH - 0.7, B, VX1, VH, C2, CON, { top: ASF });
        fbox(VX0, B, VX1, C2, VH);
        wedge(VX0, C2, VX1, D, VH, SW, "z", ASF, CON, SW);
        framp(VX0, C2, VX1, D, VH, SW, "z");
        for (const z of [127.2, 133.8]) for (const x of [VX0 + 0.8, VX1 - 0.8]) { solid.box(x - 0.38, 0, z - 0.38, x + 0.38, VH - 0.7, z + 0.38, CON2); OB.push({ x, z, r: 0.48, y1: VH - 0.7 }); }
        const gv = (x, z) => (z < B ? SW + ((z - A) / (B - A)) * (VH - SW) : z > C2 ? VH - ((z - C2) / (D - C2)) * (VH - SW) : VH);
        for (const x of [VX0 + 0.15, VX1 - 0.15])
          for (const [za, zb] of [[A + 0.6, B], [B, C2], [C2, D - 0.6]]) handrail([x, gv(x, za) + 0.85, za], [x, gv(x, zb) + 0.85, zb], "guarda-corpo do viaduto", gv, C.metal);
        for (let z = A + 1; z < D - 1; z += 3) { const y0 = gv(0, z) + 0.02, y1 = gv(0, z + 1.5) + 0.02; deco.quad([108.38, y0, z], [108.38, y1, z + 1.5], [108.62, y1, z + 1.5], [108.62, y0, z], YEL); }
        MAP.push({ x0: VX0, z0: A, x1: VX1, z1: D, c: "#6f6a80", name: "viaduto" });
        GAPS.push({ name: "PULOU DO VIADUTO", pts: 700, from: (s) => s.x > VX0 && s.x < VX1 && s.z > B && s.z < C2 && s.y > VH - 0.3, to: (s) => (s.x < VX0 - 0.5 || s.z < A || s.z > D) && s.y < SW + 0.4 });
      }
      // vagão antigo parado no trilho (dá pra subir no teto)
      {
        const x0 = 64, x1 = 82, z0 = 129, z1 = 132, y0 = SW + 0.9, col = hex(0x9b2a22);
        solid.box(x0, y0, z0, x1, y0 + 2.4, z1, col, { top: hex(0x6a6a72), noBottom: true });
        solid.box(x0 + 0.5, SW + 0.24, z0 + 0.2, x1 - 0.5, y0, z1 - 0.2, C.dark);
        for (let i = 0; i < 6; i++) { const x = x0 + 1.6 + i * 2.7; for (const z of [z0 - 0.03, z1 + 0.03]) deco.quad([x, y0 + 1.1, z], [x + 1.4, y0 + 1.1, z], [x + 1.4, y0 + 2.0, z], [x, y0 + 2.0, z], C.win); }
        for (const x of [x0 + 2, x0 + 4, x1 - 4, x1 - 2]) for (const z of [z0 + 0.25, z1 - 0.25]) solid.tube([x, SW + 0.62, z - 0.12], [x, SW + 0.62, z + 0.12], 0.42, 0.42, 10, C.dark);
        fbox(x0, z0, x1, z1, y0 + 2.4);
        rail([x0 + 0.2, y0 + 2.4, z0], [x1 - 0.2, y0 + 2.4, z0], "ledge", "teto do vagão");
        rail([x0 + 0.2, y0 + 2.4, z1], [x1 - 0.2, y0 + 2.4, z1], "ledge", "teto do vagão");
      }
      // caixa d'água da estação
      {
        const cx = 100, cz = 118;
        for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) { solid.tube([cx + dx, SW, cz + dz], [cx + dx * 0.6, SW + 9, cz + dz * 0.6], 0.14, 0.12, 6, C.dark); OB.push({ x: cx + dx, z: cz + dz, r: 0.18, y1: SW + 9 }); }
        solid.tube([cx, SW + 9, cz], [cx, SW + 12, cz], 2.2, 2.2, 12, hex(0x8a6a4a), 0, { capCol: hex(0x6a4a2a) });
        solid.tube([cx, SW + 12, cz], [cx, SW + 13, cz], 2.3, 0.2, 12, hex(0x6a4a2a));
      }
      row("z", 197, 45, X1, 11, mix(67, 81, 0.4));
      fill(48, 160, X1, 186);

      // ---------- campo de várzea (oeste) ----------
      block(X0, 109, -47, 200, "nes", "campo", "#86c86a");
      plain(-94, 117, -56, 192, SW + 0.004, hex(0x6fbf5a), 6, hex(0x67b552));
      const ln = (x0, z0, x1, z1) => stripe(x0, z0, x1, z1, SW + 0.012, LINE);
      ln(-92, 119, -91.85, 190); ln(-58.15, 119, -58, 190); ln(-92, 119, -58, 119.15); ln(-92, 189.85, -58, 190); ln(-92, 154.4, -58, 154.6);
      for (const z of [120.5, 188.5]) {
        const zz = z, d = z < 150 ? -1 : 1;
        solid.tube([-78.6, SW, zz], [-78.6, SW + 2.4, zz], 0.08, 0.08, 6, C.white);
        solid.tube([-71.4, SW, zz], [-71.4, SW + 2.4, zz], 0.08, 0.08, 6, C.white);
        solid.tube([-78.6, SW + 2.4, zz], [-71.4, SW + 2.4, zz], 0.08, 0.08, 6, C.white);
        rail([-78.4, SW + 2.48, zz], [-71.6, SW + 2.48, zz], "rail", "travessão do gol");
        OB.push({ x: -78.6, z: zz, r: 0.12, y1: SW + 2.4 }, { x: -71.4, z: zz, r: 0.12, y1: SW + 2.4 });
        deco.quad([-78.6, SW + 2.4, zz], [-71.4, SW + 2.4, zz], [-71.4, SW, zz + d * 1.4], [-78.6, SW, zz + d * 1.4], hex(0xe9eef2), 3);
      }
      // mureta em volta do campo (ledge) e arquibancadinha
      ledgeBox(-95.6, 116, -95, 193, SW, SW + 0.6, hex(0xf1e3c2), C.white, "mureta do campo", "we");
      ledgeBox(-55, 116, -54.4, 193, SW, SW + 0.6, hex(0xf1e3c2), C.white, "mureta do campo", "we");
      for (let i = 0; i < 3; i++) ledgeBox(-53.6 + i * 1.1, 130, -52.5 + i * 1.1, 180, SW, SW + 0.45 * (i + 1), hex(0x8a8fa8), hex(0xb9bccc), "arquibancada do campo", "w");
      MAP.push({ x0: -94, z0: 117, x1: -56, z1: 192, c: "#6fbf5a", name: "campo" });

      // ---------- mercado municipal e feira (centro-sul) ----------
      block(-38, 209, 36, Z2, "wne", "mercadão", "#d8cbbb");
      pave(-35, 212, 33, 242, SW + 0.006, RECT.pav, 2);
      {
        const x0 = -30, x1 = 28, z0 = 244, z1 = 292, h = 8.5, col = hex(0xf0d9b5), y0 = SW;
        solid.box(x0, y0, z0, x1, y0 + h, z1, col, { top: hex(0xb85a3a), noBottom: true });
        solid.box(x0 - 0.3, y0 + h, z0 - 0.3, x1 + 0.3, y0 + h + 0.5, z1 + 0.3, C.white, { noBottom: true });
        fbox(x0, z0, x1, z1, 60);
        // arcos da fachada
        for (let i = 0; i < 7; i++) {
          const cx = x0 + 4.1 + i * 8.3, z = z0 - 0.04, w = 2.4;
          deco.quad([cx + w, y0, z], [cx - w, y0, z], [cx - w, y0 + 3.6, z], [cx + w, y0 + 3.6, z], i === 3 ? hex(0x3a2a24) : hex(0x6b4a34));
          for (let k = 0; k < 8; k++) {
            const a0 = (k / 8) * Math.PI, a1 = ((k + 1) / 8) * Math.PI;
            deco.tri([cx, y0 + 3.6, z], [cx + Math.cos(a0) * w, y0 + 3.6 + Math.sin(a0) * w, z], [cx + Math.cos(a1) * w, y0 + 3.6 + Math.sin(a1) * w, z], i === 3 ? hex(0x3a2a24) : hex(0x6b4a34));
          }
        }
        deco.decal([-1, y0 + 7.0, z0 - 0.06], [-1, 0, 0], [0, 1, 0], 11, 2.2, RECT.town[2]);
        MAP.push({ x0, z0, x1, z1, c: "#f0d9b5", name: "mercadão" });
      }
      fill(-35, 244, -30, 297); fill(28, 244, 33, 297); fill(-30, 292, 28, 297);
      // barracas da feira: bancada (ledge) com toldo listrado e caixotes de fruta
      const TOLDO = [0xe0302b, 0x2457c8, 0x1fae5a, 0xff8a1f, 0xff4fa3];
      let bk = 0;
      for (const z of [217, 225, 233]) for (const x of [-27, -16, -5, 6, 17]) {
        if ((x === -5 && z === 225)) continue;
        const c = hex(TOLDO[bk++ % TOLDO.length]);
        ledgeBox(x - 2.2, z - 0.9, x + 2.2, z + 0.9, SW, SW + 0.88, hex(0x9a6a3e), hex(0xc99a62), "banca da feira", "ns");
        for (const [dx, dz] of [[-2.1, -1.3], [2.1, -1.3], [-2.1, 1.3], [2.1, 1.3]]) { solid.tube([x + dx, SW, z + dz], [x + dx, SW + 2.5, z + dz], 0.04, 0.04, 4, C.metal, 1); OB.push({ x: x + dx, z: z + dz, r: 0.06, y1: SW + 2.5 }); }
        for (let i = 0; i < 6; i++) deco.quad([x - 2.3 + i * 0.77, SW + 2.5, z - 1.5], [x - 2.3 + (i + 1) * 0.77, SW + 2.5, z - 1.5], [x - 2.3 + (i + 1) * 0.77, SW + 2.7, z + 1.5], [x - 2.3 + i * 0.77, SW + 2.7, z + 1.5], i % 2 ? C.white : c);
        for (let i = 0; i < 4; i++) solid.ball([x - 1.5 + i, SW + 1.0, z], 0.16, hex([0xff7a1a, 0xffd23f, 0xe0302b, 0x7ac74f][(i + bk) % 4]), 0, 6, 4);
      }
      for (const [x, z] of [[-33, 214], [31, 214], [-33, 240], [31, 240]]) lampPraca(x, z);

      // ---------- posto de gasolina (leste-sul) ----------
      block(45, 209, X1, Z2, "wn", "posto", "#c9c3d6");
      plain(48, 212, 100, 246, SW + 0.005, hex(0xc9c4d4), 6);
      {
        const y = SW + 5.2;
        solid.box(56, y, 218, 92, y + 0.9, 238, hex(0xffffff), { top: hex(0xe8e4ee) });
        deco.quad([56, y + 0.2, 217.98], [92, y + 0.2, 217.98], [92, y + 0.75, 217.98], [56, y + 0.75, 217.98], hex(0x1fae5a));
        deco.quad([56, y - 0.01, 218], [92, y - 0.01, 218], [92, y - 0.01, 238], [56, y - 0.01, 238], hex(0xfff6d8), 2);
        for (const [x, z] of [[60, 222], [88, 222], [60, 234], [88, 234]]) { solid.box(x - 0.3, SW, z - 0.3, x + 0.3, y, z + 0.3, hex(0xd5dbe8)); fbox(x - 0.3, z - 0.3, x + 0.3, z + 0.3, 60); }
        for (const z of [224.5, 231.5]) {
          ledgeBox(64, z - 0.6, 84, z + 0.6, SW, SW + 0.28, hex(0xffd23f), hex(0xf2f0ea), "ilha das bombas");
          for (const x of [68, 74, 80]) { solid.box(x - 0.4, SW + 0.28, z - 0.3, x + 0.4, SW + 2.1, z + 0.3, hex(0xe0302b), { top: C.white }); deco.quad([x - 0.3, SW + 1.4, z - 0.31], [x + 0.3, SW + 1.4, z - 0.31], [x + 0.3, SW + 1.9, z - 0.31], [x - 0.3, SW + 1.9, z - 0.31], hex(0xbdfcff), 2); OB.push({ x, z, r: 0.5, y1: SW + 2.1 }); }
        }
        lights.push([66, y - 0.3, 228], [82, y - 0.3, 228], [74, y - 0.3, 228]);
        // totem com placa
        solid.box(49, SW, 213, 50.4, SW + 7, 214.4, hex(0x1fae5a));
        deco.decal([49.7, SW + 6, 212.95], [-1, 0, 0], [0, 1, 0], 5.2, 1.05, RECT.town[3]);
        solid.box(47.4, SW + 5.4, 212.9, 52, SW + 6.6, 213, hex(0x1fae5a));
        OB.push({ x: 49.7, z: 213.7, r: 0.8, y1: SW + 7 });
        withY(SW, () => building(98, 212, 110, 244, 5.5, "-x", { style: "loja", shop: 1, col: 0xfafafa }));
        MAP.push({ x0: 56, z0: 218, x1: 92, z1: 238, c: "#ffffff", name: "posto" });
      }
      row("-x", 48, 249, Z2, 11, mix(51, 91, 0.35));
      fill(59, 249, X1, Z2);
      car(70, 228, "x", 0xff8fc8, SW);

      // ---------- casas a sudoeste ----------
      block(X0, 209, -47, Z2, "ne", "casas");
      row("-z", 212, X0, -50, 11, mix(50, 101, 0.3));
      row("x", -50, 223, Z2, 11, mix(77, 102, 0.3));
      fill(X0, 223, -61, Z2);

      // ruas da cidade nova: postes, árvores, lixeiras e carros
      posteLine("x", 110.6, -96, 108, 18, [0, -1]);
      posteLine("x", 197.4, -96, 108, 18, [0, 1]);
      posteLine("x", 210.6, -96, 108, 18, [0, -1]);
      posteLine("z", -48.8, 112, 296, 16, [1, 0]);
      posteLine("z", 46.4, 112, 296, 16, [-1, 0]);
      for (const [x, z, c] of [[-60, 110.6, 0xff8fc8], [-20, 197.6, 0xffd23f], [60, 197.6, 0xff8fc8], [-48.6, 150, 0xffd23f], [46.6, 180, 0xff8fc8], [-80, 210.6, 0xffd23f], [30, 210.6, 0xff8fc8]]) ipe(x, z, SW, c);
      for (const [x, z] of [[-36.5, 120], [46.6, 120], [-36.5, 215], [46.6, 250]]) lixeira(x, z);
      car(44.0, 160, "z", 0xffd166, 0); car(-46.0, 250, "z", 0xf5f1e6, 0); car(10, 108.0, "x", 0x7cc8ff, 0); car(-70, 201.0, "x", 0xe0302b, 0);
      TAGS.push(
        { c: [100, 3.2, 196.96], r: [1, 0, 0], n: [0, 0, 1], w: 4.4, h: 2.0, piece: 6 },
        { c: [-46.96, 2.6, 260], r: [0, 0, 1], n: [1, 0, 0], w: 4.4, h: 2.2, piece: 7 },
      );
      CANS.push([-1, SW + 2.8, 136], [73, SW + 4.6, 130.5], [-75, SW + 3.3, 120.5], [74, SW + 7, 228], [6, SW + 1.8, 225], [-1, TH + 1.8, 171]);
      GAPS.push(
        { name: "ESCADARIA DA PREFEITURA", pts: 500, from: (s) => s.z > 166 && s.y > TH - 0.2 && Math.abs(s.x + 1) < 9, to: (s) => s.z < 163.6 && s.y < TH - 0.6 },
        { name: "PLATAFORMA → TRILHO", pts: 350, from: (s) => s.z > 136 && s.y > PH - 0.2 && s.x > 52 && s.x < 104, to: (s) => s.z < 134 && s.y < SW + 0.4 },
        { name: "SOBRE O CHAFARIZ", pts: 450, from: (s) => s.z < 133.5 && s.z > 129.5 && Math.abs(s.x + 1) < 2.2, to: (s) => s.z > 137.9, cond: (s) => Math.abs(s.x + 1) < 2.8 },
        { name: "SOBRE O CHAFARIZ", pts: 450, from: (s) => s.z > 138.5 && s.z < 142.5 && Math.abs(s.x + 1) < 2.2, to: (s) => s.z < 134.1, cond: (s) => Math.abs(s.x + 1) < 2.8 },
        { name: "TETO DO VAGÃO", pts: 300, from: (s) => s.y > SW + 3.1 && s.x > 64 && s.x < 82 && s.z > 129 && s.z < 132, to: (s) => s.y < SW + 0.4 },
      );
    }
    // =====================================================================================
    // ---------- bairro da Ladeira (z 300 a 440): ruas descendo o morro, escadaria com corrimão,
    // casinhas em degraus, praça lá embaixo e o canal (valetão de concreto que dá pra andar) ----------
    // =====================================================================================
    // o bairro é montado nas coordenadas "de cima" (z 300 a 440) e depois espelhado pro sul da cidade
    // (z' = 200 - z: vai de -100 a -240), assim a pista fica no meio do mapa
    const LMZ = 200;
    const mk = { s: solid.v.length, f: flat.v.length, d: deco.v.length, feats: feats.length, OB: OB.length, MAP: MAP.length, GAPS: GAPS.length, CANS: CANS.length, lights: lights.length, rails: X.rails ? X.rails.length : 0, shops: X.shops ? X.shops.length : 0 };
    const LZ0 = 300, LZ1 = 440, DROP = 10;
    const ez = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
    const baseAt = (x, z) => {
      if (z <= LZ0) return 0;
      let y = -DROP * ez((z - LZ0) / 72);
      y += 4 * ez((x - 52) / 45) * ez((z - 306) / 40) * (1 - ez((z - 392) / 6));
      if (z > 418 && z < 432) y -= 2.4 * (z < 422 ? ez((z - 418) / 4) : z > 428 ? 1 - ez((z - 428) / 4) : 1);
      return y;
    };
    const minG = (x0, x1, z0, z1) => { let m = 1e9; for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) m = Math.min(m, baseAt(x0 + ((x1 - x0) * i) / 4, z0 + ((z1 - z0) * j) / 4)); return m; };
    {
      const isRoad = (x, z) => (z < 409 && ((x > -47 && x < -38) || (x > 36 && x < 45))) || (z > 400 && z < 409);
      const near = (x, z, m) => isRoad(x - m, z) || isRoad(x + m, z) || isRoad(x, z - m) || isRoad(x, z + m);
      const GRAMA = hex(0x9fcf7e), GRAMA2 = hex(0x94c473), CAN = C.conc, CAN2 = C.conc2;
      const ST = 2;
      for (let x = BOUNDS.x0; x < BOUNDS.x1 - 1e-6; x += ST) for (let z = LZ0; z < LZ1 - 1e-6; z += ST) {
        const cx = x + ST / 2, cz = z + ST / 2, ti = (Math.floor(x / 8) + Math.floor(z / 8)) & 1;
        let col;
        if (isRoad(cx, cz)) col = ti ? ASF2 : ASF;
        else if (cz > 418 && cz < 432) col = Math.abs(cz - 425) < 3 ? CAN2 : CAN;
        else if (cx > -36 && cx < 34 && cz > 374 && cz < 398) col = ((Math.floor(x / 2) + Math.floor(z / 2)) & 1) ? C.pav : C.pav2;
        else if (cx > -8 && cx < 8 && cz < 372) col = C.conc;
        else if (near(cx, cz, 3) || cz < 306) col = ((Math.floor(x / 2) + Math.floor(z / 2)) & 1) ? C.pav : C.pav2;
        else col = ti ? GRAMA : GRAMA2;
        flat.quad([x, baseAt(x, z), z], [x, baseAt(x, z + ST), z + ST], [x + ST, baseAt(x + ST, z + ST), z + ST], [x + ST, baseAt(x + ST, z), z], col);
      }
      // filete d'água no fundo do canal + faixas da rua de baixo
      deco.quad([BOUNDS.x0, baseAt(0, 425) + 0.02, 424.4], [BOUNDS.x0, baseAt(0, 425) + 0.02, 425.6], [BOUNDS.x1, baseAt(0, 425) + 0.02, 425.6], [BOUNDS.x1, baseAt(0, 425) + 0.02, 424.4], hex(0x5ab8e8), 2);
      for (let x = BOUNDS.x0; x < BOUNDS.x1; x += 4) if (!(x > -48 && x < -37) && !(x > 35 && x < 46)) deco.quad([x, -DROP + 0.01, 404.3], [x, -DROP + 0.01, 404.7], [x + 2, -DROP + 0.01, 404.7], [x + 2, -DROP + 0.01, 404.3], LINE);
      for (const xc of [-42.5, 40.5]) for (let z = LZ0; z < 398; z += 4) { const y0 = baseAt(xc, z) + 0.02, y1 = baseAt(xc, z + 2) + 0.02; deco.quad([xc - 0.12, y0, z], [xc - 0.12, y1, z + 2], [xc + 0.12, y1, z + 2], [xc + 0.12, y0, z], YEL); }
      fim(BOUNDS.x0 - 0.6, 400, BOUNDS.x0, 409, [1, 0, 0], 5);
      fim(BOUNDS.x1, 400, BOUNDS.x1 + 0.6, 409, [-1, 0, 0], 7);
      // muro no fim do bairro (com grafite)
      solid.box(BOUNDS.x0, -DROP, 437, BOUNDS.x1, -DROP + 3.2, 440, hex(0xe6d7bd), { top: C.white, noBottom: true });
      for (let i = 0; i < 6; i++) deco.decal([-80 + i * 34, -DROP + 1.6, 436.97], [-1, 0, 0], [0, 1, 0], 6.5, 2.9, RECT.piece[i % 8]);

      // escadaria do Rosário: degraus descendo o morro com três corrimãos (o do meio é o pico)
      const SZ0 = 306, SZ1 = 372, TR = 0.8;
      for (let z = SZ0; z < SZ1 - 1e-6; z += TR) {
        const top = baseAt(0, z), bot = baseAt(0, Math.min(SZ1, z + TR));
        solid.box(-7.6, bot - 0.4, z, 7.6, top, z + TR, C.stair, { top: C.stair, noBottom: true });
        deco.quad([-7.6, top + 0.008, z], [-7.6, top + 0.008, z + 0.12], [7.6, top + 0.008, z + 0.12], [7.6, top + 0.008, z], C.nose);
      }
      feats.push({ x0: -7.6, z0: SZ0, x1: 7.6, z1: SZ1, f: (x, z) => baseAt(0, SZ0 + Math.floor((z - SZ0) / TR) * TR) });
      const gStair = (x, z) => baseAt(0, SZ0 + Math.floor((z - SZ0) / TR) * TR);
      for (const xr of [-7.0, 0, 7.0]) {
        const segs = [[SZ0 + 0.6, 324], [324, 340], [340, 356], [356, SZ1 - 0.6]];
        for (const [za, zb] of segs) handrail([xr, gStair(xr, za) + 0.85, za], [xr, gStair(xr, zb) + 0.85, zb], xr === 0 ? "corrimão da escadaria do Rosário" : "corrimão da ladeira", gStair);
      }
      for (const z of [316, 338, 360]) for (const x of [-9.2, 9.2]) lampPraca(x, z, baseAt(x, z));
      // largo lá em cima (onde a escadaria começa)
      for (const x of [-20, 20]) ipe(x, 303, 0, x < 0 ? 0xffd23f : 0xff8fc8);

      // casinhas em degraus dos dois lados da ladeira e lojas na rua de baixo
      const yz = (fx0, fx1) => (a, b) => minG(fx0, fx1, a, b);
      const yx = (fz0, fz1) => (a, b) => minG(a, b, fz0, fz1);
      const CAS = (n) => Array.from({ length: n }, (_, i) => (i % 4 === 2 ? { w: 9, style: "loja", shop: (i * 3) % 8, h: 6.8 } : { w: 8 + (i % 3), style: "casas" }));
      row("-x", -36, 308, 370, 10, CAS(8), yz(-36, -26));
      row("x", 34, 308, 370, 10, CAS(8), yz(24, 34));
      row("x", -49, 306, 398, 11, CAS(11), yz(-60, -49));
      row("-x", 47, 306, 398, 11, CAS(11), yz(47, 58));
      row("z", 398, BOUNDS.x0, -49, 10, [{ w: 12, style: "loja", shop: 4 }, { w: 10, style: "casas" }, { w: 12, style: "loja", shop: 6 }, { w: 9, style: "casas" }, { w: 12, style: "loja", shop: 2 }], yx(388, 398));
      row("z", 398, 47, BOUNDS.x1, 10, [{ w: 12, style: "loja", shop: 7 }, { w: 10, style: "casas" }, { w: 12, style: "loja", shop: 1 }, { w: 9, style: "casas" }, { w: 12, style: "loja", shop: 5 }, { w: 10, style: "casas" }], yx(388, 398));
      // mais casinhas soltas no morrinho do leste e no oeste
      for (const [x0, z0] of [[62, 312], [76, 318], [92, 330], [64, 346], [84, 352], [100, 364], [-72, 316], [-88, 334], [-70, 352], [-90, 372]]) {
        const x1 = x0 + 9, z1 = z0 + 8;
        withY(minG(x0, x1, z0, z1), () => building(x0, z0, x1, z1, 6, x0 > 0 ? "-x" : "x", { style: "casas" }));
      }
      // árvores e postes pelo morro
      for (const [x, z] of [[-18, 320], [-22, 344], [-16, 364], [18, 318], [22, 340], [16, 362], [-64, 332], [-80, 360], [70, 334], [96, 346], [80, 372]]) ipe(x, z, baseAt(x, z), [0xff8fc8, 0xffd23f, 0xb79cff][(x + z) & 1 ? 0 : 1]);
      for (const z of [314, 340, 366, 392]) { lampPraca(-37.4, z, baseAt(-37.4, z)); lampPraca(35.4, z, baseAt(35.4, z)); }

      // praça da Baixada: bancos, manual pad, bank e um caixote com corrimão
      const BY = -DROP;
      ledgeBox(-30, 380, -18, 381.2, BY, BY + 0.5, C.ledge, C.white, "banco da Baixada", "nsew");
      ledgeBox(-30, 392, -18, 393.2, BY, BY + 0.5, C.ledge, C.white, "banco da Baixada", "nsew");
      ledgeBox(-10, 383, 6, 389, BY, BY + 0.3, hex(0xb7b0c9), hex(0xd8d2e4), "manual pad", "nsew");
      solid.box(-2.5, BY, 377, 2.5, BY + 0.6, 379.5, C.fun, { top: C.fun, noBottom: true });
      fbox(-2.5, 377, 2.5, 379.5, BY + 0.6);
      handrail([-2.2, BY + 1.0, 378.25], [2.2, BY + 1.0, 378.25], "corrimão da Baixada", () => BY + 0.6);
      // bank (rampa inclinada) encostado no lado leste da praça
      {
        const x0 = 18, x1 = 30, z0 = 378, z1 = 394, h = 1.5;
        const st = solid.v.length;
        solid.quad([x0, BY, z0], [x0, BY, z1], [x1, BY + h, z1], [x1, BY + h, z0], C.ramp);
        solid.quad([x1, BY, z0], [x1, BY + h, z0], [x1, BY + h, z1], [x1, BY, z1], C.ramp2);
        solid.quad([x0, BY, z0], [x1, BY + h, z0], [x1, BY, z0], [x0, BY, z0], C.ramp2);
        solid.quad([x0, BY, z1], [x1, BY, z1], [x1, BY + h, z1], [x0, BY, z1], C.ramp2);
        solid.orient([(x0 + x1) / 2, BY + h / 3, (z0 + z1) / 2], st);
        framp(x0, z0, x1, z1, BY, BY + h, "x");
        solid.box(x1, BY, z0, x1 + 3, BY + h, z1, C.deck, { top: C.deck, noBottom: true });
        fbox(x1, z0, x1 + 3, z1, BY + h);
        rail([x1, BY + h, z0 + 0.3], [x1, BY + h, z1 - 0.3], "ledge", "borda do bank");
      }
      for (const [x, z] of [[-33, 376], [-33, 396], [31.5, 376], [-12, 396], [8, 396]]) lampPraca(x, z, BY);
      for (const [x, z] of [[-24, 386], [12, 376], [12, 396]]) ipe(x, z, BY, 0xffd23f);
      lixeira(-14, 380, BY); lixeira(10, 380, BY);
      MAP.push({ x0: -36, z0: 374, x1: 34, z1: 398, c: "#d6cab8", name: "praça da Baixada" });
      MAP.push({ x0: -8, z0: 306, x1: 8, z1: 372, c: "#d8d2c4", name: "escadaria" });
      MAP.push({ x0: BOUNDS.x0, z0: 418, x1: BOUNDS.x1, z1: 432, c: "#b3b0a8", name: "canal" });
      MAP.push({ x0: BOUNDS.x0, z0: 400, x1: BOUNDS.x1, z1: 409, c: "#8a8698" });
      MAP.push({ x0: -47, z0: 300, x1: -38, z1: 400, c: "#8a8698" }, { x0: 36, z0: 300, x1: 45, z1: 400, c: "#8a8698" });
      GAPS.push(
        { name: "DESCEU A ESCADARIA DO ROSÁRIO", pts: 800, from: (s) => s.z > 306 && s.z < 312 && Math.abs(s.x) < 7.6, to: (s) => s.z > 372 && s.z < 378 && Math.abs(s.x) < 9 && s.y < BY + 0.4 },
        { name: "PULOU O CANAL", pts: 600, from: (s) => s.z > 414 && s.z < 418.5 && s.y > -10.5, to: (s) => s.z > 431.5 && s.z < 436 && s.y < -9.6 },
      );
      CANS.push([0, baseAt(0, 340) + 1.6, 340], [-24, BY + 1.4, 386], [0, -12.4 + 1.2, 425], [70, baseAt(70, 340) + 1.4, 340]);
    }
    // espelha tudo que o bairro criou
    {
      const mirror = (m, from) => {
        const v = m.v;
        for (let i = from; i < v.length; i += 36) {
          for (let k = 0; k < 3; k++) { const o = i + k * 12; v[o + 2] = LMZ - v[o + 2]; v[o + 5] = -v[o + 5]; }
          for (let j = 0; j < 12; j++) { const a = i + 12 + j, b = i + 24 + j, t = v[a]; v[a] = v[b]; v[b] = t; }
          if (v[i + 9] === 4) {
            // decalque (placas, grafite): espelha o u pra o texto não ficar ao contrário
            let u0 = Infinity, u1 = -Infinity;
            for (let k = 0; k < 3; k++) { const u = v[i + k * 12 + 10]; u0 = Math.min(u0, u); u1 = Math.max(u1, u); }
            for (let k = 0; k < 3; k++) { const o = i + k * 12 + 10; v[o] = u0 + u1 - v[o]; }
          }
        }
      };
      mirror(solid, mk.s); mirror(flat, mk.f); mirror(deco, mk.d);
      for (let i = mk.feats; i < feats.length; i++) { const f = feats[i], g = f.f; feats[i] = Object.assign({}, f, { z0: LMZ - f.z1, z1: LMZ - f.z0, f: (x, z) => g(x, LMZ - z) }); }
      if (X.rails) for (let i = mk.rails; i < X.rails.length; i++) { const r = X.rails[i]; r.a = [r.a[0], r.a[1], LMZ - r.a[2]]; r.b = [r.b[0], r.b[1], LMZ - r.b[2]]; }
      for (let i = mk.OB; i < OB.length; i++) { const o = OB[i]; if (o.z != null) o.z = LMZ - o.z; if (o.z0 != null) { const a = LMZ - o.z1, b = LMZ - o.z0; o.z0 = a; o.z1 = b; } }
      for (let i = mk.MAP; i < MAP.length; i++) { const m = MAP[i], a = LMZ - m.z1, b = LMZ - m.z0; m.z0 = a; m.z1 = b; }
      const W = (fn) => fn && ((st) => fn(Object.assign({}, st, { z: LMZ - st.z })));
      for (let i = mk.GAPS; i < GAPS.length; i++) { const g = GAPS[i]; GAPS[i] = Object.assign({}, g, { from: W(g.from), to: W(g.to), cond: W(g.cond) }); }
      for (let i = mk.CANS; i < CANS.length; i++) CANS[i] = [CANS[i][0], CANS[i][1], LMZ - CANS[i][2]];
      for (let i = mk.lights; i < lights.length; i++) lights[i] = [lights[i][0], lights[i][1], LMZ - lights[i][2]];
      if (X.shops) for (let i = mk.shops; i < X.shops.length; i++) { const sh = X.shops[i]; sh.z = LMZ - sh.z; sh.nz = -sh.nz; }
    }
    BOUNDS.z0 = LMZ - LZ1;
    var baseAtW = (x, z) => (z >= LMZ - LZ0 ? 0 : baseAt(x, LMZ - z));

    // ---------- grafites, latas e gaps da cidade ----------
    TAGS.push(
      { c: [47.95, 2.6, -12.5], r: [0, 0, 1], n: [-1, 0, 0], w: 4.4, h: 2.2, piece: 3 },
      { c: [66, SW + 0.5, -69.96], r: [1, 0, 0], n: [0, 0, 1], w: 3.2, h: 0.9, piece: 4 },
      { c: [-23.96, 2.4, -50], r: [0, 0, -1], n: [1, 0, 0], w: 4.2, h: 2.1, piece: 0 },
      { c: [-79.96, 2.8, 11], r: [0, 0, -1], n: [1, 0, 0], w: 4.4, h: 2.2, piece: 1 },
      { c: [66, 3.2, 81.96], r: [-1, 0, 0], n: [0, 0, -1], w: 4.6, h: 2.0, piece: 5 },
    );
    CANS.push(
      [78, 2.4, -68], [76, SW + 1.8, -57], [0, 2.1, -60], [16, 1.8, -61.8], [-71.5, SW + 2.3, 9], [-78.5, SW + 2.1, -12],
      [72, yr(72) + 1.6, 0], [97, yr(97) + 1.6, -6], [108, AH + 1.4, 0], [2, SW + 1.8, 46], [22, SW + 3.3, 42.6], [77, SW + 2.8, 81],
      [-46, 1.2, 0], [40, 1.2, -80], [-60, 1.2, 36.5],
    );
    GAPS.push(
      { name: "ESCADARIA DA IGREJA", pts: 500, from: (s) => s.z < -69.8 && s.y > SW + 0.8 && s.x > 70 && s.x < 86, to: (s) => s.z > -65.6 && s.y < SW + 0.3 },
      { name: "ESCADA DA ESCOLA", pts: 400, from: (s) => s.z < -61.8 && s.y > SW + 0.7 && Math.abs(s.x) < 4, to: (s) => s.z > -57.6 && s.y < SW + 0.3 },
      { name: "ESCADA DO BANCO", pts: 400, from: (s) => s.z > 47.8 && s.y > SW + 0.6 && s.x > -4 && s.x < 8, to: (s) => s.z < 43.8 && s.y < SW + 0.3 },
      { name: "SOBRE O CORETO", pts: 450, from: (s) => Math.hypot(s.x - 76, s.z + 57) > 4.4 && s.z < -60, to: (s) => Math.hypot(s.x - 76, s.z + 57) > 4.4 && s.z > -54, cond: (s) => Math.abs(s.x - 76) < 3.5 },
      { name: "PULA O CARRO", pts: 300, from: (s) => s.x < -73.6, to: (s) => s.x > -69.4, cond: (s) => Math.abs(s.z - 9) < 0.9 || Math.abs(s.z + 15) < 0.9 || Math.abs(s.z + 6) < 0.9 },
      { name: "DOCA → CHÃO", pts: 250, from: (s) => s.x < -77 && s.y > SW + 0.9 && s.z < -7, to: (s) => s.x > -75 && s.y < SW + 0.3 },
      { name: "ARQUIBANCADA ABAIXO", pts: 450, from: (s) => s.z > 79.9 && s.y > SW + 1.7, to: (s) => s.z < 73.6 && s.y < SW + 0.3 },
      { name: "TERRAÇO → RUA", pts: 350, from: (s) => s.x > -38 && s.x < -36 && s.y > 1.3, to: (s) => s.x < -40.5 && s.y < 0.3 },
    );
    return { obstacles: OB, tags: TAGS, cans: CANS, gaps: GAPS, map: MAP, baseAt: baseAtW, sorveteria: [15.5, 42.4], stops: STOPS };
  }
  return { build, BOUNDS };
})();
