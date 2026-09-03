# DOC 2 — Implémentation par feature (mod d'abord, injection sinon)

> **Document de stratégie/recherche.** Use the canonical [agent reference](game/agent-reference.md)
> for current hook order, coordinate vocabulary, typed signatures, and guardrails.
>
> Reprend les 5 items de `Visuals_to_check.md` dans l'ordre. Pour chacun :
> état réel de l'engine (vérifié dans `deobf/clean/`), stratégie recommandée,
> squelette de code ancré dans les hooks réels, et priorité.
>
> **Règle d'or** (validée par tilt-shift / visual-overhaul / ambient-nights) :
> mod CCLoader `poststart` + `ig.GameAddon` (preDraw/midDraw/postDraw) >
> `Class.inject` sur un prototype > hijack de `ig.Game.prototype.draw` (à
> éviter — night-mode.zip l'a fait et c'est fragile).

---

## Item 1 — God rays volumétriques & bruit de canopée

### Ce que dit le plan vs la réalité
| Plan (shader) | Réalité engine |
|---|---|
| Masque d'occlusion binaire offscreen (tuiles solides noires, ciel/eau blancs) | Il n'existe **aucune passe d'occlusion** ; l'info « solide vs ciel » existe dans les couches de collision (`ig.CollisionMap`) et les tuiles de la couche `first` |
| Radial blur vers le soleil en espace écran | Canvas2D : pas de passe par-pixel abordable ; mais `globalCompositeOperation='lighter'` + dégradés = rayons additifs convaincants |
| Bruit Simplex 2 octaves × `u_Time × 0.2` | Canvas2D : texture de bruit pré-générée (une fois, pas par frame) + `drawImage` avec offset temporel ; UV ancrées monde via `ig.game.screen.x/y` (exactement l'offset proposé, déjà disponible) |

### Stratégie recommandée (pseudo god rays, additive-only)
1. **Masque d'occlusion approximé sans getImageData** : pré-rendre, à chaque
   changement de carte (hook `onLevelLoaded`), un masque basse résolution des
   tuiles **opaques de la couche `first`** (tuile opaque = pixel du masque).
   Cache par carte — coût zéro par frame. Les tuiles opaques sont connues via
   `ig.TileInfo` / la couche de collision (`ig.CollisionMap`).
2. **Rayons** : sur un buffer offscreen basse résolution (÷4), dessiner depuis
   la position écran du soleil N faisceaux triangulaires additifs
   (`globalCompositeOperation='lighter'`, dégradé radial, alpha faible) qui
   s'arrêtent au masque (test par échantillonnage grossier du masque, pas
   par-pixel).
3. **Bruit de canopée** : texture de bruit pré-générée (2 octaves, une fois au
   boot), dessinée en `lighter` avec `globalAlpha` modulé, offset par
   `(ig.game.screen.x, ig.game.screen.y)` — **l'ancrage monde proposé dans le
   plan est exactement l'offset natif `ig.game.screen`**.
4. **Phase d'accroche** : `onMidDraw` **avant** `ig.light` (midDrawOrder < 100)
   pour que les rayons soient assombris par la lumière comme le monde, ou
   `midDrawOrder > 100` pour des rayons « atmosphériques » au-dessus.
   Recommandé : après la lumière (ordre 150+, comme VisualOverhaul) pour des
   rayons lumineux visibles la nuit aussi.

### Ce qui est hors d'atteinte
- Vraie occlusion par-pixel des canopées (il faudrait lire la frame :
  `getImageData` par frame = stall du pipeline, interdit en pratique).
- Radial blur « vrai » : remplacé par N copies additives décalées vers le
  soleil (technique zoom-blur de `ig.ZoomBlurHandle`, déjà dans l'engine).

### Verdict : PARTIELLE — pseudo god rays additifs convaincants, pas d'occlusion vraie.

---

## Item 2 — Eau translucide, réfraction, reflets

### Ce que dit le plan vs la réalité
| Plan | Réalité |
|---|---|
| Shader d'eau qui échantillonne le lit de la rivière | Les tuiles d'eau sont des tuiles animées ordinaires (`hasAnimatedTiles`, `drawAnimated`) sur une couche ; « le lit » = la couche en dessous, déjà dessinée avant |
| Normal map de vagues → déplacement d'UV | Canvas2D : déplacement par bandes horizontales (prouvé : `_drawRainRipples` de visual-overhaul fait exactement ça, sans getImageData) |
| Reflets planaires des falaises/arbres au-dessus de la ligne d'eau, flip vertical, alpha selon profondeur | Faisable en **physical screen space** : flip vertical d'une bande au-dessus de la ligne d'eau, alpha faible — **techniquement identique à `_drawPuddleReflections` de visual-overhaul** (flip vertical + alpha faible), mais restreint à la bande d'eau |

### Stratégie recommandée
1. **Identifier la bande d'eau** : soit par couche de tuiles « eau » connue
   (hook `onLevelLoaded`, scan de la couche pour les tuiles animées d'eau via
   `ig.TileInfo.getAnimTiles`), soit en marquant des rectangles d'eau par
   carte (données du mod). Pré-calculer les rectangles écran à chaque frame
   depuis `scroll` de la couche (parallaxe incluse : `layer.scroll`).
2. **Profondeur (tint)** : pour chaque rectangle d'eau, `source-over` un
   dégradé vertical (clair près des rives → navy profond) avec
   `globalCompositeOperation='source-atop'` limité au rectangle — pas besoin
   de connaître la profondeur réelle : un dégradé paramétré par carte suffit
   visuellement.
3. **Réfraction** : réutiliser la technique ripple strips de visual-overhaul
   **restreinte aux rectangles d'eau** (au lieu de tout l'écran) : bandes
   horizontales, offset sinusoïdal. C'est la réfraction « normal map »
   souhaitée, sans shader.
