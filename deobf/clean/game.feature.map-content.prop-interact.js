/**
 * @module game.feature.map-content.prop-interact
 *
 * Interaction wrapper for map props. Handles the interact icon (info vs.
 * grab), optional attached event, permanent effect, hover text, and the
 * look-at camera cutscene triggered on interaction.
 */
ig.module("game.feature.map-content.prop-interact").requires("impact.feature.map-content.entities.prop", "game.feature.map-content.gui.icon-hover-text").defines(function() {
    sc.PROP_INTERACT_ICONS = {
        INFO: {
            noEvent: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 40, 24, 0, 168), {
                FOCUS: [0],
                NEAR: [1]
            }, 0.1),
            withEvent: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 40, 24, 0, 168), {
                FOCUS: [2],
                NEAR: [3]
            }, 0.1)
        },
        GRAB: {
            noEvent: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png",
                24, 24), {
                FOCUS: [40, 41, 42, 41],
                NEAR: [43]
            }, 0.2),
            withEvent: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 24, 24), {
                FOCUS: [40, 41, 42, 41],
                NEAR: [43]
            }, 0.2)
        }
    };
    sc.PropInteract = ig.Class.extend({
        prop: null,
        icon: null,
        interactEntry: null,
        permaEffect: null,
        event: null,
        combatOkay: false,
        cutsceneType: null,
        init: function(prop, settings) {
            this.prop = prop;
            this.icon = sc.PROP_INTERACT_ICONS[settings.icon || "INFO"];
            if (settings.event) this.event = new ig.Event({
                steps: sc.Cutscene.getLookAtEventSteps(settings.event, prop)
            });
            if (settings.permaEffect) this.permaEffect =
                new ig.EffectHandle(settings.permaEffect);
            var icon = this.event ? this.icon.withEvent : this.icon.noEvent;
            this.combatOkay = settings.combatOkay || false;
            this.cutsceneType = settings.cutsceneType || null;
            this.interactEntry = new sc.MapInteractEntry(this.prop, this, icon, sc.INTERACT_Z_CONDITION.Z_RANGE_OVERLAP, true);
            this.interactEntry.blockedDuringCombat = settings.combatOkay != void 0 ? !settings.combatOkay : true;
            if (settings.hoverText) {
                icon = new sc.IconHoverTextGui(new ig.LangLabel(settings.hoverText), null, null, settings.title ? new ig.LangLabel(settings.title) : null);
                this.interactEntry.setSubGui(icon)
            }
        },
        onShow: function() {
            sc.mapInteract.addEntry(this.interactEntry);
            if (this.permaEffect) return true
        },
        onPermaUpdate: function() {
            if (this.prop.effects.interactPermaHandle) {
                this.prop.effects.interactPermaHandle.stop();
                this.prop.effects.interactPermaHandle = null
            }
            if (this.permaEffect) this.prop.effects.interactPermaHandle = this.permaEffect.spawnOnTarget(this.prop, {
                duration: -1
            })
        },
        onHide: function() {
            sc.mapInteract.removeEntry(this.interactEntry);
            if (this.prop.effects.interactPermaHandle) {
                this.prop.effects.interactPermaHandle.stop();
                this.prop.effects.interactPermaHandle = null
            }
        },
        onKill: function() {
            sc.mapInteract.removeEntry(this.interactEntry);
            this.event && this.event.clearCached();
            this.permaEffect && this.permaEffect.clearCached()
        },
        onInteraction: function() {
            if (this.event) sc.Cutscene.startEvent(ig.EVENT_TYPE[this.cutsceneType || "CUTSCENE"], this.event, null, this.prop);
            else return false
        }
    });
    ig.PROP_INTERACT_CLASS = sc.PropInteract
});
ig.baked = !0;
