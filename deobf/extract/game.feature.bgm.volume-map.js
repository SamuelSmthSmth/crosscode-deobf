ig.module("game.feature.bgm.volume-map").requires("impact.base.sound").defines(function() {
    ig.GlobalVolume.set("media/sound/menu/menu-cancel.ogg", 0.8);
    ig.GlobalVolume.set("media/sound/move/jump.ogg", 0.7);
    ig.GlobalVolume.set("media/sound/misc/scifi-effect-1.ogg", 0.68);
    ig.GlobalVolume.set("media/sound/battle/ball-kill.ogg", 0.7);
    ig.GlobalVolume.set("media/sound/puzzle/door-open.ogg", 0.8)
});
ig.baked = !0;
