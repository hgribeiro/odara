/* =========================================================
   Odara — visualizador 3D de bolos e kits (three.js r160)
   - Luz de estúdio (RoomEnvironment) + sombras suaves
   - Cobertura de chantininho com borda arredondada e marcas de espátula
   - Corte com camadas onduladas: miolo poroso e recheio cremoso
   - Bicos de confeitar em espiral, calda de chocolate escorrendo
   - Doces e salgados com texturas (granulado, leite em pó, empanado)
   API: criarVisualizador(container) → { atualizar(spec), alternarFatia(), destruir() }
   ========================================================= */
import * as THREE from "./vendor/three.module.min.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const TAU = Math.PI * 2;
const CUNHA = Math.PI / 3.6; // ângulo da fatia
const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const celular = window.matchMedia("(max-width: 860px)").matches;

/* ---------- Aleatório com semente (resultado estável entre atualizações) ---------- */
let semente = 1;
const aleatorio = () => ((semente = (semente * 16807) % 2147483647) - 1) / 2147483646;
const entre = (a, b) => a + (b - a) * aleatorio();

/* =========================================================
   Texturas procedurais (canvas) — cacheadas e compartilhadas
   ========================================================= */
const cacheTex = new Map();
function canvas(tam) {
  const c = document.createElement("canvas");
  c.width = c.height = tam;
  return [c, c.getContext("2d")];
}
function comoTextura(c, srgb, repeticao = [1, 1]) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeticao);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.userData.compartilhada = true;
  return t;
}
function memo(chave, fn) {
  if (!cacheTex.has(chave)) cacheTex.set(chave, fn());
  return cacheTex.get(chave);
}
const tom = (hex, f) => {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return `#${c.getHexString()}`;
};

// Miolo de bolo: poros escuros e pontos claros
function texMiolo(cor) {
  return memo("miolo" + cor, () => {
    const s0 = semente; semente = 11;
    const [cc, gc] = canvas(256), [cb, gb] = canvas(256);
    gc.fillStyle = cor; gc.fillRect(0, 0, 256, 256);
    gb.fillStyle = "#bbb"; gb.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) {
      const x = entre(0, 256), y = entre(0, 256), r = entre(0.6, 2.8);
      const claro = aleatorio() < 0.25;
      gc.fillStyle = claro ? tom(cor, 1.18) : tom(cor, entre(0.62, 0.82));
      gc.globalAlpha = entre(0.35, 0.8);
      gc.beginPath(); gc.ellipse(x, y, r * entre(0.7, 1.5), r, entre(0, 3), 0, TAU); gc.fill();
      gb.fillStyle = claro ? "#eee" : "#333";
      gb.beginPath(); gb.ellipse(x, y, r * 1.1, r, 0, 0, TAU); gb.fill();
    }
    semente = s0;
    return { map: comoTextura(cc, true, [2.2, 2.2]), bump: comoTextura(cb, false, [2.2, 2.2]) };
  });
}
// Recheio cremoso, com pedaços opcionais (morango, abacaxi, crocante…)
function texRecheio(cor, pedacos) {
  return memo("rech" + cor + pedacos, () => {
    const s0 = semente; semente = 23;
    const [cc, gc] = canvas(256);
    gc.fillStyle = cor; gc.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) {
      gc.globalAlpha = 0.08;
      gc.fillStyle = aleatorio() < 0.5 ? tom(cor, 1.12) : tom(cor, 0.9);
      gc.beginPath(); gc.ellipse(entre(0, 256), entre(0, 256), entre(10, 40), entre(4, 12), 0, 0, TAU); gc.fill();
    }
    if (pedacos) {
      for (let i = 0; i < 70; i++) {
        gc.globalAlpha = entre(0.75, 1);
        gc.fillStyle = aleatorio() < 0.3 ? tom(pedacos, 1.2) : pedacos;
        gc.beginPath(); gc.ellipse(entre(0, 256), entre(0, 256), entre(2, 7), entre(1.5, 4), entre(0, 3), 0, TAU); gc.fill();
      }
    }
    semente = s0;
    return comoTextura(cc, true, [2, 2]);
  });
}
// Marcas de espátula na cobertura (relevo)
function texEspatula() {
  return memo("espatula", () => {
    const s0 = semente; semente = 5;
    const [c, g] = canvas(256);
    g.fillStyle = "#888"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) {
      const y = entre(0, 256);
      g.globalAlpha = entre(0.05, 0.22);
      g.fillStyle = aleatorio() < 0.5 ? "#fff" : "#000";
      g.fillRect(0, y, 256, entre(1, 5));
    }
    g.globalAlpha = 0.12;
    for (let i = 0; i < 3000; i++) { g.fillStyle = aleatorio() < 0.5 ? "#fff" : "#000"; g.fillRect(entre(0, 256), entre(0, 256), 1, 1); }
    semente = s0;
    return comoTextura(c, false, [8, 3]);
  });
}
// Granulado de chocolate
function texGranulado(cor) {
  return memo("gran" + cor, () => {
    const s0 = semente; semente = 31;
    const [cc, gc] = canvas(256), [cb, gb] = canvas(256);
    gc.fillStyle = tom(cor, 0.8); gc.fillRect(0, 0, 256, 256);
    gb.fillStyle = "#222"; gb.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2200; i++) {
      const x = entre(0, 256), y = entre(0, 256), a = entre(0, Math.PI);
      const l = entre(4, 8), w = entre(1.6, 2.4);
      gc.save(); gc.translate(x, y); gc.rotate(a);
      gc.fillStyle = tom(cor, entre(0.7, 1.5)); gc.fillRect(-l / 2, -w / 2, l, w);
      gc.fillStyle = "rgba(255,255,255,.18)"; gc.fillRect(-l / 2, -w / 2, l, w * 0.35);
      gc.restore();
      gb.save(); gb.translate(x, y); gb.rotate(a); gb.fillStyle = `rgb(${entre(170, 255) | 0},0,0)`; gb.fillRect(-l / 2, -w / 2, l, w); gb.restore();
    }
    semente = s0;
    return { map: comoTextura(cc, true, [3, 2]), bump: comoTextura(cb, false, [3, 2]) };
  });
}
// Pó (leite Ninho, açúcar, coco) ou empanado (salgados)
function texGraos(cor, { grosso = false, brilho = false } = {}) {
  return memo("graos" + cor + grosso + brilho, () => {
    const s0 = semente; semente = grosso ? 41 : 43;
    const [cc, gc] = canvas(256), [cb, gb] = canvas(256);
    gc.fillStyle = cor; gc.fillRect(0, 0, 256, 256);
    gb.fillStyle = "#777"; gb.fillRect(0, 0, 256, 256);
    const n = grosso ? 1800 : 3500;
    for (let i = 0; i < n; i++) {
      const x = entre(0, 256), y = entre(0, 256), r = grosso ? entre(1, 3.5) : entre(0.5, 1.6);
      const f = grosso ? entre(0.72, 1.18) : entre(0.9, 1.1);
      gc.fillStyle = brilho && aleatorio() < 0.1 ? "#ffffff" : tom(cor, f);
      gc.beginPath(); gc.arc(x, y, r, 0, TAU); gc.fill();
      const v = (entre(60, 255)) | 0;
      gb.fillStyle = `rgb(${v},${v},${v})`;
      gb.beginPath(); gb.arc(x, y, r, 0, TAU); gb.fill();
    }
    semente = s0;
    return { map: comoTextura(cc, true, [3, 2]), bump: comoTextura(cb, false, [3, 2]) };
  });
}
// Sementes do morango
function texMorango() {
  return memo("morango", () => {
    const [c, g] = canvas(128);
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, "#e8434e"); grad.addColorStop(1, "#b8202d");
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    for (let y = 6; y < 128; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < 128; x += 12) {
      g.fillStyle = "#f6d36b"; g.beginPath(); g.ellipse(x, y, 1.6, 2.4, 0, 0, TAU); g.fill();
    }
    return comoTextura(c, true, [4, 2]);
  });
}
// Sombra de contato (gradiente radial)
function texSombra() {
  return memo("sombra", () => {
    const [c, g] = canvas(256);
    const grad = g.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, "rgba(70,35,28,0.38)");
    grad.addColorStop(0.6, "rgba(70,35,28,0.12)");
    grad.addColorStop(1, "rgba(70,35,28,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    return comoTextura(c, true);
  });
}

