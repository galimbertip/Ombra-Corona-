// ============================================================================
// GPverse — Ombra & Corona
// Versione e storia dell'app (schema V.major.minor.patch)
//
// REGOLA: a ogni rilascio
//   1. aggiorna VERSION qui sotto
//   2. aggiungi una voce IN CIMA a HISTORY
//   3. aggiungi la stessa voce in CHANGELOG.md
// La schermata "Storia" nel gioco legge da HISTORY.
// ============================================================================

export const GAME_TITLE = 'Ombra & Corona';
export const BRAND = 'GPverse';
export const VERSION = 'V.0.3.0';

export const HISTORY = [
  {
    version: 'V.0.3.0',
    date: '2026-11-22',
    title: 'Nuova grafica',
    changes: [
      'Grafica dipinta generata con Arena AI: unità, eroi, edifici, risorse, terreno, icone e abilità',
      'Visuale isometrica fissa come in Age of Empires: niente più rotazione, restano spostamento e zoom',
      'Terreno dipinto: prato, cenere verso la Terra Cinerea e terra battuta intorno alle basi',
      'Gli edifici in costruzione mostrano il cantiere e poi compaiono a lavori quasi finiti',
      'Le unità si girano verso dove camminano, saltellano in marcia e lampeggiano quando vengono colpite',
      'Icone dipinte per risorse, pulsanti e abilità; ritratto dell\'elemento selezionato',
      'Schermata iniziale con paesaggio e stemma del gioco',
      'La Casa degli Uomini ha due varianti',
    ],
  },
  {
    version: 'V.0.2.0',
    date: '2026-11-17',
    title: 'Ere ed eroi',
    changes: [
      'Tre ere: Prima, Seconda e Terza Era, con avanzamento dal Centro Città',
      'Ogni era rinforza il Centro Città (più punti vita e frecce più forti)',
      'Nuove unità: Arciere (Seconda Era, attacca a distanza) e Cavaliere della Marca / Cavaliere di Lupi (Terza Era)',
      'Eroi in stile Warcraft III: il Re Ramingo (Uomini) e il Bianco Traditore (Ombra)',
      'Gli eroi salgono di livello con l\'esperienza: livello massimo 5 nella Seconda Era, 10 nella Terza',
      'Tre abilità per eroe (sblocco ai livelli 1, 3 e 6), tasti 1/2/3 o pulsanti',
      'L\'eroe caduto si rianima dal Centro Città conservando il livello',
      'Pulsante 👑 (tasto R) per trovare subito l\'eroe',
      'IA dell\'Ombra: avanza di era, evoca l\'eroe, usa le abilità e mescola le unità',
      'Annuncio a tutto schermo quando si cambia era',
    ],
  },
  {
    version: 'V.0.1.0',
    date: '2026-11-15',
    title: 'Prototipo',
    changes: [
      'Prima versione giocabile: Uomini di Pietrabianca contro Ombra della Terra Cinerea',
      'Mappa 3D low-poly con alberi, cespugli di bacche, cave di pietra e miniere d\'oro',
      'Risorse: cibo, legno, pietra, oro; popolazione con case',
      'Edifici: Centro Città (scocca frecce), Casa, Fattoria (cibo infinito), Caserma',
      'Unità: Contadino (raccoglie e costruisce), Lanciere / Orco Nero (combattono)',
      'Pathfinding A* su griglia, combattimento corpo a corpo con barre vita',
      'IA nemica semplice: economia, case, caserma, ondate di attacco',
      'Controlli PC (mouse e tastiera) e touch (tap, trascinamento, pizzico)',
      'Vittoria distruggendo il Centro Città nemico',
      'Schermata "Storia" con le versioni dell\'app',
    ],
  },
];
