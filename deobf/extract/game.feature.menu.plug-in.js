ig.module("game.feature.menu.plug-in").requires("game.feature.menu.area-loadable", "game.feature.menu.menu-steps", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.main-menu", "game.feature.menu.gui.start-menu", "game.feature.menu.gui.equip.equip-menu", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.circuit.circuit-menu", "game.feature.menu.gui.circuit.circuit-misc", "game.feature.menu.gui.item.item-menu", "game.feature.menu.gui.map.map-menu", "game.feature.menu.gui.social.social-menu",
    "game.feature.menu.gui.save.save-menu", "game.feature.menu.gui.options.options-menu", "game.feature.menu.gui.shop.shop-menu", "game.feature.menu.gui.synop.synop-menu", "game.feature.menu.gui.quests.quest-menu", "game.feature.menu.gui.quest-hub.quest-hub-menu", "game.feature.menu.gui.enemies.enemy-menu", "game.feature.menu.gui.lore.lore-menu", "game.feature.menu.gui.help.help-menu", "game.feature.menu.gui.status.status-menu", "game.feature.menu.gui.museum.museum-menu", "game.feature.menu.gui.stats.stats-menu",
    "game.feature.menu.gui.trophy.trophy-menu", "game.feature.menu.gui.trade.trader-menu", "game.feature.menu.gui.botanics.botanics-menu", "game.feature.menu.gui.arena.arena-menu", "game.feature.menu.gui.new-game.new-game-menu", "game.feature.menu.menu-model", "game.feature.menu.lore-model").defines(function() {
    if (window.wm) {
        if (wm.mapAttribs) {
            wm.mapAttribs.area = {
                _type: "String",
                _select: "areas",
                _info: "Area of the map.",
                _default: "fallback"
            };
            wm.mapAttribs.oobSound = {
                _type: "String",
                _select: ig.DANGER_TERRAIN,
                _info: "Area of the map.",
                _default: "HOLE"
            }
        }
        wm.postLoadModules.push("game.feature.menu.editors.area-editors");
        wm.postLoadModules.push("game.feature.menu.editors.lore-editors");
        wm.postLoadModules.push("game.feature.menu.editors.shop-editors");
        wm.postLoadModules.push("game.feature.menu.editors.drop-editors");
        wm.postLoadModules.push("game.feature.menu.editors.toggle-set-editors");
        wm.addStepColorRule(/LORE/, "orange")
    }
});
ig.baked = !0;
