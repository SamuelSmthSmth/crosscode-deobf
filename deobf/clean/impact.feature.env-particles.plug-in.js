/**
 * impact.feature.env-particles.plug-in
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.env-particles.plug-in")`.
 *
 * The plug-in entry point for the environment-particles subsystem.
 * Its only responsibility is to pull in the core spawner module and the
 * event-step definitions via `requires`.
 */
ig.module("impact.feature.env-particles.plug-in")
    .requires(
        "impact.feature.env-particles.env-particles",
        "impact.feature.env-particles.env-particles-steps"
    )
    .defines(function () {});
