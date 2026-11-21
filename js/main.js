// ============================================================================
// GPverse — Ombra & Corona — avvio, camera, input e interfaccia
// Versione: vedi js/version.js (la storia delle versioni è in HISTORY e CHANGELOG.md)
// ============================================================================
import * as THREE from '../lib/three.module.js';
import { GAME_TITLE, BRAND, VERSION, HISTORY } from './version.js';
import { MAP_SIZE, RES, RES_LABEL, BUILDINGS, FACTIONS, NODES, ERAS, HEROES, XP_TABLE, CAM_YAW, CAM_PITCH } from './config.js';
import { loadAssets, url, makeSprite, resetMaterials } from './assets.js';
import { MAPS, RANDOM_MAP } from './maps.js';
import { Game } from './game.js';
import { AI } from './ai.js';
import { updateBars } from './entities.js';

const $ = (s) => document.querySelector(s);
const isTouch = matchMedia('(pointer: coarse)').matches;
let PLAYER = 'men';          // scelto nel menu a ogni partita
const SAVE_KEY = 'gpverse.ombra-corona.progress';

// ---- progressi salvati ------------------------------------------------------
function loadProgress() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
}
function saveProgress(p) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); } catch { /* storage non disponibile */ } }
let progress = Object.assign({ games: 0, wins: 0, losses: 0, bestWin: null, lastVersion: null, faction: 'men', map: 'valle' }, loadProgress());

// ---- renderer, scena, luci ----------------------------------------------------
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

let scene, game, ai;
// camera isometrica fissa (come in Age of Empires): niente rotazione, solo spostamento e zoom.
// cam.dist = quante celle si vedono in altezza
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
const cam = { tx: 12, tz: 50, yaw: CAM_YAW, pitch: CAM_PITCH, dist: 18 };

function makeScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1d2416);
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  updateProjection();
}
function updateProjection() {
  const a = window.innerWidth / window.innerHeight, vh = cam.dist;
  Object.assign(camera, { left: -vh * a / 2, right: vh * a / 2, top: vh / 2, bottom: -vh / 2 });
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function updateCamera() {
  cam.tx = Math.max(0, Math.min(MAP_SIZE, cam.tx));
  cam.tz = Math.max(0, Math.min(MAP_SIZE, cam.tz));
  cam.dist = Math.max(7, Math.min(34, cam.dist));
  if (cam.dist !== cam._lastDist) { cam._lastDist = cam.dist; updateProjection(); }
  const cp = Math.cos(cam.pitch), D = 120;
  camera.position.set(
    cam.tx + Math.sin(cam.yaw) * cp * D,
    Math.sin(cam.pitch) * D,
    cam.tz + Math.cos(cam.yaw) * cp * D
  );
  camera.lookAt(cam.tx, 0, cam.tz);
}
// sposta la camera rispetto allo schermo (dx destra, dz avanti)
function panCamera(dx, dz) {
  const s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
  cam.tx += dx * c - dz * s;
  cam.tz += -dx * s - dz * c;
}

// ---- raycast schermo → terreno ----------------------------------------------
const ray = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const ndc = new THREE.Vector2();
function screenToGround(sx, sy) {
  ndc.set((sx / window.innerWidth) * 2 - 1, -(sy / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const p = new THREE.Vector3();
  return ray.ray.intersectPlane(groundPlane, p) ? p : null;
}
const tmpV = new THREE.Vector3();
function toScreen(x, y, z) {
  tmpV.set(x, y, z).project(camera);
  return { x: (tmpV.x + 1) / 2 * window.innerWidth, y: (1 - tmpV.y) / 2 * window.innerHeight, front: tmpV.z < 1 };
}

// cosa c'è sotto il punto (unità → edificio → risorsa)
function pickAt(sx, sy) {
  let best = null, bd = isTouch ? 30 : 20;
  for (const u of game.units) {
    if (!u.alive) continue;
    const s = toScreen(u.x, 0.5, u.z);
    const d = Math.hypot(s.x - sx, s.y - sy);
    if (d < bd) { bd = d; best = u; }
  }
  if (best) return best;
  const p = screenToGround(sx, sy);
  if (!p) return null;
  // edifici: prima la pianta a terra, poi il disegno (tetti e torri)
  for (const b of game.buildings) {
    const r = b.rect;
    if (p.x >= r.x0 - 0.1 && p.x <= r.x1 + 1.1 && p.z >= r.z0 - 0.1 && p.z <= r.z1 + 1.1) return b;
  }
  const hits = ray.intersectObjects(game.buildings.map(b => b.built ? b.sprite : b.site), false);
  if (hits.length) {
    hits.sort((a, c) => (c.object.parent.position.x + c.object.parent.position.z) - (a.object.parent.position.x + a.object.parent.position.z));
    return hits[0].object.parent.userData.entity;
  }
  const gx = Math.floor(p.x), gz = Math.floor(p.z);
  // tolleranza di una cella per le risorse (alberi piccoli su smartphone)
  for (const [dx, dz] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]) {
    if (!game.grid.inside(gx + dx, gz + dz)) continue;
    const o = game.grid.owner[game.grid.idx(gx + dx, gz + dz)];
    if (o && o.kind === 'node' && o.alive) return o;
    if (!isTouch) break;
  }
  // alberi: il disegno è alto, si può toccare anche la chioma
  const trees = ray.intersectObjects(game.nodes.filter(n => n.alive && n.sprite).map(n => n.sprite), false);
  if (trees.length) {
    trees.sort((a, c) => (c.object.position.x + c.object.position.z) - (a.object.position.x + a.object.position.z));
    return trees[0].object.userData.node;
  }
  return null;
}

// ---- selezione ------------------------------------------------------------------
let selection = [];
function setSelection(list) {
  selection.forEach(e => { if (e.ring) e.ring.visible = false; });
  selection = list.filter(Boolean);
  selection.forEach(e => {
    if (e.ring) {
      e.ring.visible = true;
      e.ring.material.color.setHex(e.faction === PLAYER ? 0x7dff7d : e.kind === 'node' ? 0xffe27a : 0xff6b6b);
    }
  });
  if (selNodeMarker) selNodeMarker.visible = false;
  const n = selection.find(e => e.kind === 'node');
  if (n) showNodeMarker(n);
  refreshPanel(true);
}
let selNodeMarker = null;
function showNodeMarker(n) {
  if (!selNodeMarker) {
    selNodeMarker = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 20).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false }));
    selNodeMarker.renderOrder = 1;
    scene.add(selNodeMarker);
  }
  selNodeMarker.position.set(n.x + 0.5, 0.04, n.z + 0.5);
  selNodeMarker.visible = true;
}
const myUnits = () => selection.filter(e => e.kind === 'unit' && e.faction === PLAYER && e.alive);

