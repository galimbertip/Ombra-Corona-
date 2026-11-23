// GPverse — Ombra & Corona — dati di gioco (aggiornato alla V.0.6.0)

export const MAP_SIZE = 64;          // celle per lato
export const CELL = 1;               // dimensione cella in unità mondo

export const RES = ['food', 'wood', 'stone', 'gold'];
export const RES_LABEL = { food: 'Cibo', wood: 'Legno', stone: 'Pietra', gold: 'Oro' };
export const RES_ICON = { food: '🍖', wood: '🪵', stone: '🪨', gold: '🪙' };

export const START_RES = { food: 200, wood: 200, stone: 100, gold: 50 };

// Nodi risorsa sulla mappa
export const NODES = {
  tree:  { res: 'wood',  amount: 100, label: 'Albero' },
  bush:  { res: 'food',  amount: 150, label: 'Cespuglio di bacche' },
  stone: { res: 'stone', amount: 250, label: 'Cava di pietra' },
  gold:  { res: 'gold',  amount: 250, label: 'Miniera d\'oro' },
};

export const GATHER_RATE = 1.3;   // unità di risorsa al secondo
export const CARRY_MAX = 10;

// Fazioni
export const FACTIONS = {
  men: {
    name: 'Uomini di Pietrabianca',
    color: 0x3b6fd6,
    names: { villager: 'Contadino', soldier: 'Lanciere', archer: 'Arciere', knight: 'Cavaliere della Marca', hero: 'il Re Ramingo',
             tc: 'Centro Città', house: 'Casa', barracks: 'Caserma', farm: 'Fattoria' },
  },
  shadow: {
    name: 'Ombra della Terra Cinerea',
    color: 0xb0302a,
    names: { villager: 'Schiavo Orco', soldier: 'Orco Nero', archer: 'Arciere Orco', knight: 'Cavaliere di Lupi', hero: 'il Bianco Traditore',
             tc: 'Fortezza', house: 'Tana', barracks: 'Fossa di Guerra', farm: 'Recinto' },
  },
  elves: {
    name: 'Elfi del Bosco d\'Oro',
    color: 0x2e8b57,
    style: 'Pochi ma letali: arcieri più precisi, Arborei che abbattono le mura',
    names: { villager: 'Raccoglitore Elfico', soldier: 'Guardia del Bosco', archer: 'Arciere Elfico', knight: 'Arboreo', hero: 'la Signora del Bosco',
             tc: 'Palazzo d\'Oro', house: 'Dimora', barracks: 'Sala delle Lame', farm: 'Frutteto' },
  },
  dwarves: {
    name: 'Nani di Khazrun',
    color: 0xc8732a,
    style: 'Resistenti e lenti: ottimi minatori, edifici e guerrieri robustissimi',
    names: { villager: 'Minatore', soldier: 'Guerriero di Khazrun', archer: 'Balestriere', knight: 'Cavaliere d\'Ariete', hero: 'il Re sotto la Montagna',
             tc: 'Porta della Montagna', house: 'Casa di Pietra', barracks: 'Forgia di Guerra', farm: 'Funghiera' },
  },
};
FACTIONS.men.style = 'Equilibrati: buona cavalleria, nessun punto debole';
FACTIONS.shadow.style = 'Orde a basso costo: tanti guerrieri, ma più fragili';

// Differenze tra i popoli (V.0.6.0): moltiplicatori applicati alle statistiche di base
export const FACTION_MODS = {
  men:     { knight: { hp: 1.1, attack: 1.1 } },
  shadow:  { all: { hp: 0.9, cost: 0.8, time: 0.85 } },
  elves:   { all: { hp: 1.1, cost: 1.15 }, archer: { range: 1.2, attack: 1.35 },
             knight: { hp: 2.0, speed: 0.55, attack: 1.6, cooldown: 1.6, siege: 3 }, gather: { wood: 1.15, food: 1.1 } },
  dwarves: { all: { hp: 1.2, speed: 0.88 }, archer: { attack: 1.2, range: 0.9 }, buildingHp: 1.3, gather: { gold: 1.25, stone: 1.25 } },
};

// era = era minima per addestrare l'unità (1 = Prima Era)
export const UNITS = {
  villager: { hp: 25,  speed: 2.5, attack: 3,  range: 0.9, cooldown: 1.5, cost: { food: 50 },             time: 8,  era: 1 },
  soldier:  { hp: 60,  speed: 2.4, attack: 8,  range: 1.0, cooldown: 1.2, cost: { food: 60, gold: 20 },   time: 12, era: 1 },
  archer:   { hp: 35,  speed: 2.4, attack: 6,  range: 5.0, cooldown: 1.8, cost: { wood: 40, gold: 30 },   time: 12, era: 2 },
  knight:   { hp: 120, speed: 3.6, attack: 11, range: 1.0, cooldown: 1.3, cost: { food: 80, gold: 70 },   time: 18, era: 3 },
};

