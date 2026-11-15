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
export const VERSION = 'V.0.1.0';

export const HISTORY = [
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
