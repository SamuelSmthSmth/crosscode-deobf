ig.module("impact.base.lang").requires("impact.base.loader").defines(function() {
        function a(b) {
            if (!b) return b;
            if (b instanceof Array) {
                for (var c = [], d = b.length; d--;) c[d] = a(b[d]);
                return c
            }
            if (typeof b == "object" && !b.indexOf) {
                c = {};
                for (d in b) c[d] = a(b[d]);
                return c
            }
            c = b.indexOf("<<C<<");
            if (c != -1) return b.substr(0, c);
            c = b.indexOf("<<A<<");
            return c != -1 ? b.substr(0, c) : b
        }
        ig.Lang = ig.SingleLoadable.extend({
            cacheType: "Lang",
            labels: {},
            _responseCount: 0,
            init: function() {
                this.parent()
            },
            get: function(b) {
                for (var b = b.split("."), c = this.labels, d = 0; d < b.length; ++d) {
                    c = c[b[d]];
                    if (c === void 0) return "UNKNOWN LABEL"
                }
                return c = a(c)
            },
            loadInternal: function() {
                for (var a = 0; a < ig.langFileList.length; ++a) {
                    var b = ig.root + ig.langFileList[a].toPath("data/lang/", "." + ig.currentLang + ".json");
                    $.ajax({
                        dataType: "json",
                        url: b + ig.getCacheSuffix(),
                        context: this,
                        success: this.onload.bind(this),
                        error: this.onerror.bind(this)
                    })
                }
                this._doCallback()
            },
            onerror: function() {
                this._responseCount++;
                ig.system.error(Error("Loading of a language file failed."));
                this._doCallback()
            },
            onload: function(a) {
                this._responseCount++;
                this._doCallback();
                if (a.DOCTYPE != "STATIC-LANG-FILE") ig.system.error(Error("Language File has wrong format."));
                else {
                    for (var b = a.feature.split("."), c = this.labels, d = 0; d < b.length; ++d) {
                        var e = b[d];
                        c[e] || (c[e] = {});
                        c = c[e]
                    }
                    for (var f in c) {
                        ig.warn("Language File adds labels to already existing name space: " +
                            a.feature);
                        break
                    }
                    for (d in a.labels) c[d] = a.labels[d]
                }
            },
            grammarReplace: function(a, b, d) {
                var b = b.toString(),
                    d = d || b,
                    e;
                c[ig.currentLang] && (e = c[ig.currentLang](a, b, d));
                e || (e = a.replace(/\[!\]/, d));
                return e
            },
            _doCallback: function() {
                this._responseCount == ig.langFileList.length && this.loadingFinished(true)
            }
        });
        var b = [50, 52, 53, 57],
            c = {
                ko_KR: function(a, c, d) {
                    var e = c.charCodeAt(c.length - 1),
                        f = /\[!\]\[(.+)\/(.+)\]/.exec(a);
                    if (f) {
                        var g = f[2].length + f[1].length + 6,
                            c = a.substr(0, f.index),
                            a = a.substr(f.index + g),
                            e = (e - 44032) % 28 ==
                            0 || b.indexOf(e) != -1 ? f[2] : f[1];
                        return c + d + e + a
                    }
                    return null
                }
            };
        ig.LangLabel = ig.Class.extend({
            value: null,
            data: null,
            langUid: null,
            originFile: null,
            init: function(a) {
                this.data = a;
                this.langUid = a.langUid || 1;
                this.value = ig.LangLabel.getText(this.data);
                this.originFile = d || null
            },
            getSaveData: function() {
                return this.data
            },
            toString: function() {
                return this.value
            }
        });
        var d = null;
        ig.LangLabel.setOriginFile = function(a) {
            d = a
        };
        ig.LangLabel.getOriginFile = function() {
            return d
        };
        ig.LangLabel.getText = function(b, c) {
            if (b && typeof b == "object") {
                var d =
                    a(b[ig.currentLang]);
                if ((c ? d != void 0 : d) && d != ig.currentLang) return d;
                d = a(b.en_US);
                return (c ? d != void 0 : d) && d != "en_US" ? d : "MISSING LABEL"
            }
            return a(b) || "MISSING LABEL"
        };
        ig.LangLabel.bakeVars = function(b) {
            if (typeof b == "string") return ig.TextParser.bakeVars(b);
            if (b instanceof ig.LangLabel) {
                var b = b.data,
                    c = {},
                    d;
                for (d in b) d != "langUid" && (c[d] = ig.TextParser.bakeVars(a(b[d])));
                return new ig.LangLabel(c)
            }
            return b
        }
    });
    ig.baked = !0;
    