/* =========================================================
   Geometrias compartilhadas (criadas uma vez)
   ========================================================= */
const cacheGeo = new Map();
function geoMemo(chave, fn) {
  if (!cacheGeo.has(chave)) {
    const g = fn();
    g.userData.compartilhada = true;
    cacheGeo.set(chave, g);
  }
  return cacheGeo.get(chave);
}
const v2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));

// Bico de confeitar "pitanga": torneado com estrias em espiral
function geoRoseta() {
  return geoMemo("roseta", () => {
    const g = new THREE.LatheGeometry(v2([[0, 0], [0.085, 0], [0.092, 0.018], [0.084, 0.042], [0.068, 0.068], [0.05, 0.092], [0.032, 0.115], [0.016, 0.135], [0.004, 0.15], [0, 0.152]]), 64);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const r = Math.hypot(x, z);
      if (r < 1e-5) continue;
      const fi = Math.atan2(x, z);
      const k = 1 + 0.17 * Math.cos(7 * fi + y * 32) * Math.min(1, r / 0.03);
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    g.computeVertexNormals();
    return g;
  });
}
// Forminha de papel plissada
function geoForminha() {
  return geoMemo("forminha", () => {
    const g = new THREE.LatheGeometry(v2([[0, 0.003], [0.07, 0.003], [0.075, 0.006], [0.083, 0.03], [0.092, 0.058], [0.1, 0.078]]), 72);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
      if (r < 0.072) continue;
      const fi = Math.atan2(x, z);
      const k = 1 + 0.045 * Math.cos(30 * fi);
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    g.computeVertexNormals();
    return g;
  });
}
function geoMorango() {
  return geoMemo("morango", () => new THREE.LatheGeometry(v2([[0, 0], [0.034, 0.006], [0.05, 0.026], [0.054, 0.05], [0.047, 0.078], [0.031, 0.104], [0.013, 0.122], [0, 0.128]]), 24));
}
function geoCoracao() {
  return geoMemo("coracao", () => {
    const s = new THREE.Shape(), k = 0.14;
    s.moveTo(0, -k * 0.9);
    s.bezierCurveTo(k * 0.15, -k * 0.6, k, -k * 0.25, k, k * 0.25);
    s.bezierCurveTo(k, k * 0.75, k * 0.4, k * 0.95, 0, k * 0.5);
    s.bezierCurveTo(-k * 0.4, k * 0.95, -k, k * 0.75, -k, k * 0.25);
    s.bezierCurveTo(-k, -k * 0.25, -k * 0.15, -k * 0.6, 0, -k * 0.9);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.016, bevelSegments: 5, curveSegments: 24 });
    g.center();
    return g;
  });
}

