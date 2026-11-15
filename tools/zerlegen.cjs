/* Einmal-Werkzeug für den Umbau auf Module (November 2026).
   Liest die bisherigen Quelldateien src/*.js (ein globaler Namensraum), ordnet jeden Baustein der obersten Ebene über die Tabelle PLAN
   einem Modul zu, ermittelt mit einer echten Bereichsanalyse, welche Namen jeder Baustein aus anderen Modulen braucht, und schreibt
   die Module mit passenden import- und export-Zeilen nach src/js/. Zuweisungen an Variablen eines anderen Moduls werden zu Setter-Aufrufen.
   Aufruf: node tools/zerlegen.cjs [--bericht]   (--bericht schreibt nichts, zeigt nur Abhängigkeiten und Verstöße gegen die Schichten) */
const fs = require('fs'),
  path = require('path');
const parser = require('@babel/parser'),
  traverse = require('@babel/traverse').default,
  generate = require('@babel/generator').default,
  t = require('@babel/types');

const FILES = ['core', 'core2', 'game', 'game2', 'render', 'audio', 'ui', 'dev'];
// Je Quelldatei: ab welcher Zeile welches Modul beginnt. Ein Baustein gehört zum letzten Eintrag, dessen Zeile nicht hinter seinem Anfang liegt.
const PLAN = {
  core: [[1, 'core/version'], [2, 'core/util'], [9, 'core/dev-hooks'], [10, 'core/util'], [16, 'core/format'], [38, 'data/currencies'], [53, 'data/prestige'], [105, 'data/nodes'], [114, 'data/balance'], [132, 'data/nodes'], [625, 'data/heroes'], [720, 'data/towers'], [827, 'data/heroes'], [831, 'data/drones'], [923, 'core/save'], [974, 'core/version'], [984, 'core/save'], [1037, 'core/stats']],
  core2: [[1, 'world2/data'], [106, 'world2/nodes'], [184, 'world2/save'], [206, 'world2/stats']],
  game: [[1, 'core/util'], [5, 'data/enemies'], [442, 'data/drops'], [460, 'data/enemies'], [462, 'data/balance'], [468, 'data/enemies'], [550, 'data/bosses'], [570, 'data/balance'], [573, 'run/util'], [589, 'run/Run']],
  game2: [[1, 'world2/Run2']],
  render: [[1, 'render/Renderer']],
  audio: [[1, 'audio/music-data'], [12, 'audio/bus'], [138, 'audio/synth'], [275, 'audio/sfx'], [650, 'audio/synth'], [685, 'audio/music-data'], [748, 'audio/music'], [1069, 'audio/track'], [1143, 'audio/sound']],
  ui: [[1, 'ui/dom'], [27, 'ui/state'], [36, 'ui/common'], [63, 'ui/state'], [121, 'ui/common'], [195, 'ui/hub'], [258, 'ui/settings'], [353, 'ui/nova'], [357, 'ui/worlds'], [401, 'ui/fleet'], [515, 'ui/codex'], [625, 'ui/achievements'], [823, 'ui/tree'], [828, 'ui/heroes'], [832, 'ui/hub'], [835, 'ui/hud'], [1048, 'ui/input'], [1174, 'ui/preview'], [1351, 'ui/tree'], [1597, 'ui/heroes'], [1716, 'ui/build'], [1999, 'ui/towers'], [2094, 'ui/nova'], [2231, 'ui/main']],
  dev: [[1, 'dev/inject'], [51, 'dev/hooks'], [67, 'dev/perf'], [408, 'dev/tools'], [523, 'dev/mode'], [578, 'dev/perf-start']],
};
// Große Klassen: Der Konstruktor und alles nicht Genannte bleibt in der Klassendatei, der Rest wird als Methodenpaket ausgelagert.
const SPLIT = {
  Run: {
    'run/towers': ['towerSlots', 'towerStats', 'buildCost', 'canPlace', 'place', 'upCost', 'refund', 'upgradeTower', 'moveTower', 'sellTower', 'updTowers'],
    'run/waves': ['nextWave', 'bossName', 'spawnPt', 'spawnEnemy', 'updWaves', 'milestone'],
    'run/base': ['updBase', 'autoShot', 'damageBase'],
    'run/heroes': ['makeHero', 'updHeroes', 'idle', 'kite', 'cluster', 'ai_klinge', 'bigGame', 'ai_kopfjaeger', 'ai_ingenieurin', 'ai_schuetzin', 'chain', 'strike', 'ai_arkanist', 'ai_waechterin', 'hurtAlly'],
    'run/drones': ['spawnDrone', 'updDrones'],
    'run/enemies': ['updEnemies', 'bossAbility', 'separate'],
    'run/impulse': ['shaded', 'tap'],
    'run/drops': ['spawnDrop', 'dropTap', 'useDrop', 'updDrops'],
    'run/zones': ['updZones'],
    'run/combat': ['hitE', 'kill', 'energyMul', 'reward', 'aoe', 'knock', 'shoot', 'shootAt', 'updProj'],
  },
  Renderer: {
    'render/sprites': ['enemySprite', 'eliteRing', 'heroSprite', 'droneSprite', 'coreSprite', 'towerSprite'],
    'render/towers': ['drawTowerArea', 'drawTowers'],
    'render/base': ['baseLook', 'baseKit', 'drawWreck', 'drawBase'],
  },
};
// Schichten: Spiellogik darf weder Oberfläche noch Grafik, Ton oder Entwicklermodus kennen (die Simulation lädt nur die Logik).
const LAYER = m => m.split('/')[0];
const ALLOWED = { core: ['core', 'data', 'world2'], data: ['core', 'data'], run: ['core', 'data', 'run'], world2: ['core', 'data', 'run', 'world2'], render: ['core', 'data', 'run', 'world2', 'render'], audio: ['core', 'audio'], ui: ['core', 'data', 'run', 'world2', 'render', 'audio', 'ui'], dev: ['core', 'data', 'run', 'world2', 'render', 'audio', 'ui', 'dev'] };

