#!/usr/bin/env node
// Guard: banned words and file-size budgets. Zero dependencies.
// The banned list is stored base64-encoded so this repo passes its own check.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BANNED = Buffer.from(
  'Y2xhdWRlLGFudGhyb3BpYyxraXJvLGFpLWRsYyxhaWRsYyxiZWRyb2NrLGNvcGlsb3QsbWljcm9zb2Z0LGF6dXJlLHNwZWMta2l0LGN1cnNvcix3aW5kc3VyZixvcGVuYWksYXdz',
  'base64',
).toString().split(',');

// Two short words match whole tokens only (they occur inside ordinary words). Chosen by index so
// the source holds no banned literal: positions 8 and 13 of the list.
const WHOLE_TOKEN = new Set([BANNED[8], BANNED[13]]);
const LIMITS = [
  [/^rules\/[^/]+\.md$/, 1536],
  [/^skills\/[^/]+\/SKILL\.md$/, 3072],
  [/^agents\/[^/]+\.md$/, 2400],
];
const SKIP = new Set(['node_modules', '.git']);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
const patterns = BANNED.map((w) => ({
  w,
  re: new RegExp(WHOLE_TOKEN.has(w) ? `(?<![a-z0-9])${esc(w)}(?![a-z0-9])` : esc(w), 'i'),
}));

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

export function check(root) {
  const banned = [];
  const oversize = [];
  for (const p of walk(root)) {
    const rel = relative(root, p).split(sep).join('/');
    const buf = readFileSync(p);
    for (const [re, limit] of LIMITS) {
      if (re.test(rel) && buf.length > limit) oversize.push({ file: rel, bytes: buf.length, limit });
    }
    if (buf.includes(0)) continue; // binary
    buf.toString('utf8').split('\n').forEach((line, i) => {
      for (const { w, re } of patterns) if (re.test(line)) banned.push({ file: rel, line: i + 1, word: w });
    });
  }
  return { banned, oversize };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { banned, oversize } = check(process.argv[2] ?? '.');
  for (const b of banned) console.log(`BANNED ${b.file}:${b.line} ${b.word}`);
  for (const o of oversize) console.log(`OVERSIZE ${o.file} ${o.bytes}/${o.limit}`);
  process.exit(banned.length || oversize.length ? 1 : 0);
}
