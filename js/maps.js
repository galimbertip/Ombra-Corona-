// GPverse — Ombra & Corona — ambientazioni (tipi di mappa, dalla V.0.4.0; ambientazioni complete dalla V.0.8.0)
// Ogni partita genera una mappa nuova a partire da un "seme" (seed): basi, boschi e risorse
// sono messi a caso, ma con lo stesso seme e la stessa ambientazione si ottiene sempre la stessa mappa.
//
// Ogni ambientazione decide:
//   forests / extra / ridges  → boschi, risorse contese e creste di roccia
//   ground                    → terreno di base, quanta terra battuta e una tinta
//   tint                      → colore della luce (si somma a quello della stagione)
//   seasons                   → durata delle stagioni (moltiplicatori) e neve fissa
//   sites / pairs / roam      → quali luoghi e creature ci sono (Corona e Fenditura ci sono sempre)
//       sites: luoghi singoli sulla linea tra le basi (lair = Drago, eagle_nest, bear_hut = Bjarn, deep_mine)
//       pairs: luoghi con guardiani, uno per base (ruins = lupi, troll_cave = troll); al massimo 2
//       roam:  creature che vagano al centro
// Per aggiungere un'ambientazione basta aggiungere una voce qui sotto.

export const MAPS = [
  {
    id: 'valle',
    name: 'Valle di Mezzo',
    desc: 'Equilibrata: boschi sparsi, miniere contese al centro. Lupi nelle rovine, Bjarn e le Aquile',
    forests: { count: 22, min: 8, max: 26, spread: 7 },
    extra: { gold: 2, stone: 2, bush: 2 },
    sites: ['bear_hut', 'eagle_nest'],
    pairs: ['ruins'],
    roam: { wolf: 2 },
  },
  {
    id: 'foreste',
    name: 'Foreste Antiche',
    desc: 'Boschi fitti e radure strette. Branchi di lupi ovunque, Bjarn vive nel cuore della foresta',
    forests: { count: 40, min: 14, max: 34, spread: 9 },
    extra: { gold: 2, stone: 1, bush: 1 },
    ground: { tint: 'rgba(10,40,10,0.18)' },
    tint: [0.92, 1, 0.9],
    wild: 0x3a4d32,
    sites: ['bear_hut'],
    pairs: ['ruins', 'ruins'],
    roam: { wolf: 4 },
  },
  {
    id: 'aperte',
    name: 'Terre Aperte',
    desc: 'Pianure con pochi boschi e molte miniere: si combatte presto. Troll, Aquile e la Miniera Profonda',
    forests: { count: 10, min: 6, max: 16, spread: 6 },
    extra: { gold: 5, stone: 4, bush: 4 },
    ground: { tint: 'rgba(120,110,40,0.10)' },
    tint: [1.02, 1, 0.92],
    sites: ['eagle_nest', 'deep_mine'],
    pairs: ['troll_cave'],
    roam: {},
  },
  {
    id: 'monti',
    name: 'Monti Grigi',
    desc: 'Creste di roccia, valichi stretti e tanto oro. Troll nelle grotte, il Drago e la Miniera Profonda',
    forests: { count: 9, min: 5, max: 12, spread: 5 },
    extra: { gold: 4, stone: 3, bush: 1 },
    ridges: { count: 9, min: 6, max: 13 },
    ground: { base: 'dirt', dirt: 0.6, tint: 'rgba(90,90,100,0.25)' },
    tint: [0.93, 0.95, 1],
    wild: 0x55554f,
    sites: ['lair', 'deep_mine', 'eagle_nest'],
    pairs: ['troll_cave', 'troll_cave'],
    roam: {},
  },
  {
    id: 'lande',
    name: 'Lande Bruciate',
    desc: 'Cenere e alberi morti, poco cibo e molto oro. Il Drago fa la guardia al suo tesoro',
    forests: { count: 8, min: 4, max: 10, spread: 5 },
    extra: { gold: 4, stone: 2, bush: 1 },
    ground: { base: 'ash', dirt: 1.2, tint: 'rgba(90,30,0,0.12)' },
    tint: [1.04, 0.93, 0.86],
    wild: 0x3d3430,
    sites: ['lair', 'deep_mine'],
    pairs: ['ruins'],
    roam: { wolf: 2 },
  },
  {
    id: 'gelide',
    name: 'Terre Gelide',
    desc: 'Il Nord: inverni lunghissimi e neve anche d\'estate. Fai scorte di cibo! Lupi, troll, Bjarn e le Aquile',
    forests: { count: 18, min: 8, max: 20, spread: 7 },
    extra: { gold: 2, stone: 3, bush: 3 },
    ground: { dirt: 0.8, tint: 'rgba(225,235,255,0.42)' },
    tint: [0.94, 0.97, 1.04],
    wild: 0x8a96a0,
    seasons: { len: { summer: 0.6, spring: 0.8, winter: 1.8 }, snow: 0.18 },
    sites: ['bear_hut', 'eagle_nest'],
    pairs: ['ruins', 'troll_cave'],
    roam: { wolf: 4 },
  },
];

export const RANDOM_MAP = 'casuale';

export function pickMap(id, rng = Math.random) {
  if (id === RANDOM_MAP || !MAPS.some(m => m.id === id)) return MAPS[Math.floor(rng() * MAPS.length)];
  return MAPS.find(m => m.id === id);
}
