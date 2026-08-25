ig.module("impact.feature.nwf.nwf-errors").defines(function() {
    function b(b) {
        if (!(b.errorType === 0 || b.errorCode === 0)) switch (b.errorType) {
            case nwf.system.SystemErrorType.FS:
            case nwf.system.SystemErrorType.SAVE:
                a(b.errorCode, b.callback);
                break;
            case nwf.system.SystemErrorType.AC:
            case nwf.system.SystemErrorType.ACT:
                h && a(evt.errorCode, function(a) {
                    a.user_select !== e.USER_OK && console.log("[NWF] Error ignored. WARNING: SAMPLE WILL NOT WORK PROPERLY")
                });
                break;
            case nwf.system.SystemErrorType.VPAD:
                switch (b.errorCode) {
                    case f.VPAD_READ_ERR_NO_CONTROLLER:
                        var d =
                            nwf.input.WiiUGamePad.getController(0);
                        if (!d.connected) {
                            d.addEventListener(nwf.events.ControllerEvent.CONTROLLER_CONNECTED, c);
                            a(b.errorCode)
                        }
                        break;
                    default:
                        console.log("[NWF] Unhandled VPAD: " + b.errorText)
                }
                break;
            case nwf.system.SystemErrorType.CMN_MSG:
                switch (b.errorCode) {
                    case f.CMN_MSG_INTERNET_BROWSER_PROTECTED:
                        a(b.errorCode, b.callback, e.DISPLAY_GAMEPAD_0);
                        break;
                    case f.CMN_MSG_TEXT_OVER_LIMIT:
                        a(b.errorCode, b.callback, e.DISPLAY_GAMEPAD_0);
                        break;
                    case f.CMN_MSG_TEXT_NO_INPUT:
                        a(b.errorCode, b.callback,
                            e.DISPLAY_GAMEPAD_0);
                        break;
                    default:
                        console.log("[NWF] Unhandled CMN_MSG: " + b.errorText)
                }
                break;
            case nwf.system.SystemErrorType.NWF:
                var d = "UNKNOWN",
                    g;
                for (g in f) f[g] == b.errorCode && (d = g);
                switch (b.errorCode) {
                    default:
                        console.log("[NWF] Unhandled NWF (" + b.errorCode + " = " + d + "):" + b.errorText)
                }
                break;
            case 115:
                switch (b.errorCode) {
                    default:
                        console.log("[NWF] MIIVERSE: " + b.errorText);
                        a(b.errorCode, b.callback, e.DISPLAY_GAMEPAD_0)
                }
                break;
            default:
                ig.log("[NWF] Unhandled error: (" + b.errorCode + ") " + b.errorText)
        }
    }

    function a(a,
        b, c, d) {
        typeof b !== "function" && (b = i);
        if (typeof c === "undefined") c = e.DISPLAY_ALL;
        typeof d === "undefined" && (d = false);
        return e.displaySystemError(b, a, c, d)
    }

    function d() {
        ig.log("******** [NWF] CRASH IMMINENT ********")
    }

    function c() {
        nwf.input.WiiUGamePad.getController(0).removeEventListener(nwf.events.ControllerEvent.CONTROLLER_CONNECTED, c);
        e.closeDialog()
    }
    if (window.nwf) {
        var e = nwf.ui.Dialog,
            f = nwf.system.SystemErrorCode,
            g = nwf.events.SystemErrorEvent,
            h = false,
            i = function() {},
            j = nwf.system.WiiUSystem.getInstance();
        j.addEventListener(g.ERROR, b);
        j.addEventListener(g.CRASH, d)
    }
});
ig.baked = !0;
