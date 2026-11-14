#!/usr/bin/env python3
"""Führt alle Browser-Tests aus. Voraussetzung: python3 build.py, pip install playwright, playwright install chromium."""
import subprocess,sys,os,glob
HERE=os.path.dirname(os.path.abspath(__file__));fails=0
for t in sorted(glob.glob(os.path.join(HERE,'test_*.py'))):
    args=[[sys.executable,t,'1'],[sys.executable,t,'2']] if t.endswith('test_klicks.py') else [[sys.executable,t]]
    for a in args:
        r=subprocess.run(a,capture_output=True,text=True,timeout=600);out=(r.stdout+r.stderr).strip()
        ok=r.returncode==0 and 'PAGEERR' not in out and 'Traceback' not in out and ('Bauen: opened 0' not in out)
        fails+=not ok;print(('OK    ' if ok else 'FEHLER')+'  '+os.path.basename(t)+(' '+a[-1] if len(a)>2 else ''))
        if not ok:print('   '+out[-800:].replace('\n','\n   '))
print('\nAlle Tests bestanden.' if not fails else f'\n{fails} Test(s) fehlgeschlagen.');sys.exit(1 if fails else 0)
