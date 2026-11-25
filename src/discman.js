// Discman 3D do card da rádio: mão low poly (cor de pele e munhequeira de cada skatista) colocando
// o CD no discman, com o mesmo contorno e sombreado dos personagens. Desenha num canvas pequeno
// transparente com um segundo Renderer; se WebGL falhar, o card continua com a versão em CSS.
"use strict";
const DISC = (() => {
  const { V, M, hex, Mesh, Renderer } = E;
  let R = null, cv = null, objs = null, raf = 0, t0 = 0, state = "", spin = 0, lastT = 0, skin = "#a8714a", band = "#e8242c", handMesh = null;
  const INK = hex(0x1b1530);
  const sc = {
    sun: V.norm([0.35, 0.9, 0.45]), top: [0, 0, 0], mid: hex(0xc9d6ff), hz: [0, 0, 0], fog: [0, 0, 0], fogd: 0,
    shade: hex(0x8f7fd6), ink: INK, ink_w: 1.35, objects: [],
  };
  const cam = { eye: [0.25, 3.7, 2.1], at: [0.55, 0.1, -0.2], fov: 0.86 };
  const css = (h) => hex(parseInt(h.replace("#", ""), 16));

  // ---------- modelos ----------
  function bodyMesh() {
    const m = new Mesh();
    const N = 22, Rr = 1, H = 0.3, silver = hex(0xd3d9e4), side = hex(0x9aa3b6);
    // corpo: cilindro achatado
    m.tube([0, 0, 0], [0, H, 0], Rr, Rr, N, side, 0, { capCol: silver });
    // bandeja onde o CD encaixa (anel escuro + pino)
    m.tube([0, H, 0], [0, H + 0.004, 0], 0.84, 0.84, N, hex(0x2b2640), 0, { capCol: hex(0x3a3452) });
    m.tube([0, H, 0], [0, H + 0.09, 0], 0.09, 0.07, 8, hex(0xe6e9f0));
    // botões coloridos na frente e o visor
    const bt = [hex(0xff4fa3), hex(0x3fd0ff), hex(0xffd23f), hex(0x5be36a)];
    for (let i = 0; i < 4; i++) {
      const a = Math.PI * 0.32 + i * 0.16;
      const x = Math.cos(a) * 0.97, z = Math.sin(a) * 0.97;
      m.box(x - 0.06, 0.1, z - 0.06, x + 0.06, 0.2, z + 0.06, bt[i]);
    }
    m.box(-0.42, 0.08, 0.9, 0.0, 0.22, 0.98, hex(0x9cf2c8), { m: 2 });
    // dobradiça atrás
    m.box(-0.3, H - 0.04, -1.04, 0.3, H + 0.06, -0.94, side);
    return m;
  }
  function lidMesh() {
    // tampa: anel prateado + janela de acrílico (vidro); dobradiça em z = -0.98 (origem da malha)
    const m = new Mesh(), N = 22, Rr = 0.99, th = 0.06;
    const ring = [];
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
      const P = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r + 0.98];
      m.quad(P(a0, 0.86, th), P(a1, 0.86, th), P(a1, Rr, th), P(a0, Rr, th), hex(0xe9edf4));
      m.quad(P(a0, Rr, 0), P(a1, Rr, 0), P(a1, Rr, th), P(a0, Rr, th), hex(0xb7bfcf));
      m.quad(P(a0, 0.86, 0), P(a0, Rr, 0), P(a1, Rr, 0), P(a1, 0.86, 0), hex(0xb7bfcf));
      m.quad(P(a0, 0.86, 0), P(a1, 0.86, 0), P(a1, 0.86, th), P(a0, 0.86, th), hex(0xb7bfcf));
      ring.push(P(a0, 0.86, th * 0.5));
    }
    m.orient([0, -1, 0.98]);
    const glass = new Mesh();
    // reflexo: duas faixinhas na janela, sem cobrir o CD
    for (const [a, b] of [[0.55, 0.62], [0.72, 0.76]]) glass.quad([-0.5, th * 0.5, 0.98 - a + 0.3], [-0.5 + 0.18, th * 0.5, 0.98 - a + 0.3], [0.1 + 0.18, th * 0.5, 0.98 - b - 0.3], [0.1, th * 0.5, 0.98 - b - 0.3], hex(0xffffff), 3);
    // logo pequeno
    m.box(0.2, th, 0.98 + 0.88, 0.5, th + 0.01, 0.98 + 0.95, hex(0xff4fa3));
    return { m, glass };
  }
  function cdMesh() {
    // CD low poly: setores com cores furta-cor, miolo transparente e furo
    const m = new Mesh(), N = 24, Ro = 0.78, Ri = 0.24, th = 0.028;
    const iri = [0xdfe6f2, 0x7fdcff, 0xb59cff, 0xff9fd8, 0xffe38a, 0x9ff0b8, 0xdfe6f2, 0xc6ccd8].map(hex);
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
      const P = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
      const c = iri[i % iri.length], c2 = iri[(i + 3) % iri.length];
      m.quad(P(a0, Ri, th), P(a1, Ri, th), P(a1, 0.5, th), P(a0, 0.5, th), V.lerp(c2, hex(0xe9edf4), 0.35), 1);
      m.quad(P(a0, 0.5, th), P(a1, 0.5, th), P(a1, Ro, th), P(a0, Ro, th), c, 1);
      m.quad(P(a0, 0.5, th + 0.001), P(a1, 0.5, th + 0.001), P(a1, 0.52, th + 0.001), P(a0, 0.52, th + 0.001), hex(0xb7bfcf));
      m.quad(P(a0, Ri, 0), P(a0, Ro, 0), P(a1, Ro, 0), P(a1, Ri, 0), hex(0xc9d0de));
      m.quad(P(a0, Ro, 0), P(a1, Ro, 0), P(a1, Ro, th), P(a0, Ro, th), hex(0xe9edf4));
      m.quad(P(a0, 0.1, th + 0.002), P(a1, 0.1, th + 0.002), P(a1, Ri, th + 0.002), P(a0, Ri, th + 0.002), hex(0xdfe4ee));
      m.quad(P(a0, Ri - 0.02, th + 0.003), P(a1, Ri - 0.02, th + 0.003), P(a1, Ri, th + 0.003), P(a0, Ri, th + 0.003), hex(0x9aa3b6));
      m.quad(P(a0, 0.1, 0), P(a1, 0.1, 0), P(a1, 0.1, th), P(a0, 0.1, th), hex(0x2b2640));
    }
    // risquinho de brilho
    m.quad([0.3, th + 0.004, -0.1], [0.62, th + 0.004, -0.36], [0.66, th + 0.004, -0.3], [0.34, th + 0.004, -0.04], hex(0xffffff), 2);
    m.orient([0, th / 2, 0]);
    return m;
  }
  function handMeshFor(sk, bd) {
    // mão segurando o CD pela borda (+x), dedos por cima, polegar por baixo; antebraço vindo de +x
    const m = new Mesh(), s = css(sk), b = css(bd), dk = V.mul(s, 0.86);
    const ex = 0.78;
    m.tube([ex + 1.55, 0.25, -0.25], [ex + 0.55, 0.08, -0.05], 0.2, 0.17, 8, s);
    m.tube([ex + 1.2, 0.2, -0.18], [ex + 0.95, 0.15, -0.13], 0.215, 0.205, 8, b);
    m.ball([ex + 0.33, 0.07, 0.0], 0.27, s, 0, 8, 5, { sx: 1.05, sy: 0.55, sz: 0.95 });
    // quatro dedos por cima do CD (dobrados pra frente)
    for (let i = 0; i < 4; i++) {
      const z = -0.27 + i * 0.18, a = [ex + 0.18, 0.13, z], k = [ex - 0.08, 0.12, z * 0.92], tip = [ex - 0.2, 0.06, z * 0.85];
      m.tube(a, k, 0.065, 0.06, 6, s);
      m.tube(k, tip, 0.06, 0.05, 6, dk);
      m.ball(tip, 0.05, dk, 0, 6, 3);
    }
    // polegar por baixo
    m.tube([ex + 0.2, -0.04, 0.2], [ex - 0.1, -0.05, 0.16], 0.075, 0.065, 6, s);
    m.ball([ex - 0.12, -0.05, 0.16], 0.065, dk, 0, 6, 3);
    return m;
  }

  // ---------- animação ----------
  const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const seg = (t, a, b) => ease((t - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - lastT < 33) return;
    const dt = Math.min(0.1, (now - (lastT || now)) / 1000);
    lastT = now;
    const t = (now - t0) / 1000;
    const ins = state === "insert";
    // tampa: abre logo no começo e fecha depois que o CD encaixa
    const open = ins ? Math.min(seg(t, 0, 0.25), 1 - seg(t, 1.15, 1.55)) : 0;
    const lidA = -1.85 * open;
    // CD: desce da mão até a bandeja girando de leve
    let cdM;
    if (ins && t < 1.0) {
      const k = seg(t, 0.12, 0.95);
      const p = [lerp(1.75, 0, k), lerp(1.55, 0.31, k), lerp(-0.55, 0, k)];
      cdM = M.mul(M.T(p[0], p[1], p[2]), M.mul(M.RZ(lerp(0.55, 0, k)), M.mul(M.RX(lerp(-0.35, 0, k)), M.RY(lerp(-0.8, 0, k)))));
      spin = 0;
    } else {
      const sp = state === "load" ? 9 : state === "play" || state === "mini" ? 4.2 : ins ? (t > 1.55 ? 3 : 0) : 0;
      spin += sp * dt;
      cdM = M.mul(M.T(0, 0.31, 0), M.RY(spin));
    }
    // mão: acompanha o CD e depois sai pra cima e pra direita
    let handM = null;
    if (ins && t < 1.6) {
      if (t < 1.0) handM = cdM;
      else {
        const k = seg(t, 1.0, 1.45);
        handM = M.mul(M.T(lerp(0, 2.3, k), lerp(0.31, 1.3, k), lerp(0, -0.9, k)), M.RZ(lerp(0, 0.5, k)));
      }
    }
    const bob = state === "play" || state === "mini" ? Math.sin(now / 1000 * 4.4) * 0.02 : 0;
    const base = M.T(0, bob, 0);
    objs.body.mo = base;
    objs.lid.mo = objs.glass.mo = M.mul(base, M.mul(M.T(0, 0.3, -0.98), M.RX(lidA)));
    objs.cd.mo = M.mul(base, cdM);
    objs.hand.hidden = !handM;
    if (handM) objs.hand.mo = M.mul(base, handM);
    R.draw(sc, cam);
  }
  function init(canvas) {
    try {
      cv = canvas;
      R = Renderer(cv, { transparent: true, lowH: 150 });
      const add = (mesh, o = {}) => { const ob = Object.assign({ g: R.upload(mesh, o), mo: M.I() }, o.extra || {}); sc.objects.push(ob); return ob; };
      const lid = lidMesh();
      objs = {
        body: add(bodyMesh()),
        cd: add(cdMesh()),
        lid: add(lid.m),
        glass: add(lid.glass, { outline: false }),
        hand: add(handMeshFor(skin, band)),
      };
      handMesh = { skin, band };
      return true;
    } catch (e) {
      R = null;
      return false;
    }
  }
  function setHand(sk, bd) {
    if (!R || (handMesh && handMesh.skin === sk && handMesh.band === bd)) return;
    objs.hand.g = R.upload(handMeshFor(sk, bd));
    handMesh = { skin: sk, band: bd };
  }
  // estados: "insert" (anima a mão), "load", "play", "mini", "" (escondido: para de desenhar)
  function set(st) {
    if (!R) return;
    if (st === "insert") t0 = performance.now();
    state = st;
    if (st && !raf) { lastT = 0; raf = requestAnimationFrame(frame); }
    if (!st && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  function resize() { if (R) R.size(); }
  return { init, set, setHand, resize, get ok() { return !!R; } };
})();
