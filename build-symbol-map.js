#!/usr/bin/env node
/**
 * build-symbol-map.js — generate `symbol-map.json` from the deobfuscation work.
 *
 * For every module, aligns the RAW extract (`deobf/extract/<mod>.js`, which is
 * the beautified minified module body from `assets/js/game.compiled.js`) against
 * the CLEANED reference (`deobf/clean/<mod>.js`) using a chunked LCS traceback,
 * and records every unambiguous identifier rename it finds.
 *
 * Output format (see symbol-map.json):
 *   modules[moduleName][minifiedName] = { readableName: occurrenceCount, ... }
 *   — keyed by occurrence count descending, so the first readable name is the
 *     most likely demangling for that token in that module. The same minified
 *     token can legitimately map to several readable names (it is reused in
 *     different scopes by the minifier).
 *
 * Only *unambiguous* single-token identifier swaps are recorded: LCS gaps that
 * consist of exactly one deleted identifier and one inserted identifier with no
 * other tokens in between. Structural edits (`a && b()` → `if (a) b()`, var
 * splitting, comment insertion) produce wider gaps that are skipped, so the map
 * is noise-free — renames are additionally corroborated by every other
 * occurrence of the same identifier in the module.
 *
 * Usage:
 *   node build-symbol-map.js                 # all 569 modules → symbol-map.json
 *   node build-symbol-map.js impact.base.timer   # single module (debug)
 */
const fs = require('fs');
const path = require('path');

const EXTRACT_DIR = 'deobf/extract';
const CLEAN_DIR = 'deobf/clean';
const OUT = 'symbol-map.json';
const CHUNK_TOKENS = 1200;

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const TOKEN_RE = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([A-Za-z_$][A-Za-z0-9_$]*)|(.)/g;

function tokenize(src) {
  const tokens = [];
  let m;
  while ((m = TOKEN_RE.exec(src))) {
    const text = m[0];
    if (/^\s/.test(text)) continue; // whitespace captured by (.) fallback
    if (m[1]) tokens.push({ text, type: 'num' });
    else if (m[2]) tokens.push({ text, type: 'id' });
    else if (m[3] === '"' || m[3] === "'" || m[3] === '`') tokens.push({ text, type: 'str' });
    else tokens.push({ text, type: 'punc' });
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Chunked LCS with traceback
// ---------------------------------------------------------------------------

function chunk(tokens, n) {
  const size = Math.ceil(tokens.length / n);
  const out = [];
  for (let i = 0; i < tokens.length; i += size) out.push(tokens.slice(i, i + size));
  return out;
}

function lcsAlignment(a, b) {
  const n = a.length, m = b.length;
  // dp[i][j] = LCS length of a[0..i) and b[0..j); values <= min(n,m) fit Uint16.
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 1; i <= n; i++) {
    const row = dp[i], prev = dp[i - 1];
    const ai = a[i - 1];
    for (let j = 1; j <= m; j++) {
      if (ai.text === b[j - 1].text) row[j] = prev[j - 1] + 1;
      else row[j] = prev[j] >= row[j - 1] ? prev[j] : row[j - 1];
    }
  }
  // Traceback → list of {ai, bi} (ai = -1 → insert-only, bi = -1 → delete-only).
  const out = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1].text === b[j - 1].text) {
      out.push({ ai: i - 1, bi: j - 1 });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      out.push({ ai: -1, bi: j - 1 });
      j--;
    } else {
      out.push({ ai: i - 1, bi: -1 });
      i--;
    }
  }
  out.reverse();
  return out;
}

// ---------------------------------------------------------------------------
// Rename extraction from one module
// ---------------------------------------------------------------------------

function extractRenames(extractSrc, cleanSrc) {
  const a = tokenize(stripComments(extractSrc));
  const b = tokenize(stripComments(cleanSrc));
  const renames = new Map(); // obfToken -> Map(cleanToken -> count)

  const CHUNKS = Math.max(1, Math.ceil(Math.max(a.length, b.length) / CHUNK_TOKENS));
  const ca = chunk(a, CHUNKS);
  const cb = chunk(b, CHUNKS);
  // Keep a running index offset per chunk so ai/bi refer to global token indexes.
  let offA = 0, offB = 0;

  for (let c = 0; c < CHUNKS; c++) {
    const align = lcsAlignment(ca[c], cb[c]);
    // Walk the alignment; collect gaps (runs of non-matched items).
    let gap = [];
    const flush = () => {
      if (gap.length === 2) {
        const del = gap.find(g => g.ai !== -1 && g.bi === -1);
        const ins = gap.find(g => g.ai === -1 && g.bi !== -1);
        if (del && ins && a[offA + del.ai].type === 'id' && b[offB + ins.bi].type === 'id') {
          const from = a[offA + del.ai].text, to = b[offB + ins.bi].text;
          if (!renames.has(from)) renames.set(from, new Map());
          const counts = renames.get(from);
          counts.set(to, (counts.get(to) || 0) + 1);
        }
      }
      gap = [];
    };
    for (const item of align) {
      if (item.ai === -1 || item.bi === -1) gap.push(item);
      else flush();
    }
    flush();
    offA += ca[c].length;
    offB += cb[c].length;
  }

  return renames;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const only = process.argv[2];
  const files = fs.readdirSync(EXTRACT_DIR).filter(f => f.endsWith('.js')).sort();
  const modules = {};
  let pairs = 0;
  const t0 = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const mod = file.slice(0, -3);
    if (only && mod !== only) continue;
    const extractSrc = fs.readFileSync(path.join(EXTRACT_DIR, file), 'utf8');
    const cleanSrc = fs.readFileSync(path.join(CLEAN_DIR, file), 'utf8');
    const renames = extractRenames(extractSrc, cleanSrc);
    if (renames.size === 0) continue;
    const modMap = {};
    for (const [from, toMap] of renames) {
      const sorted = [...toMap.entries()].sort((x, y) => y[1] - x[1]);
      modMap[from] = Object.fromEntries(sorted);
      pairs += sorted.length;
    }
    modules[mod] = modMap;
    if (i % 50 === 0 || only) {
      console.log(`[${i + 1}/${files.length}] ${mod}: ${renames.size} distinct minified tokens → ${pairs} pairs (${Date.now() - t0}ms)`);
    }
  }

  const out = {
    $comment: [
      'CrossCode engine symbol map — maps minified identifiers back to readable names.',
      'Generated by build-symbol-map.js from deobf/extract vs deobf/clean (v1.4.2-3 build).',
      'modules[module][minifiedName] = { readableName: occurrenceCount } sorted by count desc.',
      'The same minified token is reused across scopes, so several readable names per token',
      'is normal; the first (highest count) is the best guess for any given occurrence.'
    ].join(' '),
    game: 'CrossCode 1.4.2-3',
    generator: 'build-symbol-map.js',
    format: 'modules[moduleName][minifiedName] = { readableName: occurrenceCount }',
    stats: {
      modulesWithRenames: Object.keys(modules).length,
      totalPairs: pairs
    },
    modules
  };

  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
  console.log(`\nWrote ${OUT}: ${Object.keys(modules).length} modules, ${pairs} rename pairs in ${Date.now() - t0}ms`);
}

main();
