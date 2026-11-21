// GPverse — Ombra & Corona — mappa e pathfinding (grafica dipinta dalla V.0.3.0)
import * as THREE from '../lib/three.module.js';
import { MAP_SIZE, NODES } from './config.js';
import { tex, makeSprite } from './assets.js';

// --- PRNG con seed (mulberry32) -------------------------------------------
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Griglia --------------------------------------------------------------
export class Grid {
  constructor(size) {
    this.size = size;
    this.blocked = new Uint8Array(size * size); // 0 libero, 1 occupato
    this.owner = new Array(size * size).fill(null); // entità/nodo che occupa la cella
  }
  inside(x, z) { return x >= 0 && z >= 0 && x < this.size && z < this.size; }
  idx(x, z) { return z * this.size + x; }
  isFree(x, z) { return this.inside(x, z) && !this.blocked[this.idx(x, z)]; }
  occupy(x0, z0, w, h, who) {
    for (let z = z0; z < z0 + h; z++) for (let x = x0; x < x0 + w; x++) {
      if (!this.inside(x, z)) continue;
      const i = this.idx(x, z); this.blocked[i] = 1; this.owner[i] = who;
    }
  }
  release(x0, z0, w, h) {
    for (let z = z0; z < z0 + h; z++) for (let x = x0; x < x0 + w; x++) {
      if (!this.inside(x, z)) continue;
      const i = this.idx(x, z); this.blocked[i] = 0; this.owner[i] = null;
    }
  }
  areaFree(x0, z0, w, h) {
    for (let z = z0; z < z0 + h; z++) for (let x = x0; x < x0 + w; x++) if (!this.isFree(x, z)) return false;
    return true;
  }
  // cella libera più vicina a (x,z)
  nearestFree(x, z) {
    x = Math.max(0, Math.min(this.size - 1, Math.floor(x)));
    z = Math.max(0, Math.min(this.size - 1, Math.floor(z)));
    if (this.isFree(x, z)) return { x, z };
    for (let r = 1; r < 12; r++) {
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
        if (this.isFree(x + dx, z + dz)) return { x: x + dx, z: z + dz };
      }
    }
    return null;
  }
}

// --- A* (8 direzioni) -----------------------------------------------------
// goal: {x,z} cella libera, oppure rect {x0,z0,x1,z1} (inclusivo) da raggiungere ai bordi
export function findPath(grid, sx, sz, goal, maxIter = 6000) {
  const N = grid.size;
  sx = Math.floor(sx); sz = Math.floor(sz);
  let isGoal, hx, hz;
  if (goal.x0 !== undefined) {
    const g = { x0: goal.x0 - 1, z0: goal.z0 - 1, x1: goal.x1 + 1, z1: goal.z1 + 1 };
    isGoal = (x, z) => x >= g.x0 && x <= g.x1 && z >= g.z0 && z <= g.z1;
    hx = (goal.x0 + goal.x1) / 2; hz = (goal.z0 + goal.z1) / 2;
  } else {
    isGoal = (x, z) => x === goal.x && z === goal.z;
    hx = goal.x; hz = goal.z;
  }
  if (!grid.inside(sx, sz)) return null;
  // già arrivato: vai al centro della cella (così si è a contatto col bersaglio)
  if (isGoal(sx, sz)) return [{ x: sx + 0.5, z: sz + 0.5 }];

  const gScore = new Float32Array(N * N).fill(Infinity);
  const came = new Int32Array(N * N).fill(-1);
  const closed = new Uint8Array(N * N);
  const heap = []; // [f, idx]
  const push = (f, i) => {
    heap.push([f, i]); let c = heap.length - 1;
    while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; }
  };
  const pop = () => {
    const top = heap[0]; const last = heap.pop();
    if (heap.length) {
      heap[0] = last; let c = 0;
      for (;;) {
        const l = c * 2 + 1, r = l + 1; let m = c;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m;
      }
    }
    return top;
  };
  const h = (x, z) => { const dx = Math.abs(x - hx), dz = Math.abs(z - hz); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };

  const s = sz * N + sx;
  gScore[s] = 0; push(h(sx, sz), s);
  let best = s, bestH = h(sx, sz), iter = 0, found = -1;
  const dirs = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];

  while (heap.length && iter++ < maxIter) {
    const [, cur] = pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % N, cz = (cur / N) | 0;
    if (isGoal(cx, cz) && (cur === s || grid.isFree(cx, cz))) { found = cur; break; }
    const ch = h(cx, cz); if (ch < bestH) { bestH = ch; best = cur; }
    for (const [dx, dz, cost] of dirs) {
      const nx = cx + dx, nz = cz + dz;
      if (!grid.isFree(nx, nz)) continue;
      if (dx && dz && (!grid.isFree(cx + dx, cz) || !grid.isFree(cx, cz + dz))) continue; // niente tagli d'angolo
      const ni = nz * N + nx;
      if (closed[ni]) continue;
      const ng = gScore[cur] + cost;
      if (ng < gScore[ni]) { gScore[ni] = ng; came[ni] = cur; push(ng + h(nx, nz), ni); }
    }
  }
  let end = found >= 0 ? found : best;
  const path = [];
  while (end !== s && end >= 0) { path.push({ x: (end % N) + 0.5, z: ((end / N) | 0) + 0.5 }); end = came[end]; }
  path.reverse();
  return path;
}

