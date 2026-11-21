// GPverse — Ombra & Corona — territori in stile Northgard (dalla V.0.5.0)
// La mappa è divisa in regioni. Si costruisce solo nelle proprie regioni; quelle confinanti si colonizzano
// pagando cibo. Ogni regione dà un bonus in base a cosa contiene.
import * as THREE from '../lib/three.module.js';
import { MAP_SIZE, FACTIONS } from './config.js';

const NAMES = [
  'Colle del Vento', 'Piana Grigia', 'Valle dei Salici', 'Guado del Corvo', 'Campi d\'Ambra', 'Bosco Alto',
  'Rupe dell\'Eco', 'Prati di Lunafonda', 'Sentiero dei Pellegrini', 'Conca delle Nebbie', 'Brughiera Rossa',
  'Poggio del Re', 'Fossa dei Lupi', 'Radura Lucente', 'Terre del Tramonto', 'Pietrascura', 'Selva Muta',
  'Colli Dorati', 'Valico dell\'Aquila', 'Piana dei Tumuli', 'Fonte Chiara', 'Gola del Tuono', 'Pascoli Alti',
  'Bassopiano Cenere', 'Rocca Vecchia', 'Querceto Antico', 'Lande Sorde', 'Riva dei Giunchi',
];

export const BONUS = {
  foresta: { label: 'Foresta', desc: '+20% legno', res: 'wood', mul: 1.2 },
  miniera: { label: 'Miniere', desc: '+20% oro e pietra', res: ['gold', 'stone'], mul: 1.2 },
  pascolo: { label: 'Pascolo', desc: '+20% cibo', res: 'food', mul: 1.2 },
  pianura: { label: 'Pianura', desc: '+3 popolazione', pop: 3 },
};

const PX = 8; // pixel per cella nella texture dei confini

