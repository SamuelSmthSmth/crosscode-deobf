# impact.feature.* — engine subsystems (30 groups, 120 modules)

> **Status**: core · Source: `deobf/clean/impact.feature.*` (all verified in
> `deobf/PROGRESS.md`). Each group is a self-contained subsystem with its own
> plug-in module that registers everything (entities, steps, addons) on boot.

## Group index

| # | Group | Modules | One-liner | Page |
|---|---|---|---|---|
| 1 | `gui` | 6 | The full GUI tree: `ig.Gui` element hierarchy + step pool | [01-gui.md](01-gui.md) |
| 2 | `effect` | 15 | Data-driven particle/FX system: `ig.EFFECT` files → Effect entities | [02-effect.md](02-effect.md) |
| 3 | `env-particles` | 3 | Ambient particles (leaves, dust, snow…) per map | [03-env-particles.md](03-env-particles.md) |
| 4 | `event-sheet` | 3 | Multi-trigger event sheets | [04-event-sheet.md](04-event-sheet.md) |
| 5 | `gamepad` | 4 | Gamepad manager + HTML5 / NWF handlers | [05-gamepad.md](05-gamepad.md) |
| 6 | `greenworks` | 2 | Steam integration (achievements, cloud) | [06-greenworks.md](06-greenworks.md) |
| 7 | `height-map` | 3 | Editor height/chipset data layer | [07-height-map.md](07-height-map.md) |
| 8 | `light` | 5 | The light map: darkness, screen flashes, conditional lights | [08-light.md](08-light.md) |
| 9 | `weather` | 6 | Weather instances: rain, fog, clouds, sun | [09-weather.md](09-weather.md) |
| 10 | `camera` | 3 | Camera targets/stack/zoom — the viewport authority | [10-camera.md](10-camera.md) |
| 11 | `storage` | 2 | Saves: slots, storage data (vars, options, achievements) | [11-storage.md](11-storage.md) |
| 12 | `bgm` | 3 | BGM addon: track sets, fade modes, persistence | [12-bgm.md](12-bgm.md) |
| 13 | `interact` | 5 | Interaction manager: prompts, buttons, focus GUI | [13-interact.md](13-interact.md) |
| 14 | `parallax` | 3 | Animated parallax layers | [14-parallax.md](14-parallax.md) |
| 15 | `terrain` | 2 | Pattern auto-tiling engine | [15-terrain.md](15-terrain.md) |
| 16 | `navigation` | 4 | A* pathfinding: nav graphs, dodge/sideways movement | [16-navigation.md](16-navigation.md) |
| 17 | `map-content` | 11 | Maps' physical content: doors, props, teleporters, hidden blocks | [17-map-content.md](17-map-content.md) |
| 18 | `dream-fx` | 3 | Dream-sequence full-screen effects | [18-dream-fx.md](18-dream-fx.md) |
| 19 | `influencer` | 3 | Zone influences (area effects on entities) | [19-influencer.md](19-influencer.md) |
| 20 | `lang-edit` | 2 | In-game language editor (F7) | [20-lang-edit.md](20-lang-edit.md) |
| 21 | `map-image` | 3 | Global map image manager (world map rendering) | [21-map-image.md](21-map-image.md) |
| 22 | `nwf` | 2 | NWF (non-web framework) helpers/errors | [22-nwf.md](22-nwf.md) |
| 23 | `database` | 2 | Boot-time game database loader (`assets/data/database.json`) | [23-database.md](23-database.md) |
| 24 | `video` | 3 | Video playback GUI | [24-video.md](24-video.md) |
| 25 | `slow-motion` | 3 | Slow-mo world time via timer scaling | [25-slow-motion.md](25-slow-motion.md) |
| 26 | `overlay` | 3 | Blocking modal overlays | [26-overlay.md](26-overlay.md) |
| 27 | `rumble` | 3 | Controller/gamepad rumble | [27-rumble.md](27-rumble.md) |
| 28 | `screen-blur` | 3 | Post-effect blur (tilt-shift, zoom blur) | [28-screen-blur.md](28-screen-blur.md) |
| 29 | `map-sounds` | 3 | Per-map ambient sound loops | [29-map-sounds.md](29-map-sounds.md) |
| 30 | `base` | 7 | Shared entities + **the 97 action & 42 event engine steps** | [30-base.md](30-base.md) |

## Cross-layer wiring

- **GUI** (1) is the base of *all* game HUD/menus (`game.feature.gui.*`).
- **Effect** (2) powers combat FX, item use FX, environment FX —
  `assets/data/effects/*`.
- **Camera** (10) is driven by `game.feature.player` and cutscene events.
- **Light** (8) + **Weather** (9) + **Screen-blur** (28) compose the
  mid-draw/post-draw visual stack (mods insert at the same hooks).
- **Navigation** (16) serves enemy/party movement; **BGM** (12) serves
  per-area music; **Map-sounds** (29) serves ambience.