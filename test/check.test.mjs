import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BANNED } from '../scripts/check.mjs';

const script = fileURLToPath(new URL('../scripts/check.mjs', import.meta.url));

// Fixtures are written to a temp dir at test time so the repo never contains banned words.
function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'verified-'));
  for (const [name, body] of Object.entries(files)) {
    const p = join(dir, name);
    mkdirSync(join(p, '..'), { recursive: true });
    writeFileSync(p, body);
  }
  return dir;
}
const run = (dir) => spawnSync('node', [script, dir], { encoding: 'utf8' });

test('banned word in a rule exits 1 and prints BANNED', () => {
  const dir = fixture({ 'rules/x.md': `---\ntrigger: always_on\n---\nuse ${BANNED[2]}\n` });
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /BANNED rules\/x\.md:4 /);
  rmSync(dir, { recursive: true });
});

test('every banned word is caught, case-insensitively', () => {
  for (const w of BANNED) {
    const dir = fixture({ 'a.md': `x ${w.toUpperCase()} y\n` });
    assert.equal(run(dir).status, 1, w);
    rmSync(dir, { recursive: true });
  }
});

test('short words match whole tokens only; others match as substrings', () => {
  const cur = BANNED.find((w) => w.startsWith('cur'));
  const wt = BANNED.find((w) => w.length === 3 && w.startsWith('a') && w.endsWith('s'));
  const sub = BANNED.find((w) => w.startsWith('az'));
  const ok = fixture({ 'a.md': `laws, crosswalk, pre${cur}, ${cur}s, ${wt}x are fine\n` });
  assert.equal(run(ok).status, 0);
  rmSync(ok, { recursive: true });
  for (const text of [`a ${cur} here`, `a ${cur.toUpperCase()}.`, `${wt}-x`, `${sub[0].toUpperCase()}${sub.slice(1)}AD`]) {
    const bad = fixture({ 'a.md': text + '\n' });
    assert.equal(run(bad).status, 1, text);
    rmSync(bad, { recursive: true });
  }
});

test('oversize rule prints OVERSIZE', () => {
  const dir = fixture({ 'rules/big.md': 'a'.repeat(1600) });
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /OVERSIZE rules\/big\.md 1600\/1536/);
  rmSync(dir, { recursive: true });
});

test('clean fixture exits 0; node_modules and .git are skipped', () => {
  const dir = fixture({
    'rules/ok.md': 'fine\n',
    'node_modules/p/a.md': `${BANNED[0]}\n`,
    '.git/x': `${BANNED[0]}\n`,
  });
  assert.equal(run(dir).status, 0);
  rmSync(dir, { recursive: true });
});

import { check } from '../scripts/check.mjs';
import { existsSync, readFileSync } from 'node:fs';
const repo = fileURLToPath(new URL('..', import.meta.url));

test('real repo passes check', () => {
  const r = check(repo);
  assert.deepEqual(r, { banned: [], oversize: [] });
});

test('verification-contract rule exists with always_on trigger and the three gates', () => {
  const f = join(repo, 'rules/verification-contract.md');
  assert.ok(existsSync(f));
  const t = readFileSync(f, 'utf8');
  assert.match(t, /^---\ntrigger: always_on\n---\n/);
  for (const g of ['Gate 1 spec approved', 'Gate 2 plan approved', 'Gate 3 VERIFY.md accepted']) assert.ok(t.includes(g), g);
  for (const k of ['test', 'command', 'artifact', 'CORE.lock', '/verify']) assert.ok(t.includes(k), k);
});

function frontmatter(file) {
  const t = readFileSync(join(repo, file), 'utf8');
  const m = t.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, `${file} has frontmatter`);
  const fm = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
    const item = line.match(/^\s+-\s+(.+)$/);
    if (kv) { key = kv[1]; fm[key] = kv[2] === '' ? [] : kv[2]; }
    else if (item && Array.isArray(fm[key])) fm[key].push(item[1]);
  }
  return fm;
}

test('verify skill and template exist with name and description', () => {
  assert.ok(existsSync(join(repo, 'skills/verify/assets/VERIFY.template.md')));
  const fm = frontmatter('skills/verify/SKILL.md');
  assert.equal(fm.name, 'verify');
  assert.ok(fm.description.length > 10);
});

test('template has the VERIFY.md table, sections and Gate 3 line', () => {
  const t = readFileSync(join(repo, 'skills/verify/assets/VERIFY.template.md'), 'utf8');
  assert.ok(t.includes('| # | Acceptance criterion | Evidence kind | Evidence | Result |'));
  for (const s of ['Untested criteria', 'Tests modified', 'Core files touched']) assert.ok(t.includes(s), s);
  assert.ok(t.includes('Gate 3: awaiting human acceptance'));
});

test('verifier agent: required keys, read-only tools', () => {
  const fm = frontmatter('agents/verifier.md');
  assert.equal(fm.name, 'verifier');
  assert.ok(fm.description);
  assert.equal(fm.model, 'flash');
  assert.equal(fm.commandExecutionPolicy, 'sandbox');
  assert.ok(Array.isArray(fm.tools) && fm.tools.length > 0);
  for (const id of fm.tools) assert.doesNotMatch(id, /edit|write|replace|create/i, id);
  assert.deepEqual([...fm.tools].sort(), ['grep_search', 'run_command', 'view_file']);
});

test('ui-checker agent: required keys, no edit tools', () => {
  const fm = frontmatter('agents/ui-checker.md');
  assert.equal(fm.name, 'ui-checker');
  assert.ok(fm.description);
  assert.equal(fm.model, 'flash');
  for (const id of fm.tools ?? []) assert.doesNotMatch(id, /edit|write|replace|create/i, id);
});
