// GPverse — Ombra & Corona — unità ed edifici (V.0.1.0)
import * as THREE from '../lib/three.module.js';
import { UNITS, BUILDINGS, FACTIONS } from './config.js';

let NEXT_ID = 1;
const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });

const SKIN = { men: 0xe0b48e, shadow: 0x5f7a45 };

// --- barra vita (due piani che guardano la camera) ---------------------------
function makeHpBar(width, y) {
  const g = new THREE.Group();
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.12), new THREE.MeshBasicMaterial({ color: 0x220000, depthTest: false }));
  const fg = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.12), new THREE.MeshBasicMaterial({ color: 0x4cd964, depthTest: false }));
  fg.position.z = 0.001;
  bg.renderOrder = 10; fg.renderOrder = 11;
  g.add(bg, fg);
  g.position.y = y;
  g.userData = { fg, width };
  g.visible = false;
  return g;
}

function makeRing(radius) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.85, radius, 24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x7dff7d, transparent: true, opacity: 0.85, depthWrite: false })
  );
  ring.position.y = 0.03;
  ring.visible = false;
  return ring;
}

// --- modelli unità ----------------------------------------------------------
function unitModel(type, faction) {
  const g = new THREE.Group();
  const team = FACTIONS[faction].color;
  const skin = SKIN[faction];
  const big = faction === 'shadow' && type === 'soldier' ? 1.15 : 1;

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.55, 6), mat(type === 'soldier' ? 0x6f7680 : 0x8a6a45));
  body.position.y = 0.38;
  const tabard = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.2, 0.22, 6), mat(team));
  tabard.position.y = 0.45;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 5), mat(skin));
  head.position.y = 0.78;
  g.add(body, tabard, head);

  if (type === 'villager') {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.14, 7), mat(0xc9a86a));
    hat.position.y = 0.9;
    const tool = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), mat(0x6b4a2b));
    tool.position.set(0.24, 0.45, 0.05); tool.rotation.z = 0.3;
    g.add(hat, tool);
  } else {
    const helm = faction === 'men'
      ? new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.22, 7), mat(0xc8ccd2))
      : new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.26), mat(0x2a2a2a));
    helm.position.y = faction === 'men' ? 0.92 : 0.86;
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), mat(0x6b4a2b));
    spear.position.set(0.26, 0.6, 0);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), mat(0xdddddd));
    tip.position.set(0.26, 1.27, 0);
    const shield = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.26), mat(team));
    shield.position.set(-0.24, 0.45, 0.02);
    g.add(helm, spear, tip, shield);
  }
  g.scale.setScalar(big * 1.25);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// --- modelli edifici ----------------------------------------------------------
function farmModel(faction) {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 1.9), mat(faction === 'men' ? 0x7a5a32 : 0x4a3b2e));
  soil.position.y = 0.04;
  g.add(soil);
  for (let i = 0; i < 4; i++) {
    const row = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.18), mat(faction === 'men' ? 0xb7c94a : 0x6f7a3a));
    row.position.set(0, 0.14, -0.6 + i * 0.4);
    g.add(row);
  }
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), mat(FACTIONS[faction].color));
  post.position.set(0.85, 0.25, 0.85);
  g.add(post);
  g.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  return g;
}

function buildingModel(type, faction) {
  if (type === 'farm') return farmModel(faction);
  const g = new THREE.Group();
  const size = BUILDINGS[type].size;
  const team = FACTIONS[faction].color;
  const wall = faction === 'men' ? 0xd9d2c0 : 0x3a3434;
  const roof = faction === 'men' ? 0x8c3b2a : 0x1d1b1b;
  const h = type === 'tc' ? 1.6 : type === 'barracks' ? 1.2 : 0.9;

  const base = new THREE.Mesh(new THREE.BoxGeometry(size * 0.9, h, size * 0.9), mat(wall));
  base.position.y = h / 2;
  g.add(base);

  if (faction === 'men') {
    const r = new THREE.Mesh(new THREE.ConeGeometry(size * 0.72, h * 0.8, 4), mat(roof));
    r.rotation.y = Math.PI / 4; r.position.y = h + h * 0.4;
    g.add(r);
  } else {
    // punte dell'Ombra
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.14, h * 0.9, 4), mat(roof));
      sp.position.set((i % 2 ? 1 : -1) * size * 0.38, h + h * 0.4, (i < 2 ? 1 : -1) * size * 0.38);
      g.add(sp);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(size * 0.6, h * 0.4, size * 0.6), mat(0x2a2424));
    top.position.y = h + h * 0.2;
    g.add(top);
  }
  if (type === 'tc') {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 2.6, 6), mat(wall));
    tower.position.set(size * 0.3, 1.3, -size * 0.3);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 4), mat(0x444444));
    pole.position.set(size * 0.3, 3.1, -size * 0.3);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.02), mat(team));
    flag.position.set(size * 0.3 + 0.27, 3.4, -size * 0.3);
    g.add(tower, pole, flag);
    if (faction === 'shadow') {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6a00 }));
      eye.position.set(size * 0.3, 2.85, -size * 0.3);
      g.add(eye);
    }
  }
  if (type === 'barracks') {
    const banner = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.04), mat(team));
    banner.position.set(0, h * 0.6, size * 0.46);
    g.add(banner);
  }
  // fascia del colore della fazione alla base
  const band = new THREE.Mesh(new THREE.BoxGeometry(size * 0.92, 0.12, size * 0.92), mat(team));
  band.position.y = 0.06;
  g.add(band);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// --- Classi ---------------------------------------------------------------
