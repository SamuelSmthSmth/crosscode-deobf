/**
 * @module game.feature.skills.skilltree
 *
 * Skill tree data loader and skill instantiation. Loads the per-element
 * skill tree JSON, flattens it into a skill list (assigning UIDs and
 * handling OR-branches), and provides helpers for the auto-skill system
 * that picks skills within a CP budget.
 */
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
        onerror: function(event) {
            this._trees = null;
            this.loadingFinished(true);
            ig.error("Could not load Skilltree json file! Event: %O", event)
        },
        onload: function(data) {
            this._trees = [];
            this._trees[sc.ELEMENT.NEUTRAL] = data.NEUTRAL;
            this._trees[sc.ELEMENT.HEAT] = data.HEAT;
            this._trees[sc.ELEMENT.COLD] = data.COLD;
            this._trees[sc.ELEMENT.SHOCK] = data.SHOCK;
            this._trees[sc.ELEMENT.WAVE] =
                data.WAVE;
            this.loadingFinished(true);
            ig.JSON_LOG && ig.log("%cLOADABLE: %cLoaded Skilltree: \n%O", "color:#149AEB", "", data);
            this._createSkills()
        },
        _createSkills: function() {
            this.skills = [];
            this.UID = -1;
            var skillContext = {
                id: 0,
                level: 0,
                element: 0
            };
            this._createElementTreeSkills(this._trees[sc.ELEMENT.NEUTRAL], sc.ELEMENT.NEUTRAL, skillContext);
            this._createElementTreeSkills(this._trees[sc.ELEMENT.HEAT], sc.ELEMENT.HEAT, skillContext);
            this._createElementTreeSkills(this._trees[sc.ELEMENT.COLD], sc.ELEMENT.COLD, skillContext);
            this._createElementTreeSkills(this._trees[sc.ELEMENT.SHOCK],
                sc.ELEMENT.SHOCK, skillContext);
            this._createElementTreeSkills(this._trees[sc.ELEMENT.WAVE], sc.ELEMENT.WAVE, skillContext)
        },
        _createElementTreeSkills: function(tree, element, skillContext) {
            if (tree.length != 0) {
                skillContext.element = element;
                for (var i = 0; i < tree.length; i++) {
                    var entry = tree[i];
                    if (this.isEmpty(entry)) ig.warn("Empty Skill detected [element ID: %i]! Please add content for the skill, for now we skip it.", element);
                    else {
                        if (entry.orBranch)
                            for (var branch = entry.orBranch, j = 0; j < branch.levels.length; j++) {
                                skillContext.level = branch.levels[j];
                                skillContext.id = ++this.UID;
                                skillContext.type = j == 0 ? sc.SKILL_STATES.OR_BRANCH_FIRST : sc.SKILL_STATES.OR_BRANCH;
                                this.skills[this.UID] = this._createSkill(branch.left[j].type, skillContext);
                                branch.left[j].uid = this.UID;
                                skillContext.id = ++this.UID;
                                skillContext.type = sc.SKILL_STATES.OR_BRANCH;
                                this.skills[this.UID] = this._createSkill(branch.right[j].type, skillContext);
                                branch.right[j].uid = this.UID
                            } else {
                                skillContext.id = ++this.UID;
                                skillContext.level = entry.level;
                                skillContext.type = sc.SKILL_STATES.NORMAL;
                                entry.uid = this.UID;
                                this.skills[this.UID] = this._createSkill(entry.skill.type, skillContext)
                            }
                        entry.children && this._createElementTreeSkills(entry.children, element, skillContext)
                    }
                }
            }
        },
        _createSkill: function(skillType, skillContext) {
            if (sc.SKILLS[skillType]) return new sc.SKILLS[skillType](skillType, skillContext);
            var emptySkill = new sc.SKILLS.EMPTY("EMTPY",
                skillContext);
            ig.warn("Unknown or no skill type detected: %c" + skillType, "color:orange");
            ig.warn("Creating Empty skill: %O", emptySkill);
            return emptySkill
        },
        isEmpty: function(obj) {
            for (var key in obj) return false;
            return true
        },
        autoSkill: function(skillList, maxCp, forcedSkills) {
            for (var elementKey in sc.ELEMENT) this._autoSkillElement(skillList, maxCp - 1, this._trees[sc.ELEMENT[elementKey]], forcedSkills)
        },
        _autoSkillElement: function(skillList, maxCp, tree, forcedSkills) {
            var options = [];
            for (this._addAutoSkillOptions(options, tree); options.length > 0;) {
                for (var remaining = options.length, bestOption = null, bestScore = 0; remaining--;) {
                    var option = options[remaining];
                    if (option.skill.getCPCost() > maxCp) options.splice(remaining, 1);
                    else {
                        var score = forcedSkills && forcedSkills.indexOf(option.skill.skillKey) ||
                            0;
                        score == -1 && (score = 500);
                        score = score + option.skill.level * 1E3;
                        if (!bestOption || score < bestScore) {
                            bestOption = option;
                            bestScore = score
                        }
                    }
                }
                if (bestOption) {
                    maxCp = maxCp - bestOption.skill.getCPCost();
                    this._learnSkillOption(skillList, bestOption, options)
                }
            }
        },
        _addAutoSkillOptions: function(options, tree) {
            for (var i = tree.length; i--;) {
                var entry = tree[i];
                if (entry.orBranch) {
                    for (var branch = entry.orBranch, j = branch.levels.length, branchSide; j--;) {
                        if (branch.left[j].type.indexOf("SPECIAL_A")) {
                            branchSide = "left";
                            break
                        }
                        branch.right[j].type.indexOf("SPECIAL_A") && (branchSide = "right")
                    }
                    options.push({
                        skill: this.skills[branch[branchSide][0].uid],
                        branchObj: branch,
                        branch: branchSide,
                        step: 0,
                        children: entry.children
                    })
                } else options.push({
                    skill: this.skills[entry.uid],
                    children: entry.children
                })
            }
        },
        _learnSkillOption: function(skillList, option, options) {
            options.erase(option);
            skillList.push(option.skill);
            if (option.branch && option.step + 1 < option.branchObj.levels.length) {
                option.step++;
                option.skill = this.skills[option.branchObj[option.branch][option.step].uid];
                options.push(option)
            } else option.children && this._addAutoSkillOptions(options, option.children)
        },
        getTree: function(element) {
            return element != void 0 ? this._trees[element] : null
        },
        getSkill: function(uid) {
            return this.skills[uid]
        }
    });
    sc.skilltree = new sc.SkillTree
});
ig.baked = !0;
