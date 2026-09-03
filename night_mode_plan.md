## Mod Master Plan: CrossCode - Night Mode

> **Design document.** This remains a planning/pre-production specification, not
> a runtime reference. Use the [agent reference](docs/game/agent-reference.md)
> for current hook order, coordinate-space terminology, and renderer guardrails;
> verify proposed APIs against `deobf/clean/` and the tracked mod sources.

Status: Planning & Pre-Production
Core Concept: A fully customizable, dynamic time-of-day engine that alters the visual, auditory, and mechanical atmosphere of CrossCode without breaking vanilla progression.

#### 1. The Time Engine (Core Logic)

The invisible heartbeat of the mod. This engine calculates the current "in-game" time and broadcasts it to the visual and audio systems.

Master Toggle: Global On/Off switch for the entire mod.

Time Ratio Slider: Determines how fast time flows.

Option A: 1:1 (Real-time, synced to the player's actual system clock).

Option B: Scaled Time (e.g., 1:72 ratio where a full 24-hour cycle takes 20 real-world minutes, similar to Minecraft).

Phase Toggles: Users can independently enable or disable the "Sunrise" and "Sunset" transitional phases. If disabled, the game snaps directly between Day and Night over a quick fade.

#### 2. Visuals & Atmosphere

The largest component of the mod, tying together new CSS overlays and pre-existing mods.

Main Menu Integration: The ig.gui.MainMenu background dynamically swaps between Day, Sunrise/Sunset, and Night artwork based on the system/mod clock when the game is launched.

Dynamic Overlay: A canvas-wide color/opacity filter.

Darkness Slider: User-defined maximum opacity for the night phase (allows players to choose between "moody evening" and "pitch black").

Dynamic Tilt-Shift (Integration): Hooks into the pre-existing tilt-shift camera mod.

Day: 0% blur.

Sunset: Slight blur roll-off at the top and bottom edges.

Night: Aggressive, heavy blur at the edges to simulate low-light depth of field and claustrophobia.

Lea's Lantern Aura: A soft radial gradient mask centered on Lea's coordinates that "punches a hole" through the dark overlay, ensuring the player can always see their immediate surroundings.

Glow-in-the-Dark Elements: Specific rendering hooks for glowing objects. Energy projectiles, specific combat SFX, and landmarks (like save points) will use mix-blend-mode to glow vibrantly against the dark overlay.

#### 3. Audio Protocols

CrossCode's upbeat music can break the tension of a dark night. The audio engine will crossfade the BGM during the Sunset phase based on a 3-way toggle:

Mode 1: Vanilla. The normal OST continues playing regardless of the time.

Mode 2: The Void. BGM fades entirely to 0% volume, leaving only ambient silence, footsteps, and sound effects.

Mode 3: Nightfall OST. Swaps the active BGM track to a "remastered/sweeter" nighttime equivalent (utilizing existing audio replacement techniques).

#### 4. World Rules & Gameplay

Nighttime shouldn't just look different; it should feel different mechanically.

The Safety Border (Toggle): When enabled, transition triggers at the edges of the current map zone are disabled at night. The player is "locked in" to their current area to survive until morning.

NPC Night Protocols (Toggle): Casual NPCs go "off-duty" at night. Their interaction prompts are disabled, simulating that the world is asleep. (Quest-critical NPCs may need a whitelist to prevent soft-locks).

Resting Landmarks: A new interaction prompt added to Save Points/Landmarks allowing the player to "Rest until Sunrise," rapidly fast-forwarding the time engine.

#### 5. UI & Interface

The Pause Menu Hub: Instead of messing with the volatile Options menu, a new "Night Mode" button will be injected into the main Pause Menu. Clicking it opens a custom UI window containing all the sliders and toggles.

The Celestial Clock (HUD): A small, elegant UI element (perhaps near the minimap). It features a spinning dial (Sun/Moon) representing the current time ratio.

Auto-Hide: The clock automatically fades out during intense combat to prevent screen clutter.

#### 6. Future Expansion (Phase 2)

Features slated for later development once the core engine is stable.

Water Asset Swap: Dynamically swapping water textures for slightly blurred, darker, or less reflective variants at night.

Motion Trails: Applying very slight ghosting/motion trails to Lea and enemies during the night phase to simulate slow-shutter-speed vision in the dark.