// GPverse — Ombra & Corona — IA nemica (aggiornata alla V.0.2.0)
// Macchina a stati semplice: economia → espansione → esercito → ondate di attacco.
import { BUILDINGS, ERAS, HEROES } from './config.js';

const PROFILE = {
  easy:   { villagers: 9,  firstWave: 300, wave: 3, think: 1.6, era2: 10, era3: 14 },
  normal: { villagers: 14, firstWave: 210, wave: 4, think: 1.0, era2: 9,  era3: 13 },
  hard:   { villagers: 18, firstWave: 150, wave: 5, think: 0.7, era2: 8,  era3: 12 },
};
const RATIO = { bush: 0.5, tree: 0.25, gold: 0.18, stone: 0.07 };

export class AI {
  constructor(game, faction = 'shadow') {
    this.g = game; this.f = faction;
    this.p = PROFILE[game.difficulty] || PROFILE.normal;
    this.t = 0;
    this.waveSize = this.p.wave;
    this.waves = 0;
  }
  mine(list) { return list.filter(e => e.alive && e.faction === this.f); }

  update(dt) {
    const g = this.g;
    if (g.over) return;
    this.t -= dt;
    if (this.t > 0) return;
    this.t = this.p.think;

    const units = this.mine(g.units);
    const blds = this.mine(g.buildings);
    const tc = blds.find(b => b.type === 'tc');
    if (!tc) return;
    const vill = units.filter(u => u.type === 'villager');
    const army = units.filter(u => u.isMilitary);
    const res = g.players[this.f].res;

    // 1. contadini inattivi → risorse secondo le proporzioni
    const count = { bush: 0, tree: 0, gold: 0, stone: 0 };
    vill.forEach(v => { if (v.state === 'gather' && v.gatherType) count[v.gatherType]++; });
    for (const v of vill) {
      if (v.state !== 'idle') continue;
      const total = vill.length || 1;
      let best = 'bush', gap = -Infinity;
      for (const k of Object.keys(RATIO)) {
        const want = RATIO[k] * total - count[k];
        if (want > gap) { gap = want; best = k; }
      }
      let node;
      if (best === 'bush') {
        // finite le bacche, il cibo viene dalle fattorie (max 2 contadini per fattoria)
        node = g.nearestNode('bush', tc.x, tc.z, 18);
        if (!node) {
          const farm = g.nearestNode('farm', tc.x, tc.z, 40, this.f);
          const busy = farm ? g.units.filter(u => u.alive && u.state === 'gather' && u.target === farm).length : 99;
          if (farm && busy < 2) node = farm;
          else if (g.canAfford(this.f, BUILDINGS.farm.cost)) {
            const f = this.construct('farm', tc, [v], 1, 3);
            if (f) { count[best]++; continue; }
          }
        }
      }
      node = node || g.nearestNode(best, tc.x, tc.z, 30, this.f) || g.nearestNode('tree', v.x, v.z, 40);
      if (node) { g.orderGather([v], node); count[best]++; }
    }

    // 2. nuovi contadini
    const era = g.players[this.f].era;
    const advancing = tc.queue.some(q => q.type === 'era');
    if (vill.length < this.p.villagers && tc.queue.length < 2 && !advancing) g.train(tc, 'villager');

    // 2b. avanzamento di era (risparmia risorse quando è il momento)
    const next = ERAS[era + 1];
    const wantEra = next && !advancing && (era === 1 ? vill.length >= this.p.era2 : vill.length >= this.p.era3 && army.length >= 3);
    if (wantEra && g.canAfford(this.f, next.cost) && tc.queue.length === 0) g.train(tc, 'era');

    // 2c. eroe: evocazione o rianimazione
    const hero = units.find(u => u.isHero);
    if (!hero && era >= HEROES[this.f].era && !g.trainBlock(tc, 'hero') && !advancing) {
      const info = g.queueInfo(this.f, 'hero');
      if (g.canAfford(this.f, info.cost)) g.train(tc, 'hero');
    }
    if (hero) this.useHero(hero);

    // 3. cantieri senza costruttori
    for (const b of blds) {
      if (b.built) continue;
      const builders = vill.filter(v => v.state === 'build' && v.target === b);
      if (!builders.length && vill.length) {
        const v = this.closest(vill.filter(x => x.state !== 'build'), b) || vill[0];
        g.orderBuild([v], b);
      }
    }

    // 4. case
    const pop = g.pop(this.f), cap = g.popCap(this.f);
    const building = blds.some(b => !b.built && b.type === 'house');
    if (cap - pop <= 2 && cap < 50 && !building && g.canAfford(this.f, BUILDINGS.house.cost)) this.construct('house', tc, vill, 1);

    // 5. caserma
    const barracks = blds.filter(b => b.type === 'barracks');
    if (vill.length >= 6 && !barracks.length && g.canAfford(this.f, BUILDINGS.barracks.cost)) this.construct('barracks', tc, vill, 2);
    if (vill.length >= 12 && barracks.length === 1 && res.wood > 250 && g.difficulty !== 'easy') this.construct('barracks', tc, vill, 2);

    // 6. soldati: mescola le unità sbloccate dall'era (se si risparmia per l'era, si addestra meno)
    if (!(wantEra && !g.canAfford(this.f, next.cost) && army.length >= 3)) {
      const mix = era >= 3 ? ['soldier', 'archer', 'knight', 'archer'] : era >= 2 ? ['soldier', 'archer', 'soldier'] : ['soldier'];
      for (const b of barracks) {
        if (!b.built || b.queue.length >= 2) continue;
        this.mixI = ((this.mixI || 0) + 1) % mix.length;
        if (!g.train(b, mix[this.mixI])) g.train(b, 'soldier');
      }
    }

    // 7. difesa: nemici vicino alla base
    const intruder = g.units.find(u => u.alive && u.faction !== this.f && Math.hypot(u.x - tc.x, u.z - tc.z) < 14);
    if (intruder) {
      army.filter(a => a.state !== 'attack').forEach(a => g.orderAttack([a], intruder));
      return;
    }

    // 8. ondate di attacco
    const home = army.filter(a => a.state === 'idle' || a.state === 'move');
    if (g.time > this.p.firstWave && home.length >= this.waveSize) {
      const target = g.buildings.find(b => b.alive && b.faction !== this.f && b.type === 'tc')
        || g.buildings.find(b => b.alive && b.faction !== this.f);
      if (target) {
        g.orderAttackMove(home, target.x, target.z);
        this.waves++;
        this.waveSize += 2;
        g.msg('men', this.waves === 1 ? 'L\'Ombra si muove verso di noi!' : `Nuova ondata dell'Ombra (${home.length} orchi)`);
      }
    }
  }

