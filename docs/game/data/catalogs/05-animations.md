# Catalog — animations

> **Status**: core · 266 animation definitions in `assets/data/animations/`
> (16 top-level + subfolders). DOCTYPE: `MULTI_DIR_ANIMATION` (245),
> `MULTI_ENTITY_ANIMATION` (20, boss sheets), `SIMPLE_ANIMATION` (1).
> Schema: [ANIMATION format](../formats/02-animation.md). Consumed by
> `ig.AnimationSheet` + `sc.Character`.

## Subfolders (counts)

| Folder | Files | Notes |
|---|---|---|
| `enemies/` | 177 | Per-enemy animation sheets (all enemies + bosses) |
| `npc/` | 34 | NPC walk/idle sheets (per area/character) |
| `pets/` | 22 | Pet animations (player-skin pets) |
| `boss/` | 21 | Boss animation sheets (`MULTI_ENTITY_ANIMATION` — multi-part bosses) |
| `player-skins/` | 1 | Player skin animations |

## Top-level files (16)

Player + main-cast sheets referenced by `characters/main/*` and
`players/*`: `lea.json` (player, 8-dir walk + combat anims), plus the
party members (apollo, buggy, emilie, glasses, grumpy, luke, schneider,
sergey, shizuka…) and any generic sheets (see the [ANIMATION format](../formats/02-animation.md)
for the `MULTI_DIR_ANIMATION` structure — one `ANIM` table with
8-direction variants per action).

> Each animation file maps action names (walk, run, attack, dash…) to
> per-direction frame lists; characters reference them via their
> `walkAnimSet`/`walkAnims` fields
> ([CHARACTER format](../formats/04-character.md)).