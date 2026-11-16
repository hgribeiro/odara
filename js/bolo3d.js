/* =========================================================
   Odara — visualizador 3D de bolos e kits (three.js)
   Mostra o bolo com uma fatia cortada para ver as camadas
   (massa e recheios) e os doces/salgados escolhidos ao redor.
   ========================================================= */
import * as THREE from "./vendor/three.module.min.js";

const TAU = Math.PI * 2;
const CUNHA = Math.PI / 3.4; // ângulo da fatia
// Aleatório com semente: as decorações não "pulam" a cada atualização
let semente = 1;
const aleatorio = () => ((semente = (semente * 16807) % 2147483647) - 1) / 2147483646;
const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Texturas procedurais (compartilhadas) ---------- */
let _ruido;
function texturaRuido() {
  if (_ruido) return _ruido;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + Math.random() * 135;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  _ruido = new THREE.CanvasTexture(c);
  _ruido.wrapS = _ruido.wrapT = THREE.RepeatWrapping;
  _ruido.repeat.set(4, 4);
  return _ruido;
}
let _sombra;
function texturaSombra() {
  if (_sombra) return _sombra;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, "rgba(60,30,25,0.45)");
  grad.addColorStop(0.55, "rgba(60,30,25,0.18)");
  grad.addColorStop(1, "rgba(60,30,25,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  _sombra = new THREE.CanvasTexture(c);
  return _sombra;
}

/* ---------- Materiais ---------- */
function material(cor, { rugosidade = 0.75, metal = 0, relevo = 0, plano = false, duplo = true } = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cor),
    roughness: rugosidade,
    metalness: metal,
    flatShading: plano,
    side: duplo ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (relevo) { m.bumpMap = texturaRuido(); m.bumpScale = relevo; }
  return m;
}

/* ---------- Geometrias básicas ---------- */
// Face plana do corte (do raio interno ao externo, num ângulo)
function faceCorte(rIn, rOut, y0, y1, ang, mat) {
  const s = Math.sin(ang), c = Math.cos(ang);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([
    rIn * s, y0, rIn * c, rOut * s, y0, rOut * c, rOut * s, y1, rOut * c, rIn * s, y1, rIn * c,
  ], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
// Cilindro parcial fechado (com faces do corte)
function segmento(r, y0, h, t0, tl, mat) {
  const grupo = new THREE.Group();
  const cil = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 72, 1, false, t0, tl), mat);
  cil.position.y = y0 + h / 2;
  grupo.add(cil);
  if (tl < TAU - 1e-3) {
    grupo.add(faceCorte(0, r, y0, y0 + h, t0, mat));
    grupo.add(faceCorte(0, r, y0, y0 + h, t0 + tl, mat));
  }
  return grupo;
}
function torneado(pontos, segs = 16) {
  return new THREE.LatheGeometry(pontos.map(([x, y]) => new THREE.Vector2(x, y)), segs);
}
// Bico de confeitar "pitanga"
const PERFIL_ROSETA = [[0, 0], [0.075, 0], [0.08, 0.025], [0.066, 0.055], [0.045, 0.085], [0.02, 0.115], [0, 0.13]];
function geoCoracao(tam = 0.16) {
  const s = new THREE.Shape();
  const k = tam;
  s.moveTo(0, -k * 0.9);
  s.bezierCurveTo(k * 0.15, -k * 0.6, k, -k * 0.25, k, k * 0.25);
  s.bezierCurveTo(k, k * 0.75, k * 0.4, k * 0.95, 0, k * 0.5);
  s.bezierCurveTo(-k * 0.4, k * 0.95, -k, k * 0.75, -k, k * 0.25);
  s.bezierCurveTo(-k, -k * 0.25, -k * 0.15, -k * 0.6, 0, -k * 0.9);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 });
  g.center();
  return g;
}

/* ---------- Bolo ---------- */
function dimensoesBolo(kg) {
  const r = 0.72 + 0.17 * Math.min(kg, 4);
  const escalaH = 0.92 + 0.06 * Math.min(kg, 4);
  const camadas = [
    { tipo: "massa", h: 0.25 * escalaH },
    { tipo: "recheio", idx: 0, h: 0.14 * escalaH },
    { tipo: "massa", h: 0.25 * escalaH },
    { tipo: "recheio", idx: 1, h: 0.14 * escalaH },
    { tipo: "massa", h: 0.25 * escalaH },
  ];
  const H = camadas.reduce((s, c) => s + c.h, 0);
  return { r, camadas, H, t: 0.045 };
}

