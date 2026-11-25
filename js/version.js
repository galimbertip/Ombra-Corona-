// ============================================================================
// GPverse — Ombra & Corona
// Versione e storia dell'app (schema V.major.minor.patch)
//
// REGOLA: a ogni rilascio
//   1. aggiorna VERSION qui sotto
//   2. aggiungi una voce IN CIMA a HISTORY
//   3. aggiungi la stessa voce in CHANGELOG.md
//   4. aggiorna window.BUILD in index.html (serve a non far usare al browser file vecchi)
// La schermata "Storia" nel gioco legge da HISTORY.
// ============================================================================

export const GAME_TITLE = 'Ombra & Corona';
export const BRAND = 'GPverse';
export const VERSION = 'V.0.10.0';

export const HISTORY = [
  {
    version: 'V.0.10.0',
    date: '2026-11-25',
    title: 'Quattro campagne',
    changes: [
      'Arrivano le campagne di Elfi, Nani e Ombra: in tutto quattro campagne e 17 missioni, scelte con le schede dei quattro popoli',
      'Il Canto del Bosco d\'Oro (Elfi): Le Radici Malate · La Signora del Bosco · Il Drago dell\'Inverno · L\'Ultima Luce',
      'Il Martello di Khazrun (Nani): Le Porte di Pietra · I Troll delle Caverne · Il Risveglio (contro il Flagello di Fiamma) · Il Re sotto la Montagna',
      'L\'Ascesa dell\'Ombra (Ombra): Le Fosse della Terra Cinerea · Il Bianco Traditore · Il Bosco d\'Oro Brucia · Il Dominio (vinci tenendo la Corona)',
      'Nuovi obiettivi: territori da possedere, tesori da prendere, creature da abbattere, oro da estrarre dalla Miniera Profonda, sopravvivere all\'inverno',
      'Ogni scheda mostra quante missioni di quel popolo hai completato',
    ],
  },
  {
    version: 'V.0.9.0',
    date: '2026-11-25',
    title: 'Prima campagna',
    changes: [
      'Arriva la campagna: La Guerra della Corona, cinque missioni con gli Uomini di Pietrabianca (dal menu, pulsante Campagna)',
      '1 · Il Villaggio di Confine (Valle di Mezzo): fai crescere il borgo e respingi tre razzie dell\'Ombra',
      '2 · Le Rovine dei Lupi (Foreste Antiche): Seconda Era, chiama il Re Ramingo, libera le rovine e ingaggia Bjarn',
      '3 · I Picchi delle Aquile (Monti Grigi): alleati con le Aquile e distruggi l\'avamposto dell\'Ombra',
      '4 · Il Drago del Nord (Terre Gelide): abbatti il Drago e prendi la Corona d\'Ombra',
      '5 · La Fenditura di Fuoco (Lande Bruciate): porta la Corona alla Fenditura e distruggila',
      'Ogni missione ha la sua mappa fissa, un racconto prima di iniziare e gli obiettivi sempre visibili in alto a sinistra (tocca per ridurli)',
      'Le missioni si sbloccano una dopo l\'altra e i progressi restano salvati; a fine missione c\'è il pulsante Missione successiva',
      'Nelle missioni si vince con gli obiettivi: distruggere la base nemica da solo non basta',
    ],
  },
  {
    version: 'V.0.8.0',
    date: '2026-11-25',
    title: 'Ambientazioni',
    changes: [
      'Ogni ambientazione ha le sue creature e i suoi luoghi, invece di tutti in ogni mappa: Corona e Fenditura ci sono sempre, il resto cambia',
      'Valle di Mezzo: lupi nelle rovine, Bjarn e le Aquile · Foreste Antiche: tanti branchi di lupi e Bjarn · Terre Aperte: troll, Aquile e Miniera Profonda',
      'Nuova ambientazione Monti Grigi: terra e roccia, creste di pietra con valichi stretti, molto oro; troll nelle grotte, il Drago e la Miniera Profonda',
      'Nuova ambientazione Lande Bruciate: tutto cenere, pochi alberi e poco cibo, molto oro; il Drago e la Miniera Profonda',
      'Nuova ambientazione Terre Gelide: il Nord, con inverni quasi doppi ed estati corte, un velo di neve tutto l\'anno; lupi, troll, Bjarn e le Aquile',
      'Ogni ambientazione ha la sua luce e il suo terreno, che si sommano ai colori delle stagioni',
      'Roadmap: la prima campagna si sposta alla V.0.9.0',
    ],
  },
  {
    version: 'V.0.7.2',
    date: '2026-11-24',
    title: 'Camminata',
    changes: [
      'Camminata nuova senza saltelli: a ogni passo il personaggio dondola sui piedi da un lato all\'altro, con un leggero appoggio a terra',
      'Il ritmo dei passi segue la velocità di ogni unità, così i piedi non sembrano scivolare',
      'Andature diverse: passo normale per fanti ed eroi, passo pesante per troll, Arborei, Bjarn e Flagello, trotto per cavalli, arieti, lupi e drago',
      'Le aquile battono le ali e planano invece di camminare',
      'Partenze e fermate morbide, e da fermi i personaggi respirano appena',
    ],
  },
  {
    version: 'V.0.7.1',
    date: '2026-11-24',
    title: 'Addestramento in serie',
    changes: [
      'Coda di addestramento più lunga: fino a 10 unità per edificio',
      'Pulsante ×5 accanto a ogni unità (o Maiuscolo + clic): mette in coda 5 unità in un colpo, finché bastano le risorse',
      'Addestramento continuo 🔁: finita un\'unità ne riparte subito un\'altra uguale, finché ci sono risorse; si accende e spegne per ogni edificio',
    ],
  },
  {
    version: 'V.0.7.0',
    date: '2026-11-24',
    title: 'Creature e Corona d\'Ombra',
    changes: [
      'Creature selvagge a guardia dei luoghi della mappa: lupi, Troll delle Caverne e un Drago. Attaccano chi si avvicina e poi tornano alla tana',
      'Luoghi nuovi, sempre in posizioni giuste per entrambe le basi: Tana del Drago, Caverne dei Troll e Rovine con tesori da conquistare',
      'Nido delle Aquile: il primo eroe che ci arriva ottiene 3 Aquile dei Picchi, che volano sopra boschi e ostacoli',
      'Capanna di Bjarn: si ingaggia l\'Uomo-Orso, un guerriero fortissimo che si rigenera (non per l\'Ombra)',
      'Miniera Profonda: oro infinito e veloce, ma scavando troppo si risveglia il Flagello di Fiamma, che marcia sulla base di chi ha scavato di più',
      'La Corona d\'Ombra: la prende un eroe dalla Seconda Era. Attacco +50% e rigenerazione, ma la corruzione sale; al 100% l\'eroe passa contro tutti',
      'Nuove vittorie: portare la Corona alla Fenditura di Fuoco (chi la porta cammina più piano) e compiere un rito di 12 secondi, oppure (per l\'Ombra) tenerla 90 secondi accanto alla propria base',
      'In alto lo stato della Corona (clic per trovarla), barra della corruzione nella scheda dell\'eroe, luoghi e creature sulla minimappa',
      'L\'IA va a prendere la Corona nella Terza Era e ingaggia Bjarn quando ha oro',
    ],
  },
  {
    version: 'V.0.6.1',
    date: '2026-11-23',
    title: 'Correzioni e camera',
    changes: [
      'Corretto: dopo un aggiornamento il browser poteva mescolare file vecchi e nuovi del gioco, causando comportamenti strani (unità bloccate, popolazione sbagliata). Ora ogni versione carica sempre i suoi file',
      'Le unità nuove compaiono in posti liberi accanto all\'edificio invece che una dietro l\'altra (prima i contadini si nascondevano dietro il soldato)',
      'Pulsante ⛏ (tasto punto) con il numero di contadini senza lavoro: un clic seleziona il prossimo e ci porta la camera',
      'Rotazione della visuale a scatti di 90°: tasti Q/E o pulsanti ⟲ ⟳',
      'Spostamento sulla mappa col mouse: trascinando col tasto destro, oppure spazio + tasto sinistro (il clic destro semplice resta un ordine)',
      'Controllo generale: partite complete simulate con tutti i popoli, mappe e difficoltà senza errori',
    ],
  },
  {
    version: 'V.0.6.0',
    date: '2026-11-23',
    title: 'Elfi e Nani',
    changes: [
      'Due popoli nuovi, con la grafica generata con Arena AI: Elfi del Bosco d\'Oro e Nani di Khazrun',
      'Elfi: unità più resistenti ma più costose, arcieri con più gittata e danno, Arborei lenti ma devastanti contro gli edifici, +15% legno e +10% cibo',
      'Nani: tutto più robusto (unità +20% vita, edifici +30%) ma più lento, balestrieri potenti, +25% oro e pietra',
      'Uomini: cavalieri più forti. Ombra: unità più economiche e veloci da addestrare, ma più fragili',
      'Nuovi eroi: la Signora del Bosco (Luce Stellare, Pioggia di Frecce, Canto del Bosco) e il Re sotto la Montagna (Colpo di Martello, Muro di Scudi, Furia della Forgia)',
      'Menu: quattro popoli tra cui scegliere, ognuno con il suo stile, e scelta dell\'avversario (o casuale)',
      'IA più furba: prima pensa all\'economia, poi risparmia per cambiare era',
      'Raccolta un po\' più veloce, consumo invernale più leggero e Seconda Era meno costosa',
    ],
  },
  {
    version: 'V.0.5.0',
    date: '2026-11-22',
    title: 'Territori e stagioni',
    changes: [
      'Territori in stile Northgard: la mappa è divisa in circa 20 regioni con un nome, confini disegnati sul terreno e colori dei popoli',
      'Si costruisce solo nelle proprie regioni; quelle confinanti si colonizzano con un contadino (pulsante Colonizza o tasto T), pagando cibo',
      'Ogni regione dà un bonus: Foresta +20% legno, Miniere +20% oro e pietra, Pascolo +20% cibo, Pianura +3 popolazione',
      'Clic sul terreno: scheda della regione con proprietario, bonus e risorse',
      'Stagioni: Primavera, Estate (+15% cibo), Autunno, Inverno; il tempo rimasto si vede in alto',
      'D\'inverno cade la neve, il cibo si raccoglie a metà, si cammina più piano e ogni abitante consuma cibo; senza scorte il popolo ha fame',
      'Annuncio a ogni cambio di stagione e tinta dei colori che segue la stagione',
      'L\'IA colonizza regioni, fa scorte e costruisce solo nei suoi territori',
    ],
  },
  {
    version: 'V.0.4.0',
    date: '2026-11-22',
    title: 'Fazioni e mappe casuali',
    changes: [
      'Nuova partita: si sceglie la fazione, Uomini di Pietrabianca oppure Ombra della Terra Cinerea',
      'Mappe generate a caso a ogni partita: basi, boschi, miniere e bacche in posizioni sempre diverse',
      'Tre tipi di mappa: Valle di Mezzo (equilibrata), Foreste Antiche (boschi fitti), Terre Aperte (tante miniere), oppure Casuale',
      'Ogni mappa ha un seme: con lo stesso seme e lo stesso tipo si rigioca la stessa mappa (si vede nel menu di pausa)',
      'Il terreno di cenere segue la base dell\'Ombra ovunque sia, e un sentiero garantisce che le basi si possano raggiungere',
      'La minimappa mostra il terreno vero della partita',
      'Il menu ricorda l\'ultima fazione e l\'ultima mappa scelte',
    ],
  },
  {
    version: 'V.0.3.1',
    date: '2026-11-21',
    title: 'Addestramento più chiaro',
    changes: [
      'Barra di avanzamento dell\'addestramento con secondi mancanti; diventa rossa "In pausa" quando manca popolazione',
      'Coda visibile con le icone delle unità: un clic su un\'icona la annulla e restituisce le risorse',
      'Avviso chiaro quando la popolazione è al massimo: serve una Casa',
      'Pulsanti sempre cliccabili: se mancano risorse il gioco dice quali e quante, e i costi mancanti sono in rosso',
      'Messaggio di conferma quando un\'unità entra in coda',
      'Contatore della popolazione rosso quando è pieno',
      'Il pannello non si ridisegna più a ogni istante: i clic sui pulsanti non vanno persi',
      'Corretto: gli edifici erano disegnati un po\' più in alto della loro pianta',
    ],
  },
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
