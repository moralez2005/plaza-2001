// Motor low-poly cel-shaded (WebGL1). Sombra em faixas (toon), contorno preto por "casco
// invertido" empurrado pra trás na profundidade, decalques de um atlas (grafites, placas),
// céu em degradê e renderização em resolução baixa esticada na tela. Feito pra placa antiga.
"use strict";
const E = (() => {
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => Math.hypot(a[0], a[1], a[2]),
    norm: (a) => {
      const l = Math.hypot(a[0], a[1], a[2]) || 1;
      return [a[0] / l, a[1] / l, a[2] / l];
    },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  };
  const hex = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];

  // ---------- matrizes 4x4 (coluna) ----------
  const M = {
    I: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    mul(a, b) {
      const o = new Array(16);
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 4; i++)
          o[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
      return o;
    },
    T: (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1],
    S: (x, y, z) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1],
    RX: (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; },
    RY: (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; },
    RZ: (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; },
    // eixos + origem
    basis: (x, y, z, o) => [x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, o[0], o[1], o[2], 1],
    pt: (m, v) => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]],
    dir: (m, v) => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2], m[1] * v[0] + m[5] * v[1] + m[9] * v[2], m[2] * v[0] + m[6] * v[1] + m[10] * v[2]],
    persp(fov, asp, n, f) {
      const t = 1 / Math.tan(fov / 2);
      return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0];
    },
    look(e, c, up = [0, 1, 0]) {
      const z = V.norm(V.sub(e, c)), x = V.norm(V.cross(up, z)), y = V.cross(z, x);
      return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -V.dot(x, e), -V.dot(y, e), -V.dot(z, e), 1];
    },
    inv(a) {
      const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = a;
      const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
      const d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
      return [
        (a11 * b11 - a12 * b10 + a13 * b09) * d, (a02 * b10 - a01 * b11 - a03 * b09) * d, (a31 * b05 - a32 * b04 + a33 * b03) * d, (a22 * b04 - a21 * b05 - a23 * b03) * d,
        (a12 * b08 - a10 * b11 - a13 * b07) * d, (a00 * b11 - a02 * b08 + a03 * b07) * d, (a32 * b02 - a30 * b05 - a33 * b01) * d, (a20 * b05 - a22 * b02 + a23 * b01) * d,
        (a10 * b10 - a11 * b08 + a13 * b06) * d, (a01 * b08 - a00 * b10 - a03 * b06) * d, (a30 * b04 - a31 * b02 + a33 * b00) * d, (a21 * b02 - a20 * b04 - a23 * b00) * d,
        (a11 * b07 - a10 * b09 - a12 * b06) * d, (a00 * b09 - a01 * b07 + a02 * b06) * d, (a31 * b01 - a30 * b03 - a32 * b00) * d, (a20 * b03 - a21 * b01 + a22 * b00) * d,
      ];
    },
  };
  // matriz que leva o eixo +y local do ponto a até b (membros do boneco)
  function seg(a, b, hint) {
    const y = V.norm(V.sub(b, a));
    let x = V.cross(y, hint);
    if (V.len(x) < 1e-4) x = V.cross(y, [0, 0, 1]);
    x = V.norm(x);
    const z = V.cross(x, y);
    return M.basis(x, y, z, a);
  }

  // ---------- construção de malhas ----------
  // materiais: 0 tinta fosca, 1 metal, 2 aceso, 3 vidro, 4 decalque do atlas, 5 sombra (atlas, translúcida)
  class Mesh {
    constructor() {
      this.v = []; // px py pz nx ny nz r g b m u v
      this.w = []; // osso0 osso1 peso1
      this.bw = [0, 0, 0];
      this.tf = null;
    }
    X(p) { return this.tf ? M.pt(this.tf, p) : p; }
    tri(a, b, c, col, m = 0, uv, ws) {
      a = this.X(a); b = this.X(b); c = this.X(c);
      const n = V.norm(V.cross(V.sub(b, a), V.sub(c, a)));
      const P = [a, b, c];
      for (let i = 0; i < 3; i++) {
        const t = uv ? uv[i] : [0, 0];
        this.v.push(P[i][0], P[i][1], P[i][2], n[0], n[1], n[2], col[0], col[1], col[2], m, t[0], t[1]);
        const w = ws ? ws[i] : this.bw;
        this.w.push(w[0], w[1], w[2]);
      }
      return this;
    }
    quad(a, b, c, d, col, m = 0, uv) {
      this.tri(a, b, c, col, m, uv && [uv[0], uv[1], uv[2]]);
      this.tri(a, c, d, col, m, uv && [uv[0], uv[2], uv[3]]);
      return this;
    }
    // caixa alinhada; o: {top, side, m, noBottom}
    box(x0, y0, z0, x1, y1, z1, col, o = {}) {
      const top = o.top || col, m = o.m || 0, s = o.side || col;
      const p = (x, y, z) => [x, y, z];
      this.quad(p(x0, y1, z0), p(x0, y1, z1), p(x1, y1, z1), p(x1, y1, z0), top, m);
      if (!o.noBottom) this.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1), s, m);
      this.quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1), col, m);
      this.quad(p(x1, y0, z0), p(x0, y0, z0), p(x0, y1, z0), p(x1, y1, z0), col, m);
      this.quad(p(x1, y0, z1), p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), s, m);
      this.quad(p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0), s, m);
      return this;
    }
    // tubo/cone de a até b; ex/ez achatam a seção (elipse)
    tube(a, b, r0, r1, n, col, m = 0, o = {}) {
      const d = V.norm(V.sub(b, a));
      let u = Math.abs(d[1]) < 0.95 ? V.cross(d, [0, 1, 0]) : V.cross(d, [1, 0, 0]);
      u = V.norm(u);
      const w = V.cross(d, u);
      const ex = o.ex || 1, ez = o.ez || 1, ph = o.phase || 0;
      const ring = (c, r) => {
        const out = [];
        for (let i = 0; i < n; i++) {
          const t = ph + (i / n) * Math.PI * 2;
          out.push(V.add(c, V.add(V.mul(u, Math.cos(t) * r * ex), V.mul(w, Math.sin(t) * r * ez))));
        }
        return out;
      };
      const A = ring(a, r0), B = ring(b, r1);
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        this.quad(A[i], A[j], B[j], B[i], col, m);
      }
      if (o.cap !== false) {
        for (let i = 1; i < n - 1; i++) {
          this.tri(A[0], A[i + 1], A[i], o.capCol || col, m);
          this.tri(B[0], B[i], B[i + 1], o.capCol || col, m);
        }
      }
      return this;
    }
    // esfera low-poly (sy achata em y; cut corta embaixo, 0..1)
    ball(c, r, col, m = 0, seg = 8, rings = 6, o = {}) {
      const sy = o.sy || 1, sx = o.sx || 1, sz = o.sz || 1, cut = o.cut || 0;
      const pt = (i, j) => {
        const th = (i / rings) * Math.PI * (1 - cut), ph = (j / seg) * Math.PI * 2;
        return [c[0] + Math.sin(th) * Math.cos(ph) * r * sx, c[1] + Math.cos(th) * r * sy, c[2] + Math.sin(th) * Math.sin(ph) * r * sz];
      };
      for (let i = 0; i < rings; i++)
        for (let j = 0; j < seg; j++) {
          const a = pt(i, j), b = pt(i, j + 1), cc = pt(i + 1, j + 1), d = pt(i + 1, j);
          if (i === 0) this.tri(a, cc, d, col, m);
          else this.quad(a, b, cc, d, col, m);
        }
      if (cut) {
        const yb = c[1] + Math.cos(Math.PI * (1 - cut)) * r * sy;
        for (let j = 0; j < seg; j++) this.tri([c[0], yb, c[2]], pt(rings, j), pt(rings, j + 1), o.capCol || col, m);
      }
      return this;
    }
    // perfil (z,y) extrudado em x, preenchido até o chão
    prof(pts, x0, x1, top, side, m = 0) {
      if (pts[0][0] < pts[pts.length - 1][0]) pts = pts.slice().reverse();
      for (let i = 0; i < pts.length - 1; i++) {
        const [za, ya] = pts[i], [zb, yb] = pts[i + 1];
        this.quad([x0, ya, za], [x1, ya, za], [x1, yb, zb], [x0, yb, zb], top, m);
        this.quad([x0, 0, za], [x0, ya, za], [x0, yb, zb], [x0, 0, zb], side, 0);
        this.quad([x1, 0, zb], [x1, yb, zb], [x1, ya, za], [x1, 0, za], side, 0);
      }
      return this;
    }
    // decalque: centro, vetor direita, vetor cima, largura, altura, retângulo do atlas [u0,v0,u1,v1]
    decal(c, r, u, w, h, rect, col = [1, 1, 1], m = 4) {
      const R = V.mul(r, w / 2), U = V.mul(u, h / 2);
      const tl = V.add(V.sub(c, R), U), tr = V.add(V.add(c, R), U), br = V.sub(V.add(c, R), U), bl = V.sub(V.sub(c, R), U);
      const [u0, v0, u1, v1] = rect;
      return this.quad(bl, br, tr, tl, col, m, [[u0, v1], [u1, v1], [u1, v0], [u0, v0]]);
    }
    // vira triângulos cuja normal aponta pra dentro (em relação a um centro)
    orient(center, from = 0) {
      const v = this.v;
      for (let i = from; i < v.length; i += 36) {
        const c = [(v[i] + v[i + 12] + v[i + 24]) / 3, (v[i + 1] + v[i + 13] + v[i + 25]) / 3, (v[i + 2] + v[i + 14] + v[i + 26]) / 3];
        const n = [v[i + 3], v[i + 4], v[i + 5]];
        if (V.dot(n, V.sub(c, center)) < 0) {
          for (let k = 0; k < 12; k++) { const t = v[i + 12 + k]; v[i + 12 + k] = v[i + 24 + k]; v[i + 24 + k] = t; }
          const wi = (i / 12) * 3, W = this.w;
          for (let k = 0; k < 3; k++) { const t = W[wi + 3 + k]; W[wi + 3 + k] = W[wi + 6 + k]; W[wi + 6 + k] = t; }
          for (let j = 0; j < 3; j++) for (let k = 3; k < 6; k++) v[i + j * 12 + k] *= -1;
        }
      }
      return this;
    }
    merge(o) { for (const x of o.v) this.v.push(x); for (const x of o.w) this.w.push(x); return this; }
  }

  // ---------- shaders ----------
  const VS = `attribute vec3 P;attribute vec3 N;attribute vec3 S;attribute vec3 C;attribute float M;attribute vec2 U;
attribute vec3 B;uniform mat4 BN[12];uniform float SK;
uniform mat4 VP;uniform mat4 MO;uniform float SM;
varying vec3 vN;varying vec3 vC;varying vec3 vW;varying float vM;varying vec2 vU;
void main(){mat4 W=MO;if(SK>.5)W=BN[int(B.x)]*(1.-B.z)+BN[int(B.y)]*B.z;vec4 w=W*vec4(P,1.);vW=w.xyz;vN=mat3(W)*mix(N,S,SM*step(.15,abs(M-.25)));vC=C;vM=M;vU=U;gl_Position=VP*w;}`;
  const FS = `precision mediump float;varying vec3 vN;varying vec3 vC;varying vec3 vW;varying float vM;varying vec2 vU;
uniform vec3 EYE;uniform vec3 SUN;uniform vec3 FOG;uniform float FOGD;uniform vec3 SHADE;uniform vec3 SKYT;uniform sampler2D TEX;uniform vec3 TINT;uniform float PASS;
uniform vec3 AMB;uniform float NIGHT;uniform float WET;uniform vec3 WINC;uniform vec3 LP[24];uniform float NL;
float hh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
void main(){
 vec3 n=normalize(vN);vec3 v=normalize(vW-EYE);if(dot(n,v)>0.)n=-n;
 float l=dot(n,SUN);
 float b1=smoothstep(-.36,-.3,l),band=smoothstep(.15,.21,l),b3=smoothstep(.66,.72,l);
 vec3 base=vC*TINT;float a=1.;
 if(vM>3.5){vec4 t=texture2D(TEX,vU);
   if(vM>4.5){a=t.a*.55;base=SHADE*.35;if(PASS<.5)discard;}
   else{if(t.a<.5)discard;base=t.rgb*vC;}}
 vec3 c=base*mix(mix(SHADE*.8,SHADE,b1),vec3(1.04,1.,.96),band)*(1.+.08*b3);
 float rim=1.-abs(dot(n,-v));
 if(vM>.5&&vM<1.5){vec3 r=reflect(v,n);float sp=dot(r,SUN);c=mix(c,mix(SKYT,vec3(1.),step(.0,r.y)*.3),.35)+step(.82,sp)*.7+step(.97,sp)*.4;}
 else if(vM>1.5&&vM<2.5){c=base*1.15;}
 else if(vM>2.5&&vM<3.5){vec3 r=reflect(v,n);c=mix(base,SKYT,.45)+step(.6,rim)*.25+step(.9,dot(r,SUN))*.6;a=.45+.4*rim;if(PASS<.5)discard;}
 else{c+=step(.72,rim)*band*.10*vec3(1.,.95,.85);}
 // hora do dia e clima: luz ambiente, janelas acendendo, poças de luz dos postes, chão molhado
 bool lit=vM>1.5&&vM<2.5;
 if(!lit){
  c*=vM>3.5&&vM<4.5?mix(AMB,vec3(1.),.3):AMB;
  if(NIGHT>.01){
   if(vM<.5&&distance(vC,WINC)<.03&&hh(floor(vW*vec3(.8,.38,.8)))>.42){c=mix(c,vec3(1.,.8,.46),NIGHT*.92);}
   else{float g=0.;for(int i=0;i<24;i++){if(float(i)>=NL)break;vec3 dd=vW-LP[i];dd.y*=.55;g+=1.-smoothstep(.6,7.,length(dd));}
    c+=base*vec3(1.,.74,.42)*min(g,1.3)*.75*NIGHT+vec3(1.,.8,.5)*min(g,1.3)*.05*NIGHT;}
  }
  if(WET>.01&&n.y>.85&&vM<.5){vec3 r=reflect(v,n);c=c*(1.-.28*WET)+SKYT*.12*WET+step(.9,dot(r,SUN))*.25*WET;}
 }
 if(PASS>.5&&a>.99&&vM<4.5)discard;
 float d=length(vW-EYE);c=mix(c,FOG,1.-exp(-d*FOGD));
 gl_FragColor=vec4(c,a);}`;
  // contorno: o casco é inflado na tela (pixels fixos) e empurrado pra trás na profundidade
  const OVS = `attribute vec3 P;attribute vec3 N;attribute vec3 S;attribute float M;attribute vec3 B;uniform mat4 BN[12];uniform float SK;uniform mat4 V;uniform mat4 PR;uniform mat4 MO;uniform vec2 RES;uniform float W;uniform vec3 EYE;
varying float vD;varying float vF;
void main(){mat4 K=MO;if(SK>.5)K=BN[int(B.x)]*(1.-B.z)+BN[int(B.y)]*B.z;vec4 w=K*vec4(P,1.);vF=M>3.5?1.:dot(normalize(mat3(K)*N),normalize(EYE-w.xyz));vec4 vp=V*w;vD=-vp.z;vp.z-=.012+vD*.002;vec4 c=PR*vp;
 vec3 sn=mat3(V)*(mat3(K)*S);vec2 d=(PR*vec4(sn,0.)).xy;float l=length(d);d=l>1e-5?d/l:vec2(0.);
 float w2=W*clamp(16./max(vD,.01),.5,1.);
 c.xy+=d*w2*2./RES*c.w;gl_Position=c;}`;
  const OFS = `precision mediump float;varying float vD;varying float vF;uniform vec3 INK;uniform vec3 FOG;uniform float FOGD;
void main(){if(vF>0.)discard;gl_FragColor=vec4(mix(INK,FOG,1.-exp(-vD*FOGD*1.15)),1.);}`;
  const SKYVS = `attribute vec2 Q;varying vec2 uv;void main(){uv=Q;gl_Position=vec4(Q,.9999,1.);}`;
  const SKYFS = `precision mediump float;varying vec2 uv;uniform mat4 IVP;uniform vec3 EYE;uniform vec3 SUN;uniform vec3 TOP;uniform vec3 MID;uniform vec3 HZ;uniform vec3 FOG;uniform float NIGHT;
void main(){vec4 a=IVP*vec4(uv,1.,1.);vec3 d=normalize(a.xyz/a.w-EYE);float y=d.y;
 vec3 c=mix(HZ,MID,smoothstep(.0,.22,y));c=mix(c,TOP,smoothstep(.2,.75,y));
 if(y<0.)c=FOG;
 float s=dot(d,SUN);
 if(NIGHT>.01&&y>.05){vec3 q=floor(d*180.);float h=fract(sin(dot(q,vec3(12.9898,78.233,37.719)))*43758.5453);c+=vec3(.9,.92,1.)*step(.9965,h)*NIGHT*smoothstep(.05,.35,y);}
 c=mix(c,mix(vec3(1.,.97,.86),vec3(.93,.95,1.),NIGHT),smoothstep(.9975-NIGHT*.0015,.998-NIGHT*.0015,s));
 c=mix(c,c*1.08+vec3(.06,.04,0.),step(.985,s)*(1.-step(.9975,s))*.6);
 gl_FragColor=vec4(c,1.);}`;
  const BLITVS = `attribute vec2 Q;varying vec2 uv;void main(){uv=Q*.5+.5;gl_Position=vec4(Q,0.,1.);}`;
  const BLITFS = `precision mediump float;varying vec2 uv;uniform sampler2D T;
uniform float AL;
void main(){vec4 t=texture2D(T,uv);vec3 c=t.rgb;float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,1.12);
 vec2 q=uv-.5;if(AL<.5)c*=1.-.22*pow(length(q)*1.35,2.6);gl_FragColor=vec4(c,AL>.5?t.a:1.);}`;

  function Renderer(canvas, opt = {}) {
    const TR = !!opt.transparent;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: TR, premultipliedAlpha: false, preserveDrawingBuffer: !!opt.keep, powerPreference: "low-power" });
    if (!gl) throw new Error("sem WebGL");
    const sh = (t, s) => {
      const x = gl.createShader(t);
      gl.shaderSource(x, s);
      gl.compileShader(x);
      if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(x));
      return x;
    };
    const prog = (v, f) => {
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, v));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
      const u = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const nm = gl.getActiveUniform(p, i).name;
        u[nm] = gl.getUniformLocation(p, nm);
      }
      const at = {};
      const na = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
      for (let i = 0; i < na; i++) {
        const nm = gl.getActiveAttrib(p, i).name;
        at[nm] = gl.getAttribLocation(p, nm);
      }
      return { p, u, at };
    };
    const pm = prog(VS, FS), po = prog(OVS, OFS), ps = prog(SKYVS, SKYFS), pb = prog(BLITVS, BLITFS);
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const fbo = gl.createFramebuffer(), tex = gl.createTexture(), rb = gl.createRenderbuffer();
    const atlas = gl.createTexture();
    let lw = 0, lh = 0, lowH = opt.lowH || 400;
    function size(newLow) {
      if (newLow) lowH = newLow;
      const W = Math.max(1, canvas.clientWidth), H = Math.max(1, canvas.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      lh = Math.min(canvas.height, lowH);
      lw = Math.round((W / H) * lh);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, lw, lh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, lw, lh);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
    }
    size();
    // textura extra (interior das lojas): o objeto usa o.tex no lugar do atlas
    function texture(cv, old) {
      const t = old || gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    }
    function setAtlas(cv) {
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    // sobe a malha com normais suaves calculadas (pra contorno e pra sombreado liso)
    function upload(mesh, o = {}) {
      const v = mesh.v, nv = v.length / 12;
      const key = (i) => `${Math.round(v[i * 12] * 200)},${Math.round(v[i * 12 + 1] * 200)},${Math.round(v[i * 12 + 2] * 200)}`;
      const acc = new Map();
      for (let i = 0; i < nv; i++) {
        const k = key(i);
        let s = acc.get(k);
        if (!s) acc.set(k, (s = [0, 0, 0]));
        s[0] += v[i * 12 + 3]; s[1] += v[i * 12 + 4]; s[2] += v[i * 12 + 5];
      }
      const out = new Float32Array(nv * 18);
      const ww = mesh.w;
      let skin = 0;
      let trans = 0;
      for (let i = 0; i < nv; i++) {
        const s = V.norm(acc.get(key(i)));
        const b = i * 18, a = i * 12;
        out[b] = v[a]; out[b + 1] = v[a + 1]; out[b + 2] = v[a + 2];
        out[b + 3] = v[a + 3]; out[b + 4] = v[a + 4]; out[b + 5] = v[a + 5];
        out[b + 6] = s[0]; out[b + 7] = s[1]; out[b + 8] = s[2];
        out[b + 9] = v[a + 6]; out[b + 10] = v[a + 7]; out[b + 11] = v[a + 8];
        out[b + 12] = v[a + 9]; out[b + 13] = v[a + 10]; out[b + 14] = v[a + 11];
        out[b + 15] = ww[i * 3] || 0; out[b + 16] = ww[i * 3 + 1] || 0; out[b + 17] = ww[i * 3 + 2] || 0;
        if (out[b + 15] || out[b + 16]) skin = 1;
        if (v[a + 9] === 3 || v[a + 9] === 5) trans = 1;
      }
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, out, gl.STATIC_DRAW);
      return { buf, count: nv, outline: o.outline !== false, smooth: o.smooth ? 1 : 0, trans, skin: o.skin || skin };
    }
    function bindMesh(P, g) {
      gl.bindBuffer(gl.ARRAY_BUFFER, g.buf);
      const F = 72;
      const set = (n, sz, off) => {
        const l = P.at[n];
        if (l === undefined || l < 0) return;
        gl.enableVertexAttribArray(l);
        gl.vertexAttribPointer(l, sz, gl.FLOAT, false, F, off * 4);
      };
      set("P", 3, 0); set("N", 3, 3); set("S", 3, 6); set("C", 3, 9); set("M", 1, 12); set("U", 2, 13); set("B", 3, 15);
    }
    const ID = M.I();
    let tris = 0;
    function draw(sc, cam) {
      const asp = lw / lh;
      const PR = M.persp(cam.fov || 1.1, asp, 0.12, 650);
      const VW = M.look(cam.eye, cam.at, cam.up || [0, 1, 0]);
      const VP = M.mul(PR, VW);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, lw, lh);
      if (TR) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); }
      else gl.clear(gl.DEPTH_BUFFER_BIT);
      // céu
      gl.disable(gl.DEPTH_TEST);
      if (!TR) {
      gl.useProgram(ps.p);
      gl.uniformMatrix4fv(ps.u.IVP, false, M.inv(VP));
      gl.uniform3fv(ps.u.EYE, cam.eye);
      gl.uniform3fv(ps.u.SUN, sc.sun);
      gl.uniform3fv(ps.u.TOP, sc.top);
      gl.uniform3fv(ps.u.MID, sc.mid);
      gl.uniform3fv(ps.u.HZ, sc.hz);
      gl.uniform3fv(ps.u.FOG, sc.fog);
      gl.uniform1f(ps.u.NIGHT, sc.night || 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(ps.at.Q);
      gl.vertexAttribPointer(ps.at.Q, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(ps.at.Q);
      }
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
      tris = 0;
      const objs = sc.objects.filter((o) => !o.hidden && o.g);
      // 1) contornos
      gl.useProgram(po.p);
      gl.uniformMatrix4fv(po.u.V, false, VW);
      gl.uniformMatrix4fv(po.u.PR, false, PR);
      gl.uniform2f(po.u.RES, lw, lh);
      gl.uniform1f(po.u.W, sc.ink_w || 1.25);
      gl.uniform3fv(po.u.INK, sc.ink);
      gl.uniform3fv(po.u.EYE, cam.eye);
      gl.uniform3fv(po.u.FOG, sc.fog);
      gl.uniform1f(po.u.FOGD, sc.fogd);
      for (const o of objs) {
        if (!o.g.outline) continue;
        bindMesh(po, o.g);
        gl.uniform1f(po.u.W, (sc.ink_w || 1.25) * (o.inkw || 1));
        gl.uniformMatrix4fv(po.u.MO, false, o.mo || ID);
        gl.uniform1f(po.u.SK, o.bones ? 1 : 0);
        if (o.bones) gl.uniformMatrix4fv(po.u["BN[0]"], false, o.bones);
        gl.drawArrays(gl.TRIANGLES, 0, o.g.count);
      }
      for (const k in po.at) gl.disableVertexAttribArray(po.at[k]);
      // 2) opaco
      gl.useProgram(pm.p);
      gl.uniformMatrix4fv(pm.u.VP, false, VP);
      gl.uniform3fv(pm.u.EYE, cam.eye);
      gl.uniform3fv(pm.u.SUN, sc.sun);
      gl.uniform3fv(pm.u.FOG, sc.fog);
      gl.uniform1f(pm.u.FOGD, sc.fogd);
      gl.uniform3fv(pm.u.SHADE, sc.shade);
      gl.uniform3fv(pm.u.SKYT, sc.mid);
      gl.uniform3fv(pm.u.AMB, sc.amb || [1, 1, 1]);
      gl.uniform1f(pm.u.NIGHT, sc.night || 0);
      gl.uniform1f(pm.u.WET, sc.wet || 0);
      gl.uniform3fv(pm.u.WINC, sc.winc || [9, 9, 9]);
      const nl = sc.lights ? Math.min(24, sc.lights.length / 3) : 0;
      gl.uniform1f(pm.u.NL, nl);
      if (nl && pm.u["LP[0]"]) gl.uniform3fv(pm.u["LP[0]"], sc.lights);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.uniform1i(pm.u.TEX, 0);
      let bound = atlas;
      const pass = (p) => {
        gl.uniform1f(pm.u.PASS, p);
        for (const o of objs) {
          if (p && !o.g.trans) continue;
          const tx = o.tex || atlas;
          if (tx !== bound) { gl.bindTexture(gl.TEXTURE_2D, tx); bound = tx; }
          bindMesh(pm, o.g);
          gl.uniformMatrix4fv(pm.u.MO, false, o.mo || ID);
          gl.uniform1f(pm.u.SK, o.bones ? 1 : 0);
          if (o.bones) gl.uniformMatrix4fv(pm.u["BN[0]"], false, o.bones);
          gl.uniform1f(pm.u.SM, o.g.smooth);
          gl.uniform3fv(pm.u.TINT, o.tint || [1, 1, 1]);
          gl.drawArrays(gl.TRIANGLES, 0, o.g.count);
          tris += o.g.count / 3;
        }
      };
      pass(0);
      // 3) translúcido (vidro, sombra)
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      pass(1);
      if (bound !== atlas) gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      for (const k in pm.at) gl.disableVertexAttribArray(pm.at[k]);
      // estica pra tela
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(pb.p);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(pb.u.T, 0);
      gl.uniform1f(pb.u.AL, TR ? 1 : 0);
      if (TR) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(pb.at.Q);
      gl.vertexAttribPointer(pb.at.Q, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(pb.at.Q);
      return VP;
    }
    return { gl, upload, draw, size, setAtlas, texture, get low() { return lh; }, get tris() { return tris; } };
  }

  // IK de dois ossos: quadril/ombro a, alvo c, comprimentos l1 l2, dica de direção do joelho/cotovelo
  function ik(a, c, l1, l2, hint) {
    let d = V.sub(c, a);
    let L = V.len(d);
    const maxL = l1 + l2 - 1e-3;
    if (L > maxL) { d = V.mul(V.norm(d), maxL); L = maxL; c = V.add(a, d); }
    if (L < 1e-3) L = 1e-3;
    const u = V.mul(d, 1 / L);
    const x = (l1 * l1 - l2 * l2 + L * L) / (2 * L);
    const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
    let p = V.sub(hint, V.mul(u, V.dot(hint, u)));
    p = V.norm(p);
    return { mid: V.add(V.add(a, V.mul(u, x)), V.mul(p, h)), end: c };
  }

  return { V, M, hex, Mesh, Renderer, seg, ik };
})();
