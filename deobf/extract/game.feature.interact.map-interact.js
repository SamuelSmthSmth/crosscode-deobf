ig.module("game.feature.interact.map-interact").requires("impact.base.game", "game.feature.model.game-model", "game.feature.interact.gui.interact-gui").defines(function() {
    var b = {
            dist: 1,
            dir: {
                x: 0,
                y: 0
            }
        },
        a = [],
        d = Vec2.create(),
        c = Vec2.create(),
        e = Vec2.create(),
        f = Vec2.create(),
        g = {},
        h = Vec2.create();
    sc.INTERACT_Z_CONDITION = {
        SAME_Z: 1,
        Z_RANGE_OVERLAP: 2
    };
    sc.INTERACT_ENTRY_STATE = {
        HIDDEN: 0,
        AWAY: 1,
        NEAR: 2,
        BLOCKED: 3,
        FOCUS: 4,
        RUNNING: 5
    };
    sc.MapInteract = ig.GameAddon.extend({
        entries: [],
        focusEntry: null,
        interacting: false,
        hidden: false,
        init: function() {
            this.parent("MapInteract")
        },
        addEntry: function(a) {
            if (this.entries.indexOf(a) == -1) {
                this.entries.push(a);
                ig.gui.addGuiElement(a.gui)
            }
        },
        removeEntry: function(a) {
            a.gui.remove();
            this.entries.erase(a)
        },
        preUpdateOrder: 0,
        onPreUpdate: function() {
            var g = !sc.control.interactDown(),
                j = true;
            if (!ig.game.paused) {
                this.updateHideStatus();
                if (this.hidden) {
                    g = true;
                    j = false
                }
                var k = ig.game.playerEntity;
                if (k) k.getCenter(f);
                else {
                    g = true;
                    j = false
                }
                if (this.interacting)
                    if (g) {
                        if (this.focusEntry.handler.onInteractionEnd) this.focusEntry.handler.onInteractionEnd();
                        this.focusEntry = null;
                        this.interacting = false
                    } else j = false;
                else this.focusEntry = null;
                for (var g = -1, l = this.entries.length, o; l--;) {
                    var m = this.entries[l],
                        n = m.entity;
                    if (n._killed) this.removeEntry(m);
                    else if (j) {
                        o = sc.INTERACT_ENTRY_STATE.AWAY;
                        if (m.blockedDuringCombat && sc.model.isCombatActive()) o = sc.INPUT_FORCER_ENTRIES.HIDDEN;
                        else if (ig.EntityTools.isInScreen(n, 16)) {
                            n.getCenter(c);
                            Vec2.sub(c, f, e);
                            var p = false;
                            m.zCondition == sc.INTERACT_Z_CONDITION.SAME_Z ? p = Math.abs(k.coll.pos.z - n.coll.pos.z) <= ig.COLLISION.HEIGHT_TOLERATE :
                                m.zCondition == sc.INTERACT_Z_CONDITION.Z_RANGE_OVERLAP && (p = n.coll.pos.z + n.coll.size.z >= k.coll.pos.z && k.coll.pos.z + k.coll.size.z >= n.coll.pos.z);
                            k.coll.pos.z > k.coll.baseZPos && (p = false);
                            var r = Vec2.length(e);
                            if (p && r <= 40 + n.coll.size.y / 2 && (!m.interrupting || ig.game.isInterruptible() && !sc.model.isMapLeaveBlocked()) && !k.interactObject) {
                                b.dist = 1;
                                b.dir.x = 0;
                                b.dir.y = 0;
                                a = [];
                                if (!ig.game.trace(b, f.x, f.y, Math.floor(k.coll.pos.z + k.coll.size.z * 0.75), e.x, e.y, 2, 2, 2, ig.COLLTYPE.IGNORE, k, a) || a[0] == n.coll || (1 - b.dist) * r < n.coll.size.x /
                                    2 + 16) {
                                    o = sc.INTERACT_ENTRY_STATE.NEAR;
                                    if (m.handler.isInteractionBlocked && m.handler.isInteractionBlocked()) o = sc.INTERACT_ENTRY_STATE.BLOCKED;
                                    else {
                                        p = -1;
                                        if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) Vec2.angle(e, k.face) < Math.PI / 2 ? p = r : r < 16 && (p = r + 100);
                                        else {
                                            ig.system.getScreenFromMapPos(h, n.coll.pos.x + n.coll.size.x / 2, n.coll.pos.y - n.coll.pos.z + n.coll.size.y / 2 - n.coll.size.z / 2);
                                            d.x = sc.control.getMouseX() - h.x;
                                            d.y = sc.control.getMouseY() - h.y;
                                            r = Vec2.length(d);
                                            n = Math.max(32, (n.coll.size.y + n.coll.size.z) / 2);
                                            r <= n && (p = r)
                                        }
                                        if (p != -1 && (g == -1 || p < g)) {
                                            g = p;
                                            this.focusEntry = m
                                        }
                                    }
                                }
                            }
                        } else o = sc.INTERACT_ENTRY_STATE.HIDDEN;
                        m.setState(o)
                    } else m != this.focusEntry && m.setState(sc.INTERACT_ENTRY_STATE.HIDDEN)
                }
                if (j && this.focusEntry)
                    if (sc.control.interactPressed() && !ig.interact.isBlocked()) {
                        j = null;
                        this.focusEntry.handler.onInteraction && (j = this.focusEntry.handler.onInteraction());
                        if (j !== false) {
                            this.focusEntry.setState(sc.INTERACT_ENTRY_STATE.RUNNING);
                            ig.interact.setBlockDelay();
                            this.interacting = true
                        } else this.focusEntry.setState(sc.INTERACT_ENTRY_STATE.FOCUS)
                    } else this.focusEntry.setState(sc.INTERACT_ENTRY_STATE.FOCUS)
            }
        },
        updateHideStatus: function() {
            var a = ig.game.isControlBlocked();
            if (this.hidden != a)
                if (this.hidden = a)
                    for (a = 0; a < this.entries.length; ++a) this.entries[a].gui.hide()
        },
        forceHide: function() {
            this.hidden = true;
            for (var a = 0; a < this.entries.length; ++a) {
                this.entries[a].setState(sc.INTERACT_ENTRY_STATE.HIDDEN);
                this.entries[a].gui.hook.pauseGui = true;
                this.entries[a].gui.hide()
            }
        },
        forceShow: function() {
            this.hidden = false;
            for (var a = 0; a < this.entries.length; ++a) this.entries[a].gui.hook.pauseGui = false
        }
    });
    ig.addGameAddon(function() {
        return sc.mapInteract =
            new sc.MapInteract
    });
    sc.MapInteractIcon = ig.Class.extend({
        tiles: null,
        noAwayIcon: false,
        anims: {},
        frameTime: 0,
        init: function(a, b, c) {
            this.tiles = a;
            this.frameTime = c;
            for (var d in b) this.anims[sc.INTERACT_ENTRY_STATE[d]] = b[d]
        },
        hasAnim: function(a) {
            return !!this.anims[a]
        },
        getMaxTimer: function(a) {
            return (this.anims[a] || this.anims[sc.INTERACT_ENTRY_STATE.NEAR]).length * this.frameTime
        },
        updateDrawables: function(a, b, c) {
            var b = this.tiles.getTileSrc(g, (this.anims[b] || this.anims[sc.INTERACT_ENTRY_STATE.NEAR])[Math.floor(c /
                    this.frameTime)]),
                c = this.tiles.width,
                d = this.tiles.height;
            a.addGfx(this.tiles.image, (24 - c) / 2, 24 - d, b.x, b.y, c, d)
        }
    });
    sc.MapInteractEntry = ig.Class.extend({
        entity: null,
        handler: null,
        offset: null,
        state: sc.INTERACT_ENTRY_STATE.HIDDEN,
        icon: null,
        interrupting: false,
        zCondition: sc.INTERACT_Z_CONDITION.Z_RANGE_OVERLAP,
        gui: null,
        blockedDuringCombat: false,
        init: function(a, b, c, d, e) {
            this.entity = a;
            this.handler = b;
            this.icon = c;
            this.zCondition = d || sc.INTERACT_Z_CONDITION.Z_RANGE_OVERLAP;
            this.interrupting = e || false;
            this.gui = new ig.GUI.Interact(a,
                c)
        },
        setOffset: function(a, b) {
            if (!this.gui.offset) this.gui.offset = Vec2.create();
            this.gui.offset.x = a;
            this.gui.offset.y = b
        },
        setIcon: function(a) {
            this.icon = a;
            this.gui.icon = a
        },
        setSubGui: function(a) {
            this.gui.setSubGui(a)
        },
        setState: function(a) {
            this.state = a;
            this.gui.setIconState(a)
        }
    })
});
ig.baked = !0;
