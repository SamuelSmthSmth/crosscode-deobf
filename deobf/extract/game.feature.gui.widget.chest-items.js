ig.module("game.feature.gui.widget.chest-items").requires("impact.base.image", "impact.feature.gui.gui", "game.feature.inventory.inventory").defines(function() {
    var b = Vec2.createC(),
        a = Vec2.createC(),
        d = Vec2.createC(),
        c = [0, 30, -30, 45, -45, 15, -15];
    sc.ItemGui = ig.GuiElementBase.extend({
        transitions: {
            HIDDEN: {
                state: {
                    scaleX: 0,
                    scaleY: 0,
                    angle: -(Math.PI / 2)
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.LINEAR
            },
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            END: {
                state: {
                    alpha: 0
                },
                time: 0.5,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        icon: null,
        timer: 0,
        target: null,
        moveTimer: 0.4,
        moveTime: 0.4,
        diff: Vec2.create(0, 0),
        init: function(a, b, c, d, i) {
            this.parent();
            this.setSize(14, 16);
            this.setPivot(7, 8);
            this.setPos(c.x, c.y);
            this.diff.x = d.x - c.x;
            this.diff.y = d.y - c.y;
            this.target = a;
            this.icon = new ig.TextBlock(sc.fontsystem.font, "\\i[" + b + "]", {
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.doStateTransition("HIDDEN", true);
            this.start(d, i)
        },
        start: function(a, b) {
            this.doStateTransition("DEFAULT", false, false, null, b);
            this.timer = 1;
            this.moveTime = 0.4;
            this.moveTimer =
                0
        },
        update: function() {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.actualTick;
                this.timer <= 0 && this.doStateTransition("END", false, true)
            }
            var a = this.hook,
                c = this.target.coll;
            ig.system.getScreenFromMapPos(b, Math.round(c.pos.x + c.size.x / 2), Math.round(c.pos.y - c.pos.z - c.size.z / 2 + c.size.y / 2));
            a.pos.x = b.x - a.size.x / 2;
            a.pos.y = b.y - a.size.y / 2;
            if (this.moveTimer < this.moveTime) {
                this.moveTimer = this.moveTimer + ig.system.actualTick;
                if (this.moveTimer >= this.moveTime) this.moveTimer = this.moveTime
            }
            c = Math.min(1, Math.max(0,
                this.moveTimer) / this.moveTime);
            c = KEY_SPLINES.EASE_OUT.get(c);
            a.pos.x = a.pos.x + this.diff.x * c;
            a.pos.y = a.pos.y + this.diff.y * c
        },
        updateDrawables: function(a) {
            a.addDraw().setText(this.icon, 0, 0)
        }
    });
    sc.ItemGuiLayer = ig.GuiElementBase.extend({
        init: function() {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.hook.zIndex = 5
        },
        addItem: function(e, f, g) {
            var h = null,
                h = -1E6,
                h = h = 0,
                f = sc.inventory.getItem(f),
                f = (f.icon || "item-default") + sc.inventory.getRaritySuffix(f.rarity || 0),
                i = 0,
                j = e.coll;
            ig.system.getScreenFromMapPos(b,
                Math.round(j.pos.x + j.size.x / 2), Math.round(j.pos.y - j.pos.z - j.size.z / 2 + j.size.y / 2));
            Vec2.subC(b, 7, 8);
            for (j = 0; j < g; j++) {
                h = c[j % c.length];
                h = h + (-2 + Math.random() * 4);
                h = h * (Math.PI / 180);
                a.x = Math.sin(h);
                a.y = Math.cos(h);
                h = Math.floor(20 + Math.random() * 20);
                d.x = Math.floor(b.x - a.x * h);
                d.y = Math.floor(b.y - a.y * h);
                h = new sc.ItemGui(e, f, b, d, i);
                this.addChildGui(h);
                i = i + 0.08
            }
        }
    })
});
ig.baked = !0;
