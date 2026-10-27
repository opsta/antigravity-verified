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

test('short words only match as whole tokens', () => {
  const dir = fixture({ 'a.md': `laws, crosswalk, ${BANNED[8]}s, ${BANNED[13]}x are fine\n` });
  assert.equal(run(dir).status, 0);
  rmSync(dir, { recursive: true });
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
