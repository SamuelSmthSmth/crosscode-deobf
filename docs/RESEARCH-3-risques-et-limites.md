# DOC 3 — Luttes, risques, budget de performance & pièges

> **Document de performance/recherche.** The canonical implementation rules are
> consolidated in the [agent reference](game/agent-reference.md), especially
> the Canvas2D and buffer guardrails below.
>
> Ce que le plan `Visuals_to_check.md` sous-estime, ce qui peut casser, et le
> budget de performance réel sur Canvas2D. Basé sur l'architecture vérifiée
> (DOC 1) et les précédents mods du repo.

---

## 1. Le risque n°1 : la performance Canvas2D

### 1.1 Budget par frame (60 FPS ⇒ 16.6 ms, dont le jeu en utilise déjà une partie)

Le jeu lui-même (culling, slots, tri, drawEntities, lumière, weather) consomme
déjà une part du budget. Les mods existants donnent les ordres de grandeur :

| Opération | Coût relatif (mesuré/estimé sur ce moteur) | Note |
|---|---|---|
| `fillRect` plein écran (tint) | ~1× | négligeable — visual-overhaul le fait chaque frame |
| `drawImage` plein écran (copie buffer) | ~2-3× | tilt-shift et screen-blur le font chaque frame |
| `drawImage` par bandes (~100-200 bandes) | ~10-20× | visual-overhaul rain-ripples : activé BALANCED+ seulement |
| `ctx.filter='blur()'` plein écran **par frame** | 30-100× | **à proscrire par frame** — tilt-shift l'évite (passes restreintes, `updateEvery: 3`, `scale: 0.5`) |
| `getImageData` plein écran | stall pipeline GPU→CPU | **interdit en boucle** ; l'engine ne l'utilise que dans son worker d'images |

### 1.2 Le pattern « adaptive quality » est obligatoire
Tilt-shift l'a formalisé et c'est la leçon à retenir :
- `adaptiveQualityEnabled` : monter/descendre la qualité selon FPS cible (45)
  avec hystérésis (`adaptiveFpsBuffer`, cooldown 1 s, lissage FPS 0.2).
- `failsafe` : si FPS < 24 pendant 45 frames → désactiver l'effet, ne
  réactiver qu'au-dessus de 34 FPS pendant 90 frames.
- `updateEvery: 3` : recalculer l'effet lourd 1 frame sur 3.
- `scale: 0.5` : calculer l'effet à demi-résolution.
- Désactivation automatique en combat (`autoDisableCombat`) et menus.

**Toute feature des items 1-4 doit intégrer ce pattern dès le départ**, sinon
elle dégrade le jeu en combat (le pire moment pour perdre des FPS).

### 1.3 Résolution physique = 1136×640 (scale 2) — et ça change
Avec le mod widescreen, `ig.system.width` peut monter (720-853) : tous les
buffers du mod doivent suivre `ig.system.resize` (les buffers fixes cassent).
Tilt-shift gère `lastW/lastH` + `dirty` ; faire pareil.

---

## 2. Luttes spécifiques par item

### Item 1 — God rays
- **Pas d'occlusion vraie** : le masque basse résolution ne verra pas les
  canopées fines comme un shader. Attendre un rendu « ambiance », pas
  « physique ».
- **Position du soleil** : il n'y a pas de soleil dans le jeu ; il faut le
  déduire de la phase du jour (ambient-nights expose `currentPhase` et
  l'heure). Le vecteur soleil doit être cohérent avec la position du mod
  nuit, sinon l'effet paraît faux.
- **Le bruit ancré monde** : offset par `ig.game.screen` OK, mais si la couche
  a une parallaxe (`distance < 1`), l'ancrage doit utiliser le scroll de la
  couche (`layer.scroll`), pas `ig.game.screen` brut.
- **Coût des N faisceaux** : chaque faisceau = 1 path + gradient. Limiter à
  6-10 faisceaux, buffer ÷4.

### Item 2 — Eau
- **Identification des zones d'eau** = le vrai travail. Trois options :
  scan des tuiles animées d'eau (`ig.TileInfo.getAnimTiles`) au
  `onLevelLoaded` (automatique mais heuristique) ; rectangle par carte en
  données du mod (fiable, travail manuel) ; convention de nommage de couche.
- **Parallaxe** : les rectangles d'eau doivent suivre `layer.scroll` (parallaxe
  incluse), sinon le reflet « glisse » par rapport à l'eau.
