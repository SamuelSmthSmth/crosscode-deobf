/**
 * @module game.feature.gui.screen.title-logo
 * @description ig.GUI.TitleLogo: the animated title logo (letters sliding
 *   into place, "Ross" and "Ode" text, tech-demo tags) shown on the title
 *   screen.
 */
ig.module("game.feature.gui.screen.title-logo").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.button", "impact.base.image").defines(function() {
	ig.GUI.TitleLogo = ig.SequenceGui.extend({
		gfx: {
			logo: new ig.Image("media/gui/title-logo.png")
		},
		gui: {
			logoBG: {
				gfx: "logo",
				src: {
					x: 0,
					y: 128,
					w: 192,
					h: 64
				},
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
						time: 0.5,
						timeFunction: KEY_SPLINES.EASE_OUT
					},
					HIDDEN: {
						state: {
							alpha: 0,
							scaleX: 1.3,
							scaleY: 1.3
						},
						time: 0.3,
						timeFunction: KEY_SPLINES.EASE_IN
					}
				}
			},
			logoC1: {
				gfx: "logo",
				src: {
					x: 0,
					y: 0,
					w: 48,
					h: 64
				},
				pos: {
					x: 0,
					y: 0
				},
				align: {
					x: ig.GUI_ALIGN.X_LEFT,
					y: ig.GUI_ALIGN.Y_TOP
				},
				transitions: {
					HIDDEN: {
						state: {
							alpha: 0,
							offsetX: 64
						},
						time: 0.3,
						timeFunction: KEY_SPLINES.EASE_IN
					},
					STATE1: {
						state: {
							offsetX: 64
						},
						time: 0.2,
						timeFunction: KEY_SPLINES.EASE_IN
					},
					STATE2: {
						state: {},
						time: 0.5,
						timeFunction: KEY_SPLINES.EASE_IN_OUT
					}
				}
			},
			logoC2: {
				gfx: "logo",
				src: {
					x: 0,
					y: 64,
					w: 48,
					h: 64
				},
				pos: {
					x: 136,
					y: 0
				},
				align: {
					x: ig.GUI_ALIGN.X_LEFT,
					y: ig.GUI_ALIGN.Y_TOP
				},
				transitions: {
					HIDDEN: {
						state: {
							alpha: 0,
							offsetX: -72
						},
						time: 0.3,
						timeFunction: KEY_SPLINES.EASE_IN
					},
					STATE1: {
						state: {
							offsetX: -72
						},
						time: 0.2,
						timeFunction: KEY_SPLINES.EASE_IN
					},
					STATE2: {
						state: {},
						time: 0.5,
						timeFunction: KEY_SPLINES.EASE_IN_OUT
					}
				}
			},
			logoRoss: {
				gfx: "logo",
				src: {
					x: 48,
					y: 0,
					w: 112,
					h: 64
				},
				pos: {
					x: 31,
					y: 0
				},
				align: {
					x: ig.GUI_ALIGN.X_LEFT,
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
							scaleY: 0
						},
						time: 0.3,
						timeFunction: KEY_SPLINES.EASE_IN
					}
				}
			},
			logoOde: {
				gfx: "logo",
				src: {
					x: 48,
					y: 64,
					w: 96,
					h: 64
				},
				pos: {
					x: 173,
					y: 0
				},
				align: {
					x: ig.GUI_ALIGN.X_LEFT,
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
							scaleY: 0
						},
						time: 0.3,
						timeFunction: KEY_SPLINES.EASE_IN
					}
				}
			},
			logoTechDemo: {
				gfx: "logo",
				src: {
					x: 0,
					y: 192,
					w: 96,
					h: 32
				},
				pos: {
					x: 263,
					y: 16
				},
				align: {
					x: ig.GUI_ALIGN.X_LEFT,
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
							scaleY: 0
						},
						time: 0.3,
						timeFunction: KEY_SPLINES.EASE_IN
					}
				}
			},
			logoTechDemo2: {
				gfx: "logo",
				src: {
					x: 0,
					y: 224,
					w: 108,
					h: 58
				},
				pos: {
					x: 420,
					y: 30
				},
				align: {
					x: ig.GUI_ALIGN.X_LEFT,
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
							scaleY: 0
						},
						time: 0.3,
						timeFunction: KEY_SPLINES.EASE_IN
					}
				}
			}
		},
		timeLine: [{
			time: 0,
			gui: "logoC1",
			state: "STATE1"
		}, {
			time: 0,
			gui: "logoC2",
			state: "STATE1"
		}, {
			time: 0.3,
			gui: "logoC1",
			state: "STATE2"
		}, {
			time: 0.3,
			gui: "logoC2",
			state: "STATE2"
		}, {
			time: 0.8,
			gui: "logoRoss",
			state: "DEFAULT"
		}, {
			time: 0.8,
			gui: "logoOde",
			state: "DEFAULT"
		}, {
			time: 0.8,
			gui: "logoBG",
			state: "DEFAULT"
		}, {
			time: 0.8,
			gui: "logoTechDemo2",
			state: "DEFAULT"
		}, {
			time: 1.2,
			gui: "logoTechDemo",
			state: "DEFAULT"
		}, {
			time: 1.6,
			end: true
		}],
		init: function(settings) {
			this.parent(settings);
			this.setSize(465, 64);
			this.hook.zIndex = 1E3
		}
	})
});
ig.baked = !0;
