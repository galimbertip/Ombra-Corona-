# Ombra & Corona — Game Design Document

GPverse · copia del documento di design (originale nei Docs di Claude) · aggiornato alla V.0.1.0

## Visione
Ombra & Corona è un RTS 3D leggero ambientato in un mondo fantasy dal sapore tolkieniano, con nomi originali.
Il motore di gioco viene da Age of Empires, gli eroi da Warcraft III, i territori e le stagioni da Northgard.

**Pilastri**
- **Economia e ere (AoE):** si raccolgono risorse, si costruisce, si avanza di era
- **Eroi che guidano (Warcraft III):** pochi personaggi forti che salgono di livello
- **Terra e stagioni (Northgard):** la mappa è divisa in territori e l'inverno cambia le regole
- **La tentazione dell'artefatto:** potere enorme che però corrompe chi lo porta

**Marchio:** GPverse, versioni nello schema V.major.minor.patch, giocabile nella Sala Giochi Arcade su PC, smartphone e tablet.

## Dizionario dei nomi
Regola alla Football Manager: ogni nome deve far pensare all'originale, ma senza esserlo.
Le razze generiche (elfi, nani, orchi, troll, draghi) restano tali.

| Originale | Nome GPverse | Tipo |
| --- | --- | --- |
| Terra di Mezzo | Mondo di Mezzo / Ardhal | Mondo |
| Gondor | Regno di Pietrabianca | Regno degli Uomini |
| Rohan | Marca dei Cavalli | Regno degli Uomini |
| Mordor | Terra Cinerea | Regno dell'Ombra |
| Gran Burrone | Valle del Rifugio | Rifugio elfico |
| Lothlórien | Bosco d'Oro | Regno elfico |
| Moria | Abisso di Khazrun | Città dei Nani |
| Fangorn | Selva Antica | Foresta |
| Sauron | l'Oscuro Signore | Antagonista |
| Nazgûl | i Nove Senzavolto | Servitori dell'Ombra |
| Ent | Arborei | Creature |
| Balrog | Flagello di Fiamma | Creatura |
| Beorn | Bjarn l'Uomo-Orso | Eroe neutrale |
| Uruk-hai | Orchi Neri | Unità |
| Mithril | Argentolume | Risorsa rara |
| Unico Anello | la Corona d'Ombra | Artefatto |

## Fazioni, eroi e creature
| Fazione | Stile | Eroi (proposta) | Unità speciali |
| --- | --- | --- | --- |
| Uomini di Pietrabianca e della Marca | Equilibrati, cavalleria forte | il Re Ramingo, la Dama della Marca | Cavalieri della Marca, catapulte |
| Elfi del Bosco d'Oro | Pochi ma letali, arcieri, magia | la Signora del Bosco, l'Arciere Biondo | Arborei (assedio), guardiani alati |
| Nani di Khazrun | Miniere, difesa, armi d'assedio | il Re sotto la Montagna, l'Ascia Rossa | Guerrieri di Argentolume, balestre |
| Ombra della Terra Cinerea | Orde economiche, paura | il Bianco Traditore, il Re dei Senzavolto | Orchi Neri, troll, Nove Senzavolto |

**Creature neutrali**
- **Bjarn l'Uomo-Orso:** eroe mercenario ingaggiabile dagli Uomini o dagli Elfi
- **Aquile dei Picchi:** alleato raro, si sblocca con una missione
- **Draghi:** boss della mappa che custodiscono un tesoro
- **Flagello di Fiamma:** si risveglia se una fazione scava troppo in profondità, e attacca chiunque

## Meccaniche core
- **Risorse:** cibo, legno, pietra, oro e Argentolume (risorsa rara). Il cibo viene da bacche e, finite quelle, dalle fattorie (cibo infinito).
- **Ere:** Prima Era (villaggio, milizia) → Seconda Era (castello, cavalleria, primo eroe forte) → Terza Era (unità leggendarie, creature, Corona d'Ombra).
- **Territori (Northgard):** regioni da colonizzare spendendo cibo, ognuna con un bonus; si costruisce solo nei propri territori.
- **Stagioni (Northgard):** d'inverno il cibo cala, le marce rallentano e i passi di montagna si chiudono.
- **Eroi (Warcraft III):** da 1 a 3 per fazione, livello massimo 10, 3 abilità più una suprema, 4 oggetti; risorgono alla capitale pagando oro.
- **La Corona d'Ombra:** un solo esemplare per mappa; l'eroe che la porta accumula corruzione e al 100% passa all'Ombra. Distruggerla è una condizione di vittoria.

## Modalità di gioco
- **Campagna:** una mini-campagna per fazione (5-6 missioni), poi una campagna finale intrecciata; gli eroi conservano livello e oggetti.
- **Open world:** mappa generata dal seed, 2-4 fazioni IA, creature neutrali, eventi casuali, vittoria per conquista, territori chiave o Corona d'Ombra.

## Tecnica
| Area | Scelta |
| --- | --- |
| Rendering | Three.js, low-poly, camera isometrica rotabile |
| Mappa | Griglia a celle + regioni dei territori |
| Movimento | A* su griglia (+ flow field per i gruppi in futuro) |
| Nebbia di guerra | Texture di visibilità (dalla V.0.2.0 in poi) |
| IA | Macchina a stati: economia, espansione, attacco, difesa |
| Controlli | PC stile AoE; touch con tap, trascinamento, pizzico, pulsante riquadro |
| Salvataggi | localStorage, integrazione con GPverse Arcade |
| Repo | galimbertip/Ombra-Corona- su GitHub Pages |

## Roadmap
1. **V.0.1.0 — Prototipo:** una mappa, Uomini contro Ombra, raccolta, costruzione, combattimento base, IA semplice ✅
2. **V.0.2.0 — Ere ed eroi:** le tre ere, un eroe per fazione con livelli e abilità
3. **V.0.3.0 — Territori e stagioni**
4. **V.0.4.0 — Quattro fazioni:** arrivano Elfi e Nani
5. **V.0.5.0 — Creature e Corona**
6. **V.0.6.0 — Open world**
7. **V.0.7.0 — Prima campagna** (Uomini)
8. **V.0.8.0 — Campagne complete**
9. **V.0.9.0 — Rifinitura**
10. **V.1.0.0 — Uscita** su GitHub Pages e nella Sala Giochi Arcade