  // l'eroe usa le abilità quando ci sono nemici intorno
  useHero(h) {
    const g = this.g;
    const near = g.enemiesNear(h.x, h.z, h.faction, 6);
    if (!near.length) return;
    const close = g.enemiesNear(h.x, h.z, h.faction, 4.5);
    const abil = HEROES[h.faction].abilities;
    abil.forEach((a, i) => {
      if (g.abilityReady(h, i)) return;
      const ultimate = i === 2;
      if (ultimate && close.length < 3 && h.hp > h.maxHp * 0.4) return;
      if (i === 1 && close.length < 2) return;
      g.cast(h, i);
    });
  }

  closest(list, t) {
    let best = null, bd = Infinity;
    for (const u of list) { const d = Math.hypot(u.x - t.x, u.z - t.z); if (d < bd) { bd = d; best = u; } }
    return best;
  }

  construct(type, tc, vill, nBuilders, minR = 4) {
    const g = this.g;
    const s = BUILDINGS[type].size;
    // cerca un punto libero a spirale intorno al centro, con un margine per non chiudere i passaggi
    for (let r = minR; r < 16; r++) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2 + r;
        const cx = Math.round(tc.x + Math.cos(a) * r - s / 2), cz = Math.round(tc.z + Math.sin(a) * r - s / 2);
        if (g.grid.areaFree(cx - 1, cz - 1, s + 2, s + 2)) {
          const b = g.placeBuilding(type, this.f, cx, cz);
          if (b) {
            const builders = vill.filter(v => v.state !== 'build').sort((p, q) => Math.hypot(p.x - b.x, p.z - b.z) - Math.hypot(q.x - b.x, q.z - b.z)).slice(0, nBuilders);
            g.orderBuild(builders, b);
          }
          return b;
        }
      }
    }
    return null;
  }
}
