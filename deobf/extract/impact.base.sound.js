ig.module("impact.base.sound").requires("impact.base.loader", "impact.base.system.web-audio").defines(function() {
        function a(b) {
            b = ig.root + b.match(/^(.*)\.[^\.]+$/)[1] + "." + ig.soundManager.format.ext + ig.getCacheSuffix();
            return ig.getFilePath(b)
        }
        var b = 0,
            c = 2 / 60,
            d = e.create(),
            f = g.create(),
            h = {};
        ig.GlobalVolume = {
            set: function(a, b) {
                var c = ig.root + a.match(/^(.*)\.[^\.]+$/)[1];
                h[c] = b
            },
            get: function(a) {
                a = ig.root + a.match(/^(.*)\.[^\.]+$/)[1];
                return h[a] !== void 0 ? h[a] : 1
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
            soundStack: [
                []
            ],
            soundGroups: {},
            requestedGroups: [],
            tracksToUpdate: [],
            hasWebAudio: false,
            init: function() {
                if (!ig.Sound.enabled || !window.Audio) ig.Sound.enabled = false;
                else {
                    if (window.IG_SOUND_VOLUME != void 0) this.volume = window.IG_SOUND_VOLUME;
                    for (var a = new window.Audio, b = 0; b < ig.Sound.use.length; b++) {
                        var c = ig.Sound.use[b];
                        if (a.canPlayType(c.mime)) {
                            this.format = c;
                            break
                        }
                    }
                    if (!this.format) ig.Sound.enabled = false;
                    if (ig.Sound.enabled && ig.WebAudio.isSupported()) {
                        this._createWebAudioContext();
                        window.IG_WEB_AUDIO_BGM ?
                            ig.debug("WebAudio detected. Using full WebAudio Implementation.") : window.IG_WEB_AUDIO_BGM || ig.debug("WebAudio (No BGM) detected. Using sound-only WebAudio Implementation.")
                    } else ig.debug("No WebAudio. Using default Audio Implementation");
                    setInterval(this._updateTracks.bind(this), 16)
                }
            },
            reset: function() {
                for (var a = this.soundHandles.length; a--;) this.soundHandles[a].stop();
                this.soundStack.length = 1;
                this.soundStack[0].length = 0
            },
            update: function() {
                this.context && this.context.context.state == "suspended" && this.context.context.resume();
                for (var a = this.requestedGroups.length; a--;) this._solveGroupRequests(this.requestedGroups[a]) && this.requestedGroups.splice(a, 1);
                for (var a = this.soundHandles.length, b = null; a--;)(b = this.soundHandles[a]) && b.update() && this.soundHandles.splice(a, 1)
            },
            playSoundHandle: function(a, b) {
                a.group = b;
                b.playing.push(a);
                a.stack = this.soundStack.last();
                a.stack.push(a);
                ig.soundManager.soundHandles.push(a);
                a.play()
            },
            stopSoundHandle: function(a) {
                this.soundStack.last().erase(a);
                if (a.group) {
                    a.group.playing.erase(a);
                    a.group = null
                }
                if (a.stack) {
                    a.stack.erase(a);
                    a.stack = null
                }
            },
            pushPaused: function(a) {
                for (var b = this.soundStack.last(), c = b.length; c--;) {
                    var d = b[c];
                    d.pause(a);
                    d.group && d.group.playing.erase(d);
                    a && this.soundHandles.erase(d)
                }
                this.soundStack.push([])
            },
            popPaused: function() {
                if (this.soundStack.length != 1) {
                    for (var a = this.soundStack.pop(), b = this.soundStack.last(), c = b.length; c--;) {
                        var d = b[c];
                        d.play();
                        d.group && d.group.playing.push(d);
                        this.soundHandles.indexOf(d) == -1 && this.soundHandles.push(d)
                    }
                    for (c = a.length; c--;) {
                        d = a[c];
                        d.stack = b;
                        b.push(d)
                    }
                    a.length = 0
                }
            },
            _getGroup: function(a) {
                var b =
                    this.soundGroups[a];
                b || (this.soundGroups[a] = b = {
                    requests: [],
                    playing: []
                });
                return b
            },
            _solveGroupRequests: function(a) {
                if (a.playing.length > 0 && a.playing[a.playing.length - 1].getPlayTime() < c) return false;
                for (var b = a.requests, f = b.length; f--;)
                    if (b[f].isLooping()) {
                        this.playSoundHandle(b[f], a);
                        b.splice(f, 1)
                    } for (var g, f = b.length, h = -1; f--;) {
                    var i;
                    i = b[f];
                    if (i.pos) {
                        e.assign(d, i.pos.point);
                        e.sub(d, ig.game.soundPos);
                        i = e.length(d)
                    } else i = 0;
                    if (h == -1 || i < h) {
                        h = i;
                        g = b[f]
                    }
                }
                for (f = a.playing.length; f--;) a.playing[f].isLooping() ||
                    a.playing[f].stop();
                g && this.playSoundHandle(g, a);
                b.length = 0;
                return true
            },
            requestPlaySoundHandle: function(a, b) {
                var c = this._getGroup(a);
                c.requests.push(b);
                this.requestedGroups.indexOf(c) == -1 && this.requestedGroups.push(c)
            },
            getSampleRate: function() {
                return this.context && this.context.getSampleRate() || 0
            },
            _createWebAudioContext: function() {
                this.hasWebAudio = true;
                this.context = new ig.WebAudio;
                var a = this.context.createGain(),
                    b = this.context.createGain(),
                    c = this.context.createGain(),
                    d = a,
                    e = this.context.createDynamicCompressor();
                if (e) {
                    e.threshold.value = -6;
                    e.knee.value = 0;
                    e.ratio.value = 20;
                    e.attack.value = 0;
                    e.release.value = 0.2;
                    d = this.context.createGain();
                    d.gain.value = 0.8;
                    d.connect(a);
                    e.connect(d);
                    d = e
                }
                b.connect(a);
                c.connect(d);
                a.connect(this.context.getDestination());
                this.volumes.sound = c;
                this.volumes.music = b;
                this.volumes.master = a
            },
            connectSound: function(a) {
                a && a.connect(this.volumes.sound)
            },
            disconnectSound: function(a) {
                a && a.disconnect(this.volumes.sound)
            },
            connectMusic: function(a) {
                a && a.connect(this.volumes.music)
            },
            disconnectMusic: function(a) {
                a &&
                    a.disconnect(this.volumes.music)
            },
            setSoundVolume: function(a) {
                a && this.hasWebAudio && (this.volumes.sound.gain.value = a)
            },
            setMusicVolume: function(a) {
                a && this.hasWebAudio && (this.volumes.music.gain.value = a)
            },
            setMasterVolume: function(a) {
                a && this.hasWebAudio && (this.volumes.master.gain.value = a)
            },
            onWindowFocusLost: function() {
                this.pushPaused(true)
            },
            onWindowFocusGained: function() {
                this.popPaused()
            },
            addNamedSound: function(a, b) {
                this.namedSounds[a] || (this.namedSounds[a] = []);
                this.namedSounds[a].push(b)
            },
            getNamedSounds: function(a) {
                return this.namedSounds[a]
            },
            stopNamedSounds: function(a) {
                var b = this.getNamedSounds(a);
                if (b) {
                    for (var c = b.length; c--;) b[c].stop();
                    delete this.namedSounds[a]
                }
            },
            getBuffer: function(a) {
                return this.buffers[a]
            },
            loadWebAudio: function(c, d) {
                var e = a(c);
                ig.SOUND_ENABLE_LOG && ig.log("%cREQUEST%c: " + e, "color:#FF0080", "");
                if (this.buffers[c]) {
                    d && d(c, true);
                    return this.buffers[c]
                }
                var f = new XMLHttpRequest;
                f.open("GET", e, true);
                f.responseType = "arraybuffer";
                f.onload = function() {
                    ig.SOUND_ENABLE_LOG && ig.log("%cLOADED%c:  " + e, "color:#C60063", "");
                    ig.soundManager.context.decodeAudioData(f.response,
                        function(a) {
                            ig.SOUND_ENABLE_LOG && ig.log("%cDECODED%c: " + e, "color:#800080", "");
                            if (a) {
                                b++;
                                ig.soundManager.buffers[c] = a;
                                d && d(c, true)
                            } else ig.system.error(Error("Web Audio Load Error: Decoded but NULL " + c))
                        },
                        function() {
                            ig.system.error(Error("Web Audio Load Error: Could not DECODE: " + c))
                        })
                };
                f.onerror = function() {
                    ig.system.error(Error("Web Audio Load Error: Could not LOAD: " + c))
                };
                f.send()
            },
            registerTrack: function(a) {
                a && this.tracksToUpdate.indexOf(a) == -1 && this.tracksToUpdate.push(a)
            },
            unregisterTrack: function(a) {
                a &&
                    this.tracksToUpdate.erase(a)
            },
            _updateTracks: function() {
                for (var a = this.tracksToUpdate.length; a--;) this.tracksToUpdate[a].checkForEndCallback()
            },
            load: function(c, d, e) {
                var f = a(c);
                if (this.clips[c]) {
                    this._increaseChannels(c, f, d, false);
                    e && e(c, d, true)
                } else {
                    var g, h = false;
                    b++;
                    if (ig.system.limitSoundUse && b > 25) {
                        g = new Audio;
                        h = true;
                        e && e(c, d, true)
                    } else g = new window.Audio(f);
                    if (e) {
                        var i = function(a) {
                            this.removeEventListener("canplaythrough", i, false);
                            e(c, d, true, a)
                        };
                        g.addEventListener("canplaythrough", i, false);
                        g.addEventListener("error",
                            function(a) {
                                e(c, d, true, a)
                            }, false)
                    }
                    g.load();
                    this.clips[c] = [g];
                    this._increaseChannels(c, f, d, h)
                }
            },
            _increaseChannels: function(a, b, c, d) {
                for (var e = this.clips[a]; e.length < c;) {
                    var f = d ? new Audio : new Audio(b);
                    f.load();
                    this.clips[a].push(f)
                }
            },
            get: function(a) {
                for (var a = this.clips[a], b = 0, c; c = a[b++];)
                    if (c.paused || c.ended) {
                        if (c.ended) c.currentTime = 0;
                        return c
                    } if (!isNaN(a[0].duration)) {
                    a[0].pause();
                    a[0].currentTime = 0;
                    return a[0]
                }
            },
            getChannel: function(a, b) {
                return this.clips[a][b]
            },
            freeMultiAudio: function(a) {
                delete this.clips[a]
            },
            freeWebAudioBuffer: function(a) {
                delete this.buffers[a]
            }
        });
        ig.MultiAudio = ig.Loadable.extend({
            cacheType: "MultiAudio",
            channelCount: 0,
            init: function(a, b) {
                this.channelCount = b;
                this.parent(a, b)
            },
            get: function() {
                return ig.soundManager.get(this.path)
            },
            getChannel: function(a) {
                return ig.soundManager.getChannel(this.path, a)
            },
            onCacheCleared: function() {
                ig.soundManager.freeMultiAudio(this.path)
            },
            loadInternal: function() {
                ig.soundManager.load(this.path, this.channelCount, this.onload.bind(this))
            },
            onload: function(a, b, c) {
                this.loadingFinished(c)
            }
        });
        ig.WebAudioBuffer = ig.Loadable.extend({
            cacheType: "WebAudioBuffer",
            init: function(a) {
                this.parent(a)
            },
            get: function() {
                return ig.soundManager.getBuffer(this.path)
            },
            onCacheCleared: function() {
                ig.soundManager.freeWebAudioBuffer(this.path)
            },
            loadInternal: function() {
                ig.soundManager.loadWebAudio(this.path, this.onload.bind(this))
            },
            onload: function(a, b) {
                this.loadingFinished(b)
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
            init: function() {
                if (window.IG_MUSIC_VOLUME != void 0) this._volume = window.IG_MUSIC_VOLUME;
                if (Object.defineProperty) Object.defineProperty(this, "volume", {
                    get: this.getVolume.bind(this),
                    set: this.setVolume.bind(this)
                });
                else if (this.__defineGetter__) {
                    this.__defineGetter__("volume", this.getVolume.bind(this));
                    this.__defineSetter__("volume", this.setVolume.bind(this))
                }
            },
            play: function(a, b, c, d, e) {
                if (this.trackStack.length == 0) this.push(a, b, c, d, e);
                else {
                    this.trackStack.pop();
                    this._pushNextTrack(a, e, d);
                    a = this._checkCurrentTrackEquality();
                    d = this.paused;
                    this.paused = false;
                    if (!a) {
                        this._fadeInTime = c || 0;
                        this._nextTrackReset = true;
                        this._setFadeOut(b, d)
                    }
                }
            },
            push: function(a, b, c, d, e) {
                this._pushNextTrack(a, e, d);
                a = this._checkCurrentTrackEquality();
                d = this.paused;
                this.paused = false;
                if (!a) {
                    this._fadeInTime = c || 0;
                    this._nextTrackReset = true;
                    this._setFadeOut(b, d)
                }
            },
            pop: function(a, b) {
                if (this.trackStack.length != 0) {
                    this.trackStack.pop();
                    var c = this._checkCurrentTrackEquality(),
                        d = this.paused;
                    this.paused =
                        false;
                    if (!c) {
                        this._fadeInTime = b || 0;
                        this._nextTrackReset = false;
                        this._setFadeOut(a, d)
                    }
                }
            },
            inbetween: function(a, b, c, d) {
                if (this.inBetweenTrack && this.inBetweenTrack.track) {
                    this.inBetweenTrack.track.pause();
                    this.inBetweenTrack.track.endCallback = null
                }
                this.inBetweenTrack = {
                    track: a,
                    fadeInTime: c
                };
                this._fadeInTime = c;
                this._nextTrackReset = false;
                a.loop = false;
                a.setVolume(this._volume * (d || 1));
                a.reset();
                a.play();
                a.endCallback = this._trackEnded.bind(this);
                this._setFadeOut(b)
            },
            pause: function(a) {
                this.paused = true;
                this._setFadeOut(a)
            },
            resume: function(a) {
                this._nextTrackReset = this.paused = false;
                this._fadeInTime = a;
                this._playTopSong()
            },
            getStackSize: function() {
                return this.trackStack.length
            },
            isTrackPlaying: function(a, b) {
                var c = this._getTopTrack();
                return !this.paused && c && c.track == a && (b === void 0 || c.volume == b)
            },
            getVolume: function() {
                return this._volume
            },
            setVolume: function(a) {
                this._volume = a.limit(0, 1);
                this._transitionType == 0 && this.currentTrack && this.currentTrack.track && this.currentTrack.track.setVolume(this._volume * this.currentTrack.volume);
                this.inBetweenTrack && this.inBetweenTrack.track && this.inBetweenTrack.track.setVolume(this._volume * this.currentTrack.volume)
            },
            _checkCurrentTrackEquality: function() {
                var a = this._getTopTrack();
                if (!this.paused && a && a.track && this.currentTrack && this.currentTrack.track == a.track) {
                    if (this._transitionType == 0) {
                        a.track.setVolume(this._volume * a.volume);
                        this._endFadeIn()
                    } else if (this._transitionType == 1) this._timer.set(0.5, true);
                    else if (this._transitionType == 2) {
                        this._timer.set(0.5, true);
                        this._timer.reverseRelativeDelta();
                        this.currentTrack.track.play();
                        this._transitionType = 1
                    }
                    this.currentTrack = a;
                    return true
                }
                return false
            },
            _getTopTrack: function() {
                return this.trackStack.length ? this.trackStack[this.trackStack.length - 1] : null
            },
            _pushNextTrack: function(a, b, c) {
                this.trackStack.push({
                    track: a,
                    stopOnEnd: b || false,
                    timeOnPush: 0,
                    volume: c || 1
                })
            },
            _setFadeOut: function(a, b) {
                if (b) this._transitionType == 2 ? this._timer.set(a, true) : this._playTopSong();
                else if (a && this.currentTrack && this.currentTrack.track)
                    if (this._transitionType == 2) this._timer.set(a,
                        true);
                    else if (this._transitionType == 1) {
                    this._timer.set(a, true);
                    this._timer.reverseRelativeDelta();
                    this._transitionType = 2
                } else {
                    this._transitionType = 2;
                    this._timer = new ig.Timer(a);
                    this._startInterval()
                } else this._playTopSong()
            },
            _startInterval: function() {
                if (!this._interval) this._interval = setInterval(this._intervalStep.bind(this), 16)
            },
            _intervalStep: function() {
                if (!ig.system.windowFocusLost) {
                    var a = !this._timer ? 1 : this._timer.delta().map(-this._timer.target, 0, 0, 1).limit(0, 1),
                        b = this.currentTrack;
                    if (b && b.track) {
                        var c =
                            this._transitionType == 1 ? a : a.map(1, 0, 0, 1);
                        b.track.setVolume(c * this._volume * b.volume)
                    }
                    a >= 1 && (this._transitionType == 1 ? this._endFadeIn() : this._transitionType == 2 && this._playTopSong())
                }
            },
            _playTopSong: function() {
                this.currentTrack && this.currentTrack.track && this.currentTrack.track.pause();
                if (this.inBetweenTrack || this.paused) this._endFadeIn();
                else if ((this.currentTrack = this._getTopTrack()) && this.currentTrack.track) {
                    this._transitionType = 1;
                    this.currentTrack.track.loop = !this.currentTrack.stopOnEnd;
                    this._fadeInTime ?
                        this.currentTrack.track.setVolume(0) : this.currentTrack.track.setVolume(this._volume * this.currentTrack.volume);
                    this._nextTrackReset && this.currentTrack.track.reset();
                    this.currentTrack.track.play();
                    this._timer = new ig.Timer(this._fadeInTime);
                    this._startInterval()
                } else this._endFadeIn()
            },
            _endFadeIn: function() {
                clearInterval(this._interval);
                this._interval = null;
                this._transitionType = 0
            },
            _trackEnded: function() {
                if (this.inBetweenTrack) {
                    this.inBetweenTrack = this.inBetweenTrack.track.endCallback = null;
                    this._playTopSong()
                }
            },
            onWindowFocusLost: function() {
                this.inBetweenTrack && this.inBetweenTrack.track && this.inBetweenTrack.track.pause();
                this.currentTrack && this.currentTrack.track && this.currentTrack.track.pause()
            },
            onWindowFocusGained: function() {
                this.inBetweenTrack && this.inBetweenTrack.track && this.inBetweenTrack.track.play();
                !this.inBetweenTrack && (this.currentTrack && this.currentTrack.track && !this.paused) && this.currentTrack.track.play()
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
            init: function(a, b, c, d, e) {
                this.parent();
                this.multiAudio = new ig.MultiAudio(a, 2);
                this.introMultiAudio = c ? new ig.MultiAudio(c, 1) : null;
                this.loopEnd = b;
                this.introEnd = d || 0;
                this.introPlayed = this.introEnd == 0;
                if (e != void 0) this.baseVolume = e
            },
            getCacheKey: function(a, b, c, d) {
                return Array.prototype.join.call(arguments, "|")
            },
            onCacheCleared: function() {
                this.multiAudio.decreaseRef();
                this.introMultiAudio &&
                    this.introMultiAudio.decreaseRef()
            },
            setVolume: function(a) {
                this._initSounds();
                a = a * a * this.baseVolume;
                this.sound.volume = a;
                this.swapSound.volume = a;
                this.introSound && (this.introSound.volume = a)
            },
            getVolume: function() {
                this._initSounds();
                return this.sound.volume
            },
            reset: function() {
                this._initSounds();
                try {
                    this.introPlayed = this.introEnd == 0;
                    this.sound.currentTime = 0;
                    this.swapSound.currentTime = 0;
                    this.swapSound.pause();
                    this.sound.pause();
                    this.introSound && (this.introSound.currentTime = 0)
                } catch (a) {}
            },
            play: function() {
                this._initSounds();
                this.introPlayed ? this.sound.play() : this.introSound.play()
            },
            pause: function() {
                this._initSounds();
                this.introPlayed ? this.sound.pause() : this.introSound.pause()
            },
            _initSounds: function() {
                if (!this.sound) {
                    this.sound = this.multiAudio.getChannel(0);
                    this._initSound(this.sound);
                    this.swapSound = this.multiAudio.getChannel(1);
                    this._initSound(this.swapSound);
                    if (this.introMultiAudio) {
                        this.introSound = this.introMultiAudio.getChannel(0);
                        this._initSound(this.introSound)
                    }
                }
            },
            _initSound: function(a) {
                a.loop = false;
                a.addEventListener("timeupdate",
                    this._timeUpdateCallback.bind(this), false);
                a.addEventListener("ended", this._endedCallback.bind(this), false)
            },
            _endedCallback: function(a) {
                a.target == this.sound ? this._loopTrack() : a.target == this.introSound && this._endIntro()
            },
            _timeUpdateCallback: function(a) {
                a.target == this.sound && this.sound.currentTime >= this.loopEnd - 0.2 ? this._loopTrack() : a.target == this.introSound && this.introSound.currentTime >= this.introEnd - 0.2 && this._endIntro()
            },
            _loopTrack: function() {
                if (this.loop) {
                    var a = this.sound;
                    this.sound = this.swapSound;
                    this.swapSound = a;
                    this.sound.currentTime = 0;
                    this.sound.play()
                } else this.endCallback && this.endCallback(this)
            },
            _endIntro: function() {
                if (!this.introPlayed) {
                    this.sound.currentTime = 0;
                    this.sound.play();
                    this.introPlayed = true
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
            init: function(a, b, c, d, e) {
                this.parent();
                this.bufferHandle = new ig.WebAudioBuffer(a);
                this.introBufferHandle = c ? new ig.WebAudioBuffer(c) : null;
                this.loopEnd = b;
                this.introEnd = d || 0;
                if (e != void 0) this.baseVolume = e
            },
            getCacheKey: function(a, b, c, d) {
                return Array.prototype.join.call(arguments, "|")
            },
            onCacheCleared: function() {
                this.bufferHandle.decreaseRef();
                this.introBufferHandle && this.introBufferHandle.decreaseRef();
                this.introBuffer = this.soundBuffer =
                    this.introBufferHandle = this.bufferHandle = null
            },
            _initAudioBuffers: function() {
                if (!this.soundBuffer) {
                    this._context = ig.soundManager.context;
                    this.soundBuffer = this.bufferHandle.get();
                    if (this.introBufferHandle) {
                        this.introBuffer = this.introBufferHandle.get();
                        this._introBufferDuration = this.introBuffer.duration
                    }
                    this._nextOffset = Math.max(0, this.soundBuffer.duration - this.loopEnd)
                }
            },
            checkForEndCallback: function() {
                if (this.bufferHandle) {
                    this._initAudioBuffers();
                    this._context.getCurrentTime() > this._startTime + this.introEnd +
                        (this._loopCount + 1) * this.loopEnd && this.endCallback && this.endCallback(this);
                    if (this._context.getCurrentTime() > this._startTime + this.introEnd + (this._loopCount + 1) * this.loopEnd + this._nextOffset) {
                        if (!this.loop) {
                            this._clearNodes();
                            ig.soundManager.unregisterTrack(this);
                            return
                        }
                        var a = this._context.createBufferGain(this.soundBuffer, this._volume);
                        this.currentNode.stop(0);
                        ig.soundManager.disconnectMusic(this.currentNode);
                        delete this.currentNode;
                        this.currentNode = this.nextNode;
                        this.nextNode = a;
                        this._loopCount++;
                        a = this._startTime + this.introEnd + (this._loopCount + 1) * this.loopEnd;
                        ig.soundManager.connectMusic(this.nextNode);
                        this.nextNode.play(a)
                    }
                    if (this.introNode && this._context.getCurrentTime() > this._startTime + this._introBufferDuration) {
                        this.introNode.stop(0);
                        ig.soundManager.disconnectMusic(this.introNode);
                        delete this.introNode
                    }
                }
            },
            setVolume: function(a) {
                this._volume = a * a * this.baseVolume;
                this.currentNode && this.currentNode.setVolume(this._volume);
                this.nextNode && this.nextNode.setVolume(this._volume);
                this.introNode &&
                    this.introNode.setVolume(this._volume)
            },
            getVolume: function() {
                return this._volume
            },
            reset: function() {
                this._clearNodes();
                this.playing = false;
                this._startTime = 0;
                this._pauseTime = -1;
                this._loopCount = 0;
                ig.soundManager.unregisterTrack(this)
            },
            _recreateNodes: function() {
                if (this.bufferHandle) {
                    this._initAudioBuffers();
                    this.currentNode && ig.soundManager.disconnectMusic(this.currentNode);
                    this.introNode && ig.soundManager.disconnectMusic(this.introNode);
                    this.nextNode && ig.soundManager.disconnectMusic(this.nextNode);
                    this.nextNode =
                        this.introNode = this.currentNode = null;
                    if (this.introBufferHandle) this.introNode = this._context.createBufferGain(this.introBuffer, this._volume);
                    this.currentNode = this._context.createBufferGain(this.soundBuffer, this._volume);
                    if (this.loop) this.nextNode = this._context.createBufferGain(this.soundBuffer, this._volume);
                    ig.soundManager.connectMusic(this.introNode);
                    ig.soundManager.connectMusic(this.currentNode);
                    ig.soundManager.connectMusic(this.nextNode)
                }
            },
            _clearNodes: function() {
                if (this.introNode) {
                    this.introNode.stop(0);
                    ig.soundManager.disconnectMusic(this.introNode);
                    delete this.introNode
                }
                if (this.currentNode) {
                    this.currentNode.stop(0);
                    ig.soundManager.disconnectMusic(this.currentNode);
                    delete this.currentNode
                }
                if (this.nextNode) {
                    this.nextNode.stop(0);
                    ig.soundManager.disconnectMusic(this.nextNode);
                    delete this.nextNode
                }
            },
            play: function() {
                if (this.bufferHandle && !this.playing && this.bufferHandle.loaded) {
                    this.playing = true;
                    this._recreateNodes();
                    if (this._pauseTime < 0) {
                        this._startTime = this._context.getCurrentTime();
                        if (this._introBufferDuration) {
                            this.introNode.play(0);
                            this.currentNode.play(this._startTime + this.introEnd);
                            this.loop && this.nextNode.play(this._startTime + this.loopEnd + this.introEnd)
                        } else {
                            this.currentNode.play(0);
                            this.loop && this.nextNode.play(this._startTime + this.loopEnd)
                        }
                    } else {
                        var a = this._context.getCurrentTime();
                        this._startTime = this._startTime + (a - this._pauseTime);
                        a = Math.max(a - this._startTime, 0);
                        if (a < this._introBufferDuration) {
                            this.introNode.play(0, a);
                            a < this.introEnd ? this.currentNode.play(this._startTime + this.introEnd) : this.currentNode.play(0, a - this.introEnd);
                            this.loop && this.nextNode.play(this._startTime + this.loopEnd + this.introEnd)
                        } else {
                            for (a = a - this.introEnd; a > this.loopEnd + this._nextOffset;) a = a - this.loopEnd;
                            this.currentNode.play(0, a);
                            if (this.loop)
                                if (a > this.loopEnd) {
                                    a = a - this.loopEnd;
                                    this.nextNode.play(0, a)
                                } else this.nextNode.play(this._startTime + this.loopEnd * (this._loopCount + 1) + this.introEnd)
                        }
                    }
                    ig.soundManager.registerTrack(this)
                }
            },
            pause: function() {
                if (this.bufferHandle && this.playing) {
                    this._clearNodes();
                    this._pauseTime = this._context.getCurrentTime();
                    this.playing =
                        false;
                    ig.soundManager.unregisterTrack(this)
                }
            }
        });
        ig.SoundDefault = ig.Class.extend({
            group: null,
            multiAudio: null,
            volume: 1,
            currentClip: null,
            multiChannel: true,
            init: function(a, b, c, d) {
                this.multiAudio = new ig.MultiAudio(a, ig.Sound.channels);
                this.volume = b || 1;
                this.group = d || a
            },
            clone: function() {
                return new ig.SoundDefault(this.multiAudio.path, this.volume, 0, this.group)
            },
            clearCached: function() {
                this.multiAudio.decreaseRef()
            },
            play: function(a) {
                if (!ig.Sound.enabled) return null;
                this.currentClip = this.multiAudio.get();
                if (!isNaN(this.currentClip.duration)) {
                    var b =
                        ig.soundManager.volume * this.volume * ig.GlobalVolume.get(this.multiAudio.path),
                        a = new ig.SoundHandle(this.currentClip, 0, 0, a, b);
                    ig.soundManager.requestPlaySoundHandle(this.group, a);
                    return a
                }
                return null
            },
            stop: function() {
                ig.warn("Called stop on Default Sound.")
            }
        });
        ig.SoundWebAudio = ig.Class.extend({
            group: null,
            webAudioBuffer: null,
            volume: 1,
            variance: 0,
            init: function(a, b, c, d) {
                this.webAudioBuffer = new ig.WebAudioBuffer(a);
                this.volume = b || 1;
                this.variance = c || 0;
                this.group = d || a
            },
            clone: function() {
                return new ig.SoundWebAudio(this.webAudioBuffer.path,
                    this.volume, this.variance, this.group)
            },
            clearCached: function() {
                this.webAudioBuffer.decreaseRef()
            },
            play: function(a, b) {
                var c = 0,
                    d = 0,
                    e = 1,
                    f = 0;
                if (b) {
                    c = b.offset || 0;
                    d = b.startTime || 0;
                    e = b.speed || 1;
                    f = b.fadeDuration
                }
                this.variance && (e = e * (1 + (Math.random() - 0.5) * 2 * this.variance));
                if (!ig.Sound.enabled) return null;
                var g = this.webAudioBuffer.get();
                if (!isNaN(g.duration)) {
                    var h = ig.soundManager.volume * this.volume * ig.GlobalVolume.get(this.webAudioBuffer.path),
                        c = new ig.SoundHandle(g, c, d, a, h, e, f);
                    ig.soundManager.requestPlaySoundHandle(this.group,
                        c);
                    return c
                }
                return null
            },
            stop: function() {
                ig.warn("Called stop on WebAudio Sound.")
            }
        });
        ig.SoundHandleBase = ig.Class.extend({
            pos: null,
            setFixPosition: function(a, b, c) {
                this.pos = {
                    point: e.createC(a.x, a.y - (a.z || 0)),
                    entity: null,
                    align: null,
                    offset: null,
                    range: b || 1600,
                    rangeType: c || ig.SOUND_RANGE_TYPE.CIRCULAR
                }
            },
            setEntityPosition: function(a, b, c, d, f) {
                this.pos = {
                    point: e.createC(0, 0),
                    entity: a,
                    align: b,
                    offset: c,
                    range: d || 1600,
                    rangeType: f || ig.SOUND_RANGE_TYPE.CIRCULAR
                };
                this._updateEntityPos(true)
            },
            _updateEntityPos: function(a) {
                if (this.pos &&
                    this.pos.entity)
                    if (a || !this.pos.entity._killed) {
                        a = this.pos.entity.getAlignedPos(this.pos.align, f);
                        this.offset && g.add(a, this.offset);
                        this.pos.point.x = a.x;
                        this.pos.point.y = a.y - a.z
                    } else this.pos.entity = null
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
            init: function(a, b, c, d, e) {
                this._offset = b || 0;
                this._startTime = c || 0;
                this._duration = a.duration;
                a.volume = (e * e).limit(0, 1);
                a.loop = d || false;
                this._clip = a
            },
            update: function() {
                if (this._clip.loop) return false;
                this._time = this._time + ig.system.actualTick;
                if (this._time >= this._duration) {
                    ig.soundManager.stopSoundHandle(this);
                    return true
                }
                return false
            },
            setSize: function() {},
            play: function() {
                this._clip.play()
            },
            stop: function() {
                ig.soundManager.stopSoundHandle(this);
                try {
                    this._clip.volume = 0;
                    this._clip.loop = false;
                    if (this._duration - this._clip.currentTime > 0.8) this._clip.currentTime = this._duration
                } catch (a) {}
                this._time = this._duration
            },
            isLooping: function() {
                return this._clip.loop
            },
            getPlayTime: function() {
                return this._clip.currentTime
            },
            pause: function() {
                this._clip.pause()
            },
            onActionEndDetach: function() {
                this.stop()
            },
            onEntityKillDetach: function() {
                this.stop()
            }
        });
        var i = e.createC(0, 0);
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
            init: function(a, b, c, d, e, f, g) {
                this._offset = b || 0;
                this._startTime =
                    c || 0;
                this._duration = a.duration / f;
                this._loop = d || false;
                this._buffer = a;
                this._volume = e;
                this._speed = f;
                this._fadeDuration = g || 0.1;
                this._doPanning = this._duration >= 1 || this._loop
            },
            update: function() {
                this._doPanning && this._setPosition();
                if (!this._loop && this._contextTimeOnPause == -1 && ig.soundManager.context.getCurrentTime() - this._contextTimeOnStart >= this._duration) {
                    ig.soundManager.stopSoundHandle(this);
                    this._buffer = null;
                    this._disconnect();
                    return true
                }
                if (this._fadeTimer) {
                    this._fadeTimer = this._fadeTimer - ig.system.rawTick;
                    if (this._fadeTimer <= 0) {
                        this._fadeTimer = 0;
                        if (!this._fadeIn) {
                            this._disconnect();
                            return true
                        }
                    }
                    if (this._nodeSource) {
                        var a = this._fadeTimer / this._fadeDuration;
                        this._fadeIn && (a = 1 - a);
                        this._nodeSource.setVolume(this._volume * this._volume * a * a)
                    }
                }
                return false
            },
            isLooping: function() {
                return this._loop
            },
            setSize: function(a, b) {
                this._width = a || 0;
                this._height = b || 0
            },
            play: function() {
                if (!this._playing && this._buffer) {
                    var a = ig.soundManager.context;
                    if (this.pos && !this._nodePosition) {
                        this._nodePosition = a.createPanner();
                        this._nodePosition.panningModel =
                            "equalpower";
                        this._nodePosition.distanceModel = "linear";
                        this._nodePosition.refDistance = 0.1 * this.pos.range;
                        this._nodePosition.maxDistance = this.pos.range;
                        this._setPosition()
                    }
                    if (this._nodeSource) {
                        this._fadeTimer = this._fadeDuration - this._fadeTimer;
                        this._fadeIn = true
                    } else {
                        var b = 0;
                        if (this._contextTimeOnPause == -1) {
                            this._contextTimeOnStart = a.getCurrentTime();
                            this._fadeIn = false
                        } else {
                            var b = (this._contextTimeOnPause - this._contextTimeOnStart) * this._speed % this._duration,
                                c = a.getCurrentTime();
                            this._contextTimeOnStart =
                                this._contextTimeOnStart + (c - this._contextTimeOnPause);
                            this._contextTimeOnPause = -1;
                            this._fadeIn = true;
                            this._fadeTimer = this._fadeDuration
                        }
                        this._nodeSource = a.createBufferGain(this._buffer, this._fadeIn ? 0 : this._volume * this._volume, this._speed);
                        this._nodeSource.setLoop(this._loop);
                        if (this._nodePosition) {
                            this._nodeSource.connect(this._nodePosition);
                            ig.soundManager.connectSound(this._nodePosition)
                        } else ig.soundManager.connectSound(this._nodeSource);
                        this._nodeSource.play(a.getCurrentTimeRaw() + this._startTime,
                            this._offset + b)
                    }
                    this._playing = true
                }
            },
            stop: function() {
                this.pause();
                this._buffer = null;
                ig.soundManager.stopSoundHandle(this)
            },
            _disconnect: function() {
                if (this._nodeSource) {
                    this._nodeSource.stop(0);
                    if (this._nodePosition) {
                        this._nodeSource.disconnect(this._nodePosition);
                        ig.soundManager.disconnectSound(this._nodePosition)
                    } else ig.soundManager.disconnectSound(this._nodeSource);
                    this._nodeSource = null
                }
            },
            getPlayTime: function() {
                return ig.soundManager.context.getCurrentTime() - this._contextTimeOnStart
            },
            pause: function(a) {
                if (this._playing) {
                    this._contextTimeOnPause =
                        ig.soundManager.context.getCurrentTime();
                    this._playing = false;
                    if (a) {
                        this._disconnect();
                        this._fadeTimer = 0
                    } else this._fadeTimer = this._fadeDuration;
                    this._fadeIn = false
                }
            },
            _setPosition: function() {
                if (this.pos) {
                    this._updateEntityPos();
                    if (this._nodePosition) {
                        var a = this.pos.range * 0.1,
                            b = this.pos.range * 0.9;
                        i.x = this.pos.point.x - ig.game.soundPos.x;
                        i.y = this.pos.point.y - ig.game.soundPos.y;
                        if (ig.SOUND_RANGE_TYPE[this.pos.rangeType] == ig.SOUND_RANGE_TYPE.HORIZONTAL) i.x = 0;
                        else if (ig.SOUND_RANGE_TYPE[this.pos.rangeType] ==
                            ig.SOUND_RANGE_TYPE.VERTICAL) i.y = 0;
                        var c = e.length(i),
                            c = c < a ? 0 : KEY_SPLINES.EASE_SOUND.get(((c - a) / b).limit(0, 1)) * this.pos.range;
                        e.length(i, c);
                        this._nodePosition.setPosition(i.x, i.y, -0.1 * this.pos.range)
                    }
                }
            },
            onActionEndDetach: function() {
                this.stop()
            },
            onEntityKillDetach: function() {
                this.stop()
            }
        });
        var j = e.create();
        ig.SoundHelper = {
            playAtEntity: function(a, b, c, d, f, g) {
                if (a) {
                    var h = b.coll;
                    e.assignC(j, h.pos.x + h.size.x / 2, h.pos.y + h.size.y / 2 - (h.pos.z + h.size.z / 2));
                    (a = a.play(c, d)) && a.setEntityPosition(b, ig.ENTITY_ALIGN.CENTER,
                        null, f, g);
                    return a
                }
            }
        };
        var m = localStorage.getItem("options.useWebAudio") != "false",
            m = ig.WebAudio.isSupported() && !window.IG_FORCE_HTML5_AUDIO && m;
        ig.nwjsVersion && ig.nwjsVersion[1] >= 3E3 && (m = true);
        if (m) {
            ig.Sound = ig.SoundWebAudio;
            ig.SoundHandle = ig.SoundHandleWebAudio;
            ig.webAudioActive = true;
            ig.Track = (ig.platform == ig.PLATFORM_TYPES.BROWSER || window.IG_GAME_DEBUG) && !window.IG_WEB_AUDIO_BGM ? ig.TrackDefault : ig.TrackWebAudio
        } else {
            ig.webAudioActive = false;
            ig.Sound = ig.SoundDefault;
            ig.SoundHandle = ig.SoundHandleDefault;
            ig.Track = ig.TrackDefault;
            ig.log("SET DEFAULT TRACK!")
        }
        ig.Sound.FORMAT = {
            MP3: {
                ext: "mp3",
                mime: "audio/mpeg"
            },
            M4A: {
                ext: "m4a",
                mime: "audio/mp4; codecs=mp4a"
            },
            OGG: {
                ext: "ogg",
                mime: "audio/ogg; codecs=vorbis"
            },
            WEBM: {
                ext: "webm",
                mime: "audio/webm; codecs=vorbis"
            },
            CAF: {
                ext: "caf",
                mime: "audio/x-caf"
            }
        };
        ig.Sound.use = [ig.Sound.FORMAT.OGG, ig.Sound.FORMAT.MP3];
        ig.Sound.channels = 4;
        ig.Sound.enabled = true
    });
    ig.baked = !0;
    