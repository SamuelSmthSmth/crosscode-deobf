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

## At a glance

| Task | Primary surface | Contract |
|---|---|---|
| Define a skill | `sc.Skills` registry + skilltree node | Skill type must be registered and serializable |
| Place a node | `skilltree.json` | Preserve element roots, ids, links, and OR branches |
| Learn a skill | player model / player step | CP cost and unlock state belong to the model |
| Apply a modifier | `sc.CombatParams` | Combat reads the learned skill, not the circuit UI |

```ts
sc.Skilltree.getSkill?(uid: number): Skill;
sc.PlayerModel.learnSkill?(uid: number): boolean;
```

## Guardrails

- Do not edit the circuit menu as the source of skill state; it renders the
  player model and skilltree data.
- Do not reuse a skill type id with different semantics; saves and auto-skill
  ranking depend on stable identifiers.
- Keep OR-branch alternatives and prerequisite topology valid across all five
  element trees.
- Test CP limits, element switching, save/load, and combat stat application.

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