// GPverse — Ombra & Corona — simulazione di gioco (V.0.1.0)
import { UNITS, BUILDINGS, FACTIONS, START_RES, GATHER_RATE, CARRY_MAX, POP_LIMIT, AGGRO_RANGE, RES } from './config.js';
import { buildWorld, findPath, hideNode, BASES } from './world.js';
import { Unit, Building } from './entities.js';
import * as THREE from '../lib/three.module.js';

const ARROW_GEO = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4).rotateX(Math.PI / 2);
const ARROW_MAT = new THREE.MeshBasicMaterial({ color: 0x2b1d0e });

const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

// distanza da un punto al bordo di un rettangolo di celle
function distRect(x, z, r) {
  const dx = Math.max(r.x0 - x, 0, x - (r.x1 + 1));
  const dz = Math.max(r.z0 - z, 0, z - (r.z1 + 1));
  return Math.hypot(dx, dz);
}
function rectOf(t) {
  if (t.kind === 'building') return t.rect;
  if (t.kind === 'node') return { x0: t.x, z0: t.z, x1: t.x, z1: t.z };
  return null;
}
// distanza "utile" tra un'unità e un bersaglio
export function reach(u, t) {
  const r = rectOf(t);
  if (r) return distRect(u.x, u.z, r);
  return dist(u.x, u.z, t.x, t.z) - (t.radius || 0);
}

export class Game {
  constructor(scene, { seed = Date.now() % 100000, difficulty = 'normal' } = {}) {
    this.scene = scene;
    this.seed = seed;
    this.difficulty = difficulty;
    this.time = 0;
    this.over = null;              // 'win' | 'lose'
    this.listeners = { message: [], over: [], died: [] };
    const w = buildWorld(scene, seed);
    this.grid = w.grid; this.nodes = w.nodes; this.ground = w.ground;
    this.units = []; this.buildings = []; this.arrows = [];
    this.players = {};
    for (const f of Object.keys(FACTIONS)) this.players[f] = { res: { ...START_RES }, popCap: 0 };
    if (difficulty === 'hard') this.players.shadow.res = { food: 400, wood: 400, stone: 200, gold: 150 };

    // basi iniziali
    for (const f of Object.keys(BASES)) {
      const b = BASES[f];
      const tc = this.addBuilding('tc', f, b.x, b.z, true);
      for (let i = 0; i < 3; i++) this.spawnNear(tc, 'villager');
      if (f === 'men') this.spawnNear(tc, 'soldier');
    }
  }

  on(ev, fn) { this.listeners[ev].push(fn); }
  emit(ev, ...a) { this.listeners[ev].forEach(fn => fn(...a)); }
  msg(faction, text) { if (faction === 'men') this.emit('message', text); }

  // ---- economia ----------------------------------------------------------
  canAfford(f, cost) { const r = this.players[f].res; return Object.entries(cost).every(([k, v]) => r[k] >= v); }
  pay(f, cost) { const r = this.players[f].res; for (const [k, v] of Object.entries(cost)) r[k] -= v; }
  refund(f, cost) { const r = this.players[f].res; for (const [k, v] of Object.entries(cost)) r[k] += v; }
  pop(f) {
    let n = 0;
    for (const u of this.units) if (u.alive && u.faction === f) n++;
    for (const b of this.buildings) if (b.alive && b.faction === f) n += b.queue.length ? 0 : 0;
    return n;
  }
  popCap(f) {
    let c = 0;
    for (const b of this.buildings) if (b.alive && b.built && b.faction === f) c += BUILDINGS[b.type].popCap;
    return Math.min(c, POP_LIMIT);
  }