export class Territory {
  constructor(scene, rng, nodes, bases) {
    const N = MAP_SIZE;
    // semi delle regioni: uno su ogni base, gli altri a distanza minima tra loro
    const seeds = Object.values(bases).map(b => ({ x: b.x + 1.5, z: b.z + 1.5 }));
    for (let t = 0; t < 4000 && seeds.length < 22; t++) {
      const p = { x: 3 + rng() * (N - 6), z: 3 + rng() * (N - 6) };
      if (seeds.every(s => Math.hypot(s.x - p.x, s.z - p.z) > 10)) seeds.push(p);
    }
    // ogni cella va alla regione del seme più vicino (con un po' di rumore per confini naturali)
    this.cellRegion = new Int16Array(N * N);
    const ph = rng() * 10;
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      let best = 0, bd = Infinity;
      const nz = Math.sin(x * 0.35 + ph) * Math.cos(z * 0.29 - ph) * 1.6;
      seeds.forEach((s, i) => { const d = Math.hypot(s.x - x - 0.5, s.z - z - 0.5) + nz * (i % 2 ? 1 : -1); if (d < bd) { bd = d; best = i; } });
      this.cellRegion[z * N + x] = best;
    }
    const names = [...NAMES].sort(() => rng() - 0.5);
    this.regions = seeds.map((s, i) => ({ id: i, kind: 'region', alive: true, x: s.x, z: s.z, name: names[i % names.length], owner: null, cells: 0, nodes: { tree: 0, gold: 0, stone: 0, bush: 0 }, adj: new Set() }));
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      const r = this.regions[this.cellRegion[z * N + x]]; r.cells++;
      if (x + 1 < N) { const o = this.cellRegion[z * N + x + 1]; if (o !== r.id) { r.adj.add(o); this.regions[o].adj.add(r.id); } }
      if (z + 1 < N) { const o = this.cellRegion[(z + 1) * N + x]; if (o !== r.id) { r.adj.add(o); this.regions[o].adj.add(r.id); } }
    }
    for (const n of nodes) this.regions[this.regionIdAt(n.x, n.z)].nodes[n.type]++;
    for (const r of this.regions) {
      const k = r.nodes;
      r.bonus = k.tree >= 14 ? 'foresta' : k.gold + k.stone >= 4 ? 'miniera' : k.bush >= 5 ? 'pascolo' : 'pianura';
    }
    // le regioni delle basi sono già dei rispettivi popoli
    for (const [f, b] of Object.entries(bases)) this.regionAt(b.x + 1.5, b.z + 1.5).owner = f;

    // sovrapposizione grafica: colori dei proprietari e confini
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = N * PX;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(N, N).rotateX(-Math.PI / 2).translate(N / 2, 0.01, N / 2),
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false })
    );
    this.mesh.renderOrder = 0;
    scene.add(this.mesh);
    this.highlight = null;
    this.redraw();
  }

  regionIdAt(x, z) {
    const N = MAP_SIZE;
    const cx = Math.max(0, Math.min(N - 1, Math.floor(x))), cz = Math.max(0, Math.min(N - 1, Math.floor(z)));
    return this.cellRegion[cz * N + cx];
  }
  regionAt(x, z) { return this.regions[this.regionIdAt(x, z)]; }
  owned(f) { return this.regions.filter(r => r.owner === f); }
  ownsCell(f, x, z) { return this.regionAt(x + 0.5, z + 0.5).owner === f; }
  ownsArea(f, x0, z0, w, h) {
    for (let z = z0; z < z0 + h; z++) for (let x = x0; x < x0 + w; x++) if (!this.ownsCell(f, x, z)) return false;
    return true;
  }
  canColonize(f, r) { return !r.owner && [...r.adj].some(i => this.regions[i].owner === f); }
  colonizeCost(f) { return { food: 60 + 40 * (this.owned(f).length - 1) }; }
  claim(r, f) { r.owner = f; this.redraw(); }
  // moltiplicatore di raccolta per una risorsa raccolta in (x,z)
  gatherMul(f, res, x, z) {
    const r = this.regionAt(x + 0.5, z + 0.5);
    if (r.owner !== f) return 1;
    const b = BONUS[r.bonus];
    return b.res && [].concat(b.res).includes(res) ? b.mul : 1;
  }
  popBonus(f) { return this.owned(f).filter(r => r.bonus === 'pianura').length * BONUS.pianura.pop; }
  setHighlight(r) { if (this.highlight !== r) { this.highlight = r; this.redraw(); } }

  redraw() {
    const N = MAP_SIZE, g = this.canvas.getContext('2d');
    g.clearRect(0, 0, N * PX, N * PX);
    const color = f => '#' + FACTIONS[f].color.toString(16).padStart(6, '0');
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      const r = this.regions[this.cellRegion[z * N + x]];
      if (r.owner) { g.fillStyle = color(r.owner) + '26'; g.fillRect(x * PX, z * PX, PX, PX); }
      if (r === this.highlight) { g.fillStyle = 'rgba(255,240,170,0.22)'; g.fillRect(x * PX, z * PX, PX, PX); }
    }
    // confini: linea sottile tra regioni, colorata dove passa il confine di un popolo
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      const a = this.regions[this.cellRegion[z * N + x]];
      const edge = (b, x0, y0, x1, y1) => {
        if (b === a) return;
        const own = a.owner !== b.owner ? (a.owner || b.owner) : null;
        const hl = a === this.highlight || b === this.highlight;
        g.strokeStyle = hl ? 'rgba(255,225,120,0.95)' : own ? color(own) + 'cc' : 'rgba(30,25,10,0.28)';
        g.lineWidth = hl || own ? 2 : 1;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      };
      if (x + 1 < N) edge(this.regions[this.cellRegion[z * N + x + 1]], (x + 1) * PX, z * PX, (x + 1) * PX, (z + 1) * PX);
      if (z + 1 < N) edge(this.regions[this.cellRegion[(z + 1) * N + x]], x * PX, (z + 1) * PX, (x + 1) * PX, (z + 1) * PX);
    }
    this.tex.needsUpdate = true;
  }
}
