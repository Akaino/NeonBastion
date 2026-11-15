#!/usr/bin/env python3
"""Baut Neon Bastion aus src/ zu einer Website aus getrennten Dateien.

  python3 build.py             -> dist/web/        Testausgabe: komplette Website inkl. beta/ und bottest/, wird nicht veröffentlicht (Tests laufen hiergegen)
  python3 build.py --bottest   -> zusätzlich docs/bottest/  Arbeitsstand unter https://neonbastion.de/bottest/ (darf unfertig sein)
  python3 build.py --beta      -> zusätzlich docs/beta/     Vorschau unter https://neonbastion.de/beta/, das echte Spiel bleibt unverändert
  python3 build.py --release   -> zusätzlich docs/        komplette Website für GitHub Pages (Spiel, Impressum, Datenschutz, Schrift, Icons, CNAME, beta/, bottest/)

Aufbau einer Ausgabe:
  index.html             Gerüst (aus src/index.html)
  v<Version>/js/…        die Module aus src/js, unverändert kopiert
  v<Version>/css/…       die Stilregeln aus src/css, dazu fonts.css mit dem passenden Pfad zur Schrift
Der Ordner trägt die Versionsnummer, damit ein Browser nie Dateien zweier Versionen mischt.

Beta und Bottest laden zusätzlich den Entwicklermodus (js/dev-main.js und js/dev/). Das echte Spiel enthält diese Dateien nicht.
Die Stufe erkennt das Spiel zur Laufzeit am Pfad /beta/ bzw. /bottest/ (STAGE in js/core/version.js).
Für Tests und die Konsole gibt es js/expose.js: Es macht die Namen aller Module global sichtbar. Beta, Bottest und die Testausgabe laden es,
das veröffentlichte Spiel nicht.
"""
import os, re, shutil, sys
import testliste

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
JS = os.path.join(SRC, 'js')
version = re.search(r"VERSION\s*=\s*'([^']+)'", open(os.path.join(JS, 'core', 'version.js'), encoding='utf-8').read()).group(1)
V = 'v' + version
INDEX = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
FONT = "@font-face{font-family:'Chakra Petch';font-style:normal;font-weight:%d;font-display:swap;src:url(%sfonts/chakra-petch-latin-%d-normal.woff2) format('woff2')}\n"


def modules(base, dev):
    """Alle Module unter base (relativ, mit /), ohne Einstiegsdateien; Entwickler-Module nur auf Wunsch."""
    out = []
    for d, _, fs in os.walk(base):
        for f in sorted(fs):
            rel = os.path.relpath(os.path.join(d, f), base).replace(os.sep, '/')
            if not f.endswith('.js') or rel in ('main.js', 'dev-main.js', 'logic.js', 'expose.js'):
                continue
            if rel.startswith('dev/') and not dev:
                continue
            out.append(rel)
    return sorted(out)


def expose_js(mods):
    """Macht für Tests und die Konsole alle exportierten Namen global sichtbar. Veränderliche Variablen bekommen ihren Setter (setName)."""
    imp = ''.join("import * as m%d from './%s';\n" % (i, m) for i, m in enumerate(mods))
    return ("// Erzeugt von build.py. Nur für Tests und die Konsole: macht die Namen aller Module global sichtbar.\n" + imp +
            "for (const ns of [" + ', '.join('m%d' % i for i in range(len(mods))) + "])\n"
            "  for (const k of Object.keys(ns)) {\n"
            "    if (k in window) continue;\n"
            "    const set = ns['set' + k[0].toUpperCase() + k.slice(1)];\n"
            "    Object.defineProperty(window, k, { configurable: true, get: () => ns[k], set: set ? v => set(v) : undefined });\n"
            "  }\n")


def write_variant(dst, dev, up, expose):
    """Schreibt eine Fassung des Spiels nach dst. up ist der Weg von dst zur Wurzel der Website ('' oder '../')."""
    vdir = os.path.join(dst, V)
    skip = (lambda d, names: [n for n in names if n in ('package.json',) or (not dev and n in ('dev', 'dev-main.js'))])
    shutil.copytree(JS, os.path.join(vdir, 'js'), ignore=skip)
    shutil.copytree(os.path.join(SRC, 'css'), os.path.join(vdir, 'css'))
    open(os.path.join(vdir, 'css', 'fonts.css'), 'w', encoding='utf-8').write(''.join(FONT % (w, '../../' + up, w) for w in (400, 500, 600, 700)))
    scripts = ''
    if dev:
        scripts += '<script type="module" src="%s/js/dev-main.js"></script>\n' % V
    if expose:
        open(os.path.join(vdir, 'js', 'expose.js'), 'w', encoding='utf-8').write(expose_js(modules(os.path.join(vdir, 'js'), dev)))
        scripts += '<script type="module" src="%s/js/expose.js"></script>\n' % V
    head = '<meta name="robots" content="noindex,nofollow">' if dev else '<link rel="manifest" href="manifest.webmanifest">'
    html = INDEX.replace('%HEAD%', head).replace('%SCRIPTS%', scripts).replace('%V%', V).replace('%ROOT%', up)
    assert '%' + 'V%' not in html and '%ROOT%' not in html
    open(os.path.join(dst, 'index.html'), 'w', encoding='utf-8').write(html)
    if not dev:
        # Der Entwicklermodus darf im echten Spiel nicht vorkommen.
        for d, _, fs in os.walk(vdir):
            for f in fs:
                txt = open(os.path.join(d, f), encoding='utf-8').read()
                bad = [w for w in ('renderDev', 'devCode', 'Perf.scan', 'bW2Test') if w in txt]
                assert not bad, 'Entwicklermodus ist im echten Spiel gelandet: %s in %s' % (bad, f)


def write_stage(dst):
    """Beta bzw. Bottest: Spiel mit Entwicklermodus, dazu Testliste und Ruckeltest."""
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    os.makedirs(dst)
    write_variant(dst, dev=True, up='../', expose=True)
    shutil.copy(os.path.join(ROOT, 'tools', 'ruckeltest.html'), os.path.join(dst, 'ruckeltest.html'))
    liste = os.path.join(ROOT, 'TESTLISTE.md')   # Testliste zum Abhaken: nur solange TESTLISTE.md im Projektordner liegt
    if os.path.isfile(liste):
        open(os.path.join(dst, 'testliste.html'), 'w', encoding='utf-8').write(testliste.page(open(liste, encoding='utf-8').read()))


def write_site(dst, expose):
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    shutil.copytree(os.path.join(ROOT, 'assets'), dst)
    write_variant(dst, dev=False, up='', expose=expose)
    write_stage(os.path.join(dst, 'beta'))
    write_stage(os.path.join(dst, 'bottest'))


def size(d):
    return sum(os.path.getsize(os.path.join(p, f)) for p, _, fs in os.walk(d) for f in fs) // 1024


write_site(os.path.join(ROOT, 'dist', 'web'), expose=True)
n = len(modules(JS, True))
print(f'dist/web/ gebaut · Version {version} · {n} Module · Spiel {size(os.path.join(ROOT, "dist", "web", V))} KB')
if '--release' in sys.argv:
    write_site(os.path.join(ROOT, 'docs'), expose=False)
    print('docs/ gebaut (Release, inklusive beta/ und bottest/)')
else:
    if '--beta' in sys.argv:
        write_stage(os.path.join(ROOT, 'docs', 'beta'))
        print('docs/beta/ gebaut (Vorschau)')
    if '--bottest' in sys.argv:
        write_stage(os.path.join(ROOT, 'docs', 'bottest'))
        print('docs/bottest/ gebaut (Arbeitsstand)')
