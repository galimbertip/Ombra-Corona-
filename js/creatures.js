// GPverse — Ombra & Corona — creature, luoghi della mappa e Corona d'Ombra (dalla V.0.7.0)
//
// Luoghi (Site) messi in posizioni simmetriche rispetto alle due basi, così nessuno è avvantaggiato:
//   Corona e Fenditura di Fuoco sulla linea a metà strada, una da un lato e una dall'altro.
// Creature neutrali: restano vicino alla loro tana, attaccano chi si avvicina e tornano indietro se si allontanano troppo.
// Corona d'Ombra: la raccoglie un eroe. Dà molta forza ma corrompe (non i servi dell'Ombra). Vittoria:
//   - portarla alla Fenditura di Fuoco e distruggerla (tutti tranne l'Ombra)
//   - l'Ombra la tiene accanto alla propria base per 90 secondi (dominio)
import { MAP_SIZE, CREATURES, FACTIONS, NEUTRAL } from './config.js';
import { Unit, Site, makeCrownMarker } from './entities.js';
import { hideNode } from './world.js';

const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
export const CROWN = {
  corruptTime: 150,   // secondi per arrivare al 100% di corruzione
  dominion: 90,       // secondi che l'Ombra deve tenerla vicino alla base
  pickEra: 2,         // da che era la si può raccogliere
  attackMul: 1.5,
  regen: 3,
  slow: 0.65,         // chi la porta (tranne l'Ombra) cammina più piano: pesa
  ritual: 12,         // secondi da passare sull'orlo della Fenditura per distruggerla
};
export const HIRE_BJARN = { gold: 200, food: 100 };
export const MINE_AWAKEN = 450; // oro estratto dalla Miniera Profonda prima che si risvegli il Flagello

// ---- piazzamento -------------------------------------------------------------------
export function placeSites(game, rng) {
  const [b1, b2] = Object.values(game.bases).map(b => ({ x: b.x + 1.5, z: b.z + 1.5 }));
  const M = { x: (b1.x + b2.x) / 2, z: (b1.z + b2.z) / 2 };
  let ex = b2.x - b1.x, ez = b2.z - b1.z; const L = Math.hypot(ex, ez) || 1; ex /= L; ez /= L;
  const dx = -ez, dz = ex;                     // perpendicolare all'asse tra le basi
  const at = (e, d) => ({ x: M.x + ex * e + dx * d, z: M.z + ez * e + dz * d });
  const sites = [];
  const place = (type, p) => {
    const size = { crown: 1, lair: 3 }[type] || 2;
    // cerco il posto valido più vicino al punto ideale
    for (let r = 0; r < 20; r++) {
      for (let k = 0; k < (r ? 12 : 1); k++) {
        const a = k / 12 * Math.PI * 2;
        const cx = Math.round(p.x + Math.cos(a) * r - size / 2), cz = Math.round(p.z + Math.sin(a) * r - size / 2);
        if (cx < 2 || cz < 2 || cx + size > MAP_SIZE - 2 || cz + size > MAP_SIZE - 2) continue;
        const cxm = cx + size / 2, czm = cz + size / 2;
        if (dist(cxm, czm, b1.x, b1.z) < 13 || dist(cxm, czm, b2.x, b2.z) < 13) continue;
        // i luoghi con guardiani stanno lontani dagli altri, così le creature non disturbano miniera, capanna o Corona
        const GUARDED = ['ruins', 'troll_cave', 'lair'];
        if (sites.some(s => dist(s.x, s.z, cxm, czm) < s.size / 2 + size / 2 + (GUARDED.includes(s.type) || GUARDED.includes(type) ? 6 : 3))) continue;
        // il luogo può stare dove ci sono alberi o rocce (li tolgo), ma non su edifici
        let ok = true;
        for (let z = cz - 1; z <= cz + size; z++) for (let x = cx - 1; x <= cx + size; x++) {
          const o = game.grid.inside(x, z) && game.grid.owner[game.grid.idx(x, z)];
          if (o && o.kind !== 'node') ok = false;
        }
        if (!ok) continue;
        for (let z = cz - 1; z <= cz + size; z++) for (let x = cx - 1; x <= cx + size; x++) {
          if (!game.grid.inside(x, z)) continue;
          const o = game.grid.owner[game.grid.idx(x, z)];
          if (o && o.kind === 'node') { o.alive = false; game.grid.release(o.x, o.z, 1, 1); hideNode(o); }
        }
        const s = new Site(type, cx, cz);
        game.grid.occupy(cx, cz, size, size, s);
        game.scene.add(s.mesh);
        sites.push(s);
        return s;
      }
    }
    return null;
  };
  const flip = rng() < 0.5 ? 1 : -1;
  // luoghi singoli sulla linea a metà strada tra le basi (stessa distanza da entrambe)
  // Corona e Fenditura agli estremi opposti: portarla a destinazione è un viaggio lungo
  const map = game.map || {};
  const SLOT = { lair: 22, eagle_nest: -8, bear_hut: 15, deep_mine: -15 };
  // le missioni della campagna possono togliere Corona e Fenditura (crown: false / rift: false)
  if (map.crown !== false) place('crown', at(0, 8 * flip));
  if (map.rift !== false) place('rift', at(0, -23 * flip));
  // il resto dipende dall'ambientazione (V.0.8.0)
  for (const type of map.sites || Object.keys(SLOT)) if (SLOT[type] != null) place(type, at(0, SLOT[type] * flip));
  // a coppie, specchiate (una per base) e tutte dal lato della Corona e del drago:
  // dal lato della Miniera e della Fenditura la strada resta libera da creature
  const PAIR_SLOTS = [[8, 13], [13, 19]];
  (map.pairs || ['ruins', 'troll_cave']).slice(0, 2).forEach((type, i) => {
    const [e, d] = PAIR_SLOTS[i];
    place(type, at(e, d * flip)); place(type, at(-e, d * flip));
  });
  game.nodes = game.nodes.filter(n => n.alive);
  for (const s of sites) {
    if (s.type === 'deep_mine') { s.res = 'gold'; s.mined = 0; }
    if (s.type === 'ruins') s.treasure = { gold: 150, wood: 100 };
    if (s.type === 'troll_cave') s.treasure = { gold: 250, stone: 100 };
    if (s.type === 'lair') s.treasure = { gold: 700, food: 300 };
  }
  return sites;
}

