/**
 * @module game.feature.gui.widget.tutorial-start-gui
 * @description sc.TutorialStartGui: the tutorial intro popup asking whether to
 *   show the tutorial now, with a header, optional image + text and a yes/no
 *   choice box.
 */
ig.module("game.feature.gui.widget.tutorial-start-gui").requires("impact.base.image", "impact.feature.interact.gui.focus-gui", "game.feature.interact.button-group", "game.feature.gui.base.compact-choice-box").defines(function() {
	sc.TutorialStartHeaderGui = ig.GuiElementBase.extend({
		init: function(labels, subtitle) {
			this.parent();
			var title = new sc.TextGui(ig.lang.get(labels.title), {
				font: sc.fontsystem.tinyFont
			});
			title.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.addChildGui(title);
			var sub = new sc.TextGui(subtitle);
			sub.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			sub.setPos(0, title.hook.size.y);
			this.addChildGui(sub);
			this.setSize(Math.max(title.hook.size.x, sub.hook.size.x), title.hook.size.y + sub.hook.size.y)
		}
	});
	sc.TutorialStartContentGui = ig.GuiElementBase.extend({
		init: function(text, image) {
			this.parent();
			var imageGui = null,
				y = 0;
			if (image) {
				imageGui = new ig.ImageGui(image);
				imageGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
				this.addChildGui(imageGui);
				y = y + (imageGui.hook.size.y + 2)
			}
			var textGui = new sc.TextGui(text, {
				maxWidth: imageGui && imageGui.hook.size.x || 400,
				textAlign: ig.Font.ALIGN.CENTER
			});
			textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			textGui.setPos(0, y);
			this.addChildGui(textGui);
			y = y + textGui.hook.size.y;
			this.setSize(Math.max(imageGui && imageGui.hook.size.x, textGui.hook.size.x), y)
		}
	});
	sc.TutorialStartGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {
					alpha: 1
				},
				time: 0.2,
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
		bgColor: null,
		titleBox: null,
		contentText: null,
		contentImage: null,
		centerBox: null,
		decisionBox: null,
		screenInteract: null,
		pausePushed: false,
		sounds: {
			start: new ig.Sound("media/sound/hud/popup.ogg", 1)
		},
		init: function(labels, subtitle, text, imagePath, callback) {
			this.parent();
			this.hook.localAlpha = 0.5;
			this.hook.zIndex = 90;
			this.hook.temporary = true;
			this.hook.pauseGui = true;
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.callback = callback;
			this.titleBox = new sc.CenterBoxGui(new sc.TutorialStartHeaderGui(labels, subtitle));
			this.titleBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.titleBox.setPos(0, 24);
			this.addChildGui(this.titleBox);
			this.contentText = text;
			if (imagePath) {
				this.contentImage = new ig.Image(imagePath);
				this.contentImage.addLoadListener(this)
			} else this.buildContent();
			this.decisionBox = new sc.CompactChoiceBoxGui([{
				key: "show",
				label: ig.lang.get(labels.yes)
			}, {
				key: "skip",
				label: ig.lang.get(labels.no)
			}], 200, this.onChoice.bind(this));
			this.decisionBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
			this.decisionBox.setPos(0, 24);
			this.addChildGui(this.decisionBox);
			this.doStateTransition("HIDDEN", true);
			this.doStateTransition("DEFAULT");
			this.startPause();
			sc.model.clearTopMessage();
			sc.model.addChoiceGui(this)
		},
		onLoadableComplete: function() {
			this.buildContent()
		},
		buildContent: function() {
			if (this.titleBox) {
				var content = new sc.TutorialStartContentGui(this.contentText, this.contentImage);
				this.msgBox = new sc.CenterBoxGui(content);
				this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
				this.msgBox.setPos(0, -3);
				this.addChildGui(this.msgBox)
			}
		},
		onDetach: function() {
			this.clearPause();
			this.contentImage && this.contentImage.decreaseRef()
		},
		startPause: function() {
			this.pausePushed = true;
			ig.slowMotion.add(0, 0, "tutorial");
			ig.slowMotion.forceUpdate();
			this.sounds.start.play()
		},
		clearPause: function() {
			if (this.pausePushed) {
				this.pausePushed = false;
				ig.slowMotion.clearNamed("tutorial", 0);
				ig.slowMotion.forceUpdate()
			}
		},
		_close: function() {
			sc.model.removeChoiceGui(this);
			this.titleBox.doStateTransition("HIDDEN");
			this.msgBox && this.msgBox.doStateTransition("HIDDEN");
			this.decisionBox.doStateTransition("HIDDEN");
			this.doStateTransition("HIDDEN", false, true);
			this.clearPause();
			this.titleBox = null
		},
		updateDrawables: function(drawables) {
			drawables.addColor("black", 0, 0, this.hook.size.x, this.hook.size.y)
		},
		onChoice: function(choice) {
			this._close();
			this.callback && this.callback(choice == "show")
		}
	})
});
ig.baked = !0;
