# Catalog — lang

> **Status**: core · 18 files in `assets/data/lang/sc/` — 3 categories × 6
> locales. DOCTYPE: `STATIC-LANG-FILE`.
> Schema: [LANG format](../formats/12-lang.md).

| Category | Locale files | Content |
|---|---|---|
| `gui` | `gui.en_US.json`, `gui.de_DE.json`, `gui.ja_JP.json`, `gui.kr_KR.json`, `gui.zh_CN.json`, `gui.zh_TW.json` | GUI/menu strings (`sc.gui`) |
| `map-content` | `map-content.<locale>.json` ×6 | Map-content strings (`sc.map-content`) |
| `gimmick` | `gimmick.<locale>.json` ×6 | Cheat/gimmick strings (`sc.gimmick`) |

Locales: `en_US` (default), `de_DE`, `ja_JP`, `ko_KR`, `zh_CN`, `zh_TW`
(no `fr_FR`).

> Most game text is *not* in this folder: dialogue and item/enemy text
> ships as inline localized objects (`{en_US, de_DE, …, langUid}`) inside
> map, character, enemy, item and arena JSONs. See
> [LANG format](../formats/12-lang.md) for the full picture.