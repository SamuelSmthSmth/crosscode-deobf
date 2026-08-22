/**
 * game.feature.combat.model.enemy-collab
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.model.enemy-collab")`.
 *
 * `sc.EnemyCollab`: an enemy "collaboration" — a group of enemies that act
 * together. Handles gathering participants, labeled participant lookups, and
 * starting/cancelling the collab (including break-type rules).
 */
ig.module("game.feature.combat.model.enemy-collab")
    .defines(function () {

    sc.ENEMY_COLLAB_BREAK = {
        ALL: 1,
        INITIATOR: 2,
        ANY: 3
    };

    var centerPosScratch = Vec3.create();

    sc.EnemyCollab = ig.Class.extend({
        initiator: null,
        participants: [],
        vars: {},
        breakType: 0,
        success: true,
        attached: [],

        init: function (initiator, settings) {
            this.initiator = initiator;
            this.addParticipant(initiator, null, settings.initiatorLabel);
            this.breakType = sc.ENEMY_COLLAB_BREAK[settings.breakType] || sc.ENEMY_COLLAB_BREAK.INITIATOR;

            for (var participants = settings.participants, index = participants.length; index--;) {
                var participant = participants[index];
                if (!sc.combat.gatherCollaborators(this, participant.collabKey, participant.label, participant.min, participant.max, participant.acceptStunned)) {
                    this.success = false;
                    this.initiator = null;
                    for (var clearIndex = this.participants.length; clearIndex--;) this.participants[clearIndex].collabAttribs = null;
                    this.participants.length = 0;
                    break
                }
            }
        },

        getVar: function (key) {
            return this.vars[key] || 0
        },

        setVar: function (key, value) {
            this.vars[key] = value
        },

        onVarAccess: function (context, path) {
            return path[2] == "var" ? ig.vars.resolveObjectAccess(this.vars, path, 3) : path[2] == "count" ? this.participants.length : null
        },

        addCollabAttached: function (obj) {
            this.attached.push(obj)
        },

        removeCollabAttached: function (obj) {
            var index = this.attached.indexOf(obj);
            if (index != -1) {
                this.attached.splice(index, 1);
                return true
            }
            return false
        },

        setParticipantsEntity: function (entity, labels) {
            for (var index = this.participants.length; index--;) {
                var participant = this.participants[index];
                if (!labels || labels.indexOf(participant.collabAttribs.label) != -1) participant.collabAttribs.entity = entity
            }
        },

        setParticipantsPoint: function (point, labels) {
            for (var index = this.participants.length; index--;) {
                var participant = this.participants[index];
                if (!labels || labels.indexOf(participant.collabAttribs.label) != -1) participant.collabAttribs.point = point
            }
        },

        getLabeledParticipant: function (label) {
            for (var index = this.participants.length; index--;) {
                var participant = this.participants[index];
                if (participant.collabAttribs.label == label) return participant
            }
        },

        getLabeledParticipants: function (labels) {
            var result = [];
            for (var index = this.participants.length; index--;) {
                var participant = this.participants[index];
                (!labels || labels.indexOf(participant.collabAttribs.label) != -1) && result.push(participant)
            }
            return result
        },

        start: function () {
            for (var index = this.participants.length; index--;) {
                var participant = this.participants[index];
                participant.collaboration = this;
                if (participant == this.initiator) participant.addActionAttached(this);
                else {
                    participant.setTarget(this.initiator.getTarget(true));
                    participant.doCollabReaction(participant.collabAttribs.collabKey)
                }
            }
            sc.combat.collabs.push(this)
        },

        doReaction: function (key, labels) {
            for (var index = this.participants.length; index--;) {
                var participant = this.participants[index];
                (!labels || labels.indexOf(participant.collabAttribs.label) != -1) && participant.doCollabReaction(key)
            }
        },

        getCenterPos: function (out, align, labels) {
            var participants = this.participants,
                index = participants.length;
            Vec3.assignC(out, 0, 0, 0);
            var count = 0;
            for (; index--;) {
                var participant = participants[index];
                if (!(labels && labels.indexOf(participant.collabAttribs.label) == -1)) {
                    Vec3.add(out, participant.getAlignedPos(align, centerPosScratch));
                    count++
                }
            }
            Vec3.mulF(out, 1 / count);
            return out
        },

        addParticipant: function (participant, collabKey, label) {
            if (this.participants.indexOf(participant) != -1) return false;
            this.participants.push(participant);
            participant.collabAttribs = {
                label: label,
                collabKey: collabKey,
                point: null,
                entity: null
            };
            return true
        },

        removeParticipant: function (participant) {
            var index = this.participants.indexOf(participant);
            if (index == -1) throw Error("Removed Participant that is not part of collab - this should never happen");
            participant.removeActionAttached(this);
            participant.collaboration = null;
            participant.collabAttribs = null;
            this.participants.splice(index, 1);
            this.breakType == sc.ENEMY_COLLAB_BREAK.ANY ? this.cancel() : participant == this.initiator && this.breakType == sc.ENEMY_COLLAB_BREAK.INITIATOR ? this.cancel() : this.participants.length == 0 && this.cancel()
        },

        onActionEndDetach: function (participant) {
            this.removeParticipant(participant)
        },

        cancel: function () {
            for (var index = this.attached.length; index--;) this.attached[index].onCollabEndDetach(this);
            for (index = this.participants.length; index--;) {
                var participant = this.participants[index];
                participant.removeActionAttached(this);
                participant.collaboration = null;
                participant.collabAttribs = null;
                participant.cancelAction()
            }
            this.participants.length = 0;
            this.initiator = null;
            sc.combat.collabs.erase(this)
        }
    })
});
ig.baked = !0;
