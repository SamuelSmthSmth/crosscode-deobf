# Media — audio guide

> **Status**: core · How CrossCode's audio is organized, loaded and
> switched: BGM (238 MB / 118 tracks) and SFX (122 MB / 1,174 files).
> Engine: `impact.base.sound` + `impact.feature.bgm`
> ([12-bgm](../engine/impact/features/12-bgm.md)); game-layer playlist
> manager: `game.feature.bgm.playlist`; volume overrides:
> `game.feature.bgm.volume-map`.

## At a glance

| Need | Source / API | Check |
|---|---|---|
| Add music | `assets/media/bgm/` + playlist entry | Match loop/intro names and `attributes.bgm` key |
| Add SFX | `assets/media/sound/<category>/` | Reference an existing asset path from data/effect code |
| Add voice | `sound/va/` + voice-acting flow | Keep clip id, dialogue, and locale behavior aligned |
| Change volume | volume map / `ig.soundManager` buses | Preserve master/music/sound routing |

## Guardrails

- Do not rename or move a referenced media file without updating every data
  and playlist reference; paths are runtime ids.
- Do not put one-shot SFX on the BGM track stack or bypass the master volume.
- Do not assume `.ogg` and `.mp3` are interchangeable in every loader path;
  verify the playlist entry and runtime fallback.
- Keep large image/audio work out of per-frame allocation paths; preload or
  cache through the engine loader where possible.

## BGM (`assets/media/bgm/`)

- **Naming**: `mu<Name>.ogg` = the looping track; `mu<Name>-i.ogg` =
  the *intro* segment that plays once before the loop (crossfade at
  `introEnd`). A track with both is defined as
  `{ path, loopEnd, volume, introPath, introEnd }`.
- **The playlist** (`sc.BgmPlaylist` → `ig.BGM_TRACK_LIST`) maps named
  keys — `silence`, `tutorial`, `intro`, `short`, `rookieHarbor`,
  `bergen`, `boss`… — to track definitions. **Map `attributes.bgm`**
  selects the key for a map ([MAP format](../data/formats/05-map.md));
  the BGM addon ([12-bgm](../engine/impact/features/12-bgm.md)) plays,
  pauses, resumes, pushes/pops tracks and switches on area changes
  (`ig.BGM_SWITCH_MODE`).
- **Switch-songs**: element-mode tracks that swap in during combat
  (e.g. the battle variant of an area theme), driven by the combat
  engine ([combat](../engine/game/02-combat.md)).
- **Multi-audio**: the DLC (`evo-lab/`) and multi-layer mixes use
  simultaneous `ig.BgmTrackSet`s (separate intro/loop/end layers).
- Jingles (`ability-got.ogg`, `lolfanfare.ogg`, `disco-*.ogg`) are
  one-shot tracks triggered by events/HUD.

## SFX (`assets/media/sound/`)

- 15 themed folders (arena, background, battle, boss, designer, drops,
  environment, hud, menu, misc, move, puzzle, scenes, upgrade, va) —
  see [folder guide](folder-guide.md).
- **Referenced by path** in data: effect files play sounds via
  `PLAY_SOUND` entries (`"sound": "media/sound/battle/ball-bounce-1.ogg"`,
  [EFFECT format](../data/formats/03-effect.md)); characters/entities
  reference footsteps/voice via `soundType`/`voice` fields.
- **Volume map**: `ig.GlobalVolume` overrides per-path volumes
  (`game.feature.bgm.volume-map`) — e.g. `menu-cancel.ogg` → 0.8,
  `jump.ogg` → 0.7.
- **Voice acting**: `sound/va/` clips are played by
  `game.feature.voice-acting` (`sc.VoiceActing`), driven by dialogue
  through `sc.MessageModel` ([msg](../engine/game/07-msg.md)).

## Formats & loading

- All audio is OGG (`ig.Sound` decodes via the Web Audio engine,
  `impact.base.system.web-audio` — [05-audio](../engine/impact/05-audio.md));
  some tracks are `.mp3` in the playlist (OGG takes precedence at boot).
- `ig.bgm` tracks loop seamlessly by scheduling the loop segment from
  `loopEnd`; `ig.sound` pools SFX for polyphony (see
  [05-audio](../engine/impact/05-audio.md)).

## Related

- [README.md](README.md) · [folder guide](folder-guide.md)
- Engine: [impact.feature.bgm](../engine/impact/features/12-bgm.md),
  [05-audio](../engine/impact/05-audio.md)
- Data: [MAP format](../data/formats/05-map.md) (`attributes.bgm`),
  [EFFECT format](../data/formats/03-effect.md) (`PLAY_SOUND`)