function topper(spec, escala = 1) {
  const g = new THREE.Group();
  const tipo = spec.tipo || "bolinha";
  if (tipo === "morango") {
    const fruta = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), material("#d42f3c", { rugosidade: 0.35 }));
    fruta.scale.set(1, 1.25, 1);
    fruta.position.y = 0.06;
    const folha = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.03, 6), material("#3f8f3a", { plano: true }));
    folha.position.y = 0.13;
    folha.rotation.x = Math.PI;
    g.add(fruta, folha);
  } else if (tipo === "abacaxi" || tipo === "goiabada") {
    const cor = tipo === "abacaxi" ? "#f2c84b" : "#b42f37";
    const cubo = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.07), material(cor, { rugosidade: 0.3 }));
    cubo.position.y = 0.03;
    cubo.rotation.y = aleatorio();
    g.add(cubo);
  } else if (tipo === "crocante" || tipo === "coco") {
    const cor = tipo === "crocante" ? "#9c6534" : "#fffaf2";
    const m = material(cor, { plano: true, rugosidade: 0.9 });
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(tipo === "coco" ? new THREE.BoxGeometry(0.035, 0.008, 0.02) : new THREE.DodecahedronGeometry(0.022), m);
      p.position.set((aleatorio() - 0.5) * 0.09, 0.012, (aleatorio() - 0.5) * 0.09);
      p.rotation.set(aleatorio() * 3, aleatorio() * 3, 0);
      g.add(p);
    }
  } else {
    const bola = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), material(spec.cor || "#4a2a1c", { relevo: 0.5, rugosidade: 0.85 }));
    bola.position.y = 0.05;
    g.add(bola);
  }
  g.scale.setScalar(escala);
  return g;
}

/* Monta um pedaço do bolo (corpo ou fatia) entre os ângulos t0 e t0+tl */
function pedacoBolo(spec, dim, t0, tl, ehCorpo) {
  const { r, camadas, H, t } = dim;
  const g = new THREE.Group();
  const matMassa = material(spec.massa, { relevo: 0.35, rugosidade: 0.9 });
  const matRecheio = spec.recheios.map((c) => material(c, { rugosidade: 0.55 }));
  const matCob = material(spec.cobertura || "#fff8f5", { rugosidade: 0.5 });
  const matDeco = material(spec.decoracao || "#f1c9c6", { rugosidade: 0.45 });

  // Camadas
  let y = 0;
  camadas.forEach((c) => {
    g.add(segmento(r, y, c.h, t0, tl, c.tipo === "massa" ? matMassa : matRecheio[c.idx]));
    y += c.h;
  });
  // Cobertura lateral (casca) e do topo
  const lado = new THREE.Mesh(new THREE.CylinderGeometry(r + t, r + t, H, 72, 1, true, t0, tl), matCob);
  lado.position.y = H / 2;
  g.add(lado);
  g.add(segmento(r + t, H, t, t0, tl, matCob));
  if (tl < TAU - 1e-3) {
    g.add(faceCorte(r, r + t, 0, H, t0, matCob));
    g.add(faceCorte(r, r + t, 0, H, t0 + tl, matCob));
  }

  // Rosetas no topo e bolinhas na base
  const geoRos = torneado(PERFIL_ROSETA, 9);
  const geoBase = new THREE.SphereGeometry(0.045, 12, 10);
  const passo = TAU / Math.round(TAU * (r + t) / 0.2);
  const margem = 0.06;
  for (let a = t0 + passo / 2; a < t0 + tl - margem; a += passo) {
    if (a - t0 < margem) continue;
    const ros = new THREE.Mesh(geoRos, matDeco);
    ros.position.set(Math.sin(a) * (r - 0.04), H + t, Math.cos(a) * (r - 0.04));
    ros.rotation.y = a;
    g.add(ros);
    const b = new THREE.Mesh(geoBase, matCob);
    b.position.set(Math.sin(a) * (r + t), 0.035, Math.cos(a) * (r + t));
    g.add(b);
  }
  // Toppers (frutas, bolinhas, crocante…) num anel interno
  const rT = r * 0.62;
  const passoT = TAU / Math.max(6, Math.round(TAU * rT / 0.24));
  for (let a = t0 + passoT / 2; a < t0 + tl - 0.05; a += passoT) {
    if (a - t0 < 0.05) continue;
    const tp = topper(spec.topo || {});
    tp.position.set(Math.sin(a) * rT, H + t, Math.cos(a) * rT);
    g.add(tp);
  }
  if (ehCorpo) {
    const cor = new THREE.Mesh(geoCoracao(0.15), material("#d6a85c", { metal: 0.25, rugosidade: 0.35 }));
    cor.position.set(0, H + t + 0.17, -r * 0.12);
    cor.rotation.y = 0.15;
    g.add(cor);
  }
  return g;
}