// Eroi (stile Warcraft III): uno per fazione, salgono di livello con l'esperienza
export const HEROES = {
  men: {
    hp: 220, speed: 2.8, attack: 16, range: 1.1, cooldown: 1.1, cost: { food: 150, gold: 150 }, time: 20, era: 2,
    abilities: [
      { id: 'cry',   name: 'Grido di Pietrabianca', level: 1, cd: 30, desc: 'Alleati vicini +50% attacco per 10 s' },
      { id: 'slam',  name: 'Lama Spezzata',          level: 3, cd: 18, desc: 'Colpo ad area sui nemici intorno' },
      { id: 'king',  name: 'Ritorno del Re',         level: 6, cd: 90, desc: 'Suprema: cura gli alleati e li rinvigorisce' },
    ],
  },
  shadow: {
    hp: 180, speed: 2.7, attack: 14, range: 4.0, cooldown: 1.4, cost: { food: 150, gold: 150 }, time: 20, era: 2,
    abilities: [
      { id: 'bolt',  name: 'Fulmine',          level: 1, cd: 12, desc: 'Colpisce il nemico più vicino' },
      { id: 'voice', name: 'Voce Persuasiva',  level: 3, cd: 25, desc: 'Nemici vicini rallentati del 50% per 6 s' },
      { id: 'storm', name: 'Tempesta di Ferro', level: 6, cd: 80, desc: 'Suprema: danni ad area e alleati rinvigoriti' },
    ],
  },
};
HEROES.elves = {
  hp: 190, speed: 2.9, attack: 13, range: 4.5, cooldown: 1.2, cost: { food: 150, gold: 150 }, time: 20, era: 2,
  abilities: [
    { id: 'star',   icon: 'ability_king',  name: 'Luce Stellare',     level: 1, cd: 25, desc: 'Cura gli alleati vicini del 40%' },
    { id: 'arrows', icon: 'ability_storm', name: 'Pioggia di Frecce', level: 3, cd: 18, desc: 'Danni ad area sul nemico più vicino' },
    { id: 'forest', icon: 'ability_voice', name: 'Canto del Bosco',   level: 6, cd: 80, desc: 'Suprema: alleati rinvigoriti, nemici rallentati' },
  ],
};
HEROES.dwarves = {
  hp: 280, speed: 2.4, attack: 18, range: 1.1, cooldown: 1.2, cost: { food: 150, gold: 150 }, time: 20, era: 2,
  abilities: [
    { id: 'quake',  icon: 'ability_slam', name: 'Colpo di Martello', level: 1, cd: 15, desc: 'Colpo ad area sui nemici intorno' },
    { id: 'shield', icon: 'ability_cry',  name: 'Muro di Scudi',     level: 3, cd: 30, desc: 'Alleati vicini subiscono metà danni per 10 s' },
    { id: 'forge',  icon: 'ability_king', name: 'Furia della Forgia', level: 6, cd: 90, desc: 'Suprema: cura e rinvigorisce gli alleati' },
  ],
};
export const HERO_REVIVE = { cost: { gold: 100 }, time: 20 };
export const HERO_PER_LEVEL = { hp: 18, attack: 2 };
// esperienza cumulativa per raggiungere il livello L (indice = livello)
export const XP_TABLE = [0, 0, 60, 180, 360, 600, 900, 1260, 1680, 2160, 2700];
export const XP_VALUE = { villager: 15, soldier: 25, archer: 25, knight: 40, hero: 150, house: 20, farm: 15, barracks: 40, tc: 120 };
export const XP_RANGE = 10;

// Ere (stile Age of Empires): si avanzano dal Centro Città
export const ERAS = [
  null,
  { name: 'Prima Era',   heroCap: 0 },
  { name: 'Seconda Era', heroCap: 5,  cost: { food: 250, gold: 80 },              time: 30 },
  { name: 'Terza Era',   heroCap: 10, cost: { food: 500, gold: 250, stone: 100 }, time: 40 },
];

const defCache = {};
export function unitDef(type, faction) {
  if (type === 'hero') return HEROES[faction];
  const k = type + '/' + faction;
  if (defCache[k]) return defCache[k];
  const m = FACTION_MODS[faction] || {}, a = m.all || {}, t = m[type] || {};
  const mul = (key) => (a[key] || 1) * (t[key] || 1);
  const b = UNITS[type];
  const cost = {};
  for (const [r, v] of Object.entries(b.cost)) cost[r] = Math.round(v * mul('cost') / 5) * 5;
  return (defCache[k] = {
    ...b, cost,
    hp: Math.round(b.hp * mul('hp')), speed: b.speed * mul('speed'), attack: Math.round(b.attack * mul('attack')),
    range: b.range > 2 ? b.range * mul('range') : b.range, cooldown: b.cooldown * mul('cooldown'),
    time: Math.round(b.time * mul('time')), siege: t.siege || 1,
  });
}

export const BUILDINGS = {
  tc:       { hp: 600, size: 3, cost: {},                         time: 0,  popCap: 5, trains: ['villager', 'hero'], dropoff: true,
              arrows: { range: 6, damage: 5, cooldown: 1.6 } },
  house:    { hp: 150, size: 2, cost: { wood: 30 },               time: 10, popCap: 5, trains: [] },
  barracks: { hp: 350, size: 3, cost: { wood: 120, stone: 30 },   time: 20, popCap: 0, trains: ['soldier', 'archer', 'knight'] },
  farm:     { hp: 100, size: 2, cost: { wood: 60 },               time: 8,  popCap: 0, trains: [], farm: true },
};

export const POP_LIMIT = 50;
export const AGGRO_RANGE = 6;

// Camera isometrica fissa (dalla V.0.3.0): gli sprite sono disegnati da questa angolazione
export const CAM_YAW = Math.PI / 4;
// angolo attuale della visuale (dalla V.0.6.1 si ruota a scatti di 90°)
export const VIEW = { yaw: CAM_YAW };
export const CAM_PITCH = 0.55; // circa 31° sopra l'orizzonte: rombi del terreno in proporzione 2:1