function selectInBox(x0, y0, x1, y1) {
  const [a, b] = [Math.min(x0, x1), Math.max(x0, x1)];
  const [c, d] = [Math.min(y0, y1), Math.max(y0, y1)];
  const list = game.units.filter(u => {
    if (!u.alive || u.faction !== PLAYER) return false;
    const s = toScreen(u.x, 0.5, u.z);
    return s.x >= a && s.x <= b && s.y >= c && s.y <= d;
  });
  // come in AoE: se ci sono soldati, seleziona prima i soldati
  const mil = list.filter(u => u.isMilitary);
  setSelection(mil.length && mil.length !== list.length && list.length > 6 ? mil : list);
}

// ---- piazzamento edifici -----------------------------------------------------------
let placing = null; // { type, ghost, cx, cz, ok }
function startPlacing(type) {
  if (!game.canAfford(PLAYER, BUILDINGS[type].cost)) { toast('Risorse insufficienti'); return; }
  cancelPlacing();
  const s = BUILDINGS[type].size;
  // anteprima: rombo colorato a terra + disegno semitrasparente dell'edificio
  const ghost = new THREE.Group();
  const base = new THREE.Mesh(new THREE.PlaneGeometry(s, s).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x55ff55, transparent: true, opacity: 0.35, depthTest: false, depthWrite: false }));
  base.renderOrder = 1;
  const name = type === 'farm' || type === 'house' || type === 'barracks' ? `bld_${PLAYER}_${type}` : 'bld_construction';
  const pic = makeSprite(name, { width: s * Math.SQRT2 * 1.05, own: true });
  pic.center.set(0.5, (s / Math.SQRT2) * Math.sin(CAM_PITCH) / pic.scale.y);
  pic.material.opacity = 0.6;
  pic.renderOrder = 9;
  ghost.add(base, pic);
  ghost.userData.base = base;
  ghost.visible = false;
  scene.add(ghost);
  placing = { type, ghost, cx: 0, cz: 0, ok: false };
  toast(isTouch ? `Tocca il terreno per piazzare: ${FACTIONS[PLAYER].names[type]}` : `Clic per piazzare ${FACTIONS[PLAYER].names[type]} · tasto destro o Esc per annullare`);
}
function movePlacing(sx, sy) {
  if (!placing) return;
  const p = screenToGround(sx, sy);
  if (!p) return;
  const s = BUILDINGS[placing.type].size;
  placing.cx = Math.round(p.x - s / 2); placing.cz = Math.round(p.z - s / 2);
  placing.ok = game.canPlace(placing.type, placing.cx, placing.cz);
  placing.ghost.visible = true;
  placing.ghost.position.set(placing.cx + s / 2, 0, placing.cz + s / 2);
  placing.ghost.userData.base.material.color.setHex(placing.ok ? 0x55ff55 : 0xff4444);
}
function confirmPlacing() {
  if (!placing) return;
  if (!placing.ok) { toast('Non si può costruire qui'); return; }
  const b = game.placeBuilding(placing.type, PLAYER, placing.cx, placing.cz);
  if (b) {
    const v = myUnits().filter(u => u.type === 'villager');
    game.orderBuild(v, b);
    cancelPlacing();
  }
}
function cancelPlacing() {
  if (!placing) return;
  scene.remove(placing.ghost);
  placing = null;
}

