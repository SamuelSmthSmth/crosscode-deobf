# game.feature.trade — trading

> **Status**: core · 7 modules in `deobf/clean/game.feature.trade.*`
> (3 core + 4 GUI). Covers `sc.TradeModel` (trader offers, trade-in logic)
> and the trade menu/dialog GUI. Item data comes from
> `assets/data/item-database.json`.

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `trade.trade-model` | `sc.TradeModel`, `sc.TRADE_COMPARE_MODE` (EQUIP/OFF_HAND) | Trade system model: loads trader definitions, tracks discovered traders (parent-unlock chains), save/load, runs exchanges (removes required items/credits, grants trade items), equip comparison, trade menu state |
| `trade.trade-steps` | EVENT_STEP: `RESET_TRADER`, `OPEN_NPC_TRADE`… | Reset trader stock; start an NPC trade menu with optional traded/canceled branches |
| `trade.gui.trade-menu` | `sc.TradeMenu` | Trade screen container: offer list + stats panel + dialog, money topbar |
| `trade.gui.trade-dialog` | `sc.TradeItem`, `sc.TradeItemBox`, `sc.TradeMoneyGui`, `sc.TradeDialogMenu`, `sc.TradeOfferDisplay` | The in-menu trade dialog: offer display, money, item boxes |
| `trade.gui.trade-icon` | `sc.TradeIconGui` | Hover offer icon with required-item checks |
| `trade.gui.equip-toggle-stats` | `sc.TradeToggleStats` | Equip-compare stat box (base/element/modifier rows) |
| `trade.plug-in` | — | Entry point + trade editor panel |

## At a glance

| Task | Primary surface | Contract |
|---|---|---|
| Inspect an offer | `sc.TradeModel` | Required item/credit checks are authoritative |
| Complete a trade | model exchange API | Remove requirements and grant output atomically |
| Open an NPC trade | `OPEN_NPC_TRADE` | Event branch handles traded/cancelled outcomes |
| Compare equipment | `sc.TradeToggleStats` | Compare against current player equipment |

```ts
sc.TradeModel.canTrade?(offerId: string): boolean;
sc.TradeModel.completeTrade?(offerId: string): boolean;
```

## Guardrails

- Do not grant the output before removing requirements; failed exchanges can
  duplicate items or credits.
- Do not treat the trade GUI’s enabled state as a validation authority; ask the
  trade model at completion time.
- Preserve trader discovery/unlock chains and stable offer ids in saves.
- Test insufficient stock, cancellation, equipment output, and reload.

## Behavior

- **`sc.TradeModel`** loads the trader definitions, tracks which traders
  the player has discovered (unlocking chains: some traders appear after
  their parent is found) and runs the exchange: required items + credits
  are removed, trade items granted. The menu state (open trader, selection)
  is part of the model and persists via `ig.storage`.
- **Trader menu flow**: `sc.TradeMenu` (container) + `sc.TradeDialogMenu`
  (dialog with money display) + `sc.TradeIconGui` (hover offers with
  required-item checks) + `sc.TradeToggleStats` (equip comparison).
- The trader index menu (`menu.gui.trade.*`, [menu](05-menu.md)) lists
  all traders per area with their get/require offers.

## Hooks & steps

- EVENT_STEP registrations in `trade-steps` (`RESET_TRADER`, trade-menu
  open with branch steps for traded/cancelled outcomes).
- NPC interaction entry point: `ig.ENTITY.NPC` opens the trade menu
  ([npc](03-npc.md)); offers reference items from
  `assets/data/item-database.json`.

## Related

- [inventory](10-inventory.md) · [menu](05-menu.md) · [npc](03-npc.md)
- Engine: [impact.feature.database](../../engine/impact/features/23-database.md)
- Data: [ITEM DATABASE format](../../data/formats/10-item-database.md)