4. **Reflets planaires** : pour chaque rectangle d'eau, copier la bande
   au-dessus de la ligne d'eau (hauteur H), la dessiner **flippée** dans
   l'eau avec `globalAlpha ≈ 0.15–0.25`, éventuellement à travers le même
   ripple (dessiner le reflet dans le buffer, puis ripple le buffer).
   Exactement `_drawPuddleReflections` mais borné à la bande d'eau.
5. **Phase d'accroche** : `onPostDraw` **avant** le HUD (ordre ~245 comme
   VisualOverhaul) — l'eau doit refléter le monde fini mais rester sous le HUD.

### Verdict : PARTIELLE→BONNE — les trois sous-effets ont chacun un précédent prouvé dans visual-overhaul ; la difficulté est l'identification des zones d'eau par carte (données du mod).

---

## Item 3 — Motion blur directionnel par vélocité

### Ce que dit le plan vs la réalité
| Plan | Réalité |
|---|---|
| Suivre `vel` de chaque entité dans `impact.base.entity.js` | `coll.vel` (Vec3) **existe déjà** sur toute entité, mis à jour par la physique (`ig.CollEntry`) ; `coll.accelDir` + `relativeVel` aussi |
| Passer des paramètres de blur au draw call du sprite | Pas de paramètre blur par draw call — mais l'engine a déjà le mécanisme **speedlines** : effets JSON (`data/effects/speedlines.json`) spawnés sur cible (`speedlinesWalk/Dash/Jump`), déclenchés par `onMoveEffect` (step/dash/jump) |
| Smear directionnel le long de l'angle de mouvement | Canvas2D : multi-`drawImage` du sprite décalé le long de `vel`, alphas décroissants — ou réutiliser le slot `lighterOverlay` |

### Stratégie recommandée
1. **Ne pas réinventer** : l'engine a déjà (a) la vélocité par entité
   (`coll.vel`, Vec3, mise à jour physique), (b) le déclencheur de mouvement
   (`onMoveEffect` step/dash/jump sur `sc.ActorEntity`), (c) un effet
   speedlines data-driven (`data/effects/speedlines.json`, particules
   `OFFSET_PARTICLE_CIRCLE` avec `pScale` étiré, `moveDist`, `keySpline`).
2. **Approche A (data, la plus simple)** : ajouter au JSON speedlines des
   variantes orientées (particules étirées le long de l'angle de mouvement via
   `useTargetAngle: true`, `pScale` anisotrope) — zéro code moteur.
3. **Approche B (vrai smear)** : addon `postUpdate` qui, pour chaque entité
   visible avec `|vel| > seuil`, empile N copies du sprite décalées le long de
   `-vel.normalized × k` avec alphas décroissants. Se fait proprement via un
   addon `onPostDraw` (ordre < 245) qui redessine le sprite — mais le plus
   propre est d'injecter `ig.Sprite.prototype.draw` pour ajouter les copies
   **au moment du draw réel** (bon espace de coordonnées garanti).
4. **Seuil** : `|vel|` en px/s ; dash de Lea ≈ vitesse max ; seuil typique
   300–500 px/s. Ne blurer que `sc.PlayerEntity` + projectiles au début.

### Verdict : BONNE — vélocité + déclencheurs + effet data-driven existent ; l'approche A (JSON) est quasi gratuite, l'approche B est un inject propre.

---

## Item 4 — Parallaxe foreground (distance > 1) & bokeh

### Ce que dit le plan vs la réalité
| Plan | Réalité |
|---|---|
| Insérer une couche avec facteur de parallaxe > 1.0 | `distance` est conçu 0..1 (1 = fond fixe, 0 = collé caméra). **`distance > 1` n'est pas prévu** mais la formule `scroll = screenX × distance` est linéaire : `distance = 1.25` donnerait un layer qui défile **plus vite** que la caméra (foreground). Vérifier les effets de bord (repeat, culling). |
| Bokeh 2 px sur cette couche | `ctx.filter = 'blur(2px)'` sur la couche — mais les couches sont pré-rendues en **chunks** (`preRenderedChunks`) ; flouter les chunks au pré-rendu (une fois) est quasi gratuit |

