const VERSION='0.29.0';
'use strict';
const PI=Math.PI,TAU=PI*2;
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const verNum=v=>{const p=String(v||'0').split('.').map(Number);return(p[0]||0)*1e6+(p[1]||0)*1e3+(p[2]||0)};
const NUM_UNITS=['','K','M','B','T','Qa','Qi'];
// Einheit für 1000^e: bis Qi die bekannten Kürzel, danach aa, ab, … zz
const numUnit=e=>e<NUM_UNITS.length?NUM_UNITS[e]:(k=>String.fromCharCode(97+Math.floor(k/26)%26)+String.fromCharCode(97+k%26))(e-NUM_UNITS.length);
function fmtN(n){n=Math.floor(n);if(!isFinite(n))return n!==n?'0':'∞';if(n<1000)return String(n);let e=Math.floor(Math.log10(n)/3),v=n/Math.pow(1000,e);if(v>=999.5){v/=1000;e++}return v.toFixed(v<10?2:v<100?1:0).replace('.',',')+numUnit(e)}
const fmtD=(v,d=1)=>v.toFixed(d).replace('.',',');

const CUR={
  s:{name:'Splitter',one:'Splitter',col:'#7fd8ff'},
  k:{name:'Kerne',one:'Kern',col:'#8cff4f'},
  p:{name:'Prismen',one:'Prisma',col:'#ff4fd8'},
  d:{name:'Sternenstaub',one:'Sternenstaub',col:'#ffe14f'}
};
const CUR_IDS=['s','k','p','d'];
const CUR_SRC={s:'Jeder besiegte Gegner',k:'Elite-Gegner und alle 5 Wellen',p:'Bosse (alle 10 Wellen, Doppelboss alle 25), Meilensteine alle 10 Wellen, selten Elite-Gegner',d:'Erster Bosssieg ab Welle 20 je Zyklus, ab Welle 30 jeder Bosssieg',q:'Supernova ab Welle 25'};
CUR.q={name:'Quanten',one:'Quant',col:'#c7b8ff'};
const PRESTIGE_DEFS=[
 ['dmg','Urkraft',100,1,1.5,l=>`×${fmtD(Math.pow(1.25,l),2)} Schaden für Helden, Drohnen, Geschütze und Impulse`],
 ['hp','Kernpanzer',100,1,1.5,l=>`×${fmtD(Math.pow(1.25,l),2)} Basisleben`],
 ['gain','Goldene Ernte',100,2,1.5,l=>`×${fmtD(1+.5*l,1)} Splitter, Kerne und Prismen`],
 ['hero','Heldenblut',50,2,1.5,l=>`×${fmtD(1+.4*l,1)} Heldenschaden und Heldenleben`],
 ['legacy','Vermächtnis',10,4,1.9,l=>l?`Alle Splitter-Knoten starten nach einer Supernova mit Stufe ${l}`:'Der Skilltree startet leer'],
 ['start','Startkapital',10,3,1.8,l=>l?`Nach einer Supernova: ${fmtN(200*Math.pow(3,l-1))} Splitter und ${l*5} Kerne`:'Kein Startkapital'],
 ['drone','Ewige Flotte',5,3,2,l=>`+${l*2} Drohnen`],
 ['qgain','Quantenresonanz',20,4,1.6,l=>`+${l*25} % Quanten pro Supernova`],
 ['warp','Zeitsprung',10,8,1.9,l=>l?`Runs starten bis zu ${l*5} Wellen später, höchstens bei der Hälfte deines Rekords`:'Kein Zeitsprung']];
const PRES={};for(const [id,name,max,base,g,fx] of PRESTIGE_DEFS)PRES[id]={id,name,max,base,g,fx};
const presCost=(p,l)=>Math.ceil(p.base*Math.pow(p.g,l));
const NOVA_MIN=25;
function quantaFor(w,save){if(w<NOVA_MIN)return 0;const qm=1+.1*((save.nodes&&save.nodes.e7b)||0);return Math.floor(2*Math.pow(1.1,w-NOVA_MIN)*(1+.25*((save.pr&&save.pr.qgain)||0))*qm)}

// ls = an welcher Grenze seines Sektors der Astname im Skilltree steht: 1 = im Uhrzeigersinn, -1 = dagegen (vom Nutzer so festgelegt)
const BR={
  b:{name:'Basis',col:'#3df5ff',a:-90,ls:1},
  u:{name:'Flotte',col:'#8cff4f',a:-18,ls:1},
  h:{name:'Helden',col:'#ff4fd8',a:54,ls:1},
  f:{name:'Impuls',col:'#ff8a3d',a:126,ls:1},
  e:{name:'Ertrag',col:'#ffe14f',a:198,ls:1}
};