- **Reflets** : le reflet flip capture TOUTE la frame au-dessus de l'eau,
  y compris le HUD si l'accroche est trop tardive — accrocher `onPostDraw`
  avant `ig.gui` (ordre < 500), et idéalement avant tilt-shift (250) pour ne
  pas refléter le blur.
- **Tuiles animées** : l'eau animée est redessinée par `drawAnimated` après les
  chunks — le tint/réfraction doit s'appliquer **après** `drawAnimated`
  (donc en postDraw, pas en midDraw).

### Item 3 — Motion blur
- **Vélocité vs déclencheur** : `coll.vel` est bruité (friction, rebonds) ;
  le déclencheur `onMoveEffect` (step/dash/jump) est plus fiable mais binaire.
  Hybride : déclencheur pour armer, `coll.vel` pour la direction.
- **Le smear doit dessiner dans le bon espace** : injecter `ig.Sprite.draw`
  (logical canvas space, zoom appliqué) — dessiner depuis un addon postDraw en
  physical/backing space demanderait de refaire la transformation caméra.
- **Coût** : N copies par entité rapide. Limiter à N=3-4, seulement entités
  rapides (seuil 300-500 px/s), et seulement sprites principaux (pas ombres).
- **Interaction avec le stack solver** : les copies ajoutées doivent utiliser
  `noOverlapSolving` pour ne pas perturber le tri en profondeur.

### Item 4 — Parallaxe foreground
- **`distance > 1` est hors spec** : la formule le supporte mais le culling des
  chunks (`preRenderChunk` : colonnes visibles calculées depuis `scroll`) et le
  `repeat` doivent être validés à 1.25×. Si le culling casse, injecter aussi
  le calcul de colonnes.
- **Bokeh au pré-rendu** : flouter les chunks une fois = gratuit ; mais les
  chunks sont invalidés quand des tuiles animées changent — le blur doit être
  appliqué dans `preRenderChunk` (où le contexte est swappé), pas sur le chunk
  fini.
- **Interaction avec le widescreen mod** : `ig.system.width` change → les
  facteurs de parallaxe en px doivent être recalculés (suivre `ig.system.resize`).