### Stratégie recommandée
1. **Couche foreground** : dupliquer une couche de feuillage existante (ou en
   ajouter une dans la carte via l'éditeur Weltmeister), la mettre dans le
   bucket `"last"`, et injecter `ig.MAP.Background.prototype.setScreenPos`
   pour multiplier `screenX` par un facteur > 1 **pour cette couche seulement**
   (marquer la couche par un nom conventionnel, ex. préfixe `fg_`). C'est
   exactement ce que fait visual-overhaul avec `ig.MAP.Background.inject`.
   ⚠️ `distance > 1` fait défiler **plus vite que la caméra** — vérifier le
   culling (`preRenderChunk` calcule les colonnes visibles depuis `scroll`,
   devrait suivre) et le repeat.
2. **Bokeh** : flouter les chunks de cette couche **au pré-rendu**
   (`preRenderChunk` : appliquer `ctx.filter='blur(2px)'` pendant le rendu du
   chunk — coût une fois par chunk, pas par frame). Alternative par frame :
   `ctx.filter` au draw de la couche — plus cher, à éviter.
3. **Accroche** : rien à faire — `setScreenPos` est appelé pour toutes les
   couches au début de `ig.Game.draw`, l'inject suffit.

### Verdict : BONNE — un inject propre sur `setScreenPos` + blur au pré-rendu des chunks. Le facteur > 1 est hors spec mais la formule le supporte ; à valider visuellement (culling/repeat).

---

## Item 5 — Audio 2.5D positionnel

### Ce qui existe DÉJÀ (vérifié)
- **PannerNode** par son positionnel : `equalpower`, `linear`,
  `refDistance = 0.1 × range`, `maxDistance = range` (défaut 1600 px).
- Position rafraîchie **chaque frame** depuis l'entité (`getAlignedPos`) et
  relative à `ig.game.soundPos` — **le centre d'écoute suit déjà la caméra**
  (caméra lignes 93-94 : `ig.game.soundPos.x/y = soundPosVec`).
- Atténuation : spline `EASE_SOUND` sur `(dist − near)/far`,
  `near = 0.1 × range`, `far = 0.9 × range`.
- Panning : déduit de x relatif (equalpower), z = `−0.1 × range`.
- Helper standard `ig.SoundHelper.playAtEntity` utilisé partout (pas NPC
  range 700, items, puzzle, combat).
- **Gating** : `_doPanning = (durée ≥ 1 s) || loop` — les sons courts ne sont
  PAS spatialisés.

### Stratégie recommandée (mod « positional-audio »)
1. **Élargir le gating** (inject minuscule, le cœur du mod) :
   ```js
   ig.SoundHandleWebAudio.inject({
       init: function (buffer, offset, startTime, loop, volume, speed, fadeDuration) {
           this.parent(buffer, offset, startTime, loop, volume, speed, fadeDuration);
           this._doPanning = true;   // spatialisé dès qu'une position est fournie
       }
   });
   ```
   Coût : un PannerNode de plus par son court — négligeable (equalpower).
2. **Atténuation puissance 1.5** (optionnel, fidèle au plan) : injecter
   `_setPosition` pour remplacer la spline `EASE_SOUND` par
   `clamp(1 − dist/MaxRange, 0, 1)^1.5` — ou garder `EASE_SOUND` (très proche
   visuellement). Recommandé : garder `EASE_SOUND`, exposer un slider.
3. **Portée** : les sons déjà positionnés (pas, items, puzzle) bénéficient
   immédiatement ; pour les hits de combat (joués via `sound.play()` puis
   `setFixPosition(soundPos)` dans `combat.js`), la position est déjà fournie —
   ils seront spatialisés dès que le gating s'ouvre.
4. **Option « atténuation puissance 1.5 »** : injecter `_setPosition` pour
   remplacer la spline par la formule du plan (derrière une option).
5. **Option range par type** : exposer `range` (défaut 1600) ; les pas utilisent
   déjà 700.

### Verdict : DÉJÀ À ~80 % — un inject de ~10 lignes ouvre la spatialisation aux sons courts ; le reste est du réglage.

---

## Priorisation recommandée

| Ordre | Item | Raison |
|---|---|---|
| 1 | **5 — Audio 2.5D** | inject ~10 lignes, bénéfice immédiat, risque quasi nul |
| 2 | **3 — Motion blur** | approche A (JSON speedlines) quasi gratuite ; approche B (inject sprite) propre |
| 3 | **4 — Parallaxe foreground + bokeh** | inject `setScreenPos` + blur au pré-rendu ; à valider visuellement |
| 4 | **2 — Eau** | trois techniques prouvées, mais nécessite des données de zones d'eau par carte (travail de données) |
| 5 | **1 — God rays** | le plus incertain (pas d'occlusion vraie) ; commencer par le masque basse résolution |
