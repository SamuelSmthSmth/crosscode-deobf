/*
 * One-off deobfuscation helper for game.feature.combat.combat-action-steps.
 * Renames single-letter locals using a tokenizer + brace-matched scope tracking,
 * skipping nested function scopes. Produces the cleaned documentation file.
 */
const fs = require("fs");

const SRC = "deobf/extract/game.feature.combat.combat-action-steps.js";
const DST = "deobf/clean/game.feature.combat.combat-action-steps.js";

let src = fs.readFileSync(SRC, "utf8");

// ---------------------------------------------------------------------------
// 1. Module-level helpers + scratch (exact replacements).
// ---------------------------------------------------------------------------
src = src.replace(
  "    function b(a) {\n        return a instanceof sc.CombatParams\n    }",
  "    function isCombatParams(entity) {\n        return entity instanceof sc.CombatParams\n    }"
);
src = src.replace(
  "    function a(a, b) {\n        for (var c = a.length; c--;) {\n            var d = a[c];\n            if (d instanceof sc.CombatProxyEntity && d.group == b) return d\n        }\n        return null\n    }",
  "    function findProxyInGroup(attached, group) {\n        for (var i = attached.length; i--;) {\n            var entity = attached[i];\n            if (entity instanceof sc.CombatProxyEntity && entity.group == group) return entity\n        }\n        return null\n    }"
);
// Helper call sites (all two-arg `a(...)` calls to findProxyInGroup).
src = src.replace(/return a\(d, c\)/g, "return findProxyInGroup(d, c)");
src = src.replace(/return a\(b\.actionAttached, c\)/g, "return findProxyInGroup(b.actionAttached, c)");
src = src.replace(/return a\(b\.entityAttached, c\)/g, "return findProxyInGroup(b.entityAttached, c)");
src = src.replace(/return a\(b\.sourceEntity\.actionAttached, c\)/g, "return findProxyInGroup(b.sourceEntity.actionAttached, c)");
src = src.replace("    var d = {\n", "    var COMBAT_STEP_TARGET = {\n");
src = src.replace("    },\n        c = Vec3.create();", "    },\n        tmpVec3 = Vec3.create();");

// ---------------------------------------------------------------------------
// 2. Tokenizer.
// ---------------------------------------------------------------------------
function tokenize(s) {
  const tokens = [];
  let i = 0;
  const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < n && s[j] !== quote) {
        if (s[j] === "\\") j++;
        j++;
      }
      j = Math.min(j + 1, n);
      tokens.push({ type: "string", start: i, end: j, value: s.slice(i, j) });
      i = j;
    } else if (/[A-Za-z0-9_$]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(s[j])) j++;
      tokens.push({ type: "ident", start: i, end: j, value: s.slice(i, j) });
      i = j;
    } else {
      tokens.push({ type: "other", start: i, end: i + 1, value: ch });
      i++;
    }
  }
  return tokens;
}

const tokens = tokenize(src);

// ---------------------------------------------------------------------------
// 3. Locate method definitions: NAME : function ( params ) { ... }
// ---------------------------------------------------------------------------
// Build index from token index -> token.
// We scan for `function` tokens. For each, find preceding `ident ':'` to get the
// method name, and the params between the following '(' and ')'.
const methodRenames = {}; // by method name -> { from: to } map applied to params/body

function addRename(methodName, from, to) {
  if (!methodRenames[methodName]) methodRenames[methodName] = {};
  methodRenames[methodName][from] = to;
}

// Core method params (a = entity/data).
addRename("init", "a", "data");
addRename("run", "a", "entity");
addRename("start", "a", "entity");
addRename("getNext", "a", "entity");
addRename("branchLabel", "a", "label");
addRename("label", "a", "entity");

// The two target/entity registry objects: single-param `a` -> entity.
["SELF", "PROXY_OWNER", "PROXY_SRC", "TARGET", "GUARDED_ATTACKER", "FIRST_HIT",
  "ENEMY_OWNER", "PROXY", "NAMED_ENTITY", "ATTRIB_ENTITY", "THREAT",
  "ENTITY_VIA_ID", "PART_TARGET_ROOT", "CLOSEST", "TARGET_ROOT"].forEach((m) => {
  addRename(m, "a", "entity");
  addRename(m, "b", "entity");
  addRename(m, "c", "group");
});

