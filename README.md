# Ombra & Corona · GPverse

**Versione corrente: V.0.5.0 (Territori e stagioni)** · [Storia delle versioni](CHANGELOG.md) · [Documento di design](docs/GDD.md)

RTS 3D leggero nel browser, in un mondo fantasy dal sapore tolkieniano con nomi originali.
Il motore viene da *Age of Empires*, gli eroi da *Warcraft III*, i territori e le stagioni da *Northgard*.

Parte del progetto **GPverse** (restyling 2026 dei classici) e della Sala Giochi **GPverse Arcade**.

## Giocare
- Online (GitHub Pages): `https://galimbertip.github.io/Ombra-Corona-/`
- In locale: serve un server statico, per esempio `python3 -m http.server` nella cartella del repo, poi `http://localhost:8000`

### Comandi PC
| Azione | Comando |
| --- | --- |
| Seleziona | clic sinistro, trascina per il riquadro, doppio clic = tutte le unità uguali a schermo |
| Ordine (muovi, raccogli, costruisci, attacca) | clic destro |
| Punto di raccolta di un edificio | edificio selezionato + clic destro |
| Camera | WASD / frecce, rotella zoom, minimappa (visuale isometrica fissa) |
| Costruisci | C casa, F fattoria, B caserma (con contadini selezionati) |
| Territori | T colonizza una regione confinante; clic sul terreno per le informazioni |
| Eroe | R seleziona l'eroe, 1 / 2 / 3 abilità |
| Altro | H centro città, P pausa, Esc annulla |

### Comandi touch
- Tap su un'unità per selezionarla, tap sul terreno / risorsa / nemico per darle un ordine
- Un dito trascina la mappa, due dita zoom e spostamento
- Pulsante ▢ per la selezione a riquadro, ＋ － per lo zoom, 👑 per trovare l'eroe

## Struttura
```
index.html        pagina del gioco
css/style.css     interfaccia
js/version.js     VERSIONE e STORIA (aggiornare a ogni rilascio, insieme a CHANGELOG.md)
js/config.js      dati di gioco: costi, statistiche, fazioni
js/world.js       mappa, risorse, pathfinding A*
js/entities.js    modelli 3D e classi di unità ed edifici
js/game.js        simulazione: economia, ordini, combattimento
js/ai.js          IA nemica (gioca la fazione che non hai scelto)
js/maps.js        tipi di mappa: per aggiungerne una basta una voce nuova
js/territory.js   regioni, confini, colonizzazione e bonus
js/seasons.js     ciclo delle stagioni e inverno
js/main.js        camera, input PC/touch, HUD, minimappa, schermate
js/assets.js      caricamento della grafica e creazione degli sprite
assets/raw/       immagini originali generate con Arena AI (sfondo magenta)
assets/sprites/   immagini pronte per il gioco (sfondo trasparente, WebP)
lib/              Three.js r187 (licenza MIT, vedi lib/THREE-LICENSE)
docs/GDD.md       documento di design
```

## Grafica
Le immagini sono generate da Paolo con Arena AI (prompt nel documento "Prompt grafiche per Arena").
Gli originali sono in `assets/raw/`; per rifare le versioni di gioco: `python3 tools/process.py assets/raw assets/sprites`
(lo script toglie lo sfondo magenta, ritaglia e ridimensiona).

## Versioni
Schema **V.major.minor.patch**. La versione si vede nel gioco (badge in alto, clic per la storia),
nel titolo della pagina, in `js/version.js` e in `CHANGELOG.md`.

Ombra & Corona è un progetto amatoriale: nomi, luoghi e personaggi sono originali e solo ispirati
alla grande tradizione fantasy.
