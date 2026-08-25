ig.module("game.feature.gui.base.text").requires("impact.base.font", "impact.feature.gui.gui", "game.feature.font.font-system").defines(function() {
    sc.TextGui = ig.GuiElementBase.extend({
        font: null,
        text: "",
        textBlock: null,
        beepSound: null,
        bleepDelay: 0,
        playSound: false,
        stopped: false,
        init: function(b, a) {
            this.parent();
            var a = a || {},
                d = a.font;
            this.font = d ? d : sc.fontsystem.font;
            this.text = b;
            this.textBlock = new ig.TextBlock(this.font, b, a);
            a.drawCallback && this.textBlock.setDrawCallback(a.drawCallback);
            this.bleepDelay = 0;
            this.hook.size.x =
                this.textBlock.size.x;
            this.hook.size.y = this.textBlock.size.y;
            this.hook.pivot.x = Math.floor(this.hook.size.x / 2);
            this.hook.pivot.y = Math.floor(this.hook.size.y / 2)
        },
        onVisibilityChange: function(b) {
            b ? this.textBlock.prerender() : this.textBlock.clearPrerendered()
        },
        setBeepSound: function(b) {
            (this.beepSound = b) && this.textBlock.isFinished() && this.beepSound.play()
        },
        setMaxWidth: function(b) {
            this.textBlock.maxWidth = b || 0;
            this.setText(this.text)
        },
        setTextAlign: function(b) {
            this.textBlock.align = b
        },
        setTextSpeed: function(b) {
            this.textBlock.speed =
                b
        },
        setFont: function(b, a) {
            if (b && b != this.font) {
                this.font = b;
                this.textBlock.font = b;
                if (a != void 0) this.textBlock.linePadding = a || 0;
                this.setText(this.text)
            }
        },
        setDrawCallback: function(b) {
            this.textBlock.setDrawCallback(b)
        },
        setText: function(b) {
            this.text = b;
            this.textBlock.setText(b);
            this.isVisible() && this.textBlock.prerender();
            this.hook.size.x = this.textBlock.size.x;
            this.hook.size.y = this.textBlock.size.y;
            this.hook.pivot.x = Math.floor(this.hook.size.x / 2);
            this.hook.pivot.y = Math.floor(this.hook.size.y / 2);
            this.stopped =
                false
        },
        clear: function() {
            this.textBlock.clearPrerendered()
        },
        finish: function() {
            this.textBlock.finish()
        },
        update: function() {
            if (!this.stopped) {
                var b = Math.floor(this.textBlock.currentIndex / 1);
                this.textBlock.update();
                if (Math.floor(this.textBlock.currentIndex / 1) != b) this.playSound = true;
                if (!sc.model.isTitle() && this.beepSound && this.playSound && this.bleepDelay <= 0) {
                    this.beepSound.play();
                    this.playSound = false;
                    this.bleepDelay = Math.ceil(this.textBlock.speed * 120) / 60 - 0.005
                }
                this.bleepDelay = this.bleepDelay - ig.system.actualTick
            }
        },
        stop: function() {
            this.stopped = true
        },
        reset: function() {
            this.textBlock.reset()
        },
        resume: function() {
            this.stopped = false
        },
        getTextState: function() {
            return this.textBlock.getState()
        },
        setTextState: function(b) {
            this.textBlock.setState(b)
        },
        updateDrawables: function(b) {
            b.addDraw().setText(this.textBlock, 0, 0)
        },
        onAttach: function() {
            this.isVisible() && this.textBlock.prerender()
        },
        onDetach: function() {
            this.textBlock.clearPrerendered()
        }
    })
});
ig.baked = !0;
