'use strict';
// Extracts one module's body from the beautified bundle.
// Usage:
//   node extract-module.js <module.name>     -> writes deobf/extract/<module.name>.js
//   node extract-module.js --all             -> extracts every module
//   node extract-module.js --list            -> prints all module names (one per line)

const fs = require('fs');
const path = require('path');

const PRETTY = 'assets/js/game.compiled.pretty.js';
const OUT_DIR = 'deobf/extract';

const src = fs.readFileSync(PRETTY, 'utf8');

// Find all module headers with their start offsets (line-based).
const headerRe = /ig\.module\(\s*"([^"]+)"\s*\)/g;
const headers = [];
let m;
while ((m = headerRe.exec(src)) !== null) {
    headers.push({ name: m[1], offset: m.index });
}

function extract(name) {
    const idx = headers.findIndex(h => h.name === name);
    if (idx === -1) throw new Error(`Module not found: ${name}`);
    const start = headers[idx].offset;
    const end = idx + 1 < headers.length ? headers[idx + 1].offset : src.length;
    // Back up from the next module's offset past any trailing "ig.baked = !0;" marker.
    return src.slice(start, end);
}

function main() {
    const arg = process.argv[2];
    fs.mkdirSync(OUT_DIR, { recursive: true });

    if (arg === '--list') {
        for (const h of headers) console.log(h.name);
        return;
    }

    if (arg === '--all') {
        let count = 0;
        for (const h of headers) {
            const body = extract(h.name);
            fs.writeFileSync(path.join(OUT_DIR, h.name + '.js'), body);
            count++;
        }
        console.log(`Extracted ${count} modules to ${OUT_DIR}/`);
        return;
    }

    if (!arg) {
        console.error('Usage: node extract-module.js <module.name> | --all | --list');
        process.exit(1);
    }

    const body = extract(arg);
    const out = path.join(OUT_DIR, arg + '.js');
    fs.writeFileSync(out, body);
    console.log(`Wrote ${out} (${body.split('\n').length} lines)`);
}

main();