// Find each function: token index of `function`, its params span and body span.
const functions = [];
for (let i = 0; i < tokens.length; i++) {
  if (tokens[i].type === "ident" && tokens[i].value === "function") {
    // params: expect '(' at i+1
    if (i + 1 < tokens.length && tokens[i + 1].value === "(") {
      // find matching ')'
      let depth = 0;
      let j = i + 1;
      let paramsStart = i + 2;
      for (; j < tokens.length; j++) {
        if (tokens[j].value === "(") depth++;
        else if (tokens[j].value === ")") {
          depth--;
          if (depth === 0) break;
        }
      }
      const paramsEnd = j;
      const params = [];
      let cur = null;
      for (let k = paramsStart; k < paramsEnd; k++) {
        const t = tokens[k];
        if (t.type === "ident") cur = cur === null ? { name: t.value } : cur;
        else if (t.value === ",") {
          if (cur) params.push(cur);
          cur = null;
        }
      }
      if (cur) params.push(cur);

      // body: expect '{' after ')'
      let bodyStart = -1;
      for (let k = paramsEnd + 1; k < tokens.length; k++) {
        if (tokens[k].type !== "other") continue;
        if (tokens[k].value === "{") { bodyStart = k; break; }
        if (tokens[k].value !== " " && tokens[k].value !== "\n") break;
      }
      if (bodyStart === -1) continue;

      // brace-match the body
      let bd = 0;
      let bodyEnd = -1;
      for (let k = bodyStart; k < tokens.length; k++) {
        if (tokens[k].type === "string") continue;
        if (tokens[k].value === "{") bd++;
        else if (tokens[k].value === "}") {
          bd--;
          if (bd === 0) { bodyEnd = k; break; }
        }
      }
      if (bodyEnd === -1) continue;

      // method name: look backwards for `ident` preceded by `:`
      let methodName = null;
      for (let k = i - 1; k >= 0; k--) {
        if (tokens[k].type === "other" && (tokens[k].value === ":" )) {
          // find the identifier before ':'
          let m = k - 1;
          while (m >= 0 && tokens[m].type === "other") m--;
          if (m >= 0 && tokens[m].type === "ident") methodName = tokens[m].value;
          break;
        }
        if (tokens[k].type === "other" && (tokens[k].value === "{" || tokens[k].value === "}" || tokens[k].value === ";" || tokens[k].value === "=" )) break;
      }

      functions.push({
        tokenIndex: i,
        methodName,
        paramsStart,
        paramsEnd,
        params: params.map((p) => p.name),
        bodyStart,
        bodyEnd
      });
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Scope-aware rename.
// ---------------------------------------------------------------------------
// Build a map from each function's param-token positions + body to its rename map.
// We produce a list of rename instructions: {scopeStart, scopeEnd, map} where
// scopeStart/scopeEnd are token indices of the function body (inclusive), and
// map is { oldParamName: newParamName }.
const scopeRenames = [];
const fnByBody = new Map();
for (const fn of functions) {
  if (!fn.methodName) continue;
  const map = methodRenames[fn.methodName];
  if (!map) continue;
  // Only rename params that actually appear and match.
  const effective = {};
  fn.params.forEach((p) => {
    if (map[p]) effective[p] = map[p];
  });
  if (Object.keys(effective).length === 0) continue;
  fnByBody.set(fn.bodyStart, fn.bodyEnd);
  scopeRenames.push({ bodyStart: fn.bodyStart, bodyEnd: fn.bodyEnd, map: effective, paramsStart: fn.paramsStart, paramsEnd: fn.paramsEnd });
}

// Sort by body start; later (inner) scopes first when nested.
scopeRenames.sort((a, b) => a.bodyStart - b.bodyStart);

// For each token index, determine the innermost rename scope that contains it
// (or is the function's param list) and whether it binds that identifier.
// We'll process scopes one at a time, but nested scopes must not be renamed if
// they bind the same identifier.
// Build an interval tree is overkill; instead, for each scope, rename within
// [bodyStart, bodyEnd] but skip any inner scope whose params include the name.
const replacements = new Map(); // tokenIndex -> newValue

for (const scope of scopeRenames) {
  const { bodyStart, bodyEnd, map, paramsStart, paramsEnd } = scope;
  // Rename params tokens.
  for (let k = paramsStart; k < paramsEnd; k++) {
    const t = tokens[k];
    if (t.type === "ident" && map[t.value] && !replacements.has(k)) {
      replacements.set(k, map[t.value]);
    }
  }
  // Find inner scopes nested within this one that bind any of the same names.
  const blocked = [];
  for (const inner of scopeRenames) {
    if (inner.bodyStart > bodyStart && inner.bodyEnd < bodyEnd) {
      const binds = inner.params.some((p) => map[p]);
      if (binds) blocked.push(inner);
    }
  }
  // Also block any nested function (even non-renamed) that binds these names.
  for (const fn of functions) {
    if (fn.bodyStart > bodyStart && fn.bodyEnd < bodyEnd) {
      if (fn.params.some((p) => map[p])) {
        blocked.push({ bodyStart: fn.bodyStart, bodyEnd: fn.bodyEnd });
      }
    }
  }
  blocked.sort((a, b) => a.bodyStart - b.bodyStart);

  const isBlocked = (idx) => {
    for (const b of blocked) {
      if (idx >= b.bodyStart && idx <= b.bodyEnd) return true;
    }
    return false;
  };

  for (let k = bodyStart; k <= bodyEnd; k++) {
    if (isBlocked(k)) continue;
    const t = tokens[k];
    if (t.type === "ident" && map[t.value] && !replacements.has(k)) {
      replacements.set(k, map[t.value]);
    }
  }
}

// Apply replacements (back-to-front to preserve offsets).
const entries = [...replacements.entries()].sort((a, b) => b[0] - a[0]);
for (const [idx, val] of entries) {
  const t = tokens[idx];
  src = src.slice(0, t.start) + val + src.slice(t.end);
}

// ---------------------------------------------------------------------------
// 5. Header + write.
// ---------------------------------------------------------------------------
const header = `/**
 * game.feature.combat.combat-action-steps
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: \`assets/js/game.compiled.js\` → \`ig.module("game.feature.combat.combat-action-steps")\`.
 *
 * The 114 combat \`ig.ACTION_STEP.*\` classes used inside enemy/combat-art
 * action scripts: targeting & facing, movement, hitbox forces (tackle, sweep,
 * push/pull, direct hits), proxy spawning/modification, shields, HP/SP, stun,
 * respawn, enemy events/spawning, and the two helper registries
 * (\`COMBAT_STEP_TARGET\` + entity finders). Single-letter locals were renamed
 * scope-aware (\`a\` → \`data\` in \`init\`, \`a\` → \`entity\` in \`run\`/\`start\`,
 * etc.).
 */
`;

fs.writeFileSync(DST, header + src);
console.log("Wrote " + DST + " (" + src.length + " chars)");
