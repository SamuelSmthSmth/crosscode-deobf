ig.module("game.feature.quick-menu.entities.analyzable").requires("impact.base.entity", "game.feature.quick-menu.gui.quick-screen-types").defines(function() {
    var b = {
        DEFAULT: {
            showType: sc.SHOW_TYPE.DEFAULT,
            color: sc.ANALYSIS_COLORS.GREY
        },
        QUEST: {
            showType: sc.SHOW_TYPE.INSTANT,
            color: sc.ANALYSIS_COLORS.PURPLE
        },
        SPECIAL: {
            showType: sc.SHOW_TYPE.DEFAULT,
            color: sc.ANALYSIS_COLORS.YELLOW
        }
    };
    ig.LANG_CONTEXT.Analyzable = function(a) {
        return "Analyzable[" + (a.settings.analType || "") + "]"
    };
    ig.ENTITY.Analyzable = ig.Entity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                analType: {
                    _type: "Select",
                    _info: "Type of the Analyzable",
                    _select: b,
                    _default: "DEFAULT"
                },
                visible: {
                    _type: "VarCondition",
                    _info: 'Condition to check if text is visible, if not "???" will be shown instead'
                },
                text: {
                    _type: "LangLabel",
                    _info: "Name to display above the entity",
                    _compact: true,
                    _large: true,
                    _withNull: true
                },
                distance: {
                    _type: "Number",
                    _info: "If defined will be visible at the border if below the given distance",
                    _optional: true
                }
            },
            label: function() {
                return ""
            },
            drawBox: true,
            boxColor: "rgba(0,255,0, 0.5)"
        }),
        color: sc.ANALYSIS_COLORS.GREY,
        text: null,
        visible: null,
        init: function(a, d, c, e) {
            this.parent(a, d, c, e);
            this.coll.type = ig.COLLTYPE.IGNORE;
            this.coll.setSize(16, 16, 0);
            this.text = e.text || null;
            this.visible = e.visible || null;
            this.distance = e.distance || 0;
            if (e.analType) {
                this.color = b[e.analType].color || sc.ANALYSIS_COLORS.GREY;
                this.showType = b[e.analType].showType || sc.SHOW_TYPE.DEFAULT
            } else {
                this.color = sc.ANALYSIS_COLORS[e.color] ||
                    sc.ANALYSIS_COLORS.GREY;
                this.showType = e.showType ? sc.SHOW_TYPE[e.showType] : 0
            }
        },
        isQuickMenuVisible: function() {
            return this.distance && ig.CollTools.getGroundDistance(this.coll, ig.game.playerEntity.coll) < this.distance ? true : false
        },
        getQuickMenuSettings: function() {
            return {
                type: "Analyzable",
                color: this.color,
                text: this.text,
                visible: this.visible,
                showType: this.showType
            }
        }
    })
});
ig.baked = !0;
