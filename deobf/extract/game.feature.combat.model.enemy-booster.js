ig.module("game.feature.combat.model.enemy-booster").requires("impact.base.game", "game.feature.model.game-model").defines(function() {
    sc.MIN_BOOSTER_LEVEL = 60;
    sc.EnemyBooster = ig.GameAddon.extend({
        boosted: false,
        init: function() {
            this.parent("EnemyBooster");
            sc.Model.addObserver(sc.model.player, this)
        },
        onLevelLoaded: function() {
            this.boosted = false;
            this.updateBoosterState()
        },
        modelChanged: function(b, a) {
            b instanceof sc.PlayerModel && a == sc.PLAYER_MSG.ITEM_TOGGLED && this.updateBoosterState()
        },
        updateBoosterState: function() {
            var b =
                sc.map.getAreaItemToggleState(sc.AREA_ITEM_TYPE.BOOSTER);
            if (this.boosted != b) {
                this.boosted = b;
                for (var b = ig.game.getEntitiesByType(ig.ENTITY.Enemy), a = b.length; a--;) this.updateEnemyBoostState(b[a])
            }
        },
        updateEnemyBoostState: function(b) {
            if (b.boosterState != sc.ENEMY_BOOSTER_STATE.NONE)
                if (this.boosted && b.boosterState == sc.ENEMY_BOOSTER_STATE.BOOSTABLE) {
                    b.boosterState = sc.ENEMY_BOOSTER_STATE.BOOSTED;
                    var a = b.enemyType.boostedLevel || sc.MIN_BOOSTER_LEVEL;
                    sc.newgame.get("scale-enemies") && (a = sc.model.player.getParamAvgLevel(10));
                    b.setLevelOverride(a)
                } else if (!this.boosted && b.boosterState == sc.ENEMY_BOOSTER_STATE.BOOSTED) {
                b.boosterState = sc.ENEMY_BOOSTER_STATE.BOOSTABLE;
                b.level.setting ? b.setLevelOverride(1 * ig.Event.getExpressionValue(b.level.setting)) : b.setLevelOverride(null)
            }
        }
    });
    ig.addGameAddon(function() {
        return sc.enemyBooster = new sc.EnemyBooster
    })
});
ig.baked = !0;
