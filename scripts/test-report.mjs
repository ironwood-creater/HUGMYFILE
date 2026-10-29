// Builds reports/test-results.md: a table of every end-to-end test × browser ×
// viewport from Playwright's JSON reports (reports/tmp/results-*.json).
// Projects that were not run show "not run", so gaps are never hidden.
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'reports', 'tmp');
const PROJECTS = ['chromium-desktop', 'chromium-mobile', 'firefox-desktop', 'firefox-mobile', 'webkit-desktop', 'webkit-mobile'];
const SHORT = { 'chromium-desktop': 'Chromium 🖥', 'chromium-mobile': 'Chromium 📱', 'firefox-desktop': 'Firefox 🖥', 'firefox-mobile': 'Firefox 📱', 'webkit-desktop': 'WebKit 🖥', 'webkit-mobile': 'WebKit 📱' };

const results = new Map(); // key: file › title → { project: status }
const meta = [];

function walk(suite, file, prefix) {
  const here = suite.title && suite.title !== file ? [...prefix, suite.title] : prefix;
  for (const spec of suite.specs ?? []) {
    const key = `${file} › ${[...here, spec.title].join(' › ')}`;
    const row = results.get(key) ?? {};
    for (const t of spec.tests ?? []) {
      const last = t.results?.[t.results.length - 1];
      const status = t.status === 'expected' ? 'pass' : t.status === 'flaky' ? 'flaky' : t.status === 'skipped' ? 'skipped' : last?.status === 'passed' ? 'pass' : 'FAIL';
      row[t.projectName] = status;
    }
    results.set(key, row);
  }
  for (const s of suite.suites ?? []) walk(s, file, here);
}

if (!existsSync(dir)) {
  console.error('No results found in reports/tmp. Run the Playwright tests first.');
  process.exit(1);
}
for (const f of readdirSync(dir).filter((x) => /^results-.*\.json$/.test(x))) {
  const data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  meta.push(`${f}: ${data.stats?.expected ?? 0} passed, ${data.stats?.unexpected ?? 0} failed, ${data.stats?.flaky ?? 0} flaky, ${data.stats?.skipped ?? 0} skipped (${Math.round((data.stats?.duration ?? 0) / 1000)} s)`);
  for (const s of data.suites ?? []) walk(s, s.file ?? s.title, []);
}

const ran = PROJECTS.filter((p) => [...results.values()].some((r) => r[p]));
const counts = Object.fromEntries(PROJECTS.map((p) => [p, { pass: 0, fail: 0 }]));
const lines = [];
lines.push('# End-to-end test results', '');
lines.push(`Generated ${new Date().toISOString()} from ${meta.length} Playwright report(s).`, '');
for (const m of meta) lines.push(`- ${m}`);
lines.push('');
lines.push(`| Test | ${PROJECTS.map((p) => SHORT[p]).join(' | ')} |`);
lines.push(`|---|${PROJECTS.map(() => '---').join('|')}|`);
for (const [key, row] of [...results.entries()].sort()) {
  const cells = PROJECTS.map((p) => {
    const s = row[p];
    if (!s) return 'not run';
    if (s === 'pass') counts[p].pass++;
    else counts[p].fail++;
    return s === 'pass' ? '✅' : s === 'FAIL' ? '❌ FAIL' : s;
  });
  lines.push(`| ${key.replace(/\|/g, '\\|')} | ${cells.join(' | ')} |`);
}
lines.push('');
lines.push('| Project | Passed | Failed |', '|---|---|---|');
for (const p of PROJECTS) lines.push(`| ${p} | ${ran.includes(p) ? counts[p].pass : 'not run'} | ${ran.includes(p) ? counts[p].fail : 'not run'} |`);
mkdirSync(join(root, 'reports'), { recursive: true });
writeFileSync(join(root, 'reports', 'test-results.md'), lines.join('\n') + '\n');
console.log(`Wrote reports/test-results.md (${results.size} tests; projects run: ${ran.join(', ') || 'none'})`);
for (const p of PROJECTS) if (ran.includes(p)) console.log(`  ${p}: ${counts[p].pass} passed, ${counts[p].fail} failed`);
