#!/usr/bin/env python3
"""Baut Neon Bastion aus src/ zu einer einzigen HTML-Datei.

  python3 build.py             -> dist/web/        Testausgabe: komplette Website inkl. beta/, wird nicht veröffentlicht (Tests laufen hiergegen)
  python3 build.py --beta      -> zusätzlich docs/beta/   Vorschau unter https://neonbastion.de/beta/, das echte Spiel bleibt unverändert
  python3 build.py --release   -> zusätzlich docs/        komplette Website für GitHub Pages (Spiel, Impressum, Datenschutz, Schrift, Icons, CNAME, beta/)

Die Beta ist dieselbe Datei mit angepassten Pfaden. Dass sie eine Beta ist, erkennt das Spiel zur Laufzeit am Pfad /beta/
(IS_BETA in core.js): eigener Spielstand, Kennzeichnung „Beta“, Knopf „Live-Spielstand übernehmen“.
"""
import os, re, shutil, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
ORDER = ['core.js', 'core2.js', 'game.js', 'game2.js', 'render.js', 'audio.js', 'ui.js']

shell = open(os.path.join(SRC, 'shell.html'), encoding='utf-8').read()
js = '\n'.join(open(os.path.join(SRC, f), encoding='utf-8').read() for f in ORDER)
html = shell.replace('/*JS*/', js)
version = re.search(r"const VERSION='([^']+)'", js).group(1)

fonts = ''.join("@font-face{font-family:'Chakra Petch';font-style:normal;font-weight:%d;font-display:swap;src:url(fonts/chakra-petch-latin-%d-normal.woff2) format('woff2')}" % (w, w) for w in (400, 500, 600, 700))
web = html.replace('<style>', '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" type="image/png" href="icon-32.png">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<style>' + fonts, 1)

# Beta: liegt eine Ebene tiefer, nutzt Schrift, Icons und Rechtsseiten der Hauptseite, kein eigenes Manifest, für Suchmaschinen gesperrt
beta = web.replace('<link rel="manifest" href="manifest.webmanifest">\n', '<meta name="robots" content="noindex,nofollow">\n', 1)
for a, b in (('url(fonts/', 'url(../fonts/'), ('href="icon-32.png"', 'href="../icon-32.png"'), ('href="apple-touch-icon.png"', 'href="../apple-touch-icon.png"'),
             ('href="impressum.html"', 'href="../impressum.html"'), ('href="datenschutz.html"', 'href="../datenschutz.html"')):
    assert a in beta, a
    beta = beta.replace(a, b)

def write_site(dst):
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    shutil.copytree(os.path.join(ROOT, 'assets'), dst)
    open(os.path.join(dst, 'index.html'), 'w', encoding='utf-8').write(web)
    write_beta(os.path.join(dst, 'beta'))

def write_beta(dst):
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    os.makedirs(dst)
    open(os.path.join(dst, 'index.html'), 'w', encoding='utf-8').write(beta)

write_site(os.path.join(ROOT, 'dist', 'web'))
print(f'dist/web/ gebaut · Version {version} · {len(web)//1024} KB')
if '--release' in sys.argv:
    write_site(os.path.join(ROOT, 'docs'))
    print('docs/ gebaut (Release, inklusive beta/)')
elif '--beta' in sys.argv:
    write_beta(os.path.join(ROOT, 'docs', 'beta'))
    print('docs/beta/ gebaut (Vorschau)')
