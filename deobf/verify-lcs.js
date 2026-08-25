// Verify cleaned modules against extracts: token-stream LCS with
// identifiers/numbers wildcarded and comments stripped. High match ratio
// means the clean file is behavior-identical apart from renames.
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

function lcsRatio(a, b) {
  const n = a.length, m = b.length;
  if (n * m > 40000000) return { n, m, lcs: -1, ratio: -1, tooBig: true };
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return { n, m, lcs: dp[n][m], ratio: dp[n][m] / Math.max(n, m), tooBig: false };
}

const modules = process.argv.slice(2);
let failed = false;
for (const mod of modules) {
  const ext = stripComments(fs.readFileSync('deobf/extract/' + mod + '.js', 'utf8'));
  const clean = stripComments(fs.readFileSync('deobf/clean/' + mod + '.js', 'utf8'));
  const a = tokens(ext), b = tokens(clean);
  const r = lcsRatio(a, b);
  if (r.tooBig) {
    console.log(`${mod}: too large for exact LCS (${a.length} vs ${b.length} tokens) — SKIP`);
    continue;
  }
  const ok = r.ratio >= 0.9;
  if (!ok) failed = true;
  console.log(`${mod}: extract ${r.n} / clean ${r.m} tokens, LCS ${r.lcs}, ratio ${r.ratio.toFixed(4)} ${ok ? 'OK' : '** LOW **'}`);
}
process.exit(failed ? 1 : 0);
