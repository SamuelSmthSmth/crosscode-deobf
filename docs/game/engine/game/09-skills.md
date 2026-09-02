# game.feature.skills — skills & the skill tree

> **Status**: core · 3 modules in `deobf/clean/game.feature.skills.*`.
> Covers `sc.Skills` (skill classes + factor tables) and `sc.Skilltree`
> (tree data loader / instantiation). Renders
> `assets/data/skilltree.json` ([SKILLTREE format](../../data/formats/11-skilltree.md)).

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `skills.skills` | `sc.Skills`, stat/element-resistance/special/combat-art skill bases, `STAT_FACTORS` tables, combat-art icon lookup, registered skill types | Skill system: skill base classes, the factor tables scaling skill effects by level+element, combat art icons |
| `skills.skilltree` | `sc.Skilltree`, `sc.SKILLS_DIRECTION`, `sc.SKILLS_DISTANCE_MULTIPLIER` | Tree data loader + skill instantiation: loads per-element tree JSON, flattens into a skill list (UID assignment, OR-branch handling), auto-skill helpers picking skills within a CP budget |
| `skills.plug-in` | — | Entry point: requires skills + skilltree |

## Behavior

- **`sc.Skills`** defines the skill *types*: stat skills (increase a base
  stat per level), element-resistance skills, and special/combat-art
  skills. Effects scale through `STAT_FACTORS` tables keyed by stat type,
  level and element (neutral vs. element curves).
- **`sc.Skilltree`** loads the per-element skill tree JSON
  (`assets/data/skilltree.json`), flattens it into a skill list — assigning
  UIDs and resolving OR-branches (choose-one nodes) — and provides helpers
  for the auto-skill system that selects skills within a CP budget.
- The skill tree UI lives in the menu layer
  (`menu.gui.circuit.*`, [menu](05-menu.md)); skill activation feeds combat
  ([combat](02-combat.md)) through `sc.CombatParams` and combat arts.

## Hooks & steps

- Skill learning is driven by the player model ([player](01-player.md)) and
  `player-steps` skill-learning steps; unlocked skills persist in saves
  through `sc.PlayerModel`/`ig.storage`.

## Related

- [menu](05-menu.md) · [combat](02-combat.md) · [player](01-player.md)
- Engine: [impact.base.loader](../../engine/impact/01-core.md)
- Data: [SKILLTREE format](../../data/formats/11-skilltree.md)