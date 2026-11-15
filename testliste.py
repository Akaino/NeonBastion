"""Macht aus TESTLISTE.md eine Seite zum Abhaken (docs/beta/testliste.html). Wird von build.py aufgerufen.

Verstanden wird, was die Testliste nutzt: Überschriften (#, ##), Absätze, Tabellen, Aufzählungen und Prüfpunkte „- [ ] …“,
dazu **fett**, `Code` und Adressen. Haken und Notizen speichert die Seite im Browser (localStorage, je Gerät).
"""
import html, json, re, zlib

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'`(.+?)`', r'<code>\1</code>', t)
    return re.sub(r'(https?://[^\s<]+[^\s<.,;:!?)])', r'<a href="\1">\1</a>', t)

def plain(t):
    return re.sub(r'\*\*|`', '', t)

def render(md):
    """Liefert (Titel, HTML des Inhalts, Liste der Prüfpunkte für die Zusammenfassung)."""
    out, items, title, sec, mode = [], [], 'Testliste', '', None
    def close():
        nonlocal mode
        if mode: out.append({'ul': '</ul>', 'checks': '</ul>', 'table': '</tbody></table></div>'}[mode])
        mode = None
    def open_(m, tag):
        nonlocal mode
        if mode != m:
            close(); out.append(tag); mode = m
    lines = md.split('\n')
    for i, ln in enumerate(lines):
        ln = ln.rstrip()
        if not ln:
            close(); continue
        if ln.startswith('# '):
            close(); title = plain(ln[2:]); out.append('<h1>%s</h1>' % inline(ln[2:])); continue
        if ln.startswith('## '):
            close()
            if sec: out.append('</section>')
            sec = plain(ln[3:])
            out.append('<section><h2><span>%s</span><em class="cnt"></em></h2>' % inline(ln[3:])); continue
        m = re.match(r'- \[[ xX]\] (.*)', ln)
        if m:
            open_('checks', '<ul class="checks">')
            txt = m.group(1)
            key = '%08x' % zlib.crc32(plain(txt).encode('utf-8'))
            items.append({'k': key, 's': sec, 't': plain(txt)})
            out.append('<li data-k="%s"><label><input type="checkbox"><span class="box"></span><span class="txt">%s</span></label>'
                       '<button type="button" class="nb" aria-label="Notiz">Notiz</button>'
                       '<textarea rows="2" placeholder="Notiz für Claude …" hidden></textarea></li>' % (key, inline(txt)))
            continue
        if ln.startswith('- '):
            open_('ul', '<ul class="plain">'); out.append('<li>%s</li>' % inline(ln[2:])); continue
        if ln.startswith('|'):
            cells = [c.strip() for c in ln.strip('|').split('|')]
            if all(re.fullmatch(r':?-+:?', c) for c in cells): continue
            if mode != 'table':
                close(); mode = 'table'
                out.append('<div class="scroll"><table><thead><tr>%s</tr></thead><tbody>' % ''.join('<th>%s</th>' % inline(c) for c in cells))
            else:
                out.append('<tr>%s</tr>' % ''.join('<td>%s</td>' % inline(c) for c in cells))
            continue
        close(); out.append('<p>%s</p>' % inline(ln))
    close()
    if sec: out.append('</section>')
    return title, '\n'.join(out), items