/* =========================================================
   Materiais (criados por montagem; descartados ao trocar)
   ========================================================= */
function fisico(cor, opts = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(cor),
    roughness: opts.rugosidade ?? 0.6,
    metalness: opts.metal ?? 0,
    clearcoat: opts.verniz ?? 0,
    clearcoatRoughness: opts.vernizRug ?? 0.2,
    sheen: opts.sheen ?? 0,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(opts.sheenCor || "#ffffff"),
    side: opts.duplo ? THREE.DoubleSide : THREE.FrontSide,
    flatShading: !!opts.plano,
  });
  if (opts.map) m.map = opts.map;
  if (opts.reflexo != null) m.envMapIntensity = opts.reflexo;
  if (opts.bump) { m.bumpMap = opts.bump; m.bumpScale = opts.relevo ?? 1; }
  return m;
}

/* =========================================================
   Bolo
   ========================================================= */
function dimensoes(kg) {
  const k = Math.min(Math.max(kg, 0.6), 4);
  const r = 0.74 + 0.16 * k;
  const e = 0.94 + 0.05 * k;
  const camadas = [
    { tipo: "massa", h: 0.24 * e },
    { tipo: "recheio", idx: 0, h: 0.13 * e },
    { tipo: "massa", h: 0.24 * e },
    { tipo: "recheio", idx: 1, h: 0.13 * e },
    { tipo: "massa", h: 0.24 * e },
  ];
  const H = camadas.reduce((s, c) => s + c.h, 0);
  return { r, camadas, H, t: 0.05, rr: 0.075 };
}

// Perfil (raio, altura) da cobertura: base levemente saliente e borda arredondada
function perfilCobertura({ r, H, t, rr }) {
  const R = r + t, top = H + t;
  const pts = [[R + 0.018, 0], [R + 0.006, 0.012], [R, 0.03], [R, top - rr]];
  for (let i = 1; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push([R - rr + rr * Math.cos(a), top - rr + rr * Math.sin(a)]);
  }
  pts.push([R * 0.55, top + 0.004], [0, top + 0.006]);
  return pts;
}

// Ondulação entre camadas (deixa o corte com cara de bolo de verdade)
function onda(k, n, u) {
  if (k === 0 || k === n) return 0;
  return 0.011 * (Math.sin(u * 9 + k * 1.7) * 0.6 + Math.sin(u * 23 + k * 3.1) * 0.4);
}

// Face de corte posicionada no ângulo a (forma 2D em u=raio, v=altura)
function faceNoAngulo(shape, a, mat) {
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), mat);
  m.rotation.y = a - Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

function facesDeCorte(dim, mats, a) {
  const { r, camadas } = dim;
  const grupo = new THREE.Group();
  const n = camadas.length;
  const Y = [0];
  camadas.forEach((c) => Y.push(Y[Y.length - 1] + c.h));
  const passos = 28;
  camadas.forEach((c, i) => {
    const s = new THREE.Shape();
    s.moveTo(0, Y[i] + onda(i, n, 0));
    for (let j = 1; j <= passos; j++) { const u = (j / passos) * r; s.lineTo(u, Y[i] + onda(i, n, u)); }
    for (let j = passos; j >= 0; j--) { const u = (j / passos) * r; s.lineTo(u, Y[i + 1] + onda(i + 1, n, u)); }
    grupo.add(faceNoAngulo(s, a, c.tipo === "massa" ? mats.massa : mats.recheio[c.idx]));
  });
  // faixa da cobertura (lateral + topo) no corte
  const perfil = perfilCobertura(dim);
  const s = new THREE.Shape();
  s.moveTo(r, 0);
  perfil.forEach(([u, v]) => s.lineTo(u, v));
  s.lineTo(0, dim.H);
  s.lineTo(r, dim.H);
  s.closePath();
  grupo.add(faceNoAngulo(s, a, mats.cobCorte));
  return grupo;
}

function instanciar(geo, mat, transformacoes) {
  const im = new THREE.InstancedMesh(geo, mat, transformacoes.length);
  const o = new THREE.Object3D();
  transformacoes.forEach((t, i) => {
    o.position.copy(t.pos);
    o.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0);
    o.scale.set(...(t.esc || [1, 1, 1]));
    o.updateMatrix();
    im.setMatrixAt(i, o.matrix);
  });
  im.castShadow = true;
  im.receiveShadow = true;
  return im;
}

