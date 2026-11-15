// GPverse — Ombra & Corona — mappa e pathfinding (V.0.1.0)
import * as THREE from '../lib/three.module.js';
import { MAP_SIZE, NODES } from './config.js';

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

export function buildWorld(scene, seed) {
  const rng = makeRng(seed);
  const grid = new Grid(MAP_SIZE);
  const nodes = [];

  // Terreno con colori per vertice
  const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, MAP_SIZE, MAP_SIZE);
  geo.rotateX(-Math.PI / 2);
  geo.translate(MAP_SIZE / 2, 0, MAP_SIZE / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const n = Math.sin(x * 0.21) * Math.cos(z * 0.17) * 0.5 + rng() * 0.25;
    // verso la Terra Cinerea il terreno diventa grigio-cenere
    const ash = Math.max(0, Math.min(1, ((x - z) / MAP_SIZE) * 1.4 + 0.1 - (Math.hypot(x - BASES.shadow.x, z - BASES.shadow.z) < 16 ? -0.4 : 0)));
    c.setHSL(0.27 - n * 0.03, 0.45 - ash * 0.35, 0.33 + n * 0.06 - ash * 0.05);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    pos.setY(i, (rng() - 0.5) * 0.06);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  ground.receiveShadow = true;
  ground.name = 'ground';
  scene.add(ground);

  // terre selvagge oltre il bordo della mappa
  const wild = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 260).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x24301b })
  );
  wild.position.set(MAP_SIZE / 2, -0.08, MAP_SIZE / 2);
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

  buildNodeMeshes(scene, nodes, rng);
  return { grid, nodes, ground };
}

// mesh delle risorse con InstancedMesh (veloce su smartphone)
function buildNodeMeshes(scene, nodes, rng) {
  const groups = { tree: [], bush: [], stone: [], gold: [] };
  nodes.forEach(n => groups[n.type].push(n));

  const make = (list, geo, color, scaleFn, yOff = 0) => {
    if (!list.length) return null;
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color, flatShading: true }), list.length);
    mesh.castShadow = true;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
    list.forEach((n, i) => {
      const sc = scaleFn();
      p.set(n.x + 0.5 + (rng() - 0.5) * 0.2, yOff * sc, n.z + 0.5 + (rng() - 0.5) * 0.2);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * Math.PI * 2);
      s.set(sc, sc, sc);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      n.inst = { mesh, i, matrix: m.clone() };
    });
    scene.add(mesh);
    return mesh;
  };

  // alberi: chioma + tronco
  const crown = new THREE.ConeGeometry(0.45, 1.3, 6); crown.translate(0, 1.15, 0);
  const trunk = new THREE.CylinderGeometry(0.09, 0.12, 0.6, 5); trunk.translate(0, 0.3, 0);
  make(groups.tree, crown, 0x2f6b34, () => 0.8 + rng() * 0.5);
  const trunks = make(groups.tree, trunk, 0x5a3b22, () => 1);
  // il tronco usa la stessa scala della chioma: ricopio la matrice della chioma
  if (trunks) groups.tree.forEach((n, i) => { n.inst2 = { mesh: trunks, i }; trunks.setMatrixAt(i, n.inst.matrix); });

  make(groups.bush, new THREE.DodecahedronGeometry(0.38).translate(0, 0.3, 0), 0x3f8a3a, () => 0.9 + rng() * 0.3);
  // bacche rosse sopra i cespugli
  const berries = make(groups.bush, new THREE.IcosahedronGeometry(0.4, 0).translate(0, 0.33, 0), 0xc23a4a, () => 0.75);
  if (berries) groups.bush.forEach((n, i) => { n.inst2 = { mesh: berries, i }; });
  make(groups.stone, new THREE.DodecahedronGeometry(0.45).translate(0, 0.25, 0), 0x8b8f94, () => 0.8 + rng() * 0.4);
  make(groups.gold, new THREE.OctahedronGeometry(0.4).translate(0, 0.35, 0), 0xe0b43a, () => 0.8 + rng() * 0.3);
}

export function hideNode(node) {
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const inst of [node.inst, node.inst2]) {
    if (!inst) continue;
    inst.mesh.setMatrixAt(inst.i, zero);
    inst.mesh.instanceMatrix.needsUpdate = true;
  }
}
