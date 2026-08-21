/**
 * impact.feature.camera.camera
 * ============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.camera.camera")`.
 *
 * The camera subsystem:
 *   - `ig.Camera` (`ig.camera`) — the game add-on that holds a stack of camera
 *     targets, interpolates between them with a transition (key spline +
 *     speed-based duration), applies zoom and keeps the view in bounds.
 *   - `ig.Camera.PosTarget` / `EntityTarget` / `MultiEntityTarget` — the
 *     position sources the camera can follow.
 *   - `ig.Camera.TargetHandle` — a target with offset / zoom-offset and an
 *     exponential offset smoothing.
 */
ig.module("impact.feature.camera.camera")
    .requires("impact.base.event", "impact.base.game")
    .defines(function () {

    /**
     * Smoothly ease `target._currentZ` toward `targetZ` when `slowEnabled`
     * (or when the target is already in slow mode); otherwise snap instantly.
     * Used for the camera's Z focus while entities move/jump.
     */
    function smoothZ(target, slowEnabled, targetZ) {
        if (target._zSlow || slowEnabled) {
            target._zSlow = true;
            slowEnabled = targetZ - target._currentZ;
            if (Math.abs(slowEnabled) <= 1) {
                target._zSlow = false;
                target._currentZ = targetZ;
            } else {
                target._currentZ = target._currentZ + slowEnabled * ig.system.actualTick * 7;
            }
        } else {
            target._currentZ = targetZ;
        }
    }

    var posVec = Vec2.create(),
        soundPosVec = Vec2.create(),
        zoomPosVec = Vec2.create();

    ig.Camera = ig.GameAddon.extend({
        targets: [],
        namedTargets: {},
        _currentPos: Vec2.create(),
        _currentZ: 0,
        _currentZoom: 1,
        _currentZoomPos: Vec2.create(),
        _zSlow: false,
        _lastPos: Vec2.create(),
        _lastZoom: 1,
        _lastZoomPos: Vec2.create(),
        _duration: 0,
        _time: 0,
        _transitionFunction: null,
        _cameraInBounds: false,

        init: function () {
            this.parent("Camera");
        },

        postUpdateOrder: 100,

        /** Update all targets, interpolate position/zoom and apply them. */
        onPostUpdate: function () {
            if (!ig.loading && !ig.game.paused) {
                for (var i = this.targets.length; i--;) this.targets[i].update();
                this._time = this._time + ig.system.actualTick;
                var transitionProgress;
                if (this._time < this._duration) {
                    transitionProgress = this._time / this._duration;
                    transitionProgress = this._transitionFunction.get(transitionProgress);
                }
                this._currentZoom = this._getNewZoom();
                if (this._time < this._duration) {
                    this._currentZoom = this._lastZoom + (this._currentZoom - this._lastZoom) * transitionProgress;
                }
                ig.system.setZoom(this._currentZoom);
                var newPos = this._getNewPos(posVec, soundPosVec, zoomPosVec);
                if (this._time >= this._duration) {
                    Vec2.assign(this._currentPos, newPos);
                    Vec2.assign(this._currentZoomPos, zoomPosVec);
                } else {
                    Vec2.lerp(this._lastPos, newPos, transitionProgress, this._currentPos);
                    Vec2.lerp(this._lastPos, soundPosVec, transitionProgress, soundPosVec);
                    Vec2.lerp(this._lastZoomPos, zoomPosVec, transitionProgress, this._currentZoomPos);
                    this._cameraInBounds && this._limitPos(this._currentPos, this._currentZoomPos, true);
                }
                ig.game.screen.x = this._currentPos.x - ig.system.width / 2;
                ig.game.screen.y = this._currentPos.y - ig.system.height / 2;
                ig.game.soundPos.x = soundPosVec.x;
                ig.game.soundPos.y = soundPosVec.y;
                ig.system.setZoomFocus(this._currentZoomPos.x - ig.game.screen.x, this._currentZoomPos.y - ig.game.screen.y);
            }
        },

        levelLoadStartOrder: 100,

        /** Read the level's `cameraInBounds` attribute and drop named targets. */
        onLevelLoadStart: function (levelData) {
            this._cameraInBounds = levelData.attributes && levelData.attributes.cameraInBounds;
            for (var name in this.namedTargets) this.removeTarget(this.namedTargets[name], 0);
            this.namedTargets = {};
        },

        /** Add a target to the camera stack, optionally under a persistent name. */
        pushTarget: function (target, speed, transition, name) {
            if (name) {
                this.namedTargets[name] && this.removeTarget(this.namedTargets[name], "IMMEDIATELY");
                this.namedTargets[name] = target;
            }
            this._saveLastPos();
            this.targets.push(target);
            target.target.start();
            this._duration = this._getDuration(speed);
            this._transitionFunction = transition || KEY_SPLINES.EASE_IN_OUT;
            this._time = 0;
            this._duration || this._applyFinalState();
        },

        removeNamedTarget: function (name, speed, transition) {
            var target = this.namedTargets[name];
            if (target) {
                delete this.namedTargets[name];
                this.removeTarget(target, speed, transition);
            }
        },

        removeTarget: function (target, speed, transition) {
            var index = this.targets.indexOf(target);
            index != -1 && (index == this.targets.length - 1 ? this.popTarget(speed, transition) : this.targets.splice(index, 1));
        },

        popTarget: function (speed, transition) {
            this._saveLastPos();
            this.targets.pop();
            this._duration = this._getDuration(speed);
            this._transitionFunction = transition || KEY_SPLINES.EASE_IN_OUT;
            this._time = 0;
            this._duration || this._applyFinalState();
        },

        replaceTarget: function (oldTarget, newTarget, speed, transition) {
            var index = this.targets.indexOf(oldTarget);
            if (index == -1) return this.pushTarget(newTarget, speed, transition);
            this.targets.splice(index, 1, newTarget);
            this.isActiveTarget(newTarget) && this.retarget(speed, transition);
        },

        getTargetCount: function () {
            return this.targets.length;
        },

        isTargetReached: function () {
            return this._time >= this._duration;
        },

        /** Re-time the transition for the (still active) current target. */
        retarget: function (speed, transition) {
            this._saveLastPos();
            this._duration = this._getDuration(speed);
            this._transitionFunction = transition || KEY_SPLINES.EASE_IN_OUT;
            this._time = 0;
        },

        isActiveTarget: function (target) {
            return this.targets[this.targets.length - 1] == target;
        },

        getTimeUntilTargetReached: function () {
            return this._time >= this._duration ? 0 : this._duration - this._time;
        },

        /**
         * Clamp `pos` to the map bounds; when `adjustZoomPos` is set, also
         * shift the zoom focus so it stays inside the visible screen.
         */
        _limitPos: function (pos, zoomPos, adjustZoomPos) {
            var screenWidth = ig.system.width,
                screenHeight = ig.system.height,
                limitedX = pos.x.limit(ig.system.width / 2, ig.game.size.x - ig.system.width / 2),
                limitedY = pos.y.limit(ig.system.height / 2, ig.game.size.y - ig.system.height / 2);
            if (adjustZoomPos) {
                var zoomRatioX = (zoomPos.x - (limitedX - screenWidth / 2)) / screenWidth,
                    zoomRatioY = (zoomPos.y - (limitedY - screenHeight / 2)) / screenHeight,
                    widthDiff = screenWidth - screenWidth / ig.system.zoom,
                    heightDiff = screenHeight - screenHeight / ig.system.zoom,
                    offsetX = 0,
                    offsetY = 0,
                    overflow;
                if (limitedX > pos.x) {
                    overflow = limitedX - pos.x - widthDiff * (0.5 - zoomRatioX);
                    offsetX = -Math.min(widthDiff * zoomRatioX, overflow);
                } else if (limitedX < pos.x) {
                    overflow = pos.x - limitedX - widthDiff * (zoomRatioX - 0.5);
                    offsetX = Math.min(widthDiff * (1 - zoomRatioX), overflow);
                }
                if (limitedY > pos.y) {
                    overflow = limitedY - pos.y - heightDiff * (0.5 - zoomRatioY);
                    offsetY = -Math.min(heightDiff * zoomRatioY, overflow);
                } else if (limitedY < pos.y) {
                    overflow = pos.y - limitedY - heightDiff * (zoomRatioY - 0.5);
                    offsetY = Math.min(heightDiff * (1 - zoomRatioY), overflow);
                }
                pos.y = limitedY + offsetY;
                pos.x = limitedX + offsetX;
                zoomPos.x = zoomPos.x + offsetX;
                zoomPos.y = zoomPos.y + offsetY;
            } else {
                pos.x = limitedX;
                pos.y = limitedY;
            }
        },

        /** Snap the camera to its final position/zoom (no transition). */
        _applyFinalState: function () {
            this._currentZoom = this._getNewZoom();
            ig.system.setZoom(this._currentZoom);
            var newPos = this._getNewPos(posVec, null, zoomPosVec);
            Vec2.assign(this._currentPos, newPos);
            Vec2.assign(this._currentZoomPos, zoomPosVec);
        },

        _saveLastPos: function () {
            this._lastZoom = this._currentZoom;
            Vec2.assign(this._lastPos, this._currentPos);
            Vec2.assign(this._lastZoomPos, this._currentZoomPos);
            this._resetLastZoomPos = true;
        },

        _getNewZoom: function () {
            return this.targets.length > 0 ? this.targets[this.targets.length - 1].getZoom() : 1;
        },

        /**
         * Fill `pos` (+ optional `soundPos` / `zoomPos`) with the active
         * target's position, offsets and zoom-focus, clamped to the map.
         */
        _getNewPos: function (pos, soundPos, zoomPos) {
            var target, keepZoomFocusAligned = false;
            if (this.targets.length > 0) {
                target = this.targets[this.targets.length - 1];
                target.target.getPos(pos);
                if (zoomPos) {
                    zoomPos.x = pos.x + Math.round(target._currentZoomOffset.x);
                    zoomPos.y = pos.y + Math.round(target._currentZoomOffset.y);
                }
                pos.x = pos.x + Math.round(target._currentOffset.x);
                pos.y = pos.y + Math.round(target._currentOffset.y);
                keepZoomFocusAligned = target.keepZoomFocusAligned || false;
            }
            if (soundPos) {
                soundPos.x = pos.x;
                soundPos.y = pos.y;
            }
            if (this._cameraInBounds) {
                var boundScale = keepZoomFocusAligned ? 1 : ig.system.zoom;
                pos.x = pos.x.limit(ig.system.width / 2 / boundScale, ig.game.size.x - ig.system.width / 2 / boundScale);
                pos.y = pos.y.limit(ig.system.height / 2 / boundScale, ig.game.size.y - ig.system.height / 2 / boundScale);
            }
            !keepZoomFocusAligned && zoomPos && Vec2.assign(zoomPos, pos);
            return pos;
        },

        /** Convert a speed string to a duration (seconds) from the target distance. */
        _getDuration: function (speed) {
            if (typeof speed == "string") {
                var distance = Vec2.length(Vec2.sub(this._getNewPos(posVec, soundPosVec, zoomPosVec), this._lastPos)) + 32;
                distance = Math.sqrt(distance);
                if (ig.Camera.SPEED_OPTIONS[speed]) {
                    distance = distance * ig.Camera.SPEED_OPTIONS[speed];
                } else {
                    throw Error("Unknown Camera Speed Type: " + speed);
                }
                return distance;
            }
            return speed || 0;
        }
    });

    ig.addGameAddon(function () {
        return ig.camera = new ig.Camera();
    });

    ig.Camera.SPEED_OPTIONS = {
        NORMAL: 0.1,
        FAST: 0.05,
        FASTER: 0.0375,
        FASTEST: 0.025,
        FASTESTEST: 0.0175,
        SLOW: 0.15,
        SLOWER: 0.2,
        SLOWEST: 0.3,
        SLOWESTEST: 0.5,
        SLOWEST_DREAM: 1,
        IMMEDIATELY: 1E-6
    };

    /** Camera target at a fixed position. */
    ig.Camera.PosTarget = ig.Class.extend({
        pos: null,

        init: function (pos) {
            this.pos = pos;
        },

        start: function () {},

        getPos: function (out) {
            Vec2.assign(out, this.pos);
        }
    });

    /** Camera target following an entity (with Z smoothing and focus height). */
    ig.Camera.EntityTarget = ig.Class.extend({
        entity: null,
        _zSlow: false,
        _currentZ: 0,
        _lockZ: false,

        init: function (entity, lockZ) {
            this.entity = entity;
            this._lockZ = lockZ || false;
        },

        start: function () {
            this._currentZ = this.entity.coll.pos.z;
        },

        getPos: function (out) {
            this._lockZ || smoothZ(
                this,
                this.entity && (this.entity.jumping || this.entity.coll._collData && this.entity.coll._collData.zPush),
                this.entity.coll.pos.z + (this.entity.cameraZFocus || 0)
            );
            out.x = Math.round(this.entity.coll.pos.x) + this.entity.coll.size.x / 2;
            out.y = Math.round(this.entity.coll.pos.y - this._currentZ) + this.entity.coll.size.y / 2 - Constants.BALL_HEIGHT;
        }
    });

    /** Camera target averaged over several entities, optionally clamped near the first. */
    ig.Camera.MultiEntityTarget = ig.Class.extend({
        entities: null,
        _zSlow: false,
        _prevFloat: false,
        _currentZ: 0,
        keepFirstTarget: false,

        init: function (entities, keepFirstTarget) {
            this.entities = entities;
            this.keepFirstTarget = keepFirstTarget || false;
        },

        start: function () {
            this._currentZ = this._getEntitiesZ();
        },

        _getEntitiesZ: function () {
            return this.entities[0].coll.pos.z + (this.entities[0].cameraZFocus || 0);
        },

        getPos: function (out) {
            for (var entities = this.entities, count = entities.length, movingZ = false, sumX = 0, sumY = 0, entitiesZ = this._getEntitiesZ(), floatZ = 0; count--;) {
                var entity = entities[count],
                    coll = entity.coll;
                movingZ = movingZ || entity && (entity.jumping || entity.coll._collData && entity.coll._collData.zPush);
                sumX = sumX + (coll.pos.x + coll.size.x / 2);
                sumY = sumY + (coll.pos.y + coll.size.y / 2);
                if (coll.float.height) {
                    movingZ = true;
                    floatZ = floatZ + (coll.pos.z - entitiesZ);
                    this._prevFloat = true;
                }
            }
            if (!movingZ && this._prevFloat) {
                movingZ = true;
                this._prevFloat = false;
            }
            floatZ = floatZ / entities.length;
            sumX = sumX / entities.length;
            sumY = sumY / entities.length;
            smoothZ(this, movingZ, entitiesZ + floatZ);
            if (this.keepFirstTarget) {
                var firstColl = entities[0].coll;
                var firstX = firstColl.pos.x + firstColl.size.x / 2,
                    firstY = firstColl.pos.y + firstColl.size.y / 2;
                sumX < firstX - 200 ? sumX = firstX - 200 : sumX > firstX + 200 && (sumX = firstX + 200);
                sumY < firstY - 100 ? sumY = firstY - 100 : sumY > firstY + 100 && (sumY = firstY + 100);
            }
            sumY = sumY - this._currentZ;
            out.x = Math.round(sumX);
            out.y = Math.round(sumY) - Constants.BALL_HEIGHT;
        }
    });

    /** A camera target plus its offset/zoom-offset (smoothed exponentially). */
    ig.Camera.TargetHandle = ig.Class.extend({
        target: null,
        offset: null,
        zoomOffset: null,
        keepZoomFocusAligned: false,
        _offsetDuration: 0,
        _offsetTime: 0,
        _currentOffset: Vec2.create(),
        _currentZoomOffset: Vec2.create(),
        _lastOffset: Vec2.create(),
        _lastZoomOffset: Vec2.create(),
        zoomTimer: null,
        oldZoom: 1,
        targetZoom: 1,
        keyspline: null,
        lockZ: false,

        init: function (target, offsetX, offsetY) {
            this.target = target;
            this.offset = Vec2.createC(offsetX, offsetY);
            this.zoomOffset = Vec2.createC(offsetX, offsetY);
            this.zoomTimer = new ig.WeightTimer(true);
            Vec2.assign(this._currentOffset, this.offset);
            Vec2.assign(this._lastOffset, this.offset);
            Vec2.assign(this._currentZoomOffset, this.zoomOffset);
            Vec2.assign(this._lastZoomOffset, this.zoomOffset);
        },

        setOffset: function (offsetX, offsetY, duration, zoomOffsetX, zoomOffsetY, immediate) {
            this.offset.x = offsetX;
            this.offset.y = offsetY;
            this.zoomOffset.x = zoomOffsetX === void 0 ? offsetX : zoomOffsetX;
            this.zoomOffset.y = zoomOffsetY === void 0 ? offsetY : zoomOffsetY;
            this._offsetDuration = duration || 0;
            this._offsetTime = 0;
            if (this._offsetDuration) {
                Vec2.assign(this._lastOffset, this._currentOffset);
                Vec2.assign(this._lastZoomOffset, this._currentZoomOffset);
            }
            if (immediate) {
                Vec2.assign(this._currentOffset, this.offset);
                Vec2.assign(this._currentZoomOffset, this.zoomOffset);
            }
        },

        setZoomFocus: function () {},

        setZoom: function (zoom, duration, keyspline) {
            this.oldZoom = this.getZoom();
            this.targetZoom = zoom;
            this.keyspline = keyspline || null;
            this.zoomTimer.set(duration, ig.TIMER_MODE.ONCE);
        },

        /** Smooth the offsets toward their targets (exponential or spline). */
        update: function () {
            this.zoomTimer.tick();
            this._offsetTime = this._offsetTime + ig.system.actualTick;
            if (ig.game.firstUpdateLoop) {
                if (this._offsetTime >= this._offsetDuration) {
                    Vec2.mulF(this._currentOffset, 23);
                    Vec2.add(this._currentOffset, this.offset);
                    Vec2.mulF(this._currentOffset, 1 / 24);
                    Vec2.mulF(this._currentZoomOffset, 23);
                    Vec2.add(this._currentZoomOffset, this.zoomOffset);
                    Vec2.mulF(this._currentZoomOffset, 1 / 24);
                } else {
                    var transitionProgress = Math.min(1, this._offsetTime / this._offsetDuration);
                    transitionProgress = KEY_SPLINES.EASE_IN_OUT.get(transitionProgress);
                    Vec2.lerp(this._lastOffset, this.offset, transitionProgress, this._currentOffset);
                    Vec2.lerp(this._lastZoomOffset, this.zoomOffset, transitionProgress, this._currentZoomOffset);
                }
            }
        },

        getZoom: function () {
            var progress = this.zoomTimer.get();
            this.keyspline && progress < 1 && (progress = this.keyspline.get(progress));
            return this.oldZoom + (this.targetZoom - this.oldZoom) * progress;
        },

        onEventEndDetach: function () {
            ig.camera.removeTarget(this, "FAST");
        },

        onActionEndDetach: function () {
            ig.camera.removeTarget(this, "FAST");
        }
    });
});
ig.baked = !0;