// guardiani di ogni luogo
export function spawnGuardians(game) {
  for (const s of game.sites) {
    const g = { ruins: [['wolf', 3]], troll_cave: [['troll', 2]], lair: [['dragon', 1]] }[s.type];
    if (!g) continue;
    for (const [type, n] of g) for (let i = 0; i < n; i++) {
      const c = game.grid.nearestFree(s.x + (i - n / 2) * 1.2, s.z + s.size / 2 + 1);
      if (!c) continue;
      const u = spawnCreature(game, type, NEUTRAL, c.x + 0.5, c.z + 0.5);
      u.home = { x: u.x, z: u.z }; u.site = s;
      s.guards.push(u);
    }
  }
  // creature che vagano al centro della mappa: dipendono dall'ambientazione
  const roam = game.map?.roam || { wolf: 2 };
  let i = 0;
  for (const [type, n] of Object.entries(roam)) for (let k = 0; k < n; k++, i++) {
    const c = game.grid.nearestFree(MAP_SIZE / 2 + (i % 3) - 1, MAP_SIZE / 2 + Math.floor(i / 3) * 2);
    if (c) { const u = spawnCreature(game, type, NEUTRAL, c.x + 0.5, c.z + 0.5); u.home = { x: MAP_SIZE / 2, z: MAP_SIZE / 2 }; u.roam = true; }
  }
}

export function spawnCreature(game, type, faction, x, z) {
  const u = new Unit(type, faction, x, z);
  game.units.push(u);
  game.scene.add(u.mesh);
  return u;
}

export const siteName = (s) => s.name;
export function siteOf(game, type) { return game.sites.find(s => s.type === type); }

