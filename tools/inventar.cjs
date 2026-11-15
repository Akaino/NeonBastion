// Listet alle Bausteine der obersten Ebene je Quelldatei auf (Grundlage für die Aufteilung in Module).
const fs = require('fs'), parser = require('@babel/parser');
for (const f of ['core', 'core2', 'game', 'game2', 'render', 'audio', 'ui', 'dev']) {
  const src = fs.readFileSync('src/' + f + '.js', 'utf8');
  const ast = parser.parse(src, { sourceType: 'script' });
  const out = [];
  for (const n of ast.program.body) {
    const L = n.loc.start.line + '-' + n.loc.end.line;
    if (n.type === 'FunctionDeclaration') out.push('fn ' + n.id.name + ' ' + L);
    else if (n.type === 'ClassDeclaration') out.push('class ' + n.id.name + ' ' + L + ' [' + n.body.body.map(m => m.key.name).join(',') + ']');
    else if (n.type === 'VariableDeclaration') out.push(n.kind + ' ' + n.declarations.map(d => (d.id.name || '{…}')).join(',') + ' ' + L);
    else out.push('stmt ' + L + ' ' + src.slice(n.start, Math.min(n.end, n.start + 60)).replace(/\s+/g, ' '));
  }
  console.log('== ' + f + ' (' + out.length + ')\n' + out.join('\n'));
}