// Leitern ohne Obergrenze: bis Stufe LADDER[0] normales Wachstum, darüber zusätzlich ×LADDER[1] je Stufe
const LADDER=[50,1.12],QUICK_G=1.4,PULSE_PCT=.012,BASE_GUN=8,DRONE_DMG=2.6,MEGA_MUL=2;   // BASE_GUN: % Geschütz-/Autofeuer-Schaden je Stufe Panzerung; DRONE_DMG: Grundschaden einer Drohne; MEGA_MUL: Schadensfaktor des Weltenbrechers   // PULSE_PCT: Anteil des Gegnerlebens je Stufe Schockwelle
// Impuls: löst am Zeiger automatisch aus. Start alle 2 s, „Taktgeber“ verkürzt um 8 % je Stufe bis 0,1 s.
// Schaden je Impuls = Grundschaden × IMP_MUL × √(Intervall/2): schnellere Impulse treffen schwächer, der Schaden pro Sekunde steigt trotzdem.
const IMP_BASE=2,IMP_MIN=.1,IMP_STEP=.92,IMP_LV=36,IMP_MUL=4,BEAT_N=5;
const impInterval=l=>Math.max(IMP_MIN,IMP_BASE*Math.pow(IMP_STEP,l));
// id, branch, parent, depth, lateral, name, max, currency, base cost, growth, effect text, [Knickstufe, Zusatzfaktor]
const HERO_SELF=.35;   // Kampfrausch: Exponent auf Stufe 5
const F5_MAX=5;   // Heldenimpuls: früher ein Knoten mit einer Stufe (Sprung), seit 0.27.0 fünf Stufen
const NODE_DEFS=[
 // ---- Basis ----
 ['b1','b','root',1,0,'Panzerung',999,'s',8,1.25,l=>`+${l*20} % Leben der Basis, +${l*BASE_GUN} % Schaden für Geschütze und Autofeuer`,LADDER],
 ['b2a','b','b1',2,-1,'Schildgenerator',10,'s',40,1.35,l=>l?`Schild mit ${25+(l-1)*8} % des Basislebens`:'Noch kein Schild'],
 ['b2b','b','b1',2,1,'Reparatur',10,'s',35,1.35,l=>l?`Repariert ${fmtD(l*.3)} % Leben pro Sekunde`:'Keine Reparatur'],
 ['b3a','b','b2a',3,-1.3,'Geschütze',4,'k',3,2.2,l=>l?`${l} Geschützt${l>1?'ürme':'urm'} an der Basis`:'Keine Geschütze'],
 ['b3b','b','b2b',3,1.3,'Schockwelle',10,'k',3,1.45,l=>l?`Schockwelle mit ${fmtN(15*(1+.6*(l-1)))} Schaden plus ${fmtD(l*PULSE_PCT*100,1)} % des Gegnerlebens (Bosse ein Fünftel)`:'Keine Schockwelle'],
 ['b4a','b','b3a',4,-1.6,'Kaliber',10,'p',1,1.35,l=>`+${l*40} % Schaden für Geschütze und Autofeuer`],
 ['b4c','b','b3a',4,-.3,'Feuerleitung',10,'k',4,1.4,l=>`+${l*10} % Feuerrate der Geschütze`],
 ['b4b','b','b3b',4,1.4,'Resonanz',4,'p',1,1.6,l=>`−${l*12} % Abklingzeit der Schockwelle`],
 ['b5c','b','b4c',5,0,'Feuerleitstand',F5_MAX,'d',.7,1.25,l=>l?`Stufe ${l} von ${F5_MAX}: Geschütze, Autofeuer und Schockwelle wachsen mit dem Heldenschaden-Bonus mit${l<F5_MAX?', volle Wirkung auf Stufe '+F5_MAX:''}`:'Geschütze, Autofeuer und Schockwelle wachsen noch nicht mit dem Heldenschaden-Bonus mit'],
 ['b5','b','b4a',5,-1,'Bollwerk',1,'d',3,1,l=>'Doppeltes Basisleben, +50 % Geschützreichweite'],
 ['b5b','b','b4b',5,1.2,'Nova-Ring',5,'k',8,1.6,l=>`+${l*15} % Radius der Schockwelle`],
 ['b6b','b','b5b',6,1.5,'Bunker',10,'k',12,1.4,l=>`−${l*4} % Schaden durch Geschosse von Fernkämpfern und Belagerern`],
 ['b6','b','b5',6,0,'Kernreaktor',25,'k',20,1.34,l=>`×${fmtD(Math.pow(1.06,l),2)} Basisleben`],
 ['b7a','b','b6',7,-1,'Schildmatrix',10,'p',3,1.4,l=>`+${l*25} % Schildaufladung, +${l*5} % Schildstärke`],
 ['b7b','b','b6',7,1,'Abwehrnetz',20,'p',2,1.35,l=>`×${fmtD(Math.pow(1.08,l),2)} Schaden für Geschütze und Autofeuer`],
 ['b8','b','b7a',8,0,'Festungskern',10,'d',2,1.5,l=>`×${fmtD(Math.pow(1.15,l),2)} Basisleben`],
 ['b8b','b','b7b',8,1.3,'Fernrohr',5,'p',4,1.5,l=>`+${l*10} % Reichweite der Geschütze`],
 ['b9','b','b8',9,0,'Unzerstörbar',10,'d',4,1.5,l=>`−${l*5} % erlittener Schaden`],
 // ---- Einheiten ----
 ['u1','u','root',1,0,'Drohnenbucht',10,'s',10,1.5,l=>`${2+l} Drohnen gleichzeitig`],
 ['u2a','u','u1',2,-1,'Drohnenwaffen',999,'s',25,1.25,l=>`+${l*25} % Drohnenschaden`,LADDER],
 ['u2b','u','u1',2,1,'Fertigung',10,'s',30,1.4,l=>`+${l*20} % Baugeschwindigkeit`],
 ['u3c','u','u2a',3,-1.8,'Zielcomputer',15,'s',200,1.3,l=>`+${l*8} % Feuerrate der Drohnen`],
 ['u3a','u','u2a',3,-.5,'Panzerplatten',20,'k',2,1.35,l=>`+${l*40} % Drohnenleben`],
 ['u3b','u','u2b',3,1.3,'Schwarm',4,'k',4,1.8,l=>`+${l*2} zusätzliche Drohnen`],
 ['u4','u','u3a',4,-1,'Lanzenstrahl',3,'p',1,1.8,l=>l?`Strahlwaffen, +${l*50} % Reichweite`:'Normale Bordkanonen'],
 ['u4b','u','u3b',4,1.3,'Schwarmintelligenz',10,'k',6,1.45,l=>`+${l*2} % Drohnenschaden pro aktiver Drohne`],
 ['u5c','u','u4b',5,.4,'Heldengeschwader',F5_MAX,'d',.7,1.25,l=>l?`Stufe ${l} von ${F5_MAX}: Drohnen wachsen mit dem Heldenschaden-Bonus mit${l<F5_MAX?', volle Wirkung auf Stufe '+F5_MAX:''}`:'Drohnen wachsen noch nicht mit dem Heldenschaden-Bonus mit'],
 ['u5b','u','u4b',5,1.3,'Feldreparatur',5,'k',10,1.5,l=>`Drohnen reparieren sich um ${l*2} % ihres Lebens pro Sekunde`],
 ['u5','u','u4',5,-.5,'Mutterschiff',1,'d',3,1,l=>'Schaltet in der Flotte die Klasse Kreuzer frei'],
 ['u6','u','u5',6,0,'Nanoschmiede',30,'k',15,1.33,l=>`×${fmtD(Math.pow(1.06,l),2)} Drohnenschaden und -leben`],
 ['u7a','u','u6',7,-1,'Flottenausbau',5,'p',3,1.8,l=>`+${l*2} Drohnen`],
 ['u7b','u','u6',7,1,'Plasmakern',15,'p',2,1.4,l=>`×${fmtD(Math.pow(1.08,l),2)} Drohnenschaden und -leben`],
 ['u8','u','u7b',8,0,'Admiral',5,'d',2,1.6,l=>`×${fmtD(Math.pow(1.25,l),2)} Drohnenschaden und -leben`],
 ['u8b','u','u7a',8,-1.3,'Nachbrenner',5,'p',3,1.5,l=>`+${l*10} % Tempo der Drohnen`],
 ['u9','u','u8',9,0,'Hyperflotte',3,'d',5,1.8,l=>`+${l*50} % Feuerrate der Drohnen`],
 // ---- Helden ----
 ['h1','h','root',1,0,'Ausbildung',999,'s',12,1.25,l=>`+${l*15} % Heldenschaden`,LADDER],
 ['h2a','h','h1',2,-1,'Zweiter Platz',1,'s',120,1,l=>'Zweiter Heldenplatz'],
 ['h2b','h','h1',2,1,'Vitalität',30,'s',30,1.27,l=>`+${l*25} % Heldenleben`],
 ['h3a','h','h2a',3,-1.3,'Dritter Platz',1,'k',10,1,l=>'Dritter Heldenplatz'],
 ['h3b','h','h2b',3,.4,'Erholung',4,'k',3,1.7,l=>`−${l*15} % Wiederbelebungszeit`],
 ['h3c','h','h2b',3,1.8,'Kampftempo',15,'s',150,1.3,l=>`+${l*6} % Angriffstempo der Helden`],
 ['h4','h','h3a',4,-1,'Fähigkeitsfokus',4,'p',1,1.7,l=>`−${l*10} % Abklingzeit der Fähigkeiten`],
 ['h4b','h','h3b',4,1,'Heldenkrit',10,'k',5,1.45,l=>`${l*4} % Chance auf 2,5-fachen Heldenschaden`],
 ['h5c','h','h4b',5,.35,'Kampfrausch',F5_MAX,'d',.7,1.25,l=>l?`Stufe ${l} von ${F5_MAX}: Die Treffer der Helden selbst werden mit wachsendem Heldenschaden-Bonus zusätzlich stärker`:'Kein Kampfrausch'],
 ['h5b','h','h4b',5,1.2,'Feldsanitäter',10,'k',8,1.4,l=>`Helden heilen sich um ${l} % ihres Lebens pro Sekunde`],
 ['h5','h','h4',5,-.5,'Vierter Platz',1,'d',4,1,l=>'Vierter Heldenplatz'],
 ['h6','h','h5',6,0,'Kampfgeist',30,'k',15,1.33,l=>`×${fmtD(Math.pow(1.06,l),2)} Heldenschaden`],
 ['h7a','h','h6',7,-1,'Unsterblichkeit',15,'p',2,1.4,l=>`×${fmtD(Math.pow(1.1,l),2)} Heldenleben`],
 ['h7b','h','h6',7,1,'Meisterschaft',15,'p',2,1.4,l=>`×${fmtD(Math.pow(1.08,l),2)} Heldenschaden`],
 ['h8','h','h7b',8,0,'Legende',5,'d',2,1.6,l=>`×${fmtD(Math.pow(1.25,l),2)} Heldenschaden`],
 ['h8b','h','h7a',8,-1.3,'Fünfter Platz',1,'d',8,1,l=>'Fünfter Heldenplatz'],
 ['h9','h','h8',9,0,'Avatar',5,'d',4,1.7,l=>`+${l*50} % Stärke der Fähigkeiten`],
 // ---- Fokus ----
 ['f1','f','root',1,0,'Impulsstärke',999,'s',6,1.25,l=>`+${l*40} % Impulsschaden`,LADDER],
 ['f1b','f','f1',1.5,.9,'Taktgeber',IMP_LV,'s',40,1.3,l=>`Impuls alle ${fmtD(impInterval(l),2)} s, dafür etwas weniger Schaden je Impuls`],
 ['f2a','f','f1',2,-1.5,'Präzision',9,'s',25,1.5,l=>`${5+l*5} % Chance auf kritische Impulse`],
 ['f2b','f','f1',2,0,'Druckwelle',6,'s',25,1.55,l=>`Impulsradius ${26+l*12}`],
 ['f2c','b','b1',2.5,0,'Autofeuer',10,'s',30,1.45,l=>l?`Die Basis feuert ${fmtD(l*.5)} Schüsse pro Sekunde automatisch auf Gegner`:'Kein Autofeuer'],
 ['f3a','f','f2a',3,-1.5,'Taktschlag',10,'k',2,1.4,l=>l?`Jeder ${BEAT_N}. Impuls verursacht +${l*100} % Schaden`:'Kein Taktschlag'],
 ['f3b','f','f2b',3,0,'Überladung',3,'k',4,1.8,l=>l?`Jeder 10. Impuls explodiert mit ${4+l*2}-fachem Schaden`:'Keine Überladung'],
 ['f3c','b','f2c',3.5,.5,'Zielsystem',10,'k',3,1.4,l=>l?`Autofeuer zielt auf die dichteste Gruppe, +${l*20} % Schaden`:'Autofeuer zielt auf den nächsten Gegner'],
 ['f4','f','f3a',4,-1,'Kettenblitz',3,'p',1,1.8,l=>l?`Impulse springen auf ${l} weitere Gegner`:'Kein Kettenblitz'],
 ['f4b','f','f3b',4,1,'Impulsgewitter',30,'k',10,1.33,l=>`×${fmtD(Math.pow(1.06,l),2)} Impulsschaden`],
 ['f5','f','f4',5,-.5,'Heldenimpuls',F5_MAX,'d',.7,1.25,l=>l?`Stufe ${l} von ${F5_MAX}: Dein Impuls wächst mit dem Heldenschaden-Bonus mit${l<F5_MAX?', volle Wirkung auf Stufe '+F5_MAX:''}`:'Dein Impuls wächst noch nicht mit dem Heldenschaden-Bonus mit'],
 ['f5b','f','f4b',5,1,'Brennpunkt',10,'p',2,1.4,l=>`+${l*8} % Impulsschaden gegen Elite-Gegner und Bosse`],
 ['f6','f','f5',6,0,'Fokuskristall',15,'p',2,1.4,l=>`×${fmtD(Math.pow(1.08,l),2)} Impulsschaden`],
 ['f7','b','f3c',4.5,.6,'Sturmfeuer',8,'p',3,1.5,l=>`×${fmtD(Math.pow(1.25,l),2)} Autofeuer-Rate`],
 ['f7b','f','f6',7,-1.2,'Schattenlicht',5,'k',30,1.5,l=>l<5?`Schattenwerfer verkleinern den Impuls nur noch um ${50-l*10} %`:'Schattenwerfer verkleinern den Impuls nicht mehr'],
 ['f8','f','f6',7,0,'Weltenbrecher',3,'d',4,2,l=>l?`Jeder ${60-l*10}. Impuls trifft alle Gegner mit doppeltem Schaden`:'Kein Weltenbrecher'],
 // ---- Ertrag ----
 ['e1','e','root',1,0,'Sammler',999,'s',10,1.3,l=>`+${l*12} % Splitter`,LADDER],
 ['e2a','e','e1',2,-1,'Kernextraktion',10,'s',50,1.5,l=>`+${l*20} % Kerne`],
 ['e2b','e','e1',2,1,'Schnellstart',999,'s',60,QUICK_G,l=>`Start bis Welle ${1+l*2} wählbar, Meilensteine werden gutgeschrieben`],
 ['e3c','e','e2a',3,-1.8,'Splitterflut',30,'s',400,1.32,l=>`×${fmtD(Math.pow(1.05,l),2)} Splitter`],
 ['e3a','e','e2a',3,-.5,'Prismenschliff',8,'k',5,1.45,l=>`+${l*25} % Prismen`],
 ['e3b','e','e2b',3,1.3,'Elitejäger',4,'k',4,1.7,l=>`+${l*25} % Elite-Gegner`],
 ['e4b','e','e3a',4,-1.3,'Prismenfinder',5,'k',8,1.6,l=>`${fmtD(.6+l*.6)} % Chance auf ein Prisma pro Elite-Gegner`],
 ['e4c','e','e3b',4,1.3,'Energiekern',10,'k',6,1.4,l=>`+${l*10} % Energie für Türme aus besiegten Gegnern`],
 ['e4','e','e3a',4,0,'Sternenkunde',3,'p',2,1.8,l=>`+${l} Sternenstaub beim ersten Bosssieg ab Welle 20`],
 ['e5','e','e4',5,0,'Singularität',1,'d',5,1,l=>'Alle Belohnungen verdoppelt'],
 ['e6','e','e5',6,0,'Zinseszins',20,'p',3,1.4,l=>`×${fmtD(Math.pow(1.06,l),2)} Splitter und Kerne`],
 ['e7','e','e6',7,-1,'Kernfusion',10,'p',3,1.45,l=>`×${fmtD(Math.pow(1.08,l),2)} Kerne`],
 ['e7b','e','e6',7,1,'Quantenfeld',10,'d',3,1.6,l=>`+${l*10} % Quanten pro Supernova`]
];
const NODES={root:{id:'root',br:null,parent:null,depth:0,name:'Kern',max:1,x:0,y:0}};
for(const [id,br,parent,depth,lat,name,max,cur,base,g,fx,steep] of NODE_DEFS){
  const a=BR[br].a*PI/180,R=118*depth,L=lat*68;
  NODES[id]={id,br,parent,depth,name,max,cur,base,g,fx,steep,x:Math.cos(a)*R-Math.sin(a)*L,y:Math.sin(a)*R+Math.cos(a)*L};
}
const nodeCost=(n,l)=>Math.ceil(n.base*Math.pow(n.g,l)*(n.steep&&l>n.steep[0]?Math.pow(n.steep[1],l-n.steep[0]):1));

