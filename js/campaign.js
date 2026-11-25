// GPverse — Ombra & Corona — campagne (dalla V.0.9.0)
//
// Una campagna è una serie di missioni. Ogni missione è una partita su un'ambientazione con un seme fisso
// (la mappa è sempre la stessa), con obiettivi da completare, eventi a tempo (razzie) e un racconto.
//   map / seed / mapOverrides → dove si gioca (mapOverrides cambia luoghi e creature dell'ambientazione)
//   enemy / difficulty / ai   → l'avversario; "ai" sostituisce i valori del profilo dell'IA (es. firstWave)
//   start / enemyStart        → risorse, era e unità in più all'inizio (per te / per il nemico)
//   objectives                → { text, check(game, mission) }; optional: true = facoltativo
//   events                    → { at: secondi, title, sub, raid: { soldier: 3 } } razzia che parte dalla base nemica
// La missione si vince quando tutti gli obiettivi obbligatori sono completati; distruggere la base nemica
// fa vincere solo se la missione ha conquest: true.
import { FACTIONS } from './config.js';

const alive = (g, f, type) => g.units.filter(u => u.alive && u.faction === f && (!type || u.type === type));
const hasBuilding = (g, f, type) => g.buildings.some(b => b.alive && b.built && b.faction === f && b.type === type);
const site = (g, type) => g.sites.filter(s => s.type === type);

