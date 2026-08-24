/**
 * @module game.feature.gui.hud.member-hud
 * @description sc.PartyHudGui: the party member portraits HUD (heads, HP/EXP/
 *   SP bars) shown during exploration, plus sc.MemberHudGui and
 *   sc.MemberHpExpSpGui per member.
 */
ig.module("game.feature.gui.hud.member-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.box").defines(function() {
	var headSrc = {};
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
		modelChanged: function(model, msg) {
			model == sc.party ? msg == sc.PARTY_MSG.PARTY_CHANGED ? this.updatePartySubGui() : msg == sc.PARTY_MSG.DUNGEON_BLOCK_CHANGED && this.updateVisibility() : model == sc.model && this.updateVisibility()
		},
		updateVisibility: function() {
			var visible = !sc.model.isLevelUp() && !sc.party.isDungeonBlocked();
			this.doStateTransition(visible ? "DEFAULT" : "HIDDEN")
		},
		updatePartySubGui: function() {
			for (var i = this.memberGuis.length; i--;) this.memberGuis[i].remove(!this.hook._visible);
			this.memberGuis.length = 0;
			for (var size = sc.party.getPartySize(), y = 0, i = 0; i < size; ++i) {
				var member = sc.party.getPartyMemberModelByIndex(i),
					member = new sc.MemberHudGui(member);
				member.setPos(0, y);
				this.addChildGui(member);
				this.memberGuis.push(member);
				y = y + 26
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
		init: function(model) {
			this.parent();
			this.setSize(25, 25);
			this.setPivot(12, 12);
			this.model = model;
			this.hpExpSpGui = new sc.MemberHpExpSpGui(this.model);
			this.hpExpSpGui.setPos(16, 2);
			this.addChildGui(this.hpExpSpGui);
			this.doStateTransition("HIDDEN", true);
			this.doStateTransition("DEFAULT")
		},
		update: function() {},
		updateDrawables: function(drawables) {
			drawables.addGfx(this.gfx, 0, 0, 231, 175, this.hook.size.x, this.hook.size.y);
			this.heads.getTileSrc(headSrc, this.model.getHeadIdx());
			drawables.addGfx(this.heads.image, 0, -2, headSrc.x, headSrc.y, 24, 24, true)
		},
		modelChanged: function() {},
		remove: function(instant) {
			this.doStateTransition("HIDDEN", instant, true)
		}
	});
	sc.MemberHpExpSpGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		model: null,
		hpBar: null,
		spBar: null,
		init: function(model) {
			this.parent();
			this.setSize(39, 10);
			this.model = model;
			sc.Model.addObserver(this.model, this);
			this.hpBar = new sc.HpHudBarGui(model.params, 26, 2);
			this.hpBar.setPos(7, 5);
			this.addChildGui(this.hpBar);
			this.hpBar.setExpRatio(this.model.exp / sc.EXP_PER_LEVEL);
			this.spBar = new sc.SpMiniHudGui(model.params);
			this.spBar.setPos(6, 1);
			this.addChildGui(this.spBar)
		},
		onDetach: function() {
			sc.Model.removeObserver(this.model, this)
		},
		updateDrawables: function(drawables) {
			drawables.addGfx(this.gfx, 0, 0, 64, 160, this.hook.size.x, this.hook.size.y);
			this.model.temporary && drawables.addGfx(this.gfx, 0, this.hook.size.y, 64, 160 + this.hook.size.y, this.hook.size.x, 8)
		},
		modelChanged: function(model, msg) {
			msg == sc.PARTY_MEMBER_MSG.EXP_CHANGE && this.hpBar.setExpRatio(this.model.exp / sc.EXP_PER_LEVEL)
		}
	})
});
ig.baked = !0;
