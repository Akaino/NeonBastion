#!/usr/bin/env python3
"""Baut Neon Bastion aus src/ zu einer einzigen HTML-Datei.

  python3 build.py             -> docs/ (Website für GitHub Pages: Schrift lokal, Icons, Manifest, CNAME)
  python3 build.py --artifact  -> zusätzlich dist/neon-bastion-artifact.html (Schrift über Google Fonts)
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
web = re.sub(r'<link rel="preconnect"[^>]*>\n?', '', html)
web = re.sub(r'<link href="https://fonts.googleapis.com[^>]*>\n?', '', web)
web = web.replace('<style>', '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" type="image/png" href="icon-32.png">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<style>' + fonts, 1)

DOCS = os.path.join(ROOT, 'docs')
if os.path.isdir(DOCS):
    shutil.rmtree(DOCS)
shutil.copytree(os.path.join(ROOT, 'assets'), DOCS)
open(os.path.join(DOCS, 'index.html'), 'w', encoding='utf-8').write(web)
print(f'docs/index.html gebaut · Version {version} · {len(web)//1024} KB')

if '--artifact' in sys.argv:
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    open(os.path.join(ROOT, 'dist', 'neon-bastion-artifact.html'), 'w', encoding='utf-8').write(html)
    print('dist/neon-bastion-artifact.html gebaut')
