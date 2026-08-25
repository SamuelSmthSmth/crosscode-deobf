ig.module("impact.base.vars").defines(function() {
        var a = {},
            b = /(\][^.\][])/,
            c = ["map", "maps", "tmp", "call", "session"];
        ig.VarPathResolver = {
            path: null,
            index: 0,
            resolve: function(a) {
                if (!a) return null;
                this.path = a.trim();
                this.index = 0;
                return this._recResolve(true)
            },
            _recResolve: function(a) {
                var c = this.path.indexOf("[", this.index);
                if (c == -1 && !this.index) return this.path;
                if (this.path.match(b)) {
                    ig.warn("Invalid bracket use in condition '" + this.path + "'.\nAfter a closing bracket ']' has to be '.', ']' or '['");
                    return null
                }
                for (var d = this.path.indexOf("]", this.index), e = ""; c != -1 && c < d;) {
                    e = e + this.path.substring(this.index, c);
                    e.length > 0 && (e = e + ".");
                    this.index = c + 1;
                    c = this._recResolve(false);
                    (c = c.match(f) ? c : ig.vars._get(c)) || (c = "null");
                    e = e + c;
                    d = this.path.indexOf("]", this.index);
                    c = this.path.indexOf("[", this.index)
                }
                if (c != -1 && d == -1 || d == -1 != a) {
                    ig.warn("Invalid bracket combination in var accessor '" + this.path + "'");
                    return null
                }
                if (d != -1) {
                    d > this.index && (e = e + this.path.substring(this.index, d));
                    this.index = d + 1
                } else e = e + this.path.substring(this.index);
                return e
            }
        };
        ig.Vars = ig.Class.extend({
            currentLevelName: null,
            varAccessors: [],
            entityAccessors: [],
            storage: {
                map: {},
                maps: {},
                tmp: {},
                call: {},
                session: {
                    map: {},
                    maps: {}
                }
            },
            init: function() {},
            get: function(a) {
                a = ig.VarPathResolver.resolve(a);
                return this._get(a)
            },
            _get: function(a) {
                if (!a) return null;
                var b = this.getVarAccessor(a);
                if (b) {
                    var c = a.split(".");
                    return b.onVarAccess(a, c)
                }
                a = this._getVariable(a, false);
                return !a ? null : a.obj[a.key] == void 0 ? null : a.obj[a.key]
            },
            _getAccessObject: function(a) {
                a = ig.VarPathResolver.resolve(a);
                if (!a) return null;
                var b = this._getVariable(a, true);
                if (b.obj == this.storage && c.indexOf(b.key) != -1) {
                    ig.warn("Tried to access key that is not supported: " + a);
                    return null
                }
                return b
            },
            set: function(a, b) {
                var c = this._getAccessObject(a);
                if (!c) return null;
                if (c.obj[c.key] != b) {
                    c.obj[c.key] = b;
                    ig.game.varsChangedDeferred()
                }
            },
            setDefault: function(a, b) {
                this.get(a) == null && this.set(a, b)
            },
            add: function(a, b) {
                var c = this._getAccessObject(a);
                if (!c) return null;
                c.obj[c.key] = (c.obj[c.key] || 0) + b;
                ig.game.varsChangedDeferred()
            },
            sub: function(a,
                b) {
                var c = this._getAccessObject(a);
                if (!c) return null;
                c.obj[c.key] = (c.obj[c.key] || 0) - b;
                ig.game.varsChangedDeferred()
            },
            mul: function(a, b) {
                var c = this._getAccessObject(a);
                if (!c) return null;
                c.obj[c.key] = (c.obj[c.key] || 0) * b;
                ig.game.varsChangedDeferred()
            },
            div: function(a, b) {
                var c = this._getAccessObject(a);
                if (!c) return null;
                c.obj[c.key] = Math.floor((c.obj[c.key] || 0) / b);
                ig.game.varsChangedDeferred()
            },
            mod: function(a, b) {
                var c = this._getAccessObject(a);
                if (!c) return null;
                c.obj[c.key] = (c.obj[c.key] || 0) % b;
                ig.game.varsChangedDeferred()
            },
            and: function(a, b) {
                var c = this._getAccessObject(a);
                if (!c) return null;
                c.obj[c.key] = c.obj[c.key] && b;
                ig.game.varsChangedDeferred()
            },
            or: function(a, b) {
                var c = this._getAccessObject(a);
                if (!c) return null;
                c.obj[c.key] = c.obj[c.key] || b;
                ig.game.varsChangedDeferred()
            },
            xor: function(a, b) {
                var c = this._getAccessObject(a);
                if (!c) return null;
                var d = c.obj[c.key];
                c.obj[c.key] = (d || b) && !(d && b);
                ig.game.varsChangedDeferred()
            },
            append: function(a, b) {
                var c = this._getAccessObject(a);
                if (!c) return null;
                c.obj[c.key] = (c.obj[c.key] || "") +
                    b;
                ig.game.varsChangedDeferred()
            },
            prepend: function(a, b) {
                var c = this._getAccessObject(a);
                if (!c) return null;
                c.obj[c.key] = b + (c.obj[c.key] || "");
                ig.game.varsChangedDeferred()
            },
            setupCallScope: function(a) {
                this.storage.call = a
            },
            clear: function() {
                this.storage = {
                    map: {},
                    maps: {},
                    tmp: {},
                    call: {},
                    session: {
                        map: {},
                        maps: {}
                    }
                }
            },
            getVarAccessor: function(a) {
                var b = this.entityAccessors.last();
                if (b && a.indexOf("entity.") == 0) return b;
                for (b = this.varAccessors.length; b--;)
                    if (a.indexOf(this.varAccessors[b].domain) == 0) return this.varAccessors[b].accessor;
                return null
            },
            forwardEntityVarAccess: function(a, b, c) {
                if (!a) return null;
                if (b.length <= c) return a;
                if (a.onVarAccess) {
                    for (var d = "entity", e = ["entity"]; c < b.length; ++c) {
                        d = d + ("." + b[c]);
                        e.push(b[c])
                    }
                    return a.onVarAccess(d, e)
                }
                return null
            },
            resolveObjectAccess: function(a, b, c) {
                for (; a && c < b.length;) {
                    var d = b[c],
                        a = a[d] !== void 0 ? a[d] : null;
                    c++
                }
                return a
            },
            registerVarAccessor: function(a, b, c) {
                this.varAccessors.push({
                    domain: a + ".",
                    accessor: b,
                    editor: c || null
                })
            },
            pushEntityAccessor: function(a) {
                a.onVarAccess && this.entityAccessors.push(a)
            },
            popEntityAccessor: function(a) {
                if (a.onVarAccess) {
                    var b = this.entityAccessors.pop();
                    if (a != b) throw Error("Removed unmatching accessor! Something went wrong");
                }
            },
            _getVariable: function(b, c) {
                for (var d = b.split("."), e = this.storage, f = 0; f < d.length - 1; f++) {
                    if (!d[f]) throw Error("VarPath '" + b + "' contains empty token.");
                    if (!e[d[f]] || typeof e[d[f]] != "object")
                        if (c) e[d[f]] = {};
                        else return null;
                    e = e[d[f]]
                }
                a.obj = e;
                a.key = d[f];
                return a
            },
            onLevelChange: function(a) {
                this.currentLevelName = a = a.toCamel();
                this.storage.maps[a] || (this.storage.maps[a] = {});
                this.storage.map = this.storage.maps[a];
                this.storage.session.maps[a] || (this.storage.session.maps[a] = {});
                this.storage.tmp = {};
                this.storage.session.map = this.storage.session.maps[a]
            },
            getJson: function() {
                var a = ig.copy(this.storage);
                delete a.map;
                delete a.session;
                return {
                    levelName: this.currentLevelName,
                    storage: a
                }
            },
            clearTemp: function() {
                this.storage.tmp = {};
                ig.game.varsChangedDeferred()
            },
            restoreFromJson: function(a) {
                this.currentLevelName = a.levelName;
                this.storage = ig.copy(a.storage);
                this.storage.map = this.storage.maps[this.currentLevelName];
                this.storage.session = {
                    map: {},
                    maps: {}
                }
            }
        });
        var d = ig.Vars.prototype;
        d.get = d.get;
        d.set = d.set;
        d.add = d.add;
        d.sub = d.sub;
        d.mul = d.mul;
        d.div = d.div;
        d.mod = d.mod;
        d.and = d.and;
        d.or = d.or;
        d.xor = d.xor;
        d.append = d.append;
        var e = /^(!=|==|<=|>=|<|>|=|\+|-|%|\/|\*|AND|OR|&&|\|\|)/,
            f = /^-?\d+([.][\d]+)?/,
            g = /^(true|false|null)/,
            h = /^(\"(\\.|[^"])*\"|\'(\\.|[^'])*\')/,
            i = /^([\w/.-]|\[|\])+/,
            j = {
                source: null,
                vars: null,
                index: 0,
                searchedIndex: 0,
                tokenType: 0,
                tokenValue: null,
                parse: function(a, b) {
                    this.source = a;
                    this.vars = b;
                    this.index = 0;
                    return this._parseExpression()
                },
                _parseExpression: function() {
                    var a = this._parseTerminalExpression();
                    this._checkToken();
                    if (this.tokenType == 0 || this.tokenType == 2) return a;
                    if (this.tokenType == 8) {
                        this._stepToken();
                        return a + " " + this.tokenValue + " " + this._parseExpression()
                    }
                    throw Error("Unexpected token '" + this.tokenValue + "' when parsing expression");
                },
                _parseTerminalExpression: function() {
                    this._checkToken(true);
                    this._stepToken();
                    if (this.tokenType == 1) {
                        var a = this._parseExpression();
                        this._checkToken();
                        if (this.tokenType != 2) throw Error("Didn't close an open paranthesis! Bad!!");
                        this._stepToken();
                        return "(" + a + ")"
                    }
                    if (this.tokenType == 7) return "!" + this._parseTerminalExpression();
                    if (this.tokenType == 4 || this.tokenType == 6 || this.tokenType == 5) return this.tokenValue;
                    if (this.tokenType == 3) {
                        this.vars.push(this.tokenValue);
                        return "ig.vars.get('" + this.tokenValue + "')"
                    }
                    throw Error("Unsupported Token: '" + this.tokenValue + "' during terminal expression parsing");
                },
                _checkToken: function(a) {
                    for (var b = this.index, c = this.source; c[b] == " ";) b++;
                    if (b >= c.length) {
                        this.tokenType = 0;
                        this.tokenValue = null
                    } else if (c[b] ==
                        "(") {
                        this.tokenType = 1;
                        this.tokenValue = "(";
                        b++
                    } else if (c[b] == ")") {
                        this.tokenType = 2;
                        this.tokenValue = ")";
                        b++
                    } else if (c[b] == "!" && c[b + 1] != "=") {
                        this.tokenType = 7;
                        this.tokenValue = "!";
                        b++
                    } else {
                        var c = c.substr(b),
                            d;
                        if (!a && (d = c.match(e))) {
                            d = d[0];
                            b = b + d.length;
                            this.tokenType = 8;
                            d == "AND" ? d = "&&" : d == "OR" ? d = "||" : d == "=" && (d = "==");
                            this.tokenValue = d
                        } else if (d = c.match(f)) {
                            d = d[0];
                            this.tokenType = 4;
                            this.tokenValue = d;
                            b = b + d.length
                        } else if (d = c.match(h)) {
                            d = d[0];
                            this.tokenType = 6;
                            this.tokenValue = d;
                            b = b + d.length
                        } else if (d = c.match(g)) {
                            d =
                                d[0];
                            this.tokenType = 5;
                            this.tokenValue = d;
                            b = b + d.length
                        } else if (d = c.match(i)) {
                            d = d[0];
                            this.tokenType = 3;
                            this.tokenValue = d;
                            b = b + d.length
                        } else throw Error("Could not parse next token of '" + c + "'");
                    }
                    this.searchedIndex = b
                },
                _stepToken: function() {
                    this.index = this.searchedIndex
                }
            };
        ig.VarCondition = ig.Class.extend({
            condition: null,
            code: "",
            pretty: "",
            vars: [],
            init: function(a) {
                this.setCondition(a)
            },
            setCondition: function(a) {
                if (!a || a.trim().length == 0) this.code = this.pretty = "true";
                else try {
                    this.pretty = a = a.replace(/(?:\r\n|\r|\n)/g,
                        "");
                    this.code = j.parse(a, this.vars)
                } catch (b) {
                    ig.log("CONDITION PARSING ERROR: " + b);
                    this.pretty = "ERROR: " + b;
                    this.code = "false";
                    this.vars = []
                }
                this.condition = new Function(" return " + this.code)
            },
            evaluate: function() {
                try {
                    return !!this.condition.call()
                } catch (a) {
                    ig.log("Condition evaluation failed: " + this.condition);
                    return false
                }
            },
            toString: function() {
                return this.pretty
            }
        })
    });
    ig.baked = !0;
    