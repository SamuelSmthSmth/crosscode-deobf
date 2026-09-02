# SKILLTREE format (`assets/data/skilltree.json`)

> **Status**: stub (pending).

## Scope

- Single boot file describing the whole skill tree: nodes (active/passive
  skills), prerequisites, costs, positions.

## To document

- Field reference: node ids, `prereqs[]`, `cost`, `type` (combat skill,
  dash, survival…), `pos`, `icon`, per-element variants.
- How `game.feature.skills` builds the menu tree and how learned skills
  unlock combat abilities ([game: skills](../../engine/game/09-skills.md)).

## Related

- Items: [ITEM DATABASE format](10-item-database.md).
- Engine: [game: menu](../../engine/game/05-menu.md).