### Item 5 — Audio
- **Le gating `_doPanning`** : l'ouvrir crée un PannerNode par son court. En
  combat, des dizaines de sons courts/seconde — mesurer. Mitigation : pool de
  panners ou gating plus fin (seulement si `soundPos` s'écarte du centre).
- **`soundPos` suit la caméra, pas le joueur** : en combat, la caméra est
  centrée — c'est le bon référentiel. Mais en exploration avec caméra décalée,
  un son « au centre de l'écran » n'est pas « sur le joueur ». Décision de
  design à assumer (le jeu a choisi caméra).
- **Atténuation** : la spline `EASE_SOUND` n'est pas la puissance 1.5 du plan ;
  visuellement équivalente. Ne réécrire la courbe que si un test d'écoute le
  justifie.
- **Compressor** : le bus passe déjà par un DynamicsCompressor (−6 dB, 20:1) ;
  ouvrir la spatialisation ne devrait pas saturer, mais vérifier les niveaux.

---

## 3. Risques transverses

### 3.1 Compatibilité entre mods (le repo en a 40+)
- **Ordres de draw** : tilt-shift (250), VisualOverhaul (245), ig.gui (500).
  Un nouvel effet doit choisir son ordre consciemment :
  - effet « monde » (eau, god rays) : midDraw (150-199) ou postDraw 240-249 ;
  - effet « caméra » (bokeh foreground) : postDraw 250-260 (au-dessus du
    tilt-shift pour ne pas être re-blurré, ou en dessous pour l'être).
- **Buffers concurrents** : screen-blur redirige `ig.system.context` en
  preDraw (ordre 1000) et le recompose en postDraw (200). Un effet qui copie
  `ig.system.canvas` en postDraw > 200 copie la frame recomposée — voulu ou
  pas. C'est exactement ce que font visual-overhaul (245) et tilt-shift (250) :
  l'ordre crée la chaîne d'effets. Documenter l'ordre choisi.
- **`ctx.resetTransform()` obligatoire** en physical/backing space : tout effet plein
  écran doit `save(); resetTransform(); …; restore()` (le zoom caméra est
  actif dans postDraw — le tilt-shift et visual-overhaul le font).
- **widescreen + buffers** : tous les buffers du mod doivent suivre
  `ig.system.resize` (widescreen change `width` au boot ; le resize runtime
  existe aussi).

### 3.2 Sauvegardes & reproductibilité
- Les options des mods persistent via `sc.options`/`ig.storage` (pattern
  ambient-nights : préfixe `ambience-`). Un mod visuel doit suivre ce pattern
  (préfixe propre), sinon les réglages sautent entre sessions.
- Ne **jamais** toucher à l'état de jeu dans les passes de draw (draw = pur).
  Les mods qui trichent (night-mode.zip injecte `ig.Game.prototype.draw` et y
  avance son horloge) finissent fragiles.

### 3.3 Le piège « night-mode.zip »
Le zip `night-mode.zip` contient une itération antérieure qui :
- hijack `ig.Game.prototype.draw` (au lieu d'un addon) ;
- avance son horloge **dans le draw** (effet de bord dans une passe pure) ;
- patche par regex depuis un script Node (`refactor.js`, `injectHooks.js`).
C'est la contre-méthode : fragile aux mises à jour, difficile à déboguer.
ambient-nights (v1.6.0, reconstruit « on the engine's own systems ») est la
bonne référence : addon réel, `onDeferredUpdate` pour l'horloge, API météo
native, options dans le menu du jeu.

### 3.4 Validation
- `node --check` sur chaque fichier du mod (tous les mods du repo passent).
- Test manuel obligatoire : combat + dash + pluie + nuit + menus, sur les
  cartes les plus denses.
- Mesurer : addon de diagnostics de tilt-shift (`diagnosticsOverlay`) est un
  bon template pour afficher FPS/temps passé par frame.

---

## 4. Budget de performance résumé (règles à graver)

1. Aucun `getImageData`/`putImageData` par frame sur le canvas principal.
2. Aucun `ctx.filter='blur()'` plein écran par frame (pré-rendu ou passes
   restreintes à demi-résolution à la place).
3. Toute passe plein écran coûte ~1-3 % du budget : compter les passes.
4. Bandes/tranches : ≤ ~200 bandes/frame (visual-overhaul : stripH ≈ 6 px
   physiques sur 640 px ≈ 107 bandes).
5. Tout effet lourd : `updateEvery ≥ 2`, `scale ≤ 0.5`, et l'adaptatif
   tilt-shift (cible 45 FPS, failsafe 24 FPS).
6. Désactivation automatique en combat (option, défaut ON pour les effets
   coûteux) — le combat est le pire cas de charge.
7. Buffers alloués à `ig.system.resize` (widescreen), jamais à taille fixe.

---

## 5. Décisions de design à trancher (avec le plan existant)

1. **Le plan parle de shaders partout** → assumer publiquement la conversion
   « pseudo-effet Canvas2D » : le rendu sera « impressionniste », pas
   physiquement correct. C'est cohérent avec l'esthétique pixel-art.
2. **God rays** : où est le soleil ? (proposition : déduit de la phase
   ambient-nights, direction fixe par phase).
3. **Eau** : quelles cartes ? (proposition : commencer par les cartes avec
   rivières du tutoriel/bero, données de rectangles à la main).
4. **Motion blur** : quelles entités ? (proposition : Lea + projectiles +
   balles de puzzle ; pas les NPC).
5. **Audio** : ouvrir le gating pour tous les sons courts, ou seulement
   combat ? (proposition : tous, avec option pour revenir en arrière).
6. **Le « mod maître »** : le plan final vise un mod unique. Recommandation :
   un mod « visual-fx » avec sous-modules activables (options), en s'appuyant
   sur les mods existants (ambient-nights pour la phase du jour, tilt-shift
   pour l'adaptatif) plutôt qu'en les dupliquant.