function criarMateriaisBolo(spec) {
  const miolo = texMiolo(spec.massa);
  const espat = texEspatula();
  return {
    massa: fisico(spec.massa, { map: miolo.map, bump: miolo.bump, relevo: 1.6, rugosidade: 0.95, duplo: true }),
    recheio: spec.recheios.map((c, i) => fisico(c, {
      map: texRecheio(c, spec.pedacos?.[i] || ""), rugosidade: spec.brilho?.[i] ? 0.34 : 0.5,
      verniz: spec.brilho?.[i] ? 0.22 : 0.05, vernizRug: 0.35, duplo: true,
      reflexo: new THREE.Color(c).getHSL({}).l < 0.3 ? 0.35 : 1,
    })),
    cobertura: fisico(spec.cobertura || "#fbf1ea", { bump: espat, relevo: 0.6, rugosidade: 0.55, sheen: 0.7, duplo: true }),
    cobCorte: fisico(spec.cobertura || "#fbf1ea", { rugosidade: 0.7, duplo: true }),
    deco: fisico(spec.decoracao || "#f2c4c3", { rugosidade: 0.5, sheen: 0.8, sheenCor: "#fff0f0" }),
    calda: spec.calda ? fisico(spec.calda, { rugosidade: 0.22, verniz: 0.8, vernizRug: 0.1, reflexo: 0.45, duplo: true }) : null,
  };
}

/* Um pedaço do bolo (corpo ou fatia) entre t0 e t0+tl */
function pedacoBolo(spec, dim, mats, t0, tl, ehCorpo) {
  const { r, H, t } = dim;
  const R = r + t, top = H + t;
  const g = new THREE.Group();
  const parcial = tl < TAU - 1e-3;

  // cobertura (torneada) — lateral e topo
  const cob = new THREE.Mesh(new THREE.LatheGeometry(v2(perfilCobertura(dim)), 128, t0, tl), mats.cobertura);
  cob.castShadow = cob.receiveShadow = true;
  g.add(cob);
  if (parcial) {
    g.add(facesDeCorte(dim, mats, t0));
    g.add(facesDeCorte(dim, mats, t0 + tl));
  }

  // calda de chocolate escorrendo
  let topoDeco = top + 0.006;
  if (mats.calda) {
    const e = 0.016;
    const perfilCalda = [[0, top + e + 0.006], [R * 0.6, top + e + 0.004], [R - 0.06, top + e]];
    for (let i = 1; i <= 8; i++) {
      const a = (i / 8) * (Math.PI / 2);
      const rr = dim.rr + e;
      perfilCalda.push([R - dim.rr + rr * Math.sin(a), top - dim.rr + rr * Math.cos(a)]);
    }
    perfilCalda.push([R + e, top - dim.rr - 0.03]);
    const capa = new THREE.Mesh(new THREE.LatheGeometry(v2(perfilCalda), 128, t0, tl), mats.calda);
    capa.castShadow = true;
    g.add(capa);
    const passo = 0.16;
    for (let a = t0 + 0.05; a < t0 + tl - 0.04; a += passo * entre(0.8, 1.25)) {
      const L = aleatorio() < 0.3 ? entre(0.04, 0.09) : entre(0.12, 0.36);
      const raio = entre(0.022, 0.032);
      const gota = new THREE.Mesh(new THREE.CapsuleGeometry(raio, L, 6, 12), mats.calda);
      const y = top - dim.rr - 0.02 - L / 2;
      gota.position.set(Math.sin(a) * (R + 0.006), y, Math.cos(a) * (R + 0.006));
      gota.rotation.y = a;
      gota.scale.set(1, 1, 0.55);
      gota.castShadow = true;
      g.add(gota);
    }
    topoDeco = top + e + 0.006;
  }

  // rosetas no topo e bico pequeno na base
  const voltas = Math.round((TAU * R) / 0.19);
  const passo = TAU / voltas;
  const topo = [], base = [];
  for (let a = t0 + passo / 2; a < t0 + tl - 0.05; a += passo) {
    if (a - t0 < 0.05) continue;
    topo.push({ pos: new THREE.Vector3(Math.sin(a) * (R - 0.085), topoDeco - 0.01, Math.cos(a) * (R - 0.085)), ry: a * 3 });
    base.push({ pos: new THREE.Vector3(Math.sin(a) * (R + 0.02), 0, Math.cos(a) * (R + 0.02)), ry: a * 5, esc: [0.62, 0.5, 0.62] });
  }
  if (topo.length) g.add(instanciar(geoRoseta(), mats.deco, topo));
  if (base.length) g.add(instanciar(geoRoseta(), mats.cobertura, base));

  // decoração do topo de acordo com o recheio
  g.add(toppers(spec.topo || {}, dim, t0, tl, topoDeco));

  if (ehCorpo) {
    const cor = new THREE.Mesh(geoCoracao(), fisico("#e3b35e", { metal: 1, rugosidade: 0.22 }));
    cor.position.set(0, topoDeco + 0.15, -r * 0.1);
    cor.rotation.set(-0.12, 0.2, 0);
    cor.castShadow = true;
    g.add(cor);
  }
  return g;
}