export const CAMPAIGNS = {
  men: {
    faction: 'men',
    name: 'La Guerra della Corona',
    desc: 'Cinque missioni con gli Uomini di Pietrabianca: dal villaggio di confine alla Fenditura di Fuoco',
    missions: [
      {
        id: 'men1',
        title: 'Il Villaggio di Confine',
        place: 'Valle di Mezzo',
        map: 'valle', seed: 4101,
        mapOverrides: { crown: false, rift: false },
        enemy: 'shadow', difficulty: 'easy',
        ai: { firstWave: 99999, villagers: 7 },
        intro: [
          'Le razzie dell\'Ombra sono arrivate fino alla Valle di Mezzo. Gli Orchi Neri bruciano i campi e portano via il raccolto.',
          'Il capitano di Pietrabianca ti affida l\'ultimo villaggio di confine: fai crescere il borgo, arma i tuoi uomini e resisti.',
        ],
        objectives: [
          { text: 'Arriva a 10 contadini', check: g => alive(g, g.player, 'villager').length >= 10 },
          { text: 'Costruisci una caserma', check: g => hasBuilding(g, g.player, 'barracks') },
          { text: 'Respingi le tre razzie dell\'Ombra', check: (g, m) => m.raidsDone >= 3 },
        ],
        events: [
          { at: 240, title: 'Prima razzia!', sub: 'Orchi Neri in marcia verso il villaggio', raid: { soldier: 2 } },
          { at: 420, title: 'Seconda razzia!', sub: 'Stavolta hanno anche un arciere', raid: { soldier: 3, archer: 1 } },
          { at: 600, title: 'L\'ultima razzia!', sub: 'Il grosso della banda: tenete duro', raid: { soldier: 5, archer: 2 } },
        ],
        outro: 'Le razzie sono state respinte: il villaggio di confine resiste. Ma tra gli Orchi caduti trovi un simbolo nero inciso su una corona...',
      },
      {
        id: 'men2',
        title: 'Le Rovine dei Lupi',
        place: 'Foreste Antiche',
        map: 'foreste', seed: 4202,
        mapOverrides: { crown: false, rift: false },
        enemy: 'shadow', difficulty: 'easy',
        ai: { firstWave: 600 },
        start: { res: { food: 300, wood: 300, gold: 100 } },
        intro: [
          'Il simbolo della corona porta a un nome antico: la Corona d\'Ombra, perduta da secoli.',
          'Per trovarla serve il Re Ramingo, che vive nascosto tra i boschi. Nel cuore della foresta abita Bjarn, l\'Uomo-Orso: un alleato prezioso, se lo si paga bene.',
          'Ma le rovine sulla strada sono infestate dai lupi.',
        ],
        objectives: [
          { text: 'Raggiungi la Seconda Era', check: g => g.players[g.player].era >= 2 },
          { text: 'Chiama il Re Ramingo', check: g => !!g.players[g.player].heroData },
          { text: 'Libera una delle rovine dai lupi e prendi il tesoro', check: g => site(g, 'ruins').some(s => s.takenBy === g.player) },
          { text: 'Ingaggia Bjarn alla sua capanna', check: g => site(g, 'bear_hut').some(s => s.hired === g.player) },
        ],
        outro: 'Il Re Ramingo e Bjarn sono con te. Il Re conosce la strada: la Corona fu vista l\'ultima volta oltre i Monti Grigi.',
      },
      {
        id: 'men3',
        title: 'I Picchi delle Aquile',
        place: 'Monti Grigi',
        map: 'monti', seed: 4303,
        mapOverrides: { sites: ['eagle_nest', 'deep_mine'], pairs: ['troll_cave'], crown: false, rift: false },
        enemy: 'shadow', difficulty: 'normal',
        ai: { firstWave: 360 },
        enemyStart: { res: { food: 400, wood: 300, gold: 150 }, units: { villager: 4, soldier: 3 } },
        start: { era: 2, res: { food: 350, wood: 350, stone: 150, gold: 150 } },
        intro: [
          'Sui Monti Grigi l\'Ombra ha costruito un avamposto per controllare i valichi.',
          'Sulle cime vivono le Aquile dei Picchi: si alleano solo con un eroe che sale fino al loro nido. Arrivaci prima del Bianco Traditore.',
          'Poi spazza via l\'avamposto. Attento ai troll nelle grotte.',
        ],
        objectives: [
          { text: 'Chiama il Re Ramingo', check: g => !!g.players[g.player].heroData },
          { text: 'Porta il Re al Nido delle Aquile', check: g => site(g, 'eagle_nest').some(s => s.used === g.player) },
          { text: 'Distruggi l\'avamposto dell\'Ombra (Fortezza)', check: g => !g.buildings.some(b => b.alive && b.faction === g.enemy && b.type === 'tc') },
        ],
        outro: 'L\'avamposto è caduto e le Aquile volano con te. Dall\'alto hanno visto dove si trova la Corona: nel covo di un drago, al Nord.',
      },
      {
        id: 'men4',
        title: 'Il Drago del Nord',
        place: 'Terre Gelide',
        map: 'gelide', seed: 4404,
        mapOverrides: { sites: ['lair', 'eagle_nest'], pairs: ['ruins'], roam: { wolf: 3 }, rift: false },
        enemy: 'shadow', difficulty: 'normal',
        ai: { firstWave: 300 },
        enemyStart: { era: 2, res: { food: 400, wood: 300, gold: 150 }, units: { villager: 4, soldier: 2 } },
        start: { era: 2, res: { food: 450, wood: 350, stone: 150, gold: 250 } },
        intro: [
          'Nelle Terre Gelide l\'inverno dura quasi il doppio: fai scorte di cibo o i tuoi uomini moriranno di fame.',
          'Un drago dorme sul suo tesoro. La Corona d\'Ombra non è lontana dalla sua tana, e anche l\'Ombra la sta cercando.',
          'Attento: appena il Re la prende, la corruzione comincia a salire. Conviene abbattere prima il drago.',
        ],
        objectives: [
          { text: 'Chiama il Re Ramingo', check: g => !!g.players[g.player].heroData },
          { text: 'Abbatti il Drago', check: g => site(g, 'lair').some(s => s.guards.length && s.guards.every(d => !d.alive)) },
          { text: 'Prendi la Corona d\'Ombra con il Re', check: g => g.crown?.holder?.faction === g.player },
        ],
        outro: 'La Corona è nelle tue mani, e già pesa. C\'è un solo modo per distruggerla: gettarla nella Fenditura di Fuoco, nelle Lande Bruciate.',
      },
      {
        id: 'men5',
        title: 'La Fenditura di Fuoco',
        place: 'Lande Bruciate',
        map: 'lande', seed: 4505,
        mapOverrides: { sites: ['deep_mine'], pairs: ['ruins', 'troll_cave'] },
        enemy: 'shadow', difficulty: 'hard',
        enemyStart: { era: 2, res: { food: 600, wood: 500, stone: 200, gold: 300 }, units: { villager: 6, soldier: 5, archer: 3 } },
        start: { era: 2, res: { food: 500, wood: 400, stone: 200, gold: 300 }, units: { soldier: 3, archer: 2 } },
        intro: [
          'Ultima tappa: le Lande Bruciate, nel cuore della Terra Cinerea. L\'Ombra sa che stai arrivando e ha radunato tutte le sue forze.',
          'Recupera la Corona dal suo piedistallo e portala alla Fenditura di Fuoco: servono 12 secondi di rito sull\'orlo, e il Re non deve cedere alla corruzione.',
          'Se l\'Ombra la tiene accanto alla sua base per 90 secondi, tutto è perduto.',
        ],
        objectives: [
          { text: 'Chiama il Re Ramingo', check: g => !!g.players[g.player].heroData },
          { text: 'Prendi la Corona d\'Ombra', check: (g, m) => m.crownTaken || (m.crownTaken = g.crown?.holder?.faction === g.player) },
          { text: 'Gettala nella Fenditura di Fuoco', check: () => false },   // la vittoria arriva dal rito (creatures.js)
        ],
        outro: 'La Corona d\'Ombra è stata distrutta. La Guerra della Corona è finita: Pietrabianca è salva.',
      },
    ],
  },
};