const HEROES={
  klinge:{name:'Klinge',role:'Nahkampf',col:'#ff4fd8',hp:120,dmg:14,rate:1.3,range:22,speed:150,
    abil:'Wirbel',abilText:'Springt in die größte Gegnergruppe und trifft alles im Umkreis mit dreifachem Schaden.',cd:8,unlock:['s',25],
    text:'Stürzt sich in Gegnergruppen und steckt viel ein.'},
  schuetzin:{name:'Schützin',role:'Fernkampf',col:'#8cff4f',hp:70,dmg:9,rate:2,range:210,speed:130,
    abil:'Fächer',abilText:'Feuert zwölf durchschlagende Pfeile in einem Fächer.',cd:7,unlock:['s',150],
    text:'Hält Abstand und trifft schnell und präzise.'},
  arkanist:{name:'Arkanist',role:'Flächenschaden',col:'#b98cff',hp:80,dmg:8,rate:1,range:190,speed:120,
    abil:'Sturm',abilText:'Lässt acht Blitze mit vierfachem Schaden einschlagen.',cd:10,unlock:['k',15],
    text:'Seine Blitze springen von Gegner zu Gegner.'},
  waechterin:{name:'Wächterin',role:'Unterstützung',col:'#ffe14f',hp:100,dmg:5,rate:1.2,range:150,speed:130,
    abil:'Bastion',abilText:'Legt einen Überschild auf die Basis und heilt alle Verbündeten vollständig.',cd:15,unlock:['p',4],
    text:'Heilt Basis, Drohnen und Helden in ihrer Nähe.'},
  kopfjaeger:{name:'Kopfjäger',role:'Großwild',col:'#ff8a3d',hp:80,dmg:16,rate:.8,range:260,speed:125,
    abil:'Fangschuss',abilText:'Ein einzelner Schuss mit zwölffachem Schaden auf das zäheste Ziel in Reichweite.',cd:12,unlock:['p',8],
    text:'Sucht sich Elite-Gegner, Hünen und Bosse und trifft sie mit dreifachem Schaden.'},
  ingenieurin:{name:'Ingenieurin',role:'Türme',col:'#3dffd0',hp:90,dmg:6,rate:1.5,range:170,speed:130,
    abil:'Verstärker',abilText:'Sechs Sekunden lang nehmen Gegner im Radius eines Turms 30 % mehr Schaden.',cd:14,unlock:['k',40],
    text:'Solange sie lebt, bringen besiegte Gegner 25 % mehr Energie für Türme.'}
};
const HERO_IDS=Object.keys(HEROES);
const HERO_MAX=60,ASC_MAX=5;
const TOWERS={
  frost:{name:'Frost-Turm',col:'#5ab8ff',cost:25,unlock:null,text:'Verlangsamt alle Gegner in seinem Radius. Bosse nur halb so stark.',r:l=>98+3*l,fx:l=>({slow:Math.min(.55,.25+.012*l)})},
  weak:{name:'Zerfall-Turm',col:'#d65cff',cost:40,unlock:['k',10],text:'Gegner in seinem Radius nehmen mehr Schaden und richten weniger an.',r:l=>98+3*l,fx:l=>({vuln:1.12+.012*l,weak:.88-.008*l})},
  cryo:{name:'Kryo-Turm',col:'#bff4ff',cost:60,unlock:['p',2],text:'Friert regelmäßig alle Gegner im Radius ein. Bosse werden stattdessen verlangsamt.',r:l=>88+3*l,fx:l=>({cd:6.6-.08*l,dur:1.2+.05*l})},
  // Hilfstürme (aux): stapeln und kombinieren nicht mit den anderen. Stör-Turm nimmt Gegnern die Fähigkeiten, Markier-Turm verstärkt den Impuls.
  mute:{name:'Stör-Turm',col:'#ffb02e',cost:50,unlock:['k',25],aux:1,text:'Gegner in seinem Radius verlieren ihre Fähigkeiten: Heiler, Schwarmkönigin, Kommandant, Störsender, Hacker, Schattenwerfer und Springer. Tarner und Phasenläufer werden sichtbar. Wirkt nicht auf Bosse.',r:l=>84+3*l,fx:l=>({mute:1})},
  mark:{name:'Markier-Turm',col:'#ffe14f',cost:45,unlock:['p',4],aux:1,text:'Gegner in seinem Radius sind markiert und nehmen mehr Schaden durch den Impuls. Wirkt auch auf Bosse.',r:l=>92+3*l,fx:l=>({mark:1.5+.05*l})}};
