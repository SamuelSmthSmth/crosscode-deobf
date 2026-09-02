# ITEM DATABASE format (`assets/data/item-database.json`)

> **Status**: stub (pending).

## Scope

- Single boot file with all item definitions: equipment, consumables,
  materials, quest items, trade items.

## To document

- Field reference: item ids, `type`, `category`, `name` (lang key),
  `description`, `icon`, `price`, `effects` (consume effects), `attack`/
  `defense`/`focus` stats for equipment, `special` properties.
- How `game.feature.inventory` loads and resolves items
  ([game: inventory](../../engine/game/10-inventory.md)),
  and how drops reference items (`itemDrops` in
  [ENEMY format](01-enemy.md)).

## Related

- Trade: [game: trade](../../engine/game/11-trade.md).
- Skills: [SKILLTREE format](11-skilltree.md).