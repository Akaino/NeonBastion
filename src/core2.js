/* ================= WELT 2: GITTERFESTUNG ================= */
CUR.c={name:'Schaltkreise',one:'Schaltkreis',col:'#ffb03d'};
CUR.m={name:'Matrixchips',one:'Matrixchip',col:'#ff6b84'};
const CUR_IDS2=['c','m'];
CUR_SRC.c='Jeder besiegte Gegner in der Gitterfestung';
CUR_SRC.m='Bosse und Meilensteine alle 10 Wellen in der Gitterfestung';

// Schadenstürme (nur Welt 2). Unterstützungstürme aus Welt 1 bekommen hier größere Radien.
Object.assign(TOWERS,{
  laser:{name:'Laser-Turm',col:'#ff4f6d',cost:40,dmgTower:true,text:'Dauerstrahl mit hohem Einzelschaden auf den Gegner, der dem Kern am nächsten ist.',
    r:l=>150+3*l,fx:l=>({dps:22*Math.pow(1.15,l-1)})},
  rocket:{name:'Raketen-Turm',col:'#ff8a3d',cost:60,dmgTower:true,text:'Feuert Raketen in die dichteste Gegnergruppe. Flächenschaden.',
    r:l=>175+3*l,fx:l=>({dmg:40*Math.pow(1.15,l-1),cd:1.6,splash:48})},
  tesla:{name:'Tesla-Turm',col:'#ffe14f',cost:50,dmgTower:true,text:'Kettenblitze, die von Gegner zu Gegner springen.',
    r:l=>135+3*l,fx:l=>({dmg:16*Math.pow(1.15,l-1),cd:.9,chain:3})}});
const TOWER_IDS2=['laser','rocket','tesla','frost','weak','cryo'];
const W2_SUPPORT_R=1.35;
const T2_UNLOCK={laser:null,frost:null,rocket:['c',120],tesla:['c',300],weak:['m',3],cryo:['m',6]};
const towerLvlCost2=l=>l<10?['c',Math.ceil(150*Math.pow(1.7,l-1))]:['m',Math.ceil(3*Math.pow(1.35,l-10))];
const slotCost2=n=>['m',3*(n+1)];

// Kombinationen aus Schadens- und Unterstützungsturm
COMBOS.push(
  {bit:0,need:['laser','frost'],name:'Kältelaser',col:'#9fd8ff',text:'Laser verursacht +60 % Schaden an Gegnern in der Überschneidung.'},
  {bit:0,need:['laser','weak'],name:'Brennpunkt',col:'#ff7ad9',text:'Laser verursacht +40 % Schaden, Treffer zählen als kritisch.'},
  {bit:0,need:['laser','cryo'],name:'Thermoschock',col:'#ffffff',text:'Laser verursacht dreifachen Schaden an eingefrorenen Gegnern.'},
  {bit:0,need:['rocket','frost'],name:'Frostgranate',col:'#9fd8ff',text:'Raketen frieren getroffene Gegner kurz ein.'},
  {bit:0,need:['rocket','weak'],name:'Säurebombe',col:'#8cff4f',text:'Raketen hinterlassen Säure: 2 % des Gegnerlebens pro Sekunde für 3 Sekunden.'},
  {bit:0,need:['rocket','cryo'],name:'Eissplitter',col:'#e0f6ff',text:'Raketen haben +50 % Explosionsradius.'},
  {bit:0,need:['tesla','frost'],name:'Supraleiter',col:'#bfefff',text:'Blitze springen auf zwei zusätzliche Gegner.'},
  {bit:0,need:['tesla','weak'],name:'Überladung',col:'#ff9fe8',text:'Tesla verursacht +60 % Schaden.'},
  {bit:0,need:['tesla','cryo'],name:'Kryoblitz',col:'#e8fbff',text:'Blitze betäuben Gegner für 0,4 Sekunden.'});

const BR2={
  k:{name:'Kern',col:'#3df5ff',a:-90},
  w:{name:'Waffen',col:'#ff4f6d',a:0},
  u:{name:'Unterstützung',col:'#5ab8ff',a:90},
  l:{name:'Logistik',col:'#ffb03d',a:180}};
