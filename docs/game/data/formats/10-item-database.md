# ITEM DATABASE format (`assets/data/item-database.json`)

> **Status**: core · Single boot file with **all 676 item definitions**.
> Loaded by `sc.Inventory` ([inventory](../../engine/game/10-inventory.md))
> and used by equipment, consumables, trade, shops, quest rewards and
> drops. Item ids are string keys; items are referenced by id everywhere
> (drops in [ENEMY format](01-enemy.md), trade offers, quest rewards).

## File anatomy

```json
{
  "items": [
    { "name": { "en_US": "Sandwich", "de_DE": "Sandwich", "langUid": 3 },
      "description": { "en_US": "A simple lunch for travels. \\c[2]Heals 15% of max HP\\c[0].", … },
      "type": "CONS", "icon": "item-sandwich", "order": 5, "level": 1,
      "effect": { "sheet": "consume", "name": "sandwich" }, "rarity": 0,
      "cost": 50, "sources": [ { "type": "SHOP", "trader": "…", "cost": 50 } ] },
    { "name": …, "type": "EQUIP", "cost": 1000, "level": 1, "icon": "item-sword",
      "equipType": "ARM",
      "params": { "elemFactor": [1.5, 1.1, 1.3, 1.9], "hp": 59, "attack": 12, "defense": 27, "focus": 33 },
      "properties": { "XP_PLUS": 1.1, "AIM_SPEED": 1.4 }, "rarity": 0, "order": 95,
      "effect": { "sheet": "", "name": null }, "noTrack": true }
  ]
}
```

## Type counts (676 items)

| `type` | Count | Meaning |
|---|---|---|
| `EQUIP` | 274 | Weapons/armor — see equipment fields |
| `TRADE` | 196 | Trade-in materials (trader offers) |
| `KEY` | 102 | Quest/dungeon keys (e.g. key panels) |
| `TOGGLE` | 38 | Toggle items (skin items, detectors) |
| `CONS` | 66 | Consumables (heal/status items) |

## Fields

| Field | Meaning |
|---|---|
| `name` / `description` | Localized objects (7 locales + `langUid`); text supports `\\c[n]` color codes |
| `type` | Item category (table above) |
| `icon` | Icon key (`item-*` → `ig.GuiImage`/font icon) |
| `order` | Sort order in the item list |
| `level` | Required/display level |
| `rarity` | 0–3 rarity tier |
| `cost` | Base sell price (credits) |
| `effect` | Consume/use effect `{sheet, name}` → [EFFECT format](03-effect.md) |
| `noTrack` | Exclude from item-completion stats |
| `sources` | Where the item comes from (`{type: CHEST/SHOP/TRADE/DROP…}` entries) |

### Equipment-only fields

| Field | Meaning |
|---|---|
| `equipType` | Slot: ARM, BODY, HEAD, OFF_HAND, SHOES, ACCESSORY… |
| `params` | Stat contribution: `{hp, attack, defense, focus, elemFactor[5]}` (per element) |
| `properties` | Special modifiers, e.g. `XP_PLUS`, `AIM_SPEED`, `JUMP`… (→ `sc.STAT_CHANGE_SETTINGS`, [combat](../../engine/game/02-combat.md)) |

## Engine consumption

- `sc.Inventory` loads/parses the file, converts `effect` entries to
  effect handles, flags buff items and tracks scalable equipment
  ([inventory](../../engine/game/10-inventory.md)).
- `sc.ItemLevelScaling` re-adapts equipment `params` when the player
  levels ([10-inventory](../../engine/game/10-inventory.md)).
- Drops reference items by id (`itemDrops` in [ENEMY format](01-enemy.md),
  `sc.ItemDropEntity`), shops/traders reference `cost` + stock, quest
  rewards grant item ids.

## Related

- Trade: [trade](../../engine/game/11-trade.md)
- Skills: [SKILLTREE format](11-skilltree.md)
- Effects: [EFFECT format](03-effect.md)