const COMBOS=[
  {bit:1,need:['frost','frost'],name:'Sturmfront',col:'#7fd0ff',text:'Zusätzlich zur Verlangsamung werden Gegner alle paar Sekunden zurückgestoßen.'},
  {bit:2,need:['frost','weak'],name:'Vergiftung',col:'#8cff4f',text:'Gift frisst 1,5 % des Gegnerlebens pro Sekunde (Bosse 0,3 %).'},
  {bit:4,need:['weak','weak'],name:'Schwachstelle',col:'#ff4fd8',text:'Noch etwas mehr Schaden (+10 %) und 10 % Chance auf doppelten Schaden.'},
  {bit:8,need:['frost','cryo'],name:'Permafrost',col:'#bff4ff',text:'Eingefrorene Gegner bleiben 50 % länger gefroren.'},
  {bit:16,need:['weak','cryo'],name:'Zersplittern',col:'#e0b0ff',text:'Eingefrorene Gegner nehmen doppelten Schaden.'},
  {bit:32,need:['cryo','cryo'],name:'Nullpunkt',col:'#ffffff',text:'Jedes Einfrieren verursacht Kälteschaden von 4 % des Gegnerlebens (Bosse 1 %).'}];
const comboOf=(a,b)=>COMBOS.find(c=>(c.need[0]===a&&c.need[1]===b)||(c.need[0]===b&&c.need[1]===a));
const TOWER_IDS=Object.keys(TOWERS),TOWER_MAX=25,SLOT_BASE=2,SLOT_EXTRA=4;
const towerLvlCost=l=>l<8?['s',Math.ceil(150*Math.pow(1.7,l-1))]:l<16?['k',Math.ceil(10*Math.pow(1.45,l-8))]:['p',Math.ceil(2*Math.pow(1.35,l-16))];
const slotCost=n=>['p',2*(n+1)];
const heroLvlCost=l=>l<30?['s',Math.ceil(20*Math.pow(1.22,l-1))]:['k',Math.ceil(3*Math.pow(1.12,l-30))];
const heroAscCost=a=>['p',(a+1)*2];
// Flotte: Drohnenklassen. dmg/hp/rate sind Faktoren auf die Werte aus dem Skilltree. unlock: null = von Anfang an, [Währung, Kosten] oder die ID eines Skilltree-Knotens.
const DRONES={
  jaeger:{name:'Jäger',role:'Allrounder',col:'#3df5ff',unlock:null,dmg:1,hp:1,rate:1,sp:160,r:5,text:'Schnell und zuverlässig gegen einzelne Ziele.'},
  abfang:{name:'Abfänger',role:'Jagd auf schnelle Gegner',col:'#fff34f',unlock:['k',8],dmg:.8,hp:.7,rate:1.4,sp:250,r:5,text:'Sehr schnell. Greift zuerst Bomber, Sprinter und Tarner an.'},
  schwarm:{name:'Schwarm',role:'Viele kleine Treffer',col:'#8cff4f',unlock:['k',20],dmg:.4,hp:.8,rate:1,sp:150,r:6,shots:3,text:'Feuert drei kleine Geschosse pro Salve. Bricht Schilde besonders schnell.'},
  repair:{name:'Reparaturdrohne',role:'Unterstützung',col:'#6dffb0',unlock:['p',3],dmg:0,hp:1.2,rate:1,sp:130,r:6,text:'Greift nicht an. Repariert die Basis und heilt Helden und Drohnen in ihrer Nähe.'},
  kreuzer:{name:'Kreuzer',role:'Schwerer Flächenschaden',col:'#ff8a3d',unlock:'u5',dmg:4,hp:4,rate:1,sp:110,r:9,splash:34,text:'Langsam und zäh. Seine Treffer schaden allen Gegnern im Umkreis.'}};