function montarBolo(spec) {
  const dim = dimensoesBolo(spec.kg || 1.5);
  const grupo = new THREE.Group();
  const corpo = pedacoBolo(spec, dim, CUNHA / 2, TAU - CUNHA, true);
  const fatia = pedacoBolo(spec, dim, -CUNHA / 2, CUNHA, false);
  grupo.add(corpo, fatia);
  // Prato
  const prato = new THREE.Mesh(new THREE.CylinderGeometry(dim.r + 0.42, dim.r + 0.36, 0.05, 72), material("#ffffff", { rugosidade: 0.25 }));
  prato.position.y = -0.025;
  grupo.add(prato);
  return { grupo, fatia, dim };
}

/* ---------- Doces e salgados ---------- */
function forminha(cor = "#5b3a2e") {
  const g = new THREE.Group();
  const m = material(cor, { plano: true, rugosidade: 0.8 });
  const copo = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.08, 0.075, 16, 1, true), m);
  copo.position.y = 0.0375;
  const fundo = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), m);
  fundo.rotation.x = -Math.PI / 2;
  fundo.position.y = 0.002;
  g.add(copo, fundo);
  return g;
}
function docinho(spec) {
  const g = new THREE.Group();
  const forma = spec.forma || "brigadeiro";
  if (forma === "coxinha") {
    const m = new THREE.Mesh(torneado([[0, 0], [0.085, 0.015], [0.1, 0.055], [0.078, 0.115], [0.035, 0.175], [0, 0.195]], 18), material(spec.cor, { relevo: 0.9, rugosidade: 1 }));
    g.add(m);
    return g;
  }
  if (forma === "bolinha") {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.085, 18, 14), material(spec.cor, { relevo: 0.9, rugosidade: 1 }));
    m.position.y = 0.08;
    g.add(m);
    return g;
  }
  if (forma === "pastel") {
    const p = segmento(0.115, 0, 0.045, 0, Math.PI, material(spec.cor, { relevo: 0.5, rugosidade: 0.85 }));
    p.position.z = -0.04;
    g.add(p);
    return g;
  }
  if (forma === "cupcake") {
    const copo = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.1, 16, 1, false), material(spec.cor2 || "#e9a9b5", { plano: true }));
    copo.position.y = 0.05;
    const bolo = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10, 0, TAU, 0, Math.PI / 2), material("#7a4a35", { relevo: 0.4 }));
    bolo.position.y = 0.1;
    const cob = new THREE.Mesh(torneado(PERFIL_ROSETA, 9), material(spec.cor || "#f4b6c2", { rugosidade: 0.45 }));
    cob.scale.setScalar(1.25);
    cob.position.y = 0.13;
    g.add(copo, bolo, cob);
    return g;
  }
  if (forma === "pirulito") {
    const palito = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.24, 8), material("#ffffff"));
    palito.position.y = 0.12;
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.028, 28), material(spec.cor || "#4a2a1c", { rugosidade: 0.4 }));
    disco.rotation.x = Math.PI / 2;
    disco.position.y = 0.3;
    const rotulo = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), material(spec.cor2 || "#f5d7a1", { rugosidade: 0.6 }));
    rotulo.position.set(0, 0.3, 0.0145);
    const laco = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.007, 6, 12), material("#e58fa3"));
    laco.position.y = 0.2;
    laco.rotation.x = Math.PI / 2;
    g.add(palito, disco, rotulo, laco);
    return g;
  }
  // Brigadeiros (com forminha)
  g.add(forminha(spec.forminha));
  const rr = 0.088;
  if (forma === "bemcasado") {
    const a = new THREE.Mesh(new THREE.SphereGeometry(rr, 20, 14, 0, Math.PI), material(spec.cor, { relevo: 0.3 }));
    const b = new THREE.Mesh(new THREE.SphereGeometry(rr, 20, 14, Math.PI, Math.PI), material(spec.cor2, { relevo: 0.3 }));
    [a, b].forEach((m) => { m.position.y = 0.1; m.scale.y = 0.92; g.add(m); });
  } else {
    const bola = new THREE.Mesh(new THREE.SphereGeometry(rr, 22, 16), material(spec.cor, { relevo: spec.granulado ? 1.2 : 0.35, rugosidade: spec.granulado ? 0.95 : 0.7 }));
    bola.position.y = 0.1;
    bola.scale.y = 0.92;
    g.add(bola);
    if (forma === "beijinho") {
      const cravo = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.03, 6), material("#3a2016"));
      cravo.position.y = 0.19;
      g.add(cravo);
    }
  }
  return g;
}