function toppers(spec, dim, t0, tl, y) {
  const g = new THREE.Group();
  const rT = dim.r * 0.6;
  const n = Math.max(7, Math.round((TAU * rT) / 0.23));
  const angulos = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + 0.2;
    const rel = ((a - t0) % TAU + TAU) % TAU;
    if (rel > 0.06 && rel < tl - 0.06) angulos.push(a);
  }
  const pos = (a, rr = rT) => new THREE.Vector3(Math.sin(a) * rr, y, Math.cos(a) * rr);
  const tipo = spec.tipo || "bolinha";

  if (tipo === "morango") {
    const mat = fisico("#ffffff", { map: texMorango(), rugosidade: 0.35, verniz: 0.8, vernizRug: 0.15 });
    const folha = fisico("#3f8f3a", { rugosidade: 0.6, plano: true });
    angulos.forEach((a) => {
      const m = new THREE.Group();
      const fruta = new THREE.Mesh(geoMorango(), mat);
      fruta.castShadow = true;
      m.add(fruta);
      for (let i = 0; i < 5; i++) {
        const f = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 3), folha);
        f.position.set(Math.sin(i * 1.26) * 0.018, 0.006, Math.cos(i * 1.26) * 0.018);
        f.rotation.set(Math.PI / 2 - 0.3, i * 1.26, 0);
        m.add(f);
      }
      m.position.copy(pos(a)).add(new THREE.Vector3(0, 0.035, 0));
      m.rotation.set(-1.25, a + 0.6, 0);
      g.add(m);
    });
  } else if (tipo === "abacaxi" || tipo === "goiabada") {
    const cor = tipo === "abacaxi" ? "#f4c440" : "#a92a34";
    const mat = fisico(cor, { rugosidade: 0.25, verniz: 0.7 });
    const geo = new THREE.BoxGeometry(0.06, 0.05, 0.06, 1, 1, 1);
    const ts = [];
    angulos.forEach((a) => {
      ts.push({ pos: pos(a).add(new THREE.Vector3(0, 0.025, 0)), ry: entre(0, 3), esc: [entre(0.8, 1.1), 1, entre(0.8, 1.1)] });
      ts.push({ pos: pos(a + 0.12, rT * 0.82).add(new THREE.Vector3(0, 0.022, 0)), ry: entre(0, 3), esc: [0.7, 0.8, 0.7] });
    });
    g.add(instanciar(geo, mat, ts));
  } else if (tipo === "crocante" || tipo === "coco") {
    const mat = tipo === "crocante" ? fisico("#b07a3c", { rugosidade: 0.3, verniz: 0.6, plano: true }) : fisico("#fffaf2", { rugosidade: 0.9 });
    const geo = tipo === "crocante" ? new THREE.DodecahedronGeometry(0.02) : new THREE.BoxGeometry(0.04, 0.006, 0.014);
    const ts = [];
    const qtd = Math.round(tl / TAU * 260);
    for (let i = 0; i < qtd; i++) {
      const a = t0 + 0.05 + aleatorio() * (tl - 0.1);
      const rr = Math.sqrt(aleatorio()) * (dim.r - 0.14);
      ts.push({ pos: new THREE.Vector3(Math.sin(a) * rr, y + 0.008, Math.cos(a) * rr), rx: entre(0, 3), ry: entre(0, 3), esc: [entre(0.6, 1.3), entre(0.6, 1.3), entre(0.6, 1.3)] });
    }
    if (ts.length) g.add(instanciar(geo, mat, ts));
  } else {
    // brigadeirinhos no topo
    const cor = spec.cor || "#4a2a1c";
    const escuro = new THREE.Color(cor).getHSL({}).l < 0.35;
    const tex = escuro ? texGranulado(cor) : texGraos(cor);
    const mat = fisico("#ffffff", { map: tex.map, bump: tex.bump, relevo: escuro ? 2 : 1, rugosidade: escuro ? 0.45 : 0.95, verniz: escuro ? 0.3 : 0 });
    const geo = new THREE.SphereGeometry(0.05, 24, 16);
    g.add(instanciar(geo, mat, angulos.map((a) => ({ pos: pos(a).add(new THREE.Vector3(0, 0.046, 0)), ry: a }))));
  }
  return g;
}

function prato(raio) {
  const R = raio;
  const pts = [[0, -0.022], [R * 0.66, -0.022], [R * 0.68, -0.036], [R * 0.74, -0.036], [R * 0.78, -0.012], [R, 0.016], [R + 0.05, 0.04], [R + 0.042, 0.048], [R - 0.01, 0.016], [R * 0.86, 0], [0, 0]];
  const m = new THREE.Mesh(new THREE.LatheGeometry(v2(pts), 128), fisico("#ffffff", { rugosidade: 0.18, verniz: 0.8, duplo: true }));
  m.receiveShadow = true;
  m.castShadow = true;
  return m;
}

function montarBolo(spec) {
  const dim = dimensoes(spec.kg || 1.5);
  const mats = criarMateriaisBolo(spec);
  const grupo = new THREE.Group();
  const corpo = pedacoBolo(spec, dim, mats, CUNHA / 2, TAU - CUNHA, true);
  const fatia = pedacoBolo(spec, dim, mats, -CUNHA / 2, CUNHA, false);
  grupo.add(corpo, fatia, prato(dim.r + 0.5));
  return { grupo, fatia, dim };
}

/* =========================================================
   Doces e salgados
   ========================================================= */