const DRONE_IDS=Object.keys(DRONES),DRONE_MAX=60,DRONE_PRIO={bomber:1,sprinter:1,cloaker:1},REPAIR_BASE=.0015,REPAIR_ALLY=.03,REPAIR_R=120;
const droneLvlCost=l=>heroLvlCost(l);
const DRONE_LV=.08,droneLm=l=>1+DRONE_LV*(l-1);   // Stufenfaktor auf Schaden und Leben (flacher als bei Helden: mit +12 % je Stufe kam die Flotte allein auf Welle 51 statt 30)
const repairMul=l=>1+.04*(l-1);               // Stufenfaktor der Reparaturleistung
const droneUnlocked=(save,id)=>{const D=DRONES[id],st=save.fleet&&save.fleet[id];return D.unlock===null||!!(st&&st.u)||(typeof D.unlock==='string'&&((save.nodes&&save.nodes[D.unlock])||0)>0)};
// p = eingestellter Anteil an den gebauten Drohnen in Prozentpunkten (wird über die freigeschalteten Klassen normiert)
const freshFleet=()=>({jaeger:{u:1,l:1,p:100},abfang:{u:0,l:1,p:0},schwarm:{u:0,l:1,p:0},repair:{u:0,l:1,p:0},kreuzer:{u:0,l:1,p:0}});

