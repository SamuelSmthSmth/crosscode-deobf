# game.feature.player — the player

> **Status**: core · 14 modules in `deobf/clean/game.feature.player.*`.
> Covers `sc.PlayerModel` (state), `ig.ENTITY.Player` (the playable Lea
> entity), skins, crosshair, pets, leveling and item consumption. The hub of
> the game layer: combat input feeds [combat](02-combat.md), animations come
> from `game.feature.character` / `assets/data/characters`, camera from
> `impact.feature.camera` ([10-camera](../../engine/impact/features/10-camera.md)).

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `player.plug-in` | — | Entry point: requires entities, steps, model, modifiers, skins |
| `player.player-model` | `sc.PlayerModel` | Central player state: items, equipment, favorites, skill trees, elements, credits, EXP/leveling, element load/overload, save-data; `sc.PLAYER_MSG` observer codes; `item`/`equip`/`player`/`chapter` var paths |
| `player.player-config` | `sc.PLAYER_CLASSES`, `sc.PLAYER_ACTION`, `sc.PlayerConfig`, `sc.PlayerAction`, `sc.PlayerSubConfig`, `AIM_ACTIONS` | JSON-loaded character data: proxies, combat style, element configs, autoequip; per-element action/param-factor sets |
| `player.player-level` | `sc.LEVEL_CURVES`, `sc.PlayerLevelTools` | Leveling math: EXP multipliers by level difference (REGULAR / STATIC_REGULAR / QUEST), base params with growth curves, equip merging, autoequip |
| `player.player-level-notifier` | `sc.PlayerLevelNotifier` | Level-up cutscene: sound, slow-motion, level-up HUD with stat deltas, jump, LEVEL_UP common event |
| `player.player-skin` | `sc.PlayerSkinLibrary`, `sc.PLAYER_SKIN.*` | Cosmetic skins: item toggle-sets → appearance / step-effect / aura / pet skins, asset load/release via load collector |
| `player.modifiers` | `sc.MODIFIERS` | Stat-modifier registry: icon index + display options per modifier (data) |
| `player.item-consumption` | `sc.ItemConsumption` | Eat-item sequence: consumption action animation, effect activation (heal / stat-change buffs), eat sound |
| `player.player-steps` | EVENT/ACTION steps | Skill learning, element switching, camera focus (auto-undo via `sc.PlayerCameraFocusHandle`), item consumption, food icons, proxy balls, save var `player.model.value` |
| `player.crosshair-steps` | EVENT steps | Drive the aim crosshair during throw cutscenes: spawn/destroy, target position, speed, precision, throw-direction readout |
| `player.entities.player` | `ig.ENTITY.Player` | The playable Lea: movement, dash, guard, charge (combat arts), throw, melee combos, camera targets, skin/pet handling, per-frame input state machine (`gatherInput` → `handleDash`/`handleGuard`/`handleCharge`/…) |
| `player.entities.player-base` | `sc.PlayerBaseEntity` | Base for player + party members: walk anims, actor configs (normal/battle/aiming), guard shield (damage/regen/break), player actions, combat-mode sync |
| `player.entities.player-pet` | `sc.PlayerPetEntity`, `ig.ENTITY.Pet` | The following pet: follow/stay-behind, combat reposition, temp-hiding, push-away, danger-terrain respawn, idle specials |
| `player.entities.crosshair` | `ig.ENTITY.Crosshair`, `ig.ENTITY.CrosshairDot`, player/event controllers | Aiming reticle for throws: follows aim, precision/reduction range, ball trajectory preview dots (with bounces + ball adjusters), charged sound, direction readout |

## Behavior

- **`sc.PlayerModel` is the save-backed state**: items, equipment, favorites,
  skill trees, elements, credits and EXP all live here and persist through
  `ig.storage`. It is the object that menus, HUDs and combat read back from,
  and it exposes `ig.vars` accessors (`item.*`, `equip.*`, `player.*`,
  `chapter.*`) so event sheets can inspect/alter player state.
- **`ig.ENTITY.Player` runs a per-frame input state machine**: `gatherInput`
  collects the pressed actions (from `sc.Control`, see
  `game.feature.control`), then `handleDash`/`handleGuard`/`handleCharge`/
  `handleStateChange`/`handleStateStart` route them into movement
  (8-directional, dodge, jump), guarding, ball-charge (combat arts) and
  melee combos. Combat math is delegated to the combat engine
  ([02-combat.md](02-combat.md)); the entity owns presentation.
- **`sc.PlayerBaseEntity`** is shared with party members
  ([04-party.md](04-party.md)): walk animations, battle/aiming actor
  configs and the guard shield (damage, regen, break effects).
- **Skins** (`sc.PlayerSkinLibrary`) map enabled skin item toggle-sets to
  appearance/step-effect/aura/pet skins; each `sc.PLAYER_SKIN.*` type loads
  its own asset set through a load collector (see `impact.base.loader`) and
  releases it via `clearCached()`.
- **Crosshair**: throws aim through `ig.ENTITY.Crosshair`, which draws the
  trajectory preview (including bounces and `sc.BallChanger`-style
  adjusters) and grows a precision-reduction range when the aim is moved
  too fast.

## Hooks & steps

- **EVENT/ACTION_STEP registrations** (from `player-steps`, `crosshair-steps`):
  skill learning, element switching, camera targeting, item consumption,
  food icons, proxy balls, crosshair spawn/position/speed/precision/direction.
  See [07-events](../../engine/impact/07-events.md) for the registry
  mechanism and `game.feature.base.*` / combat pages for the rest of the
  game-layer step libraries.
- **Save integration**: `sc.PlayerModel` registers with `ig.storage`
  (storage feature, [11-storage](../../engine/impact/features/11-storage.md));
  level-up and quest hooks notify observers via `sc.Model` messages
  (`sc.PLAYER_MSG.*`).

## Related

- [combat](02-combat.md) · [party](04-party.md) · [menu](05-menu.md)
- Engine: [impact.feature.camera](../../engine/impact/features/10-camera.md),
  [impact.feature.gui](../../engine/impact/features/01-gui.md),
  [11-storage](../../engine/impact/features/11-storage.md)
- Data: [CHARACTER format](../../data/formats/04-character.md),
  [ANIMATION format](../../data/formats/02-animation.md),
  [ITEM DATABASE format](../../data/formats/10-item-database.md)