// ---- comportamento ad ogni passo ----------------------------------------------------
export function updateWild(game, dt) {
  const crown = game.crown;

  // creature neutrali: guardia della tana
  for (const u of game.units) {
    if (!u.alive || u.faction !== NEUTRAL) continue;
    const def = CREATURES[u.type] || { aggro: 7, leash: 999 };
    if (u.regen && u.hp < u.maxHp && u.state === 'idle') u.hp = Math.min(u.maxHp, u.hp + u.regen * dt);
    const home = u.home || { x: u.x, z: u.z };
    const far = dist(u.x, u.z, home.x, home.z) > def.leash;
    if (far && u.state !== 'move') { game.orderMove([u], home.x, home.z); u.returning = true; continue; }
    if (u.returning) { if (u.state === 'idle') { u.returning = false; u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.3); } else continue; }
    if (u.state === 'idle') {
      // difendono la tana: attaccano solo chi si avvicina troppo, non chi passa a distanza
      const guardR = (u.site ? u.site.size / 2 : 0) + def.aggro;
      const e = game.nearestEnemy(u, def.aggro + 3);
      if (e && dist(e.x, e.z, home.x, home.z) < guardR) game.orderAttack([u], e);
      else if (u.roam && Math.random() < dt * 0.05) game.orderMove([u], home.x + (Math.random() - 0.5) * 10, home.z + (Math.random() - 0.5) * 10);
    }
  }

  for (const s of game.sites) {
    // tesori: quando i guardiani sono morti, il primo che arriva prende tutto
    if (s.treasure && s.guards.every(g => !g.alive)) {
      const u = game.units.find(u => u.alive && game.players[u.faction] && dist(u.x, u.z, s.x, s.z) < s.size / 2 + 1.6);
      if (u) {
        const r = game.players[u.faction].res;
        for (const [k, v] of Object.entries(s.treasure)) r[k] += v;
        const what = Object.entries(s.treasure).map(([k, v]) => `${v} ${({ gold: 'oro', food: 'cibo', wood: 'legno', stone: 'pietra' })[k]}`).join(', ');
        game.msg(u.faction, `Tesoro di ${s.name}: ${what}!`);
        if (u.faction !== game.player) game.msg(game.player, `Il nemico ha preso il tesoro di ${s.name}`);
        s.treasure = null; s.takenBy = u.faction;
        game.emit('site', s);
      }
    }
    // nido: il primo eroe che arriva si allea con le aquile
    if (s.type === 'eagle_nest' && !s.used) {
      const h = game.units.find(u => u.alive && u.isHero && game.players[u.faction] && dist(u.x, u.z, s.x, s.z) < 2.6);
      if (h) {
        s.used = h.faction;
        for (let i = 0; i < 3; i++) {
          const c = game.grid.nearestFree(s.x + i - 1, s.z + 2);
          if (c) spawnCreature(game, 'eagle', h.faction, c.x + 0.5, c.z + 0.5);
        }
        game.msg(h.faction, 'Le Aquile dei Picchi si uniscono a voi!');
        if (h.faction !== game.player) game.msg(game.player, 'Le Aquile dei Picchi si sono alleate col nemico');
        game.emit('site', s);
      }
    }
    // miniera profonda: scavando troppo si risveglia il Flagello di Fiamma
    if (s.type === 'deep_mine' && !s.awake && s.mined >= MINE_AWAKEN) {
      s.awake = true;
      const c = game.grid.nearestFree(s.x, s.z + 2);
      const f = spawnCreature(game, 'flame', NEUTRAL, c.x + 0.5, c.z + 0.5);
      // va verso la base di chi ha scavato di più
      const victim = Object.entries(s.minedBy || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || game.player;
      const tc = game.buildings.find(b => b.alive && b.faction === victim && b.type === 'tc');
      f.home = tc ? { x: tc.x, z: tc.z } : { x: f.x, z: f.z };
      if (tc) game.orderAttackMove([f], tc.x, tc.z);
      game.emit('alarm', 'Il Flagello di Fiamma si è risvegliato!', victim === game.player ? 'Marcia verso la vostra base' : 'Marcia verso la base nemica');
    }
  }

  // ---- Corona d'Ombra ----
  if (!crown || game.over) return;
  if (!crown.holder) {
    const pos = crown.ground || crown.site;
    const h = game.units.find(u => u.alive && u.isHero && game.players[u.faction] && game.players[u.faction].era >= CROWN.pickEra &&
      dist(u.x, u.z, pos.x, pos.z) < 1.8);
    if (h) pickCrown(game, h);
  } else {
    const h = crown.holder;
    if (!h.alive) { dropCrown(game, h.x, h.z); return; }
    crown.marker.position.set(h.x, h.sprite.scale.y / Math.cos(0.55) + 0.9, h.z);
    if (h.hp < h.maxHp) h.hp = Math.min(h.maxHp, h.hp + CROWN.regen * dt);
    if (h.faction === 'shadow') {
      const tc = game.buildings.find(b => b.alive && b.faction === 'shadow' && b.type === 'tc');
      crown.dominion = tc && dist(h.x, h.z, tc.x, tc.z) < 7 ? (crown.dominion || 0) + dt : Math.max(0, (crown.dominion || 0) - dt * 0.5);
      if (crown.dominion >= CROWN.dominion) game.finish(h.faction === game.player ? 'win' : 'lose', 'L\'Ombra ha dominato la Corona: il Mondo di Mezzo si piega al suo volere.');
    } else {
      h.corruption = Math.min(1, (h.corruption || 0) + dt / CROWN.corruptTime);
      if (h.corruption >= 1) { corrupt(game, h); return; }
      const rift = siteOf(game, 'rift');
      if (rift && dist(h.x, h.z, rift.x, rift.z) < 2.8) {
        if (!crown.ritual) game.emit('alarm', 'Il rito alla Fenditura è iniziato!', `Fermatelo entro ${CROWN.ritual} secondi`);
        crown.ritual = (crown.ritual || 0) + dt;
        if (crown.ritual >= CROWN.ritual) {
          const n = FACTIONS[h.faction].names.hero;
          game.finish(h.faction === game.player ? 'win' : 'lose', `${n[0].toUpperCase() + n.slice(1)} ha gettato la Corona d'Ombra nella Fenditura di Fuoco.`);
        }
      } else crown.ritual = 0;
    }
  }
}