function freshSave(){return{w2:typeof freshW2!=='undefined'?freshW2():null,v:2,cur:{s:0,k:0,p:0,d:0},nodes:{root:1},
  heroes:{klinge:{u:0,l:1,a:0},schuetzin:{u:0,l:1,a:0},arkanist:{u:0,l:1,a:0},waechterin:{u:0,l:1,a:0},kopfjaeger:{u:0,l:1,a:0},ingenieurin:{u:0,l:1,a:0}},
  team:[],best:0,runs:0,pending:null,snd:1,mus:1,volMus:70,volSfx:80,speed:1,world:1,w2test:false,dev:false,dropsUsed:0,devStart:0,devShiny:false,devDrop:false,devPerf:false,towers:{frost:{u:1,l:1},weak:{u:0,l:1},cryo:{u:0,l:1},mute:{u:0,l:1},mark:{u:0,l:1}},tslots:0,fleet:freshFleet(),kills:{},ach:null,q:0,pr:{},nova:0,cycleBest:0}}

// Vorschau-Stufen, erkannt am Pfad: /beta/ (zum Testen freigegeben) und /bottest/ (Arbeitsstand, kann unfertig sein).
// Jede Stufe hat einen eigenen Spielstand, damit Tests den echten Fortschritt nie berühren. In Node (Simulation) gibt es kein location.
const STAGE=typeof location==='undefined'?'':/\/bottest\//.test(location.pathname)?'Bottest':/\/beta\//.test(location.pathname)?'Beta':'';
const IS_BETA=!!STAGE,LIVE_KEY='neon-bastion-v1';
const Store={key:STAGE?'neon-bastion-'+STAGE.toLowerCase():LIVE_KEY,
  load(){try{const t=localStorage.getItem(this.key);return t?JSON.parse(t):null}catch(e){return null}},
  save(o){try{localStorage.setItem(this.key,JSON.stringify(o))}catch(e){}}};

