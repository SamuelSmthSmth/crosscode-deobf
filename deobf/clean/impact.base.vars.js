/**
 * impact.base.vars
 * ================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.vars")`.
 *
 * The variable system. `ig.Vars` is a hierarchical store (map / maps / tmp /
 * call / session) addressed by dot/bracket paths, with registered accessors for
 * dynamic namespaces (`system.*`, `extension.*`, `entity.*`). `ig.VarCondition`
 * compiles a condition expression string into executable JS that reads vars.
 */
ig.module("impact.base.vars").defines(function () {

    var varAccessResult = {};          // shared { obj, key } result holder
    var invalidBracketRegex = /(\][^.\][])/;
    var protectedStorageKeys = ["map", "maps", "tmp", "call", "session"];

    /**
     * Resolves a var path (e.g. "tmp.foo[bar]") into a flat dot-separated path,
     * evaluating bracket contents as var references (or numeric literals).
     */
    ig.VarPathResolver = {
        path: null,
        index: 0,

        resolve: function (path) {
            if (!path) return null;
            this.path = path.trim();
            this.index = 0;
            return this._recResolve(true);
        },

        _recResolve: function (isRoot) {
            var openIdx = this.path.indexOf("[", this.index);
            if (openIdx == -1 && !this.index) return this.path;
            if (this.path.match(invalidBracketRegex)) {
                ig.warn("Invalid bracket use in condition '" + this.path + "'.\nAfter a closing bracket ']' has to be '.', ']' or '['");
                return null;
            }

            var closeIdx = this.path.indexOf("]", this.index);
            var result = "";
            while (openIdx != -1 && openIdx < closeIdx) {
                result = result + this.path.substring(this.index, openIdx);
                if (result.length > 0) result = result + ".";
                this.index = openIdx + 1;
                var bracketContent = this._recResolve(false);
                // Numeric literal or a var reference to resolve.
                bracketContent = bracketContent.match(numberRegex) ? bracketContent : ig.vars._get(bracketContent);
                if (!bracketContent) bracketContent = "null";
                result = result + bracketContent;
                closeIdx = this.path.indexOf("]", this.index);
                openIdx = this.path.indexOf("[", this.index);
            }

            if ((openIdx != -1 && closeIdx == -1) || (closeIdx == -1) != isRoot) {
                ig.warn("Invalid bracket combination in var accessor '" + this.path + "'");
                return null;
            }

            if (closeIdx != -1) {
                if (closeIdx > this.index) result = result + this.path.substring(this.index, closeIdx);
                this.index = closeIdx + 1;
            } else {
                result = result + this.path.substring(this.index);
            }
            return result;
        },
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
            session: { map: {}, maps: {} },
        },

        init: function () {},

        get: function (path) {
            path = ig.VarPathResolver.resolve(path);
            return this._get(path);
        },

        _get: function (path) {
            if (!path) return null;
            var accessor = this.getVarAccessor(path);
            if (accessor) {
                var parts = path.split(".");
                return accessor.onVarAccess(path, parts);
            }
            var variable = this._getVariable(path, false);
            if (!variable) return null;
            return variable.obj[variable.key] == undefined ? null : variable.obj[variable.key];
        },

        _getAccessObject: function (path) {
            path = ig.VarPathResolver.resolve(path);
            if (!path) return null;
            var variable = this._getVariable(path, true);
            if (variable.obj == this.storage && protectedStorageKeys.indexOf(variable.key) != -1) {
                ig.warn("Tried to access key that is not supported: " + path);
                return null;
            }
            return variable;
        },

        set: function (path, value) {
            var variable = this._getAccessObject(path);
            if (!variable) return null;
            if (variable.obj[variable.key] != value) {
                variable.obj[variable.key] = value;
                ig.game.varsChangedDeferred();
            }
        },

        setDefault: function (path, value) {
            if (this.get(path) == null) this.set(path, value);
        },

        add: function (path, value) {
            var variable = this._getAccessObject(path);
            if (!variable) return null;
            variable.obj[variable.key] = (variable.obj[variable.key] || 0) + value;
            ig.game.varsChangedDeferred();
        },

        sub: function (path, value) {
            var variable = this._getAccessObject(path);
            if (!variable) return null;
            variable.obj[variable.key] = (variable.obj[variable.key] || 0) - value;
            ig.game.varsChangedDeferred();
        },

        mul: function (path, value) {
            var variable = this._getAccessObject(path);
            if (!variable) return null;
            variable.obj[variable.key] = (variable.obj[variable.key] || 0) * value;
            ig.game.varsChangedDeferred();
        },

        div: function (path, value) {
            var variable = this._getAccessObject(path);
            if (!variable) return null;
            variable.obj[variable.key] = Math.floor((variable.obj[variable.key] || 0) / value);
            ig.game.varsChangedDeferred();
        },

        mod: function (path, value) {
            var variable = this._getAccessObject(path);
            if (!variable) return null;
            variable.obj[variable.key] = (variable.obj[variable.key] || 0) % value;
            ig.game.varsChangedDeferred();
        },

        and: function (path, value) {
            var variable = this._getAccessObject(path);
            if (!variable) return null;
            variable.obj[variable.key] = variable.obj[variable.key] && value;
            ig.game.varsChangedDeferred();
        },

        or: function (path, value) {
            var variable = this._getAccessObject(path);
            if (!variable) return null;
            variable.obj[variable.key] = variable.obj[variable.key] || value;
            ig.game.varsChangedDeferred();
        },

        xor: function (path, value) {
            var variable = this._getAccessObject(path);
            if (!variable) return null;
            var current = variable.obj[variable.key];
            variable.obj[variable.key] = (current || value) && !(current && value);
            ig.game.varsChangedDeferred();
        },

        append: function (path, value) {
            var variable = this._getAccessObject(path);
            if (!variable) return null;
            variable.obj[variable.key] = (variable.obj[variable.key] || "") + value;
            ig.game.varsChangedDeferred();
        },

        prepend: function (path, value) {
            var variable = this._getAccessObject(path);
            if (!variable) return null;
            variable.obj[variable.key] = value + (variable.obj[variable.key] || "");
            ig.game.varsChangedDeferred();
        },

        setupCallScope: function (callStorage) {
            this.storage.call = callStorage;
        },

        clear: function () {
            this.storage = {
                map: {},
                maps: {},
                tmp: {},
                call: {},
                session: { map: {}, maps: {} },
            };
        },

        /** Find the accessor that owns a path's domain (or the entity accessor). */
        getVarAccessor: function (path) {
            var entityAccessor = this.entityAccessors.last();
            if (entityAccessor && path.indexOf("entity.") == 0) return entityAccessor;
            for (var i = this.varAccessors.length; i--;) {
                if (path.indexOf(this.varAccessors[i].domain) == 0) return this.varAccessors[i].accessor;
            }
            return null;
        },

        forwardEntityVarAccess: function (accessor, pathParts, startIndex) {
            if (!accessor) return null;
            if (pathParts.length <= startIndex) return accessor;
            if (accessor.onVarAccess) {
                var joined = "entity";
                var parts = ["entity"];
                for (var i = startIndex; i < pathParts.length; ++i) {
                    joined = joined + ("." + pathParts[i]);
                    parts.push(pathParts[i]);
                }
                return accessor.onVarAccess(joined, parts);
            }
            return null;
        },

        resolveObjectAccess: function (obj, pathParts, startIndex) {
            for (; obj && startIndex < pathParts.length;) {
                var key = pathParts[startIndex];
                obj = obj[key] !== undefined ? obj[key] : null;
                startIndex++;
            }
            return obj;
        },

        registerVarAccessor: function (domain, accessor, editor) {
            this.varAccessors.push({
                domain: domain + ".",
                accessor: accessor,
                editor: editor || null,
            });
        },

        pushEntityAccessor: function (accessor) {
            if (accessor.onVarAccess) this.entityAccessors.push(accessor);
        },

        popEntityAccessor: function (accessor) {
            if (accessor.onVarAccess) {
                var popped = this.entityAccessors.pop();
                if (accessor != popped) throw Error("Removed unmatching accessor! Something went wrong");
            }
        },

        /**
         * Walk a dot-path to its { obj, key } pair, creating intermediate objects
         * when `createIfMissing` is set.
         */
        _getVariable: function (path, createIfMissing) {
            var parts = path.split(".");
            var obj = this.storage;
            for (var i = 0; i < parts.length - 1; i++) {
                if (!parts[i]) throw Error("VarPath '" + path + "' contains empty token.");
                if (!obj[parts[i]] || typeof obj[parts[i]] != "object") {
                    if (createIfMissing) obj[parts[i]] = {};
                    else return null;
                }
                obj = obj[parts[i]];
            }
            varAccessResult.obj = obj;
            varAccessResult.key = parts[i];
            return varAccessResult;
        },

        onLevelChange: function (levelName) {
            this.currentLevelName = levelName = levelName.toCamel();
            if (!this.storage.maps[levelName]) this.storage.maps[levelName] = {};
            this.storage.map = this.storage.maps[levelName];
            if (!this.storage.session.maps[levelName]) this.storage.session.maps[levelName] = {};
            this.storage.tmp = {};
            this.storage.session.map = this.storage.session.maps[levelName];
        },

        getJson: function () {
            var storage = ig.copy(this.storage);
            delete storage.map;
            delete storage.session;
            return {
                levelName: this.currentLevelName,
                storage: storage,
            };
        },

        clearTemp: function () {
            this.storage.tmp = {};
            ig.game.varsChangedDeferred();
        },

        restoreFromJson: function (json) {
            this.currentLevelName = json.levelName;
            this.storage = ig.copy(json.storage);
            this.storage.map = this.storage.maps[this.currentLevelName];
            this.storage.session = { map: {}, maps: {} };
        },
    });

    // Stable named re-exports (anti-mangling glue).
    var proto = ig.Vars.prototype;
    proto.get = proto.get;
    proto.set = proto.set;
    proto.add = proto.add;
    proto.sub = proto.sub;
    proto.mul = proto.mul;
    proto.div = proto.div;
    proto.mod = proto.mod;
    proto.and = proto.and;
    proto.or = proto.or;
    proto.xor = proto.xor;
    proto.append = proto.append;

    // --- condition expression tokenizer/parser ---
    var operatorRegex = /^(!=|==|<=|>=|<|>|=|\+|-|%|\/|\*|AND|OR|&&|\|\|)/;
    var numberRegex = /^-?\d+([.][\d]+)?/;
    var literalRegex = /^(true|false|null)/;
    var stringRegex = /^("(\\.|[^"])*"|'(\\.|[^'])*')/;
    var identifierRegex = /^([\w/.-]|\[|\])+/;

    // tokenType: 0=end, 1='(', 2=')', 3=identifier, 4=number, 5=literal, 6=string, 7='!', 8=operator
    var expressionParser = {
        source: null,
        vars: null,
        index: 0,
        searchedIndex: 0,
        tokenType: 0,
        tokenValue: null,

        parse: function (source, vars) {
            this.source = source;
            this.vars = vars;
            this.index = 0;
            return this._parseExpression();
        },

        _parseExpression: function () {
            var expr = this._parseTerminalExpression();
            this._checkToken();
            if (this.tokenType == 0 || this.tokenType == 2) return expr;
            if (this.tokenType == 8) {
                this._stepToken();
                return expr + " " + this.tokenValue + " " + this._parseExpression();
            }
            throw Error("Unexpected token '" + this.tokenValue + "' when parsing expression");
        },

        _parseTerminalExpression: function () {
            this._checkToken(true);
            this._stepToken();
            if (this.tokenType == 1) {
                var inner = this._parseExpression();
                this._checkToken();
                if (this.tokenType != 2) throw Error("Didn't close an open paranthesis! Bad!!");
                this._stepToken();
                return "(" + inner + ")";
            }
            if (this.tokenType == 7) return "!" + this._parseTerminalExpression();
            if (this.tokenType == 4 || this.tokenType == 6 || this.tokenType == 5) return this.tokenValue;
            if (this.tokenType == 3) {
                this.vars.push(this.tokenValue);
                return "ig.vars.get('" + this.tokenValue + "')";
            }
            throw Error("Unsupported Token: '" + this.tokenValue + "' during terminal expression parsing");
        },

        _checkToken: function (isFirst) {
            var pos = this.index;
            var source = this.source;
            while (source[pos] == " ") pos++;

            if (pos >= source.length) {
                this.tokenType = 0;
                this.tokenValue = null;
            } else if (source[pos] == "(") {
                this.tokenType = 1;
                this.tokenValue = "(";
                pos++;
            } else if (source[pos] == ")") {
                this.tokenType = 2;
                this.tokenValue = ")";
                pos++;
            } else if (source[pos] == "!" && source[pos + 1] != "=") {
                this.tokenType = 7;
                this.tokenValue = "!";
                pos++;
            } else {
                var rest = source.substr(pos);
                var match;
                if (!isFirst && (match = rest.match(operatorRegex))) {
                    match = match[0];
                    pos = pos + match.length;
                    this.tokenType = 8;
                    if (match == "AND") match = "&&";
                    else if (match == "OR") match = "||";
                    else if (match == "=") match = "==";
                    this.tokenValue = match;
                } else if (match = rest.match(numberRegex)) {
                    match = match[0];
                    this.tokenType = 4;
                    this.tokenValue = match;
                    pos = pos + match.length;
                } else if (match = rest.match(stringRegex)) {
                    match = match[0];
                    this.tokenType = 6;
                    this.tokenValue = match;
                    pos = pos + match.length;
                } else if (match = rest.match(literalRegex)) {
                    match = match[0];
                    this.tokenType = 5;
                    this.tokenValue = match;
                    pos = pos + match.length;
                } else if (match = rest.match(identifierRegex)) {
                    match = match[0];
                    this.tokenType = 3;
                    this.tokenValue = match;
                    pos = pos + match.length;
                } else {
                    throw Error("Could not parse next token of '" + rest + "'");
                }
            }
            this.searchedIndex = pos;
        },

        _stepToken: function () {
            this.index = this.searchedIndex;
        },
    };

    ig.VarCondition = ig.Class.extend({
        condition: null,
        code: "",
        pretty: "",
        vars: [],

        init: function (condition) {
            this.setCondition(condition);
        },

        /** Compile a condition expression string into executable JS. */
        setCondition: function (condition) {
            if (!condition || condition.trim().length == 0) {
                this.code = this.pretty = "true";
            } else {
                try {
                    this.pretty = condition = condition.replace(/(?:\r\n|\r|\n)/g, "");
                    this.code = expressionParser.parse(condition, this.vars);
                } catch (err) {
                    ig.log("CONDITION PARSING ERROR: " + err);
                    this.pretty = "ERROR: " + err;
                    this.code = "false";
                    this.vars = [];
                }
            }
            this.condition = new Function(" return " + this.code);
        },

        evaluate: function () {
            try {
                return !!this.condition.call();
            } catch (err) {
                ig.log("Condition evaluation failed: " + this.condition);
                return false;
            }
        },

        toString: function () {
            return this.pretty;
        },
    });
});
