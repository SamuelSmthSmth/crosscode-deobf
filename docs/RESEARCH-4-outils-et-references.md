# DOC 4 — Outils existants, prior art & références

> Tout ce qui peut être réutilisé directement pour les 5 items de
> `Visuals_to_check.md`, dans ce repo ou dans l'écosystème CrossCode.

---

## 1. Mods déjà installés dans ce repo (`assets/mods/`) — prior art direct

| Mod | Ce qu'il prouve / fournit | Réutilisable pour |
|---|---|---|
| **tilt-shift** v1.2.0 | Blur diorama entre monde et HUD via GameAddon (ordres 250/501), **pattern adaptatif complet** (qualité adaptative cible 45 FPS, failsafe 24 FPS, `updateEvery`, `scale 0.5`, diagnostics overlay, hotkeys, presets), options dans Options > Video | Items 1, 3, 4 : le pattern adaptatif + la structure d'options à copier |
| **visual-overhaul** v1.0.0 | Colour grading par phase (fillRect), **rain ripples par bandes drawImage** (sans getImageData), **puddle reflections par flip vertical**, parallaxe par inject `ig.MAP.Background`, options OBJECT_SLIDER avec labels custom | Items 2 (reflets/réfraction prouvés), 4 (inject parallaxe), 1 (grading) |
| **ambient-nights** v1.6.0 | Cycle jour/nuit complet sur les systèmes natifs (horloge dans `onDeferredUpdate`, obscurité superposée à `ig.light.lightMapDarkness`, météo via `ig.weather.setWeather(new ig.WeatherInstance(name))`, réapplication après chaque `onLevelLoaded`, options `ambience-*`, UI DOM de prévisions) | Items 1 (phase du soleil), 2 (pluie), 5 (ambiance nocturne) ; la BONE structure d'un mod visuel propre |
| **photo-mode** v1.0.0 | Gel du monde + caméra libre, « works with tilt-shift + ambient-nights » | Item 4 (composition), tests visuels |
| **widescreen-mod** v2.0.0 | `preload` (change `IG_WIDTH` avant boot) + `poststart` (resize runtime), options Video | Item 4 (le foreground doit survivre au changement de largeur) |
| **fps-unlock** v1.0.0 | rAF vs setInterval, frame-skip, options Display Rate | Budget de performance (DOC 3) |
| **timewalker** v0.3.1 (CCTimeWalker) | Contrôle du temps (plugin) | Prior art night mode (item 1/5) |
| **night-mode.zip** | Itération antérieure : hijack `ig.Game.prototype.draw`, horloge avancée dans le draw, patchs regex Node (`refactor.js`, `injectHooks.js`) | **La contre-méthode** — à ne pas suivre (DOC 3 §3.3) |
| cc-remastered-melodies, Boki_Colors, cc-menu-ui-replacement, nax-ccuilib, modifier-api, input-api, item-api, extension-asset-preloader… | Écosystème d'exemples (UI lib, APIs) | Références générales |

## 2. Hooks engine à réutiliser (vérifiés dans `deobf/clean/`)

| Besoin | Hook natif | Fichier de référence |
|---|---|---|
| Effet plein écran entre monde et HUD | `ig.GameAddon` + `preDrawOrder/midDrawOrder/postDrawOrder` | `impact.base.game.js` (`ig.GameAddon`), tilt-shift, visual-overhaul |
| Copier la frame pour post-traitement | `ig.screenBlur` (buffer privé, ordres 1000/200) | `impact.feature.screen-blur.screen-blur.js` |
| Blur zoom (radial) | `ig.ZoomBlurHandle` + `ig.BLUR_ZOOM_CONFIG` | idem |
| Tint plein écran | `fillRect` en `onMidDraw`/`onPostDraw` avec `ctx.resetTransform()` | visual-overhaul `_drawColorGrading` |
| Distorsion par bandes | `drawImage` par strips | visual-overhaul `_drawRainRipples` |
| Reflet par flip | `transform(1,0,0,-1,0,H)` + `drawImage` | visual-overhaul `_drawPuddleReflections` |
| Parallaxe modifiée | inject `ig.MAP.Background` (`setScreenPos`) | visual-overhaul `injectParallax` |
| Obscurité nuit | superposer à `ig.light.lightMapDarkness` après le weather | ambient-nights |
| Météo forcée | `ig.weather.setWeather(new ig.WeatherInstance(name), immediately)` | ambient-nights |
| Effet particules orienté | JSON `data/effects/*.json` + `ig.EffectSheet.spawnOnTarget` | `data/effects/speedlines.json` |
| Audio positionnel | `ig.SoundHelper.playAtEntity` / `handle.setEntityPosition` | `impact.base.sound.js` (déjà câblé) |
| Cross-fade BGM | `ig.bgm.play/push/pop/inbetween` + `ig.BGM_SWITCH_MODE` | `impact.feature.bgm.bgm.js` |
| Ambiance par carte | `ig.MAP_SOUNDS[clé]` (écrasable avant chargement) | `impact.feature.map-sounds.map-sounds.js` |
| Options persistantes | `sc.OPTIONS_DEFINITION['mon-mod-…']` + `sc.options` | ambient-nights, visual-overhaul |
| Buffer offscreen | `ig.system.createImageBuffer(w, h, draw)` | `impact.base.system.js` |
| Filtres image pré-calculés | `ig.Image.getFiltered(name, operator, config)` via worker | `impact.base.image.js` |

