/**
 * impact.base.impact
 * ==================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.impact")`.
 *
 * The engine bootstrap. `ig.main(...)` selects the active language, constructs
 * the global singletons (ig.system, ig.lang, ig.input, ig.soundManager, ig.music)
 * and kicks off the main loader.
 */
ig.module("impact.base.impact")
    .requires(
        "dom.ready", "impact.base.image", "impact.base.font", "impact.base.sound",
        "impact.base.loader", "impact.base.system", "impact.base.input",
        "impact.base.vars", "impact.base.lang"
    )
    .defines(function () {

        ig.mainLoader = null;

        /**
         * Called once from `window.startCrossCode` (game.main):
         *   ig.main("#canvas", "#game", sc.CrossCode, fps, width, height, scale, sc.StartLoader)
         *
         * @param {string} canvasSelector canvas element selector ("#canvas")
         * @param {string} containerSelector game container selector ("#game")
         * @param {Function} gameClass the game class (sc.CrossCode)
         * @param {number} fps
         * @param {number} width
         * @param {number} height
         * @param {number} scale
         * @param {Function} loaderClass the loader class (sc.StartLoader)
         */
        ig.main = function (canvasSelector, containerSelector, gameClass, fps, width, height, scale, loaderClass) {
            // --- language selection: forced > window > stored > browser-detected ---
            if (ig.FORCE_LANG) {
                ig.currentLang = ig.FORCE_LANG;
                ig.log("%cFORCE LANG: " + ig.currentLang, "color:#FF4A4A");
            } else if (window.IG_LANG) {
                ig.currentLang = window.IG_LANG;
                ig.log("%cWINDOW LANG: " + ig.currentLang, "color:#FF4A4A");
            } else {
                var stored = localStorage.getItem("IG_LANG");
                if (stored) {
                    ig.currentLang = stored;
                    ig.log("%cSTORED LANG: " + ig.currentLang, "color:#FF4A4A");
                } else {
                    var detected = "en_US";
                    for (var langKey in ig.LANG_DETAILS) {
                        if (ig.LANG_DETAILS[langKey].useFor &&
                            navigator.language.startsWith(ig.LANG_DETAILS[langKey].useFor)) {
                            detected = langKey;
                        }
                    }
                    ig.currentLang = detected;
                    localStorage.setItem("IG_LANG", ig.currentLang);
                    ig.log("%cAUTO LANG: " + ig.currentLang, "color:#FF4A4A");
                }
            }

            if (!ig.LANG_DETAILS[ig.currentLang]) {
                ig.currentLang = "en_US";
                localStorage.setItem("IG_LANG", ig.currentLang);
                ig.log("%cFALLBACK LANG: " + ig.currentLang, "color:#FF4A4A");
            }

            // Apply language-specific system font + metrics.
            var langDetails = ig.LANG_DETAILS[ig.currentLang];
            if (langDetails && langDetails.systemFont) {
                ig.Font.systemFont = langDetails.systemFont;
                ig.imageAtlas.scale = 2;
                $("#game").css("font-family", langDetails.systemFont + ", sans-serif");
            }
            if (langDetails && langDetails.metrics) ig.SYSTEM_FONT_METRICS = langDetails.metrics;

            // --- construct engine singletons ---
            ig.system = new ig.System(canvasSelector, containerSelector, fps, width, height, scale || 1);
            ig.lang = new ig.Lang();
            ig.input = new ig.Input();
            ig.soundManager = new ig.SoundManager();
            ig.music = new ig.Music();
            ig.ready = true;

            var loader = new (loaderClass || ig.Loader)(gameClass);
            loader.load();
            ig.mainLoader = loader;
        };
    });

// --- bundle glue: re-export the minifier-scoped globals, then ensure `sc` exists ---
window.Vec2 = window.Vec2;
window.Vec3 = window.Vec3;
window.Line2 = window.Line2;
window.KeySpline = window.KeySpline;
window.KEY_SPLINES = window.KEY_SPLINES;
window.assert = window.assert;
window.assertContent = window.assertContent;
window.sc || (window.sc = {}, window.sc = window.sc);