// --- Costruzione della mappa ----------------------------------------------
export const BASES = { men: { x: 9, z: 52 }, shadow: { x: 52, z: 9 } };

const PX = 32; // pixel per cella nella texture del terreno

// maschera morbida: f(x,z) tra 0 e 1, calcolata per cella e poi sfumata
function maskCanvas(f) {
  const c = document.createElement('canvas'); c.width = c.height = MAP_SIZE;
  const g = c.getContext('2d'); const img = g.createImageData(MAP_SIZE, MAP_SIZE);
  for (let z = 0; z < MAP_SIZE; z++) for (let x = 0; x < MAP_SIZE; x++) {
    const i = (z * MAP_SIZE + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
    img.data[i + 3] = Math.round(Math.max(0, Math.min(1, f(x + 0.5, z + 0.5))) * 255);
  }
  g.putImageData(img, 0, 0);
  return c;
}
function layer(size, image, tile, mask) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = g.createPattern(tileCanvas(image, tile), 'repeat');
  g.fillRect(0, 0, size, size);
  // seconda passata a scala diversa e semitrasparente: nasconde la ripetizione regolare
  g.save();
  g.globalAlpha = 0.45;
  g.translate(tile * 0.37, tile * 0.61);
  g.fillStyle = g.createPattern(tileCanvas(image, Math.round(tile * 1.37)), 'repeat');
  g.fillRect(-tile, -tile, size + tile * 2, size + tile * 2);
  g.restore();
  if (mask) {
    g.globalCompositeOperation = 'destination-in';
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(mask, 0, 0, size, size);
  }
  return c;
}
function tileCanvas(image, tile) {
  const c = document.createElement('canvas'); c.width = c.height = tile;
  c.getContext('2d').drawImage(image, 0, 0, tile, tile);
  return c;
}

