ig.module("impact.feature.interact.press-repeater").defines(function() {
    ig.PressRepeater = ig.Class.extend({
        currentPressed: null,
        lastPressed: null,
        timer: 0,
        firstDelay: 0.3,
        repeatDelay: 0.1,
        init: function(b, a) {
            this.firstDelay = b || 0.3;
            this.repeatDelay = a || 0.1
        },
        setDown: function(b) {
            this.currentPressed = b
        },
        getPressed: function() {
            var b = this.currentPressed;
            this.currentPressed = null;
            if (b != this.lastPressed) {
                this.timer = this.firstDelay;
                return this.lastPressed = b
            }
            if (b) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <=
                    0) {
                    this.timer = this.repeatDelay;
                    return b
                }
            }
            return null
        }
    })
});
ig.baked = !0;