// ---- comandi ----------------------------------------------------------------------
function command(sx, sy) {
  const p = screenToGround(sx, sy);
  if (!p) return;
  const target = pickAt(sx, sy);
  const units = myUnits();
  const b = selection.find(e => e.kind === 'building' && e.faction === PLAYER);
  if (!units.length && b && b.built) {
    b.rally = { x: p.x, z: p.z };
    toast('Punto di raccolta impostato');
    flagAt(p.x, p.z, 0x3b6fd6);
    return;
  }
  if (!units.length) return;
  game.smartOrder(units, target, p.x, p.z);
  const enemy = target && target.kind !== 'node' && target.faction !== PLAYER;
  flagAt(target ? target.x + (target.kind === 'node' ? 0.5 : 0) : p.x, target ? target.z + (target.kind === 'node' ? 0.5 : 0) : p.z, enemy ? 0xff4040 : 0x7dff7d);
}
// marcatore del comando che svanisce
const flags = [];
function flagAt(x, z, color) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.3, 16).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, depthTest: false, depthWrite: false }));
  m.renderOrder = 1;
  m.position.set(x, 0.05, z);
  scene.add(m);
  flags.push({ m, t: 0.7 });
}

// ---- input mouse / touch ---------------------------------------------------------
const pointers = new Map();
let drag = null;      // { x0, y0, mode: 'box'|'pan'|null, button }
let pinch = null;
let boxMode = false;
const boxEl = $('#selbox');

canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  if (!game) return;
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, dist: cam.dist };
    drag = null; boxEl.hidden = true;
    return;
  }
  drag = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, mode: null, button: e.button, touch: e.pointerType !== 'mouse', t: performance.now() };
});
canvas.addEventListener('pointermove', e => {
  if (!game) return;
  if (placing && e.pointerType === 'mouse') movePlacing(e.clientX, e.clientY);
  if (!pointers.has(e.pointerId)) return;
  const prev = pointers.get(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    cam.dist = pinch.dist * (pinch.d / Math.max(d, 1));
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    panCamera(-(cx - pinch.cx) * cam.dist / innerHeight, (cy - pinch.cy) * cam.dist / innerHeight / Math.sin(CAM_PITCH));
    pinch.cx = cx; pinch.cy = cy;
    return;
  }
  if (!drag) return;
  drag.x = e.clientX; drag.y = e.clientY;
  const moved = Math.hypot(drag.x - drag.x0, drag.y - drag.y0);
  if (!drag.mode && moved > (drag.touch ? 10 : 6)) {
    if (drag.button === 1 || (drag.touch && !boxMode)) drag.mode = 'pan';
    else if (drag.button === 0 && !placing) drag.mode = 'box';
    else drag.mode = 'none';
  }
  if (drag.mode === 'pan') {
    const k = cam.dist / innerHeight;
    panCamera(-(e.clientX - prev.x) * k, (e.clientY - prev.y) * k / Math.sin(CAM_PITCH));
  } else if (drag.mode === 'box') {
    Object.assign(boxEl.style, {
      left: Math.min(drag.x0, drag.x) + 'px', top: Math.min(drag.y0, drag.y) + 'px',
      width: Math.abs(drag.x - drag.x0) + 'px', height: Math.abs(drag.y - drag.y0) + 'px',
    });
    boxEl.hidden = false;
  }
});
let lastClick = { t: 0, e: null };
function endPointer(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
  if (!drag || !game) return;
  const d = drag; drag = null;
  boxEl.hidden = true;
  if (d.mode === 'box') { selectInBox(d.x0, d.y0, d.x, d.y); if (boxMode) toggleBoxMode(false); return; }
  if (d.mode) return;
  // clic / tap
  if (d.touch) return tap(d.x, d.y);
  if (d.button === 2) { if (placing) cancelPlacing(); else command(d.x, d.y); return; }
  if (d.button !== 0) return;
  if (placing) { movePlacing(d.x, d.y); confirmPlacing(); return; }
  const t = pickAt(d.x, d.y);
  const now = performance.now();
  // doppio clic: tutte le unità dello stesso tipo sullo schermo
  if (t && t.kind === 'unit' && t.faction === PLAYER && lastClick.e === t && now - lastClick.t < 350) {
    setSelection(game.units.filter(u => u.alive && u.faction === PLAYER && u.type === t.type && toScreen(u.x, 0.5, u.z).front &&
      (() => { const s = toScreen(u.x, 0.5, u.z); return s.x > 0 && s.y > 0 && s.x < innerWidth && s.y < innerHeight; })()));
  } else setSelection(t ? [t] : []);
  lastClick = { t: now, e: t };
}
// su touch: un tap seleziona le proprie cose, altrimenti dà un ordine alla selezione
function tap(x, y) {
  if (placing) { movePlacing(x, y); confirmPlacing(); return; }
  const t = pickAt(x, y);
  const mine = t && t.kind !== 'node' && t.faction === PLAYER;
  const hasUnits = myUnits().length > 0;
  const hasBuilding = selection.some(e => e.kind === 'building' && e.faction === PLAYER);
  if (mine && !(hasUnits && t.kind === 'building' && !t.built)) { setSelection([t]); return; }
  if (hasUnits || (hasBuilding && !t)) { command(x, y); return; }
  setSelection(t ? [t] : []);
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', e => { e.preventDefault(); cam.dist *= e.deltaY > 0 ? 1.1 : 0.9; }, { passive: false });

const keys = new Set();
window.addEventListener('keydown', e => {
  if (!game || e.target.tagName === 'INPUT') return;
  keys.add(e.key.toLowerCase());
  const k = e.key.toLowerCase();
  if (k === 'escape') { if (placing) cancelPlacing(); else if ($('#history').open) $('#history').close(); else setSelection([]); }
  if (k === 'h') { const tc = game.buildings.find(b => b.faction === PLAYER && b.type === 'tc'); if (tc) { setSelection([tc]); cam.tx = tc.x; cam.tz = tc.z; } }
  if (k === 'p') togglePause();
  if (k === '1' || k === '2' || k === '3') castAbility(+k - 1);
  if (k === 'r') selectHero();
  if (k === 'c' && myUnits().some(u => u.type === 'villager')) startPlacing('house');
  if (k === 'b' && myUnits().some(u => u.type === 'villager')) startPlacing('barracks');
  if (k === 'f' && myUnits().some(u => u.type === 'villager')) startPlacing('farm');
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

function keyboardCamera(dt) {
  const sp = cam.dist * 1.1 * dt;
  let dx = 0, dz = 0;
  if (keys.has('w') || keys.has('arrowup')) dz += sp;
  if (keys.has('s') || keys.has('arrowdown')) dz -= sp;
  if (keys.has('a') || keys.has('arrowleft')) dx -= sp;
  if (keys.has('d') || keys.has('arrowright')) dx += sp;
  if (dx || dz) panCamera(dx, dz);
}

// pulsanti a schermo (utili soprattutto su smartphone)
$('#zoomIn').onclick = () => { cam.dist *= 0.8; };
$('#zoomOut').onclick = () => { cam.dist *= 1.25; };
function toggleBoxMode(v = !boxMode) { boxMode = v; $('#boxBtn').classList.toggle('on', boxMode); if (boxMode) toast('Trascina per selezionare un gruppo'); }
$('#boxBtn').onclick = () => toggleBoxMode();
if (!isTouch) $('#boxBtn').hidden = true;

// ---- interfaccia -------------------------------------------------------------------
let toastTimer = null;
function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

const ico = (k, cls = 'ico') => `<img class="${cls}" src="${url('icon_' + k)}" alt="${RES_LABEL[k] || k}">`;
function costText(cost) {
  const res = game ? game.players[PLAYER].res : {};
  return Object.entries(cost).map(([k, v]) => `<span class="${res[k] < v ? 'miss' : ''}">${ico(k)}${v}</span>`).join(' ');
}
function renderTopBar() {
  const s = game.stats(PLAYER);
  $('#res').innerHTML = RES.map(r => `<span title="${RES_LABEL[r]}">${ico(r)}<b>${Math.floor(s.res[r])}</b></span>`).join('') +
    `<span title="Popolazione" class="${s.pop >= s.cap ? 'full' : ''}">${ico('pop')}<b>${s.pop}/${s.cap}</b></span>`;
  const t = Math.floor(game.time);
  $('#clock').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  $('#era').textContent = ERAS[game.players[PLAYER].era].name;
  const hero = myHero();
  $('#heroBtn').classList.toggle('dead', !hero);
}
const myHero = () => game && game.units.find(u => u.alive && u.faction === PLAYER && u.isHero);

const STATE_TEXT = { idle: 'In attesa', move: 'In marcia', attack: 'In combattimento', attackMove: 'Avanza all\'attacco', build: 'Costruisce' };
function unitStatus(u) {
  if (u.state === 'gather') {
    const what = NODES[u.gatherType]?.res;
    return u.phase === 'drop' ? `Porta ${RES_LABEL[u.carryRes] || ''} al centro` : `Raccoglie ${RES_LABEL[what] || ''} (${Math.floor(u.carry)}/10)`;
  }
  let t = STATE_TEXT[u.state] || u.state;
  if (u.buffUntil > game.time) t += ' · rinvigorito';
  if (u.slowUntil > game.time) t += ' · rallentato';
  return t;
}
const queueLabel = (f, type) => type === 'era' ? `Avanzamento alla ${ERAS[game.players[f].era + 1]?.name || ''}` : FACTIONS[f].names[type];

let panelKey = '';
function refreshPanel(force = false) {
  const el = $('#panel');
  const sel = selection.filter(e => e.alive !== false);
  if (sel.length !== selection.length) { selection = sel; }
  if (!sel.length) {
    if (panelKey !== 'none' || force) {
      panelKey = 'none';
      el.innerHTML = `<div class="hint">${isTouch ? 'Tocca un\'unità per selezionarla, poi tocca il terreno per darle un ordine.' : 'Clic sinistro: seleziona · trascina: selezione a riquadro · clic destro: ordine · WASD/frecce: camera · H: centro città · R: eroe · 1/2/3: abilità'}</div>`;
    }
    return;
  }
  const e = sel[0];
  let info = '', buttons = [], qbar = null;
  const NODE_PIC = { tree: 'res_tree_1', bush: 'res_bush', stone: 'res_stone', gold: 'res_gold' };
  const portrait = e.kind === 'node' ? NODE_PIC[e.type] : e.spriteName;
  if (e.kind === 'node') {
    info = `<h3>${NODES[e.type].label}</h3><p>${ico(e.res)} ${Math.ceil(e.amount)} rimasti</p>`;
  } else if (sel.length > 1) {
    const by = {};
    sel.forEach(u => { const n = FACTIONS[u.faction].names[u.type]; by[n] = (by[n] || 0) + 1; });
    info = `<h3>${sel.length} unità</h3><p>${Object.entries(by).map(([n, c]) => `${c} × ${n}`).join(' · ')}</p>`;
  } else {
    const name = FACTIONS[e.faction].names[e.type];
    info = `<h3>${name}</h3><p class="fac" style="color:#${FACTIONS[e.faction].color.toString(16).padStart(6, '0')}">${FACTIONS[e.faction].name}</p>` +
      `<div class="hp"><i style="width:${Math.max(0, e.hp / e.maxHp * 100)}%"></i><span>${Math.ceil(e.hp)}/${e.maxHp}</span></div>`;
    if (e.kind === 'unit') info += `<p>${unitStatus(e)}</p>`;
    if (e.isHero) {
      const next = XP_TABLE[e.level + 1];
      const cap = game.maxLevel(e.faction);
      const xpTxt = e.level >= cap ? (cap < 10 ? `Livello massimo per questa era (${cap})` : 'Livello massimo') : `XP ${Math.floor(e.xp)}/${next}`;
      const pct = next && e.level < cap ? (e.xp - XP_TABLE[e.level]) / (next - XP_TABLE[e.level]) * 100 : 100;
      info += `<p>Livello <b>${e.level}</b> · Attacco ${e.attack}</p><div class="xp"><i style="width:${Math.min(100, pct)}%"></i><span>${xpTxt}</span></div>`;
    }
    if (e.kind === 'building') {
      if (!e.built) info += `<p>In costruzione: ${Math.floor(e.progress * 100)}%</p>`;
      else if (e.type === 'farm') info += `<p>${ico('food')} Cibo infinito · contadini al lavoro: ${game.units.filter(u => u.alive && u.state === 'gather' && u.target === e).length}</p>`;
      else if (e.queue.length) {
        const q = e.queue[0];
        const pct = Math.min(100, q.t / q.time * 100);
        const blocked = q.type !== 'era' && game.pop(e.faction) >= game.popCap(e.faction);
        const left = Math.max(0, Math.ceil(q.time - q.t));
        // la barra si aggiorna da sola (vedi fine di refreshPanel) senza ridisegnare i pulsanti
        qbar = { pct, text: blocked ? 'In pausa' : `${Math.floor(pct)}% · ${left} s` };
        info += `<p>${q.type === 'era' ? '' : 'Addestra '}<b>${queueLabel(e.faction, q.type)}</b></p>` +
          `<div class="qbar ${blocked ? 'stop' : ''}"><i></i><span></span></div>`;
        if (blocked && e.faction === PLAYER) info += `<p class="warn">Popolazione al massimo (${game.pop(PLAYER)}/${game.popCap(PLAYER)}): fai costruire una Casa a un contadino.</p>`;
        if (e.faction === PLAYER) info += `<div class="queue">${e.queue.map((x, i) =>
          `<button data-cmd="unq-${i}" title="Annulla"><img src="${url(x.type === 'era' ? 'emblem' : `unit_${PLAYER}_${x.type}`)}" alt=""></button>`).join('')}</div>`;
      }
    }
  }
  if (e.faction === PLAYER) {
    const units = sel.filter(x => x.kind === 'unit');
    if (units.some(u => u.type === 'villager')) {
      for (const t of ['house', 'farm', 'barracks']) {
        const c = BUILDINGS[t].cost;
        buttons.push({ id: 'build-' + t, label: `Costruisci ${FACTIONS[PLAYER].names[t]}`, sub: costText(c), key: { house: 'C', farm: 'F', barracks: 'B' }[t], ok: true, cls: game.canAfford(PLAYER, c) ? '' : 'poor', pic: url(`bld_${PLAYER}_${t}`) });
      }
    }
    // abilità dell'eroe
    const hero = units.find(u => u.isHero);
    if (hero) {
      HEROES[PLAYER].abilities.forEach((a, i) => {
        const why = game.abilityReady(hero, i);
        buttons.push({ id: 'ab-' + i, label: a.name, sub: why || (isTouch ? 'Pronta' : a.desc), key: String(i + 1), ok: !why, cls: 'ability', pic: url('ability_' + a.id) });
      });
    }
    if (units.length) buttons.push({ id: 'stop', label: 'Ferma', sub: '', ok: true });
    if (e.kind === 'building' && e.built && sel.length === 1) {
      const list = [...BUILDINGS[e.type].trains];
      if (e.type === 'tc') list.push('era');
      for (const t of list) {
        const block = game.trainBlock(e, t);
        if (t === 'era' && block === 'Era massima raggiunta') continue;
        const info = game.queueInfo(PLAYER, t);
        const revive = t === 'hero' && game.players[PLAYER].heroData;
        const label = t === 'era' ? `Avanza alla ${ERAS[game.players[PLAYER].era + 1].name}` : t === 'hero' ? `${revive ? 'Rianima' : 'Evoca'} ${FACTIONS[PLAYER].names.hero}` : `Addestra ${FACTIONS[PLAYER].names[t]}`;
        const locked = block && block.startsWith('Serve');
        buttons.push({ id: 'train-' + t, label, sub: block && t !== 'villager' ? block : costText(info.cost), ok: !block, cls: (t === 'era' ? 'era' : t === 'hero' ? 'ability' : locked ? 'locked' : '') + (game.canAfford(PLAYER, info.cost) ? '' : ' poor'), pic: url(t === 'era' ? 'emblem' : `unit_${PLAYER}_${t}`) });
      }
      if (e.queue.length) buttons.push({ id: 'cancel', label: 'Annulla ultimo', sub: '', ok: true });
    }
  }
  buttons.push({ id: 'desel', label: '✕', sub: '', ok: true, small: true });
  const cmds = buttons.map(b =>
    `<button data-cmd="${b.id}" class="${b.small ? 'small' : ''} ${b.cls || ''}" ${b.ok ? '' : 'disabled'}>${b.pic ? `<img class="pic" src="${b.pic}" alt="">` : ''}<span class="lbl">${b.label}${b.sub ? `<small>${b.sub}</small>` : ''}</span>${b.key && !isTouch ? `<kbd>${b.key}</kbd>` : ''}</button>`).join('');
  // si ridisegna solo la parte cambiata: così un clic non va perso mentre il pannello si aggiorna
  if (force || panelKey !== 'sel:' + portrait || !el.querySelector('.info')) {
    panelKey = 'sel:' + portrait;
    el.innerHTML = `${portrait ? `<img class="portrait" src="${url(portrait)}" alt="">` : ''}<div class="info"></div><div class="cmds"></div>`;
  }
  const infoEl = el.querySelector('.info'), cmdsEl = el.querySelector('.cmds');
  if (infoEl.dataset.html !== info) { infoEl.innerHTML = info; infoEl.dataset.html = info; }
  if (cmdsEl.dataset.html !== cmds) { cmdsEl.innerHTML = cmds; cmdsEl.dataset.html = cmds; }
  const qb = infoEl.querySelector('.qbar');
  if (qb && qbar) { qb.querySelector('i').style.width = qbar.pct + '%'; qb.querySelector('span').textContent = qbar.text; }
}
$('#panel').addEventListener('click', ev => {
  const btn = ev.target.closest('button[data-cmd]');
  if (!btn || !game) return;
  const cmd = btn.dataset.cmd;
  const b = selection[0];
  if (cmd.startsWith('build-')) {
    const t = cmd.slice(6);
    if (!explainMissing(BUILDINGS[t].cost)) startPlacing(t);
  } else if (cmd.startsWith('train-')) {
    const t = cmd.slice(6);
    if (!explainMissing(game.queueInfo(PLAYER, t).cost) && game.train(b, t)) {
      if (t !== 'era' && game.pop(PLAYER) + b.queue.length > game.popCap(PLAYER))
        toast(`In coda. Posti liberi: ${Math.max(0, game.popCap(PLAYER) - game.pop(PLAYER))} (${game.pop(PLAYER)}/${game.popCap(PLAYER)}): costruisci una Casa per gli altri`);
      else toast(`${queueLabel(PLAYER, t)} in coda`);
    }
  } else if (cmd.startsWith('unq-')) { game.cancelTrain(b, +cmd.slice(4)); toast('Annullato, risorse restituite'); }
  else if (cmd === 'cancel') game.cancelTrain(b);
  else if (cmd.startsWith('ab-')) castAbility(+cmd.slice(3));
  else if (cmd === 'stop') myUnits().forEach(u => { u.state = 'idle'; u.path = []; u.target = null; });
  else if (cmd === 'desel') { cancelPlacing(); setSelection([]); }
  refreshPanel(true);
});

// spiega cosa manca per pagare un costo; true se manca qualcosa
function explainMissing(cost) {
  const miss = game.missing(PLAYER, cost);
  const keys = Object.keys(miss);
  if (!keys.length) return false;
  toast(`Risorse insufficienti: mancano ${keys.map(k => `${miss[k]} ${RES_LABEL[k].toLowerCase()}`).join(', ')}`);
  return true;
}

// ---- eroe ------------------------------------------------------------------------------
function castAbility(i) {
  const h = myUnits().find(u => u.isHero) || myHero();
  if (!h) { toast('Nessun eroe in campo'); return; }
  const why = game.abilityReady(h, i);
  if (why) { toast(why); return; }
  game.cast(h, i);
  refreshPanel(true);
}
function selectHero() {
  const h = myHero();
  if (!h) {
    const pd = game.players[PLAYER];
    toast(pd.era < HEROES[PLAYER].era ? `L'eroe arriva nella ${ERAS[HEROES[PLAYER].era].name}` : pd.heroData ? 'L\'eroe è caduto: rianimalo dal Centro Città' : 'Evoca l\'eroe dal Centro Città');
    return;
  }
  setSelection([h]); cam.tx = h.x; cam.tz = h.z;
}
$('#heroBtn').onclick = selectHero;

// effetti visivi delle abilità: un anello che si espande
const effects = [];
function abilityEffect(h, a, radius, color, target) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
  m.renderOrder = 1;
  const at = target || h;
  m.position.set(at.x, 0.08, at.z);
  scene.add(m);
  effects.push({ m, t: 0, life: 0.6, radius });
  if (target) { // fulmine: colonna di luce sul bersaglio
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 6, 5),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false }));
    bolt.renderOrder = 4;
    bolt.position.set(target.x, 3, target.z);
    scene.add(bolt);
    effects.push({ m: bolt, t: 0, life: 0.35, bolt: true });
  }
  if (h.faction === PLAYER || target?.faction === PLAYER) toast(`${FACTIONS[h.faction].names.hero}: ${a.name}!`);
}
function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    const f = effects[i]; f.t += dt;
    const k = f.t / f.life;
    if (!f.bolt) f.m.scale.setScalar(Math.max(0.01, f.radius * Math.min(1, k * 1.4)));
    f.m.material.opacity = Math.max(0, 0.9 * (1 - k));
    if (k >= 1) { scene.remove(f.m); f.m.geometry.dispose(); f.m.material.dispose(); effects.splice(i, 1); }
  }
}
// annuncio grande (cambio d'era)
function banner(title, sub) {
  const el = $('#banner');
  el.innerHTML = `<b>${title}</b>${sub ? `<span>${sub}</span>` : ''}`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

// ---- minimappa ---------------------------------------------------------------------
const mini = $('#minimap');
const mctx = mini.getContext('2d');
function drawMinimap() {
  const W = mini.width, k = W / MAP_SIZE;
  // sfondo: il terreno dipinto della partita, rimpicciolito
  mctx.drawImage(game.groundCanvas, 0, 0, W, W);
  mctx.fillStyle = 'rgba(0,0,0,0.15)'; mctx.fillRect(0, 0, W, W);
  const col = { tree: '#1f4424', bush: '#c23a4a', stone: '#9aa0a6', gold: '#f2c84b' };
  for (const n of game.nodes) { if (!n.alive) continue; mctx.fillStyle = col[n.type]; mctx.fillRect(n.x * k, n.z * k, k, k); }
  for (const b of game.buildings) {
    mctx.fillStyle = '#' + FACTIONS[b.faction].color.toString(16).padStart(6, '0');
    mctx.fillRect(b.cx * k, b.cz * k, b.size * k, b.size * k);
  }
  for (const u of game.units) {
    mctx.fillStyle = u.isHero ? (u.faction === PLAYER ? '#ffd75e' : '#c9f3ff') : u.faction === PLAYER ? '#8fb6ff' : '#ff7a70';
    const sz = u.isHero ? 5 : 3;
    mctx.fillRect(u.x * k - sz / 2, u.z * k - sz / 2, sz, sz);
  }
  // area inquadrata
  const corners = [[0, 0], [innerWidth, 0], [innerWidth, innerHeight], [0, innerHeight]].map(([x, y]) => screenToGround(x, y));
  if (corners.every(Boolean)) {
    mctx.strokeStyle = '#fff'; mctx.lineWidth = 1;
    mctx.beginPath();
    corners.forEach((p, i) => { const x = p.x * k, y = p.z * k; i ? mctx.lineTo(x, y) : mctx.moveTo(x, y); });
    mctx.closePath(); mctx.stroke();
  }
}
function miniJump(e) {
  const r = mini.getBoundingClientRect();
  cam.tx = (e.clientX - r.left) / r.width * MAP_SIZE;
  cam.tz = (e.clientY - r.top) / r.height * MAP_SIZE;
}
mini.addEventListener('pointerdown', e => { miniJump(e); mini.setPointerCapture(e.pointerId); mini.dataset.drag = '1'; });
mini.addEventListener('pointermove', e => { if (mini.dataset.drag) miniJump(e); });
mini.addEventListener('pointerup', () => { delete mini.dataset.drag; });

// ---- storia delle versioni ---------------------------------------------------------
function renderHistory() {
  $('#historyList').innerHTML = HISTORY.map(h => `
    <article>
      <header><b>${h.version}</b> <span>${h.title}</span> <time>${h.date}</time></header>
      <ul>${h.changes.map(c => `<li>${c}</li>`).join('')}</ul>
    </article>`).join('');
}
function openHistory() { renderHistory(); $('#history').showModal(); }
document.querySelectorAll('.version-badge').forEach(el => { el.textContent = VERSION; el.onclick = openHistory; });
$('#historyBtn').onclick = openHistory;
$('#historyClose').onclick = () => $('#history').close();

// ---- schermate --------------------------------------------------------------------------
document.title = `${GAME_TITLE} · ${BRAND} ${VERSION}`;
function renderStats() {
  const p = progress;
  $('#stats').textContent = p.games
    ? `Partite: ${p.games} · Vittorie: ${p.wins} · Sconfitte: ${p.losses}${p.bestWin ? ` · Vittoria più rapida: ${fmtTime(p.bestWin)}` : ''}`
    : 'Nessuna partita giocata finora';
}
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
renderStats();
// novità: se è uscita una nuova versione dall'ultima volta, mostro la storia
if (progress.lastVersion && progress.lastVersion !== VERSION) { $('#newBadge').hidden = false; }
progress.lastVersion = VERSION; saveProgress(progress);

let paused = false;
function togglePause(v = !paused) {
  if (!game || game.over) return;
  paused = v;
  $('#pause').hidden = !paused;
}
$('#menuBtn').onclick = () => togglePause(true);
$('#resume').onclick = () => togglePause(false);
$('#quit').onclick = () => { togglePause(false); backToMenu(); };

function startGame() {
  const difficulty = $('#difficulty').value;
  PLAYER = selectedFaction;
  const map = $('#mapSel').value;
  progress.faction = PLAYER; progress.map = map; saveProgress(progress);
  if (game) disposeScene();
  makeScene();
  game = new Game(scene, { difficulty, player: PLAYER, map });
  ai = new AI(game, game.enemy);
  game.on('message', toast);
  game.on('ability', abilityEffect);
  game.on('level', h => { if (h.faction === PLAYER) toast(`${FACTIONS[PLAYER].names.hero} sale al livello ${h.level}!`); });
  game.on('era', (f, era) => {
    if (f !== PLAYER) return;
    const unlock = era === 2 ? `Sbloccati: ${FACTIONS[PLAYER].names.archer} e ${FACTIONS[PLAYER].names.hero}` : `Sbloccati: ${FACTIONS[PLAYER].names.knight} · eroe fino al livello 10`;
    banner(ERAS[era].name, unlock);
  });
  game.on('died', e => { if (selection.includes(e)) setSelection(selection.filter(x => x !== e)); });
  game.on('over', result => {
    progress.games++;
    if (result === 'win') { progress.wins++; progress.bestWin = progress.bestWin ? Math.min(progress.bestWin, game.time) : game.time; }
    else progress.losses++;
    saveProgress(progress);
    $('#overTitle').textContent = result === 'win' ? 'Vittoria!' : 'Sconfitta';
    $('#overText').textContent = result === 'win'
      ? `La base nemica (${FACTIONS[game.enemy].names.tc}) è caduta in ${fmtTime(game.time)}. ${FACTIONS[PLAYER].name}: vittoria!`
      : `La vostra base (${FACTIONS[PLAYER].names.tc}) è stata distrutta. Vince ${FACTIONS[game.enemy].name}.`;
    $('#over').hidden = false;
  });
  const tc = game.buildings.find(b => b.faction === PLAYER && b.type === 'tc');
  Object.assign(cam, { tx: tc.x + 3, tz: tc.z - 1, dist: innerWidth < innerHeight ? 22 : 16 });
  selection = []; placing = null; paused = false; selNodeMarker = null; flags.length = 0; effects.length = 0;
  $('#start').hidden = true; $('#over').hidden = true; $('#hud').hidden = false;
  refreshPanel(true);
  toast(`${game.map.name}: raccogli risorse, costruisci case e una caserma. Distruggi la base nemica (${FACTIONS[game.enemy].names.tc})!`);
  $('#mapInfo').textContent = `${game.map.name} · seme ${game.seed} · ${FACTIONS[PLAYER].name}`;
}
function disposeScene() {
  resetMaterials();
  scene.traverse(o => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
}
function backToMenu() {
  $('#hud').hidden = true; $('#over').hidden = true; $('#start').hidden = false;
  renderStats();
  if (game) { disposeScene(); game = null; }
}
// scelta della fazione e della mappa
let selectedFaction = progress.faction || 'men';
function renderFactionPick() {
  $('#factionPick').innerHTML = Object.entries(FACTIONS).map(([id, f]) => `
    <button data-f="${id}" class="${id === selectedFaction ? 'on' : ''}" style="--fc:#${f.color.toString(16).padStart(6, '0')}">
      <img src="${url(`unit_${id}_hero`)}" alt=""><b>${f.name}</b><small>Eroe: ${f.names.hero}</small>
    </button>`).join('');
}
$('#factionPick').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-f]');
  if (!b) return;
  selectedFaction = b.dataset.f; renderFactionPick();
});
renderFactionPick();
$('#mapSel').innerHTML = MAPS.map(m => `<option value="${m.id}">${m.name}</option>`).join('') + `<option value="${RANDOM_MAP}">Casuale</option>`;
$('#mapSel').value = progress.map || 'valle';
const mapDesc = () => { const m = MAPS.find(x => x.id === $('#mapSel').value); $('#mapDesc').textContent = m ? m.desc : 'Un tipo di mappa a sorpresa'; };
$('#mapSel').onchange = mapDesc; mapDesc();
$('#play').onclick = startGame;
// la partita parte solo quando la grafica è caricata
$('#play').disabled = true;
$('#play').textContent = 'Caricamento grafica… 0%';
loadAssets(p => { $('#play').textContent = `Caricamento grafica… ${Math.round(p * 100)}%`; })
  .then(() => { $('#play').disabled = false; $('#play').textContent = 'Partita libera'; })
  .catch(err => { $('#play').textContent = 'Errore nel caricare la grafica'; console.error(err); });
