# DOC 1 — Architecture interne : rendu & audio (référence deobf)

> Source : `deobf/clean/` (569 modules, 100 % nettoyés, LCS ≥ 0.929 vs extract).
> Complète `RENDERING-RESEARCH.md` (résolution/FPS) et `deobf/RENDERING-2.5D-NOTES.md`
> (2.5D, lumière, parallaxe). Ce doc couvre **le rendu ET l'audio** du point de
> vue des 5 features de `Visuals_to_check.md`.

---

## 1. Vérité fondamentale : Canvas2D uniquement

CrossCode = ImpactJS (`ig.*`) + couche CrossCode (`sc.*`), tournant dans nw.js
(Chromium). **Un seul `<canvas>` 2D, aucun WebGL, aucun shader.**

Conséquence pour `Visuals_to_check.md` : tous les items parlent de « fragment
shader », « normal map », « kernel Gaussian dans le fragment shader ». **Il n'y
a aucun shader.** Tout doit être réimplémenté en opérations Canvas2D :
`globalCompositeOperation`, `globalAlpha`, `drawImage` par bandes, `ctx.filter`
(filtres SVG CSS, supportés par Chromium/nw.js), buffers offscreen. C'est
faisable mais avec un budget de performance radicalement différent (DOC 3).

## 2. Pipeline de rendu (ordre exact, `ig.Game.draw`, ligne 718)

```
runFrame (ig.System, impact.base.system.js)
  gate frameSkip → ig.Timer.step() → tick (clampé maxStep = 1/30)
  delegate.run() = sc.CrossCode.run()
    update() : addons.preUpdate → physics → events → addons.postUpdate
    draw()   :
      1. setScreenPos sur toutes les couches     (scroll + parallaxe)
      2. addons.preDraw (trié)                   ← ig.screenBlur (1000) redirige le contexte
      3. ig.system.startZoomedDraw()             (zoom caméra)
      4. renderer.prepareDraw(shownEntities)     (cull viewport + updateSprites + slots)
         renderer.drawLayers()                   ("first" → levels → "last")
      5. addons.midDraw (trié)                   ← light composite, weather, VisualOverhaul (150)
      6. renderer.drawPostLayerSprites()         ("postlight" + GUI-sprites)
      7. ig.system.endZoomedDraw()
      8. addons.postDraw (trié)                  ← HUD (ig.gui 500), tilt-shift (250), overhaul (245)
    finalDraw() : voile sombre si fenêtre sans focus
```

**Ordres effectifs constatés** (tri croissant dans chaque phase) :
- preDraw : `ig.screenBlur` (1000) redirige `ig.system.context` vers son buffer.
- midDraw : `ig.light` (composite lumière), weather, `VisualOverhaul` (150).
- postDraw : `ig.screenBlur` (200, recompose), `VisualOverhaul` (245),
  **tilt-shift (250)**, `ig.gui` (500, HUD — toujours net au-dessus).

**Points d'ancrage pour un mod** : un `ig.GameAddon` avec `preDrawOrder` /
`midDrawOrder` / `postDrawOrder` s'insère exactement où il veut. Le HUD
(`postDrawOrder` 500) reste toujours net au-dessus des effets monde — c'est
l'architecture que tilt-shift et visual-overhaul exploitent déjà.

## 3. Résolution & coordonnées (rappel RENDERING-RESEARCH.md)

- `ig.system.width/height` = résolution **logique** (568×320) — culling, HUD,
  souris se mesurent contre ça.
- `contextWidth/Height` = `realWidth/Height` = backing store = `width × scale`
  (1136×640 à scale 2). Les effets plein écran utilisent `realWidth`.
- `screenWidth/Height` = taille CSS ; souris remappée par
  `mouse.x *= ig.system.width / ig.system.screenWidth`.