PAGE = r'''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#05051a">
<title>Neon Bastion Testliste</title>
<link rel="icon" type="image/png" href="../icon-32.png">
<style>
/* Layout: schmale Spalte, oben klebende Leiste mit Fortschritt, darunter Abschnitte mit Prüfpunkten */
:root{--bg:#05051a;--panel:#0d0b2c;--ink:#eaf0ff;--muted:#a9a6d4;--cyan:#3df5ff;--mag:#ff4fd8;--ok:#5dffb0;--line:rgba(61,245,255,.22);
  --font:"Chakra Petch",system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:dark;box-sizing:border-box;
  padding-bottom:env(safe-area-inset-bottom,0px);background:var(--bg)}
@font-face{font-family:'Chakra Petch';font-style:normal;font-weight:400;font-display:swap;src:url(../fonts/chakra-petch-latin-400-normal.woff2) format('woff2')}
@font-face{font-family:'Chakra Petch';font-style:normal;font-weight:600;font-display:swap;src:url(../fonts/chakra-petch-latin-600-normal.woff2) format('woff2')}
@font-face{font-family:'Chakra Petch';font-style:normal;font-weight:700;font-display:swap;src:url(../fonts/chakra-petch-latin-700-normal.woff2) format('woff2')}
*,*::before,*::after{box-sizing:inherit}
[hidden]{display:none!important}
body{margin:0;background:var(--bg);color:var(--ink);font:400 16px/1.5 var(--font)}
.wrap{max-width:720px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
header{position:sticky;top:0;z-index:5;background:rgba(5,5,26,.94);border-bottom:1px solid var(--line);padding-top:env(safe-area-inset-top,0px)}
header .wrap{display:flex;align-items:center;gap:12px;padding-block:10px}
header a{color:var(--cyan);text-decoration:none;font-weight:600;white-space:nowrap}
.prog{flex:1;min-width:0}
.prog b{display:block;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}
.bar{height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:4px}
.bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--cyan),var(--ok));transition:width .2s}
main{padding-block:20px 48px}
h1{font-size:26px;line-height:1.2;margin:0 0 12px;text-wrap:balance}
h2{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:19px;line-height:1.25;margin:0 0 10px;color:var(--cyan)}
h2 .cnt{font-style:normal;font-size:13px;font-weight:600;color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}
h2 .cnt.done{color:var(--ok)}
p{margin:0 0 12px;color:var(--muted)}
a{color:var(--cyan);overflow-wrap:anywhere}
section{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;margin-top:16px}
ul{list-style:none;margin:0;padding:0}
.plain li{position:relative;padding:6px 0 6px 18px;color:var(--muted)}
.plain li::before{content:"";position:absolute;left:2px;top:15px;width:6px;height:6px;border-radius:50%;background:var(--mag)}
.plain b{color:var(--ink)}
.checks li{display:grid;grid-template-columns:1fr auto;column-gap:8px;align-items:start;border-top:1px solid rgba(255,255,255,.07)}
.checks li:first-child{border-top:0}
.checks label{display:flex;gap:12px;padding:11px 0;cursor:pointer;min-width:0;-webkit-tap-highlight-color:transparent}
.checks input{position:absolute;opacity:0;pointer-events:none}
.box{flex:none;width:24px;height:24px;border:2px solid var(--cyan);border-radius:6px;margin-top:0;position:relative}
.checks input:focus-visible+.box{outline:2px solid var(--mag);outline-offset:2px}
.checks input:checked+.box{background:var(--ok);border-color:var(--ok)}
.checks input:checked+.box::after{content:"";position:absolute;left:7px;top:2px;width:6px;height:12px;border:solid var(--bg);border-width:0 3px 3px 0;transform:rotate(45deg)}
.checks input:checked~.txt{color:var(--muted);text-decoration:line-through;text-decoration-color:rgba(169,166,212,.5)}
.nb{margin-top:9px;font:600 12px var(--font);color:var(--muted);background:none;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:5px 10px;cursor:pointer}
.nb.on{color:var(--bg);background:var(--mag);border-color:var(--mag)}
textarea{grid-column:1/-1;width:100%;margin:0 0 12px;padding:8px 10px;font:400 16px/1.4 var(--font);color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:8px;resize:vertical}
.scroll{overflow-x:auto;margin:0 0 12px}
table{border-collapse:collapse;font-size:14px;min-width:100%}
th,td{text-align:left;padding:7px 10px 7px 0;border-bottom:1px solid rgba(255,255,255,.08);vertical-align:top}
th{color:var(--muted);font-weight:600;white-space:nowrap}
td:first-child{font-weight:600;white-space:nowrap}
.acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.acts button{font:600 15px var(--font);border-radius:10px;padding:12px 16px;cursor:pointer;border:1px solid var(--cyan);background:var(--cyan);color:var(--bg)}
.acts button.sec{background:none;color:var(--muted);border-color:rgba(255,255,255,.2)}
#msg{margin:12px 0 0;min-height:1.5em;color:var(--ok)}
#out{grid-column:auto;margin-top:8px;height:220px;font-size:13px}
</style>
</head>
<body>
<header><div class="wrap"><a href="./">‹ Zur Beta</a><div class="prog"><b id="total"></b><div class="bar"><i id="fill"></i></div></div></div></header>
<main class="wrap">
/*BODY*/
<div class="acts"><button type="button" id="copy">Ergebnis kopieren</button><button type="button" id="reset" class="sec">Alles zurücksetzen</button></div>
<p id="msg" role="status"></p>
<textarea id="out" readonly hidden></textarea>
</main>
<script>
const ITEMS=/*ITEMS*/,TITLE=/*TITLE*/,KEY='neon-bastion-testliste';
let st={};try{st=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}};
const get=k=>st[k]||(st[k]={c:false,n:''});
const $=s=>document.querySelector(s),lis=[...document.querySelectorAll('.checks li')];
function count(){
  let all=0,done=0;
  document.querySelectorAll('section').forEach(sec=>{
    const cb=[...sec.querySelectorAll('.checks input')],c=sec.querySelector('.cnt');if(!cb.length)return;
    const d=cb.filter(x=>x.checked).length;all+=cb.length;done+=d;
    c.textContent=d+' / '+cb.length;c.classList.toggle('done',d===cb.length);
  });
  $('#total').textContent=done+' von '+all+' geprüft';$('#fill').style.width=(all?100*done/all:0)+'%';
}
lis.forEach(li=>{
  const k=li.dataset.k,cb=li.querySelector('input'),nb=li.querySelector('.nb'),ta=li.querySelector('textarea'),s=st[k]||{};
  cb.checked=!!s.c;ta.value=s.n||'';ta.hidden=!ta.value;nb.classList.toggle('on',!!ta.value);
  cb.addEventListener('change',()=>{get(k).c=cb.checked;save();count()});
  nb.addEventListener('click',()=>{ta.hidden=!ta.hidden&&!ta.value?true:false;if(!ta.hidden)ta.focus()});
  ta.addEventListener('input',()=>{get(k).n=ta.value;nb.classList.toggle('on',!!ta.value.trim());save()});
});
function report(){
  let out=TITLE+'\n',sec=null;
  for(const it of ITEMS){
    const s=st[it.k]||{};
    if(it.s!==sec){sec=it.s;out+='\n'+sec+'\n'}
    out+=(s.c?'[x] ':'[ ] ')+it.t+'\n';
    if(s.n&&s.n.trim())out+='    Notiz: '+s.n.trim().replace(/\n/g,'\n    ')+'\n';
  }
  return out;
}
$('#copy').addEventListener('click',()=>{
  const t=report(),o=$('#out'),fail=()=>{o.hidden=false;o.value=t;o.focus();o.select();$('#msg').textContent='Kopieren ging nicht automatisch. Der Text steht unten, bitte markieren und kopieren.'};
  try{navigator.clipboard.writeText(t).then(()=>{$('#msg').textContent='Kopiert. Füg es einfach in den Chat ein.'},fail)}catch(e){fail()}
});
let armed=0;
$('#reset').addEventListener('click',e=>{
  if(Date.now()-armed>4000){armed=Date.now();e.target.textContent='Wirklich? Nochmal tippen';setTimeout(()=>{e.target.textContent='Alles zurücksetzen'},4000);return}
  st={};save();location.reload();
});
count();
</script>
</body>
</html>
'''

def page(md):
    title, body, items = render(md)
    js = lambda v: json.dumps(v, ensure_ascii=False).replace('</', '<\\/')
    return PAGE.replace('/*BODY*/', body).replace('/*ITEMS*/', js(items)).replace('/*TITLE*/', js(title))
