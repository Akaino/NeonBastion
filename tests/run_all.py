#!/usr/bin/env python3
"""Führt alle Browser-Tests gegen die Testausgabe dist/web/ aus. Voraussetzung: python3 build.py, pip install playwright, playwright install chromium.

  python3 tests/run_all.py            -> Tests laufen gleichzeitig (Standard: 4 auf einmal)
  python3 tests/run_all.py --jobs 1   -> nacheinander, z. B. um einen Wackler einzugrenzen
"""
import subprocess,sys,os,glob,time
from concurrent.futures import ThreadPoolExecutor
HERE=os.path.dirname(os.path.abspath(__file__))
jobs=int(sys.argv[sys.argv.index('--jobs')+1]) if '--jobs' in sys.argv else min(4,os.cpu_count() or 1)
runs=[]
for t in sorted(glob.glob(os.path.join(HERE,'test_*.py'))):
    runs+=[[sys.executable,t,'1'],[sys.executable,t,'2']] if t.endswith('test_klicks.py') else [[sys.executable,t]]
def run(a):
    t0=time.time()
    try:r=subprocess.run(a,capture_output=True,text=True,timeout=600);out=(r.stdout+r.stderr).strip();rc=r.returncode
    except subprocess.TimeoutExpired:out='Traceback: Zeitüberschreitung nach 600 s';rc=1
    ok=rc==0 and 'PAGEERR' not in out and 'Traceback' not in out and ('Bauen: opened 0' not in out)
    return ok,out,time.time()-t0
t0=time.time();fails=0
with ThreadPoolExecutor(max_workers=max(1,jobs)) as ex:
    for a,(ok,out,dt) in zip(runs,ex.map(run,runs)):
        fails+=not ok;print(('OK    ' if ok else 'FEHLER')+'  '+os.path.basename(a[1])+(' '+a[-1] if len(a)>2 else '')+f'  ({dt:.0f} s)',flush=True)
        if not ok:print('   '+out[-800:].replace('\n','\n   '))
print(('\nAlle Tests bestanden.' if not fails else f'\n{fails} Test(s) fehlgeschlagen.')+f' Dauer: {time.time()-t0:.0f} s, {jobs} gleichzeitig.');sys.exit(1 if fails else 0)
