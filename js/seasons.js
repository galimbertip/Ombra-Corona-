// GPverse — Ombra & Corona — stagioni in stile Northgard (dalla V.0.5.0)
// Un anno dura poco più di 4 minuti. D'inverno il cibo si raccoglie a metà, si cammina più piano
// e ogni abitante mangia: bisogna fare scorte in autunno.

export const SEASONS = [
  { id: 'spring', name: 'Primavera', icon: '🌱', len: 75, food: 1.0, speed: 1.0, tint: [1, 1, 1],
    news: 'Primavera: i campi tornano a dare frutti' },
  { id: 'summer', name: 'Estate', icon: '☀️', len: 75, food: 1.15, speed: 1.0, tint: [1, 1, 0.96],
    news: 'Estate: raccolti abbondanti (+15% cibo)' },
  { id: 'autumn', name: 'Autunno', icon: '🍂', len: 60, food: 1.0, speed: 1.0, tint: [1, 0.92, 0.82],
    news: 'Autunno: fai scorte di cibo prima dell\'inverno' },
  { id: 'winter', name: 'Inverno', icon: '❄️', len: 60, food: 0.5, speed: 0.8, tint: [0.86, 0.91, 1], upkeep: true,
    news: 'Inverno: cibo dimezzato, marce lente e ogni abitante consuma cibo' },
];
export const UPKEEP_EVERY = 15; // secondi: ogni unità mangia 1 cibo

export class Seasons {
  // mods.len: durata delle stagioni per ambientazione (es. Terre Gelide: inverno lungo) — V.0.8.0
  constructor(mods = {}) {
    this.i = 0; this.t = 0; this.year = 1;
    this.list = SEASONS.map(se => ({ ...se, len: Math.round(se.len * (mods.len?.[se.id] ?? 1)) }));
  }
  get current() { return this.list[this.i]; }
  get left() { return Math.max(0, this.current.len - this.t); }
  // avanza il tempo; restituisce la nuova stagione quando cambia
  update(dt) {
    this.t += dt;
    if (this.t < this.current.len) return null;
    this.t -= this.current.len;
    this.i = (this.i + 1) % this.list.length;
    if (this.i === 0) this.year++;
    return this.current;
  }
}
