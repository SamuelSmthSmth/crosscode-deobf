# game.feature.menu — the menu system

> **Status**: stub (pending).

## Modules (105)

`menu.area-loadable`, `menu.gui.base-menu`, plus one section per menu:
`menu.gui.arena.*`, `menu.gui.botanics.*`, `menu.gui.circuit.*`,
`menu.gui.equipment.*`, `menu.gui.quest.*`, `menu.gui.shop.*`,
`menu.gui.bestiary.*`, `menu.gui.trade.*`, `menu.gui.map.*` (world map),
`menu.gui.options.*`, `menu.gui.save.*`, `menu.gui.gallery.*` + ~10 more
sections and their misc/support modules

## To document

- The 22 menu sections and their GUI pages.
- `sc.MenuSystem`/base-menu: opening/closing, tabs, cursor routing,
  gamepad support.
- Where each section reads data (skilltree.json, item-database.json,
  quest model, arena, database…).

## Related

- [gui](06-gui.md) · [impact.feature.gui](../../engine/impact/features/01-gui.md)