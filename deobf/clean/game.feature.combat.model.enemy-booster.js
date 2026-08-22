/**
 * game.feature.combat.model.enemy-booster
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.model.enemy-booster")`.
 *
 * `sc.EnemyBooster`: a game addon that flips enemies between BOOSTABLE and
 * BOOSTED when the area booster item is toggled, overriding enemy levels.
 */
ig.module("game.feature.combat.model.enemy-booster")
    .requires("impact.base.game", "game.feature.model.game-model")
    .defines(function () {

    sc.MIN_BOOSTER_LEVEL = 60;

    sc.EnemyBooster = ig.GameAddon.extend({
        boosted: false,

        init: function () {
            this.parent("EnemyBooster");
            sc.Model.addObserver(sc.model.player, this)
        },

        onLevelLoaded: function () {
            this.boosted = false;
            this.updateBoosterState()
        },

        modelChanged: function (model, message) {
            model instanceof sc.PlayerModel && message == sc.PLAYER_MSG.ITEM_TOGGLED && this.updateBoosterState()
        },

        updateBoosterState: function () {
            var boosted = sc.map.getAreaItemToggleState(sc.AREA_ITEM_TYPE.BOOSTER);
            if (this.boosted != boosted) {
                this.boosted = boosted;
                var enemies = ig.game.getEntitiesByType(ig.ENTITY.Enemy);
                for (var i = enemies.length; i--;) this.updateEnemyBoostState(enemies[i])
            }
        },

        updateEnemyBoostState: function (enemy) {
            if (enemy.boosterState != sc.ENEMY_BOOSTER_STATE.NONE) {
                if (this.boosted && enemy.boosterState == sc.ENEMY_BOOSTER_STATE.BOOSTABLE) {
                    enemy.boosterState = sc.ENEMY_BOOSTER_STATE.BOOSTED;
                    var boostLevel = enemy.enemyType.boostedLevel || sc.MIN_BOOSTER_LEVEL;
                    sc.newgame.get("scale-enemies") && (boostLevel = sc.model.player.getParamAvgLevel(10));
                    enemy.setLevelOverride(boostLevel)
                } else if (!this.boosted && enemy.boosterState == sc.ENEMY_BOOSTER_STATE.BOOSTED) {
                    enemy.boosterState = sc.ENEMY_BOOSTER_STATE.BOOSTABLE;
                    enemy.level.setting ? enemy.setLevelOverride(1 * ig.Event.getExpressionValue(enemy.level.setting)) : enemy.setLevelOverride(null)
                }
            }
        }
    });

    ig.addGameAddon(function () {
        return sc.enemyBooster = new sc.EnemyBooster
    })
});
ig.baked = !0;
