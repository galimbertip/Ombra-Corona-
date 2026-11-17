// GPverse — Ombra & Corona — unità ed edifici (aggiornato alla V.0.2.0)
import * as THREE from '../lib/three.module.js';
import { unitDef, BUILDINGS, FACTIONS } from './config.js';

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
function horseModel(faction) {
  const h = new THREE.Group();
  const coat = faction === 'men' ? 0x8b5a2b : 0x55504a; // cavallo / lupo mannaro
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.8), mat(coat));
  body.position.y = 0.5;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.2), mat(coat));
  neck.position.set(0, 0.72, 0.4); neck.rotation.x = -0.5;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, faction === 'men' ? 0.32 : 0.26), mat(coat));
  head.position.set(0, 0.86, 0.56);
  h.add(body, neck, head);
  for (const [x, z] of [[0.12, 0.3], [-0.12, 0.3], [0.12, -0.3], [-0.12, -0.3]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.08), mat(coat));
    leg.position.set(x, 0.18, z);
    h.add(leg);
  }
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.4), mat(FACTIONS[faction].color));
  cloth.position.y = 0.66;
  h.add(cloth);
  return h;
}

function unitModel(type, faction) {
  const g = new THREE.Group();
  const team = FACTIONS[faction].color;
  const skin = SKIN[faction];
  const armored = type !== 'villager';
  let big = faction === 'shadow' && type === 'soldier' ? 1.15 : 1;
  if (type === 'hero') big = 1.35;

  // il cavaliere sta in sella: tutto il corpo si alza
  const rider = new THREE.Group();
  if (type === 'knight') { g.add(horseModel(faction)); rider.position.set(0, 0.42, -0.05); rider.scale.setScalar(0.85); }
  g.add(rider);

  const robe = type === 'hero' && faction === 'shadow';
  const bodyColor = robe ? 0xeeeeee : type === 'hero' ? 0x2f3d4f : armored ? 0x6f7680 : 0x8a6a45;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, robe ? 0.3 : 0.24, robe ? 0.7 : 0.55, 6), mat(bodyColor));
  body.position.y = robe ? 0.35 : 0.38;
  const tabard = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.2, 0.22, 6), mat(team));
  tabard.position.y = 0.45;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 5), mat(robe ? 0xe8dcc8 : skin));
  head.position.y = 0.78;
  rider.add(body, tabard, head);

  if (type === 'villager') {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.14, 7), mat(0xc9a86a));
    hat.position.y = 0.9;
    const tool = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), mat(0x6b4a2b));
    tool.position.set(0.24, 0.45, 0.05); tool.rotation.z = 0.3;
    rider.add(hat, tool);
  } else if (type === 'hero') {
    if (faction === 'men') {
      // corona d'oro, mantello e spada lunga
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.1, 8, 1, true), mat(0xe0b43a, { side: THREE.DoubleSide }));
      crown.position.y = 0.92;
      const cape = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.6, 0.05), mat(0x1f3f8a));
      cape.position.set(0, 0.45, -0.2);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 0.02), mat(0xe6eef5));
      blade.position.set(0.28, 0.75, 0.05);
      const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), mat(0xe0b43a));
      hilt.position.set(0.28, 0.36, 0.05);
      rider.add(crown, cape, blade, hilt);
    } else {
      // bastone bianco con gemma, barba
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.3, 5), mat(0xd8d8d8));
      staff.position.set(0.28, 0.62, 0.05);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0x9fe8ff }));
      gem.position.set(0.28, 1.32, 0.05);
      const beard = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 6), mat(0xf2f2f2));
      beard.position.set(0, 0.62, 0.08); beard.rotation.x = Math.PI;
      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.26, 7), mat(0xeeeeee));
      hood.position.y = 0.93;
      rider.add(staff, gem, beard, hood);
    }
  } else {
    const helm = faction === 'men'
      ? new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.22, 7), mat(0xc8ccd2))
      : new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.26), mat(0x2a2a2a));
    helm.position.y = faction === 'men' ? 0.92 : 0.86;
    rider.add(helm);
    if (type === 'archer') {
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 4, 10, Math.PI), mat(0x6b4a2b));
      bow.position.set(0.26, 0.55, 0.05); bow.rotation.z = -Math.PI / 2;
      const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 5), mat(0x5a3b22));
      quiver.position.set(-0.12, 0.6, -0.18); quiver.rotation.x = 0.3;
      rider.add(bow, quiver);
    } else {
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), mat(0x6b4a2b));
      spear.position.set(0.26, 0.6, type === 'knight' ? 0.2 : 0);
      if (type === 'knight') spear.rotation.x = 0.6;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), mat(0xdddddd));
      tip.position.set(0.26, 1.27, 0);
      if (type === 'knight') { tip.position.set(0.26, 1.1, 0.55); tip.rotation.x = 0.6; }
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.26), mat(team));
      shield.position.set(-0.24, 0.45, 0.02);
      rider.add(spear, tip, shield);
    }
  }
  g.scale.setScalar(big * 1.25);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// etichetta del livello dell'eroe (sprite con testo)
export function makeLevelSprite() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 32;
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sp.scale.set(0.8, 0.4, 1);
  sp.renderOrder = 12;
  sp.userData.draw = (lv) => {
    const x = c.getContext('2d');
    x.clearRect(0, 0, 64, 32);
    x.fillStyle = 'rgba(20,17,15,.85)'; x.strokeStyle = '#e0b43a'; x.lineWidth = 3;
    x.beginPath(); x.roundRect(2, 2, 60, 28, 8); x.fill(); x.stroke();
    x.fillStyle = '#e0b43a'; x.font = 'bold 18px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('Lv ' + lv, 32, 17);
    tex.needsUpdate = true;
  };
  return sp;
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
    const st = unitDef(type, faction);
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
    const tall = type === 'hero' ? 2.3 : type === 'knight' ? 2.2 : 1.8;
    this.hpBar = makeHpBar(type === 'hero' ? 0.9 : 0.6, tall);
    this.mesh.add(this.model, this.ring, this.hpBar);
    this.ranged = st.range > 2;
    this.buffUntil = 0; this.slowUntil = 0;
    if (type === 'hero') {
      this.level = 1; this.xp = 0;
      this.abilityCd = st.abilities.map(() => 0);
      this.levelSprite = makeLevelSprite();
      this.levelSprite.position.y = tall + 0.35;
      this.levelSprite.userData.draw(1);
      this.mesh.add(this.levelSprite);
      this.ring.scale.setScalar(1.3);
      // aura dorata sempre visibile sotto l'eroe
      this.aura = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 24).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: faction === 'men' ? 0xe0b43a : 0x9fe8ff, transparent: true, opacity: 0.55, depthWrite: false }));
      this.aura.position.y = 0.02;
      this.mesh.add(this.aura);
    }
    this.mesh.position.set(x, 0, z);
    this.mesh.userData.entity = this;
  }
  get isMilitary() { return this.type !== 'villager'; }
  get isHero() { return this.type === 'hero'; }
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
