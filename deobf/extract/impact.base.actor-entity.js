ig.module("impact.base.actor-entity").requires("impact.base.entity", "impact.base.action").defines(function() {
    var b = ig.ACTOR_RUN_THRESHOLD = 0.75;
    ig.ActorConfig = ig.Class.extend({
        empty: true,
        data: {},
        original: null,
        init: function(a, b) {
            a && this.loadFromData(a, b || null)
        },
        get: function(a) {
            return this.data[a]
        },
        overwrite: function(a, b) {
            if (!this.original) {
                this.original = this.data;
                this.data = ig.copy(this.original)
            }
            this.data[a] = b
        },
        clearOverwrite: function() {
            if (this.original) {
                this.data = this.original;
                this.original = null
            }
        },
        loadFromConfig: function(a) {
            this.empty = false;
            for (var b in ig.ACTOR_CONFIGS)
                for (var d in ig.ACTOR_CONFIGS[b].KEYS) this.data[d] = a.data[d]
        },
        loadFromData: function(a, b) {
            this.empty = false;
            for (var d in ig.ACTOR_CONFIGS)
                for (var g in ig.ACTOR_CONFIGS[d].KEYS) this.data[g] = a[g] != void 0 ? a[g] : b && b.data[g] != void 0 ? b.data[g] : ig.ACTOR_CONFIGS[d].KEYS[g];
            for (d in ig.ACTOR_CONFIGS) ig.ACTOR_CONFIGS[d].fromDataFix && ig.ACTOR_CONFIGS[d].fromDataFix.call(this.data)
        },
        loadFromEntity: function(a) {
            this.empty = false;
            for (var b in ig.ACTOR_CONFIGS) a instanceof
            ig.ACTOR_CONFIGS[b].classType && ig.ACTOR_CONFIGS[b].load.call(this.data, a)
        },
        apply: function(a) {
            if (!this.empty)
                for (var b in ig.ACTOR_CONFIGS) a instanceof ig.ACTOR_CONFIGS[b].classType && ig.ACTOR_CONFIGS[b].apply.call(this.data, a)
        }
    });
    ig.ACTOR_CONFIGS = {};
    var a = Vec2.create(),
        d = {};
    ig.ActorEntity = ig.AnimatedEntity.extend({
        animSheet: {
            anims: {}
        },
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
        storedWalkAnims: {
            none: {}
        },
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
        defaultConfig: new ig.ActorConfig,
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
        init: function(a, b, d, g) {
            this.parent(a, b, d, g);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.zGravityFactor = 1;
            this.initAnimations()
        },
        onKill: function(a) {
            this.clearActionAttached();
            this.currentActionStep = this.currentAction = null;
            this.parent(a)
        },
        initAnimations: function(a) {
            if (a || !this.animState.hasAnimations()) {
                a = "";
                if (this.walkAnims &&
                    this.walkAnims.idle) a = this.walkAnims.idle;
                else
                    for (a in this.animSheet.anims) break;
                this.currentAnim = a;
                (a = this.animSheet.anims[this.currentAnim]) && this.animState.setAnimation(this, a.getAnimations(this))
            }
        },
        hasAction: function() {
            return this.currentAction != null
        },
        setDefaultConfig: function(a) {
            this.defaultConfig = a;
            this.jumping && this._savePreJumpStats();
            this.currentAction || this.defaultConfig && this.defaultConfig.apply(this);
            if (this.jumping) {
                this._loadPreJumpStats();
                this.preJumpStats.accelSpeed = this.defaultConfig.get("accelSpeed");
                this.preJumpStats.maxVel = this.defaultConfig.get("maxVel");
                this.preJumpStats.zGravityFactor = this.defaultConfig.get("zGravityFactor");
                this.preJumpStats.floatHeight = this.defaultConfig.get("floatHeight")
            }
        },
        setAttribute: function(a, b) {
            this.attributes[a] = b
        },
        getAttribute: function(a) {
            return this.attributes[a]
        },
        getAttribVec2: function(a) {
            return !this.attributes[a] || this.attributes[a].x === void 0 ? null : this.attributes[a]
        },
        getAttribVec3: function(a) {
            return !this.attributes[a] || this.attributes[a].x === void 0 ? null : this.attributes[a]
        },
        getAttribString: function(a) {
            return !this.attributes[a] || typeof this.attributes[a] != "string" ? null : this.attributes[a]
        },
        getAttribCondition: function(a) {
            return !this.attributes[a] || !this.attributes[a] instanceof ig.VarCondition ? null : this.attributes[a]
        },
        setFace: function(a) {
            ig.ActorEntity.getFaceVec(a, this.face)
        },
        getTarget: function() {
            return this.target
        },
        getFaceOffset: function() {
            var a = typeof this.currentAnim == "string" ? this.animSheet.anims[this.currentAnim] : this.currentAnim;
            return a && a.getAnchorOffset ? a.getAnchorOffset(this.face.x,
                this.face.y) : null
        },
        setAction: function(a, b, d) {
            this.cancelJump();
            this.cancelAction(d);
            this.currentAction = a;
            this.keepStateAfterAction = b || false;
            this.currentActionStep = null
        },
        forceExecuteAction: function() {
            if (this.currentAction) {
                ig.vars.pushEntityAccessor(this);
                var a;
                do {
                    a = this.currentAction;
                    if (this.currentAction.run(this)) this.inlineActionStack.length ? this.popInlineAction() : this.currentAction = null
                } while (this.currentAction && a != this.currentAction);
                ig.vars.popEntityAccessor(this)
            }
        },
        cancelAction: function(a) {
            if (this.currentAction) {
                this.cancelJump();
                if (!a) {
                    this.clearActionAttached();
                    this.keepStateAfterAction || this.defaultConfig.apply(this)
                }
                this.inlineActionStack.length = 0;
                this.currentActionStep = this.currentAction = null
            }
        },
        pushInlineAction: function(a, b, d) {
            var g = this.currentActionStep || this.currentAction.rootStep,
                h = g;
            b || (h = g && g.getNext(this));
            h && this.inlineActionStack.push({
                action: this.currentAction,
                step: h,
                reset: d
            });
            this.currentAction = a;
            this.currentActionStep = null
        },
        popInlineAction: function() {
            var a = this.inlineActionStack.pop();
            if (a) {
                this.currentAction =
                    a.action;
                this.currentAction.inlineStart(this, a.step);
                if (a.reset) {
                    this.clearActionAttached();
                    this.defaultConfig.apply(this)
                }
            }
        },
        stashAction: function(a) {
            if (this.currentAction) {
                this.stashed.action = this.currentAction;
                this.stashed.step = this.currentActionStep;
                this.stashed.timer = this.stepTimer;
                this.stashed.data = ig.copy(this.stepData);
                if (this.inlineActionStack.length > 0) this.stashed.inlineStack = ig.copy(this.inlineActionStack);
                this.cancelAction(a)
            }
        },
        hasStashedAction: function() {
            return !!this.stashed.action
        },
        clearStashedAction: function() {
            this.stashed.action =
                null;
            this.stashed.inlineStack = null
        },
        resumeStashedAction: function(a) {
            if (this.stashed.action) {
                this.setAction(this.stashed.action, false, a);
                this.currentActionStep = this.stashed.step;
                this.stepTimer = this.stashed.timer;
                this.stepData = this.stashed.data;
                this.stashed.action = null;
                this.inlineActionStack.length = 0;
                this.stashed.inlineStack && this.inlineActionStack.push.apply(this.inlineActionStack, this.stashed.inlineStack);
                this.stashed.inlineStack = null
            }
        },
        cancelJump: function() {
            if (this.jumping || this.floatJump) {
                if (this.floatJump) this.floatJump =
                    0;
                this._loadPreJumpStats();
                this.coll.totalBlockTimer = 0;
                this.jumping = false
            }
        },
        addActionAttached: function(a) {
            a && this.actionAttached.push(a)
        },
        removeActionAttached: function(a) {
            a = this.actionAttached.indexOf(a);
            if (a != -1) {
                this.actionAttached.splice(a, 1);
                return true
            }
            return false
        },
        clearActionAttached: function(a, b) {
            for (var d = this.actionAttached.length; d--;)
                if (!a || a(this.actionAttached[d], b)) {
                    this.actionAttached[d].onActionEndDetach(this);
                    a && this.actionAttached.splice(d, 1)
                } if (!a) this.actionAttached = []
        },
        setWalkAnims: function(a) {
            if (typeof a ==
                "string") {
                if (this.storedWalkAnims[a]) {
                    this.walkAnimsName = a;
                    this.walkAnims = this.storedWalkAnims[a]
                }
            } else {
                this.walkAnimsName = null;
                this.walkAnims = a
            }
        },
        storeWalkAnims: function(a, b) {
            this.storedWalkAnims[a] = b
        },
        update: function() {
            var a = this.getTarget();
            if (this.faceToTarget.active && a) {
                this.forceFaceDirFixed = true;
                var d = Vec2.sub(a.getCenter(), this.getCenter());
                Vec2.isZero(d) && Vec2.assignC(d, 0, 1);
                this.faceToTarget.offset && Vec2.rotate(d, this.faceToTarget.offset * 2 * Math.PI);
                Vec2.rotateToward(this.face, d, this.faceToTarget.speed *
                    Math.PI * 2 * ig.system.tick)
            } else this.forceFaceDirFixed = false;
            d = this.coll;
            if (this.floatJump) {
                this.jumping = this.jumping - ig.system.tick;
                d.vel.z = this.floatJump;
                this.jumping < 0 && this.cancelJump()
            }
            if (this.jumpingEnabled && d.totalBlockTimer > 0.05 && (d.accelDir.x || d.accelDir.y) && (d.pos.z == this.coll.baseZPos || d.float.height) && !this.jumping) {
                var f = ig.EntityTools.getGroundEntity(this);
                if (f && f.onTopEntityJump) f.onTopEntityJump(this);
                else if (this._checkForUpwardJump()) this.secondJumpCheck ? d.float.height ? this.doFloatJump(80,
                    0.3, 100) : this.doJump(185, 16, 100) : this.secondJumpCheck = true;
                else {
                    this.secondJumpCheck = false;
                    d.totalBlockTimer = 0
                }
            } else this.secondJumpCheck = false;
            var f = false,
                a = 0,
                g = !!this.currentAction;
            do {
                a++;
                if (this.currentAction) {
                    var h;
                    do {
                        h = this.currentAction;
                        if (this.currentAction.run(this))
                            if (this.inlineActionStack.length) this.popInlineAction();
                            else {
                                this.cancelAction();
                                f = true
                            }
                    } while (this.currentAction && h != this.currentAction)
                }
                if (this.postActionUpdate) {
                    this.postActionUpdate();
                    f = f || !g && this.currentAction
                }
            } while (f &&
                this.currentAction && a == 1);
            f = d.pos.z > this.coll.baseZPos + ig.COLLISION.EPS;
            if (this.jumping && d.vel.z <= 0 && !f) this.onTouchGround(0);
            if (this.fly.height && !this.fly.blocked) {
                a = this.getTarget();
                g = d.baseZPos;
                h = this.fly.lastZ;
                if (!this.fly.keepHeight && a && !a.jumping) h = a.coll.pos.z;
                this.fly.minHeight && (h = Math.max(h, this.fly.minHeight));
                d.float.height = Math.max(8, h - g + this.fly.height);
                this.fly.lastZ = g + d.float.height - this.fly.height
            }
            if (this.fly.blocked > 0) {
                this.fly.blocked = this.fly.blocked - ig.system.tick;
                if (this.fly.blocked <=
                    0) this.fly.blocked = 0
            }
            if (this.walkAnims.idle && (!this.currentAnim || this.currentAnim != this.walkAnims.land)) {
                a = !d.float.height && (this.jumping || d.vel.z > 0 || d.pos.z > d.baseZPos + ig.COLLISION.HEIGHT_TOLERATE);
                g = Vec2.length(d.vel);
                if (a) this.animationFixed || (d.vel.z >= 0 ? this.setCurrentAnim(this.walkAnims.jump || this.walkAnims.hover || this.walkAnims.idle, true) : this.setCurrentAnim(this.walkAnims.fall || this.walkAnims.jump || this.walkAnims.hover || this.walkAnims.idle, true));
                else if (d.accelDir.x == 0 && d.accelDir.y == 0) {
                    if (!this.fly.height &&
                        this.floatHeightOnMove) d.float.height = Math.max(0, d.float.height - this.floatHeightOnMove * 4 * ig.system.tick);
                    this.animationFixed || (this.walkAnims.hover && f ? this.setCurrentAnim(this.walkAnims.hover) : !this.walkAnims.brake || g < 8 || d.friction.terrain < 0.8 && g < d.maxVel / 2 || this.currentAnim == this.walkAnims.move || this.currentAnim == this.walkAnims.moveLeft || this.currentAnim == this.walkAnims.moveRev ? this.walkAnims.preIdle && this.walkAnims.brake && this.currentAnim == this.walkAnims.brake ? this.setCurrentAnim(this.walkAnims.preIdle,
                        true, this.walkAnims.idle) : this.setCurrentAnim(this.walkAnims.idle) : this.currentAnim != this.walkAnims.idle && this.setCurrentAnim(this.walkAnims.brake, true))
                } else {
                    if (!this.fly.height && this.floatHeightOnMove) d.float.height = this.floatHeightOnMove;
                    if (!this.faceDirFixed && !this.forceFaceDirFixed) {
                        this.face.x = d.accelDir.x;
                        this.face.y = d.accelDir.y
                    }
                    if (!this.animationFixed) {
                        f = d.float.height && this.walkAnims.preHoverMove ? this.walkAnims.preHoverMove : this.walkAnims.preMove;
                        if (d.float.height && this.walkAnims.hoverMove) {
                            d =
                                this.walkAnims.hoverMoveRev && Vec2.dot(d.accelDir, this.face) < 0 ? true : false;
                            f ? this.setCurrentAnim(f, true, d ? this.walkAnims.hoverMoveRev : this.walkAnims.hoverMove) : this.setCurrentAnim(d ? this.walkAnims.hoverMoveRev : this.walkAnims.hoverMove, true)
                        } else {
                            h = b;
                            if (this.currentAnim == this.walkAnims.run || this.currentAnim == this.walkAnims.runRev) h = h - 0.2;
                            a = d.relativeVel < h ? this.walkAnims.move : this.walkAnims.run || this.walkAnims.move;
                            g = d.relativeVel < h ? this.walkAnims.moveRev : this.walkAnims.runRev || this.walkAnims.moveRev;
                            h = d.relativeVel < h ? this.walkAnims.moveLeft : this.walkAnims.runLeft || this.walkAnims.moveLeft;
                            g && Vec2.dot(d.accelDir, this.face);
                            a = g && Vec2.dot(d.accelDir, this.face) < 0 ? g : d.accelDir.x < 0 ? h || a : a;
                            f && d.relativeVel >= b ? this.setCurrentAnim(f, true, a || this.walkAnims.idle) : this.setCurrentAnim(a || this.walkAnims.idle, true)
                        }
                    }
                }
            }
            this.parent()
        },
        _checkForUpwardJump: function() {
            var b = this.coll,
                b = ig.getDirectionIndex(b.accelDir.x, b.accelDir.y, 8),
                b = ig.getDirectionVel(b, 8, a),
                e = ig.game.physics.initTraceResult(d);
            if (!ig.game.traceEntity(e,
                    this, b.x, b.y, 0, 0, 0, ig.COLLTYPE.IGNORE)) return false;
            e = ig.game.physics.initTraceResult(d);
            return ig.game.traceEntity(e, this, b.x, b.y, 0, 0, 19) ? false : true
        },
        onTouchGround: function() {
            this.cancelJump();
            if (this.walkAnims.land && !this.animationFixed) {
                this.setCurrentAnim(this.walkAnims.land, true, this.walkAnims.idle, true);
                this.updateAnim()
            }
        },
        _savePreJumpStats: function() {
            this.preJumpStats.maxVel = this.coll.maxVel;
            this.preJumpStats.accelSpeed = this.coll.accelSpeed;
            this.preJumpStats.zGravityFactor = this.coll.zGravityFactor;
            this.preJumpStats.floatHeight = this.coll.float.height;
            this.preJumpStats.airFriction = this.coll.friction.air
        },
        _loadPreJumpStats: function() {
            this.coll.maxVel = this.preJumpStats.maxVel;
            this.coll.accelSpeed = this.preJumpStats.accelSpeed;
            this.coll.zGravityFactor = this.preJumpStats.zGravityFactor;
            this.coll.float.height = this.preJumpStats.floatHeight;
            this.coll.friction.air = this.preJumpStats.airFriction
        },
        doJump: function(a, b, d, g, h) {
            this.cancelJump();
            this._savePreJumpStats();
            this.coll.vel.z = a;
            this.jumping = true;
            if (d) this.coll.maxVel =
                d;
            if (g !== void 0 && g !== null) this.coll.accelSpeed = g;
            this.onJump(b, h)
        },
        doFloatJump: function(a, b, d) {
            if (!this.fly.height) {
                this.cancelJump();
                this._savePreJumpStats();
                this.floatJump = a || 10;
                this.coll.float.height = 0;
                this.coll.zGravityFactor = 0;
                this.jumping = b;
                if (d) this.coll.maxVel = d
            }
        },
        onFallFromEdge: function(a) {
            var b = this.coll;
            if (this.jumpingEnabled && (b.accelDir.x || b.accelDir.y) && Vec2.length(b.vel) / b.maxVel > 0.5 && (!a || Vec2.dot(a, b.accelDir) / Vec2.length(a) / Vec2.length(b.accelDir) > 0.5)) {
                var a = false,
                    d = ig.EntityTools.getGroundEntity(this);
                d && d.onTopEntityJumpFar && (a = d.onTopEntityJumpFar(this));
                a || (b.float.height ? this.doFloatJump(10, 0.3) : this.doJump(155, 0, null, this.isPlayer ? 0.1 : 1))
            }
        },
        onVarAccess: function(a, b) {
            return b[1] == "attrib" ? ig.vars.resolveObjectAccess(this.attributes, b, 2) : b[1] == "face" ? ig.vars.resolveObjectAccess(this.face, b, 2) : this.parent(a, b)
        },
        onJump: function() {}
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
    ig.ActorEntity.getFaceVec =
        function(a, b) {
            var d = b || Vec2.create();
            switch (a) {
                case 0:
                    Vec2.assignC(d, 0, -1);
                    break;
                case 1:
                    Vec2.assignC(d, 1, 0);
                    break;
                case 2:
                    Vec2.assignC(d, 0, 1);
                    break;
                case 3:
                    Vec2.assignC(d, -1, 0);
                    break;
                case 4:
                    Vec2.assignC(d, 1, -1);
                    break;
                case 5:
                    Vec2.assignC(d, 1, 1);
                    break;
                case 6:
                    Vec2.assignC(d, -1, 1);
                    break;
                case 7:
                    Vec2.assignC(d, -1, -1)
            }
            return d
        };
    ig.ACTOR_ATTRIB_CONNECTION = {};
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
            maxZVel: 1E3,
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
        fromDataFix: function() {
            typeof this.collType == "string" && (this.collType = ig.COLLTYPE[this.collType]);
            typeof this.collShape == "string" && (this.collShape = ig.COLLSHAPE[this.collShape]);
            typeof this.shadowType == "string" && (this.shadowType = ig.COLL_SHADOW_TYPE[this.shadowType]);
            typeof this.groundConnect == "string" && (this.groundConnect = ig.COLL_GROUND_CONNECT[this.groundConnect])
        },
        apply: function(a) {
            a.setWalkAnims(this.walkAnims);
            if (this.currentAnim) a.currentAnim = this.currentAnim;
            if (this.followUpAnim) a.followUpAnim =
                this.followUpAnim;
            a.coll.accelSpeed = this.accelSpeed;
            a.coll.ignoreCollision = this.ignoreCollision;
            a.coll.groundConnect = this.groundConnect;
            a.coll.friction.ground = this.friction;
            a.coll.friction.air = this.airFriction;
            a.coll.friction.ignoreTerrain = this.terrainFrictionIgnore;
            a.coll.weight = this.weight;
            a.coll.maxVel = this.maxVel;
            a.coll.maxZVel = this.maxZVel;
            a.coll.relativeVel = this.relativeVel;
            a.coll.shadow.size = this.shadow;
            a.coll.shadow.type = this.shadowType;
            a.coll.shadow.scaleY = this.shadowScaleY || 1;
            a.faceDirFixed =
                this.faceDirFixed;
            a.jumpingEnabled = this.jumpingEnabled;
            a.coll.setType(this.collType);
            a.coll.shape = this.collShape;
            a.animationFixed = this.animationFixed;
            a.coll.bounciness = this.bounciness;
            a.coll.zBounciness = this.zBounciness;
            a.coll.zGravityFactor = this.zGravityFactor;
            a.coll.time.animStatic = this.staticTime;
            a.floatHeightOnMove = 0;
            a.fly.height = 0;
            this.flyHeight ? a.fly.height = this.flyHeight : this.floatHeightOnMove ? a.floatHeightOnMove = this.floatHeightOnMove : a.coll.float.height = this.floatHeight;
            a.fly.keepHeight =
                this.flyKeepHeight;
            a.coll.float.variance = this.floatVariance;
            a.coll.float.accel = this.floatAccel;
            a.coll.float.maxSpeed = this.floatMaxSpeed;
            a.faceToTarget.active = this.faceToTarget;
            a.faceToTarget.offset = this.faceToTargetOffset;
            a.faceToTarget.speed = this.faceToTargetSpeed
        },
        load: function(a) {
            this.walkAnims = a.walkAnimsName;
            this.currentAnim = a.currentAnim;
            this.followUpAnim = a.followUpAnim;
            this.accelSpeed = a.coll.accelSpeed;
            this.ignoreCollision = a.coll.ignoreCollision;
            this.groundConnect = a.coll.groundConnect;
            this.friction =
                a.coll.friction.ground;
            this.airFriction = a.coll.friction.air;
            this.terrainFrictionIgnore = a.coll.friction.ignoreTerrain;
            this.weight = a.coll.weight;
            this.maxVel = a.coll.maxVel;
            this.maxZVel = a.coll.maxZVel;
            this.relativeVel = a.coll.relativeVel;
            this.faceDirFixed = a.faceDirFixed;
            this.jumpingEnabled = a.jumpingEnabled;
            this.shadow = a.coll.shadow.size;
            this.shadowScaleY = a.coll.shadow.scaleY;
            this.shadowType = a.coll.shadow.type;
            this.collType = a.coll.type;
            this.collShape = a.coll.shape;
            this.animationFixed = a.animationFixed;
            this.bounciness =
                a.coll.bounciness;
            this.zBounciness = a.coll.zBounciness;
            this.zGravityFactor = a.coll.zGravityFactor;
            this.staticTime = a.coll.time.animStatic;
            this.flyHeight = this.floatHeightOnMove = 0;
            a.fly.height ? this.flyHeight = a.fly.height : a.floatHeightOnMove ? this.floatHeightOnMove = a.floatHeightOnMove : this.floatHeight = a.coll.float.height;
            this.flyKeepHeight = a.fly.keepHeight;
            this.floatVariance = a.coll.float.variance;
            this.floatAccel = a.coll.float.accel;
            this.floatMaxSpeed = a.coll.float.maxSpeed;
            this.faceToTarget = a.faceToTarget.active;
            this.faceToTargetOffset = a.faceToTarget.offset;
            this.faceToTargetSpeed = a.faceToTarget.speed
        }
    }
});
ig.baked = !0;