function criarFabricaDoces() {
  const mats = new Map();
  const mat = (chave, fn) => { if (!mats.has(chave)) mats.set(chave, fn()); return mats.get(chave); };
  const geoBola = new THREE.SphereGeometry(0.086, 32, 22);
  const geoMeia1 = new THREE.SphereGeometry(0.086, 24, 18, 0, Math.PI);
  const geoMeia2 = new THREE.SphereGeometry(0.086, 24, 18, Math.PI, Math.PI);
  const geoCox = new THREE.LatheGeometry(v2([[0, 0], [0.07, 0.006], [0.094, 0.03], [0.1, 0.06], [0.088, 0.1], [0.06, 0.145], [0.03, 0.18], [0.008, 0.2], [0, 0.202]]), 32);
  const formaPastel = new THREE.Shape();
  formaPastel.absarc(0, 0, 0.1, 0, Math.PI, false);
  formaPastel.closePath();
  const geoPastel = new THREE.ExtrudeGeometry(formaPastel, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 4, curveSegments: 32 });
  const descartaveis = [geoBola, geoMeia1, geoMeia2, geoCox, geoPastel];

  const matBrig = (cor, granulado) => mat("b" + cor + granulado, () => {
    if (granulado) { const t = texGranulado(cor); return fisico("#ffffff", { map: t.map, bump: t.bump, relevo: 2, rugosidade: 0.45, verniz: 0.3 }); }
    const t = texGraos(cor, { brilho: true });
    return fisico("#ffffff", { map: t.map, bump: t.bump, relevo: 0.8, rugosidade: 0.85, sheen: 0.5 });
  });
  const matEmpanado = (cor) => mat("e" + cor, () => { const t = texGraos(cor, { grosso: true }); return fisico("#ffffff", { map: t.map, bump: t.bump, relevo: 3, rugosidade: 0.95 }); });
  const matForminha = (cor) => mat("f" + cor, () => fisico(cor, { rugosidade: 0.75, sheen: 0.3, duplo: true }));

  function doce(spec) {
    const g = new THREE.Group();
    const forma = spec.forma || "brigadeiro";
    const sombra = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
    if (forma === "coxinha") {
      g.add(sombra(new THREE.Mesh(geoCox, matEmpanado(spec.cor))));
      return g;
    }
    if (forma === "bolinha") {
      const m = sombra(new THREE.Mesh(geoBola, matEmpanado(spec.cor)));
      m.position.y = 0.082;
      g.add(m);
      return g;
    }
    if (forma === "pastel") {
      const m = sombra(new THREE.Mesh(geoPastel, matEmpanado(spec.cor)));
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, 0.014, 0.04);
      g.add(m);
      return g;
    }
    if (forma === "cupcake") {
      const copo = sombra(new THREE.Mesh(geoForminha(), matForminha(spec.cor2 || "#e7a6b4")));
      copo.scale.set(1.05, 1.35, 1.05);
      const bolo = sombra(new THREE.Mesh(geoBola, mat("cup", () => { const t = texMiolo("#7a4a35"); return fisico("#ffffff", { map: t.map, bump: t.bump, relevo: 1, rugosidade: 0.9 }); })));
      bolo.scale.set(1.15, 0.55, 1.15);
      bolo.position.y = 0.1;
      const cob = sombra(new THREE.Mesh(geoRoseta(), mat("cupcob" + spec.cor, () => fisico(spec.cor || "#f4b6c2", { rugosidade: 0.5, sheen: 0.8 }))));
      cob.scale.set(1.15, 1.1, 1.15);
      cob.position.y = 0.12;
      g.add(copo, bolo, cob);
      return g;
    }
    if (forma === "pirulito") {
      const palito = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 8), mat("palito", () => fisico("#ffffff", { rugosidade: 0.4 })));
      palito.position.y = 0.13;
      const disco = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.026, 40), mat("piru" + spec.cor, () => fisico(spec.cor || "#4a2a1c", { rugosidade: 0.25, verniz: 0.5 }))));
      disco.rotation.x = Math.PI / 2;
      disco.position.y = 0.32;
      const rotulo = new THREE.Mesh(new THREE.CircleGeometry(0.046, 32), mat("rot" + spec.cor2, () => fisico(spec.cor2 || "#f5d7a1", { rugosidade: 0.7 })));
      rotulo.position.set(0, 0.32, 0.0135);
      const laco = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.006, 8, 16), mat("laco", () => fisico("#e58fa3", { sheen: 0.8 })));
      laco.position.y = 0.21;
      laco.rotation.x = Math.PI / 2;
      g.add(palito, disco, rotulo, laco);
      return g;
    }
    // brigadeiros na forminha
    g.add(sombra(new THREE.Mesh(geoForminha(), matForminha(spec.forminha || "#5b3a2e"))));
    if (forma === "bemcasado") {
      const a = sombra(new THREE.Mesh(geoMeia1, matBrig(spec.cor, false)));
      const b = sombra(new THREE.Mesh(geoMeia2, matBrig(spec.cor2, false)));
      [a, b].forEach((m) => { m.position.y = 0.094; m.scale.y = 0.94; g.add(m); });
    } else {
      const bola = sombra(new THREE.Mesh(geoBola, matBrig(spec.cor, !!spec.granulado)));
      bola.position.y = 0.094;
      bola.scale.y = 0.94;
      bola.rotation.y = entre(0, 3);
      g.add(bola);
      if (forma === "beijinho") {
        const cravo = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.012, 0.03, 6), mat("cravo", () => fisico("#3a2016")));
        cravo.position.y = 0.18;
        g.add(cravo);
      }
    }
    return g;
  }
  return { doce, descartaveis };
}