export function findMission(id) {
  for (const c of Object.values(CAMPAIGNS)) {
    const i = c.missions.findIndex(m => m.id === id);
    if (i >= 0) return { campaign: c, mission: c.missions[i], index: i };
  }
  return null;
}

// stato di una missione durante la partita
export class Mission {
  constructor(def, game) {
    this.def = def;
    this.g = game;
    this.done = def.objectives.map(() => false);
    this.fired = new Set();
    this.raids = [];          // gruppi di unità delle razzie
    this.raidsDone = 0;
    this.t = 0;
    this.applyStart();
  }
  applyStart() {
    const g = this.g;
    for (const [f, s] of [[g.player, this.def.start], [g.enemy, this.def.enemyStart]]) {
      if (!s) continue;
      const p = g.players[f];
      if (s.res) Object.assign(p.res, s.res);
      if (s.era) p.era = s.era;
      const tc = g.buildings.find(b => b.faction === f && b.type === 'tc');
      for (const [type, n] of Object.entries(s.units || {})) for (let i = 0; i < n; i++) g.spawnNear(tc, type);
    }
  }
  get objectives() { return this.def.objectives.map((o, i) => ({ text: o.text, optional: o.optional, done: this.done[i] })); }

  update(dt) {
    const g = this.g;
    if (g.over) return;
    this.t -= dt;
    // eventi a tempo
    for (const [i, ev] of (this.def.events || []).entries()) {
      if (this.fired.has(i) || g.time < ev.at) continue;
      this.fired.add(i);
      if (ev.raid) this.raid(ev.raid);
      g.emit('alarm', ev.title, ev.sub || '');
    }
    // razzie respinte: tutte le loro unità sono morte
    this.raids = this.raids.filter(r => { if (r.every(u => !u.alive)) { this.raidsDone++; g.msg(g.player, 'Razzia respinta!'); return false; } return true; });
    if (this.t > 0) return;
    this.t = 0.5;
    let changed = false;
    this.def.objectives.forEach((o, i) => {
      if (this.done[i] || !o.check(g, this)) return;
      this.done[i] = true; changed = true;
      g.msg(g.player, `Obiettivo completato: ${o.text}`);
    });
    if (changed) g.emit('objectives', this);
    if (this.def.objectives.every((o, i) => o.optional || this.done[i])) g.finish('win', this.def.outro);
  }
  raid(units) {
    const g = this.g;
    const etc = g.buildings.find(b => b.alive && b.faction === g.enemy && b.type === 'tc');
    const ptc = g.buildings.find(b => b.alive && b.faction === g.player && b.type === 'tc');
    if (!etc || !ptc) return;
    const group = [];
    for (const [type, n] of Object.entries(units)) for (let i = 0; i < n; i++) group.push(g.spawnNear(etc, type));
    group.forEach(u => { u.raider = true; });
    g.orderAttackMove(group, ptc.x + 1.5, ptc.z + 1.5);
    this.raids.push(group);
  }
  // testo per la schermata di fine
  static factionName(f) { return FACTIONS[f]?.name || f; }
}
