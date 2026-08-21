/**
 * impact.base.lang
 * =================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.lang")`.
 *
 * Localisation system. `ig.Lang` loads the `data/lang/*.json` files listed in
 * `ig.langFileList`; `ig.LangLabel` is a lightweight wrapper around a label's
 * multi-language object with grammar replacement (`[!]`) support.
 */
ig.module("impact.base.lang").requires("impact.base.loader").defines(function () {

    /**
     * Strip language/context markers from a label value.
     * Recurses into arrays and objects. `<<C<<` (context) and `<<A<<` (alternate)
     * mark the start of data that should be hidden from plain text output.
     */
    function stripMarkers(value) {
        if (!value) return value;

        if (value instanceof Array) {
            var arr = [];
            for (var i = value.length; i--;) arr[i] = stripMarkers(value[i]);
            return arr;
        }

        if (typeof value == "object" && !value.indexOf) {
            var obj = {};
            for (var key in value) obj[key] = stripMarkers(value[key]);
            return obj;
        }

        var idx = value.indexOf("<<C<<");
        if (idx != -1) return value.substr(0, idx);
        idx = value.indexOf("<<A<<");
        return idx != -1 ? value.substr(0, idx) : value;
    }

    ig.Lang = ig.SingleLoadable.extend({
        cacheType: "Lang",
        labels: {},
        _responseCount: 0,

        init: function () {
            this.parent();
        },

        /**
         * Look up a label by dot-separated path (e.g. "sc.gui.options.foo").
         */
        get: function (path) {
            var parts = path.split(".");
            var node = this.labels;
            for (var i = 0; i < parts.length; ++i) {
                node = node[parts[i]];
                if (node === undefined) return "UNKNOWN LABEL";
            }
            return stripMarkers(node);
        },

        loadInternal: function () {
            for (var i = 0; i < ig.langFileList.length; ++i) {
                var url = ig.root + ig.langFileList[i].toPath("data/lang/", "." + ig.currentLang + ".json");
                $.ajax({
                    dataType: "json",
                    url: url + ig.getCacheSuffix(),
                    context: this,
                    success: this.onload.bind(this),
                    error: this.onerror.bind(this),
                });
            }
            this._doCallback();
        },

        onerror: function () {
            this._responseCount++;
            ig.system.error(Error("Loading of a language file failed."));
            this._doCallback();
        },

        onload: function (langData) {
            this._responseCount++;
            this._doCallback();

            if (langData.DOCTYPE != "STATIC-LANG-FILE") {
                ig.system.error(Error("Language File has wrong format."));
                return;
            }

            // Walk to (or create) the feature namespace.
            var path = langData.feature.split(".");
            var namespace = this.labels;
            for (var i = 0; i < path.length; ++i) {
                var segment = path[i];
                if (!namespace[segment]) namespace[segment] = {};
                namespace = namespace[segment];
            }

            // Warn if labels are being added to a namespace that already has some.
            for (var key in namespace) {
                ig.warn("Language File adds labels to already existing name space: " + langData.feature);
                break;
            }

            for (var labelKey in langData.labels) namespace[labelKey] = langData.labels[labelKey];
        },

        /**
         * Apply grammar replacement. `[!]` in the label is replaced by `display`;
         * language-specific grammars (see `grammar` map below) may override this.
         * @param {string} label
         * @param {*} value the interpolated value (number etc.)
         * @param {*} [display] optional display string (defaults to value.toString())
         */
        grammarReplace: function (label, value, display) {
            var valueStr = value.toString();
            var displayStr = display || valueStr;
            var result;
            if (grammar[ig.currentLang]) result = grammar[ig.currentLang](label, valueStr, displayStr);
            if (!result) result = label.replace(/\[!\]/, displayStr);
            return result;
        },

        _doCallback: function () {
            if (this._responseCount == ig.langFileList.length) this.loadingFinished(true);
        },
    });

    // Hangul final-consonant (jongseong) char codes used for Korean particle
    // selection in the grammar below.
    var koreanFinalConsonants = [50, 52, 53, 57];

    // Language-specific grammar functions. Called as grammar[lang](label, valueStr, displayStr).
    var grammar = {
        ko_KR: function (label, valueStr, displayStr) {
            var lastCharCode = valueStr.charCodeAt(valueStr.length - 1);
            // Label syntax: "text[!][particleA/particleB]suffix"
            var match = /\[!\]\[(.+)\/(.+)\]/.exec(label);
            if (match) {
                var prefixLen = match[2].length + match[1].length + 6;
                var before = label.substr(0, match.index);
                var after = label.substr(match.index + prefixLen);
                var hasFinalConsonant = (lastCharCode - 44032) % 28 == 0 || koreanFinalConsonants.indexOf(lastCharCode) != -1;
                var particle = hasFinalConsonant ? match[2] : match[1];
                return before + displayStr + particle + after;
            }
            return null;
        },
    };

    ig.LangLabel = ig.Class.extend({
        value: null,
        data: null,
        langUid: null,
        originFile: null,

        init: function (data) {
            this.data = data;
            this.langUid = data.langUid || 1;
            this.value = ig.LangLabel.getText(this.data);
            this.originFile = currentOriginFile || null;
        },

        getSaveData: function () {
            return this.data;
        },

        toString: function () {
            return this.value;
        },
    });

    var currentOriginFile = null;
    ig.LangLabel.setOriginFile = function (file) {
        currentOriginFile = file;
    };
    ig.LangLabel.getOriginFile = function () {
        return currentOriginFile;
    };

    /**
     * Extract the display text for a label (object with per-lang keys, or a plain
     * string). Falls back to en_US, then "MISSING LABEL".
     * @param {Object|string} data
     * @param {boolean} [allowEmpty] if true, accept empty-string values
     */
    ig.LangLabel.getText = function (data, allowEmpty) {
        if (data && typeof data == "object") {
            var text = stripMarkers(data[ig.currentLang]);
            if ((allowEmpty ? text != undefined : text) && text != ig.currentLang) return text;
            text = stripMarkers(data.en_US);
            return (allowEmpty ? text != undefined : text) && text != "en_US" ? text : "MISSING LABEL";
        }
        return stripMarkers(data) || "MISSING LABEL";
    };

    /** Bake `{...}` variables in a label (see ig.TextParser.bakeVars). */
    ig.LangLabel.bakeVars = function (data) {
        if (typeof data == "string") return ig.TextParser.bakeVars(data);
        if (data instanceof ig.LangLabel) {
            var sourceData = data.data;
            var baked = {};
            for (var key in sourceData) {
                if (key != "langUid") baked[key] = ig.TextParser.bakeVars(stripMarkers(sourceData[key]));
            }
            return new ig.LangLabel(baked);
        }
        return data;
    };
});