function sequenciaItens(spec, total) {
  const grupos = [spec.doces, spec.salgados].filter((l) => l && l.length);
  const extras = spec.extras || [];
  const seq = [];
  const cont = grupos.map(() => 0);
  for (let i = 0; seq.length < total && grupos.length; i++) {
    const gi = i % grupos.length;
    const lista = grupos[gi];
    seq.push(lista[cont[gi]++ % lista.length]);
  }
  // espalha extras (cupcakes, pirulitos) de forma uniforme
  if (extras.length) {
    const passo = Math.max(2, Math.floor(total / extras.length));
    extras.forEach((e, i) => {
      const pos = Math.min(total - 1, i * passo + 1);
      if (pos < seq.length) seq[pos] = e; else seq.push(e);
    });
  }
  return seq.slice(0, total);
}

/* =========================================================
   Visualizador
   ========================================================= */
export function criarVisualizador(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.className = "visual3d__canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  cena.add(new THREE.HemisphereLight(0xfff8f4, 0xb88a80, 1.35));
  const sol = new THREE.DirectionalLight(0xffffff, 1.8);
  sol.position.set(3, 6, 4);
  const preenchimento = new THREE.DirectionalLight(0xffe0d4, 0.6);
  preenchimento.position.set(-4, 2, -3);
  cena.add(sol, preenchimento);

  const raiz = new THREE.Group();
  cena.add(raiz);
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = -0.055;
  cena.add(sombra);

  let conteudo = null;
  let fatia = null;
  let raioFatia = 1;
  let assinaturaBolo = "";
  let rot = -0.35, alvoRot = -0.35;
  let elev = 0.5, alvoElev = 0.5;
  let dist = 6, alvoDist = 6;
  let alvoY = 0.4, focoY = 0.4;
  let abertura = 1, alvoAbertura = 1;
  let pop = 1;
  let auto = !reduzirMovimento;
  let pausaAuto = 0;
  let rodando = true;

  /* Interação: arrastar na horizontal gira; vertical inclina (desktop) */
  const canvas = renderer.domElement;
  let arrastando = null;
  canvas.addEventListener("pointerdown", (e) => {
    arrastando = { x: e.clientX, y: e.clientY, tipo: e.pointerType };
    canvas.setPointerCapture?.(e.pointerId);
    pausaAuto = performance.now() + 4000;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!arrastando) return;
    const dx = e.clientX - arrastando.x, dy = e.clientY - arrastando.y;
    arrastando.x = e.clientX; arrastando.y = e.clientY;
    alvoRot += dx * 0.012;
    if (arrastando.tipo === "mouse") alvoElev = Math.min(1.05, Math.max(0.18, alvoElev + dy * 0.006));
    pausaAuto = performance.now() + 4000;
  });
  const soltar = () => { arrastando = null; };
  canvas.addEventListener("pointerup", soltar);
  canvas.addEventListener("pointercancel", soltar);

  const ro = new ResizeObserver(() => redimensionar());
  ro.observe(container);
  function redimensionar() {
    const w = container.clientWidth || 300, h = container.clientHeight || 260;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  redimensionar();

  function descartar(obj) {
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
  }

  function atualizar(spec) {
    semente = 7;
    const nova = new THREE.Group();
    let raioCena = 0.8;
    fatia = null;
    let topoBolo = 0;

    let raioAnel = 0;
    if (spec.bolo) {
      const { grupo, fatia: f, dim } = montarBolo(spec.bolo);
      nova.add(grupo);
      fatia = f;
      raioFatia = dim.r;
      topoBolo = dim.H;
      raioCena = dim.r + 0.45;
      raioAnel = dim.r + 0.62;
    }

    const temItens = (spec.doces?.length || 0) + (spec.salgados?.length || 0) + (spec.extras?.length || 0) > 0;
    if (spec.bolo && temItens) {
      // anel de doces ao redor do bolo, numa tábua
      const n = Math.max(10, Math.floor((TAU * raioAnel) / 0.27));
      const seq = sequenciaItens(spec, n);
      seq.forEach((it, i) => {
        const a = (i / n) * TAU + 0.12;
        const d = docinho(it);
        d.position.set(Math.sin(a) * raioAnel, 0, Math.cos(a) * raioAnel);
        d.rotation.y = a;
        nova.add(d);
      });
      const tabua = new THREE.Mesh(new THREE.CylinderGeometry(raioAnel + 0.2, raioAnel + 0.2, 0.06, 80), material("#f4e3dc", { rugosidade: 0.6 }));
      tabua.position.y = -0.085;
      const borda = new THREE.Mesh(new THREE.TorusGeometry(raioAnel + 0.2, 0.025, 8, 80), material("#c9a063", { metal: 0.5, rugosidade: 0.35 }));
      borda.rotation.x = Math.PI / 2;
      borda.position.y = -0.06;
      nova.add(tabua, borda);
      raioCena = raioAnel + 0.25;
    } else if (!spec.bolo) {
      // bandeja com doces enfileirados (kits sem bolo)
      const cols = 6, linhas = 4, esp = 0.26;
      const seq = temItens ? sequenciaItens(spec, cols * linhas) : [];
      const w = cols * esp + 0.18, p = linhas * esp + 0.18;
      const bandeja = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, p), material("#ffffff", { rugosidade: 0.3 }));
      bandeja.position.y = -0.03;
      nova.add(bandeja);
      const matBorda = material("#efd9d2");
      [[w, 0.07, 0.03, 0, p / 2], [w, 0.07, 0.03, 0, -p / 2], [0.03, 0.07, p, w / 2, 0], [0.03, 0.07, p, -w / 2, 0]].forEach(([a, b, c, x, z]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), matBorda);
        m.position.set(x, 0.01, z);
        nova.add(m);
      });
      seq.forEach((it, i) => {
        const d = docinho(it);
        d.position.set((i % cols - (cols - 1) / 2) * esp, 0, (Math.floor(i / cols) - (linhas - 1) / 2) * esp);
        nova.add(d);
      });
      raioCena = Math.hypot(w, p) / 2;
      topoBolo = 0.15;
    }

    // troca o conteúdo
    if (conteudo) { raiz.remove(conteudo); descartar(conteudo); }
    conteudo = nova;
    raiz.add(conteudo);

    const assinatura = spec.bolo ? `${spec.bolo.kg}|${spec.bolo.massa}|${spec.bolo.recheios}` : "";
    if (assinatura !== assinaturaBolo) pop = 0.94;
    assinaturaBolo = assinatura;

    sombra.scale.setScalar(raioCena * 2.6);
    alvoDist = spec.bolo ? raioCena * 3.1 + 1.4 : raioCena * 2.3 + 0.9;
    alvoY = topoBolo * 0.42;
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
    const k = 1 - Math.pow(0.0015, dt); // suavização independente de FPS
    if (auto && !arrastando && performance.now() > pausaAuto) alvoRot += dt * 0.35;
    rot += (alvoRot - rot) * k;
    elev += (alvoElev - elev) * k;
    dist += (alvoDist - dist) * k;
    focoY += (alvoY - focoY) * k;
    abertura += (alvoAbertura - abertura) * k;
    pop += (1 - pop) * k;

    raiz.rotation.y = rot;
    if (conteudo) conteudo.scale.setScalar(pop);
    if (fatia) {
      // a fatia sai do bolo e gira para mostrar o corte de frente
      fatia.position.z = abertura * raioFatia * 0.55;
      fatia.position.x = abertura * raioFatia * 0.12;
      fatia.position.y = abertura * 0.02;
      fatia.rotation.y = abertura * 0.75;
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
      sombra.geometry.dispose();
      sombra.material.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