  // ---- creazione ----------------------------------------------------------
  addBuilding(type, faction, cx, cz, built = false) {
    const b = new Building(type, faction, cx, cz, built);
    this.grid.occupy(cx, cz, b.size, b.size, b);
    this.buildings.push(b);
    this.scene.add(b.mesh);
    // sposta le unità rimaste sotto l'edificio
    for (const u of this.units) {
      if (!u.alive) continue;
      if (!this.grid.isFree(Math.floor(u.x), Math.floor(u.z))) {
        const c = this.grid.nearestFree(u.x, u.z);
        if (c) { u.x = c.x + 0.5; u.z = c.z + 0.5; }
      }
    }
    return b;
  }
  canPlace(type, cx, cz) {
    const s = BUILDINGS[type].size;
    return this.grid.areaFree(cx, cz, s, s);
  }
  // piazza un cantiere pagando il costo
  placeBuilding(type, faction, cx, cz) {
    const cost = BUILDINGS[type].cost;
    if (!this.canPlace(type, cx, cz)) { this.msg(faction, 'Non si può costruire qui'); return null; }
    if (!this.canAfford(faction, cost)) { this.msg(faction, 'Risorse insufficienti'); return null; }
    this.pay(faction, cost);
    return this.addBuilding(type, faction, cx, cz, false);
  }
  spawnNear(b, type) {
    const r = b.rect;
    const cells = [];
    for (let z = r.z0 - 1; z <= r.z1 + 1; z++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) {
      if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) continue;
      if (this.grid.isFree(x, z)) cells.push({ x, z });
    }
    // preferisci il lato verso il centro mappa
    cells.sort((a, c) => dist(a.x, a.z, 32, 32) - dist(c.x, c.z, 32, 32));
    const c = cells[Math.floor(Math.random() * Math.min(4, cells.length))] || this.grid.nearestFree(b.x, b.z + b.size);
    const u = new Unit(type, b.faction, c.x + 0.5, c.z + 0.5);
    this.units.push(u);
    this.scene.add(u.mesh);
    if (b.rally) this.orderMove([u], b.rally.x, b.rally.z);
    return u;
  }
  train(b, type) {
    if (!b.built || !BUILDINGS[b.type].trains.includes(type)) return false;
    if (b.queue.length >= 5) { this.msg(b.faction, 'Coda piena'); return false; }
    const cost = UNITS[type].cost;
    if (!this.canAfford(b.faction, cost)) { this.msg(b.faction, 'Risorse insufficienti'); return false; }
    this.pay(b.faction, cost);
    b.queue.push({ type, t: 0 });
    return true;
  }
  cancelTrain(b) {
    const q = b.queue.pop();
    if (q) this.refund(b.faction, UNITS[q.type].cost);
  }

  // ---- ordini ------------------------------------------------------------
  setPath(u, goal) {
    u.path = findPath(this.grid, u.x, u.z, goal) || [];
    u.repath = 0.6 + Math.random() * 0.3;
  }
  orderMove(units, x, z) {
    // formazione: le unità si dispongono a spirale intorno al punto
    const n = units.length;
    units.forEach((u, i) => {
      const ang = i * 2.4, rad = n > 1 ? 0.55 * Math.sqrt(i) : 0;
      const c = this.grid.nearestFree(x + Math.cos(ang) * rad, z + Math.sin(ang) * rad);
      if (!c) return;
      u.state = 'move'; u.target = null; u.dest = { x: c.x + 0.5, z: c.z + 0.5 };
      this.setPath(u, c);
    });
  }
  orderAttackMove(units, x, z) {
    this.orderMove(units, x, z);
    units.forEach(u => { u.state = 'attackMove'; u.amDest = { x, z }; });
  }
  orderAttack(units, target) {
    units.forEach(u => { u.state = 'attack'; u.target = target; u.amDest = null; u.path = []; u.repath = 0; });
  }
  orderGather(units, node) {
    units.filter(u => u.type === 'villager').forEach(u => {
      if (u.carryRes && u.carryRes !== node.res) { u.carry = 0; }
      u.state = 'gather'; u.target = node; u.gatherType = node.type; u.phase = 'go'; u.path = []; u.repath = 0;
    });
  }
  orderBuild(units, b) {
    units.filter(u => u.type === 'villager').forEach(u => { u.state = 'build'; u.target = b; u.path = []; u.repath = 0; });
  }
  // ordine "intelligente" dato da clic destro / tap
  smartOrder(units, target, x, z) {
    if (!units.length) return;
    const f = units[0].faction;
    if (target && target.kind !== 'node' && target.faction !== f) return this.orderAttack(units, target);
    if (target && target.kind === 'node') {
      const vill = units.filter(u => u.type === 'villager');
      if (vill.length) this.orderGather(vill, target);
      const rest = units.filter(u => u.type !== 'villager');
      if (rest.length) this.orderMove(rest, x, z);
      return;
    }
    if (target && target.kind === 'building' && target.faction === f) {
      const vill = units.filter(u => u.type === 'villager');
      if (target.built && target.type === 'farm' && vill.length) { this.orderGather(vill, target); const r = units.filter(u => u.type !== 'villager'); if (r.length) this.orderMove(r, x, z); return; }
      if (!target.built && vill.length) this.orderBuild(vill, target);
      else if (target.built && BUILDINGS[target.type].dropoff && vill.length) {
        vill.forEach(u => { if (u.carry > 0) { u.state = 'gather'; u.phase = 'drop'; u.target = null; u.path = []; u.repath = 0; } else this.orderMove([u], x, z); });
      }
      const rest = units.filter(u => u.type !== 'villager' || target.built && !BUILDINGS[target.type].dropoff);
      if (rest.length) this.orderMove(rest, x, z);
      return;
    }
    this.orderMove(units, x, z);
  }

  // ---- ricerche ----------------------------------------------------------
  nearestNode(type, x, z, maxD = 20, faction = null) {
    let best = null, bd = maxD;
    if (type === 'farm') { // le fattorie sono edifici della propria fazione, cibo infinito
      for (const b of this.buildings) {
        if (!b.alive || !b.built || b.type !== 'farm' || b.faction !== faction) continue;
        const busy = this.units.filter(u => u.alive && u.state === 'gather' && u.target === b).length;
        const d = dist(x, z, b.x, b.z) + busy * 6;
        if (d < bd) { bd = d; best = b; }
      }
      return best;
    }
    for (const n of this.nodes) {
      if (!n.alive || n.type !== type) continue;
      const d = dist(x, z, n.x + 0.5, n.z + 0.5);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  nearestDropoff(f, x, z) {
    let best = null, bd = Infinity;
    for (const b of this.buildings) {
      if (!b.alive || !b.built || b.faction !== f || !BUILDINGS[b.type].dropoff) continue;
      const d = dist(x, z, b.x, b.z);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  nearestEnemy(u, range) {
    let best = null, bd = range;
    for (const e of this.units) {
      if (!e.alive || e.faction === u.faction) continue;
      const d = dist(u.x, u.z, e.x, e.z);
      if (d < bd) { bd = d; best = e; }
    }
    if (best) return best;
    for (const b of this.buildings) {
      if (!b.alive || b.faction === u.faction) continue;
      const d = reach(u, b);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }

  // ---- danni -------------------------------------------------------------
  damage(target, amount, attacker) {
    if (!target.alive) return;
    target.hp -= amount;
    if (target.kind === 'unit' && attacker && target.alive) {
      // reazione: i militari inattivi rispondono, i contadini scappano verso casa
      if (target.isMilitary && (target.state === 'idle' || target.state === 'move' && target.faction === 'shadow')) this.orderAttack([target], attacker);
    }
    if (target.faction === 'men' && attacker && this.time - (this._lastAlert || -99) > 8) {
      this._lastAlert = this.time; this.msg('men', 'Siamo sotto attacco!');
    }
    if (target.hp <= 0) this.kill(target);
  }
  kill(e) {
    e.alive = false;
    this.scene.remove(e.mesh);
    if (e.kind === 'building') {
      this.grid.release(e.cx, e.cz, e.size, e.size);
      if (e.type === 'tc') {
        const others = this.buildings.some(b => b.alive && b.faction === e.faction && b.type === 'tc');
        if (!others) this.finish(e.faction === 'men' ? 'lose' : 'win');
      }
    }
    this.emit('died', e);
  }
  finish(result) {
    if (this.over) return;
    this.over = result;
    this.emit('over', result);
  }

  // ---- ciclo -------------------------------------------------------------
  update(dt) {
    if (this.over) return;
    this.time += dt;

    // code di addestramento
    for (const b of this.buildings) {
      if (!b.alive || !b.built || !b.queue.length) continue;
      const q = b.queue[0];
      const cap = this.popCap(b.faction), pop = this.pop(b.faction);
      if (pop >= cap) { if (!b._capWarn) { this.msg(b.faction, 'Popolazione al massimo: costruisci case'); b._capWarn = true; } continue; }
      b._capWarn = false;
      q.t += dt;
      if (q.t >= UNITS[q.type].time) { b.queue.shift(); this.spawnNear(b, q.type); }
    }

    // il Centro Città scocca frecce sui nemici vicini (come in AoE)
    for (const b of this.buildings) {
      const st = BUILDINGS[b.type];
      if (!b.alive || !b.built || !st.arrows) continue;
      b.cd = (b.cd || 0) - dt;
      if (b.cd > 0) continue;
      let t = null, bd = st.arrows.range;
      for (const u of this.units) {
        if (!u.alive || u.faction === b.faction) continue;
        const d = Math.hypot(u.x - b.x, u.z - b.z) - b.size / 2;
        if (d < bd) { bd = d; t = u; }
      }
      if (t) { b.cd = st.arrows.cooldown; this.shoot(b, t, st.arrows.damage); }
    }
    this.updateArrows(dt);

    for (const u of this.units) if (u.alive) this.updateUnit(u, dt);
    this.separate(dt);

    // pulizia
    if (this.units.some(u => !u.alive)) this.units = this.units.filter(u => u.alive);
    if (this.buildings.some(b => !b.alive)) this.buildings = this.buildings.filter(b => b.alive);
  }

  shoot(from, target, damage) {
    const m = new THREE.Mesh(ARROW_GEO, ARROW_MAT);
    m.position.set(from.x, 2.6, from.z);
    this.scene.add(m);
    this.arrows.push({ m, from, target, damage, t: 0, sx: from.x, sz: from.z });
  }
  updateArrows(dt) {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      a.t += dt * 2.2;
      const tx = a.target.x, tz = a.target.z;
      const k = Math.min(1, a.t);
      const x = a.sx + (tx - a.sx) * k, z = a.sz + (tz - a.sz) * k, y = 2.6 * (1 - k) + 0.6 * k + Math.sin(k * Math.PI) * 1.2;
      a.m.lookAt(x, y, z);
      a.m.position.set(x, y, z);
      if (k >= 1) {
        this.scene.remove(a.m);
        this.arrows.splice(i, 1);
        if (a.target.alive) this.damage(a.target, a.damage, a.from.alive ? a.from : null);
      }
    }
  }

  followPath(u, dt) {
    if (!u.path.length) return true;
    const wp = u.path[0];
    const dx = wp.x - u.x, dz = wp.z - u.z, d = Math.hypot(dx, dz);
    const step = u.speed * dt;
    if (d <= step) { u.x = wp.x; u.z = wp.z; u.path.shift(); }
    else { u.x += (dx / d) * step; u.z += (dz / d) * step; }
    u.face = Math.atan2(dx, dz);
    u.moving = true;
    return !u.path.length;
  }
  approach(u, target, dt) {
    u.repath -= dt;
    if (u.repath <= 0 || !u.path.length) {
      const r = rectOf(target);
      if (r) this.setPath(u, r);
      else { const c = this.grid.nearestFree(target.x, target.z); if (c) this.setPath(u, c); }
      if (!u.path.length && !r) { // stesso punto: muovi diretto
        const dx = target.x - u.x, dz = target.z - u.z, d = Math.hypot(dx, dz) || 1;
        u.x += dx / d * u.speed * dt; u.z += dz / d * u.speed * dt; u.moving = true;
      }
    }
    this.followPath(u, dt);
  }

  updateUnit(u, dt) {
    u.cd -= dt; u.moving = false;
    switch (u.state) {
      case 'idle':
        if (u.isMilitary) {
          const e = this.nearestEnemy(u, AGGRO_RANGE);
          if (e) this.orderAttack([u], e);
        }
        break;
      case 'move':
        if (this.followPath(u, dt)) u.state = 'idle';
        break;
      case 'attackMove': {
        const e = this.nearestEnemy(u, AGGRO_RANGE);
        if (e) { const am = u.amDest; this.orderAttack([u], e); u.amDest = am; break; }
        if (this.followPath(u, dt)) u.state = 'idle';
        break;
      }
      case 'attack': {
        const t = u.target;
        if (!t || !t.alive) {
          const e = u.isMilitary ? this.nearestEnemy(u, AGGRO_RANGE) : null;
          if (e) { u.target = e; break; }
          if (u.amDest) { const am = u.amDest; this.orderAttackMove([u], am.x, am.z); }
          else u.state = 'idle';
          break;
        }
        if (reach(u, t) <= u.range + 0.25) {
          u.path = [];
          u.face = Math.atan2(t.x - u.x, t.z - u.z);
          if (u.cd <= 0) { u.cd = u.cooldown; u.swing = 0.25; this.damage(t, u.attack, u); }
        } else this.approach(u, t, dt);
        break;
      }
      case 'gather': this.updateGather(u, dt); break;
      case 'build': {
        const b = u.target;
        if (!b || !b.alive || b.built) {
          u.state = 'idle';
          // dopo una casa/caserma il contadino torna a raccogliere se aveva un lavoro
          if (b && b.alive && b.type === 'farm') { this.orderGather([u], b); break; }
          if (u.gatherType) { const n = this.nearestNode(u.gatherType, u.x, u.z, 20, u.faction); if (n) this.orderGather([u], n); }
          break;
        }
        if (reach(u, b) <= 0.8) {
          u.path = [];
          u.face = Math.atan2(b.x - u.x, b.z - u.z);
          u.swing = u.swing > 0 ? u.swing : 0.3;
          const st = BUILDINGS[b.type];
          b.progress = Math.min(1, b.progress + dt / st.time);
          b.hp = Math.max(b.hp, Math.floor(b.maxHp * b.progress));
          if (b.progress >= 1) { b.built = true; b.hp = b.maxHp; this.msg(b.faction, `${FACTIONS[b.faction].names[b.type]} completata`); }
          b.updateConstructionLook();
        } else this.approach(u, b, dt);
        break;
      }
    }
    if (u.swing > 0) u.swing -= dt;
    u.mesh.position.set(u.x, 0, u.z);
    if (u.face !== undefined) u.model.rotation.y = u.face;
    // piccola animazione: saltella quando cammina, si china quando lavora
    u.anim += dt * (u.moving ? 12 : 0);
    u.model.position.y = u.moving ? Math.abs(Math.sin(u.anim)) * 0.06 : 0;
    u.model.rotation.x = u.swing > 0 ? 0.25 : 0;
  }

  updateGather(u, dt) {
    const p = this.players[u.faction];
    if (u.phase === 'drop' || u.carry >= CARRY_MAX) {
      u.phase = 'drop';
      const d = this.nearestDropoff(u.faction, u.x, u.z);
      if (!d) { u.state = 'idle'; return; }
      if (reach(u, d) <= 0.8) {
        if (u.carry > 0 && u.carryRes) p.res[u.carryRes] += Math.floor(u.carry);
        u.carry = 0; u.path = []; u.phase = 'go';
        if (!u.target || !u.target.alive) u.target = this.nearestNode(u.gatherType, u.x, u.z, 20, u.faction);
        if (!u.target) u.state = 'idle';
      } else this.approach(u, d, dt);
      return;
    }
    let n = u.target;
    if (!n || !n.alive) {
      n = u.target = this.nearestNode(u.gatherType, u.x, u.z, 14, u.faction);
      u.path = []; u.repath = 0;
      if (!n) { if (u.carry > 0) u.phase = 'drop'; else u.state = 'idle'; return; }
    }
    if (reach(u, n) <= 0.8) {
      u.path = [];
      const isFarm = n.kind === 'building';
      u.face = isFarm ? Math.atan2(n.x - u.x, n.z - u.z) : Math.atan2(n.x + 0.5 - u.x, n.z + 0.5 - u.z);
      if (u.swing <= 0) u.swing = 0.35;
      if (isFarm) { u.carry += GATHER_RATE * 0.8 * dt; u.carryRes = 'food'; return; }
      const take = Math.min(GATHER_RATE * dt, n.amount);
      n.amount -= take;
      u.carry += take; u.carryRes = n.res;
      if (n.amount <= 0) {
        n.alive = false;
        this.grid.release(n.x, n.z, 1, 1);
        hideNode(n);
      }
    } else this.approach(u, n, dt);
  }

  // le unità non si sovrappongono
  separate() {
    const us = this.units;
    for (let i = 0; i < us.length; i++) {
      const a = us[i]; if (!a.alive) continue;
      for (let j = i + 1; j < us.length; j++) {
        const b = us[j]; if (!b.alive) continue;
        const dx = b.x - a.x, dz = b.z - a.z;
        if (Math.abs(dx) > 0.5 || Math.abs(dz) > 0.5) continue;
        const d = Math.hypot(dx, dz) || 0.01;
        if (d < 0.45) {
          // chi cammina passa: si spostano solo le unità ferme (niente blocchi frontali)
          if (a.moving && b.moving) continue;
          const push = (0.45 - d) * 0.5;
          const px = dx / d * push, pz = dz / d * push;
          if (!a.moving && this.grid.isFree(Math.floor(a.x - px), Math.floor(a.z - pz))) { a.x -= px; a.z -= pz; }
          if (!b.moving && this.grid.isFree(Math.floor(b.x + px), Math.floor(b.z + pz))) { b.x += px; b.z += pz; }
        }
      }
    }
  }

  stats(f) {
    return {
      res: this.players[f].res,
      pop: this.pop(f),
      cap: this.popCap(f),
    };
  }
}

export { RES };
