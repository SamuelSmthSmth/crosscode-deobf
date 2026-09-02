# impact.feature.storage — save/load storage

> **Status**: core · Modules: `impact.feature.storage.storage`,
> `impact.feature.storage.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `storage.storage` | `ig.Storage` (`ig.storage`, GameAddon), `ig.SaveSlot`, `ig.StorageData`, `ig.StorageTools` | Save slots, serialization (vars, models, options), load/delete/copy, quick-save |
| `storage.plug-in` | — | Entry point + boot registration |

## Behavior

- `ig.SaveSlot` = one savegame; `ig.StorageData` = the payload bundle
  (game vars, player models, quests, options, achievements — everything the
  onStorageSave hooks write, incl. `ig.bgm` BGM persistence).
- `ig.storage` owns slot management: autosave, quicksave, slot listing for
  the save menu (`game.feature.menu.gui.save.*`), and the
  title-screen "Continue" flow.
- Serialization is JSON; `ig.StorageTools` handles diffing/validation
  (backwards-compatible saves across patches).
- `onStorageSave/onStorageLoad` hooks on addons/models let subsystems
  register their state — this is how `sc.PlayerModel`, `sc.QuestModel`,
  `ig.vars`, `ig.bgm` persist.

## Touchpoints

- Save menu GUI: `game.feature.menu.gui.save.save-*` (game layer, stub).
- NG+ carry-over (`sc.NewGamePlusModel`) reads saves via storage.
- Save presets (dev checkpoints): `assets/data/save-presets/*.json`
  (`sc.SavePreset`).