ig.module("impact.base.system.web-audio").requires("impact.base.loader").defines(function() {
        ig.WebAudio =
            ig.Class.extend({
                context: null,
                timeOffset: 0,
                init: function() {
                    this.context = this._createContext()
                },
                getDestination: function() {
                    return this.context.destination
                },
                getSampleRate: function() {
                    return this.context.sampleRate
                },
                decodeAudioData: function(a, b, c) {
                    this.context.decodeAudioData(a, b, c)
                },
                getCurrentTime: function() {
                    return this.context.currentTime + this.timeOffset
                },
                getCurrentTimeRaw: function() {
                    return this.context.currentTime
                },
                createGain: function() {
                    if (this.context.createGainNode) return this.context.createGainNode();
                    if (this.context.createGain) return this.context.createGain()
                },
                createDynamicCompressor: function() {
                    return !this.context.createDynamicsCompressor ? null : this.context.createDynamicsCompressor()
                },
                createPanner: function() {
                    if (this.context.createPanner) return this.context.createPanner()
                },
                createBufferGain: function(a, b, c) {
                    return new ig.WebAudioBufferGain(this.context, a, b, c)
                },
                _createContext: function() {
                    return new(window.AudioContext || window.webkitAudioContext)
                }
            });
        ig.WebAudio.isSupported = function() {
            return !!window.AudioContext ||
                !!window.webkitAudioContext
        };
        ig.WebAudioBufferGain = function(a, b, c, d) {
            this.context = a;
            this.bufferNode = this.context.createBufferSource();
            this.bufferNode.buffer = b;
            this.bufferNode.playbackRate.value = d || 1;
            this.gainNode = this.context.createGain();
            c !== void 0 && this.setVolume(c);
            this.bufferNode.connect(this.gainNode)
        };
        var a = ig.WebAudioBufferGain.prototype;
        a.connect = function(a) {
            this.gainNode.connect(a)
        };
        a.disconnect = function(a) {
            this.gainNode.disconnect(a)
        };
        a.setLoop = function(a) {
            this.bufferNode.loop = a
        };
        a.setVolume =
            function(a) {
                this.gainNode.gain.value = a
            };
        a.play = function(a, b) {
            var c = this.bufferNode;
            if (!c.playbackState) {
                b < 0 && (b = 0);
                c.start ? c.start(a || 0, b || 0) : c.noteOn(a || 0, b || 0)
            }
        };
        a.stop = function(a) {
            var b = this.bufferNode;
            b.playbackState && (b.stop ? b.stop(a) : b.noteOff(a))
        }
    });
    ig.baked = !0;
    