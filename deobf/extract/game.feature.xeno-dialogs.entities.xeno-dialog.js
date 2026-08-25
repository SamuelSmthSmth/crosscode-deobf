ig.module("game.feature.xeno-dialogs.entities.xeno-dialog").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    var b = 80,
        a = 200,
        d = 120,
        c = a,
        b = b * b,
        a = a * a,
        d = d * d,
        e = [];
    ig.LANG_CONTEXT.XenoDialog = function(a) {
        return "XENO_DIALOG[" + (a.settings.name || "") + "]"
    };
    ig.ENTITY.XenoDialog = ig.Entity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "optional spawn condition, leave empty for true",
                    _popup: true
                },
                dialog: {
                    _type: "XenoDialog",
                    _info: "The dialog"
                },
                ignoreZ: {
                    _type: "Boolean",
                    _info: "If true, ignore Z pos when checking range",
                    _optional: true,
                    _default: true
                },
                endlessDialog: {
                    _type: "Boolean",
                    _info: "if true, skip dialog wait after dialog has been completed resulting in an endless dialog loop"
                },
                once: {
                    _type: "Boolean",
                    _info: "Only play this dialog once."
                }
            },
            drawBox: true,
            draw: function(a, b) {
                if (!wm.mapConfig.boxDraw.hidden) {
                    if (b.members && b.members.length == 0) b.members = null;
                    b._initMembers();
                    if (a)
                        for (var d = b.members.length; d--;) b.sprites.push(ig.spritePool.get(false));
                    else if (b.members && b.sprites.length != 1)
                        for (var e = null, j = null, d = b.members.length, k = 2, l = b.coll.pos.x + b.coll.size.x / 2, o = b.coll.pos.y + b.coll.size.y / 2 - b.coll.pos.z; d--;)
                            if (b.members[d]) {
                                e = b.members[d].coll;
                                j = b.sprites[b.sprites.length - k];
                                k++;
                                if (j) {
                                    j.setPos(e.pos.x, e.pos.y, e.pos.z);
                                    j.setSize(16, 16, 0);
                                    j.setImageSrc(new ig.ComplexLineCircleBox("rgba(128,0,128, 0.5)", "rgba(200, 200, 200, 0.1)", l, o, c))
                                }
                            }
                }
            },
            boxColor: "rgba(128,0,128, 0.5)",
            label: function() {
                return ""
            }
        }),
        dialog: null,
        members: null,
        running: false,
        blockTimer: 0,
        padTimer: 0,
        currentTextIndex: -1,
        currentEntity: null,
        currentText: "",
        currentEvent: null,
        fx: {
            sheet: new ig.EffectSheet("npc"),
            handle: null
        },
        once: false,
        hasRunOnce: false,
        ignoreZ: false,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.setSize(16, 16, 0);
            this.coll.type = ig.COLLTYPE.IGNORE;
            this.endlessDialog = d.endlessDialog;
            this.once = d.once || false;
            this.ignoreZ = d.ignoreZ || false;
            if (this.once && ig.vars.get("map.xeno-dialog-once_" + this.mapId)) this.hasRunOnce = true;
            this.dialog = [];
            a = d.dialog;
            for (b = 0; b < a.length; b++)
                if (c =
                    a[b]) {
                    c = {
                        entitySource: c.entity,
                        text: new ig.LangLabel(c.text),
                        event: c.event ? new ig.Event({
                            steps: c.event
                        }) : null,
                        entity: null,
                        timePadding: c.timePadding
                    };
                    ig.langEdit && ig.langEdit.submitMap("Xeno MSG " + (c.entitySource && c.entitySource.name), c.text);
                    this.dialog.push(c)
                }
        },
        onHideRequest: function() {
            this.cancelDialog();
            this.hide()
        },
        onKill: function(a) {
            this.cancelDialog();
            this.parent(a)
        },
        update: function() {
            this.parent();
            this._initMembers();
            var c = !sc.model.isCutscene() && this.currentEntity && this.currentEvent && !sc.model.isCombatActive();
            c && !this.fx.handle ? this._showFx() : !c && this.fx.handle && this._clearFx();
            if (!ig.game.isControlBlocked() && !sc.model.isCutscene())
                if (this.blockTimer > 0) this.blockTimer = this.blockTimer - ig.system.tick;
                else if (!this.once || !this.hasRunOnce)
                if (this.running)
                    if (this.currentTextIndex == -1 ? this._isInRange(d) : this._isInRange(a)) {
                        if (this.padTimer > 0) this.padTimer = this.padTimer - ig.system.tick;
                        this.padTimer <= 0 && this._showNextMessage()
                    } else this.cancelDialog();
            else this._isInRange(b, !this.ignoreZ) && this.startDialog()
        },
        startDialog: function() {
            for (var a = e.length; a--;) e[a].cancelDialog();
            this.running = true;
            e.push(this)
        },
        cancelDialog: function() {
            if (this.currentTextIndex >= this.dialog.length && this.once) {
                ig.vars.set("map.xeno-dialog-once_" + this.mapId, true);
                this.hasRunOnce = true
            }
            this._clearFx();
            this.running = false;
            this._clearCurrentIndex();
            this.currentTextIndex = -1;
            this.padTimer = 0;
            e.erase(this)
        },
        getCurrentText: function() {
            return this.currentText || "Hello World"
        },
        getCallbackEvent: function() {
            return this.currentEvent
        },
        onEventStart: function() {
            this._clearFx();
            this.running = false;
            this._clearCurrentIndex();
            this.blockTimer = 1;
            this.currentTextIndex = -1;
            this.padTimer = 0
        },
        onEventEnd: function() {
            this.blockTimer = 1;
            this.cancelDialog()
        },
        _clearFx: function() {
            if (this.fx.handle) {
                this.fx.handle.stop();
                this.fx.handle = null
            }
        },
        _showFx: function() {
            if (sc.options.get("xeno-pointer")) this.fx.handle = this.fx.sheet.spawnOnTarget("xenoAlert", ig.game.playerEntity, {
                duration: -1,
                target2: this.currentEntity,
                offset: {
                    x: 0,
                    y: 0,
                    z: 12
                },
                target2Offset: {
                    x: 0,
                    y: 0,
                    z: 12
                }
            })
        },
        _showNextMessage: function() {
            this._clearCurrentIndex();
            this._clearFx();
            this.currentTextIndex++;
            if (this.currentTextIndex >= this.dialog.length) {
                if (this.once) {
                    this.running = false;
                    ig.vars.set("map.xeno-dialog-once_" + this.mapId, true);
                    this.hasRunOnce = true
                }
                if (this.endlessDialog) this.currentTextIndex = 0;
                else {
                    this.currentTextIndex = -1;
                    this.padTimer = 2;
                    return true
                }
            }
            var a = this.dialog[this.currentTextIndex];
            this.currentEntity = a.entity;
            this.currentEvent = a.event;
            this.currentText = a.text;
            ig.langEdit && ig.langEdit.submitRecent("Xeno MSG " + (a.entitySource && a.entitySource.name),
                a.text);
            this.currentEntity.setXenoDialog(this);
            this.padTimer = a.timePadding == void 0 ? Math.max(1.5, this.currentText.toString().length / 25 * 1.1 + 1.2) : this.currentText.toString().length * 0.03 + a.timePadding;
            if (this.currentEvent) this.padTimer = this.padTimer + 2;
            return false
        },
        _clearCurrentIndex: function() {
            if (!(this.currentTextIndex < 0)) {
                this.currentEntity.cancelXenoDialog();
                this.currentEvent = this.currentText = this.currentEntity = null
            }
        },
        _isInRange: function(a, b) {
            for (var c = ig.game.playerEntity.coll, d = this.members.length,
                    e = null, k = 0, e = 0; d--;) {
                e = this.members[d].coll;
                if (!(b && c.pos.z != e.baseZPos)) {
                    k = c.pos.x + c.size.x / 2 - (e.pos.x + e.size.x / 2);
                    e = c.pos.y + c.size.y / 2 - (e.pos.y + e.size.y / 2);
                    if (k * k + e * e <= a) return true
                }
            }
            return false
        },
        _initMembers: function() {
            if (!this.members) {
                this.members = [];
                for (var a = this.dialog.length, b = null, c = null; a--;) {
                    b = this.dialog[a];
                    (c = ig.Event.getEntity(b.entitySource)) && this.members.indexOf(c) == -1 && this.members.push(c);
                    b.entity = c || null
                }
            }
        }
    })
});
ig.baked = !0;
