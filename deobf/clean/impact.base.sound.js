/*
 * impact.base.sound
 * -----------------
 * Audio: `ig.SoundManager` (WebAudio + HTML5 Audio backends, sound groups,
 * named sounds), the `ig.Music` BGM controller with cross-fade track stacks,
 * `ig.TrackDefault`/`ig.TrackWebAudio` looping music tracks, and the
 * `ig.Sound`/`ig.SoundHandle` abstractions (default vs WebAudio).
 *
 * Original: deobf/extract/impact.base.sound.js
 * Faithful to the original logic — only local names and docs were added.
 */

ig.module("impact.base.sound").requires("impact.base.loader", "impact.base.system.web-audio").defines(function () {
    /** Resolve a source path to the current audio format's file URL. */
    function getAudioPath(path) {
        path = ig.root + path.match(/^(.*)\.[^\.]+$/)[1] + "." + ig.soundManager.format.ext + ig.getCacheSuffix();
        return ig.getFilePath(path);
    }

    var audioLoadCount = 0;
    var groupSolveInterval = 2 / 60;
    var distanceScratchVec2 = Vec2.create();
    var alignScratchVec3 = Vec3.create();
    var globalVolumeMap = {};

    ig.GlobalVolume = {
        set: function (path, volume) {
            var key = ig.root + path.match(/^(.*)\.[^\.]+$/)[1];
            globalVolumeMap[key] = volume;
        },
        get: function (path) {
            path = ig.root + path.match(/^(.*)\.[^\.]+$/)[1];
            return globalVolumeMap[path] !== void 0 ? globalVolumeMap[path] : 1;
        }
    };

    ig.SOUND_VOLUME_MAP = {};
    ig.MUSIC_VOLUME_MAP = {};
    ig.SOUND_ENABLE_LOG = false;

    ig.SOUND_RANGE_TYPE = {
        CIRULAR: 1,
        HORIZONTAL: 2,
        VERTICAL: 3
    };

    ig.SoundManager = ig.Class.extend({
        clips: {},
        volume: 1,
        format: null,
        context: null,
        buffers: {},
        volumes: {
            master: null,
            music: null,
            sound: null
        },
        namedSounds: {},
        soundHandles: [],
        soundStack: [[]],
        soundGroups: {},
        requestedGroups: [],
        tracksToUpdate: [],
        hasWebAudio: false,

        init: function () {
            if (!ig.Sound.enabled || !window.Audio) {
                ig.Sound.enabled = false;
            } else {
                if (window.IG_SOUND_VOLUME != void 0) this.volume = window.IG_SOUND_VOLUME;
                var testAudio = new window.Audio();
                for (var i = 0; i < ig.Sound.use.length; i++) {
                    var format = ig.Sound.use[i];
                    if (testAudio.canPlayType(format.mime)) {
                        this.format = format;
                        break;
                    }
                }
                if (!this.format) ig.Sound.enabled = false;
                if (ig.Sound.enabled && ig.WebAudio.isSupported()) {
                    this._createWebAudioContext();
                    window.IG_WEB_AUDIO_BGM ? ig.debug("WebAudio detected. Using full WebAudio Implementation.") : (window.IG_WEB_AUDIO_BGM || ig.debug("WebAudio (No BGM) detected. Using sound-only WebAudio Implementation."));
                } else {
                    ig.debug("No WebAudio. Using default Audio Implementation");
                }
                setInterval(this._updateTracks.bind(this), 16);
            }
        },

        reset: function () {
            for (var i = this.soundHandles.length; i--;) this.soundHandles[i].stop();
            this.soundStack.length = 1;
            this.soundStack[0].length = 0;
        },

        update: function () {
            this.context && this.context.context.state == "suspended" && this.context.context.resume();
            for (var i = this.requestedGroups.length; i--;) this._solveGroupRequests(this.requestedGroups[i]) && this.requestedGroups.splice(i, 1);
            for (i = this.soundHandles.length; i--;) {
                var handle = this.soundHandles[i];
                handle && handle.update() && this.soundHandles.splice(i, 1);
            }
        },

        playSoundHandle: function (handle, group) {
            handle.group = group;
            group.playing.push(handle);
            handle.stack = this.soundStack.last();
            handle.stack.push(handle);
            ig.soundManager.soundHandles.push(handle);
            handle.play();
        },

        stopSoundHandle: function (handle) {
            this.soundStack.last().erase(handle);
            if (handle.group) {
                handle.group.playing.erase(handle);
                handle.group = null;
            }
            if (handle.stack) {
                handle.stack.erase(handle);
                handle.stack = null;
            }
        },

        pushPaused: function (hardStop) {
            for (var stack = this.soundStack.last(), i = stack.length; i--;) {
                var handle = stack[i];
                handle.pause(hardStop);
                handle.group && handle.group.playing.erase(handle);
                hardStop && this.soundHandles.erase(handle);
            }
            this.soundStack.push([]);
        },

        popPaused: function () {
            if (this.soundStack.length != 1) {
                var popped = this.soundStack.pop();
                var stack = this.soundStack.last();
                for (var i = stack.length; i--;) {
                    var handle = stack[i];
                    handle.play();
                    handle.group && handle.group.playing.push(handle);
                    this.soundHandles.indexOf(handle) == -1 && this.soundHandles.push(handle);
                }
                for (i = popped.length; i--;) {
                    handle = popped[i];
                    handle.stack = stack;
                    stack.push(handle);
                }
                popped.length = 0;
            }
        },

        _getGroup: function (name) {
            var group = this.soundGroups[name];
            group || (this.soundGroups[name] = group = {
                requests: [],
                playing: []
            });
            return group;
        },

        _solveGroupRequests: function (group) {
            if (group.playing.length > 0 && group.playing[group.playing.length - 1].getPlayTime() < groupSolveInterval) return false;
            for (var requests = group.requests, i = requests.length; i--;) {
                if (requests[i].isLooping()) {
                    this.playSoundHandle(requests[i], group);
                    requests.splice(i, 1);
                }
            }
            var closest = null;
            var closestDist = -1;
            for (i = requests.length; i--;) {
                var request = requests[i];
                var dist;
                if (request.pos) {
                    Vec2.assign(distanceScratchVec2, request.pos.point);
                    Vec2.sub(distanceScratchVec2, ig.game.soundPos);
                    dist = Vec2.length(distanceScratchVec2);
                } else {
                    dist = 0;
                }
                if (closestDist == -1 || dist < closestDist) {
                    closestDist = dist;
                    closest = requests[i];
                }
            }
            for (i = group.playing.length; i--;) group.playing[i].isLooping() || group.playing[i].stop();
            closest && this.playSoundHandle(closest, group);
            requests.length = 0;
            return true;
        },

        requestPlaySoundHandle: function (groupName, handle) {
            var group = this._getGroup(groupName);
            group.requests.push(handle);
            this.requestedGroups.indexOf(group) == -1 && this.requestedGroups.push(group);
        },

        getSampleRate: function () {
            return (this.context && this.context.getSampleRate()) || 0;
        },

        _createWebAudioContext: function () {
            this.hasWebAudio = true;
            this.context = new ig.WebAudio();
            var master = this.context.createGain();
            var music = this.context.createGain();
            var sound = this.context.createGain();
            var musicTarget = master;
            var compressor = this.context.createDynamicCompressor();
            if (compressor) {
                compressor.threshold.value = -6;
                compressor.knee.value = 0;
                compressor.ratio.value = 20;
                compressor.attack.value = 0;
                compressor.release.value = 0.2;
                musicTarget = this.context.createGain();
                musicTarget.gain.value = 0.8;
                musicTarget.connect(master);
                compressor.connect(musicTarget);
                musicTarget = compressor;
            }
            music.connect(master);
            sound.connect(musicTarget);
            master.connect(this.context.getDestination());
            this.volumes.sound = sound;
            this.volumes.music = music;
            this.volumes.master = master;
        },

        connectSound: function (node) {
            node && node.connect(this.volumes.sound);
        },

        disconnectSound: function (node) {
            node && node.disconnect(this.volumes.sound);
        },

        connectMusic: function (node) {
            node && node.connect(this.volumes.music);
        },

        disconnectMusic: function (node) {
            node && node.disconnect(this.volumes.music);
        },

        setSoundVolume: function (volume) {
            volume && this.hasWebAudio && (this.volumes.sound.gain.value = volume);
        },

        setMusicVolume: function (volume) {
            volume && this.hasWebAudio && (this.volumes.music.gain.value = volume);
        },

        setMasterVolume: function (volume) {
            volume && this.hasWebAudio && (this.volumes.master.gain.value = volume);
        },

        onWindowFocusLost: function () {
            this.pushPaused(true);
        },

        onWindowFocusGained: function () {
            this.popPaused();
        },

        addNamedSound: function (name, sound) {
            this.namedSounds[name] || (this.namedSounds[name] = []);
            this.namedSounds[name].push(sound);
        },

        getNamedSounds: function (name) {
            return this.namedSounds[name];
        },

        stopNamedSounds: function (name) {
            var sounds = this.getNamedSounds(name);
            if (sounds) {
                for (var i = sounds.length; i--;) sounds[i].stop();
                delete this.namedSounds[name];
            }
        },

        getBuffer: function (path) {
            return this.buffers[path];
        },

        loadWebAudio: function (path, onLoad) {
            var url = getAudioPath(path);
            ig.SOUND_ENABLE_LOG && ig.log("%cREQUEST%c: " + url, "color:#FF0080", "");
            if (this.buffers[path]) {
                onLoad && onLoad(path, true);
                return this.buffers[path];
            }
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "arraybuffer";
            request.onload = function () {
                ig.SOUND_ENABLE_LOG && ig.log("%cLOADED%c:  " + url, "color:#C60063", "");
                ig.soundManager.context.decodeAudioData(request.response, function (buffer) {
                    ig.SOUND_ENABLE_LOG && ig.log("%cDECODED%c: " + url, "color:#800080", "");
                    if (buffer) {
                        audioLoadCount++;
                        ig.soundManager.buffers[path] = buffer;
                        onLoad && onLoad(path, true);
                    } else {
                        ig.system.error(Error("Web Audio Load Error: Decoded but NULL " + path));
                    }
                }, function () {
                    ig.system.error(Error("Web Audio Load Error: Could not DECODE: " + path));
                });
            };
            request.onerror = function () {
                ig.system.error(Error("Web Audio Load Error: Could not LOAD: " + path));
            };
            request.send();
        },

        registerTrack: function (track) {
            track && this.tracksToUpdate.indexOf(track) == -1 && this.tracksToUpdate.push(track);
        },

        unregisterTrack: function (track) {
            track && this.tracksToUpdate.erase(track);
        },

        _updateTracks: function () {
            for (var i = this.tracksToUpdate.length; i--;) this.tracksToUpdate[i].checkForEndCallback();
        },

        load: function (path, channelCount, onLoad) {
            var url = getAudioPath(path);
            if (this.clips[path]) {
                this._increaseChannels(path, url, channelCount, false);
                onLoad && onLoad(path, channelCount, true);
            } else {
                var clip;
                var noSource = false;
                audioLoadCount++;
                if (ig.system.limitSoundUse && audioLoadCount > 25) {
                    clip = new Audio();
                    noSource = true;
                    onLoad && onLoad(path, channelCount, true);
                } else {
                    clip = new window.Audio(url);
                }
                if (onLoad) {
                    var onCanPlay = function () {
                        this.removeEventListener("canplaythrough", onCanPlay, false);
                        onLoad(path, channelCount, true);
                    };
                    clip.addEventListener("canplaythrough", onCanPlay, false);
                    clip.addEventListener("error", function () {
                        onLoad(path, channelCount, true);
                    }, false);
                }
                clip.load();
                this.clips[path] = [clip];
                this._increaseChannels(path, url, channelCount, noSource);
            }
        },

        _increaseChannels: function (path, url, channelCount, noSource) {
            for (var clips = this.clips[path]; clips.length < channelCount;) {
                var clip = noSource ? new Audio() : new Audio(url);
                clip.load();
                this.clips[path].push(clip);
            }
        },

        get: function (path) {
            var clips = this.clips[path];
            for (var i = 0; i < clips.length; i++) {
                var clip = clips[i];
                if (clip.paused || clip.ended) {
                    if (clip.ended) clip.currentTime = 0;
                    return clip;
                }
            }
            if (!isNaN(clips[0].duration)) {
                clips[0].pause();
                clips[0].currentTime = 0;
                return clips[0];
            }
        },

        getChannel: function (path, channel) {
            return this.clips[path][channel];
        },

        freeMultiAudio: function (path) {
            delete this.clips[path];
        },

        freeWebAudioBuffer: function (path) {
            delete this.buffers[path];
        }
    });

    ig.MultiAudio = ig.Loadable.extend({
        cacheType: "MultiAudio",
        channelCount: 0,

        init: function (path, channelCount) {
            this.channelCount = channelCount;
            this.parent(path, channelCount);
        },

        get: function () {
            return ig.soundManager.get(this.path);
        },

        getChannel: function (channel) {
            return ig.soundManager.getChannel(this.path, channel);
        },

        onCacheCleared: function () {
            ig.soundManager.freeMultiAudio(this.path);
        },

        loadInternal: function () {
            ig.soundManager.load(this.path, this.channelCount, this.onload.bind(this));
        },

        onload: function (path, channelCount, success) {
            this.loadingFinished(success);
        }
    });

    ig.WebAudioBuffer = ig.Loadable.extend({
        cacheType: "WebAudioBuffer",

        init: function (path) {
            this.parent(path);
        },

        get: function () {
            return ig.soundManager.getBuffer(this.path);
        },

        onCacheCleared: function () {
            ig.soundManager.freeWebAudioBuffer(this.path);
        },

        loadInternal: function () {
            ig.soundManager.loadWebAudio(this.path, this.onload.bind(this));
        },

        onload: function (path, success) {
            this.loadingFinished(success);
        }
    });

    ig.Music = ig.Class.extend({
        inBetweenTrack: null,
        currentTrack: null,
        trackStack: [],
        paused: false,
        _volume: 1,
        _interval: 0,
        _timer: null,
        _fadeInTime: 0,
        _nextTrackReset: false,
        _transitionType: 0,

        init: function () {
            if (window.IG_MUSIC_VOLUME != void 0) this._volume = window.IG_MUSIC_VOLUME;
            if (Object.defineProperty) {
                Object.defineProperty(this, "volume", {
                    get: this.getVolume.bind(this),
                    set: this.setVolume.bind(this)
                });
            } else if (this.__defineGetter__) {
                this.__defineGetter__("volume", this.getVolume.bind(this));
                this.__defineSetter__("volume", this.setVolume.bind(this));
            }
        },

        play: function (track, fadeOutTime, fadeInTime, volume, stopOnEnd) {
            if (this.trackStack.length == 0) {
                this.push(track, fadeOutTime, fadeInTime, volume, stopOnEnd);
            } else {
                this.trackStack.pop();
                this._pushNextTrack(track, stopOnEnd, volume);
                track = this._checkCurrentTrackEquality();
                var wasPaused = this.paused;
                this.paused = false;
                if (!track) {
                    this._fadeInTime = fadeInTime || 0;
                    this._nextTrackReset = true;
                    this._setFadeOut(fadeOutTime, wasPaused);
                }
            }
        },

        push: function (track, fadeOutTime, fadeInTime, volume, stopOnEnd) {
            this._pushNextTrack(track, stopOnEnd, volume);
            track = this._checkCurrentTrackEquality();
            var wasPaused = this.paused;
            this.paused = false;
            if (!track) {
                this._fadeInTime = fadeInTime || 0;
                this._nextTrackReset = true;
                this._setFadeOut(fadeOutTime, wasPaused);
            }
        },

        pop: function (fadeOutTime, fadeInTime) {
            if (this.trackStack.length != 0) {
                this.trackStack.pop();
                var same = this._checkCurrentTrackEquality();
                var wasPaused = this.paused;
                this.paused = false;
                if (!same) {
                    this._fadeInTime = fadeInTime || 0;
                    this._nextTrackReset = false;
                    this._setFadeOut(fadeOutTime, wasPaused);
                }
            }
        },

        inbetween: function (track, fadeOutTime, fadeInTime, volume) {
            if (this.inBetweenTrack && this.inBetweenTrack.track) {
                this.inBetweenTrack.track.pause();
                this.inBetweenTrack.track.endCallback = null;
            }
            this.inBetweenTrack = {
                track: track,
                fadeInTime: fadeInTime
            };
            this._fadeInTime = fadeInTime;
            this._nextTrackReset = false;
            track.loop = false;
            track.setVolume(this._volume * (volume || 1));
            track.reset();
            track.play();
            track.endCallback = this._trackEnded.bind(this);
            this._setFadeOut(fadeOutTime);
        },

        pause: function (fadeOutTime) {
            this.paused = true;
            this._setFadeOut(fadeOutTime);
        },

        resume: function (fadeInTime) {
            this._nextTrackReset = this.paused = false;
            this._fadeInTime = fadeInTime;
            this._playTopSong();
        },

        getStackSize: function () {
            return this.trackStack.length;
        },

        isTrackPlaying: function (track, volume) {
            var top = this._getTopTrack();
            return !this.paused && top && top.track == track && (volume === void 0 || top.volume == volume);
        },

        getVolume: function () {
            return this._volume;
        },

        setVolume: function (volume) {
            this._volume = volume.limit(0, 1);
            this._transitionType == 0 && this.currentTrack && this.currentTrack.track && this.currentTrack.track.setVolume(this._volume * this.currentTrack.volume);
            this.inBetweenTrack && this.inBetweenTrack.track && this.inBetweenTrack.track.setVolume(this._volume * this.currentTrack.volume);
        },

        _checkCurrentTrackEquality: function () {
            var top = this._getTopTrack();
            if (!this.paused && top && top.track && this.currentTrack && this.currentTrack.track == top.track) {
                if (this._transitionType == 0) {
                    top.track.setVolume(this._volume * top.volume);
                    this._endFadeIn();
                } else if (this._transitionType == 1) {
                    this._timer.set(0.5, true);
                } else if (this._transitionType == 2) {
                    this._timer.set(0.5, true);
                    this._timer.reverseRelativeDelta();
                    this.currentTrack.track.play();
                    this._transitionType = 1;
                }
                this.currentTrack = top;
                return true;
            }
            return false;
        },

        _getTopTrack: function () {
            return this.trackStack.length ? this.trackStack[this.trackStack.length - 1] : null;
        },

        _pushNextTrack: function (track, stopOnEnd, volume) {
            this.trackStack.push({
                track: track,
                stopOnEnd: stopOnEnd || false,
                timeOnPush: 0,
                volume: volume || 1
            });
        },

        _setFadeOut: function (fadeOutTime, wasPaused) {
            if (wasPaused) {
                this._transitionType == 2 ? this._timer.set(fadeOutTime, true) : this._playTopSong();
            } else if (fadeOutTime && this.currentTrack && this.currentTrack.track) {
                if (this._transitionType == 2) {
                    this._timer.set(fadeOutTime, true);
                } else if (this._transitionType == 1) {
                    this._timer.set(fadeOutTime, true);
                    this._timer.reverseRelativeDelta();
                    this._transitionType = 2;
                } else {
                    this._transitionType = 2;
                    this._timer = new ig.Timer(fadeOutTime);
                    this._startInterval();
                }
            } else {
                this._playTopSong();
            }
        },

        _startInterval: function () {
            if (!this._interval) this._interval = setInterval(this._intervalStep.bind(this), 16);
        },

        _intervalStep: function () {
            if (!ig.system.windowFocusLost) {
                var progress = !this._timer ? 1 : this._timer.delta().map(-this._timer.target, 0, 0, 1).limit(0, 1);
                var track = this.currentTrack;
                if (track && track.track) {
                    var volume = this._transitionType == 1 ? progress : progress.map(1, 0, 0, 1);
                    track.track.setVolume(volume * this._volume * track.volume);
                }
                progress >= 1 && (this._transitionType == 1 ? this._endFadeIn() : (this._transitionType == 2 && this._playTopSong()));
            }
        },

        _playTopSong: function () {
            this.currentTrack && this.currentTrack.track && this.currentTrack.track.pause();
            if (this.inBetweenTrack || this.paused) {
                this._endFadeIn();
            } else if ((this.currentTrack = this._getTopTrack()) && this.currentTrack.track) {
                this._transitionType = 1;
                this.currentTrack.track.loop = !this.currentTrack.stopOnEnd;
                this._fadeInTime ? this.currentTrack.track.setVolume(0) : this.currentTrack.track.setVolume(this._volume * this.currentTrack.volume);
                this._nextTrackReset && this.currentTrack.track.reset();
                this.currentTrack.track.play();
                this._timer = new ig.Timer(this._fadeInTime);
                this._startInterval();
            } else {
                this._endFadeIn();
            }
        },

        _endFadeIn: function () {
            clearInterval(this._interval);
            this._interval = null;
            this._transitionType = 0;
        },

        _trackEnded: function () {
            if (this.inBetweenTrack) {
                this.inBetweenTrack = this.inBetweenTrack.track.endCallback = null;
                this._playTopSong();
            }
        },

        onWindowFocusLost: function () {
            this.inBetweenTrack && this.inBetweenTrack.track && this.inBetweenTrack.track.pause();
            this.currentTrack && this.currentTrack.track && this.currentTrack.track.pause();
        },

        onWindowFocusGained: function () {
            this.inBetweenTrack && this.inBetweenTrack.track && this.inBetweenTrack.track.play();
            !this.inBetweenTrack && (this.currentTrack && this.currentTrack.track && !this.paused) && this.currentTrack.track.play();
        }
    });

    ig.TrackDefault = ig.Cacheable.extend({
        cacheType: "TrackDefault",
        multiAudio: null,
        introMultiAudio: null,
        loopEnd: 0,
        introEnd: 0,
        endCallback: null,
        baseVolume: 1,
        sound: null,
        swapSound: null,
        introSound: null,
        introPlayed: false,
        loop: true,

        init: function (path, loopEnd, introPath, introEnd, baseVolume) {
            this.parent();
            this.multiAudio = new ig.MultiAudio(path, 2);
            this.introMultiAudio = introPath ? new ig.MultiAudio(introPath, 1) : null;
            this.loopEnd = loopEnd;
            this.introEnd = introEnd || 0;
            this.introPlayed = this.introEnd == 0;
            if (baseVolume != void 0) this.baseVolume = baseVolume;
        },

        getCacheKey: function () {
            return Array.prototype.join.call(arguments, "|");
        },

        onCacheCleared: function () {
            this.multiAudio.decreaseRef();
            this.introMultiAudio && this.introMultiAudio.decreaseRef();
        },

        setVolume: function (volume) {
            this._initSounds();
            volume = volume * volume * this.baseVolume;
            this.sound.volume = volume;
            this.swapSound.volume = volume;
            this.introSound && (this.introSound.volume = volume);
        },

        getVolume: function () {
            this._initSounds();
            return this.sound.volume;
        },

        reset: function () {
            this._initSounds();
            try {
                this.introPlayed = this.introEnd == 0;
                this.sound.currentTime = 0;
                this.swapSound.currentTime = 0;
                this.swapSound.pause();
                this.sound.pause();
                this.introSound && (this.introSound.currentTime = 0);
            } catch (e) {}
        },

        play: function () {
            this._initSounds();
            this.introPlayed ? this.sound.play() : this.introSound.play();
        },

        pause: function () {
            this._initSounds();
            this.introPlayed ? this.sound.pause() : this.introSound.pause();
        },

        _initSounds: function () {
            if (!this.sound) {
                this.sound = this.multiAudio.getChannel(0);
                this._initSound(this.sound);
                this.swapSound = this.multiAudio.getChannel(1);
                this._initSound(this.swapSound);
                if (this.introMultiAudio) {
                    this.introSound = this.introMultiAudio.getChannel(0);
                    this._initSound(this.introSound);
                }
            }
        },

        _initSound: function (sound) {
            sound.loop = false;
            sound.addEventListener("timeupdate", this._timeUpdateCallback.bind(this), false);
            sound.addEventListener("ended", this._endedCallback.bind(this), false);
        },

        _endedCallback: function (event) {
            event.target == this.sound ? this._loopTrack() : event.target == this.introSound && this._endIntro();
        },

        _timeUpdateCallback: function (event) {
            event.target == this.sound && this.sound.currentTime >= this.loopEnd - 0.2 ? this._loopTrack() : event.target == this.introSound && this.introSound.currentTime >= this.introEnd - 0.2 && this._endIntro();
        },

        _loopTrack: function () {
            if (this.loop) {
                var old = this.sound;
                this.sound = this.swapSound;
                this.swapSound = old;
                this.sound.currentTime = 0;
                this.sound.play();
            } else {
                this.endCallback && this.endCallback(this);
            }
        },

        _endIntro: function () {
            if (!this.introPlayed) {
                this.sound.currentTime = 0;
                this.sound.play();
                this.introPlayed = true;
            }
        }
    });

    ig.TrackWebAudio = ig.Cacheable.extend({
        cacheType: "TrackWebAudio",
        bufferHandle: null,
        introBufferHandle: null,
        loopEnd: 0,
        introEnd: 0,
        endCallback: null,
        baseVolume: 1,
        loop: true,
        playing: false,
        soundBuffer: null,
        introBuffer: null,
        currentNode: null,
        nextNode: null,
        introNode: null,
        _context: null,
        _volume: 1,
        _startTime: 0,
        _pauseTime: -1,
        _loopCount: 0,
        _nextOffset: 0,
        _introBufferDuration: 0,

        init: function (path, loopEnd, introPath, introEnd, baseVolume) {
            this.parent();
            this.bufferHandle = new ig.WebAudioBuffer(path);
            this.introBufferHandle = introPath ? new ig.WebAudioBuffer(introPath) : null;
            this.loopEnd = loopEnd;
            this.introEnd = introEnd || 0;
            if (baseVolume != void 0) this.baseVolume = baseVolume;
        },

        getCacheKey: function () {
            return Array.prototype.join.call(arguments, "|");
        },

        onCacheCleared: function () {
            this.bufferHandle.decreaseRef();
            this.introBufferHandle && this.introBufferHandle.decreaseRef();
            this.introBuffer = this.soundBuffer = this.introBufferHandle = this.bufferHandle = null;
        },

        _initAudioBuffers: function () {
            if (!this.soundBuffer) {
                this._context = ig.soundManager.context;
                this.soundBuffer = this.bufferHandle.get();
                if (this.introBufferHandle) {
                    this.introBuffer = this.introBufferHandle.get();
                    this._introBufferDuration = this.introBuffer.duration;
                }
                this._nextOffset = Math.max(0, this.soundBuffer.duration - this.loopEnd);
            }
        },

        checkForEndCallback: function () {
            if (this.bufferHandle) {
                this._initAudioBuffers();
                this._context.getCurrentTime() > this._startTime + this.introEnd + (this._loopCount + 1) * this.loopEnd && this.endCallback && this.endCallback(this);
                if (this._context.getCurrentTime() > this._startTime + this.introEnd + (this._loopCount + 1) * this.loopEnd + this._nextOffset) {
                    if (!this.loop) {
                        this._clearNodes();
                        ig.soundManager.unregisterTrack(this);
                        return;
                    }
                    var next = this._context.createBufferGain(this.soundBuffer, this._volume);
                    this.currentNode.stop(0);
                    ig.soundManager.disconnectMusic(this.currentNode);
                    delete this.currentNode;
                    this.currentNode = this.nextNode;
                    this.nextNode = next;
                    this._loopCount++;
                    next = this._startTime + this.introEnd + (this._loopCount + 1) * this.loopEnd;
                    ig.soundManager.connectMusic(this.nextNode);
                    this.nextNode.play(next);
                }
                if (this.introNode && this._context.getCurrentTime() > this._startTime + this._introBufferDuration) {
                    this.introNode.stop(0);
                    ig.soundManager.disconnectMusic(this.introNode);
                    delete this.introNode;
                }
            }
        },

        setVolume: function (volume) {
            this._volume = volume * volume * this.baseVolume;
            this.currentNode && this.currentNode.setVolume(this._volume);
            this.nextNode && this.nextNode.setVolume(this._volume);
            this.introNode && this.introNode.setVolume(this._volume);
        },

        getVolume: function () {
            return this._volume;
        },

        reset: function () {
            this._clearNodes();
            this.playing = false;
            this._startTime = 0;
            this._pauseTime = -1;
            this._loopCount = 0;
            ig.soundManager.unregisterTrack(this);
        },

        _recreateNodes: function () {
            if (this.bufferHandle) {
                this._initAudioBuffers();
                this.currentNode && ig.soundManager.disconnectMusic(this.currentNode);
                this.introNode && ig.soundManager.disconnectMusic(this.introNode);
                this.nextNode && ig.soundManager.disconnectMusic(this.nextNode);
                this.nextNode = this.introNode = this.currentNode = null;
                if (this.introBufferHandle) this.introNode = this._context.createBufferGain(this.introBuffer, this._volume);
                this.currentNode = this._context.createBufferGain(this.soundBuffer, this._volume);
                if (this.loop) this.nextNode = this._context.createBufferGain(this.soundBuffer, this._volume);
                ig.soundManager.connectMusic(this.introNode);
                ig.soundManager.connectMusic(this.currentNode);
                ig.soundManager.connectMusic(this.nextNode);
            }
        },

        _clearNodes: function () {
            if (this.introNode) {
                this.introNode.stop(0);
                ig.soundManager.disconnectMusic(this.introNode);
                delete this.introNode;
            }
            if (this.currentNode) {
                this.currentNode.stop(0);
                ig.soundManager.disconnectMusic(this.currentNode);
                delete this.currentNode;
            }
            if (this.nextNode) {
                this.nextNode.stop(0);
                ig.soundManager.disconnectMusic(this.nextNode);
                delete this.nextNode;
            }
        },

        play: function () {
            if (this.bufferHandle && !this.playing && this.bufferHandle.loaded) {
                this.playing = true;
                this._recreateNodes();
                if (this._pauseTime < 0) {
                    this._startTime = this._context.getCurrentTime();
                    if (this._introBufferDuration) {
                        this.introNode.play(0);
                        this.currentNode.play(this._startTime + this.introEnd);
                        this.loop && this.nextNode.play(this._startTime + this.loopEnd + this.introEnd);
                    } else {
                        this.currentNode.play(0);
                        this.loop && this.nextNode.play(this._startTime + this.loopEnd);
                    }
                } else {
                    var now = this._context.getCurrentTime();
                    this._startTime = this._startTime + (now - this._pauseTime);
                    now = Math.max(now - this._startTime, 0);
                    if (now < this._introBufferDuration) {
                        this.introNode.play(0, now);
                        now < this.introEnd ? this.currentNode.play(this._startTime + this.introEnd) : this.currentNode.play(0, now - this.introEnd);
                        this.loop && this.nextNode.play(this._startTime + this.loopEnd + this.introEnd);
                    } else {
                        for (now = now - this.introEnd; now > this.loopEnd + this._nextOffset;) now = now - this.loopEnd;
                        this.currentNode.play(0, now);
                        if (this.loop) {
                            if (now > this.loopEnd) {
                                now = now - this.loopEnd;
                                this.nextNode.play(0, now);
                            } else {
                                this.nextNode.play(this._startTime + this.loopEnd * (this._loopCount + 1) + this.introEnd);
                            }
                        }
                    }
                }
                ig.soundManager.registerTrack(this);
            }
        },

        pause: function () {
            if (this.bufferHandle && this.playing) {
                this._clearNodes();
                this._pauseTime = this._context.getCurrentTime();
                this.playing = false;
                ig.soundManager.unregisterTrack(this);
            }
        }
    });

    ig.SoundDefault = ig.Class.extend({
        group: null,
        multiAudio: null,
        volume: 1,
        currentClip: null,
        multiChannel: true,

        init: function (path, volume, channels, group) {
            this.multiAudio = new ig.MultiAudio(path, ig.Sound.channels);
            this.volume = volume || 1;
            this.group = group || path;
        },

        clone: function () {
            return new ig.SoundDefault(this.multiAudio.path, this.volume, 0, this.group);
        },

        clearCached: function () {
            this.multiAudio.decreaseRef();
        },

        play: function (loop) {
            if (!ig.Sound.enabled) return null;
            this.currentClip = this.multiAudio.get();
            if (!isNaN(this.currentClip.duration)) {
                var volume = ig.soundManager.volume * this.volume * ig.GlobalVolume.get(this.multiAudio.path);
                var handle = new ig.SoundHandle(this.currentClip, 0, 0, loop, volume);
                ig.soundManager.requestPlaySoundHandle(this.group, handle);
                return handle;
            }
            return null;
        },

        stop: function () {
            ig.warn("Called stop on Default Sound.");
        }
    });

    ig.SoundWebAudio = ig.Class.extend({
        group: null,
        webAudioBuffer: null,
        volume: 1,
        variance: 0,

        init: function (path, volume, variance, group) {
            this.webAudioBuffer = new ig.WebAudioBuffer(path);
            this.volume = volume || 1;
            this.variance = variance || 0;
            this.group = group || path;
        },

        clone: function () {
            return new ig.SoundWebAudio(this.webAudioBuffer.path, this.volume, this.variance, this.group);
        },

        clearCached: function () {
            this.webAudioBuffer.decreaseRef();
        },

        play: function (loop, params) {
            var offset = 0;
            var startTime = 0;
            var speed = 1;
            var fadeDuration = 0;
            if (params) {
                offset = params.offset || 0;
                startTime = params.startTime || 0;
                speed = params.speed || 1;
                fadeDuration = params.fadeDuration;
            }
            this.variance && (speed = speed * (1 + (Math.random() - 0.5) * 2 * this.variance));
            if (!ig.Sound.enabled) return null;
            var buffer = this.webAudioBuffer.get();
            if (!isNaN(buffer.duration)) {
                var volume = ig.soundManager.volume * this.volume * ig.GlobalVolume.get(this.webAudioBuffer.path);
                var handle = new ig.SoundHandle(buffer, offset, startTime, loop, volume, speed, fadeDuration);
                ig.soundManager.requestPlaySoundHandle(this.group, handle);
                return handle;
            }
            return null;
        },

        stop: function () {
            ig.warn("Called stop on WebAudio Sound.");
        }
    });

    ig.SoundHandleBase = ig.Class.extend({
        pos: null,

        setFixPosition: function (pos, range, rangeType) {
            this.pos = {
                point: Vec2.createC(pos.x, pos.y - (pos.z || 0)),
                entity: null,
                align: null,
                offset: null,
                range: range || 1600,
                rangeType: rangeType || ig.SOUND_RANGE_TYPE.CIRCULAR
            };
        },

        setEntityPosition: function (entity, align, offset, range, rangeType) {
            this.pos = {
                point: Vec2.createC(0, 0),
                entity: entity,
                align: align,
                offset: offset,
                range: range || 1600,
                rangeType: rangeType || ig.SOUND_RANGE_TYPE.CIRCULAR
            };
            this._updateEntityPos(true);
        },

        _updateEntityPos: function (force) {
            if (this.pos && this.pos.entity) {
                if (force || !this.pos.entity._killed) {
                    var aligned = this.pos.entity.getAlignedPos(this.pos.align, alignScratchVec3);
                    this.offset && Vec3.add(aligned, this.offset);
                    this.pos.point.x = aligned.x;
                    this.pos.point.y = aligned.y - aligned.z;
                } else {
                    this.pos.entity = null;
                }
            }
        }
    });

    ig.SoundHandleDefault = ig.SoundHandleBase.extend({
        group: null,
        position: null,
        _time: 0,
        _duration: 0,
        _offset: 0,
        _startTime: 0,
        _clip: null,

        init: function (clip, offset, startTime, loop, volume) {
            this._offset = offset || 0;
            this._startTime = startTime || 0;
            this._duration = clip.duration;
            clip.volume = (volume * volume).limit(0, 1);
            clip.loop = loop || false;
            this._clip = clip;
        },

        update: function () {
            if (this._clip.loop) return false;
            this._time = this._time + ig.system.actualTick;
            if (this._time >= this._duration) {
                ig.soundManager.stopSoundHandle(this);
                return true;
            }
            return false;
        },

        setSize: function () {},

        play: function () {
            this._clip.play();
        },

        stop: function () {
            ig.soundManager.stopSoundHandle(this);
            try {
                this._clip.volume = 0;
                this._clip.loop = false;
                if (this._duration - this._clip.currentTime > 0.8) this._clip.currentTime = this._duration;
            } catch (e) {}
            this._time = this._duration;
        },

        isLooping: function () {
            return this._clip.loop;
        },

        getPlayTime: function () {
            return this._clip.currentTime;
        },

        pause: function () {
            this._clip.pause();
        },

        onActionEndDetach: function () {
            this.stop();
        },

        onEntityKillDetach: function () {
            this.stop();
        }
    });

    var panningScratchVec2 = Vec2.createC(0, 0);

    ig.SoundHandleWebAudio = ig.SoundHandleBase.extend({
        group: null,
        _buffer: null,
        _volume: 0,
        _speed: 0,
        _time: 0,
        _duration: 0,
        _offset: 0,
        _startTime: 0,
        _nodeSource: null,
        _nodePosition: null,
        _loop: false,
        _width: 0,
        _height: 0,
        _playing: false,
        _fadeTimer: 0,
        _fadeIn: false,
        _fadeDuration: 0,
        _contextTimeOnStart: 0,
        _contextTimeOnPause: -1,

        init: function (buffer, offset, startTime, loop, volume, speed, fadeDuration) {
            this._offset = offset || 0;
            this._startTime = startTime || 0;
            this._duration = buffer.duration / speed;
            this._loop = loop || false;
            this._buffer = buffer;
            this._volume = volume;
            this._speed = speed;
            this._fadeDuration = fadeDuration || 0.1;
            this._doPanning = this._duration >= 1 || this._loop;
        },

        update: function () {
            this._doPanning && this._setPosition();
            if (!this._loop && this._contextTimeOnPause == -1 && ig.soundManager.context.getCurrentTime() - this._contextTimeOnStart >= this._duration) {
                ig.soundManager.stopSoundHandle(this);
                this._buffer = null;
                this._disconnect();
                return true;
            }
            if (this._fadeTimer) {
                this._fadeTimer = this._fadeTimer - ig.system.rawTick;
                if (this._fadeTimer <= 0) {
                    this._fadeTimer = 0;
                    if (!this._fadeIn) {
                        this._disconnect();
                        return true;
                    }
                }
                if (this._nodeSource) {
                    var progress = this._fadeTimer / this._fadeDuration;
                    this._fadeIn && (progress = 1 - progress);
                    this._nodeSource.setVolume(this._volume * this._volume * progress * progress);
                }
            }
            return false;
        },

        isLooping: function () {
            return this._loop;
        },

        setSize: function (width, height) {
            this._width = width || 0;
            this._height = height || 0;
        },

        play: function () {
            if (!this._playing && this._buffer) {
                var context = ig.soundManager.context;
                if (this.pos && !this._nodePosition) {
                    this._nodePosition = context.createPanner();
                    this._nodePosition.panningModel = "equalpower";
                    this._nodePosition.distanceModel = "linear";
                    this._nodePosition.refDistance = 0.1 * this.pos.range;
                    this._nodePosition.maxDistance = this.pos.range;
                    this._setPosition();
                }
                if (this._nodeSource) {
                    this._fadeTimer = this._fadeDuration - this._fadeTimer;
                    this._fadeIn = true;
                } else {
                    var offset = 0;
                    if (this._contextTimeOnPause == -1) {
                        this._contextTimeOnStart = context.getCurrentTime();
                        this._fadeIn = false;
                    } else {
                        offset = (this._contextTimeOnPause - this._contextTimeOnStart) * this._speed % this._duration;
                        var now = context.getCurrentTime();
                        this._contextTimeOnStart = this._contextTimeOnStart + (now - this._contextTimeOnPause);
                        this._contextTimeOnPause = -1;
                        this._fadeIn = true;
                        this._fadeTimer = this._fadeDuration;
                    }
                    this._nodeSource = context.createBufferGain(this._buffer, this._fadeIn ? 0 : this._volume * this._volume, this._speed);
                    this._nodeSource.setLoop(this._loop);
                    if (this._nodePosition) {
                        this._nodeSource.connect(this._nodePosition);
                        ig.soundManager.connectSound(this._nodePosition);
                    } else {
                        ig.soundManager.connectSound(this._nodeSource);
                    }
                    this._nodeSource.play(context.getCurrentTimeRaw() + this._startTime, this._offset + offset);
                }
                this._playing = true;
            }
        },

        stop: function () {
            this.pause();
            this._buffer = null;
            ig.soundManager.stopSoundHandle(this);
        },

        _disconnect: function () {
            if (this._nodeSource) {
                this._nodeSource.stop(0);
                if (this._nodePosition) {
                    this._nodeSource.disconnect(this._nodePosition);
                    ig.soundManager.disconnectSound(this._nodePosition);
                } else {
                    ig.soundManager.disconnectSound(this._nodeSource);
                }
                this._nodeSource = null;
            }
        },

        getPlayTime: function () {
            return ig.soundManager.context.getCurrentTime() - this._contextTimeOnStart;
        },

        pause: function (hardStop) {
            if (this._playing) {
                this._contextTimeOnPause = ig.soundManager.context.getCurrentTime();
                this._playing = false;
                if (hardStop) {
                    this._disconnect();
                    this._fadeTimer = 0;
                } else {
                    this._fadeTimer = this._fadeDuration;
                }
                this._fadeIn = false;
            }
        },

        _setPosition: function () {
            if (this.pos) {
                this._updateEntityPos();
                if (this._nodePosition) {
                    var near = this.pos.range * 0.1;
                    var far = this.pos.range * 0.9;
                    panningScratchVec2.x = this.pos.point.x - ig.game.soundPos.x;
                    panningScratchVec2.y = this.pos.point.y - ig.game.soundPos.y;
                    if (ig.SOUND_RANGE_TYPE[this.pos.rangeType] == ig.SOUND_RANGE_TYPE.HORIZONTAL) panningScratchVec2.x = 0;
                    else if (ig.SOUND_RANGE_TYPE[this.pos.rangeType] == ig.SOUND_RANGE_TYPE.VERTICAL) panningScratchVec2.y = 0;
                    var dist = Vec2.length(panningScratchVec2);
                    dist = dist < near ? 0 : KEY_SPLINES.EASE_SOUND.get(((dist - near) / far).limit(0, 1)) * this.pos.range;
                    Vec2.length(panningScratchVec2, dist);
                    this._nodePosition.setPosition(panningScratchVec2.x, panningScratchVec2.y, -0.1 * this.pos.range);
                }
            }
        },

        onActionEndDetach: function () {
            this.stop();
        },

        onEntityKillDetach: function () {
            this.stop();
        }
    });

    var helperScratchVec2 = Vec2.create();

    ig.SoundHelper = {
        playAtEntity: function (sound, entity, params, loop, range, rangeType) {
            if (sound) {
                var coll = entity.coll;
                Vec2.assignC(helperScratchVec2, coll.pos.x + coll.size.x / 2, coll.pos.y + coll.size.y / 2 - (coll.pos.z + coll.size.z / 2));
                var handle = sound.play(params, loop);
                handle && handle.setEntityPosition(entity, ig.ENTITY_ALIGN.CENTER, null, range, rangeType);
                return handle;
            }
        }
    };

    var useWebAudio = localStorage.getItem("options.useWebAudio") != "false";
    useWebAudio = ig.WebAudio.isSupported() && !window.IG_FORCE_HTML5_AUDIO && useWebAudio;
    ig.nwjsVersion && ig.nwjsVersion[1] >= 3e3 && (useWebAudio = true);
    if (useWebAudio) {
        ig.Sound = ig.SoundWebAudio;
        ig.SoundHandle = ig.SoundHandleWebAudio;
        ig.webAudioActive = true;
        ig.Track = (ig.platform == ig.PLATFORM_TYPES.BROWSER || window.IG_GAME_DEBUG) && !window.IG_WEB_AUDIO_BGM ? ig.TrackDefault : ig.TrackWebAudio;
    } else {
        ig.webAudioActive = false;
        ig.Sound = ig.SoundDefault;
        ig.SoundHandle = ig.SoundHandleDefault;
        ig.Track = ig.TrackDefault;
        ig.log("SET DEFAULT TRACK!");
    }

    ig.Sound.FORMAT = {
        MP3: { ext: "mp3", mime: "audio/mpeg" },
        M4A: { ext: "m4a", mime: "audio/mp4; codecs=mp4a" },
        OGG: { ext: "ogg", mime: "audio/ogg; codecs=vorbis" },
        WEBM: { ext: "webm", mime: "audio/webm; codecs=vorbis" },
        CAF: { ext: "caf", mime: "audio/x-caf" }
    };
    ig.Sound.use = [ig.Sound.FORMAT.OGG, ig.Sound.FORMAT.MP3];
    ig.Sound.channels = 4;
    ig.Sound.enabled = true;
});
ig.baked = !0;