function sequenciaItens(spec, total) {
  const grupos = [spec.doces, spec.salgados].filter((l) => l && l.length);
  const extras = spec.extras || [];
  const seq = [];
  const cont = grupos.map(() => 0);
  for (let i = 0; seq.length < total && grupos.length; i++) {
    const gi = i % grupos.length;
    seq.push(grupos[gi][cont[gi]++ % grupos[gi].length]);
  }
  if (extras.length) {
    const passo = Math.max(2, Math.floor(total / extras.length));
    extras.forEach((e, i) => {
      const p = Math.min(total - 1, i * passo + 1);
      if (p < seq.length) seq[p] = e; else seq.push(e);
    });
  }
  return seq.slice(0, total);
}

/* =========================================================
   Visualizador
   ========================================================= */
export function criarVisualizador(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, celular ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "visual3d__canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const ambiente = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  cena.environment = ambiente;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

  const sol = new THREE.DirectionalLight(0xfff4ea, 2.2);
  sol.position.set(2.6, 5.5, 3.2);
  sol.castShadow = true;
  sol.shadow.mapSize.set(celular ? 1024 : 2048, celular ? 1024 : 2048);
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  const contraluz = new THREE.DirectionalLight(0xffd9c8, 1.1);
  contraluz.position.set(-3.5, 2.5, -4);
  cena.add(sol, contraluz, sol.target);

  const raiz = new THREE.Group();
  cena.add(raiz);

  // chão invisível que só recebe sombra + sombra de contato
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.16 }));
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  const contato = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texSombra(), transparent: true, depthWrite: false }));
  contato.rotation.x = -Math.PI / 2;
  cena.add(chao, contato);

  let conteudo = null, fatia = null, raioFatia = 1, assinatura = "";
  let descartaveisExtras = [];
  let rot = 0.5, alvoRot = 0.5;
  let elev = 0.52, alvoElev = 0.52;
  let dist = 6, alvoDist = 6;
  let focoY = 0.4, alvoY = 0.4;
  let abertura = 1, alvoAbertura = 1;
  let pop = 1;
  let pausaAuto = 0;
  let rodando = true;
  const auto = !reduzirMovimento;

  /* Interação: horizontal gira; vertical inclina (mouse) */
  const tela = renderer.domElement;
  let arraste = null;
  tela.addEventListener("pointerdown", (e) => {
    arraste = { x: e.clientX, y: e.clientY, tipo: e.pointerType };
    tela.setPointerCapture?.(e.pointerId);
    pausaAuto = performance.now() + 5000;
  });
  tela.addEventListener("pointermove", (e) => {
    if (!arraste) return;
    const dx = e.clientX - arraste.x, dy = e.clientY - arraste.y;
    arraste.x = e.clientX; arraste.y = e.clientY;
    alvoRot += dx * 0.011;
    if (arraste.tipo === "mouse") alvoElev = Math.min(1.1, Math.max(0.2, alvoElev + dy * 0.005));
    pausaAuto = performance.now() + 5000;
  });
  const soltar = () => { arraste = null; };
  tela.addEventListener("pointerup", soltar);
  tela.addEventListener("pointercancel", soltar);

  const ro = new ResizeObserver(redimensionar);
  ro.observe(container);
  function redimensionar() {
    const w = container.clientWidth || 300, h = container.clientHeight || 260;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  redimensionar();

  function descartar(obj) {
    const mats = new Set();
    obj.traverse((o) => {
      if (o.geometry && !o.geometry.userData.compartilhada) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
    });
    mats.forEach((m) => m.dispose()); // texturas são compartilhadas e ficam em cache
    descartaveisExtras.forEach((g) => g.dispose());
    descartaveisExtras = [];
  }

  function atualizar(spec) {
    semente = 7;
    const nova = new THREE.Group();
    let raioCena = 1, base = -0.036, topoCena = 0.2;
    fatia = null;

    const fab = criarFabricaDoces();
    const temItens = (spec.doces?.length || 0) + (spec.salgados?.length || 0) + (spec.extras?.length || 0) > 0;

    if (spec.bolo) {
      const { grupo, fatia: f, dim } = montarBolo(spec.bolo);
      nova.add(grupo);
      fatia = f;
      raioFatia = dim.r;
      topoCena = dim.H + 0.25;
      raioCena = dim.r + 0.55;

      if (temItens) {
        const anel = dim.r + 0.82;
        const n = Math.max(12, Math.floor((TAU * anel) / 0.26));
        sequenciaItens(spec, n).forEach((it, i) => {
          const a = (i / n) * TAU + 0.13;
          const d = fab.doce(it);
          d.position.set(Math.sin(a) * anel, 0, Math.cos(a) * anel);
          d.rotation.y = a;
          nova.add(d);
        });
        // tábua com borda dourada
        const Rt = anel + 0.22;
        const tabua = new THREE.Mesh(new THREE.LatheGeometry(v2([[0, -0.07], [Rt - 0.03, -0.07], [Rt, -0.055], [Rt, -0.04], [Rt - 0.02, -0.036], [0, -0.036]]), 128), fisico("#f6e8e2", { rugosidade: 0.35, verniz: 0.4 }));
        tabua.receiveShadow = true;
        const borda = new THREE.Mesh(new THREE.TorusGeometry(Rt, 0.012, 10, 128), fisico("#d9ab5f", { metal: 1, rugosidade: 0.3 }));
        borda.rotation.x = Math.PI / 2;
        borda.position.y = -0.047;
        nova.add(tabua, borda);
        // doces apoiados na tábua (o prato já encosta nela)
        nova.children.filter((c) => c !== grupo && c !== tabua && c !== borda).forEach((c) => { c.position.y = -0.036; });
        base = -0.07;
        raioCena = Rt + 0.05;
      }
    } else {
      // bandeja (kits sem bolo)
      const cols = 6, linhas = 4, esp = 0.25;
      const w = cols * esp + 0.16, p = linhas * esp + 0.16;
      const forma = new THREE.Shape();
      const rr = 0.06;
      forma.moveTo(-w / 2 + rr, -p / 2);
      forma.lineTo(w / 2 - rr, -p / 2); forma.quadraticCurveTo(w / 2, -p / 2, w / 2, -p / 2 + rr);
      forma.lineTo(w / 2, p / 2 - rr); forma.quadraticCurveTo(w / 2, p / 2, w / 2 - rr, p / 2);
      forma.lineTo(-w / 2 + rr, p / 2); forma.quadraticCurveTo(-w / 2, p / 2, -w / 2, p / 2 - rr);
      forma.lineTo(-w / 2, -p / 2 + rr); forma.quadraticCurveTo(-w / 2, -p / 2, -w / 2 + rr, -p / 2);
      const bandeja = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3 }), fisico("#ffffff", { rugosidade: 0.2, verniz: 0.7 }));
      bandeja.rotation.x = -Math.PI / 2;
      bandeja.position.y = -0.042;
      bandeja.receiveShadow = true;
      nova.add(bandeja);
      if (temItens) {
        sequenciaItens(spec, cols * linhas).forEach((it, i) => {
          const d = fab.doce(it);
          d.position.set((i % cols - (cols - 1) / 2) * esp, 0, (Math.floor(i / cols) - (linhas - 1) / 2) * esp);
          d.rotation.y = entre(-0.3, 0.3);
          nova.add(d);
        });
      }
      raioCena = Math.hypot(w, p) / 2;
      base = -0.055;
      topoCena = 0.2;
    }

    if (conteudo) { raiz.remove(conteudo); descartar(conteudo); }
    conteudo = nova;
    descartaveisExtras = fab.descartaveis;
    raiz.add(conteudo);

    const nova_ass = spec.bolo ? `${spec.bolo.kg}|${spec.bolo.massa}|${spec.bolo.recheios}` : "bandeja";
    if (nova_ass !== assinatura) pop = 0.95;
    assinatura = nova_ass;

    chao.position.y = base - 0.001;
    contato.position.y = base;
    contato.scale.setScalar(raioCena * 2.7);
    const sc = sol.shadow.camera;
    const ext = raioCena + 0.6;
    sc.left = sc.bottom = -ext; sc.right = sc.top = ext;
    sc.near = 0.5; sc.far = 14;
    sc.updateProjectionMatrix();

    alvoDist = spec.bolo ? (temItens ? raioCena * 2.7 + 1.3 : raioCena * 2.9 + 1.5) : raioCena * 2.4 + 1.0;
    alvoY = spec.bolo ? topoCena * 0.36 : 0.06;
  }

  function alternarFatia() {
    alvoAbertura = alvoAbertura > 0.5 ? 0 : 1;
    pausaAuto = performance.now() + 2500;
    return alvoAbertura > 0.5;
  }

  const relogio = new THREE.Clock();
  function quadro() {
    if (!rodando) return;
    requestAnimationFrame(quadro);
    if (document.hidden) return;
    const dt = Math.min(relogio.getDelta(), 0.05);
    const k = 1 - Math.pow(0.002, dt);
    if (auto && !arraste && performance.now() > pausaAuto) alvoRot += dt * 0.28;
    rot += (alvoRot - rot) * k;
    elev += (alvoElev - elev) * k;
    dist += (alvoDist - dist) * k;
    focoY += (alvoY - focoY) * k;
    abertura += (alvoAbertura - abertura) * k;
    pop += (1 - pop) * k;

    raiz.rotation.y = rot;
    if (conteudo) conteudo.scale.setScalar(pop);
    if (fatia) {
      // a fatia desliza para fora e gira, mostrando o corte de frente
      fatia.position.set(-abertura * raioFatia * 0.08, abertura * 0.012, abertura * raioFatia * 0.7);
      fatia.rotation.y = abertura * 0.8;
    }
    camera.position.set(0, focoY + Math.sin(elev) * dist, Math.cos(elev) * dist);
    camera.lookAt(0, focoY, 0);
    renderer.render(cena, camera);
  }
  quadro();

  return {
    atualizar,
    alternarFatia,
    destruir() {
      rodando = false;
      ro.disconnect();
      if (conteudo) descartar(conteudo);
      chao.geometry.dispose(); chao.material.dispose();
      contato.geometry.dispose(); contato.material.dispose();
      ambiente.dispose();
      renderer.dispose();
      tela.remove();
    },
  };
}
