/*
 * impact.base.actor-entity
 * ------------------------
 * `ig.ActorEntity` — the animated, action/state-driven entity base used by
 * nearly every character in the game — plus the `ig.ActorConfig` system that
 * maps a plain "actor config" data object onto an entity (and back).
 *
 * Original: deobf/extract/impact.base.actor-entity.js
 * Faithful to the original logic — only local names and docs were added.
 */

ig.module("impact.base.actor-entity").requires("impact.base.entity", "impact.base.action").defines(function () {
    var ACTOR_RUN_THRESHOLD = (ig.ACTOR_RUN_THRESHOLD = 0.75);

    /**
     * A runtime actor configuration. Loads key/value data from an entity or
     * a raw data object, applies it to entities, and supports temporary
     * `overwrite`/`clearOverwrite` for runtime tweaks.
     */
    ig.ActorConfig = ig.Class.extend({
        empty: true,
        data: {},
        original: null,

        init: function (data, source) {
            data && this.loadFromData(data, source || null);
        },

        get: function (key) {
            return this.data[key];
        },

        overwrite: function (key, value) {
            if (!this.original) {
                this.original = this.data;
                this.data = ig.copy(this.original);
            }
            this.data[key] = value;
        },

        clearOverwrite: function () {
            if (this.original) {
                this.data = this.original;
                this.original = null;
            }
        },

        loadFromConfig: function (config) {
            this.empty = false;
            for (var group in ig.ACTOR_CONFIGS) {
                for (var key in ig.ACTOR_CONFIGS[group].KEYS) this.data[key] = config.data[key];
            }
        },

        loadFromData: function (data, source) {
            this.empty = false;
            for (var group in ig.ACTOR_CONFIGS) {
                for (var key in ig.ACTOR_CONFIGS[group].KEYS) {
                    this.data[key] = data[key] != void 0 ? data[key] : source && source.data[key] != void 0 ? source.data[key] : ig.ACTOR_CONFIGS[group].KEYS[key];
                }
            }
            for (group in ig.ACTOR_CONFIGS) ig.ACTOR_CONFIGS[group].fromDataFix && ig.ACTOR_CONFIGS[group].fromDataFix.call(this.data);
        },

        loadFromEntity: function (entity) {
            this.empty = false;
            for (var group in ig.ACTOR_CONFIGS) {
                entity instanceof ig.ACTOR_CONFIGS[group].classType && ig.ACTOR_CONFIGS[group].load.call(this.data, entity);
            }
        },

        apply: function (entity) {
            if (!this.empty) {
                for (var group in ig.ACTOR_CONFIGS) {
                    entity instanceof ig.ACTOR_CONFIGS[group].classType && ig.ACTOR_CONFIGS[group].apply.call(this.data, entity);
                }
            }
        }
    });

    ig.ACTOR_CONFIGS = {};

    var scratchDirVec = Vec2.create();
    var traceResultTemplate = {};

    ig.ActorEntity = ig.AnimatedEntity.extend({
        animSheet: { anims: {} },
        face: Vec2.createC(0, 1),
        currentAnim: null,
        followUpAnim: null,
        faceDirFixed: false,
        forceFaceDirFixed: false,
        animationFixed: false,
        floatHeightOnMove: 0,
        fly: {
            height: 0,
            minHeight: 0,
            lastZ: 0,
            keepHeight: false,
            blocked: false
        },
        walkAnimsName: null,
        walkAnims: {
            idle: null,
            preMove: null,
            move: null,
            moveRev: null,
            moveLeft: null,
            run: null,
            runRev: null,
            runLeft: null,
            brake: null,
            preIdle: null,
            jump: null,
            fall: null,
            hover: null,
            preHoverMove: null,
            hoverMove: null,
            hoverMoveRev: null,
            land: null
        },
        storedWalkAnims: { none: {} },
        currentAction: null,
        currentActionStep: null,
        stepTimer: 0,
        stepSync: 0,
        stepData: {},
        keepStateAfterAction: false,
        inlineActionStack: [],
        stashed: {
            action: null,
            step: 0,
            timer: 0,
            data: null
        },
        defaultConfig: new ig.ActorConfig(),
        jumpingEnabled: true,
        jumping: false,
        floatJump: 0,
        preJumpStats: {
            maxVel: 0,
            accelSpeed: 0,
            zGravityFactor: 0
        },
        actionAttached: [],
        attributes: {},
        faceToTarget: {
            active: false,
            offset: 0,
            speed: 2
        },

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.zGravityFactor = 1;
            this.initAnimations();
        },

        onKill: function (data) {
            this.clearActionAttached();
            this.currentActionStep = this.currentAction = null;
            this.parent(data);
        },

        initAnimations: function (force) {
            if (force || !this.animState.hasAnimations()) {
                var animName = "";
                if (this.walkAnims && this.walkAnims.idle) {
                    animName = this.walkAnims.idle;
                } else {
                    for (animName in this.animSheet.anims) break;
                }
                this.currentAnim = animName;
                (animName = this.animSheet.anims[this.currentAnim]) && this.animState.setAnimation(this, animName.getAnimations(this));
            }
        },

        hasAction: function () {
            return this.currentAction != null;
        },

        setDefaultConfig: function (config) {
            this.defaultConfig = config;
            this.jumping && this._savePreJumpStats();
            this.currentAction || (this.defaultConfig && this.defaultConfig.apply(this));
            if (this.jumping) {
                this._loadPreJumpStats();
                this.preJumpStats.accelSpeed = this.defaultConfig.get("accelSpeed");
                this.preJumpStats.maxVel = this.defaultConfig.get("maxVel");
                this.preJumpStats.zGravityFactor = this.defaultConfig.get("zGravityFactor");
                this.preJumpStats.floatHeight = this.defaultConfig.get("floatHeight");
            }
        },

        setAttribute: function (name, value) {
            this.attributes[name] = value;
        },

        getAttribute: function (name) {
            return this.attributes[name];
        },

        getAttribVec2: function (name) {
            return !this.attributes[name] || this.attributes[name].x === void 0 ? null : this.attributes[name];
        },

        getAttribVec3: function (name) {
            return !this.attributes[name] || this.attributes[name].x === void 0 ? null : this.attributes[name];
        },

        getAttribString: function (name) {
            return !this.attributes[name] || typeof this.attributes[name] != "string" ? null : this.attributes[name];
        },

        getAttribCondition: function (name) {
            return !this.attributes[name] || !(this.attributes[name] instanceof ig.VarCondition) ? null : this.attributes[name];
        },

        setFace: function (face) {
            ig.ActorEntity.getFaceVec(face, this.face);
        },

        getTarget: function () {
            return this.target;
        },

        getFaceOffset: function () {
            var anim = typeof this.currentAnim == "string" ? this.animSheet.anims[this.currentAnim] : this.currentAnim;
            return anim && anim.getAnchorOffset ? anim.getAnchorOffset(this.face.x, this.face.y) : null;
        },

        setAction: function (action, keepState, cancelFirst) {
            this.cancelJump();
            this.cancelAction(cancelFirst);
            this.currentAction = action;
            this.keepStateAfterAction = keepState || false;
            this.currentActionStep = null;
        },

        forceExecuteAction: function () {
            if (this.currentAction) {
                ig.vars.pushEntityAccessor(this);
                var prev;
                do {
                    prev = this.currentAction;
                    if (this.currentAction.run(this)) this.inlineActionStack.length ? this.popInlineAction() : (this.currentAction = null);
                } while (this.currentAction && prev != this.currentAction);
                ig.vars.popEntityAccessor(this);
            }
        },

        cancelAction: function (skipConfigReset) {
            if (this.currentAction) {
                this.cancelJump();
                if (!skipConfigReset) {
                    this.clearActionAttached();
                    this.keepStateAfterAction || this.defaultConfig.apply(this);
                }
                this.inlineActionStack.length = 0;
                this.currentActionStep = this.currentAction = null;
            }
        },

        pushInlineAction: function (action, resumeAtNext, resetConfig) {
            var nextStep = this.currentActionStep || this.currentAction.rootStep;
            var storedStep = nextStep;
            resumeAtNext || (storedStep = nextStep && nextStep.getNext(this));
            storedStep && this.inlineActionStack.push({
                action: this.currentAction,
                step: storedStep,
                reset: resetConfig
            });
            this.currentAction = action;
            this.currentActionStep = null;
        },

        popInlineAction: function () {
            var stored = this.inlineActionStack.pop();
            if (stored) {
                this.currentAction = stored.action;
                this.currentAction.inlineStart(this, stored.step);
                if (stored.reset) {
                    this.clearActionAttached();
                    this.defaultConfig.apply(this);
                }
            }
        },

        stashAction: function (cancelFirst) {
            if (this.currentAction) {
                this.stashed.action = this.currentAction;
                this.stashed.step = this.currentActionStep;
                this.stashed.timer = this.stepTimer;
                this.stashed.data = ig.copy(this.stepData);
                if (this.inlineActionStack.length > 0) this.stashed.inlineStack = ig.copy(this.inlineActionStack);
                this.cancelAction(cancelFirst);
            }
        },

        hasStashedAction: function () {
            return !!this.stashed.action;
        },

        clearStashedAction: function () {
            this.stashed.action = null;
            this.stashed.inlineStack = null;
        },

        resumeStashedAction: function (cancelFirst) {
            if (this.stashed.action) {
                this.setAction(this.stashed.action, false, cancelFirst);
                this.currentActionStep = this.stashed.step;
                this.stepTimer = this.stashed.timer;
                this.stepData = this.stashed.data;
                this.stashed.action = null;
                this.inlineActionStack.length = 0;
                this.stashed.inlineStack && this.inlineActionStack.push.apply(this.inlineActionStack, this.stashed.inlineStack);
                this.stashed.inlineStack = null;
            }
        },

        cancelJump: function () {
            if (this.jumping || this.floatJump) {
                if (this.floatJump) this.floatJump = 0;
                this._loadPreJumpStats();
                this.coll.totalBlockTimer = 0;
                this.jumping = false;
            }
        },

        addActionAttached: function (entity) {
            entity && this.actionAttached.push(entity);
        },

        removeActionAttached: function (entity) {
            entity = this.actionAttached.indexOf(entity);
            if (entity != -1) {
                this.actionAttached.splice(entity, 1);
                return true;
            }
            return false;
        },

        clearActionAttached: function (filter, arg) {
            for (var i = this.actionAttached.length; i--;) {
                if (!filter || filter(this.actionAttached[i], arg)) {
                    this.actionAttached[i].onActionEndDetach(this);
                    filter && this.actionAttached.splice(i, 1);
                }
            }
            if (!filter) this.actionAttached = [];
        },

        setWalkAnims: function (anims) {
            if (typeof anims == "string") {
                if (this.storedWalkAnims[anims]) {
                    this.walkAnimsName = anims;
                    this.walkAnims = this.storedWalkAnims[anims];
                }
            } else {
                this.walkAnimsName = null;
                this.walkAnims = anims;
            }
        },

        storeWalkAnims: function (name, anims) {
            this.storedWalkAnims[name] = anims;
        },

        update: function () {
            var target = this.getTarget();
            if (this.faceToTarget.active && target) {
                this.forceFaceDirFixed = true;
                var toTarget = Vec2.sub(target.getCenter(), this.getCenter());
                Vec2.isZero(toTarget) && Vec2.assignC(toTarget, 0, 1);
                this.faceToTarget.offset && Vec2.rotate(toTarget, this.faceToTarget.offset * 2 * Math.PI);
                Vec2.rotateToward(this.face, toTarget, this.faceToTarget.speed * Math.PI * 2 * ig.system.tick);
            } else {
                this.forceFaceDirFixed = false;
            }
            var coll = this.coll;
            if (this.floatJump) {
                this.jumping = this.jumping - ig.system.tick;
                coll.vel.z = this.floatJump;
                this.jumping < 0 && this.cancelJump();
            }
            if (this.jumpingEnabled && coll.totalBlockTimer > 0.05 && (coll.accelDir.x || coll.accelDir.y) && (coll.pos.z == this.coll.baseZPos || coll.float.height) && !this.jumping) {
                var groundEntity = ig.EntityTools.getGroundEntity(this);
                if (groundEntity && groundEntity.onTopEntityJump) {
                    groundEntity.onTopEntityJump(this);
                } else if (this._checkForUpwardJump()) {
                    this.secondJumpCheck ? (coll.float.height ? this.doFloatJump(80, 0.3, 100) : this.doJump(185, 16, 100)) : (this.secondJumpCheck = true);
                } else {
                    this.secondJumpCheck = false;
                    coll.totalBlockTimer = 0;
                }
            } else {
                this.secondJumpCheck = false;
            }
            var actionEnded = false;
            var iterations = 0;
            var hadAction = !!this.currentAction;
            do {
                iterations++;
                if (this.currentAction) {
                    var prevAction;
                    do {
                        prevAction = this.currentAction;
                        if (this.currentAction.run(this)) {
                            if (this.inlineActionStack.length) this.popInlineAction();
                            else {
                                this.cancelAction();
                                actionEnded = true;
                            }
                        }
                    } while (this.currentAction && prevAction != this.currentAction);
                }
                if (this.postActionUpdate) {
                    this.postActionUpdate();
                    actionEnded = actionEnded || (!hadAction && this.currentAction);
                }
            } while (actionEnded && this.currentAction && iterations == 1);
            var inAir = coll.pos.z > this.coll.baseZPos + ig.COLLISION.EPS;
            if (this.jumping && coll.vel.z <= 0 && !inAir) this.onTouchGround(0);
            if (this.fly.height && !this.fly.blocked) {
                target = this.getTarget();
                var baseZ = coll.baseZPos;
                var targetZ = this.fly.lastZ;
                if (!this.fly.keepHeight && target && !target.jumping) targetZ = target.coll.pos.z;
                this.fly.minHeight && (targetZ = Math.max(targetZ, this.fly.minHeight));
                coll.float.height = Math.max(8, targetZ - baseZ + this.fly.height);
                this.fly.lastZ = baseZ + coll.float.height - this.fly.height;
            }
            if (this.fly.blocked > 0) {
                this.fly.blocked = this.fly.blocked - ig.system.tick;
                if (this.fly.blocked <= 0) this.fly.blocked = 0;
            }
            if (this.walkAnims.idle && (!this.currentAnim || this.currentAnim != this.walkAnims.land)) {
                var airborne = !coll.float.height && (this.jumping || coll.vel.z > 0 || coll.pos.z > coll.baseZPos + ig.COLLISION.HEIGHT_TOLERATE);
                var speed = Vec2.length(coll.vel);
                if (airborne) {
                    this.animationFixed || (coll.vel.z >= 0 ? this.setCurrentAnim(this.walkAnims.jump || this.walkAnims.hover || this.walkAnims.idle, true) : this.setCurrentAnim(this.walkAnims.fall || this.walkAnims.jump || this.walkAnims.hover || this.walkAnims.idle, true));
                } else if (coll.accelDir.x == 0 && coll.accelDir.y == 0) {
                    if (!this.fly.height && this.floatHeightOnMove) coll.float.height = Math.max(0, coll.float.height - this.floatHeightOnMove * 4 * ig.system.tick);
                    this.animationFixed || (this.walkAnims.hover && inAir ? this.setCurrentAnim(this.walkAnims.hover) : !this.walkAnims.brake || speed < 8 || (coll.friction.terrain < 0.8 && speed < coll.maxVel / 2) || this.currentAnim == this.walkAnims.move || this.currentAnim == this.walkAnims.moveLeft || this.currentAnim == this.walkAnims.moveRev ? (this.walkAnims.preIdle && this.walkAnims.brake && this.currentAnim == this.walkAnims.brake ? this.setCurrentAnim(this.walkAnims.preIdle, true, this.walkAnims.idle) : this.setCurrentAnim(this.walkAnims.idle)) : (this.currentAnim != this.walkAnims.idle && this.setCurrentAnim(this.walkAnims.brake, true)));
                } else {
                    if (!this.fly.height && this.floatHeightOnMove) coll.float.height = this.floatHeightOnMove;
                    if (!this.faceDirFixed && !this.forceFaceDirFixed) {
                        this.face.x = coll.accelDir.x;
                        this.face.y = coll.accelDir.y;
                    }
                    if (!this.animationFixed) {
                        var preMoveAnim = coll.float.height && this.walkAnims.preHoverMove ? this.walkAnims.preHoverMove : this.walkAnims.preMove;
                        if (coll.float.height && this.walkAnims.hoverMove) {
                            var reversed = this.walkAnims.hoverMoveRev && Vec2.dot(coll.accelDir, this.face) < 0 ? true : false;
                            preMoveAnim ? this.setCurrentAnim(preMoveAnim, true, reversed ? this.walkAnims.hoverMoveRev : this.walkAnims.hoverMove) : this.setCurrentAnim(reversed ? this.walkAnims.hoverMoveRev : this.walkAnims.hoverMove, true);
                        } else {
                            var runThreshold = ACTOR_RUN_THRESHOLD;
                            if (this.currentAnim == this.walkAnims.run || this.currentAnim == this.walkAnims.runRev) runThreshold = runThreshold - 0.2;
                            var moveAnim = coll.relativeVel < runThreshold ? this.walkAnims.move : this.walkAnims.run || this.walkAnims.move;
                            var moveRevAnim = coll.relativeVel < runThreshold ? this.walkAnims.moveRev : this.walkAnims.runRev || this.walkAnims.moveRev;
                            var moveLeftAnim = coll.relativeVel < runThreshold ? this.walkAnims.moveLeft : this.walkAnims.runLeft || this.walkAnims.moveLeft;
                            // (The original re-reads the dot product here; it has
                            //  no side effects beyond the read below.)
                            moveRevAnim && Vec2.dot(coll.accelDir, this.face);
                            var finalAnim = moveRevAnim && Vec2.dot(coll.accelDir, this.face) < 0 ? moveRevAnim : coll.accelDir.x < 0 ? moveLeftAnim || moveAnim : moveAnim;
                            preMoveAnim && coll.relativeVel >= ACTOR_RUN_THRESHOLD ? this.setCurrentAnim(preMoveAnim, true, finalAnim || this.walkAnims.idle) : this.setCurrentAnim(finalAnim || this.walkAnims.idle, true);
                        }
                    }
                }
            }
            this.parent();
        },

        _checkForUpwardJump: function () {
            var coll = this.coll;
            var dirIndex = ig.getDirectionIndex(coll.accelDir.x, coll.accelDir.y, 8);
            var dirVel = ig.getDirectionVel(dirIndex, 8, scratchDirVec);
            var result = ig.game.physics.initTraceResult(traceResultTemplate);
            if (!ig.game.traceEntity(result, this, dirVel.x, dirVel.y, 0, 0, 0, ig.COLLTYPE.IGNORE)) return false;
            result = ig.game.physics.initTraceResult(traceResultTemplate);
            return ig.game.traceEntity(result, this, dirVel.x, dirVel.y, 0, 0, 19) ? false : true;
        },

        onTouchGround: function () {
            this.cancelJump();
            if (this.walkAnims.land && !this.animationFixed) {
                this.setCurrentAnim(this.walkAnims.land, true, this.walkAnims.idle, true);
                this.updateAnim();
            }
        },

        _savePreJumpStats: function () {
            this.preJumpStats.maxVel = this.coll.maxVel;
            this.preJumpStats.accelSpeed = this.coll.accelSpeed;
            this.preJumpStats.zGravityFactor = this.coll.zGravityFactor;
            this.preJumpStats.floatHeight = this.coll.float.height;
            this.preJumpStats.airFriction = this.coll.friction.air;
        },

        _loadPreJumpStats: function () {
            this.coll.maxVel = this.preJumpStats.maxVel;
            this.coll.accelSpeed = this.preJumpStats.accelSpeed;
            this.coll.zGravityFactor = this.preJumpStats.zGravityFactor;
            this.coll.float.height = this.preJumpStats.floatHeight;
            this.coll.friction.air = this.preJumpStats.airFriction;
        },

        doJump: function (velZ, delay, maxVel, accelSpeed, arg) {
            this.cancelJump();
            this._savePreJumpStats();
            this.coll.vel.z = velZ;
            this.jumping = true;
            if (maxVel) this.coll.maxVel = maxVel;
            if (accelSpeed !== void 0 && accelSpeed !== null) this.coll.accelSpeed = accelSpeed;
            this.onJump(delay, arg);
        },

        doFloatJump: function (velZ, duration, maxVel) {
            if (!this.fly.height) {
                this.cancelJump();
                this._savePreJumpStats();
                this.floatJump = velZ || 10;
                this.coll.float.height = 0;
                this.coll.zGravityFactor = 0;
                this.jumping = duration;
                if (maxVel) this.coll.maxVel = maxVel;
            }
        },

        onFallFromEdge: function (edgeDir) {
            var coll = this.coll;
            if (this.jumpingEnabled && (coll.accelDir.x || coll.accelDir.y) && Vec2.length(coll.vel) / coll.maxVel > 0.5 && (!edgeDir || Vec2.dot(edgeDir, coll.accelDir) / Vec2.length(edgeDir) / Vec2.length(coll.accelDir) > 0.5)) {
                var jumpedFar = false;
                var groundEntity = ig.EntityTools.getGroundEntity(this);
                groundEntity && groundEntity.onTopEntityJumpFar && (jumpedFar = groundEntity.onTopEntityJumpFar(this));
                jumpedFar || (coll.float.height ? this.doFloatJump(10, 0.3) : this.doJump(155, 0, null, this.isPlayer ? 0.1 : 1));
            }
        },

        onVarAccess: function (access, path) {
            return path[1] == "attrib" ? ig.vars.resolveObjectAccess(this.attributes, path, 2) : path[1] == "face" ? ig.vars.resolveObjectAccess(this.face, path, 2) : this.parent(access, path);
        },

        onJump: function () {}
    });

    ig.ActorEntity.FACE4 = {
        NORTH: 0,
        EAST: 1,
        SOUTH: 2,
        WEST: 3
    };

    ig.ActorEntity.FACE8 = {
        NORTH: 0,
        EAST: 1,
        SOUTH: 2,
        WEST: 3,
        NORTH_EAST: 4,
        SOUTH_EAST: 5,
        SOUTH_WEST: 6,
        NORTH_WEST: 7
    };

    /** Convert a FACE4/FACE8 index into a unit direction vector. */
    ig.ActorEntity.getFaceVec = function (face, out) {
        var vec = out || Vec2.create();
        switch (face) {
            case 0: Vec2.assignC(vec, 0, -1); break;
            case 1: Vec2.assignC(vec, 1, 0); break;
            case 2: Vec2.assignC(vec, 0, 1); break;
            case 3: Vec2.assignC(vec, -1, 0); break;
            case 4: Vec2.assignC(vec, 1, -1); break;
            case 5: Vec2.assignC(vec, 1, 1); break;
            case 6: Vec2.assignC(vec, -1, 1); break;
            case 7: Vec2.assignC(vec, -1, -1); break;
        }
        return vec;
    };

    ig.ACTOR_ATTRIB_CONNECTION = {};

    // The base "ACTOR" actor-config group: keys, string->enum coercion,
    // entity-apply, and entity-load.
    ig.ACTOR_CONFIGS.ACTOR = {
        classType: ig.ActorEntity,
        KEYS: {
            walkAnims: null,
            currentAnim: null,
            followUpAnim: null,
            accelSpeed: 1,
            ignoreCollision: false,
            groundConnect: "LOOSE",
            staticTime: false,
            friction: 1,
            airFriction: 0.7,
            terrainFrictionIgnore: false,
            weight: 50,
            maxVel: 100,
            maxZVel: 1e3,
            zGravityFactor: 1,
            relativeVel: 1,
            faceDirFixed: false,
            jumpingEnabled: false,
            collType: ig.COLLTYPE.VIRTUAL,
            collShape: ig.COLLSHAPE.RECTANGLE,
            animationFixed: false,
            bounciness: 0,
            zBounciness: 0,
            floatHeight: 0,
            shadow: 0,
            shadowScaleY: 1,
            shadowType: ig.COLL_SHADOW_TYPE.DEFAULT,
            floatVariance: 3,
            floatAccel: 1,
            floatMaxSpeed: 300,
            floatHeightOnMove: 0,
            flyHeight: 0,
            flyKeepHeight: false,
            faceToTarget: false,
            faceToTargetOffset: 0,
            faceToTargetSpeed: 2
        },
        fromDataFix: function () {
            typeof this.collType == "string" && (this.collType = ig.COLLTYPE[this.collType]);
            typeof this.collShape == "string" && (this.collShape = ig.COLLSHAPE[this.collShape]);
            typeof this.shadowType == "string" && (this.shadowType = ig.COLL_SHADOW_TYPE[this.shadowType]);
            typeof this.groundConnect == "string" && (this.groundConnect = ig.COLL_GROUND_CONNECT[this.groundConnect]);
        },
        apply: function (entity) {
            entity.setWalkAnims(this.walkAnims);
            if (this.currentAnim) entity.currentAnim = this.currentAnim;
            if (this.followUpAnim) entity.followUpAnim = this.followUpAnim;
            entity.coll.accelSpeed = this.accelSpeed;
            entity.coll.ignoreCollision = this.ignoreCollision;
            entity.coll.groundConnect = this.groundConnect;
            entity.coll.friction.ground = this.friction;
            entity.coll.friction.air = this.airFriction;
            entity.coll.friction.ignoreTerrain = this.terrainFrictionIgnore;
            entity.coll.weight = this.weight;
            entity.coll.maxVel = this.maxVel;
            entity.coll.maxZVel = this.maxZVel;
            entity.coll.relativeVel = this.relativeVel;
            entity.coll.shadow.size = this.shadow;
            entity.coll.shadow.type = this.shadowType;
            entity.coll.shadow.scaleY = this.shadowScaleY || 1;
            entity.faceDirFixed = this.faceDirFixed;
            entity.jumpingEnabled = this.jumpingEnabled;
            entity.coll.setType(this.collType);
            entity.coll.shape = this.collShape;
            entity.animationFixed = this.animationFixed;
            entity.coll.bounciness = this.bounciness;
            entity.coll.zBounciness = this.zBounciness;
            entity.coll.zGravityFactor = this.zGravityFactor;
            entity.coll.time.animStatic = this.staticTime;
            entity.floatHeightOnMove = 0;
            entity.fly.height = 0;
            this.flyHeight ? (entity.fly.height = this.flyHeight) : this.floatHeightOnMove ? (entity.floatHeightOnMove = this.floatHeightOnMove) : (entity.coll.float.height = this.floatHeight);
            entity.fly.keepHeight = this.flyKeepHeight;
            entity.coll.float.variance = this.floatVariance;
            entity.coll.float.accel = this.floatAccel;
            entity.coll.float.maxSpeed = this.floatMaxSpeed;
            entity.faceToTarget.active = this.faceToTarget;
            entity.faceToTarget.offset = this.faceToTargetOffset;
            entity.faceToTarget.speed = this.faceToTargetSpeed;
        },
        load: function (entity) {
            this.walkAnims = entity.walkAnimsName;
            this.currentAnim = entity.currentAnim;
            this.followUpAnim = entity.followUpAnim;
            this.accelSpeed = entity.coll.accelSpeed;
            this.ignoreCollision = entity.coll.ignoreCollision;
            this.groundConnect = entity.coll.groundConnect;
            this.friction = entity.coll.friction.ground;
            this.airFriction = entity.coll.friction.air;
            this.terrainFrictionIgnore = entity.coll.friction.ignoreTerrain;
            this.weight = entity.coll.weight;
            this.maxVel = entity.coll.maxVel;
            this.maxZVel = entity.coll.maxZVel;
            this.relativeVel = entity.coll.relativeVel;
            this.faceDirFixed = entity.faceDirFixed;
            this.jumpingEnabled = entity.jumpingEnabled;
            this.shadow = entity.coll.shadow.size;
            this.shadowScaleY = entity.coll.shadow.scaleY;
            this.shadowType = entity.coll.shadow.type;
            this.collType = entity.coll.type;
            this.collShape = entity.coll.shape;
            this.animationFixed = entity.animationFixed;
            this.bounciness = entity.coll.bounciness;
            this.zBounciness = entity.coll.zBounciness;
            this.zGravityFactor = entity.coll.zGravityFactor;
            this.staticTime = entity.coll.time.animStatic;
            this.flyHeight = this.floatHeightOnMove = 0;
            entity.fly.height ? (this.flyHeight = entity.fly.height) : entity.floatHeightOnMove ? (this.floatHeightOnMove = entity.floatHeightOnMove) : (this.floatHeight = entity.coll.float.height);
            this.flyKeepHeight = entity.fly.keepHeight;
            this.floatVariance = entity.coll.float.variance;
            this.floatAccel = entity.coll.float.accel;
            this.floatMaxSpeed = entity.coll.float.maxSpeed;
            this.faceToTarget = entity.faceToTarget.active;
            this.faceToTargetOffset = entity.faceToTarget.offset;
            this.faceToTargetSpeed = entity.faceToTarget.speed;
        }
    };
});
ig.baked = !0;
