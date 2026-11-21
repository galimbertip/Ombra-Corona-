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

// --- Costruzione della mappa (casuale dalla V.0.4.0) ----------------------------
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

// terreno dipinto: prato, cenere intorno all'Ombra, terra battuta intorno alle basi
function paintGround(rng, bases) {
  const size = MAP_SIZE * PX;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const noise = Array.from({ length: 12 }, () => ({ x: rng() * MAP_SIZE, z: rng() * MAP_SIZE, r: 3 + rng() * 6 }));
  g.drawImage(layer(size, tex.ground_grass.image, 8 * PX), 0, 0);
  const sh = bases.shadow, mn = bases.men;
  const ash = (x, z) => {
    const ds = Math.hypot(x - sh.x - 1.5, z - sh.z - 1.5), dm = Math.hypot(x - mn.x - 1.5, z - mn.z - 1.5);
    const t = dm / (dm + ds + 0.001);                 // 0 vicino agli Uomini, 1 vicino all'Ombra
    return (t - 0.45) * 3 + (ds < 18 ? (18 - ds) / 10 : 0) + Math.sin(x * 0.4) * Math.cos(z * 0.3) * 0.15;
  };
  g.drawImage(layer(size, tex.ground_ash.image, 8 * PX, maskCanvas(ash)), 0, 0);
  const dirt = (x, z) => {
    let v = 0;
    for (const b of Object.values(bases)) { const d = Math.hypot(x - b.x - 1.5, z - b.z - 1.5); v = Math.max(v, (5.5 - d) / 2.5); }
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
  g.strokeStyle = 'rgba(20,25,10,0.5)'; g.lineWidth = PX; g.strokeRect(0, 0, size, size);
  return c;
}

// basi in posizioni casuali, una di fronte all'altra
function placeBases(rng, factions) {
  const C = MAP_SIZE / 2 - 1.5, lo = 4, hi = MAP_SIZE - 7;
  const clamp = v => Math.max(lo, Math.min(hi, Math.round(v)));
  for (let tries = 0; tries < 50; tries++) {
    const a = rng() * Math.PI * 2;
    const b = a + Math.PI + (rng() - 0.5) * 0.7;
    const r1 = 20 + rng() * 5, r2 = 20 + rng() * 5;
    const p1 = { x: clamp(C + Math.cos(a) * r1), z: clamp(C + Math.sin(a) * r1) };
    const p2 = { x: clamp(C + Math.cos(b) * r2), z: clamp(C + Math.sin(b) * r2) };
    if (Math.hypot(p1.x - p2.x, p1.z - p2.z) >= 34) return { [factions[0]]: p1, [factions[1]]: p2 };
  }
  return { [factions[0]]: { x: 9, z: 52 }, [factions[1]]: { x: 52, z: 9 } };
}

export function buildWorld(scene, seed, mapDef, factions = ['men', 'shadow']) {
  const rng = makeRng(seed);
  const grid = new Grid(MAP_SIZE);
  const nodes = [];
  const bases = placeBases(rng, factions);
  const centers = Object.values(bases).map(b => ({ x: b.x + 1.5, z: b.z + 1.5 }));
  const nearBase = (x, z, r) => centers.some(b => Math.hypot(x + 0.5 - b.x, z + 0.5 - b.z) < r);

  const addNode = (type, x, z) => {
    if (!grid.inside(x, z) || x < 1 || z < 1 || x > MAP_SIZE - 2 || z > MAP_SIZE - 2) return false;
    if (!grid.isFree(x, z) || nearBase(x, z, 4.6)) return false;
    const node = { kind: 'node', type, x, z, amount: NODES[type].amount, res: NODES[type].res, alive: true };
    grid.occupy(x, z, 1, 1, node);
    nodes.push(node);
    return true;
  };
  // gruppo compatto di n risorse attorno a un punto (crescita casuale)
  const cluster = (type, cx, cz, n, loose = 0) => {
    const open = [[Math.round(cx), Math.round(cz)]], seen = new Set();
    let placed = 0, guard = 0;
    while (open.length && placed < n && guard++ < n * 30) {
      const [x, z] = open.splice(Math.floor(rng() * open.length), 1)[0];
      const k = x + ',' + z;
      if (seen.has(k)) continue;
      seen.add(k);
      if (addNode(type, x, z)) placed++;
      else if (!grid.inside(x, z) || nearBase(x, z, 4.6)) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (rng() > loose) open.push([x + dx, z + dz]);
    }
    return placed;
  };

  // risorse intorno a ogni base: bacche, oro, pietra e un bosco in direzioni diverse
  for (const c of centers) {
    const a0 = rng() * Math.PI * 2;
    const at = (i, d) => { const a = a0 + i * Math.PI / 2 + (rng() - 0.5) * 0.5; return [c.x + Math.cos(a) * d, c.z + Math.sin(a) * d]; };
    cluster('bush', ...at(0, 6.5), 6);
    cluster('gold', ...at(1, 8), 4);
    cluster('stone', ...at(2, 8.5), 4);
    cluster('tree', ...at(3, 10.5), 20, 0.2);
    cluster('gold', ...at(1.5, 13), 3);
  }
  // boschi sparsi
  const F = mapDef.forests;
  for (let f = 0; f < F.count; f++) {
    const cx = 3 + rng() * (MAP_SIZE - 6), cz = 3 + rng() * (MAP_SIZE - 6);
    if (nearBase(cx, cz, 9)) continue;
    cluster('tree', cx, cz, F.min + Math.floor(rng() * (F.max - F.min)), 0.3);
  }
  // risorse contese lontano dalle basi
  for (const [type, n] of Object.entries(mapDef.extra)) {
    for (let i = 0; i < n; i++) {
      for (let t = 0; t < 30; t++) {
        const x = 4 + rng() * (MAP_SIZE - 8), z = 4 + rng() * (MAP_SIZE - 8);
        if (nearBase(x, z, 14)) continue;
        cluster(type, x, z, type === 'bush' ? 6 : 5);
        break;
      }
    }
  }
  // le due basi devono potersi raggiungere: se un bosco le separa, apro un sentiero
  const [b1, b2] = Object.values(bases);
  const goal = { x0: b2.x, z0: b2.z, x1: b2.x + 2, z1: b2.z + 2 };
  const path = findPath(grid, b1.x + 1.5, b1.z + 3.5, goal, 20000);
  const last = path[path.length - 1];
  if (!last || Math.hypot(last.x - b2.x - 1.5, last.z - b2.z - 1.5) > 3.5) {
    const ax = b1.x + 1.5, az = b1.z + 1.5, bx = b2.x + 1.5, bz = b2.z + 1.5, L = Math.hypot(bx - ax, bz - az);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i], px = n.x + 0.5, pz = n.z + 0.5;
      const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / (L * L)));
      if (Math.hypot(px - (ax + t * (bx - ax)), pz - (az + t * (bz - az))) < 1.6) { grid.release(n.x, n.z, 1, 1); nodes.splice(i, 1); }
    }
  }

  const groundCanvas = paintGround(rng, bases);
  const groundTex = new THREE.CanvasTexture(groundCanvas);
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

  buildNodeSprites(scene, nodes, rng);
  return { grid, nodes, ground, bases, groundCanvas };
}

// risorse come sprite dipinti
const NODE_LOOK = {
  tree:  (rng) => ({ name: ['res_tree_1', 'res_tree_2', 'res_tree_3'][Math.floor(rng() * 3)], height: 2.1 }),
  bush:  () => ({ name: 'res_bush', width: 0.95 }),
  stone: () => ({ name: 'res_stone', width: 1.15 }),
  gold:  () => ({ name: 'res_gold', width: 1.05 }),
};
function buildNodeSprites(scene, nodes, rng) {
  for (const n of nodes) {
    const look = NODE_LOOK[n.type](rng);
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