const NODE_DEFS2=[
 ['k1','k','root',1,0,'Kernpanzer',40,'c',10,1.25,l=>`+${l*20} % Leben des Kerns`],
 ['k2a','k','k1',2,-1,'Kernschild',10,'c',50,1.35,l=>l?`Schild mit ${25+(l-1)*8} % des Kernlebens`:'Noch kein Schild'],
 ['k2b','k','k1',2,1,'Kernreparatur',10,'c',40,1.35,l=>l?`Repariert ${fmtD(l*.3)} % Leben pro Sekunde`:'Keine Reparatur'],
 ['k3','k','k2a',3,-.5,'Kerngeschütz',20,'c',80,1.3,l=>`+${l*50} % Schaden des Kerngeschützes`],
 ['k4','k','k3',4,0,'Festung',25,'m',2,1.35,l=>`×${fmtD(Math.pow(1.1,l),2)} Leben des Kerns`],
 ['k5','k','k4',5,0,'Bastion',10,'m',5,1.5,l=>`−${l*5} % erlittener Schaden`],
 ['w1','w','root',1,0,'Kalibrierung',50,'c',12,1.25,l=>`+${l*15} % Schaden aller Schadenstürme`],
 ['w2a','w','w1',2,-1.3,'Laserlinsen',25,'c',60,1.3,l=>`+${l*25} % Laserschaden`],
 ['w2b','w','w1',2,0,'Sprengköpfe',25,'c',60,1.3,l=>`+${l*25} % Raketenschaden`],
 ['w2c','w','w1',2,1.3,'Hochspannung',25,'c',60,1.3,l=>`+${l*25} % Tesla-Schaden`],
 ['w3','w','w2b',3,0,'Feuerleitung',15,'m',1,1.4,l=>`+${l*8} % Feuerrate aller Schadenstürme`],
 ['w4','w','w3',4,0,'Überlastung',30,'m',3,1.33,l=>`×${fmtD(Math.pow(1.1,l),2)} Schaden aller Türme`],
 ['w5','w','w4',5,0,'Weitsicht',10,'m',4,1.5,l=>`+${l*5} % Reichweite aller Türme`],
 ['u1','u','root',1,0,'Feldradius',15,'c',20,1.3,l=>`+${l*4} % Radius der Unterstützungstürme`],
 ['u2a','u','u1',2,-1,'Synergie',20,'c',80,1.3,l=>`+${l*10} % Stärke der Kombinationseffekte`],
 ['u2b','u','u1',2,1,'Tiefkühlung',10,'c',90,1.35,l=>`+${l*15} % Einfrierdauer`],
 ['u3','u','u2a',3,0,'Giftmischer',10,'m',2,1.4,l=>`+${l*20} % Gift- und Säureschaden`],
 ['u4','u','u3',4,0,'Resonanzkern',5,'m',6,1.6,l=>`+${l*10} % Wirkung aller Unterstützungstürme`],
 ['l1','l','root',1,0,'Energiezufuhr',30,'c',10,1.25,l=>`+${l*10} % Energie aus Gegnern`],
 ['l2a','l','l1',2,-1.3,'Umbautrupp',5,'c',150,2,l=>`${2+l} Umbaupunkte pro Pause`],
 ['l2b','l','l1',2,0,'Bauplätze',6,'c',200,2.2,l=>`${4+l} Bauplätze pro Run`],
 ['l2c','l','l1',2,1.3,'Bauzeit',4,'c',100,1.8,l=>`${20+l*5} Sekunden Umbauphase`],
 ['l3','l','l2b',3,0,'Startenergie',20,'c',60,1.3,l=>`${100+l*40} Energie zu Beginn`],
 ['l4','l','l3',4,-.6,'Schaltkreisfabrik',25,'c',300,1.3,l=>`+${l*15} % Schaltkreise`],
 ['l5','l','l3',4,.6,'Matrixdecoder',10,'m',3,1.5,l=>`+${l*20} % Matrixchips`]];
const NODES2={root:{id:'root',br:null,parent:null,depth:0,name:'Kern',max:1,x:0,y:0}};
for(const [id,br,parent,depth,lat,name,max,cur,base,g,fx] of NODE_DEFS2){const a=BR2[br].a*PI/180,R=118*depth,L=lat*68;
  NODES2[id]={id,br,parent,depth,name,max,cur,base,g,fx,x:Math.cos(a)*R-Math.sin(a)*L,y:Math.sin(a)*R+Math.cos(a)*L}}

function freshW2(){return{cur:{c:0,m:0},nodes:{root:1},towers:{laser:{u:1,l:1},frost:{u:1,l:1},rocket:{u:0,l:1},tesla:{u:0,l:1},weak:{u:0,l:1},cryo:{u:0,l:1}},best:0,cycleBest:0,runs:0}}
const w2Unlocked=save=>(save.best||0)>=100||!!save.w2test;

function stats2(save){const w=save.w2,L=id=>w.nodes[id]||0;
  const S=stats({nodes:{root:1},pr:{},best:0});   // neutrale Grundwerte
  const pd=Math.pow(1.1,L('w4'))*(1+.01*(save.best||0)); // Bonus aus Welt-1-Rekord
  Object.assign(S,{baseHp:300*(1+.2*L('k1'))*Math.pow(1.1,L('k4')),shieldPct:L('k2a')?.25+.08*(L('k2a')-1):0,regen:.003*L('k2b'),dmgTaken:1-.05*L('k5'),
    turrets:1,turretDmg:9*(1+.5*L('k3'))*pd,turretRange:220,drones:0,slots:0,autoRate:0,startWave:1,startMax:1,
    tDmg:(1+.15*L('w1'))*pd,laserDmg:1+.25*L('w2a'),rocketDmg:1+.25*L('w2b'),teslaDmg:1+.25*L('w2c'),tRate:1+.08*L('w3'),tRange:1+.05*L('w5'),
    supR:(1+.04*L('u1'))*(1+.05*L('w5')),comboMul:1+.1*L('u2a'),freezeMul:1+.15*L('u2b'),poisonMul:1+.2*L('u3'),supPow:1+.1*L('u4'),
    energyMul:1+.1*L('l1'),moves:2+L('l2a'),slots2:4+L('l2b'),buildTime:20+5*L('l2c'),startEnergy:100+40*L('l3'),gC:1+.15*L('l4'),gM:1+.2*L('l5'),
    tapDmg:6*pd});
  return S}
// Bonus, den die Gitterfestung dem Neon-Sektor gibt
const w2BonusForW1=save=>1+.02*((save.w2&&save.w2.best)||0);
