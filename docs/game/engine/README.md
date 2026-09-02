# Engine — index & layering

> Source: `deobf/clean/` (569 modules, 154 `impact.*` + 415 `game.*`),
> verified per `deobf/PROGRESS.md` (token-LCS ≥ 0.929 vs `deobf/extract/`).

## The layer cake

```
┌───────────────────────────────────────────────────────────────┐
│ game.main / game.loader / game.config / game.constants        │  5 modules
├───────────────────────────────────────────────────────────────┤
│ game.feature.*  →  sc.* game systems (415 modules)            │  player, combat,
│   menu, gui, msg, npc, party, quest, skills, inventory,       │  puzzles, arenas,
│   trade, arena, achievements, timers, control, interact, …    │  dialogues, HUD
├───────────────────────────────────────────────────────────────┤
│ impact.feature.*  →  ig.* subsystems (120 modules)            │  gui, effects, light,
│   camera, weather, storage, bgm, navigation, terrain,         │  weather, map-content,
│   parallax, screen-blur, slow-motion, overlay, rumble, …      │  event/steps libraries
├───────────────────────────────────────────────────────────────┤
│ impact.base.*  →  ig.* core (34 modules)                      │  System/Game loop,
│   entities, physics, rendering, maps, input, audio, loader,   │  events runtime,
│   timer, vars, font, steps/actions                            │  animation, sprites
└───────────────────────────────────────────────────────────────┘
```

## Page index

### impact.base.* — core engine (8 pages)

| Page | Modules covered |
|---|---|
| [01-core.md](impact/01-core.md) | system, game, loader, timer, utils, vars, dom, extension, steps, action, impact, game-state, lang |
| [02-entities.md](impact/02-entities.md) | entity, actor-entity, coll-entry, physics, entity-pool |
| [03-rendering.md](impact/03-rendering.md) | image, worker, sprite, sprite-fx, renderer, animation, font |
| [04-maps.md](impact/04-maps.md) | map, background-map, collision-map, tile-info |
| [05-audio.md](impact/05-audio.md) | system.web-audio, sound |
| [06-input.md](impact/06-input.md) | input |
| [07-events.md](impact/07-events.md) | event, steps, action (runtime + registries) |
| [08-global-settings.md](impact/08-global-settings.md) | global-settings |

### impact.feature.* — engine subsystems (30 pages + index)

[features/README.md](impact/features/README.md) — table of all 30 groups with
one-line purpose, then one page per group.

### game.* — the game layer (18 pages)

[game/README.md](game/README.md) — the 415-module layer: models, player,
combat, puzzles, all 22 menu sections, HUD/widgets, messaging, NPCs, party,
quests, skills, inventory, trade, arenas, achievements and ~20 smaller
features. All 18 group pages are `core`.

## Reading notes

- **Class names are authoritative**: every module table lists what a module
  defines (`ig.*` / `sc.*`), matching the cleaned source exactly.
- **Step registries**: `ig.EVENT_STEP.<TYPE>` and `ig.ACTION_STEP.<TYPE>`
  classes are defined across several modules; each page lists the steps its
  modules register. The complete registries live in
  [07-events.md](impact/07-events.md) (base) and
  [features/30-base.md](impact/features/30-base.md) (engine feature layer)
  and `game.feature.base.*` / combat pages (game layer).
- **Verification story**: every cleaned module passes `node --check` and is
  LCS-verified against `deobf/extract/`; see `deobf/PROGRESS.md`.
- **Cross-layer links**: camera engine (features/10-camera.md) is consumed by
  `game.feature.player` — the game-layer page links back.