'use strict';
// Extracts the full module manifest from the compiled CrossCode bundle.
// For each `ig.module("name")[.requires(...)].defines(...)` it records the module
// name, its dependency list, and the character offset in the source file.

const fs = require('fs');

const src = fs.readFileSync('assets/js/game.compiled.js', 'utf8');

const STRING = /"(?:[^"\\]|\\.)*"/g;

// Match each module header: ig.module("name") [.requires(...)] .defines(
const moduleRe = /ig\.module\(\s*"([^"]+)"\s*\)\s*(?:\.requires\(\s*([\s\S]*?)\s*\))?\s*\.defines\(\s*/g;

const modules = [];
let m;
while ((m = moduleRe.exec(src)) !== null) {
    const name = m[1];
    const requiresRaw = m[2] || '';
    const requires = [];
    let s;
    while ((s = STRING.exec(requiresRaw)) !== null) {
        requires.push(s[0].slice(1, -1).replace(/\\"/g, '"'));
    }
    modules.push({
        name,
        requires,
        offset: m.index,
    });
}

const uniqueNames = new Set(modules.map(x => x.name));
const duplicateNames = modules.length - uniqueNames.size;

const byNamespace = {};
for (const mod of modules) {
    const ns = mod.name.split('.')[0];
    (byNamespace[ns] = byNamespace[ns] || []).push(mod);
}

const summary = {
    totalModules: modules.length,
    duplicateNames,
    namespaces: Object.fromEntries(
        Object.entries(byNamespace).map(([ns, list]) => [ns, list.length])
    ),
};

fs.writeFileSync('engine-manifest.json', JSON.stringify(modules, null, 2));
fs.writeFileSync('engine-summary.json', JSON.stringify(summary, null, 2));

console.log('Total modules:', modules.length);
console.log('Duplicate names:', duplicateNames);
console.log('Namespaces:', JSON.stringify(summary.namespaces, null, 2));
