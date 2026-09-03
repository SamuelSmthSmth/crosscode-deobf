# EFFECT format (`assets/data/effects/**/*.json`)

> **Status**: core · 600+ files, one per effect; DOCTYPE: `EFFECT`.
> Effects are the data-driven FX used by combat, items and the
> environment. Played by `sc.EffectEntity` via the `impact.feature.effect`
> engine ([02-effect](../../engine/impact/features/02-effect.md)).

## At a glance

| Need | Entry type | Required reference |
|---|---|---|
| Play an animation | `PLAY_ANIM` | `anim` exists in `ANIMS` |
| Add a glow/flash | `LIGHT` | Size and fade values are appropriate for the effect scale |
| Play audio | `PLAY_SOUND` | `sound` path exists under `assets/media/` |
| Compose a burst | `SPAWN` / `PARTICLE` | Child effect/particle definition is loadable |

```ts
type EffectEntry =
  | { type: "PLAY_ANIM"; anim: string; useTargetAngle?: boolean }
  | { type: "LIGHT"; size: string; fadeIn?: number; fadeOut?: number }
  | { type: "PLAY_SOUND"; sound: string; volume?: number; loop?: boolean };
type EffectDefinition = { ANIMS: Record<string, unknown>; EFFECTS: Record<string, EffectEntry[]> };
```

## Guardrails

- Do not reference an animation name that is absent from the same sheet’s
  `ANIMS` block.
- Do not assume an effect entry is a combat hitbox; visual effect entries and
  combat force data are consumed by different systems.
- Keep sound paths rooted at `assets/` and verify volume/loop behavior in both
  a quiet map and dense combat.
- Avoid per-frame allocations in custom effect extensions; use the engine’s
  particle/entity pools and cached sheets.

## File anatomy

```json
{
  "DOCTYPE": "EFFECT",
  "ANIMS": { "SUB": [ { "name": "BOUNCE", "sheet": {"src": "media/entity/effects/ball.png", "width": 16, "height": 16}, "time": 0.05, "repeat": false, "pivot": {"x": 8, "y": 0}, "frames": [0, 1, 2, 3, 4] } ] },
  "EFFECTS": {
    "ballBounce": [
      { "useTargetAngle": false, "type": "PLAY_ANIM", "anim": "BOUNCE" },
      { "size": "L", "fadeIn": 0, "fadeOut": 0.35, "duration": 0, "glow": false, "type": "LIGHT" },
      { "volume": 0.75, "global": false, "loop": false, "type": "PLAY_SOUND", "sound": "media/sound/battle/ball-bounce-1.ogg" }
    ]
  }
}
```

(from `effects/ball.json`)

## Fields

### `ANIMS` — animation sub-sheets

A per-effect pool of named animations, one entry per `name`:

| Field | Meaning |
|---|---|
| `name` | Referenced by `PLAY_ANIM` entries (`anim` field) |
| `sheet.src` | Sprite sheet path (relative to `assets/`) |
| `sheet.width/height` | Single frame size in pixels |
| `sheet.offX/offY` | Sheet offset to the first frame |
| `time` | Seconds per frame |
| `repeat` | Loop or play once |
| `pivot` | Pivot point (rotation/scaling center) |
| `frames` | Frame indices into the sheet |
| `renderMode` | Optional composite mode (`"lighter"` = additive) |

### `EFFECTS.<name>` — the effect definition

`EFFECTS` maps an effect name to an ordered **list of FX entries** (a
composite effect). Each entry has a `type` — the `EFFECT_ENTRY.*` family
played in sequence/parallel by the effect system:

| `type` | Fields | Meaning |
|---|---|---|
| `PLAY_ANIM` | `anim`, `useTargetAngle`, `keepAngleSync`, `pAlpha` (alpha curve: `init` + `start.value`) | Play a named `ANIMS` animation (optionally oriented at the target) |
| `LIGHT` | `size` (S/M/L), `fadeIn`, `fadeOut`, `duration`, `glow` | Additive light flash (`EFFECT_ENTRY.LIGHT`) |
| `PLAY_SOUND` | `volume`, `global`, `loop`, `sound` (ogg path) | Play a sound |
| `RUMBLE` / `CLEAR_RUMBLE` | strength, duration | Controller/gamepad rumble + release |
| `SPAWN` | — | Spawn a sub-entity / particle burst |
| `PARTICLE` | — | Particle emission (used by `sc.EffectParticle`) |

Plus combat-relevant fields that can appear at the effect level:
`damageFactor`, `hitStun`, `hitType`, `hurtbox`/`hitbox` setup — the
fields `sc.CombatParams.getDamage` and the combat hit pipeline read when
an effect is a *hit effect* (see [combat](../../engine/game/02-combat.md)).
Folder layout: `effects/area/`, `combat/`, `enemies/`, `map/`, `puzzle/`,
`scene/`, `skin-aura/`, `skin-step/`, `skins/`, `specials/` + top-level
per-entity files (`ball.json`, `charge.json`, `drops.json`…).

## Engine consumption

- `sc.EffectEntity` (game layer) instantiates an effect from its JSON and
  plays the `ANIMS` + `EFFECTS` script; `ig.EFFECT` in
  `impact.feature.effect` runs the per-entry FX.
- Element interplay: effects carry the element of the hit; weakness /
  absorption and the combo (elemental burst) system read `baseElement`
  on the effect.
- Item effects (`assets/data/item-database.json` items' `effect` field)
  reference effect sheets the same way.

## Related

- Engine: [impact.feature.effect](../../engine/impact/features/02-effect.md),
  [combat](../../engine/game/02-combat.md)
- Animations: [ANIMATION format](02-animation.md) (effect sprites)