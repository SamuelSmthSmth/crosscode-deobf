# LANG format (`assets/data/lang/sc/`)

> **Status**: core · Localization strings. Note: there is **one pack
> folder** (`sc/`) holding `<category>.<locale>.json` files (3 categories
> × 6 locales = 18 files) — *not* one folder per language. Most game text
> is **not** here: dialogue/messages are inline localized objects in map,
> character, enemy and item JSONs (same `{en_US, de_DE, …, langUid}`
> shape). DOCTYPE: `STATIC-LANG-FILE`. Loaded by `ig.LangLabel`
> ([01-core](../../engine/impact/01-core.md)).

## File anatomy

```json
{
  "DOCTYPE": "STATIC-LANG-FILE",
  "feature": "sc.gui",
  "labels": {
    "arena": {
      "arenaName": "Rhombus Arena",
      "score": "Score",
      "round": "Round [!]",
      "rushChain": "Rush Chain",
      "newTrophy": "\\c[3]New Trophy Unlocked!\\c[0]"
    },
    …
  }
}
```

(from `lang/sc/gui.en_US.json`)

## File layout

| Pattern | Files | Content |
|---|---|---|
| `gui.<locale>.json` | 6 | GUI/menu strings (`sc.gui` feature) |
| `map-content.<locale>.json` | 6 | Map-content strings (`sc.map-content` feature) |
| `gimmick.<locale>.json` | 6 | Cheat/gimmick strings (`sc.gimmick`, added by `game.feature.game-code`) |

Locales: `en_US`, `de_DE`, `ja_JP`, `ko_KR`, `zh_CN`, `zh_TW`
(no `fr_FR` — French strings appear as `"undefined"` in other files).

## Fields

| Field | Meaning |
|---|---|
| `DOCTYPE` | `STATIC-LANG-FILE` |
| `feature` | Feature namespace (`sc.<feature>`) — the label prefix |
| `labels` | Nested label tree; full key = `feature.<path>` (e.g. `sc.gui.arena.score`) |
| label value | String; supports `\\c[n]` color codes, `[!]` number/plural placeholders, `<<A<<[CHANGED …]` editor-change markers |

## Key resolution

- `ig.LangLabel` resolves `{langUid}`-style references and label paths at
  runtime; `sc.FontSystem` renders them with the in-game font
  ([font](../../engine/game/06-gui.md)-adjacent subsystem).
- The lang-edit feature (F7, `game.feature.beta.beta-controls`) hot-reloads
  these files in dev builds
  ([20-lang-edit](../../engine/impact/features/20-lang-edit.md)).

## Related

- Engine: [impact.feature.lang-edit](../../engine/impact/features/20-lang-edit.md),
  [impact.base.lang](../../engine/impact/01-core.md)
- Inline localized objects everywhere else: [CHARACTER format](04-character.md),
  [MAP format](05-map.md), [ENEMY format](01-enemy.md)