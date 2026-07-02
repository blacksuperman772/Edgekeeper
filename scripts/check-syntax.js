'use strict';
// Static gate: every inline <script> in every page must parse, and server.js
// must parse. Catches the "one broken script block kills the whole page"
// class of bug before it ships. Run: npm run test:syntax
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let bad = 0;

for (const f of fs.readdirSync(root).filter(f => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(root, f), 'utf8');
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m, i = 0;
  while ((m = re.exec(html))) {
    i++;
    try { new Function(m[1]); }
    catch (e) {
      bad++;
      const line = html.slice(0, m.index).split('\n').length;
      console.error(`FAIL ${f} script#${i} (line ${line}): ${e.message}`);
    }
  }
}

try { new Function(fs.readFileSync(path.join(root, 'server.js'), 'utf8')); }
catch (e) { bad++; console.error(`FAIL server.js: ${e.message}`); }

for (const f of fs.readdirSync(path.join(root, 'assets')).filter(f => f.endsWith('.js'))) {
  try { new Function(fs.readFileSync(path.join(root, 'assets', f), 'utf8')); }
  catch (e) { bad++; console.error(`FAIL assets/${f}: ${e.message}`); }
}

if (bad) { console.error(`\n${bad} syntax failure(s)`); process.exit(1); }
console.log('All inline scripts, assets/*.js and server.js parse cleanly.');
