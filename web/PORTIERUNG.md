# Matrix Engine Web

Das Studio erzeugt ein vollständiges SVG im Browser. Die Vorschau lädt es als Bild über eine Blob-URL. Der Download verwendet dieselbe URL. Text, lokale Schriften und Einstellungen verbleiben im Browser. Die Anwendung speichert die Einstellungen für die Dauer der geöffneten Sitzung.

## Start und Prüfung

Node.js 24 LTS oder neuer verwenden. Alle Befehle laufen unter Windows im Verzeichnis `web/`.

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run check:browser -- --production
```

Vite druckt die lokale URL mit dem Pfad `/matrix-engine/`. Der Production-Test startet einen temporären lokalen Server und beendet ihn anschließend. Ein laufender Entwicklungsserver lässt sich mit `npm.cmd run check:browser -- http://127.0.0.1:5173/matrix-engine/` prüfen. Gegebenenfalls den Port anpassen. Auf Windows nutzt der Test den installierten Edge. Unter Linux installiert der Workflow den zu Playwright Core passenden Chromium-Headless-Browser. Lokal genügt dafür `npx --no-install playwright-core install --with-deps --only-shell chromium`.

## Vom Python-Generator zum SVG

| Baustein | Implementierung |
| --- | --- |
| Konfiguration | `src/config.ts` übernimmt die sechs Fünf-Farben-Paletten und die CLI-Standardwerte. Die eigene HEX-Farbe liefert eine zusätzliche abgeleitete Palette. `validation.ts` prüft Unicode-Codepoints, XML-Zeichen, Zahlenbereiche und Farben auch unmittelbar vor dem Export. |
| Schriftmaske | `generator/mask.ts` startet bei der kleineren Größe aus Schriftvorgabe und 80 % der Bannerhöhe. Die Größe sinkt je Durchlauf um mindestens einen Pixel, sonst um den ganzzahligen Quotienten aus Größe und 15. Die Textbox muss in 82 % der Breite und 55 % der Höhe passen. Canvas zeichnet zentriert in logischen Bannerpixeln. |
| Abtastung | Die Rasterweite entspricht der ganzzahligen Schriftgröße geteilt durch 14, begrenzt auf 3–10. Der y-Abstand ist zwei Pixel größer. Alphawerte über 150 liefern die Positionen der Schriftziffern. Der Renderer verschiebt deren Grundlinie um die halbe, abgerundete Rasterweite. |
| Zufallsfolge | `generator/random.ts` implementiert MT19937, das Integer-Seeding mit 32-Bit-Wörtern, die 53-Bit-Float-Erzeugung und Pythons ganzzahlige Ziehung mit Zurückweisung. Negative Seeds verwenden den Absolutwert. Die Zufallsaufrufe für Länge, Position, Deckkraft, Farbe, Ziffern und Animationszeiten folgen der Reihenfolge aus `build_mrmvc.py`. |
| SVG | `generator/svg.ts` erzeugt die Verläufe, den abgerundeten Ausschnitt, die Regenspalten ab x=12 im Abstand von 25 Pixeln und die Linie auf 79 % Höhe. Jede Spalte erhält bei aktiver Animation ein `animateTransform`, jede Schriftziffer ein eigenes `animate`. Beide Zeitparameter skalieren mit der Geschwindigkeit. Eine statische Datei enthält ausschließlich unbewegte Elemente. |
| Export | `exports.ts` und `components/ExportMenu.tsx` liefern SVG, Markdown-Datei und Zwischenablage. Freitext wird als XML-Attribut maskiert. Pfade und Elementnamen sind fest vorgegeben. Satzzeichen im Markdown-Alternativtext werden als Zeichenreferenzen kodiert. Ohne Zwischenablagezugriff kann der markierte Code manuell kopiert werden. |

### Reproduzierbarkeit und Unterschiede

Bei identischen Einstellungen, identischen Schriftbytes und gleicher Rasterumgebung ist das SVG bytegleich. Python akzeptiert beliebig große Integer-Seeds. Das Studio verarbeitet alle exakten JavaScript-Ganzzahlen von −9.007.199.254.740.991 bis +9.007.199.254.740.991.

