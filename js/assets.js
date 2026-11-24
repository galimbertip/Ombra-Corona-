// GPverse — Ombra & Corona — caricamento della grafica (dalla V.0.3.0)
// Le immagini sono generate con Arena AI (originali in assets/raw), ripulite e ridimensionate in assets/sprites.
import * as THREE from '../lib/three.module.js';

export const DIR = 'assets/sprites/';
const V = '?v=' + (window.BUILD || '');
export const url = (name) => `${DIR}${name}.webp${V}`;
export const tex = {};
export const sizes = {};

// unità ed edifici di ogni popolo (dalla V.0.6.0 sono quattro)
const PEOPLES = ['men', 'shadow', 'elves', 'dwarves'];
const SPRITES = [
  ...PEOPLES.flatMap(f => ['villager', 'soldier', 'archer', 'knight', 'hero'].map(t => `unit_${f}_${t}`)),
  ...PEOPLES.flatMap(f => ['tc', 'house', 'barracks', 'farm'].map(t => `bld_${f}_${t}`)),
  'bld_men_house_alt', 'bld_construction',
  ...['bjarn', 'eagle', 'dragon', 'flame', 'troll', 'wolf'].map(c => `creature_${c}`),
  ...['crown', 'rift', 'lair', 'eagle_nest', 'deep_mine', 'bear_hut', 'troll_cave', 'ruins'].map(o => `obj_${o}`),
  'icon_crown',
  'res_tree_1', 'res_tree_2', 'res_tree_3', 'res_bush', 'res_stone', 'res_gold',
  'ground_grass', 'ground_ash', 'ground_dirt',
];

let loading = null;
export function loadAssets(onProgress = () => {}) {
  if (loading) return loading;
  const loader = new THREE.TextureLoader();
  let done = 0;
  loading = fetch(`${DIR}sizes.json${V}`).then(r => r.json()).then(s => {
    Object.assign(sizes, s);
    return Promise.all(SPRITES.map(name => loader.loadAsync(url(name)).then(t => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      tex[name] = t;
      onProgress(++done / SPRITES.length);
    })));
  });
  return loading;
}

// rapporto larghezza / altezza di un'immagine
export const aspect = (name) => sizes[name] ? sizes[name][0] / sizes[name][1] : 1;

// materiali condivisi (uno per immagine)
const mats = {};
export function spriteMaterial(name) {
  if (!mats[name]) mats[name] = new THREE.SpriteMaterial({ map: tex[name], transparent: true, depthTest: false, depthWrite: false });
  return mats[name];
}
export function resetMaterials() { for (const k of Object.keys(mats)) delete mats[k]; }

// tinta della stagione (V.0.5.0): applicata a tutti gli sprite
export const TINT = new THREE.Color(1, 1, 1);
export function applyTint() { for (const k of Object.keys(mats)) mats[k].color.copy(TINT); }

// sprite con i piedi a terra: larghezza o altezza in unità di mondo
export function makeSprite(name, { width, height, own = false } = {}) {
  const ar = aspect(name);
  const h = height ?? width / ar;
  const w = width ?? h * ar;
  const mat = own ? spriteMaterial(name).clone() : spriteMaterial(name);
  const s = new THREE.Sprite(mat);
  s.center.set(0.5, 0);
  s.scale.set(w, h, 1);
  s.renderOrder = 2;
  s.userData.size = { w, h };
  return s;
}
