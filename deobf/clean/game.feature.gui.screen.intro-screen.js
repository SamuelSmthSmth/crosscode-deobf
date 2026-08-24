/**
 * @module game.feature.gui.screen.intro-screen
 * @description ig.GUI.IntroScreen: the startup intro sequence (Radical Fish
 *   logo, HTML5/tech, Impact logo) with a skippable timeline.
 */
ig.module("game.feature.gui.screen.intro-screen").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.button", "impact.base.image").defines(function() {
	ig.GUI.IntroScreen = ig.SequenceGui.extend({
		gfx: {
			rfgLogo: new ig.Image("media/gui/rfg-fish.png"),
			rfgText: new ig.Image("media/gui/rfg-text.png"),
			techBG: new ig.Image("media/gui/tech-intro-bg.png"),
			html5Logo: new ig.Image("media/gui/html5-logo.png"),
			impactLogo: new ig.Image("media/gui/impact-logo.png")
		},
		gui: {
			baseBG: {
				color: "black",
				transitions: {
					DEFAULT: {
						state: {},
						time: 0,
						timeFunction: KEY_SPLINES.LINEAR
					},
					HIDDEN: {
						state: {
							alpha: 0
						},
						time: 0,
						timeFunction: KEY_SPLINES.LINEAR
					}
				}
			},
			rfgLogo: {
				gfx: "rfgLogo",
				pos: {
					x: 0,
					y: -32
				},
				align: {
					x: ig.GUI_ALIGN.X_CENTER,
					y: ig.GUI_ALIGN.Y_CENTER
				},
				transitions: {
					DEFAULT: {
						state: {},
						time: 0.3,
						timeFunction: KEY_SPLINES.EASE_OUT
					},
					HIDDEN: {
						state: {
							alpha: 0,
							offsetY: -16
						},
						time: 0.3,
						timeFunction: KEY_SPLINES.EASE_IN
					}
				}
			},
			rfgText: {
				gfx: "rfgText",
				pos: {
					x: 0,
					y: 32
				},
				align: {
					x: ig.GUI_ALIGN.X_CENTER,
					y: ig.GUI_ALIGN.Y_CENTER
				},
				transitions: {
					DEFAULT: {
						state: {},
						time: 0.3,
						timeFunction: KEY_SPLINES.LINEAR
					},
					HIDDEN: {
						state: {
							alpha: 0,
							scaleY: 0
						},
						time: 0.3,
						timeFunction: KEY_SPLINES.LINEAR
					}
				}
			},
			whiteBG: {
				color: "white",
				transitions: {
					DEFAULT: {
						state: {},
						time: 0.3,
						timeFunction: KEY_SPLINES.LINEAR
					},
					HIDDEN: {
						state: {
							alpha: 0
						},
						time: 0.3,
						timeFunction: KEY_SPLINES.LINEAR
					}
				}
			},
			techBG: {
				gfx: "techBG",
				pos: {
					x: 0,
					y: 0
				},
				align: {
					x: ig.GUI_ALIGN.X_LEFT,
					y: ig.GUI_ALIGN.Y_TOP
				},
				transitions: {
					DEFAULT: {
						state: {},
						time: 0.6,
						timeFunction: KEY_SPLINES.LINEAR
					},
					HIDDEN: {
						state: {
							alpha: 0,
							offsetY: 64,
							scaleY: 2
						},
						time: 0.3,
						timeFunction: KEY_SPLINES.LINEAR
					}
				}
			},
			html5Logo: {
				gfx: "html5Logo",
				pos: {
					x: 0,
					y: 14
				},
				align: {
					x: ig.GUI_ALIGN.X_CENTER,
					y: ig.GUI_ALIGN.Y_TOP
				},
				transitions: {
					DEFAULT: {
						state: {},
						time: 0.3,
						timeFunction: KEY_SPLINES.EASE_OUT
					},
					HIDDEN: {
						state: {
							alpha: 0,
							offsetY: -16
						},
						time: 0.3,
						timeFunction: KEY_SPLINES.LINEAR
					}
				}
			},
			impactLogo: {
				gfx: "impactLogo",
				pos: {
					x: 0,
					y: 25
				},
				align: {
					x: ig.GUI_ALIGN.X_CENTER,
					y: ig.GUI_ALIGN.Y_BOTTOM
				},
				transitions: {
					DEFAULT: {
						state: {},
						time: 0.3,
						timeFunction: KEY_SPLINES.EASE_OUT
					},
					HIDDEN: {
						state: {
							alpha: 0,
							offsetY: -16
						},
						time: 0.1,
						timeFunction: KEY_SPLINES.LINEAR
					}
				}
			},
			blackBG: {
				color: "black",
				transitions: {
					DEFAULT: {
						state: {},
						time: 0.5,
						timeFunction: KEY_SPLINES.LINEAR
					},
					HIDDEN: {
						state: {
							alpha: 0
						},
						time: 0.5,
						timeFunction: KEY_SPLINES.LINEAR
					}
				}
			}
		},
		timeLine: [{
			time: 0,
			gui: "baseBG",
			state: "DEFAULT"
		}, {
			time: 0,
			gui: "rfgLogo",
			state: "DEFAULT",
			sound: new ig.Sound("media/sound/menu/radicalfish-bubbles.ogg", 1)
		}, {
			time: 0.3,
			gui: "rfgText",
			state: "DEFAULT"
		}, {
			time: 2,
			gui: "whiteBG",
			state: "DEFAULT"
		}, {
			time: 2.5,
			gui: "html5Logo",
			state: "DEFAULT"
		}, {
			time: 2.7,
			gui: "techBG",
			state: "DEFAULT"
		}, {
			time: 2.9,
			gui: "impactLogo",
			state: "DEFAULT"
		}, {
			time: 4.5,
			gui: "blackBG",
			state: "DEFAULT"
		}, {
			time: 5,
			end: true
		}],
		transitions: {
			DEFAULT: {
				state: {},
				time: 0,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		screenInteract: null,
		init: function(settings) {
			this.parent(settings);
			this.hook.setMouseRecord(true);
			this.hook.zIndex = 1E3;
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.doStateTransition("HIDDEN", true);
			this.screenInteract = new sc.ScreenInteractEntry(this)
		},
		onInteraction: function() {
			if (this.timer < 2) this.timer = 2;
			else if (this.timer < 4.5) this.timer = 4.5
		},
		updateDrawables: function(drawables) {
			drawables.addColor("black", ig.system.contextWidth, ig.system.contextHeight)
		},
		start: function() {
			this.parent();
			this.doStateTransition("HIDDEN", true);
			this.doStateTransition("DEFAULT");
			ig.interact.addEntry(this.screenInteract)
		},
		end: function() {
			this.parent();
			this.doStateTransition("HIDDEN");
			ig.interact.removeEntry(this.screenInteract)
		}
	})
});
ig.baked = !0;
