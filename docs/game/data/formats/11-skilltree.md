# SKILLTREE format (`assets/data/skilltree.json`)

> **Status**: core · Single boot file describing the whole skill tree as a
> per-element forest of nodes. DOCTYPE: `SKILLTREE`. Loaded and flattened
> by `sc.Skilltree` ([skills](../../engine/game/09-skills.md)); rendered by
> the circuit menu ([menu](../../engine/game/05-menu.md)).

## File anatomy

```json
{
  "DOCTYPE": "SKILLTREE",
  "NEUTRAL": [ { "distance": 0, "direction": "STRAIGHT", "level": 1,
                 "skill": { "type": "DEF" },
                 "children": [ { "distance": 4, "direction": "CCW_45", "level": 2,
                                 "skill": { "type": "DEF" }, "children": [], "id": 2 },
                               { "distance": 2, "direction": "STRAIGHT", "level": 2,
                                 "orBranch": { "direction": "STRAIGHT", "levels": [1,2,2],
                                   "left": [{"type":"GUARD_SPECIAL_A"},{"type":"ALL_ELEMENT_RES"},{"type":"GUARD_SPECIAL_A"}],
                                   "right": [{"type":"GUARD_SPECIAL_B"},{"type":"SPIKE_DAMAGE"},{"type":"GUARD_SPECIAL_B"}] },
                                 "children": [ … ], "id": 3 } ],
                 "id": 0 } ],
  "HEAT": [ … ], "COLD": [ … ], "SHOCK": [ … ], "WAVE": [ … ]
}
```

(from `skilltree.json`, `NEUTRAL[0]` — 4 neutral roots, 3 roots per element)

## Fields

| Field | Meaning |
|---|---|
| `DOCTYPE` | `SKILLTREE` |
| `<ELEMENT>` | Root arrays per element: `NEUTRAL` (4 roots), `HEAT`/`COLD`/`SHOCK`/`WAVE` (3 roots each) |

### Node fields

| Field | Meaning |
|---|---|
| `id` | Node id (assigned by the loader where missing) |
| `skill.type` | Skill type id — e.g. `DEF`, `GUARD_SPECIAL_A/B`, `ALL_ELEMENT_RES`, `SPIKE_DAMAGE`, `GUARD_STRENGTH`… → `sc.Skills` registry ([skills](../../engine/game/09-skills.md)) |
| `distance` | Radial distance from the parent node (tree layout in pixels) |
| `direction` | Direction from the parent (`STRAIGHT`, `CW_45`, `CCW_45`…) |
| `level` | Skill level this node represents |
| `children` | Child nodes (recursive tree) |
| `orBranch` | Choose-one branch: `{direction, levels[], left[], right[]}` — pick left or right column of skills (OR-branch handling in `sc.Skilltree`) |

## Engine consumption

- `sc.Skilltree` loads the JSON, flattens the forest into a skill list
  (assigning UIDs, resolving OR-branches into alternatives) and provides
  auto-skill helpers that pick skills within a CP budget using
  `skillRanking` preferences from the player definition
  ([CHARACTER format](04-character.md)).
- The circuit menu renders the tree from `TREE_CONFIGS` layout tables
  (`menu.gui.circuit.circuit-detail`/`circuit-overview`).

## Related

- Items: [ITEM DATABASE format](10-item-database.md)
- Engine: [skills](../../engine/game/09-skills.md),
  [menu](../../engine/game/05-menu.md)