export class Unit {
  constructor(type, faction, x, z) {
    const st = UNITS[type];
    this.id = NEXT_ID++;
    this.kind = 'unit';
    this.type = type;
    this.faction = faction;
    this.x = x; this.z = z;
    this.hp = st.hp; this.maxHp = st.hp;
    this.speed = st.speed; this.attack = st.attack; this.range = st.range; this.cooldown = st.cooldown;
    this.cd = 0;
    this.radius = 0.3;
    this.alive = true;
    this.state = 'idle';     // idle | move | gather | build | attack | attackMove
    this.path = [];
    this.target = null;       // entità o nodo
    this.carry = 0; this.carryRes = null;
    this.gatherType = null;
    this.repath = 0;
    this.anim = Math.random() * 10;

    this.mesh = new THREE.Group();
    this.model = unitModel(type, faction);
    this.ring = makeRing(0.38);
    this.hpBar = makeHpBar(0.6, 1.8);
    this.mesh.add(this.model, this.ring, this.hpBar);
    this.mesh.position.set(x, 0, z);
    this.mesh.userData.entity = this;
  }
  get isMilitary() { return this.type === 'soldier'; }
}

export class Building {
  constructor(type, faction, cx, cz, built = true) {
    const st = BUILDINGS[type];
    this.id = NEXT_ID++;
    this.kind = 'building';
    this.type = type;
    this.faction = faction;
    this.size = st.size;
    this.cx = cx; this.cz = cz;                // cella in alto a sinistra
    this.x = cx + st.size / 2; this.z = cz + st.size / 2;
    this.maxHp = st.hp;
    this.hp = built ? st.hp : 1;
    this.built = built;
    this.progress = built ? 1 : 0;
    this.alive = true;
    this.queue = [];          // [{type, t}]
    this.radius = st.size * 0.5;
    if (st.farm) this.res = 'food';

    this.mesh = new THREE.Group();
    this.model = buildingModel(type, faction);
    this.ring = makeRing(st.size * 0.75);
    this.hpBar = makeHpBar(st.size * 0.8, type === 'tc' ? 3.9 : 2.6);
    this.scaffold = new THREE.Mesh(
      new THREE.BoxGeometry(st.size * 0.95, 0.5, st.size * 0.95),
      new THREE.MeshLambertMaterial({ color: 0xa0804f, wireframe: true })
    );
    this.scaffold.position.y = 0.25;
    this.mesh.add(this.model, this.ring, this.hpBar, this.scaffold);
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.userData.entity = this;
    this.updateConstructionLook();
  }
  get rect() { return { x0: this.cx, z0: this.cz, x1: this.cx + this.size - 1, z1: this.cz + this.size - 1 }; }
  updateConstructionLook() {
    this.scaffold.visible = !this.built;
    const p = this.built ? 1 : 0.15 + this.progress * 0.85;
    this.model.scale.set(1, p, 1);
  }
}

export function updateBars(entity, camera, selected) {
  const bar = entity.hpBar;
  const show = selected || entity.hp < entity.maxHp;
  bar.visible = show && entity.alive;
  if (!bar.visible) return;
  bar.quaternion.copy(camera.quaternion);
  // compensa la rotazione del gruppo genitore
  if (entity.mesh.quaternion) bar.quaternion.premultiply(entity.mesh.quaternion.clone().invert());
  const r = Math.max(0, entity.hp / entity.maxHp);
  const fg = bar.userData.fg;
  fg.scale.x = Math.max(0.001, r);
  fg.position.x = -(1 - r) * bar.userData.width / 2;
  fg.material.color.setHex(r > 0.5 ? 0x4cd964 : r > 0.25 ? 0xffcc00 : 0xff3b30);
}
