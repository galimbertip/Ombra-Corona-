# Storia delle versioni — Ombra & Corona (GPverse)

Schema: **V.major.minor.patch**
- **major**: cambi che stravolgono il gioco (V.1.0.0 = prima uscita completa)
- **minor**: nuove funzioni (una tappa della roadmap)
- **patch**: correzioni e ritocchi

La stessa storia si vede nel gioco (badge della versione → "Storia delle versioni") ed è definita in `js/version.js`.
A ogni rilascio aggiorna **entrambi**.

---

## V.0.4.0 — Fazioni e mappe casuali · 2026-11-22
- Nuova partita: si sceglie la fazione, Uomini di Pietrabianca oppure Ombra della Terra Cinerea
- Mappe generate a caso a ogni partita: basi, boschi, miniere e bacche in posizioni sempre diverse
- Tre tipi di mappa: Valle di Mezzo (equilibrata), Foreste Antiche (boschi fitti), Terre Aperte (tante miniere), oppure Casuale
- Ogni mappa ha un seme: con lo stesso seme e lo stesso tipo si rigioca la stessa mappa (si vede nel menu di pausa)
- Il terreno di cenere segue la base dell'Ombra ovunque sia, e un sentiero garantisce che le basi si possano raggiungere
- La minimappa mostra il terreno vero della partita
- Il menu ricorda l'ultima fazione e l'ultima mappa scelte

## V.0.3.1 — Addestramento più chiaro · 2026-11-21
- Barra di avanzamento dell'addestramento con secondi mancanti; diventa rossa "In pausa" quando manca popolazione
- Coda visibile con le icone delle unità: un clic su un'icona la annulla e restituisce le risorse
- Avviso chiaro quando la popolazione è al massimo: serve una Casa
- Pulsanti sempre cliccabili: se mancano risorse il gioco dice quali e quante, e i costi mancanti sono in rosso
- Messaggio di conferma quando un'unità entra in coda
- Contatore della popolazione rosso quando è pieno
- Il pannello non si ridisegna più a ogni istante: i clic sui pulsanti non vanno persi
- Corretto: gli edifici erano disegnati un po' più in alto della loro pianta

## V.0.3.0 — Nuova grafica · 2026-11-22
- Grafica dipinta generata con Arena AI: unità, eroi, edifici, risorse, terreno, icone e abilità
- Visuale isometrica fissa come in Age of Empires: niente più rotazione, restano spostamento e zoom
- Terreno dipinto: prato, cenere verso la Terra Cinerea e terra battuta intorno alle basi
- Gli edifici in costruzione mostrano il cantiere e poi compaiono a lavori quasi finiti
- Le unità si girano verso dove camminano, saltellano in marcia e lampeggiano quando vengono colpite
- Icone dipinte per risorse, pulsanti e abilità; ritratto dell'elemento selezionato
- Schermata iniziale con paesaggio e stemma del gioco
- La Casa degli Uomini ha due varianti

## V.0.2.0 — Ere ed eroi · 2026-11-17
- Tre ere: Prima, Seconda e Terza Era, con avanzamento dal Centro Città
- Ogni era rinforza il Centro Città (più punti vita e frecce più forti)
- Nuove unità: Arciere (Seconda Era, attacca a distanza) e Cavaliere della Marca / Cavaliere di Lupi (Terza Era)
- Eroi in stile Warcraft III: il Re Ramingo (Uomini) e il Bianco Traditore (Ombra)
- Gli eroi salgono di livello con l'esperienza: livello massimo 5 nella Seconda Era, 10 nella Terza
- Tre abilità per eroe (sblocco ai livelli 1, 3 e 6), tasti 1/2/3 o pulsanti
- L'eroe caduto si rianima dal Centro Città conservando il livello
- Pulsante 👑 (tasto R) per trovare subito l'eroe
- IA dell'Ombra: avanza di era, evoca l'eroe, usa le abilità e mescola le unità
- Annuncio a tutto schermo quando si cambia era

## V.0.1.0 — Prototipo · 2026-11-15
- Prima versione giocabile: Uomini di Pietrabianca contro Ombra della Terra Cinerea
- Mappa 3D low-poly con alberi, cespugli di bacche, cave di pietra e miniere d'oro
- Risorse: cibo, legno, pietra, oro; popolazione con case
- Edifici: Centro Città (scocca frecce), Casa, Fattoria (cibo infinito), Caserma
- Unità: Contadino (raccoglie e costruisce), Lanciere / Orco Nero (combattono)
- Pathfinding A* su griglia, combattimento corpo a corpo con barre vita
- IA nemica semplice: economia, case, fattorie, caserma, ondate di attacco
- Controlli PC (mouse e tastiera) e touch (tap, trascinamento, pizzico)
- Vittoria distruggendo il Centro Città nemico
- Schermata "Storia" con le versioni dell'app
