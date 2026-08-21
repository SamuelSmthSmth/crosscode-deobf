/**
 * impact.base.system.web-audio
 * =============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.system.web-audio")`.
 *
 * Thin wrapper over the Web Audio API: `ig.WebAudio` owns the AudioContext, and
 * `ig.WebAudioBufferGain` wraps a BufferSource + GainNode pair (playable/loopable
 * sample with volume).
 */
ig.module("impact.base.system.web-audio").requires("impact.base.loader").defines(function () {

    ig.WebAudio = ig.Class.extend({
        context: null,
        timeOffset: 0,

        init: function () {
            this.context = this._createContext();
        },

        getDestination: function () {
            return this.context.destination;
        },

        getSampleRate: function () {
            return this.context.sampleRate;
        },

        decodeAudioData: function (arrayBuffer, success, error) {
            this.context.decodeAudioData(arrayBuffer, success, error);
        },

        getCurrentTime: function () {
            return this.context.currentTime + this.timeOffset;
        },

        getCurrentTimeRaw: function () {
            return this.context.currentTime;
        },

        createGain: function () {
            if (this.context.createGainNode) return this.context.createGainNode();
            if (this.context.createGain) return this.context.createGain();
        },

        createDynamicCompressor: function () {
            return !this.context.createDynamicsCompressor ? null : this.context.createDynamicsCompressor();
        },

        createPanner: function () {
            if (this.context.createPanner) return this.context.createPanner();
        },

        createBufferGain: function (buffer, volume, rate) {
            return new ig.WebAudioBufferGain(this.context, buffer, volume, rate);
        },

        _createContext: function () {
            return new (window.AudioContext || window.webkitAudioContext)();
        },
    });

    ig.WebAudio.isSupported = function () {
        return !!window.AudioContext || !!window.webkitAudioContext;
    };

    /**
     * A playable sample: BufferSource -> GainNode -> destination.
     * @param {AudioContext} context
     * @param {AudioBuffer} buffer
     * @param {number} [volume]
     * @param {number} [rate] playback rate
     */
    ig.WebAudioBufferGain = function (context, buffer, volume, rate) {
        this.context = context;
        this.bufferNode = this.context.createBufferSource();
        this.bufferNode.buffer = buffer;
        this.bufferNode.playbackRate.value = rate || 1;
        this.gainNode = this.context.createGain();
        if (volume !== undefined) this.setVolume(volume);
        this.bufferNode.connect(this.gainNode);
    };

    var proto = ig.WebAudioBufferGain.prototype;
    proto.connect = function (node) {
        this.gainNode.connect(node);
    };
    proto.disconnect = function (node) {
        this.gainNode.disconnect(node);
    };
    proto.setLoop = function (loop) {
        this.bufferNode.loop = loop;
    };
    proto.setVolume = function (volume) {
        this.gainNode.gain.value = volume;
    };
    proto.play = function (offset, when) {
        var source = this.bufferNode;
        if (!source.playbackState) {
            if (when < 0) when = 0;
            if (source.start) source.start(offset || 0, when || 0);
            else source.noteOn(offset || 0, when || 0);
        }
    };
    proto.stop = function (when) {
        var source = this.bufferNode;
        if (source.playbackState) {
            if (source.stop) source.stop(when);
            else source.noteOff(when);
        }
    };
});
