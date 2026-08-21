'use strict';
// Reads engine-manifest.json and produces a hierarchical map of the engine,
// plus the dependency entry points (modules nothing depends on).

const fs = require('fs');
const modules = JSON.parse(fs.readFileSync('engine-manifest.json', 'utf8'));

// --- hierarchical namespace tree ---
function insert(root, parts, leaf) {
    const [head, ...rest] = parts;
    if (!root.children[head]) root.children[head] = { children: {}, leaves: [] };
    const node = root.children[head];
    if (rest.length === 0) node.leaves.push(leaf);
    else insert(node, rest, leaf);
}

const root = { children: {}, leaves: [] };
for (const m of modules) insert(root, m.name.split('.'), m.name);

function render(node, indent) {
    let out = '';
    const keys = Object.keys(node.children).sort();
    for (const key of keys) {
        const child = node.children[key];
        out += indent + key + '/\n';
        out += render(child, indent + '  ');
    }
    for (const leaf of node.leaves.sort()) out += indent + '  ' + leaf + '\n';
    return out;
}

fs.writeFileSync('engine-tree.txt', render(root, ''));

// --- entry points: modules that no other module requires ---
const required = new Set();
for (const m of modules) for (const r of m.requires) required.add(r);
const entryPoints = modules.filter(m => !required.has(m.name)).map(m => m.name);

// --- depth-2 counts ---
const byDepth2 = {};
for (const m of modules) {
    const key = m.name.split('.').slice(0, 2).join('.');
    (byDepth2[key] = byDepth2[key] || []).push(m.name);
}

console.log('=== Depth-2 namespaces ===');
for (const [k, v] of Object.entries(byDepth2).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(k.padEnd(28), v.length);
}
console.log('\n=== Entry points (not required by anything) ===');
console.log(entryPoints.sort().join('\n'));

// --- dependency fan-in: most-required modules (core API surface) ---
const fanIn = {};
for (const m of modules) for (const r of m.requires) fanIn[r] = (fanIn[r] || 0) + 1;
const top = Object.entries(fanIn).sort((a, b) => b[1] - a[1]).slice(0, 25);
console.log('\n=== Most depended-upon modules (core API) ===');
for (const [name, count] of top) console.log(String(count).padStart(4), name);