Der Browser verwendet die bereits mitgelieferte DM Sans als Standardschrift. Unter **Schriftoptionen** kann dieselbe lokale Schrift wie beim CLI gewählt werden. Canvas und Pillow unterscheiden sich je nach Font, Shaping, Rasterizer und Hinting an Glyphenrändern. Fehlende Zeichen können im Browser über Systemschriften ergänzt werden. Geänderte Maskenpunkte beeinflussen die späteren Zufallsziehungen für die Schriftziffern. Die Regenspalten bleiben vom Font unabhängig. Die Ziffern verwenden im fertigen SVG die generische Monospace-Schrift des Betrachters. Das SVG benötigt beim Öffnen weder die Maskenschrift noch JavaScript oder externe Dateien.

Wie in Python unterscheiden sich die Zufallsfolgen statischer und animierter Szenen durch die zusätzlichen Ziehungen für Animationszeiten. Wenn das Betriebssystem reduzierte Bewegung verlangt, zeigt das Studio die statische Variante. Der Export folgt weiterhin dem sichtbaren Animationsschalter.

### Ressourcen und Tests

`generator/useBanner.ts` bündelt schnelle Eingaben für 45 ms. Änderungen an Farbe, Seed oder Tempo verwenden die bereits abgetastete Maske erneut. Nur der Textausschnitt wird als RGBA-Puffer gelesen. Die Canvas-Fläche wird danach freigegeben. Vorschau und Vergrößerung teilen die Bildquelle. Abgelöste Blob-URLs und lokale FontFace-Registrierungen werden aufgeräumt.

Die Node-Tests vergleichen drei vollständige Regenspaltenfolgen sowie einzelne Schriftziffern mit Referenzen aus dem ursprünglichen Python-Generator. Sie prüfen zusätzlich MT19937, Eingabegrenzen, XML-Kodierung, Markdown und die Geschwindigkeitsfaktoren.

Der Browsertest prüft sechs Breiten zwischen 320 und 1440 Pixeln, die abgetastete Maske gegen ein vollständiges Referenz-Canvas, lokale Schriften, Exportdateien, Zwischenablage und reduzierte Bewegung. Er vergleicht Vorschau und Download byteweise und prüft Bewegung als eingebettetes Bild sowie Transformation und Deckkraft im separat geladenen SVG. Konsolenfehler und externe Ressourcenabrufe lassen den Test fehlschlagen. Die Abschlussausgabe nennt SVG-Größe, Zeit bis zur dekodierten Vorschau und den JavaScript-Heap nach Garbage Collection. Diese Heap-Stichproben erfassen weder den gesamten Browserprozess noch den Grafikspeicher. Die Screenshots liegen in `screenshots/`.

## GitHub und Pages

Die Markdown-Ausgabe verweist auf `./matrix-banner.svg`. Die heruntergeladene Datei neben der jeweiligen README im selben Branch ablegen. GitHub unterstützt relative Bildpfade. Für die Repository-Dateivorschau dokumentiert GitHub Einschränkungen bei SVG-Animationen. Die Browserprüfung deckt die eigenständige Datei und den Bildmodus ab. Ein Live-Upload des Exports war nicht Teil der Prüfung. Für eine feste Darstellung die Animation ausschalten. [GitHub-Bildsyntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#images) · [Einschränkungen der Dateivorschau](https://docs.github.com/en/repositories/working-with-files/using-files/working-with-non-code-files#viewing-images)

Der neue Workflow `.github/workflows/web-pages.yml` verwendet Node 24, das npm-Lockfile und den lokalen Production-Browsertest. Pull Requests und Pushes auf den Feature-Branch erhalten ausschließlich den Prüfjob. Nur ein erfolgreicher Lauf auf `main` kann den Inhalt von `web/dist/` bereitstellen. Vites Asset-Basis ist `/matrix-engine/`. Die Repository-Einstellungen und das Deployment-Environment sind in der [README](../README.md#github-pages) beschrieben.
