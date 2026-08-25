#!/usr/bin/env node
/**
 * lookup-name.js — quick reference dictionary lookup from decrossfuscator maps.
 *
 * Usage: node lookup-name.js <query>
 * Example: node lookup-name.js Vec2
 *
 * The maps are in deobf/reference/ and use the format:
 *   readableName:obfuscatedToken
 *
 * This script builds an inverted index (obfuscated → readable) and also
 * allows searching by readable prefix.
 */
const fs = require('fs');
const path = require('path');

const refDir = path.join(__dirname, 'reference');
const query = process.argv[2];

if (!query) {
    console.log('Usage: node lookup-name.js <query>');
    console.log('Searches decrossfuscator maps for readable ↔ obfuscated name pairs.');
    process.exit(1);
}

const maps = fs.readdirSync(refDir).filter(f => f.endsWith('.map'));
const obfToReadable = {};
const readableToObf = {};

for (const mapFile of maps) {
    const content = fs.readFileSync(path.join(refDir, mapFile), 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
        const colon = line.indexOf(':');
        if (colon === -1) continue;
        const readable = line.substring(0, colon);
        const obfuscated = line.substring(colon + 1);
        readableToObf[readable] = readableToObf[readable] || [];
        readableToObf[readable].push({ map: mapFile, obfuscated });
        obfToReadable[obfuscated] = obfToReadable[obfuscated] || [];
        obfToReadable[obfuscated].push({ map: mapFile, readable });
    }
}

// Search readable names
const readableMatches = Object.keys(readableToObf).filter(k => k.toLowerCase().includes(query.toLowerCase()));
const obfMatches = Object.keys(obfToReadable).filter(k => k.toLowerCase().includes(query.toLowerCase()));

if (readableMatches.length > 0) {
    console.log(`\n=== Readable names matching "${query}" (${readableMatches.length}): ===`);
    for (const name of readableMatches.slice(0, 30)) {
        console.log(`  ${name}  →  ${readableToObf[name].map(e => e.obfuscated).join(', ')}`);
    }
    if (readableMatches.length > 30) console.log(`  ... and ${readableMatches.length - 30} more`);
}

if (obfMatches.length > 0) {
    console.log(`\n=== Obfuscated tokens matching "${query}" (${obfMatches.length}): ===`);
    for (const name of obfMatches.slice(0, 30)) {
        console.log(`  ${name}  →  ${obfToReadable[name].map(e => e.readable).join(', ')}`);
    }
    if (obfMatches.length > 30) console.log(`  ... and ${obfMatches.length - 30} more`);
}

if (readableMatches.length === 0 && obfMatches.length === 0) {
    console.log(`No matches for "${query}" in any map.`);
}

console.log(`\nMaps searched: ${maps.join(', ')}`);
console.log(`Total entries: ${Object.keys(readableToObf).length} readable names`);