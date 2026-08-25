ig.module("impact.base.impact").requires("dom.ready", "impact.base.image", "impact.base.font",
        "impact.base.sound", "impact.base.loader", "impact.base.system", "impact.base.input", "impact.base.sound", "impact.base.vars", "impact.base.lang").defines(function() {
        ig.mainLoader = null;
        ig.main = function(a, b, c, d, e, f, g, h) {
            if (ig.FORCE_LANG) {
                ig.currentLang = ig.FORCE_LANG;
                ig.log("%cFORCE LANG: " + ig.currentLang, "color:#FF4A4A")
            } else if (window.IG_LANG) {
                ig.currentLang = window.IG_LANG;
                ig.log("%cWINDOW LANG: " + ig.currentLang, "color:#FF4A4A")
            } else {
                var i = localStorage.getItem("IG_LANG");
                if (i) {
                    ig.currentLang = i;
                    ig.log("%cSTORED LANG: " +
                        ig.currentLang, "color:#FF4A4A")
                } else {
                    var i = "en_US",
                        j;
                    for (j in ig.LANG_DETAILS) ig.LANG_DETAILS[j].useFor && navigator.language.startsWith(ig.LANG_DETAILS[j].useFor) && (i = j);
                    ig.currentLang = i;
                    localStorage.setItem("IG_LANG", ig.currentLang);
                    ig.log("%cAUTO LANG: " + ig.currentLang, "color:#FF4A4A")
                }
            }
            if (!ig.LANG_DETAILS[ig.currentLang]) {
                ig.currentLang = "en_US";
                localStorage.setItem("IG_LANG", ig.currentLang);
                ig.log("%cFALLBACK LANG: " + ig.currentLang, "color:#FF4A4A")
            }
            if ((j = ig.LANG_DETAILS[ig.currentLang]) && j.systemFont) {
                ig.Font.systemFont =
                    j.systemFont;
                ig.imageAtlas.scale = 2;
                $("#game").css("font-family", j.systemFont + ", sans-serif")
            }
            if (j && j.metrics) ig.SYSTEM_FONT_METRICS = j.metrics;
            ig.system = ig.system = new ig.System(a, b, d, e, f, g || 1);
            ig.lang = new ig.Lang;
            ig.input = new ig.Input;
            ig.soundManager = new ig.SoundManager;
            ig.music = new ig.Music;
            ig.ready = true;
            a = new(h || ig.Loader)(c);
            a.load();
            ig.mainLoader = a
        }
    })
})();
window.Vec2 = window.Vec2;
window.Vec3 = window.Vec3;
window.Line2 = window.Line2;
window.KeySpline = window.KeySpline;
window.KEY_SPLINES = window.KEY_SPLINES;
window.assert = window.assert;
window.assertContent = window.assertContent;
window.sc || (window.sc = {}, window.sc = window.sc);
ig.baked = !0;
