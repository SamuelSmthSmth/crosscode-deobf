ig.module("game.feature.combat.model.enemy-collab").defines(function() {
    sc.ENEMY_COLLAB_BREAK = {
        ALL: 1,
        INITIATOR: 2,
        ANY: 3
    };
    var b = Vec3.create();
    sc.EnemyCollab = ig.Class.extend({
        initiator: null,
        participants: [],
        vars: {},
        breakType: 0,
        success: true,
        attached: [],
        init: function(a, b) {
            this.initiator = a;
            this.addParticipant(a, null, b.initiatorLabel);
            this.breakType = sc.ENEMY_COLLAB_BREAK[b.breakType] || sc.ENEMY_COLLAB_BREAK.INITIATOR;
            for (var c = b.participants, e = c.length; e--;) {
                var f = c[e];
                if (!sc.combat.gatherCollaborators(this,
                        f.collabKey, f.label, f.min, f.max, f.acceptStunned)) {
                    this.success = false;
                    this.initiator = null;
                    for (c = this.participants.length; c--;) this.participants[c].collabAttribs = null;
                    this.participants.length = 0;
                    break
                }
            }
        },
        getVar: function(a) {
            return this.vars[a] || 0
        },
        setVar: function(a, b) {
            this.vars[a] = b
        },
        onVarAccess: function(a, b) {
            return b[2] == "var" ? ig.vars.resolveObjectAccess(this.vars, b, 3) : b[2] == "count" ? this.participants.length : null
        },
        addCollabAttached: function(a) {
            this.attached.push(a)
        },
        removeCollabAttached: function(a) {
            a =
                this.attached.indexOf(a);
            if (a != -1) {
                this.attached.splice(a, 1);
                return true
            }
            return false
        },
        setParticipantsEntity: function(a, b) {
            for (var c = this.participants.length; c--;) {
                var e = this.participants[c];
                if (!b || b.indexOf(e.collabAttribs.label) != -1) e.collabAttribs.entity = a
            }
        },
        setParticipantsPoint: function(a, b) {
            for (var c = this.participants.length; c--;) {
                var e = this.participants[c];
                if (!b || b.indexOf(e.collabAttribs.label) != -1) e.collabAttribs.point = a
            }
        },
        getLabeledParticipant: function(a) {
            for (var b = this.participants.length; b--;) {
                var c =
                    this.participants[b];
                if (c.collabAttribs.label == a) return c
            }
        },
        getLabeledParticipants: function(a) {
            for (var b = [], c = this.participants.length; c--;) {
                var e = this.participants[c];
                (!a || a.indexOf(e.collabAttribs.label) != -1) && b.push(e)
            }
            return b
        },
        start: function() {
            for (var a = this.participants.length; a--;) {
                var b = this.participants[a];
                b.collaboration = this;
                if (b == this.initiator) b.addActionAttached(this);
                else {
                    b.setTarget(this.initiator.getTarget(true));
                    b.doCollabReaction(b.collabAttribs.collabKey)
                }
            }
            sc.combat.collabs.push(this)
        },
        doReaction: function(a, b) {
            for (var c = this.participants.length; c--;) {
                var e = this.participants[c];
                (!b || b.indexOf(e.collabAttribs.label) != -1) && e.doCollabReaction(a)
            }
        },
        getCenterPos: function(a, d, c) {
            var e = this.participants,
                f = e.length;
            Vec3.assignC(a, 0, 0, 0);
            for (var g = 0; f--;) {
                var h = e[f];
                if (!(c && c.indexOf(h.collabAttribs.label) == -1)) {
                    Vec3.add(a, h.getAlignedPos(d, b));
                    g++
                }
            }
            Vec3.mulF(a, 1 / g);
            return a
        },
        addParticipant: function(a, b, c) {
            if (this.participants.indexOf(a) != -1) return false;
            this.participants.push(a);
            a.collabAttribs = {
                label: c,
                collabKey: b,
                point: null,
                entity: null
            };
            return true
        },
        removeParticipant: function(a) {
            var b = this.participants.indexOf(a);
            if (b == -1) throw Error("Removed Participant that is not part of collab - this should never happen");
            a.removeActionAttached(this);
            a.collaboration = null;
            a.collabAttribs = null;
            this.participants.splice(b, 1);
            this.breakType == sc.ENEMY_COLLAB_BREAK.ANY ? this.cancel() : a == this.initiator && this.breakType == sc.ENEMY_COLLAB_BREAK.INITIATOR ? this.cancel() : this.participants.length == 0 && this.cancel()
        },
        onActionEndDetach: function(a) {
            this.removeParticipant(a)
        },
        cancel: function() {
            for (var a = this.attached.length; a--;) this.attached[a].onCollabEndDetach(this);
            for (a = this.participants.length; a--;) {
                var b = this.participants[a];
                b.removeActionAttached(this);
                b.collaboration = null;
                b.collabAttribs = null;
                b.cancelAction()
            }
            this.participants.length = 0;
            this.initiator = null;
            sc.combat.collabs.erase(this)
        }
    })
});
ig.baked = !0;