- **Règle mod** : dessiner en espace *physique* (`realWidth`) exige
  `ctx.save(); ctx.resetTransform(); … ctx.restore()` — c'est ce que fait
  visual-overhaul. Dessiner en espace *logique* laisse le zoom caméra s'appliquer
  (souvent ce qu'on veut pour un effet ancré au monde).

## 4. Audio : architecture complète (`impact.base.sound.js`, 1393 lignes)

### 4.1 Graphe WebAudio (déjà en place)

```
BufferSource → GainNode (ig.WebAudioBufferGain)
   → [PannerNode si positionnel]  (equalpower, distanceModel linear)
   → volumes.sound (GainNode)  ─┐
   → volumes.music (GainNode)  ─┤→ [DynamicsCompressor −6 dB, ratio 20:1] → master → destination
```

`ig.soundManager.volumes = { master, music, sound }` : trois GainNodes
séparés **déjà câblés**. `setMasterVolume / setMusicVolume / setSoundVolume`
sont appelés par les options (`volume-master`, `volume-music`, `volume-sound`).

### 4.2 Audio positionnel : DÉJÀ IMPLÉMENTÉ (découverte clé pour l'item 5)

`ig.SoundHandleWebAudio` implémente déjà l'audio 2.5D :

- `setEntityPosition(entity, align, offset, range, rangeType)` /
  `setFixPosition(pos, range)` — position rafraîchie **chaque frame**
  (`_updateEntityPos` via `entity.getAlignedPos(align)`, `ig.ENTITY_ALIGN`).
- `play()` crée un **PannerNode** : `panningModel="equalpower"`,
  `distanceModel="linear"`, `refDistance = 0.1 × range`,
  `maxDistance = range` (défaut **1600 px**).
- Position rafraîchie chaque frame depuis `pos.point − ig.game.soundPos`.
- **Atténuation** : spline `EASE_SOUND` sur `(dist − near)/far` avec
  `near = 0.1 × range`, `far = 0.9 × range` — proche d'une atténuation
  linéaire, pas exactement la puissance 1.5 de Visuals_to_check (différence
  cosmétique).
- **Panning** : `PannerNode.setPosition(x, y, −0.1 × range)` en equalpower —
  le pan stéréo est déduit de la position x relative au centre d'écoute.
- **Référentiel d'écoute** : `ig.game.soundPos` est mis à jour par la caméra
  (`impact.feature.camera.camera.js` lignes 93-94) — le « centre d'écoute »
  suit déjà la caméra, pas le joueur.
- **Gating crucial** : `_doPanning = (durée ≥ 1 s) || loop`. Les sons courts
  (< 1 s) ne sont PAS spatialisés — c'est le goulot d'étranglement réel pour
  l'item 5 (les hits de combat < 1 s ne sont pas spatialisés).
- `ig.SOUND_RANGE_TYPE` : CIRCULAR / HORIZONTAL / VERTICAL — range anisotrope
  possible (utile : atténuer seulement en distance horizontale).
- `ig.SoundHelper.playAtEntity(sound, entity, params, loop, range, rangeType)`
  est le helper standard, **déjà utilisé partout** (pas NPC range 700,
  item-drop, puzzle, combat).

**Conclusion item 5** : atténuation + panning existent déjà. Il manque :
1. spatialiser les sons courts (< 1 s) — élargir le gating `_doPanning` ;
2. éventuellement ajuster la courbe (puissance 1.5 vs spline `EASE_SOUND`) ;
3. rien à faire pour le référentiel : `ig.game.soundPos` suit déjà la caméra
   (caméra lignes 93-94).

### 4.3 Musique (BGM)

- `ig.Music` : pile de pistes avec **cross-fade natif** (`_transitionType`
  0/1/2, `_intervalStep` toutes les 16 ms, `_fadeInTime`/`_setFadeOut`).
- `ig.TrackWebAudio` : boucle sans couture via double `BufferGain`
  (currentNode/nextNode pré-programmés au temps de contexte exact) + intro
  séparée (`introPath`/`introEnd`). Le cross-fade BGM du night mode est donc
  **natif** : `ig.bgm.play(track, volume, mode)` avec `ig.BGM_SWITCH_MODE`
  (fadeOut/fadeIn de 0 à 5 s : IMMEDIATELY → VERY_SLOW).
- `ig.Bgm` (addon) : pile de pistes + track sets par type (field/battle…),
  `pushDefaultTrackType("battle")` pendant le combat puis `resumeDefault`,
  persistance sauvegarde (`onStorageSave`). Le mode « The Void » (fade à 0) =
  `ig.bgm.pause("SLOW")` ; « Nightfall OST » = `ig.bgm.play(nightTrack, vol,
  "SLOW")`. Tout est natif.

### 4.4 Ambiance de carte

`ig.mapSounds` (`impact.feature.map-sounds.js`) : boucle d'ambiance par carte
(`ig.MAP_SOUNDS.*`, ex. CARGO_SHIP_OUTSIDE avec mouettes aléatoires). Un mod
nuit peut injecter des variantes nocturnes en écrasant `ig.MAP_SOUNDS[clé]`
avant le chargement de la carte (segments : chouettes la nuit).

## 5. Boîte à outils Canvas2D disponible (sans shader)

| Outil Canvas2D | Usage pour les 5 items |
|---|---|
| `globalCompositeOperation` (`lighter`, `destination-out`, `source-atop`…) | god rays additifs, lanterne (trou dans l'obscurité), glows |
| `globalAlpha` | atténuation, fondus |
| `ctx.filter = 'blur(Npx) brightness() contrast() saturate()'` (filtres SVG, Chromium) | bokeh foreground, motion blur approx, tilt-shift (déjà exploité) |
| `drawImage` par bandes/tranches | distorsion, reflets, ripple (prouvé par visual-overhaul) |
| Buffers offscreen (`ig.system.createImageBuffer`, buffers mods) | multi-passes : masque d'occlusion, reflets |
| `globalCompositeOperation='destination-out'` | « trouer » l'obscurité pour la lanterne (prouvé par night-mode) |
| `getImageData` | à éviter en boucle (stalle le pipeline) — l'engine ne l'utilise que dans le worker d'images (`ig.Image.worker`) |

## 6. Verdict de faisabilité par item (détails en DOC 2)

| # | Item | Faisabilité | Voie |
|---|---|---|---|
| 1 | God rays + bruit de canopée | **Partielle** | pseudo : masque d'occlusion approximé + rayons additifs ancrés monde ; pas d'occlusion par-pixel sans getImageData coûteux |
| 2 | Eau translucide, réfraction, reflets | **Partielle→Bonne** | reflets planaires par flip (prouvé par puddle-reflections) ; réfraction par ripple strips (prouvé) ; profondeur par teinte de couche |
| 3 | Motion blur directionnel par vélocité | **Bonne** | `coll.vel` existe ; smear = multi-drawImage le long du vecteur vitesse, ou réutiliser l'effet speedlines natif |
| 4 | Parallaxe foreground + bokeh | **Bonne** | `distance > 1` n'existe pas nativement (distance ≤ 1) → inject `setScreenPos` ; bokeh = `ctx.filter` blur sur la couche |
| 5 | Audio 2.5D positionnel | **Déjà à ~80 %** | PannerNode + atténuation + panning existent ; gating `_doPanning` (sons ≥ 1 s) à élargir ; `ig.game.soundPos` suit déjà la caméra |