// terreno dipinto: prato, cenere verso l'Ombra, terra battuta intorno alle basi
function paintGround(rng) {
  const size = MAP_SIZE * PX;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const noise = Array.from({ length: 12 }, () => ({ x: rng() * MAP_SIZE, z: rng() * MAP_SIZE, r: 3 + rng() * 6 }));
  g.drawImage(layer(size, tex.ground_grass.image, 8 * PX), 0, 0);
  const ash = (x, z) => {
    const d = Math.hypot(x - BASES.shadow.x - 1.5, z - BASES.shadow.z - 1.5);
    return ((x - z) / MAP_SIZE) * 1.6 + 0.05 + (d < 18 ? (18 - d) / 10 : 0) + Math.sin(x * 0.4) * Math.cos(z * 0.3) * 0.15;
  };
  g.drawImage(layer(size, tex.ground_ash.image, 8 * PX, maskCanvas(ash)), 0, 0);
  const dirt = (x, z) => {
    let v = 0;
    for (const b of Object.values(BASES)) { const d = Math.hypot(x - b.x - 1.5, z - b.z - 1.5); v = Math.max(v, (5.5 - d) / 2.5); }
    for (const n of noise) { const d = Math.hypot(x - n.x, z - n.z); v = Math.max(v, (n.r * 0.35 - d) / n.r * 0.8); }
    return v;
  };
  g.drawImage(layer(size, tex.ground_dirt.image, 6 * PX, maskCanvas(dirt)), 0, 0);
  // leggera variazione di luce per non far vedere la ripetizione
  for (let i = 0; i < 40; i++) {
    const x = rng() * size, y = rng() * size, r = (2 + rng() * 6) * PX;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const dark = rng() < 0.5;
    grd.addColorStop(0, dark ? 'rgba(0,20,0,0.12)' : 'rgba(255,240,200,0.08)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // bordo della mappa sfumato
  g.strokeStyle = 'rgba(20,25,10,0.5)'; g.lineWidth = PX; g.strokeRect(0, 0, size, size);
  return c;
}

export function buildWorld(scene, seed) {
  const rng = makeRng(seed);
  const grid = new Grid(MAP_SIZE);
  const nodes = [];

  const groundTex = new THREE.CanvasTexture(paintGround(rng));
  groundTex.colorSpace = THREE.SRGBColorSpace;
  groundTex.anisotropy = 8;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE).rotateX(-Math.PI / 2).translate(MAP_SIZE / 2, 0, MAP_SIZE / 2),
    new THREE.MeshBasicMaterial({ map: groundTex })
  );
  ground.name = 'ground';
  scene.add(ground);

  // terre selvagge oltre il bordo: prato più scuro
  const wildTex = tex.ground_grass.clone();
  wildTex.wrapS = wildTex.wrapT = THREE.RepeatWrapping;
  wildTex.repeat.set(30, 30);
  wildTex.needsUpdate = true;
  const wild = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: wildTex, color: 0x4a5a40 })
  );
  wild.position.set(MAP_SIZE / 2, -0.05, MAP_SIZE / 2);
  scene.add(wild);

  // aree di rispetto intorno alle basi
  const nearBase = (x, z, r) => Object.values(BASES).some(b => Math.hypot(x - b.x - 1.5, z - b.z - 1.5) < r);

  const addNode = (type, x, z) => {
    if (!grid.isFree(x, z)) return;
    const node = { kind: 'node', type, x, z, amount: NODES[type].amount, res: NODES[type].res, alive: true, mesh: null };
    grid.occupy(x, z, 1, 1, node);
    nodes.push(node);
  };

  // foreste (gruppi di alberi)
  for (let f = 0; f < 22; f++) {
    const cx = 4 + rng() * (MAP_SIZE - 8), cz = 4 + rng() * (MAP_SIZE - 8);
    if (nearBase(cx, cz, 7)) continue;
    const count = 8 + Math.floor(rng() * 18);
    for (let t = 0; t < count; t++) {
      const x = Math.floor(cx + (rng() - 0.5) * 7), z = Math.floor(cz + (rng() - 0.5) * 7);
      if (grid.inside(x, z) && !nearBase(x, z, 6)) addNode('tree', x, z);
    }
  }
  // risorse vicino a ogni base (stesso schema, specchiato)
  for (const key of Object.keys(BASES)) {
    const b = BASES[key];
    const s = key === 'men' ? 1 : -1;
    const place = (type, ox, oz, n) => {
      for (let i = 0; i < n; i++) addNode(type, b.x + ox * s + (i % 3), b.z + oz * s + Math.floor(i / 3));
    };
    place('bush', 7, -2, 6);
    place('gold', -4, -7, 4);
    place('stone', 7, 6, 4);
    // bosco vicino
    for (let i = 0; i < 18; i++) addNode('tree', b.x + s * (10 + (i % 6)), b.z + s * (-9 + Math.floor(i / 6)));
  }
  // risorse contese al centro
  for (let i = 0; i < 6; i++) addNode('gold', 30 + (i % 3), 30 + Math.floor(i / 3));
  for (let i = 0; i < 6; i++) addNode('stone', 33 + (i % 3), 26 + Math.floor(i / 3));
  for (let i = 0; i < 6; i++) addNode('bush', 26 + (i % 3), 34 + Math.floor(i / 3));

  buildNodeSprites(scene, nodes, rng);
  return { grid, nodes, ground };
}

// risorse come sprite dipinti
const NODE_LOOK = {
  tree:  () => ({ name: ['res_tree_1', 'res_tree_2', 'res_tree_3'][Math.floor(Math.random() * 3)], height: 2.1 }),
  bush:  () => ({ name: 'res_bush', width: 0.95 }),
  stone: () => ({ name: 'res_stone', width: 1.15 }),
  gold:  () => ({ name: 'res_gold', width: 1.05 }),
};
function buildNodeSprites(scene, nodes, rng) {
  for (const n of nodes) {
    const look = NODE_LOOK[n.type]();
    const k = 0.85 + rng() * 0.3;
    const sp = makeSprite(look.name, look.width ? { width: look.width * k } : { height: look.height * k });
    if (rng() < 0.5) sp.scale.x *= -1;
    sp.center.set(0.5, 0.12);
    sp.position.set(n.x + 0.5 + (rng() - 0.5) * 0.15, 0, n.z + 0.5 + (rng() - 0.5) * 0.15);
    sp.userData.node = n;
    n.sprite = sp;
    scene.add(sp);
  }
}

export function hideNode(node) {
  if (node.sprite) { node.sprite.visible = false; node.sprite.parent?.remove(node.sprite); }
}