function loadSave(){const f=freshSave(),s=Store.load();if(!s)return f;
  const o=Object.assign(f,s);o.cur=Object.assign(freshSave().cur,s.cur||{});o.nodes=Object.assign({root:1},s.nodes||{});if(o.nodes.f5===1&&verNum(s.ver)<verNum('0.27.0'))o.nodes.f5=F5_MAX;
  o.heroes=Object.assign(freshSave().heroes,s.heroes||{});
  if(s.volMus===undefined)o.volMus=s.mus===0?0:70;if(s.volSfx===undefined)o.volSfx=s.snd===0?0:80;
  o.towers=Object.assign(freshSave().towers,s.towers||{});o.tslots=s.tslots||0;
  o.fleet=Object.assign(freshFleet(),s.fleet||{});
  // Spielstände von vor der Flotte: wer „Mutterschiff“ hatte, bekam jede vierte Drohne als Kampfschiff – das entspricht etwa 20 % Kreuzern
  if(!s.fleet&&o.nodes.u5){o.fleet.jaeger.p=80;o.fleet.kreuzer.p=20}
  o.pr=Object.assign({},s.pr||{});
  o.w2=Object.assign(freshW2(),s.w2||{});o.w2.cur=Object.assign({c:0,m:0},(s.w2&&s.w2.cur)||{});o.w2.towers=Object.assign(freshW2().towers,(s.w2&&s.w2.towers)||{});o.w2.nodes=Object.assign({root:1},(s.w2&&s.w2.nodes)||{});if(s.cycleBest===undefined)o.cycleBest=s.best||0;
  if(!s.v||s.v<2){for(const id of['klinge','schuetzin']){const h=o.heroes[id];if(h.u&&h.l===1&&h.a===0)h.u=0}o.team=o.team.filter(id=>o.heroes[id]&&o.heroes[id].u);o.v=2}
  return o}