export function createCrown(game) {
  const site = siteOf(game, 'crown');
  if (!site) return null;
  const marker = makeCrownMarker();
  marker.visible = false;
  game.scene.add(marker);
  return { site, holder: null, ground: null, marker, dominion: 0 };
}
function pickCrown(game, h) {
  const c = game.crown;
  c.holder = h; c.ground = null;
  c.marker.visible = true;
  c.site.sprite.visible = false;   // il piedistallo resta vuoto: mostro il disegno senza corona solo come anello
  c.site.emptied = true;
  h.attackBase = h.attackBase || h.attack;
  h.attack = Math.round(h.attack * CROWN.attackMul);
  if (h.faction !== 'shadow') { h.speedBase = h.speed; h.speed *= CROWN.slow; }
  const n = FACTIONS[h.faction].names.hero, who = n[0].toUpperCase() + n.slice(1);
  game.emit('alarm', `${who} ha preso la Corona d'Ombra!`,
    h.faction === 'shadow' ? 'Se l\'Ombra la tiene accanto alla sua base per 90 secondi, vince'
      : `Va portata alla Fenditura di Fuoco (si cammina più piano) e lì servono ${CROWN.ritual} secondi di rito, prima che la corruzione arrivi al 100%`);
}
function dropCrown(game, x, z) {
  const c = game.crown;
  const h = c.holder;
  if (h && h.attackBase) { h.attack = h.attackBase; h.attackBase = null; }
  if (h && h.speedBase) { h.speed = h.speedBase; h.speedBase = null; }
  c.holder = null; c.dominion = 0; c.ritual = 0;
  c.ground = { x, z };
  c.marker.position.set(x, 0.3, z);
  c.marker.visible = true;
  game.emit('alarm', 'La Corona d\'Ombra è caduta a terra', 'Il primo eroe che la raggiunge la raccoglie');
}
// al 100% l'eroe cede alla Corona: diventa un nemico di tutti
function corrupt(game, h) {
  const f = h.faction;
  dropCrown(game, h.x, h.z);
  game.players[f].heroData = { level: h.level, xp: 0, summoned: true };
  h.origFaction = f; h.faction = NEUTRAL; h.home = { x: h.x, z: h.z }; h.state = 'idle'; h.corruption = 1;
  const n = FACTIONS[f].names.hero;
  game.emit('alarm', `${n[0].toUpperCase() + n.slice(1)} ${f === 'elves' ? 'è stata corrotta' : 'è stato corrotto'} dalla Corona!`, 'Ora combatte contro tutti. Si può evocare un nuovo eroe dal centro.');
}
export function onKilled(game, e) {
  if (game.crown?.holder === e) dropCrown(game, e.x, e.z);
  if (e.type === 'dragon' && e.faction === NEUTRAL) game.emit('alarm', 'Il Drago è stato abbattuto!', 'Il tesoro della sua tana aspetta il primo che arriva');
  if (e.type === 'flame') game.emit('alarm', 'Il Flagello di Fiamma è stato sconfitto!', '');
}

// Bjarn: si ingaggia dalla sua capanna se si ha un'unità vicina (non per l'Ombra)
export function hireBlock(game, f, hut) {
  if (f === 'shadow') return 'Bjarn non combatte per l\'Ombra';
  if (hut.hired) return 'Bjarn è già stato ingaggiato';
  if (!game.units.some(u => u.alive && u.faction === f && dist(u.x, u.z, hut.x, hut.z) < 5)) return 'Serve una tua unità vicino alla capanna';
  return null;
}
export function hireBjarn(game, f, hut) {
  const why = hireBlock(game, f, hut);
  if (why) { game.msg(f, why); return false; }
  if (!game.canAfford(f, HIRE_BJARN)) { game.msg(f, 'Risorse insufficienti'); return false; }
  game.pay(f, HIRE_BJARN);
  hut.hired = f;
  const c = game.grid.nearestFree(hut.x, hut.z + 2);
  spawnCreature(game, 'bjarn', f, c.x + 0.5, c.z + 0.5);
  game.msg(f, 'Bjarn l\'Uomo-Orso combatte al vostro fianco!');
  if (f !== game.player) game.msg(game.player, 'Il nemico ha ingaggiato Bjarn l\'Uomo-Orso');
  game.emit('site', hut);
  return true;
}
