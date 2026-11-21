// GPverse — Ombra & Corona — unità ed edifici (sprite dipinti dalla V.0.3.0)
import * as THREE from '../lib/three.module.js';
import { unitDef, BUILDINGS, CAM_YAW, CAM_PITCH } from './config.js';
import { makeSprite, TINT } from './assets.js';

let NEXT_ID = 1;
const COS_P = Math.cos(CAM_PITCH), SIN_P = Math.sin(CAM_PITCH);
// altezza nel mondo a cui un punto appare "h" più in alto sullo schermo
const screenUp = (h) => h / COS_P;

// --- elementi a terra (anelli, ombre) e barre vita -----------------------------
function groundDecal(geo, color, opacity) {
  const m = new THREE.Mesh(geo.rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthTest: false, depthWrite: false }));
  m.position.y = 0.02;
  m.renderOrder = 1;
  return m;
}
function makeRing(radius) {
  const ring = groundDecal(new THREE.RingGeometry(radius * 0.85, radius, 28), 0x7dff7d, 0.9);
  ring.scale.z = 1;
  ring.visible = false;
  return ring;
}
function makeShadow(w) {
  const s = groundDecal(new THREE.CircleGeometry(0.5, 20), 0x000000, 0.28);
  s.scale.set(w, 1, w * 0.75);
  return s;
}
function makeHpBar(width, y) {
  const g = new THREE.Group();
  const mk = (color, order) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.1), new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false }));
    m.renderOrder = order; return m;
  };
  const bg = mk(0x220000, 10), fg = mk(0x4cd964, 11);
  g.add(bg, fg);
  g.position.y = y;
  g.userData = { fg, width };
  g.visible = false;
  return g;
}

export function makeLevelSprite() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 32;
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sp.scale.set(0.8, 0.4, 1);
  sp.renderOrder = 12;
  sp.center.set(0.5, 0);
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

// --- aspetto delle unità -----------------------------------------------------------
// altezza dello sprite (in celle) e verso in cui guarda il disegno originale
const UNIT_LOOK = {
  villager: { men: 1.35, shadow: 1.25 },
  soldier:  { men: 1.65, shadow: 1.55 },
  archer:   { men: 1.5,  shadow: 1.4 },
  knight:   { men: 1.9,  shadow: 1.7 },
  hero:     { men: 1.9,  shadow: 2.0 },
};
const FACES_LEFT = new Set(['unit_shadow_soldier']);

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

    this.spriteName = `unit_${faction}_${type}`;
    const h = UNIT_LOOK[type][faction];
    this.sprite = makeSprite(this.spriteName, { height: h, own: true });
    this.sprite.center.set(0.5, 0.04);
    this.baseW = this.sprite.scale.x;
    this.facesLeft = FACES_LEFT.has(this.spriteName);
    this.model = this.sprite;           // usato dalla simulazione per le animazioni
    this.mesh = new THREE.Group();
    this.ring = makeRing(type === 'knight' ? 0.55 : 0.4);
    this.shadow = makeShadow(type === 'knight' ? 1.0 : 0.6);
    this.hpBar = makeHpBar(type === 'hero' ? 0.9 : 0.6, screenUp(h + 0.12));
    this.mesh.add(this.shadow, this.ring, this.sprite, this.hpBar);
    this.ranged = st.range > 2;
    this.buffUntil = 0; this.slowUntil = 0;
    if (type === 'hero') {
      this.level = 1; this.xp = 0;
      this.abilityCd = st.abilities.map(() => 0);
      this.levelSprite = makeLevelSprite();
      this.levelSprite.position.y = screenUp(h + 0.22);
      this.levelSprite.userData.draw(1);
      this.mesh.add(this.levelSprite);
      this.ring.scale.setScalar(1.3);
      // aura dorata sempre visibile sotto l'eroe
      this.aura = groundDecal(new THREE.RingGeometry(0.45, 0.6, 28), faction === 'men' ? 0xe0b43a : 0x9fe8ff, 0.6);
      this.mesh.add(this.aura);
    }
    this.mesh.position.set(x, 0, z);
    this.mesh.userData.entity = this;
  }
  get isMilitary() { return this.type !== 'villager'; }
  get isHero() { return this.type === 'hero'; }

  // aggiorna posa: verso (specchiando lo sprite), passo e colpo
  pose(dt) {
    if (this.face !== undefined) {
      const screenX = Math.sin(this.face - CAM_YAW);
      if (Math.abs(screenX) > 0.15) this.lookRight = screenX > 0;
    }
    const flip = (this.lookRight === false) !== this.facesLeft;
    this.sprite.scale.x = flip ? -this.baseW : this.baseW;
    this.anim += dt * (this.moving ? 12 : 0);
    this.sprite.position.y = this.moving ? Math.abs(Math.sin(this.anim)) * 0.07 : 0;
    this.sprite.material.rotation = this.swing > 0 ? (flip ? 0.12 : -0.12) : 0;
    // lampo rosso quando viene colpito
    if (this.hitT > 0) { this.hitT -= dt; this.sprite.material.color.setRGB(1, 0.55, 0.55); }
    else this.sprite.material.color.copy(TINT);
  }
}

// --- edifici ---------------------------------------------------------------------
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

    let name = `bld_${faction}_${type}`;
    if (name === 'bld_men_house' && Math.random() < 0.35) name = 'bld_men_house_alt';
    this.spriteName = name;
    // il rombo del disegno copre la pianta dell'edificio; lo sprite parte dal vertice anteriore
    const width = st.size * Math.SQRT2 * (type === 'farm' ? 1.0 : 1.08);
    this.sprite = this.place(makeSprite(name, { width, own: true }));
    this.site = this.place(makeSprite('bld_construction', { width: st.size * Math.SQRT2 * 0.98 }));
    this.mesh = new THREE.Group();
    this.ring = makeRing(st.size * 0.78);
    this.hpBar = makeHpBar(st.size * 0.8, screenUp(Math.max(0.6, this.sprite.scale.y - this.drop) + 0.15));
    this.mesh.add(this.ring, this.site, this.sprite, this.hpBar);
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.userData.entity = this;
    this.updateConstructionLook();
  }
  // lo sprite sta al centro dell'edificio (per l'ordine di disegno) ma il suo fondo coincide col vertice davanti
  place(sp) {
    this.drop = (this.size / Math.SQRT2) * SIN_P;
    sp.center.set(0.5, this.drop / sp.scale.y - 0.02);
    return sp;
  }
  get rect() { return { x0: this.cx, z0: this.cz, x1: this.cx + this.size - 1, z1: this.cz + this.size - 1 }; }
  updateConstructionLook() {
    this.site.visible = !this.built;
    this.sprite.visible = this.built || this.progress > 0.6;
    this.sprite.material.opacity = this.built ? 1 : (this.progress - 0.6) / 0.4;
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