function stats(save){const L=id=>save.nodes[id]||0;const S={
  baseHp:200*(1+.2*L('b1'))*(L('b5')?2:1),
  shieldPct:L('b2a')?.25+.08*(L('b2a')-1):0,
  regen:.003*L('b2b'),
  turrets:L('b3a'),turretDmg:6*(1+.4*L('b4a'))*(1+BASE_GUN/100*L('b1')),turretRange:200*(L('b5')?1.5:1),
  pulse:L('b3b'),pulsePct:PULSE_PCT*L('b3b'),pulseDmg:15*(1+.6*Math.max(0,L('b3b')-1)),pulseCd:8*(1-.12*L('b4b')),
  drones:2+L('u1')+2*L('u3b'),droneDmg:DRONE_DMG*(1+.25*L('u2a')),droneHp:20*(1+.4*L('u3a')),
  droneSpawn:3/(1+.2*L('u2b')),droneRange:90*(1+.5*L('u4')),droneBeam:L('u4')>0,mother:L('u5')>0,
  heroDmg:1+.15*L('h1'),heroHp:1+.25*L('h2b'),slots:1+L('h2a')+L('h3a')+L('h5')+L('h8b'),
  revive:8*(1-.15*L('h3b')),abilityCd:1-.1*L('h4'),
  tapDmg:6*(1+.4*L('f1')),tapCrit:.05+.05*L('f2a'),tapR:26+12*L('f2b'),beat:L('f3a'),
  overload:L('f3b'),chain:L('f4'),
  gS:1+.12*L('e1'),gK:1+.2*L('e2a'),startWave:1+2*L('e2b'),gP:1+.25*L('e3a'),elite:1+.25*L('e3b'),gD:L('e4'),gAll:L('e5')?2:1};
  // neue Knoten
  S.rangedRes=1-.04*L('b6b');S.turretRange*=1+.1*L('b8b');S.droneRegen=.02*L('u5b');S.droneSp=1+.1*L('u8b');S.heroRegen=.01*L('h5b');S.impBig=.08*L('f5b');S.shadeMul=Math.min(1,.5+.1*L('f7b'));S.energyGain=1+.1*L('e4c');
  S.baseHp*=Math.pow(1.06,L('b6'))*Math.pow(1.15,L('b8'));S.turretRate=1+.1*L('b4c');S.turretDmg*=Math.pow(1.08,L('b7b'));
  S.pulseR=150*(1+.15*L('b5b'));S.shRegen=1+.25*L('b7a');S.shieldPct=S.shieldPct?S.shieldPct+.05*L('b7a'):0;S.dmgTaken=1-.05*L('b9');
  S.droneRate=(1+.08*L('u3c'))*(1+.5*L('u9'));S.swarmInt=.02*L('u4b');S.droneDmg*=Math.pow(1.06,L('u6'))*Math.pow(1.08,L('u7b'))*Math.pow(1.25,L('u8'));S.droneHp*=Math.pow(1.08,L('u7b'))*Math.pow(1.06,L('u6'))*Math.pow(1.25,L('u8'));S.drones+=2*L('u7a');
  S.heroRate=1+.06*L('h3c');S.heroCrit=.04*L('h4b');S.heroDmg*=Math.pow(1.06,L('h6'))*Math.pow(1.08,L('h7b'))*Math.pow(1.25,L('h8'));S.heroHp*=Math.pow(1.1,L('h7a'));S.abilPow=1+.5*L('h9');
  S.autoRate=.5*L('f2c')*Math.pow(1.25,L('f7'));S.autoAim=L('f3c')>0;S.autoDmg=1+.2*L('f3c');S.tapDmg*=Math.pow(1.06,L('f4b'))*Math.pow(1.08,L('f6'));S.megaTap=L('f8')?60-L('f8')*10:0;
  S.gS*=Math.pow(1.05,L('e3c'))*Math.pow(1.06,L('e6'));S.gK*=Math.pow(1.08,L('e7'))*Math.pow(1.06,L('e6'));S.prismChance=.006+.006*L('e4b');S.qMul=1+.1*L('e7b');
  const P=id=>(save.pr&&save.pr[id])||0,pd=Math.pow(1.25,P('dmg'))*(typeof w2BonusForW1!=='undefined'?w2BonusForW1(save):1),ph=1+.4*P('hero'),pg=1+.5*P('gain');
  S.baseHp*=Math.pow(1.25,P('hp'));S.turretDmg*=pd;S.pulseDmg*=pd;S.droneDmg*=pd;S.tapDmg*=pd;S.heroDmg*=pd*ph;S.heroHp*=ph;S.drones+=2*P('drone');S.gS*=pg;S.gK*=pg;S.gP*=pg;
  S.startMax=Math.max(S.startWave,1+Math.min(5*P('warp'),Math.floor((save.best||0)/2)));
  S.startWave=save.startPick?clamp(save.startPick,1,S.startMax):S.startMax;
  /*DEV{*/if(save.dev&&save.devStart){S.startMax=Math.max(S.startMax,save.devStart);S.startWave=save.devStart}/*}DEV*/   // Testhilfe: Startwelle frei wählbar
  // Verbund mit den Helden: Der Heldenschaden-Bonus wächst spät sehr stark (Knoten und Supernova). Impuls, Basis und Flotte bekommen je einen Knoten, der ihn in fünf Stufen übernimmt –
  // sonst trägt ab Welle 70 allein der Impuls (gemessen: 65–86 % des Schadens).
  // Jede Stufe ist derselbe Faktor (geometrisch), damit keine Stufe einen Sprung macht: Stufe l gibt (1+Bonus)^(l/5), Stufe 5 den vollen Bonus.
  const bond=id=>Math.pow(1+S.heroDmg,Math.min(1,L(id)/F5_MAX));
  if(L('f5'))S.tapDmg*=bond('f5');
  if(L('b5c')){const m=bond('b5c');S.turretDmg*=m;S.pulseDmg*=m}
  if(L('u5c'))S.droneDmg*=bond('u5c');
  S.heroSelf=Math.pow(1+S.heroDmg,HERO_SELF*L('h5c')/F5_MAX);   // Kampfrausch: nur die eigenen Treffer der Helden, nicht der Bonus, den die anderen übernehmen
  S.impInt=impInterval(L('f1b'));S.impMul=IMP_MUL*Math.sqrt(S.impInt/IMP_BASE);
  return S}