$('#again').onclick = startGame;
$('#toMenu').onclick = backToMenu;

// ---- ciclo principale -------------------------------------------------------------
let last = performance.now(), uiT = 0, miniT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game) return;
  keyboardCamera(dt);
  updateCamera();
  if (!paused) { game.update(dt); ai.update(dt); }
  for (const u of game.units) updateBars(u, camera, selection.includes(u));
  for (const b of game.buildings) updateBars(b, camera, selection.includes(b));
  updateEffects(dt);
  for (let i = flags.length - 1; i >= 0; i--) {
    const f = flags[i]; f.t -= dt;
    f.m.material.opacity = Math.max(0, f.t / 0.7); f.m.scale.setScalar(1 + (0.7 - f.t));
    if (f.t <= 0) { scene.remove(f.m); flags.splice(i, 1); }
  }
  if (selNodeMarker && selection[0]?.kind === 'node' && !selection[0].alive) setSelection([]);
  uiT -= dt; miniT -= dt;
  if (uiT <= 0) { uiT = 0.2; renderTopBar(); refreshPanel(); }
  if (miniT <= 0) { miniT = 0.25; drawMinimap(); }
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

// accesso per i test automatici
window.__ombra = { get game() { return game; }, get ai() { return ai; }, startGame, cam, setSelection, command, VERSION };