## 3. Écosystème CrossCode (hors repo)

- **CCDirectLink** (GitHub) : hub de la communauté modding — CCLoader,
  CCModManager (installé ici en `.ccmod`), librairies `nax-ccuilib` (UI),
  `modifier-api`, `input-api`, `item-api`, `extension-asset-preloader`.
- **Convention de packaging** : dossier avec `ccmod.json` (id, version,
  dependencies, et un des champs `preload` / `postload` / `prestart` /
  `poststart` / `plugin` / `main`) + assets sous `assets/`. Distribution :
  dossier dans `assets/mods/` ou paquet `.ccmod` (zip).
- **Ordre de chargement CCLoader** (vérifié dans `ccloader/js/`) :
  `_loadPlugins` → `_executePreload` → jeu (jusqu'à postload) →
  `_executePostload` → `_waitForGame` → `_executeMain` (= `main` + `poststart`)
  → `modsLoaded`. **`poststart` s'exécute après que le jeu est interactif** —
  c'est pourquoi ambient-nights/visual-overhaul y branchent leurs addons
  directement dans `ig.game.addons` (triés) au lieu de `ig.addGameAddon`.
- **Weltmeister** : éditeur de cartes intégré (`window.wm`) — pour ajouter les
  couches foreground (item 4) et marquer les zones d'eau (item 2).

## 4. Correspondance plan ↔ outils (résumé opérationnel)

| Item du plan | Outil natif à réutiliser | Mod existant à étendre/copier |
|---|---|---|
| 1. God rays + bruit canopée | `ig.light` (shadow providers, `lightMapDarkness`), `globalCompositeOperation='lighter'`, texture bruit pré-générée | ambient-nights (phase/heure), tilt-shift (adaptatif) |
| 2. Eau (tint, réfraction, reflets) | `drawAnimated` (tuiles animées), buffers offscreen, strips | visual-overhaul (ripples + puddle reflections) |
| 3. Motion blur directionnel | `coll.vel`, `onMoveEffect`, JSON effets (`speedlines.json`) | — (nouveau, data-driven en premier) |
| 4. Parallaxe foreground + bokeh | `ig.MAP.Background.setScreenPos` (distance), chunks pré-rendus | visual-overhaul (inject parallaxe), widescreen-mod |
| 5. Audio 2.5D | PannerNode natif, `ig.SoundHelper.playAtEntity`, `ig.game.soundPos` (caméra) | — (inject minuscule) ; ambient-nights pour l'ambiance nocturne |

## 5. Références internes (à lire dans l'ordre)

1. `RENDERING-RESEARCH.md` — boot, résolution, FPS, widescreen, souris.
2. `deobf/RENDERING-2.5D-NOTES.md` — 2.5D, cube sprites, lumière, parallaxe,
   caméra, dream-fx, météo (le plus détaillé sur le rendu).
3. `docs/RESEARCH-1-architecture-rendu-audio.md` — pipeline + audio (ce doc 1).
4. `docs/RESEARCH-2-implementation-par-feature.md` — stratégie par item.
5. `docs/RESEARCH-3-risques-et-limites.md` — performance & pièges.
6. `deobf/PROGRESS.md` — état de la déobfuscation (569/569, LCS ≥ 0.929).
7. `night_mode_plan.md` — plan master night mode (contexte produit).
8. `ENGINE-NOTES.md`, `engine-summary.json`, `engine-tree.txt` — inventaire.

## 6. Ce qu'il reste à produire (prochaines étapes suggérées)

1. **Mod « positional-audio »** (item 5) : ~30 lignes, inject du gating
   `_doPanning` + options. Le premier livrable concret.
2. **Mod « motion-fx »** (item 3) : variante JSON speedlines orientée vitesse,
   puis inject `ig.Sprite.prototype.draw` pour le smear.
3. **Prototype « foreground-parallax »** (item 4) : inject `setScreenPos` +
   blur chunk, sur une carte de test.
4. **Prototype « water-fx »** (item 2) : réutiliser les techniques
   visual-overhaul restreintes aux zones d'eau d'une carte de test.
5. **Prototype « god-rays »** (item 1) : masque basse résolution + faisceaux
   additifs, piloté par la phase ambient-nights.
6. **Fusion finale** : mod « visual-fx » unique avec sous-modules (options),
   réutilisant ambient-nights/tilt-shift plutôt que les dupliquant.
