# ENEMY format (`assets/data/enemies/**/*.json`)

> **Status**: core · 229 files, one per enemy, grouped by area
> (`rookie-harbor/`, `bergen/`, `arid/`, `boss/`…). DOCTYPE: `ENEMY`.
> Loaded by `game.feature.combat` (`sc.EnemyEntity`) via `ig.enemyDatabase`.

## At a glance

| Edit goal | Primary fields | Runtime consequence |
|---|---|---|
| Change survivability | `params`, `damageFactor`, `hpBreaks` | Combat math, phases, and break behavior |
| Change movement | `size`, `maxVel`, friction/fly fields | Collision and AI movement |
| Change AI | `defaultState`, `states`, `trackers`, `actions` | State-choice evaluation and action scripts |
| Change drops | `itemDrops`, `healDropRate`, `credit`, `exp` | Defeat reward generation |
| Change visuals | `anims`, `walkConfigs`, `soundType`, `hpBar` | Animation lookup and HUD presentation |

```ts
type EnemyDefinition = {
  DOCTYPE: "ENEMY";
  level: number;
  params: { hp: number; attack: number; defense: number; focus: number };
  states: Record<string, EnemyState>;
  actions: Record<string, ActionStepData[]>;
};
type EnemyState = { appearAction?: string; choices: EnemyChoice[] };
```

## Guardrails

- Do not change an `actions` key without updating every state/reaction that
  references it; missing action names fail at runtime or leave an idle enemy.
- Keep `states[].choices[]` ordered: the first valid choice wins.
- Do not invent item ids, animation paths, or tracker names; resolve each
  against the item database, animation files, and the same enemy definition.
- Treat collision dimensions and z-height as physics data, not just visual
  sizing; test walls, slopes, drops, and overlap sorting after edits.

## Field reference

### Identity & stats

| Field | Type | Meaning |
|---|---|---|
| `DOCTYPE` | string | Always `"ENEMY"` |
| `name` | string | (implicit — filename) |
| `level` | number | Enemy level (scales stats) |
| `params` | object | `{hp, attack, defense, focus}` — base combat stats |
| `credit` | number | Trade credit reward |
| `exp` | number | EXP reward |
| `maxSp` | number | Max SP (stamina) |
| `enduranceScale` | number | Endurance/stagger gauge scale |
| `healDropRate` | number | 0–1 chance of healing drops |
| `boss` | boolean | Boss flag (`bossOrder` ranks bosses) |
| `boostedLevel` | number | Boosted (overleveled) variant level |
| `itemDrops` | array/object | Loot table (item id + chance) |

### Body & movement

| Field | Type | Meaning |
|---|---|---|
| `size` | object | `{x, y, z}` collision box |
| `padding` | object | `{x, y}` collider padding |
| `weight` | number | Physics weight |
| `maxVel` | number | Max move speed (px/s) |
| `accelSpeed` | number | Ground acceleration |
| `airFriction` / `friction` / `bounciness` | number | Physics params |
| `jumpingEnabled` | boolean | Can jump |
| `floatHeight` / `floatAccel` / `floatMaxSpeed` / `floatVariance` | number | Floating movement params (hover enemies) |
| `flyHeight` / `flyKeepHeight` | number/boolean | Fly height / keep-height mode |
| `zGravityFactor` / `maxZVel` | number | Vertical physics |
| `groundConnect` / `terrainFrictionIgnore` | string/boolean | Ground adhesion, ignore terrain friction |
| `slipThrough` (implied) | — | See action steps |
| `shadow` / `shadowScaleY` | number | Shadow size/scale |

### Combat behaviour

| Field | Type | Meaning |
|---|---|---|
| `material` | string | `ORGANIC`, `METAL`… (hit sounds, element interaction) |
| `aiGroup` | string | Shared AI identifier (dice, turret…) |
| `aiLearnType` | string | `REGULAR`/… (analyzable learning) |
| `aggression` | string | Aggro profile |
| `targetDetect` | object | `{detectDistance, loseDistance, notifyNeighbourRadius}` |
| `hpBreaks` | array/object | HP thresholds (phase changes) |
| `hitStable` | string | `LIGHT`/… (knockback resistance) |
| `hitIgnore` | boolean | Immune to hit reactions |
| `invincibleTimer` | number | i-frames after hit |
| `damageFactor` / `fallDmgFactor` / `regenFactor` / `ballFactor` | number | Damage/regeneration multipliers |
| `elementModes` / `elementFilter` | object/string | Element behaviour (weak/immune/absorb) |
| `modifiers` | object | Stat modifiers per situation |
| `analyzable` | boolean | Can be scanned/learned |
| `ignoreTaunts` | boolean | Immune to taunt |
| `faceToTarget` / `faceToTargetSpeed` / `faceDirFixed` | boolean/number | Facing behaviour |
| `soundType` | string | Footstep/hit sound set |
| `hpBar` | string | HUD HP-bar style (`boss`, `mini`…) |

### AI: trackers, states, actions

| Field | Type | Meaning |
|---|---|---|
| `defaultState` | string | Initial state (usually `"IDLE"`) |
| `states` | object | State machine: state name → `{appearAction, choices[]}` |
| `trackers` | object | Recharge timers: name → `{type: "TIME", target, initRandom, resetRandom, noStateReset}` — gates for `TRACKER_READY` requirements |
| `actions` | object | Named action scripts: name → ACTION_STEP list |
| `reactions` | object | Reaction scripts to external events (damage, debuffs) |
| `enabledReactions` | array | Which reactions are active |
| `proxies` | object | Script proxies (remote control of other entities) |
| `walkConfigs` | object | Per-config animation mapping: config → `{idle, move, damage}` → animation names |
| `walkAnims` | string | Which walk config is active |
| `anims` | string | Animation reference (`"enemies.dice-mage"` → `assets/data/animations/enemies/dice-mage.json`) |
| `annotate` | object | Editor annotations |

### State-choice mechanics

Each state lists ordered `choices`; the first whose `req[]` conditions all
pass wins. Requirements are typed (`HAS_TARGET`, `!HAS_TARGET`,
`TRACKER_READY` + tracker name, `RANDOM` + max, `!ATTRIB_IS_TRUE` +
attribute name, `!SPAWN_POINT_DISTANCE`…). A chosen choice may run an
`action` (script name), switch state (`postSwitchState`), or both.

Example (dice-mage):

```json
"states": {
  "IDLE": {
    "choices": [
      { "req": [{"name": "hasDice", "type": "!ATTRIB_IS_TRUE"}], "action": "InitDice" },
      { "req": [{"type": "HAS_TARGET"}], "postSwitchState": "DEFAULT" },
      { "req": [{"type": "RANDOM", "max": 0.3}], "action": "MoveRandom" },
      { "action": "Idle" }
    ]
  }
}
```

## Engine consumers

- `game.feature.combat.entities.enemy` (`sc.EnemyEntity`) reads the whole
  file; `combat.combat-action-steps` / `enemy-steps` register the
  enemy-specific action steps referenced by `actions`.
- Animations are resolved through `ig.animation.get` →
  `assets/data/animations/<anims>.json` (see
  [ANIMATION format](02-animation.md)).
- The combat engine is documented in
  [game layer: combat](../../engine/game/02-combat.md); the step language
  in [ACTION_STEP reference](06-action-steps.md).