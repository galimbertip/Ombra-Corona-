# Storia delle versioni — Ombra & Corona (GPverse)

Schema: **V.major.minor.patch**
- **major**: cambi che stravolgono il gioco (V.1.0.0 = prima uscita completa)
- **minor**: nuove funzioni (una tappa della roadmap)
- **patch**: correzioni e ritocchi

La stessa storia si vede nel gioco (badge della versione → "Storia delle versioni") ed è definita in `js/version.js`.
A ogni rilascio aggiorna **entrambi**, più `window.BUILD` in `index.html`.

---

## V.0.7.0 — Creature e Corona d'Ombra · 2026-11-24
- Creature selvagge a guardia dei luoghi della mappa: lupi, Troll delle Caverne e un Drago. Attaccano chi si avvicina e poi tornano alla tana
- Luoghi nuovi, sempre in posizioni giuste per entrambe le basi: Tana del Drago, Caverne dei Troll e Rovine con tesori da conquistare
- Nido delle Aquile: il primo eroe che ci arriva ottiene 3 Aquile dei Picchi, che volano sopra boschi e ostacoli
- Capanna di Bjarn: si ingaggia l'Uomo-Orso, un guerriero fortissimo che si rigenera (non per l'Ombra)
- Miniera Profonda: oro infinito e veloce, ma scavando troppo si risveglia il Flagello di Fiamma, che marcia sulla base di chi ha scavato di più
- La Corona d'Ombra: la prende un eroe dalla Seconda Era. Attacco +50% e rigenerazione, ma la corruzione sale; al 100% l'eroe passa contro tutti
- Nuove vittorie: portare la Corona alla Fenditura di Fuoco (chi la porta cammina più piano) e compiere un rito di 12 secondi, oppure (per l'Ombra) tenerla 90 secondi accanto alla propria base
- In alto lo stato della Corona (clic per trovarla), barra della corruzione nella scheda dell'eroe, luoghi e creature sulla minimappa
- L'IA va a prendere la Corona nella Terza Era e ingaggia Bjarn quando ha oro

## V.0.6.1 — Correzioni e camera · 2026-11-23
- Corretto: dopo un aggiornamento il browser poteva mescolare file vecchi e nuovi del gioco, causando comportamenti strani (unità bloccate, popolazione sbagliata). Ora ogni versione carica sempre i suoi file
- Le unità nuove compaiono in posti liberi accanto all'edificio invece che una dietro l'altra (prima i contadini si nascondevano dietro il soldato)
- Pulsante ⛏ (tasto punto) con il numero di contadini senza lavoro: un clic seleziona il prossimo e ci porta la camera
- Rotazione della visuale a scatti di 90°: tasti Q/E o pulsanti ⟲ ⟳
- Spostamento sulla mappa col mouse: trascinando col tasto destro, oppure spazio + tasto sinistro (il clic destro semplice resta un ordine)
- Controllo generale: partite complete simulate con tutti i popoli, mappe e difficoltà senza errori

## V.0.6.0 — Elfi e Nani · 2026-11-23
- Due popoli nuovi, con la grafica generata con Arena AI: Elfi del Bosco d'Oro e Nani di Khazrun
- Elfi: unità più resistenti ma più costose, arcieri con più gittata e danno, Arborei lenti ma devastanti contro gli edifici, +15% legno e +10% cibo
- Nani: tutto più robusto (unità +20% vita, edifici +30%) ma più lento, balestrieri potenti, +25% oro e pietra
- Uomini: cavalieri più forti. Ombra: unità più economiche e veloci da addestrare, ma più fragili
- Nuovi eroi: la Signora del Bosco (Luce Stellare, Pioggia di Frecce, Canto del Bosco) e il Re sotto la Montagna (Colpo di Martello, Muro di Scudi, Furia della Forgia)
- Menu: quattro popoli tra cui scegliere, ognuno con il suo stile, e scelta dell'avversario (o casuale)
- IA più furba: prima pensa all'economia, poi risparmia per cambiare era
- Raccolta un po' più veloce, consumo invernale più leggero e Seconda Era meno costosa

## V.0.5.0 — Territori e stagioni · 2026-11-22
- Territori in stile Northgard: la mappa è divisa in circa 20 regioni con un nome, confini disegnati sul terreno e colori dei popoli
- Si costruisce solo nelle proprie regioni; quelle confinanti si colonizzano con un contadino (pulsante Colonizza o tasto T), pagando cibo
- Ogni regione dà un bonus: Foresta +20% legno, Miniere +20% oro e pietra, Pascolo +20% cibo, Pianura +3 popolazione
- Clic sul terreno: scheda della regione con proprietario, bonus e risorse
- Stagioni: Primavera, Estate (+15% cibo), Autunno, Inverno; il tempo rimasto si vede in alto
- D'inverno cade la neve, il cibo si raccoglie a metà, si cammina più piano e ogni abitante consuma cibo; senza scorte il popolo ha fame
- Annuncio a ogni cambio di stagione e tinta dei colori che segue la stagione
- L'IA colonizza regioni, fa scorte e costruisce solo nei suoi territori

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
