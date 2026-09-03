# game.feature.inventory — inventory

> **Status**: core · 4 modules in `deobf/clean/game.feature.inventory.*`.
> Covers `sc.Inventory` (item storage) plus the item database loader/query
> API, level scaling and drop detectors. Item definitions come from
> `assets/data/item-database.json`
> ([ITEM DATABASE format](../../data/formats/10-item-database.md)).

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `inventory.inventory` | `sc.Inventory`, `sc.ITEMS_TYPES` (CONS/EQUIP/…) | Item database loader + query API: loads item JSON, converts effects to handles, flags buff items, tracks scalable equipment (re-adapts params on level-up), lookups for names/descriptions/rarities/buff strings/completion |
| `inventory.item-level-scaling` | `sc.ItemLevelScaling` | Item stat scaling by level: level table (base stat + HP every 5 levels), linear interpolation helpers to adapt params to a target level |
| `inventory.detectors` | `sc.DETECTOR_FILTERS.*` (FULL_CHEST, …) | Item detector system: watches toggled inventory items, periodically scans the map for matching entities (full chests, mine equipment), shows AR-box notifications when new targets are found |
| `inventory.plug-in` | — | Entry point + editor registration |

## At a glance

| Task | Primary surface | Contract |
|---|---|---|
| Query an item | `sc.Inventory` | Use the database id; return definitions, not UI copies |
| Add/remove stock | inventory model API | Stack rules, observers, quests, and saves must update |
| Use a consumable | `sc.ItemConsumption` | Effect, cooldown, animation, and item count stay synchronized |
| Scale equipment | `sc.ItemLevelScaling` | Preserve stat arrays and element factors |
| Scan a detector target | `sc.DETECTOR_FILTERS` | Current map entities must match the filter |

```ts
sc.Inventory.getItem?(itemId: string): ItemDefinition | null;
sc.Inventory.addItem?(itemId: string, amount: number): boolean;
sc.Inventory.removeItem?(itemId: string, amount: number): boolean;
```

## Guardrails

- Do not change item counts by editing `ig.vars` or a menu list; use the
  inventory model so quests, HUD, shops, and storage receive notifications.
- Do not assume all item types share equipment fields or consume effects.
- Keep ids stable and test stacking, equipment, trade, drops, detectors, and
  save/load after changes.
- Avoid repeated definition parsing; the inventory loader/cache is the source
  of item metadata.

## Behavior

- **`sc.Inventory`** is the player's item storage: bags, stacking,
  equipment slots, sorting and save/load, with the item definitions loaded
  from `assets/data/item-database.json`. Equipment stats re-adapt when the
  player levels via `sc.ItemLevelScaling`.
- **Consumption** of consumables is handled by
  `player.item-consumption` ([player](01-player.md)); item use/cooldown
  HUDs live in `gui.hud.item-timer-hud` ([gui](06-gui.md)).
- **Detectors** make toggled items (e.g. a \"full chest detector\" from a
  quest item) scan the current map for targets and notify via the AR box
  system (`game.feature.ar`).

## Hooks & steps

- Item events notify the combat engine (item drops), quests (COLLECT
  subtasks via `quest-model`'s inventory listener), menus (item list,
  equipment, shop cart) and the quick menu (item quick-slots,
  `game.feature.quick-menu`).

## Related

- [trade](11-trade.md) · [menu](05-menu.md) · [player](01-player.md)
- Engine: [impact.base.loader](../../engine/impact/01-core.md)
- Data: [ITEM DATABASE format](../../data/formats/10-item-database.md),
  [EFFECT format](../../data/formats/03-effect.md) (item effects)