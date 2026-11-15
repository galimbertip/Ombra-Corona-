// GPverse — Ombra & Corona — dati di gioco (V.0.1.0)

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

export const GATHER_RATE = 1.0;   // unità di risorsa al secondo
export const CARRY_MAX = 10;

// Fazioni
export const FACTIONS = {
  men: {
    name: 'Uomini di Pietrabianca',
    color: 0x3b6fd6,
    names: { villager: 'Contadino', soldier: 'Lanciere', tc: 'Centro Città', house: 'Casa', barracks: 'Caserma', farm: 'Fattoria' },
  },
  shadow: {
    name: 'Ombra della Terra Cinerea',
    color: 0xb0302a,
    names: { villager: 'Schiavo Orco', soldier: 'Orco Nero', tc: 'Fortezza', house: 'Tana', barracks: 'Fossa di Guerra', farm: 'Recinto' },
  },
};

export const UNITS = {
  villager: { hp: 25, speed: 2.5, attack: 3, range: 0.9, cooldown: 1.5, cost: { food: 50 }, time: 8, pop: 1 },
  soldier:  { hp: 60, speed: 2.4, attack: 8, range: 1.0, cooldown: 1.2, cost: { food: 60, gold: 20 }, time: 12, pop: 1 },
};

export const BUILDINGS = {
  tc:       { hp: 600, size: 3, cost: {},                         time: 0,  popCap: 5, trains: ['villager'], dropoff: true,
              arrows: { range: 6, damage: 5, cooldown: 1.6 } },
  house:    { hp: 150, size: 2, cost: { wood: 30 },               time: 10, popCap: 5, trains: [] },
  barracks: { hp: 350, size: 3, cost: { wood: 120, stone: 30 },   time: 20, popCap: 0, trains: ['soldier'] },
  farm:     { hp: 100, size: 2, cost: { wood: 60 },               time: 8,  popCap: 0, trains: [], farm: true },
};

export const POP_LIMIT = 50;
export const AGGRO_RANGE = 6;
