# Glossary — ImpactJS & CrossCode terms

> Terms used throughout this library. Sources: `deobf/clean/` module headers,
> `deobf/PROGRESS.md`, the RESEARCH docs.

| Term | Meaning |
|---|---|
| **ImpactJS / `ig.*`** | The engine namespace, a heavily extended ImpactJS 1.x clone: `ig.module().requires().defines()`, `ig.Class.extend`, `ig.System`, `ig.Game`… |
| **`sc.*`** | "StarCross" — the game-layer namespace (415 modules under `game.feature.*`). All the actual CrossCode systems live here |
| **Module** | One `ig.module("name").requires(...).defines(...)` block. 569 total in this game |
| **addon / GameAddon** | `ig.GameAddon`: the engine's plugin hook. Hooks: `preUpdate`, `postUpdate`, `preDrawOrder`, `midDrawOrder`, `postDrawOrder` — ordering by number for draw phases |
| **Entity** | `ig.Entity`: anything placed in a map-level that updates/draws (player, enemies, NPCs, switches, props…) |
| **z-level / z-height** | The pseudo-3D vertical axis. Maps render 5 z-levels (`levels: [{height:-48}…{height:192}]`); entities have `coll.pos.z`. This is the "2.5D" axis |
| **coll / collision map** | `ig.CollisionMap`: the solid tile layer per map (A/D/S tile types, see `impact.base.collision-map.js`) |
| **wallY** | Per-sprite/per-tile line separating "wall part" from "ground part" when drawing a cube; used by `ig.CubeSprite` and map tiles |
| **masterLevel** | Map field: which z-level index the player normally stands on |
| **solids** | Non-passable tiles in a collision layer (vs `A` = all-blocking, `D` = one-way-drop, `S` = jump-through) |
| **`ig.game.screen`** | `{x,y}` world-space origin of the viewport (camera output) |
| **`ig.game.soundPos`** | Map-space listening center used by positional audio |
| **zoomFocus** | Point the camera zoom scales around (`ig.system.zoomFocus/zoom`) |
| **`ig.vars`** | Global game-state dictionary (quest flags, toggles); save/load persisting. `tmp.*` are transient vars |
| **Event / EventCall** | Scripted cutscene/data event: a list of `EVENT_STEP` objects with `type`, `input` (schema!), `steps`. Stored per trigger entity or in `assets/data/events/` |
| **EVENT_STEP / ACTION_STEP** | The two step registries: `ig.EVENT_STEP.<TYPE>` (42 classes) and `ig.ACTION_STEP.<TYPE>` (97 engine + 114 game). Every step object in event JSON maps to one class |
| **DOCTYPE** | `"DOCTYPE": "ENEMY"`-style discriminator at the top of data JSON files — tells the loader which parser/subsystem owns the file (see [data/README.md](data/README.md)) |
| **JSON template** | `ig.JsonTemplate`/`ig.Cacheable`: loaders that parse, validate and cache such JSON (e.g. `sc.Character` template) |
| **LCS** | Longest-common-subsequence token diff used to verify cleaned modules ≥ 0.929 vs the minified extract |
| **Weltmeister** | ImpactJS's map editor, extended by CrossCode (`wm.` namespace, `_wm`, `_info`, `_type` schema annotations) |
| **`_wm` / `_type` / `_info`** | Editor annotations inside data JSON: an attribute's type and tooltip, used by the in-game editor |
| **PAK** | Packed binary archive (GOG/Chromium). Not used for game data in this repo besides `resources.pak` (runtime) |
| **rAF / frame-skip** | The game ticks at setInterval-style step; mods like fps-unlock swap it for rAF |
| **BGM / SFX / VO** | Background music / sound effects / voice acting — `assets/media/bgm`, `.../sound`, voice files in `sound/voice*` |
| **SP / HP / EXP / Credits** | The four primary currencies of the player state (plus `item.*`, `stat.*` var namespaces seen in enemy drop conditions) |
| **NG+** | New Game Plus (`sc.NewGamePlusModel`) |
| **`ig.baked = !0`** | Trailing flag some modules keep from the original minified code — harmless, marks fully-defines modules |

## CrossCode-specific shortcuts

| Term | Meaning |
|---|---|
| **Element** | HEAT / COLD / SHOCK / WAVE (+ NEUTRAL) — the four combat elements; `elemFactor`, `elementModes` in enemy JSON, each skilltree column |
| **Combat arts** | Player skills mapped to buttons (melee arts, ranged arts, dash arts) |
| **Ball** | The thrown combat orb (`sc.Ball`, `game.constants` ball physics) — the signature CrossCode combat mechanic |
| **Focus / Crosshair** | Aiming mode (`sc.Crosshair`) where the ball is directed at the screen cursor |
| **Circle attack** | Enemy AoE: `CIRCLE_ATTACK` action step with radius/expand params |
| **Break** | "Break" status — `stunChange: "FORCE_STUN"` style reactions (`BREAK` dramatic effect) |
| **Sneak/Schneider…** | NPC names — see character catalogs (pending) |
| **Rhombus** | The hub region *(also the name of travel-pad puzzles and the rhombus map menu)* |
| **Landmark** | Findable map points that unlock the fast-travel/landmark HUD |
| **Expo/Arena** | The combat arena challenges (`sc.Arena`); the **Void** is the arena's backdrop ("The Void" BGM mode) |