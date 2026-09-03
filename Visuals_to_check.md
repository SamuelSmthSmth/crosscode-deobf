# Visuals to check

> **Design backlog / feature hypotheses.** For implementation-ready hook names,
> coordinate-space terminology, and hard Canvas2D constraints, use the
> [agent reference](docs/game/agent-reference.md). Items below describe desired
> effects, not verified engine capabilities; confirm each proposal against
> `deobf/clean/` before implementation.

### 1. Volumetric God Rays & Canopy Noise Pass

* **Occlusion Mask:** Create an offscreen binary mask where solid tiles and high-elevation tree canopies render black, while sky and water gaps render white.
* **Physical screen/backing-space radial blur (hypothesis):** The fragment shader samples along a ray from the pixel towards the screen-space sun vector, accumulating brightness.
* **Animated Canopy Noise:** Multiplying the light intensity by a scrolling 2-octave Simplex noise texture ($u\_Time \times 0.2$) simulates swaying branches when idle. Offsetting the noise UV coordinates by `(ig.game.screen.x, ig.game.screen.y)` ensures the light shafts stay anchored to world coordinates when moving.

---

### 2. Semi-Transparent Water, Refraction & Reflections

* **Depth Tinting:** Instead of drawing water tiles as a flat blue sprite, the water shader samples the rendered riverbed texture underneath, applying a depth absorption gradient (shallow shorelines stay clear; deep central trenches darken to deep navy).
* **Normal-Mapped Refraction:** Displace the background UVs slightly using a moving ripple normal map to make submerged rocks and lily pads shimmer.
* **Planar Bank Reflections:** Sample cliff and tree sprites directly above the water line, flip their vertical coordinates, attenuate their alpha based on water depth, and composite them with the ripple pass.

---

### 3. Velocity-Based Directional Motion Blur

* **Fast Entity Streaks:** In `impact.base.entity.js`, track each entity's velocity vector $(\text{vel.x}, \text{vel.y})$. If $\text{length}(\text{vel}) > \text{threshold}$ (e.g., during Lea's combat dashes or high-speed ball throws), pass directional blur parameters to the sprite's draw call to smear pixels along its motion angle.
* **Waterfall & Fluid Smear:** For animated tiles marked as fast fluid, apply a vertical 1D Gaussian kernel directly in the fragment shader to blend frames seamlessly.

---

### 4. Foreground Parallax & Depth of Field

* **Foreground Canopy Layers:** In `impact.base.background-map.js`, insert a layer with a parallax factor $> 1.0$ (e.g., $1.25$). As the camera pans, foreground palm fronds and hanging vines glide past faster than the terrain.
* **Camera Bokeh Blur:** Apply a fixed 2-pixel Gaussian blur specifically to this foreground layer so it mimics a camera lens focused on Lea's middle depth plane.

---

### 5. 2.5D Positional Audio & Distance Attenuation

*CrossCode* already tracks audio origins through `soundPos: { x: 0, y: 0 }` inside `impact.base.sound.js`, but downmixes almost everything to flat stereo.

* **Distance Volume Attenuation:** Hook into `ig.Sound.prototype.play` to calculate Euclidean distance between the sound source and the camera-owned
`ig.game.soundPos`:

$$\text{Gain} = \text{clamp}\left(1.0 - \frac{\text{Distance}}{\text{MaxRange}}, 0.0, 1.0\right)^{1.5}$$


* **Dynamic Stereo Panning:** Route WebAudio `AudioBufferSourceNode`s through a `StereoPannerNode`. Compute the horizontal delta $(\text{SoundX} - \text{CameraCenterX}) / (\text{ScreenWidth} / 2)$ and clamp it between $-1.0$ (left ear) and $+1.0$ (right ear). Offscreen enemy attacks, distant waterfall roar, and impact sparks immediately sound distinct in your headphones.
