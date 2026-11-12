/**
 * npm run isms -- <befehl> [argumente]
 *
 *   neu <kuerzel> "<Name>" [--drittpartei]   Mandat anlegen; Kurzfragebogen für Third-Party Pre-Assessment (ENT-008)
 *   status <kuerzel>         Fortschritt und nächste Schritte
 *   einstufung <kuerzel>     NIS2-Vorprüfung + Prüftiefenprofil als Vorschlagstext
 *   pruefen [kuerzel]        Konsistenzprüfung (Exit-Code 1 bei Fehlern)
 *   index                    bibliothek/index.md neu erzeugen
 *   vorlage                  mandanten/_vorlage/fragebogen.md aus dem Katalog erzeugen
 *   dashboard <kuerzel>      Fortschrittsübersicht als dashboard.html im Mandatsordner
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Abbruch, einstufung, index, neu, vorlage } from './befehle.js';
import { dashboardHtml, mandatDashboard } from './dashboard.js';
import { pruefeArbeitsbereich } from './pruefen.js';
import { findeRoot, ladeArbeitsbereich } from './repo.js';
import { formatiereStatus, mandatStatus } from './status.js';

const HILFE = `Befehle: neu <kürzel> "<Name>" · status <kürzel> · einstufung <kürzel> · pruefen [kürzel] · index · vorlage · dashboard <kürzel>`;

function main(): number {
  const [befehl, ...args] = process.argv.slice(2);
  const root = findeRoot();
  const brauchtKuerzel = () => {
    if (!args[0]) throw new Abbruch('Kürzel angeben');
    return args[0];
  };
  switch (befehl) {
    case 'neu':
      console.log(neu(root, args[0], args[1], args.includes('--drittpartei') ? 'drittpartei' : 'voll'));
      return 0;
    case 'status': {
      const ws = ladeArbeitsbereich(root, brauchtKuerzel());
      console.log(formatiereStatus(mandatStatus(ws, ws.mandate[0]!)));
      return 0;
    }
    case 'einstufung':
      console.log(einstufung(root, brauchtKuerzel()));
      return 0;
    case 'pruefen': {
      const befunde = pruefeArbeitsbereich(ladeArbeitsbereich(root, args[0]));
      for (const b of befunde) console.log(`${b.schwere === 'fehler' ? '✗' : '!'} ${b.datei}${b.zeile ? `:${b.zeile}` : ''} – ${b.text}`);
      const n = befunde.filter((b) => b.schwere === 'fehler').length;
      console.log(`\n${n} Fehler, ${befunde.length - n} Warnungen`);
      return n ? 1 : 0;
    }
    case 'dashboard': {
      const ws = ladeArbeitsbereich(root, brauchtKuerzel());
      const m = ws.mandate[0]!;
      const ziel = join(m.ordner, 'dashboard.html');
      writeFileSync(ziel, dashboardHtml(mandatDashboard(ws, m)));
      console.log(`Erzeugt: ${ziel}`);
      return 0;
    }
    case 'index':
      console.log(index(root));
      return 0;
    case 'vorlage':
      console.log(vorlage(root));
      return 0;
    default:
      console.log(HILFE);
      return befehl ? 1 : 0;
  }
}

try {
  process.exitCode = main();
} catch (e) {
  if (!(e instanceof Abbruch)) throw e;
  console.error(e.message);
  process.exitCode = 1;
}
