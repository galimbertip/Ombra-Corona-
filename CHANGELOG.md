# Storia delle versioni — Ombra & Corona (GPverse)

Schema: **V.major.minor.patch**
- **major**: cambi che stravolgono il gioco (V.1.0.0 = prima uscita completa)
- **minor**: nuove funzioni (una tappa della roadmap)
- **patch**: correzioni e ritocchi

La stessa storia si vede nel gioco (badge della versione → "Storia delle versioni") ed è definita in `js/version.js`.
A ogni rilascio aggiorna **entrambi**.

---

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
