// GPverse — Ombra & Corona — campagne (dalla V.0.9.0; Elfi, Nani e Ombra dalla V.0.10.0)
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
const lands = (g, f) => g.territory.owned(f).length;
const treasures = (g, type) => site(g, type).filter(s => s.takenBy === g.player).length;
const slain = (g, type) => g.slain?.[type] || 0;
const mined = g => site(g, 'deep_mine').reduce((a, s) => a + (s.minedBy?.[g.player] || 0), 0);
const hero = g => !!g.players[g.player].heroData;
const enemyBase = g => g.buildings.some(b => b.alive && b.faction === g.enemy && b.type === 'tc');
const NO_CROWN = { crown: false, rift: false };

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
  elves: {
    faction: 'elves',
    name: 'Il Canto del Bosco d\'Oro',
    desc: 'Quattro missioni con gli Elfi: dalle radici malate del bosco all\'ultima luce sulla Fenditura',
    missions: [
      {
        id: 'elves1',
        title: 'Le Radici Malate',
        place: 'Foreste Antiche',
        map: 'foreste', seed: 5101,
        mapOverrides: NO_CROWN,
        enemy: 'shadow', difficulty: 'easy',
        ai: { firstWave: 99999, villagers: 7 },
        intro: [
          'Nel cuore delle Foreste Antiche gli alberi si ammalano: l\'Ombra avvelena le radici per aprirsi la strada verso il Bosco d\'Oro.',
          'Allarga i confini degli Elfi, riprendi le radure e caccia le bande di Orchi che entrano nel bosco.',
        ],
        objectives: [
          { text: 'Arriva a 8 raccoglitori', check: g => alive(g, g.player, 'villager').length >= 8 },
          { text: 'Colonizza due nuovi territori', check: g => lands(g, g.player) >= 3 },
          { text: 'Respingi le due bande di Orchi', check: (g, m) => m.raidsDone >= 2 },
        ],
        events: [
          { at: 260, title: 'Orchi nel bosco!', sub: 'Una banda punta al Palazzo d\'Oro', raid: { soldier: 3 } },
          { at: 470, title: 'Altri Orchi!', sub: 'Stavolta con gli arcieri', raid: { soldier: 4, archer: 2 } },
        ],
        outro: 'Il bosco respira di nuovo. Ma le radici avvelenate portano verso le valli: qualcuno guida gli Orchi.',
      },
      {
        id: 'elves2',
        title: 'La Signora del Bosco',
        place: 'Valle di Mezzo',
        map: 'valle', seed: 5202,
        mapOverrides: { ...NO_CROWN, sites: ['eagle_nest'], pairs: ['ruins'] },
        enemy: 'shadow', difficulty: 'easy',
        ai: { firstWave: 560 },
        start: { res: { food: 300, wood: 250, gold: 100 } },
        intro: [
          'La Signora del Bosco lascia il Palazzo d\'Oro per la prima volta da un secolo.',
          'Nella Valle di Mezzo le antiche rovine elfiche sono in mano ai lupi, e sulle cime le Aquile dei Picchi aspettano un segno.',
        ],
        objectives: [
          { text: 'Raggiungi la Seconda Era', check: g => g.players[g.player].era >= 2 },
          { text: 'Chiama la Signora del Bosco', check: hero },
          { text: 'Riprendi il tesoro di una delle rovine', check: g => treasures(g, 'ruins') >= 1 },
          { text: 'Porta la Signora al Nido delle Aquile', check: g => site(g, 'eagle_nest').some(s => s.used === g.player) },
        ],
        outro: 'Le Aquile volano per gli Elfi. Dall\'alto hanno visto un fumo nero salire dal Nord, dove dorme un drago.',
      },
      {
        id: 'elves3',
        title: 'Il Drago dell\'Inverno',
        place: 'Terre Gelide',
        map: 'gelide', seed: 5303,
        mapOverrides: { ...NO_CROWN, sites: ['lair', 'bear_hut'], pairs: ['ruins'] },
        enemy: 'dwarves', difficulty: 'normal',
        ai: { firstWave: 420 },
        start: { era: 2, res: { food: 450, wood: 300, stone: 100, gold: 200 } },
        intro: [
          'Al Nord il drago si è svegliato e i Nani di Khazrun lo vogliono abbattere per il suo oro. Gli Elfi non si fidano: quel tesoro non deve finire nelle loro forge.',
          'L\'inverno qui dura il doppio. Fai scorte di cibo prima che arrivi la neve.',
        ],
        objectives: [
          { text: 'Chiama la Signora del Bosco', check: hero },
          { text: 'Sopravvivi al primo inverno', check: g => g.seasons.year >= 2 },
          { text: 'Abbatti il Drago', check: g => slain(g, 'dragon') >= 1 },
        ],
        outro: 'Il drago è caduto. Nel suo covo, tra l\'oro, nessuna traccia della Corona: l\'Ombra l\'ha già portata nelle Lande Bruciate.',
      },
      {
        id: 'elves4',
        title: 'L\'Ultima Luce',
        place: 'Lande Bruciate',
        map: 'lande', seed: 5404,
        mapOverrides: { sites: ['lair'], pairs: ['ruins'] },
        enemy: 'shadow', difficulty: 'hard',
        enemyStart: { era: 2, res: { food: 600, wood: 500, stone: 200, gold: 300 }, units: { villager: 6, soldier: 5, archer: 3 } },
        start: { era: 2, res: { food: 500, wood: 400, stone: 200, gold: 300 }, units: { soldier: 3, archer: 3 } },
        intro: [
          'Nelle Lande Bruciate la Corona d\'Ombra aspetta sul suo piedistallo. La Signora deve prenderla e gettarla nella Fenditura di Fuoco prima che la corruzione la vinca.',
          'Il Drago delle Lande fa la guardia al suo tesoro. Se l\'Ombra tiene la Corona accanto alla sua Fortezza per 90 secondi, la luce si spegne per sempre.',
        ],
        objectives: [
          { text: 'Chiama la Signora del Bosco', check: hero },
          { text: 'Prendi la Corona d\'Ombra', check: (g, m) => m.crownTaken || (m.crownTaken = g.crown?.holder?.faction === g.player) },
          { text: 'Gettala nella Fenditura di Fuoco', check: () => false },
        ],
        outro: 'La Corona è distrutta. Il canto del Bosco d\'Oro torna a risuonare in tutto il Mondo di Mezzo.',
      },
    ],
  },
  dwarves: {
    faction: 'dwarves',
    name: 'Il Martello di Khazrun',
    desc: 'Quattro missioni con i Nani: dalle Porte di Pietra alla riconquista delle terre del Re sotto la Montagna',
    missions: [
      {
        id: 'dwarves1',
        title: 'Le Porte di Pietra',
        place: 'Monti Grigi',
        map: 'monti', seed: 6101,
        mapOverrides: { ...NO_CROWN, sites: ['eagle_nest'], pairs: [] },
        enemy: 'shadow', difficulty: 'easy',
        ai: { firstWave: 99999, villagers: 7 },
        intro: [
          'Gli Orchi hanno scoperto i passaggi verso Khazrun. Le Porte di Pietra vanno difese a ogni costo.',
          'Scava, costruisci una Forgia di Guerra e prepara i guerrieri: le bande dell\'Ombra arriveranno dai valichi.',
        ],
        objectives: [
          { text: 'Arriva a 10 minatori', check: g => alive(g, g.player, 'villager').length >= 10 },
          { text: 'Costruisci una Forgia di Guerra', check: g => hasBuilding(g, g.player, 'barracks') },
          { text: 'Respingi le tre bande dell\'Ombra', check: (g, m) => m.raidsDone >= 3 },
        ],
        events: [
          { at: 240, title: 'Orchi ai valichi!', sub: 'Una banda scende verso le Porte', raid: { soldier: 3 } },
          { at: 420, title: 'Seconda banda!', sub: 'Hanno portato gli arcieri', raid: { soldier: 3, archer: 2 } },
          { at: 600, title: 'L\'assalto alle Porte!', sub: 'Il grosso dell\'orda', raid: { soldier: 5, archer: 3 } },
        ],
        outro: 'Le Porte di Pietra reggono. Ma le gallerie più profonde sono invase dai troll.',
      },
      {
        id: 'dwarves2',
        title: 'I Troll delle Caverne',
        place: 'Terre Aperte',
        map: 'aperte', seed: 6202,
        mapOverrides: { ...NO_CROWN, sites: ['eagle_nest'], pairs: ['troll_cave', 'troll_cave'] },
        enemy: 'elves', difficulty: 'easy',
        ai: { firstWave: 600 },
        start: { res: { food: 300, wood: 300, gold: 100 } },
        intro: [
          'Le vecchie miniere dei Nani sono diventate tane di troll, e dentro c\'è ancora l\'oro degli antenati.',
          'Il Re sotto la Montagna guida la spedizione. Gli Elfi sono accampati vicino: non sono nemici dichiarati, ma non sono nemmeno amici.',
        ],
        objectives: [
          { text: 'Raggiungi la Seconda Era', check: g => g.players[g.player].era >= 2 },
          { text: 'Chiama il Re sotto la Montagna', check: hero },
          { text: 'Svuota due grotte dei troll e prendi i tesori', check: g => treasures(g, 'troll_cave') >= 2 },
        ],
        outro: 'L\'oro degli antenati torna a Khazrun. Nelle cronache trovate nelle grotte si parla di una miniera più profonda, e di ciò che dorme sotto.',
      },
      {
        id: 'dwarves3',
        title: 'Il Risveglio',
        place: 'Lande Bruciate',
        map: 'lande', seed: 6303,
        mapOverrides: { ...NO_CROWN, sites: ['deep_mine'], pairs: ['ruins'] },
        enemy: 'shadow', difficulty: 'normal',
        ai: { firstWave: 420 },
        start: { era: 2, res: { food: 400, wood: 350, stone: 150, gold: 150 } },
        intro: [
          'La Miniera Profonda delle Lande è la più ricca mai scavata. Gli antenati la chiusero per un motivo: sotto dorme il Flagello di Fiamma.',
          'Il Re sotto la Montagna ha deciso: si scava, e quando il Flagello si sveglierà, i Nani saranno pronti.',
        ],
        objectives: [
          { text: 'Chiama il Re sotto la Montagna', check: hero },
          { text: 'Estrai 300 oro dalla Miniera Profonda', check: g => mined(g) >= 300 },
          { text: 'Sconfiggi il Flagello di Fiamma', check: g => slain(g, 'flame') >= 1 },
        ],
        outro: 'Il Flagello è caduto per mano dei Nani: una gesta che si canterà per mille anni. Ora resta solo l\'Ombra.',
      },
      {
        id: 'dwarves4',
        title: 'Il Re sotto la Montagna',
        place: 'Valle di Mezzo',
        map: 'valle', seed: 6404,
        mapOverrides: { sites: ['eagle_nest', 'bear_hut'], pairs: ['ruins'] },
        enemy: 'shadow', difficulty: 'hard',
        enemyStart: { era: 2, res: { food: 600, wood: 500, stone: 200, gold: 300 }, units: { villager: 6, soldier: 5, archer: 3 } },
        start: { era: 2, res: { food: 500, wood: 400, stone: 250, gold: 300 }, units: { soldier: 4 } },
        intro: [
          'L\'Ombra ha posto la sua Fortezza nel cuore della Valle di Mezzo. Il Re sotto la Montagna marcia con tutto Khazrun.',
          'Attento alla Corona d\'Ombra: se il Bianco Traditore la porta alla sua Fortezza e la tiene lì per 90 secondi, la guerra è perduta.',
        ],
        objectives: [
          { text: 'Chiama il Re sotto la Montagna', check: hero },
          { text: 'Raggiungi la Terza Era', check: g => g.players[g.player].era >= 3 },
          { text: 'Distruggi la Fortezza dell\'Ombra', check: g => !enemyBase(g) },
        ],
        outro: 'La Fortezza è crollata sotto i martelli di Khazrun. Il Re sotto la Montagna torna a casa da vincitore.',
      },
    ],
  },
  shadow: {
    faction: 'shadow',
    name: 'L\'Ascesa dell\'Ombra',
    desc: 'Quattro missioni con l\'Ombra della Terra Cinerea: dalle fosse degli schiavi al dominio della Corona',
    missions: [
      {
        id: 'shadow1',
        title: 'Le Fosse della Terra Cinerea',
        place: 'Lande Bruciate',
        map: 'lande', seed: 7101,
        mapOverrides: { ...NO_CROWN, sites: ['deep_mine'], pairs: [] },
        enemy: 'men', difficulty: 'easy',
        ai: { firstWave: 99999, villagers: 6 },
        intro: [
          'Nella Terra Cinerea le fosse si riempiono di schiavi e le forge non si spengono mai.',
          'Ai margini delle Lande gli Uomini hanno un avamposto. È ora di ricordare loro a chi appartiene questa terra.',
        ],
        objectives: [
          { text: 'Arriva a 12 schiavi', check: g => alive(g, g.player, 'villager').length >= 12 },
          { text: 'Costruisci una Fossa di Guerra', check: g => hasBuilding(g, g.player, 'barracks') },
          { text: 'Distruggi l\'avamposto degli Uomini', check: g => !enemyBase(g) },
        ],
        outro: 'L\'avamposto brucia. Gli Uomini fuggono verso la Valle di Mezzo: l\'Ombra li seguirà.',
      },
      {
        id: 'shadow2',
        title: 'Il Bianco Traditore',
        place: 'Valle di Mezzo',
        map: 'valle', seed: 7202,
        mapOverrides: { ...NO_CROWN, sites: ['eagle_nest'], pairs: ['ruins'] },
        enemy: 'men', difficulty: 'easy',
        ai: { firstWave: 540 },
        start: { res: { food: 300, wood: 300, gold: 100 } },
        intro: [
          'Il Bianco Traditore, un tempo saggio tra i saggi, ha scelto l\'Ombra. Ora guida le sue armate nella Valle di Mezzo.',
          'Prendi le terre degli Uomini una a una: ogni territorio conquistato è un passo verso la Corona.',
        ],
        objectives: [
          { text: 'Raggiungi la Seconda Era', check: g => g.players[g.player].era >= 2 },
          { text: 'Chiama il Bianco Traditore', check: hero },
          { text: 'Possiedi 5 territori', check: g => lands(g, g.player) >= 5 },
        ],
        outro: 'La Valle trema. Ma gli Elfi del Bosco d\'Oro si sono messi in mezzo: vanno spazzati via.',
      },
      {
        id: 'shadow3',
        title: 'Il Bosco d\'Oro Brucia',
        place: 'Foreste Antiche',
        map: 'foreste', seed: 7303,
        mapOverrides: { ...NO_CROWN, sites: ['bear_hut'], pairs: ['ruins'] },
        enemy: 'elves', difficulty: 'normal',
        ai: { firstWave: 360 },
        enemyStart: { res: { food: 400, wood: 300, gold: 150 }, units: { villager: 3, soldier: 2, archer: 2 } },
        start: { era: 2, res: { food: 400, wood: 300, stone: 150, gold: 200 } },
        intro: [
          'Gli Elfi custodiscono un segreto: sanno dove si trova la Corona d\'Ombra.',
          'Brucia il loro Palazzo d\'Oro e strappa il segreto dalle loro rovine.',
        ],
        objectives: [
          { text: 'Chiama il Bianco Traditore', check: hero },
          { text: 'Saccheggia una delle rovine', check: g => treasures(g, 'ruins') >= 1 },
          { text: 'Distruggi il Palazzo d\'Oro degli Elfi', check: g => !enemyBase(g) },
        ],
        outro: 'Tra le ceneri del Palazzo d\'Oro c\'è una mappa: la Corona riposa sui Monti Grigi.',
      },
      {
        id: 'shadow4',
        title: 'Il Dominio',
        place: 'Monti Grigi',
        map: 'monti', seed: 7404,
        mapOverrides: { sites: ['eagle_nest', 'deep_mine'], pairs: ['troll_cave'] },
        enemy: 'men', difficulty: 'hard',
        enemyStart: { era: 2, res: { food: 600, wood: 500, stone: 200, gold: 300 }, units: { villager: 6, soldier: 5, archer: 3 } },
        start: { era: 2, res: { food: 500, wood: 400, stone: 200, gold: 300 }, units: { soldier: 3, archer: 2 } },
        intro: [
          'La Corona d\'Ombra è vicina. Il Bianco Traditore deve prenderla e portarla alla sua Fortezza: se la tiene lì per 90 secondi, il Mondo di Mezzo si piegherà.',
          'Gli Uomini lo sanno e cercheranno di portarla alla Fenditura di Fuoco per distruggerla.',
        ],
        objectives: [
          { text: 'Chiama il Bianco Traditore', check: hero },
          { text: 'Prendi la Corona d\'Ombra', check: (g, m) => m.crownTaken || (m.crownTaken = g.crown?.holder?.faction === g.player) },
          { text: 'Tienila accanto alla Fortezza per 90 secondi', check: () => false },   // la vittoria arriva dal dominio (creatures.js)
        ],
        outro: 'L\'Ombra domina la Corona.',
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
