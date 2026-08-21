/**
 * impact.feature.nwf.nwf-errors
 * =============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.nwf.nwf-errors")`.
 *
 * Wii U (NWF) system error handling: listens for `ERROR`/`CRASH` events from
 * the WiiU system and routes known error codes to the NWF dialog, logging the
 * rest.
 */
ig.module("impact.feature.nwf.nwf-errors")
    .defines(function () {

    /** Handle a system error event, dispatching by type/error code. */
    function handleSystemError(event) {
        if (!(event.errorType === 0 || event.errorCode === 0)) {
            switch (event.errorType) {
                case nwf.system.SystemErrorType.FS:
                case nwf.system.SystemErrorType.SAVE:
                    showDialog(event.errorCode, event.callback);
                    break;
                case nwf.system.SystemErrorType.AC:
                case nwf.system.SystemErrorType.ACT:
                    hasIgnoredAccountError && showDialog(event.errorCode, function (result) {
                        result.user_select !== dialog.USER_OK && console.log("[NWF] Error ignored. WARNING: SAMPLE WILL NOT WORK PROPERLY");
                    });
                    break;
                case nwf.system.SystemErrorType.VPAD:
                    switch (event.errorCode) {
                        case errorCode.VPAD_READ_ERR_NO_CONTROLLER:
                            var controller = nwf.input.WiiUGamePad.getController(0);
                            if (!controller.connected) {
                                controller.addEventListener(nwf.events.ControllerEvent.CONTROLLER_CONNECTED, onControllerConnected);
                                showDialog(event.errorCode);
                            }
                            break;
                        default:
                            console.log("[NWF] Unhandled VPAD: " + event.errorText);
                    }
                    break;
                case nwf.system.SystemErrorType.CMN_MSG:
                    switch (event.errorCode) {
                        case errorCode.CMN_MSG_INTERNET_BROWSER_PROTECTED:
                            showDialog(event.errorCode, event.callback, dialog.DISPLAY_GAMEPAD_0);
                            break;
                        case errorCode.CMN_MSG_TEXT_OVER_LIMIT:
                            showDialog(event.errorCode, event.callback, dialog.DISPLAY_GAMEPAD_0);
                            break;
                        case errorCode.CMN_MSG_TEXT_NO_INPUT:
                            showDialog(event.errorCode, event.callback, dialog.DISPLAY_GAMEPAD_0);
                            break;
                        default:
                            console.log("[NWF] Unhandled CMN_MSG: " + event.errorText);
                    }
                    break;
                case nwf.system.SystemErrorType.NWF:
                    var name = "UNKNOWN",
                        key;
                    for (key in errorCode) errorCode[key] == event.errorCode && (name = key);
                    switch (event.errorCode) {
                        default:
                            console.log("[NWF] Unhandled NWF (" + event.errorCode + " = " + name + "):" + event.errorText);
                    }
                    break;
                case 115: // Miiverse
                    switch (event.errorCode) {
                        default:
                            console.log("[NWF] MIIVERSE: " + event.errorText);
                            showDialog(event.errorCode, event.callback, dialog.DISPLAY_GAMEPAD_0);
                    }
                    break;
                default:
                    ig.log("[NWF] Unhandled error: (" + event.errorCode + ") " + event.errorText);
            }
        }
    }

    /** Show the system error dialog; `callback` defaults to a no-op. */
    function showDialog(errorCode, callback, display, isWarning) {
        typeof callback !== "function" && (callback = noop);
        if (typeof display === "undefined") display = dialog.DISPLAY_ALL;
        typeof isWarning === "undefined" && (isWarning = false);
        return dialog.displaySystemError(callback, errorCode, display, isWarning);
    }

    function onCrash() {
        ig.log("******** [NWF] CRASH IMMINENT ********");
    }

    function onControllerConnected() {
        nwf.input.WiiUGamePad.getController(0).removeEventListener(nwf.events.ControllerEvent.CONTROLLER_CONNECTED, onControllerConnected);
        dialog.closeDialog();
    }

    if (window.nwf) {
        var dialog = nwf.ui.Dialog,
            errorCode = nwf.system.SystemErrorCode,
            systemErrorEvent = nwf.events.SystemErrorEvent,
            hasIgnoredAccountError = false,
            noop = function () {},
            wiiuSystem = nwf.system.WiiUSystem.getInstance();
        wiiuSystem.addEventListener(systemErrorEvent.ERROR, handleSystemError);
        wiiuSystem.addEventListener(systemErrorEvent.CRASH, onCrash);
    }
});
ig.baked = !0;
