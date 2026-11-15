import { $, UI } from '../ui/dom.js';

/* Entwicklermodus: nur in Beta und Bottest. build.py hängt diese Datei dort hinter ui.js; das echte Spiel enthält sie nicht.
   Inhalt: Bedienelemente (werden beim Laden in die Einstellungen eingesetzt), Code-Abfrage, Test-Freischaltung der Gitterfestung,
   Testhilfen (Ressourcen, Rekord, Startwelle, erzwungene Gegner), Leistungsmessung mit Ursachensuche.
   Verbindung zum Spiel: das Objekt Dev (Haken in core.js) und das Objekt Perf (in ui.js nur leer angelegt). */

/* ---------- Bedienelemente und Stilregeln einsetzen ---------- */
export const DEV_CSS = `/* Testhilfen (Entwicklermodus): Zeilen mit Wert und kleinen Knöpfen, Anzeige der Leistungsmessung unten links */
#dev{z-index:7}#dev .mbox{background:#100e30;text-align:left;max-height:calc(100dvh - 40px);overflow-y:auto;gap:10px}#dev h2{text-align:center}
#devBody h3{margin:8px 0 2px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#ff8a3d}#devBody p{margin:0;color:var(--muted);font-size:13px}
.drow{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;padding:6px 0;border-top:1px solid rgba(255,255,255,.07)}.drow>span:first-child{flex:1;min-width:96px}.drow>b{min-width:52px;text-align:right;font-variant-numeric:tabular-nums}
.dbtn{display:flex;gap:4px}.dbtn button,.dwide{font:inherit;font-size:13px;font-weight:600;color:var(--ink);background:rgba(5,5,26,.6);border:1.5px solid rgba(255,138,61,.6);border-radius:8px;padding:7px 8px;cursor:pointer}
.dwide{width:100%;padding:10px 12px;font-size:15px;margin-top:6px}.dwide.on{background:rgba(255,138,61,.25);border-color:#ff8a3d}
#devOut{width:100%;height:160px;font:12px/1.35 ui-monospace,Menlo,monospace;color:var(--ink);background:rgba(5,5,26,.8);border:1px solid var(--line);border-radius:8px;padding:8px;-webkit-user-select:text;user-select:text}
#perf{position:fixed;left:max(8px,env(safe-area-inset-left,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:5;pointer-events:none;font:11px/1.35 ui-monospace,Menlo,monospace;color:#ffe14f;background:rgba(3,3,14,.72);border-radius:6px;padding:4px 7px;white-space:pre}
html.nofont *{font-family:system-ui,sans-serif!important}html.nofx *,html.nofx *::before,html.nofx *::after{box-shadow:none!important;text-shadow:none!important;filter:none!important;backdrop-filter:none!important}
html.onlycv body *{visibility:hidden!important}html.onlycv #cv{visibility:visible!important}html.blank body{display:none!important}
html.noanim *,html.noanim *::before,html.noanim *::after{animation:none!important}
#devCode{display:flex;align-items:center;gap:8px;justify-content:center}#devCode label{color:var(--muted);font-size:14px}#devCode .btn{padding:9px 14px}
#devIn{width:110px;font:inherit;font-weight:600;text-align:center;letter-spacing:.2em;color:var(--ink);background:rgba(5,5,26,.8);border:1.5px solid #ff8a3d;border-radius:10px;padding:9px 8px;-webkit-user-select:text;user-select:text}#devIn:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}#devCode.shake{animation:shake .3s}`;

{
  const light = document.createElement('style');
  light.textContent = DEV_CSS;
  document.head.appendChild(light);
  const inner = document.createElement('style');
  inner.textContent = DEV_CSS.replace(/html\.onlycv body \*/g, ':host(.onlycv) *').replace(
    /html\.(\w+) /g,
    ':host(.$1) ',
  );
  UI.appendChild(inner);
  $('#setVer').insertAdjacentHTML(
    'afterend',
    `<div id="devCode" hidden><label for="devIn">Code</label><input id="devIn" type="text" inputmode="numeric" autocomplete="off" maxlength="8" aria-label="Code für den Entwicklermodus"><button class="btn" id="bDevOk" style="--c:#ff8a3d">Bestätigen</button></div>`,
  );
  $('#bLiveCopy').insertAdjacentHTML(
    'beforebegin',
    `<button class="btn" id="bDev" style="--c:#ff8a3d" hidden>Testhilfen</button>
    <button class="btn" id="bDevOff" style="--c:var(--muted)" hidden>Entwicklermodus beenden</button>`,
  );
  $('#toast').insertAdjacentHTML(
    'beforebegin',
    `<section id="dev" class="screen modal" hidden>
  <div class="mbox"><h2>Testhilfen</h2><div id="devBody"></div>
    <textarea id="devOut" readonly hidden aria-label="Messung als Text"></textarea>
    <button class="btn big" id="bDevClose">Fertig</button></div>
</section>
<div id="perf" hidden></div>`,
  );
}

/* ---------- Haken ins Spiel ---------- */
