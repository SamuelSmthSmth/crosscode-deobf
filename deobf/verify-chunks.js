// Chunked LCS verification for modules too big for one DP table.
// Splits extract and clean token streams into the same number of chunks
// (by fraction of total), then LCS-aligns chunk i with chunk i.
const fs = require('fs');

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function tokens(s) {
  const out = [];
  const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|([A-Za-z_$][A-Za-z0-9_$]*)|(\d+(?:\.\d+)?)|(.)/g;
  let m;
  while ((m = re.exec(s))) {
    if (m[1]) out.push('STR:' + m[1]);
    else if (m[2]) out.push('#ID');
    else if (m[3]) out.push('#NUM');
    else if (!/\s/.test(m[4])) out.push(m[4]);
  }
  return out;
}

function chunk(toks, n) {
  const size = Math.ceil(toks.length / n);
  const out = [];
  for (let i = 0; i < toks.length; i += size) out.push(toks.slice(i, i + size));
  return out;
}

function lcsRatio(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[n][m] / Math.max(n, m);
}

const mod = process.argv[2];
const ext = tokens(stripComments(fs.readFileSync('deobf/extract/' + mod + '.js', 'utf8')));
const clean = tokens(stripComments(fs.readFileSync('deobf/clean/' + mod + '.js', 'utf8')));
const CHUNKS = 6;
const ec = chunk(ext, CHUNKS), cc = chunk(clean, CHUNKS);
let total = 0, lcs = 0, worst = 1;
for (let i = 0; i < CHUNKS; i++) {
  const r = lcsRatio(ec[i], cc[i]);
  total += Math.max(ec[i].length, cc[i].length);
  lcs += r * Math.max(ec[i].length, cc[i].length);
  worst = Math.min(worst, r);
  console.log(`chunk ${i}: ${ec[i].length} vs ${cc[i].length} tokens, ratio ${r.toFixed(4)}`);
}
console.log(`== ${mod}: overall ratio ${(lcs / total).toFixed(4)}, worst chunk ${worst.toFixed(4)}`);
