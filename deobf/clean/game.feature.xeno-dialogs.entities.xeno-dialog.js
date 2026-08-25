/**
 * @module game.feature.xeno-dialogs.entities.xeno-dialog
 *
 * Entity that triggers a xeno dialog (spoken message sequence) when the
 * player gets close. Plays messages in sequence with optional attached
 * events, an endless loop mode, a once-only mode, and a range check that
 * can optionally ignore Z. Shows a pointer effect toward the speaking
 * entity while an event is attached.
 */
ig.module("game.feature.xeno-dialogs.entities.xeno-dialog").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    var IN_RANGE_SQUARED = 80,
        TEXT_RANGE = 200,
        START_RANGE = 120,
        DRAW_RANGE = TEXT_RANGE,
        IN_RANGE_SQUARED = IN_RANGE_SQUARED * IN_RANGE_SQUARED,
        TEXT_RANGE = TEXT_RANGE * TEXT_RANGE,
        START_RANGE = START_RANGE * START_RANGE,
        ACTIVE_DIALOGS = [];
    ig.LANG_CONTEXT.XenoDialog = function(entity) {
        return "XENO_DIALOG[" + (entity.settings.name || "") + "]"
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
            draw: function(showBox, entity) {
                if (!wm.mapConfig.boxDraw.hidden) {
                    if (entity.members && entity.members.length == 0) entity.members = null;
                    entity._initMembers();
                    if (showBox)
                        for (var i = entity.members.length; i--;) entity.sprites.push(ig.spritePool.get(false));
                    else if (entity.members && entity.sprites.length != 1)
                        for (var member = null, sprite = null, i = entity.members.length, spriteIndex = 2, centerX = entity.coll.pos.x + entity.coll.size.x / 2, centerY = entity.coll.pos.y + entity.coll.size.y / 2 - entity.coll.pos.z; i--;)
                            if (entity.members[i]) {
                                member = entity.members[i].coll;
                                sprite = entity.sprites[entity.sprites.length - spriteIndex];
                                spriteIndex++;
                                if (sprite) {
                                    sprite.setPos(member.pos.x, member.pos.y, member.pos.z);
                                    sprite.setSize(16, 16, 0);
                                    sprite.setImageSrc(new ig.ComplexLineCircleBox("rgba(128,0,128, 0.5)", "rgba(200, 200, 200, 0.1)", centerX, centerY, DRAW_RANGE))
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
        init: function(x, y, settings, extraSettings) {
            this.parent(x, y, settings, extraSettings);
            this.coll.setSize(16, 16, 0);
            this.coll.type = ig.COLLTYPE.IGNORE;
            this.endlessDialog = extraSettings.endlessDialog;
            this.once = extraSettings.once || false;
            this.ignoreZ = extraSettings.ignoreZ || false;
            if (this.once && ig.vars.get("map.xeno-dialog-once_" + this.mapId)) this.hasRunOnce = true;
            this.dialog = [];
            var dialogSettings = extraSettings.dialog;
            for (var i = 0; i < dialogSettings.length; i++)
                if (entry =
                    dialogSettings[i]) {
                    entry = {
                        entitySource: entry.entity,
                        text: new ig.LangLabel(entry.text),
                        event: entry.event ? new ig.Event({
                            steps: entry.event
                        }) : null,
                        entity: null,
                        timePadding: entry.timePadding
                    };
                    ig.langEdit && ig.langEdit.submitMap("Xeno MSG " + (entry.entitySource && entry.entitySource.name), entry.text);
                    this.dialog.push(entry)
                }
        },
        onHideRequest: function() {
            this.cancelDialog();
            this.hide()
        },
        onKill: function(silent) {
            this.cancelDialog();
            this.parent(silent)
        },
        update: function() {
            this.parent();
            this._initMembers();
            var showFx = !sc.model.isCutscene() && this.currentEntity && this.currentEvent && !sc.model.isCombatActive();
            showFx && !this.fx.handle ? this._showFx() : !showFx && this.fx.handle && this._clearFx();
            if (!ig.game.isControlBlocked() && !sc.model.isCutscene())
                if (this.blockTimer > 0) this.blockTimer = this.blockTimer - ig.system.tick;
                else if (!this.once || !this.hasRunOnce)
                if (this.running)
                    if (this.currentTextIndex == -1 ? this._isInRange(START_RANGE) : this._isInRange(TEXT_RANGE)) {
                        if (this.padTimer > 0) this.padTimer = this.padTimer - ig.system.tick;
                        this.padTimer <= 0 && this._showNextMessage()
                    } else this.cancelDialog();
            else this._isInRange(IN_RANGE_SQUARED, !this.ignoreZ) && this.startDialog()
        },
        startDialog: function() {
            for (var i = ACTIVE_DIALOGS.length; i--;) ACTIVE_DIALOGS[i].cancelDialog();
            this.running = true;
            ACTIVE_DIALOGS.push(this)
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
            ACTIVE_DIALOGS.erase(this)
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
            var entry = this.dialog[this.currentTextIndex];
            this.currentEntity = entry.entity;
            this.currentEvent = entry.event;
            this.currentText = entry.text;
            ig.langEdit && ig.langEdit.submitRecent("Xeno MSG " + (entry.entitySource && entry.entitySource.name),
                entry.text);
            this.currentEntity.setXenoDialog(this);
            this.padTimer = entry.timePadding == void 0 ? Math.max(1.5, this.currentText.toString().length / 25 * 1.1 + 1.2) : this.currentText.toString().length * 0.03 + entry.timePadding;
            if (this.currentEvent) this.padTimer = this.padTimer + 2;
            return false
        },
        _clearCurrentIndex: function() {
            if (!(this.currentTextIndex < 0)) {
                this.currentEntity.cancelXenoDialog();
                this.currentEvent = this.currentText = this.currentEntity = null
            }
        },
        _isInRange: function(maxRangeSquared, checkZ) {
            for (var playerColl = ig.game.playerEntity.coll, i = this.members.length,
                    memberColl = null, distX = 0, distY = 0, distY = 0; i--;) {
                memberColl = this.members[i].coll;
                if (!(checkZ && playerColl.pos.z != memberColl.baseZPos)) {
                    distX = playerColl.pos.x + playerColl.size.x / 2 - (memberColl.pos.x + memberColl.size.x / 2);
                    distY = playerColl.pos.y + playerColl.size.y / 2 - (memberColl.pos.y + memberColl.size.y / 2);
                    if (distX * distX + distY * distY <= maxRangeSquared) return true
                }
            }
            return false
        },
        _initMembers: function() {
            if (!this.members) {
                this.members = [];
                for (var i = this.dialog.length, entry = null, entity = null; i--;) {
                    entry = this.dialog[i];
                    (entity = ig.Event.getEntity(entry.entitySource)) && this.members.indexOf(entity) == -1 && this.members.push(entity);
                    entry.entity = entity || null
                }
            }
        }
    })
});
ig.baked = !0;
