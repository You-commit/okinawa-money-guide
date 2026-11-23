import fs from 'node:fs';
import assert from 'node:assert/strict';

const css = fs.readFileSync(new URL('../src/styles/editorial-consistency.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

assert.equal((app.match(/editorial-consistency\.css/g) || []).length, 1);
assert.ok(app.indexOf('dedicated-pages.css') < app.indexOf('editorial-consistency.css'));

const allowed = ['.site.info-page', '.site.knowledge-article-page', '.site.not-found-page'];
const selectorStarts = [];
for (const match of css.matchAll(/([^{}]+)\{/g)) {
  const raw = match[1].trim();
  if (raw.startsWith('@')) continue;
  for (const item of raw.split(',')) {
    const selector = item.trim();
    if (!selector) continue;
    selectorStarts.push(selector);
    assert.ok(allowed.some(prefix => selector.startsWith(prefix)), 'Unexpected CSS selector: ' + selector);
  }
}
assert.ok(selectorStarts.length > 30);
assert.ok(!css.includes('!important'));
assert.ok(!/(?:\s|^):root\s*[,{]/m.test(css));
assert.ok(!css.includes('.simulator-page') && !css.includes('.top-option02'));
console.log('Editorial scope: PASS; selectors:', selectorStarts.length);
