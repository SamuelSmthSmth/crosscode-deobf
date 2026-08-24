/**
 * @module game.feature.gui.widget.social
 * @description ig.GUI.Social: the kickstarter-era social popup at the bottom
 *   of the screen that animates a web popup open/closed.
 */
ig.module("game.feature.gui.widget.social").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.base.image").defines(function() {
	ig.GUI.Social = ig.SimpleGui.extend({
		transitions: {
			DEFAULT: {
				state: {
					alpha: 1
				},
				time: 0,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		_wm: new ig.Config({
			width: 500,
			attributes: {},
			label: function() {
				return "Social Gui! FOLLOW US FFS!!!"
			}
		}),
		init: function() {
			this.parent();
			this.setSize(200, 32);
			this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
			this.hook.zIndex = 100;
			$("#socialPopup").css({
				display: "block",
				height: 0
			});
			$("#socialPopup").animate({
				height: 110
			}, 400)
		},
		remove: function() {
			this.parent();
			$("#socialPopup").animate({
				height: 0
			}, 400, "swing", function() {
				$("#socialPopup").hide()
			})
		}
	})
});
ig.baked = !0;
