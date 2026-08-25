ig.module("game.feature.gui.hud.member-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.box").defines(function() {
    var b = {};
    sc.PartyHudGui = ig.GuiElementBase.extend({
        model: null,
        memberGuis: [],
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -32
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        init: function() {
            this.parent();
            sc.Model.addObserver(sc.party, this);
            sc.Model.addObserver(sc.model, this);
            this.updatePartySubGui()
        },
        modelChanged: function(a,
            b) {
            a == sc.party ? b == sc.PARTY_MSG.PARTY_CHANGED ? this.updatePartySubGui() : b == sc.PARTY_MSG.DUNGEON_BLOCK_CHANGED && this.updateVisibility() : a == sc.model && this.updateVisibility()
        },
        updateVisibility: function() {
            var a = !sc.model.isLevelUp() && !sc.party.isDungeonBlocked();
            this.doStateTransition(a ? "DEFAULT" : "HIDDEN")
        },
        updatePartySubGui: function() {
            for (var a = this.memberGuis.length; a--;) this.memberGuis[a].remove(!this.hook._visible);
            this.memberGuis.length = 0;
            for (var b = sc.party.getPartySize(), c = 0, a = 0; a < b; ++a) {
                var e = sc.party.getPartyMemberModelByIndex(a),
                    e = new sc.MemberHudGui(e);
                e.setPos(0, c);
                this.addChildGui(e);
                this.memberGuis.push(e);
                c = c + 26
            }
        }
    });
    sc.MemberHudGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        heads: new ig.TileSheet("media/gui/severed-heads.png", 24, 24),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -32
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        model: null,
        hpExpSpGui: null,
        init: function(a) {
            this.parent();
            this.setSize(25, 25);
            this.setPivot(12, 12);
            this.model =
                a;
            this.hpExpSpGui = new sc.MemberHpExpSpGui(this.model);
            this.hpExpSpGui.setPos(16, 2);
            this.addChildGui(this.hpExpSpGui);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },
        update: function() {},
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 231, 175, this.hook.size.x, this.hook.size.y);
            this.heads.getTileSrc(b, this.model.getHeadIdx());
            a.addGfx(this.heads.image, 0, -2, b.x, b.y, 24, 24, true)
        },
        modelChanged: function() {},
        remove: function(a) {
            this.doStateTransition("HIDDEN", a, true)
        }
    });
    sc.MemberHpExpSpGui =
        ig.GuiElementBase.extend({
            gfx: new ig.Image("media/gui/status-gui.png"),
            model: null,
            hpBar: null,
            spBar: null,
            init: function(a) {
                this.parent();
                this.setSize(39, 10);
                this.model = a;
                sc.Model.addObserver(this.model, this);
                this.hpBar = new sc.HpHudBarGui(a.params, 26, 2);
                this.hpBar.setPos(7, 5);
                this.addChildGui(this.hpBar);
                this.hpBar.setExpRatio(this.model.exp / sc.EXP_PER_LEVEL);
                this.spBar = new sc.SpMiniHudGui(a.params);
                this.spBar.setPos(6, 1);
                this.addChildGui(this.spBar)
            },
            onDetach: function() {
                sc.Model.removeObserver(this.model,
                    this)
            },
            updateDrawables: function(a) {
                a.addGfx(this.gfx, 0, 0, 64, 160, this.hook.size.x, this.hook.size.y);
                this.model.temporary && a.addGfx(this.gfx, 0, this.hook.size.y, 64, 160 + this.hook.size.y, this.hook.size.x, 8)
            },
            modelChanged: function(a, b) {
                b == sc.PARTY_MEMBER_MSG.EXP_CHANGE && this.hpBar.setExpRatio(this.model.exp / sc.EXP_PER_LEVEL)
            }
        })
});
ig.baked = !0;