const ANKER = path.join('tools', 'plan.json');
const keyOf = (n, src) => {
  const names = declNames(n);
  return names.length ? names[0] : 'stmt:' + src.slice(n.start, n.start + 48).replace(/\s+/g, ' ');
};
let anchors = fs.existsSync(ANKER) && !process.argv.includes('--anker') ? JSON.parse(fs.readFileSync(ANKER, 'utf8')) : null;
const newAnchors = {};
let curMod = null;
const moduleAt = (file, n, src, first) => {
  if (anchors) {
    const hit = anchors[file][keyOf(n, src)];
    if (first && !hit) throw new Error('kein Anker am Dateianfang: ' + file);
    if (hit) curMod = hit;
    return curMod;
  }
  let m = PLAN[file][0][1];
  for (const [l, mod] of PLAN[file]) if (l <= n.loc.start.line) m = mod;
  if (m !== curMod || first) (newAnchors[file] = newAnchors[file] || {})[keyOf(n, src)] = m;
  curMod = m;
  return m;
};
const cap = n => n[0].toUpperCase() + n.slice(1);
function declNames(n) {
  if (n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration') return [n.id.name];
  if (n.type === 'VariableDeclaration') return n.declarations.map(d => d.id.name);
  return [];
}

// 1) Einlesen, Bausteine und Besitzer bestimmen
const chunks = []; // {file, mod, node, names, kind, refs:Set, order}
const owner = Object.create(null); // Name → Modul
const kindOf = Object.create(null); // Name → const | let | fn | class
const asts = {};
for (const f of FILES) {
  const src = fs.readFileSync(path.join('src', f + '.js'), 'utf8');
  const ast = (asts[f] = parser.parse(src, { sourceType: 'script' }));
  let first = true;
  for (const n of ast.program.body) {
    if (n.type === 'ExpressionStatement' && n.directive) continue;
    if (n.type === 'ExpressionStatement' && n.expression.type === 'StringLiteral') continue; // 'use strict'
    if (n.type === 'IfStatement' && src.slice(n.start, n.end).includes('module.exports')) continue;
    const mod = moduleAt(f, n, src, first);
    first = false;
    const names = declNames(n);
    const c = { file: f, mod, node: n, names, refs: new Set(), order: chunks.length };
    chunks.push(c);
    for (const nm of names) {
      if (owner[nm]) throw new Error('Name doppelt: ' + nm);
      owner[nm] = mod;
      kindOf[nm] = n.type === 'VariableDeclaration' ? n.kind : n.type === 'ClassDeclaration' ? 'class' : 'fn';
    }
  }
}
if (process.argv.includes('--anker')) {
  fs.writeFileSync(ANKER, JSON.stringify(newAnchors, null, 1));
  console.log('Anker geschrieben: ' + ANKER);
  process.exit(0);
}
// Klassen aufteilen: jede Methode wird ein eigener Baustein mit eigenem Zielmodul
const methodMod = Object.create(null);
for (const cls in SPLIT) for (const mod in SPLIT[cls]) for (const m of SPLIT[cls][mod]) methodMod[cls + '.' + m] = mod;

// 2) Bereichsanalyse: Verweise auf Namen der obersten Ebene je Baustein (bzw. je Methode) sammeln, fremde Zuweisungen merken
const setters = new Set();
const writes = []; // {path, name, mod}
for (const f of FILES) {
  traverse(asts[f], {
    Identifier(p) {
      const name = p.node.name;
      if (!owner[name]) return;
      const isRef = p.isReferencedIdentifier();
      const par = p.parentPath;
      const isWrite = (par.isAssignmentExpression() && par.node.left === p.node) || (par.isUpdateExpression() && par.node.argument === p.node);
      if (!isRef && !isWrite) return;
      const b = p.scope.getBinding(name);
      if (b && b.scope.block.type !== 'Program') return; // lokal überdeckt
      // zu welchem Baustein gehört die Stelle?
      let top = p;
      while (top.parentPath && top.parentPath.node.type !== 'Program') top = top.parentPath;
      const chunk = chunks.find(c => c.node === top.node);
      if (!chunk) return;
      let mod = chunk.mod,
        bucket = chunk.refs;
      if (top.node.type === 'ClassDeclaration' && SPLIT[top.node.id.name]) {
        const mp = p.findParent(x => x.isClassMethod());
        if (mp) {
          const key = top.node.id.name + '.' + mp.node.key.name;
          mod = methodMod[key] || chunk.mod;
          chunk.mrefs = chunk.mrefs || Object.create(null);
          bucket = chunk.mrefs[mp.node.key.name] = chunk.mrefs[mp.node.key.name] || new Set();
        }
      }
      bucket.add(name);
      if (isWrite && owner[name] !== mod) {
        if (kindOf[name] !== 'let') throw new Error('Zuweisung an ' + kindOf[name] + ' ' + name + ' in ' + mod);
        setters.add(name);
        writes.push({ path: par, name, bucket });
      }
    },
  });
}
// fremde Zuweisungen in Setter-Aufrufe umschreiben
for (const w of writes) {
  const { path: p, name } = w;
  const fn = t.identifier('set' + cap(name));
  if (p.isUpdateExpression()) {
    const op = p.node.operator === '++' ? '+' : '-';
    p.replaceWith(t.callExpression(fn, [t.binaryExpression(op, t.identifier(name), t.numericLiteral(1))]));
  } else {
    const op = p.node.operator;
    const val = op === '=' ? p.node.right : t.binaryExpression(op.slice(0, -1), t.identifier(name), p.node.right);
    p.replaceWith(t.callExpression(fn, [val]));
  }
  w.bucket.add('set' + cap(name));
}
for (const nm of setters) {
  owner['set' + cap(nm)] = owner[nm];
  kindOf['set' + cap(nm)] = 'fn';
}

// 3) Module zusammenstellen
const mods = Object.create(null); // mod → {parts:[code], refs:Set, exports:[]}
const M = m => (mods[m] = mods[m] || { parts: [], refs: new Set(), order: Object.keys(mods).length });
const gen = n => generate(n, { comments: true, retainLines: false }).code;
for (const c of chunks) {
  const n = c.node;
  if (n.type === 'ClassDeclaration' && SPLIT[n.id.name]) {
    const cls = n.id.name;
    const keep = [],
      out = {};
    for (const m of n.body.body) {
      const target = methodMod[cls + '.' + m.key.name];
      if (target && m.kind === 'method') (out[target] = out[target] || []).push(m);
      else keep.push(m);
      const refs = (c.mrefs && c.mrefs[m.key.name]) || new Set();
      for (const r of refs) M(target && m.kind === 'method' ? target : c.mod).refs.add(r);
    }
    n.body.body = keep;
    const packs = [];
    for (const target in out) {
      const pack = cls[0].toLowerCase() + cls.slice(1) + cap(path.basename(target)) + 'Methods';
      const obj = t.objectExpression(
        out[target].map(m => {
          const om = t.objectMethod('method', m.key, m.params, m.body, m.computed, m.generator, m.async);
          om.leadingComments = m.leadingComments;
          return om;
        }),
      );
      const decl = t.exportNamedDeclaration(t.variableDeclaration('const', [t.variableDeclarator(t.identifier(pack), obj)]));
      t.addComment(decl, 'leading', ' Methoden der Klasse ' + cls + ' (werden in ' + path.basename(c.mod) + '.js an die Klasse gehängt). ', false);
      M(target).parts.push(gen(decl));
      owner[pack] = target;
      kindOf[pack] = 'const';
      packs.push(pack);
    }
    for (const r of c.refs) M(c.mod).refs.add(r);
    M(c.mod).parts.push('export ' + gen(n));
    M(c.mod).parts.push('Object.assign(' + cls + '.prototype, ' + packs.join(', ') + ');');
    for (const pk of packs) M(c.mod).refs.add(pk);
    continue;
  }
  const mod = M(c.mod);
  for (const r of c.refs) mod.refs.add(r);
  const code = gen(n);
  mod.parts.push(c.names.length ? 'export ' + code : code);
}
for (const nm of setters) M(owner[nm]).parts.push('export function set' + cap(nm) + '(v) {\n  return (' + nm + ' = v);\n}');

// 4) Abhängigkeiten, Schichtprüfung
const rel = (from, to) => {
  let r = path.relative(path.dirname(from), to).split(path.sep).join('/');
  return (r.startsWith('.') ? r : './' + r) + '.js';
};
const deps = {};
let bad = 0;
for (const m in mods) {
  const by = {};
  for (const r of mods[m].refs) {
    const o = owner[r];
    if (!o || o === m) continue;
    (by[o] = by[o] || []).push(r);
  }
  deps[m] = by;
  for (const o in by)
    if (!ALLOWED[LAYER(m)].includes(LAYER(o))) {
      bad++;
      console.log('VERSTOSS ' + m + ' → ' + o + ': ' + by[o].join(', '));
    }
}
if (process.argv.includes('--bericht')) {
  for (const m in mods) console.log(m.padEnd(22) + Object.keys(deps[m]).join(' '));
  console.log('\nSetter für: ' + [...setters].join(', '));
  console.log(Object.keys(mods).length + ' Module, ' + bad + ' Schichtverstöße');
  process.exit(bad ? 1 : 0);
}
if (bad) process.exit(1);

// 5) Schreiben
const OUT = path.join('src', 'js');
fs.rmSync(OUT, { recursive: true, force: true });
for (const m in mods) {
  const imp = Object.keys(deps[m])
    .sort()
    .map(o => 'import { ' + deps[m][o].sort().join(', ') + " } from '" + rel(m, o) + "';");
  const file = path.join(OUT, m + '.js');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, (imp.length ? imp.join('\n') + '\n\n' : '') + mods[m].parts.join('\n\n') + '\n');
}
// Einstiegspunkte: Spiel, Entwicklermodus, Simulation
const list = Object.keys(mods);
const side = (name, sel, note) =>
  fs.writeFileSync(path.join(OUT, name + '.js'), '// ' + note + '\n' + list.filter(sel).map(m => "import '" + rel(name, m) + "';").join('\n') + '\n');
side('main', m => LAYER(m) !== 'dev', 'Einstieg des Spiels: lädt alle Module in der Reihenfolge, in der ihre Bausteine früher in einer Datei standen.');
side('dev-main', m => LAYER(m) === 'dev', 'Einstieg des Entwicklermodus: nur Beta und Bottest laden diese Datei (nach main.js).');
fs.writeFileSync(
  path.join(OUT, 'logic.js'),
  '// Die Spiellogik ohne Oberfläche, Grafik und Ton – das lädt die Simulation (sim/).\n' +
    list
      .filter(m => ['core', 'data', 'run', 'world2'].includes(LAYER(m)))
      .map(m => "export * from '" + rel('logic', m) + "';")
      .join('\n') +
    '\n',
);
console.log(list.length + ' Module nach ' + OUT + ' geschrieben, Setter: ' + [...setters].join(', '));
