ig.module("game.feature.skills.skilltree").requires("impact.base.game", "game.feature.skills.skills").defines(function() {
    sc.SKILLS_DISTANCE_MULTIPLIER = 8;
    sc.SKILLS_DIRECTION = {};
    sc.SKILLS_DIRECTION.STRAIGHT = 0;
    sc.SKILLS_DIRECTION.CW_45 = 1;
    sc.SKILLS_DIRECTION.CW_90 = 2;
    sc.SKILLS_DIRECTION.CW_135 = 3;
    sc.SKILLS_DIRECTION.CCW_45 = 4;
    sc.SKILLS_DIRECTION.CCW_90 = 5;
    sc.SKILLS_DIRECTION.CCW_135 = 6;
    sc.SkillTree = ig.SingleLoadable.extend({
        version: 3,
        _trees: null,
        skills: [],
        UID: 0,
        init: function() {
            ig.SKILL_TREE ? this.parent() : ig.warn("Can't initialize skill tree because ig.SKILL_TREE was not provided")
        },
        loadInternal: function() {
            $.ajax({
                dataType: "json",
                url: ig.root + ig.SKILL_TREE + ig.getCacheSuffix(),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            })
        },
        onerror: function(b) {
            this._trees = null;
            this.loadingFinished(true);
            ig.error("Could not load Skilltree json file! Event: %O", b)
        },
        onload: function(b) {
            this._trees = [];
            this._trees[sc.ELEMENT.NEUTRAL] = b.NEUTRAL;
            this._trees[sc.ELEMENT.HEAT] = b.HEAT;
            this._trees[sc.ELEMENT.COLD] = b.COLD;
            this._trees[sc.ELEMENT.SHOCK] = b.SHOCK;
            this._trees[sc.ELEMENT.WAVE] =
                b.WAVE;
            this.loadingFinished(true);
            ig.JSON_LOG && ig.log("%cLOADABLE: %cLoaded Skilltree: \n%O", "color:#149AEB", "", b);
            this._createSkills()
        },
        _createSkills: function() {
            this.skills = [];
            this.UID = -1;
            var b = {
                id: 0,
                level: 0,
                element: 0
            };
            this._createElementTreeSkills(this._trees[sc.ELEMENT.NEUTRAL], sc.ELEMENT.NEUTRAL, b);
            this._createElementTreeSkills(this._trees[sc.ELEMENT.HEAT], sc.ELEMENT.HEAT, b);
            this._createElementTreeSkills(this._trees[sc.ELEMENT.COLD], sc.ELEMENT.COLD, b);
            this._createElementTreeSkills(this._trees[sc.ELEMENT.SHOCK],
                sc.ELEMENT.SHOCK, b);
            this._createElementTreeSkills(this._trees[sc.ELEMENT.WAVE], sc.ELEMENT.WAVE, b)
        },
        _createElementTreeSkills: function(b, a, d) {
            if (b.length != 0) {
                d.element = a;
                for (var c = 0; c < b.length; c++) {
                    var e = b[c];
                    if (this.isEmpty(e)) ig.warn("Empty Skill detected [element ID: %i]! Please add content for the skill, for now we skip it.", a);
                    else {
                        if (e.orBranch)
                            for (var f = e.orBranch, g = 0; g < f.levels.length; g++) {
                                d.level = f.levels[g];
                                d.id = ++this.UID;
                                d.type = g == 0 ? sc.SKILL_STATES.OR_BRANCH_FIRST : sc.SKILL_STATES.OR_BRANCH;
                                this.skills[this.UID] = this._createSkill(f.left[g].type, d);
                                f.left[g].uid = this.UID;
                                d.id = ++this.UID;
                                d.type = sc.SKILL_STATES.OR_BRANCH;
                                this.skills[this.UID] = this._createSkill(f.right[g].type, d);
                                f.right[g].uid = this.UID
                            } else {
                                d.id = ++this.UID;
                                d.level = e.level;
                                d.type = sc.SKILL_STATES.NORMAL;
                                e.uid = this.UID;
                                this.skills[this.UID] = this._createSkill(e.skill.type, d)
                            }
                        e.children && this._createElementTreeSkills(e.children, a, d)
                    }
                }
            }
        },
        _createSkill: function(b, a) {
            if (sc.SKILLS[b]) return new sc.SKILLS[b](b, a);
            var d = new sc.SKILLS.EMPTY("EMTPY",
                a);
            ig.warn("Unknown or no skill type detected: %c" + b, "color:orange");
            ig.warn("Creating Empty skill: %O", d);
            return d
        },
        isEmpty: function(b) {
            for (var a in b) return false;
            return true
        },
        autoSkill: function(b, a, d) {
            for (var c in sc.ELEMENT) this._autoSkillElement(b, a - 1, this._trees[sc.ELEMENT[c]], d)
        },
        _autoSkillElement: function(b, a, d, c) {
            var e = [];
            for (this._addAutoSkillOptions(e, d); e.length > 0;) {
                for (var d = e.length, f = null, g = 0; d--;) {
                    var h = e[d];
                    if (h.skill.getCPCost() > a) e.splice(d, 1);
                    else {
                        var i = c && c.indexOf(h.skill.skillKey) ||
                            0;
                        i == -1 && (i = 500);
                        i = i + h.skill.level * 1E3;
                        if (!f || i < g) {
                            f = h;
                            g = i
                        }
                    }
                }
                if (f) {
                    a = a - f.skill.getCPCost();
                    this._learnSkillOption(b, f, e)
                }
            }
        },
        _addAutoSkillOptions: function(b, a) {
            for (var d = a.length; d--;) {
                var c = a[d];
                if (c.orBranch) {
                    for (var e = c.orBranch, f = e.levels.length, g; f--;) {
                        if (e.left[f].type.indexOf("SPECIAL_A")) {
                            g = "left";
                            break
                        }
                        e.right[f].type.indexOf("SPECIAL_A") && (g = "right")
                    }
                    b.push({
                        skill: this.skills[e[g][0].uid],
                        branchObj: e,
                        branch: g,
                        step: 0,
                        children: c.children
                    })
                } else b.push({
                    skill: this.skills[c.uid],
                    children: c.children
                })
            }
        },
        _learnSkillOption: function(b, a, d) {
            d.erase(a);
            b.push(a.skill);
            if (a.branch && a.step + 1 < a.branchObj.levels.length) {
                a.step++;
                a.skill = this.skills[a.branchObj[a.branch][a.step].uid];
                d.push(a)
            } else a.children && this._addAutoSkillOptions(d, a.children)
        },
        getTree: function(b) {
            return b != void 0 ? this._trees[b] : null
        },
        getSkill: function(b) {
            return this.skills[b]
        }
    });
    sc.skilltree = new sc.SkillTree
});
ig.baked = !0;
