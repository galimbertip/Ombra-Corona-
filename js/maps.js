// GPverse — Ombra & Corona — tipi di mappa (dalla V.0.4.0)
// Ogni partita genera una mappa nuova a partire da un "seme" (seed): basi, boschi e risorse
// sono messi a caso, ma con lo stesso seme e lo stesso tipo si ottiene sempre la stessa mappa.
// Per aggiungere una mappa basta aggiungere una voce qui sotto.

export const MAPS = [
  {
    id: 'valle',
    name: 'Valle di Mezzo',
    desc: 'Equilibrata: boschi sparsi e miniere contese al centro',
    forests: { count: 22, min: 8, max: 26, spread: 7 },
    extra: { gold: 2, stone: 2, bush: 2 },
  },
  {
    id: 'foreste',
    name: 'Foreste Antiche',
    desc: 'Boschi fitti e radure strette: tanto legno, passaggi difficili',
    forests: { count: 40, min: 14, max: 34, spread: 9 },
    extra: { gold: 2, stone: 1, bush: 1 },
  },
  {
    id: 'aperte',
    name: 'Terre Aperte',
    desc: 'Pianure con pochi boschi e molte miniere: si combatte presto',
    forests: { count: 10, min: 6, max: 16, spread: 6 },
    extra: { gold: 5, stone: 4, bush: 4 },
  },
];

export const RANDOM_MAP = 'casuale';

export function pickMap(id, rng = Math.random) {
  if (id === RANDOM_MAP || !MAPS.some(m => m.id === id)) return MAPS[Math.floor(rng() * MAPS.length)];
  return MAPS.find(m => m.id === id);
}
