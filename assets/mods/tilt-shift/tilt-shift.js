/**
 * Tilt Shift Effect v1.1.1
 * ========================
 * 2.5D diorama-style blur for CrossCode, rewritten on the ENGINE'S OWN
 * render hooks instead of hijacking `ig.Game.prototype.draw`.
 *
 * How the engine's draw pipeline works (see deobf/clean/impact.base.game.js
 * `ig.Game.draw()`):
 *
 *     onPreDraw addons  →  world renderer  →  onPostDraw addons (sorted)  →  done
 *
 *     preDrawOrder 1000  ig.screenBlur        (offscreen buffer swap)
 *     postDrawOrder 200  ig.screenBlur        (composites its buffer back)
 *     postDrawOrder 250  THIS MOD             (blurs the world frame)
 *     postDrawOrder 500  ig.gui               (HUD — always sharp, on top)
 *     postDrawOrder 501  THIS MOD diagnostics (overlay on top of everything)
 *
 * The world renders into our private buffer (onPreDraw), then we composite
 * it back with the tilt-shift blur + mask (onPostDraw, order 250), and the
 * GUI draws natively on top at order 500. No HUD redraw, no clip-rect
 * "protection" hacks — the layer order does the work.
 */
(() => {
    'use strict';

    const STORAGE_KEY = 'tiltShiftModSettings';
    const MOD_VERSION = '1.1.2';
    const MOD_PHASE = 'Phase 25';
    const MOD_BUILD_DATE = '2026-08-21';

    const ts = {
        enabled: true,
        autoDisablePortraits: false,
        autoDisableLetterbox: false,
        smoothAutoFade: true,
        autoFadeSpeed: 0.2,
        opacity: 1,
        strength: 4,
        passes: 1,
        spread: 0.22,
        affectSides: false,
        sideSpread: 0.16,
        edgeClamp: 0.04,
        scale: 0.5,
        updateEvery: 2,
        disableInMenus: true,
        // Performance automation
        adaptiveQualityEnabled: false,
        adaptiveFpsTarget: 45,
        adaptiveFpsBuffer: 10,
        adaptiveScaleCooldown: 1000,
        fpsSmoothing: 0.2,
        failsafeEnabled: true,
        failsafeTriggerFps: 24,
        failsafeGraceFrames: 45,
        failsafeRecoverFps: 34,
        failsafeRecoverFrames: 90,
        autoDisableCombat: false,
        combatAutoAction: false,
        combatAutoProfile: 'performance',
        // Hotkeys
        hotkeyEnabled: false,
        hotkeyToggleKey: 'T',
        hotkeyPresetCycleKey: 'P',
        customPresetSlots: [null, null, null, null, null],
        // Diagnostics
        diagnosticsEnabled: false,
        diagnosticsOverlayEnabled: true,
        diagnosticsOverlayCompact: true,
        diagnosticsOverlayOpacity: 0.55,
        diagnosticsOverlayX: 8,
        diagnosticsOverlayY: 8,
        // Menu organization
        menuSectionFocus: 'all',
        // Runtime state
        canvas: document.createElement('canvas'),
        scratch: document.createElement('canvas'),
        mask: document.createElement('canvas'),
        ctx: null,
        scratchCtx: null,
        maskCtx: null,
        outputCanvas: null,
        autoFadeAlpha: 1,
        effectiveAlpha: 1,
        fadeTarget: 1,
        frameCounter: 0,
        lastW: 0,
        lastH: 0,
        lastSpread: -1,
        dirty: true,
        lastFrameTime: 0,
        currentFps: 60,
        currentFpsRaw: 60,
        lastQualityScaleTime: 0,
        failsafeActive: false,
        failsafeLowFrameCount: 0,
        failsafeRecoverFrameCount: 0,
        inCombat: false,
        adaptiveRestoreState: null,
        combatRestoreState: null,
        lastHotkeyToggleTime: 0,
        lastHotkeyCycleTime: 0,
        currentCustomPresetIndex: -1,
        hotkeyCaptureMode: null,
        menuActionStatus: '',
        menuActionStatusIsError: false,
        menuActionStatusUntil: 0,
        menuActionStatusCounter: 0,
        menuActionStatusActiveId: 0
    };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function sanitizeSettings() {
        ts.enabled = !!ts.enabled;
        ts.autoDisablePortraits = !!ts.autoDisablePortraits;
        ts.autoDisableLetterbox = !!ts.autoDisableLetterbox;
        ts.smoothAutoFade = !!ts.smoothAutoFade;
        ts.autoFadeSpeed = clamp(Number(ts.autoFadeSpeed), 0.05, 0.6);
        if (!Number.isFinite(ts.autoFadeSpeed)) ts.autoFadeSpeed = 0.2;
        ts.disableInMenus = !!ts.disableInMenus;
        ts.affectSides = !!ts.affectSides;
        ts.opacity = clamp(Number(ts.opacity), 0, 1);
        if (!Number.isFinite(ts.opacity)) ts.opacity = 1;
        ts.strength = clamp(Number(ts.strength) || 0, 0, 20);
        ts.passes = clamp(Math.round(Number(ts.passes) || 1), 1, 4);
        ts.spread = clamp(Number(ts.spread) || 0.22, 0.05, 0.45);
        ts.sideSpread = clamp(Number(ts.sideSpread) || 0.16, 0.05, 0.45);
        ts.edgeClamp = clamp(Number(ts.edgeClamp) || 0, 0, 0.2);
        ts.scale = clamp(Number(ts.scale) || 0.5, 0.2, 1);
        ts.updateEvery = clamp(Math.round(Number(ts.updateEvery) || 1), 1, 4);
        // Performance automation settings
        ts.adaptiveQualityEnabled = !!ts.adaptiveQualityEnabled;
        ts.adaptiveFpsTarget = clamp(Number(ts.adaptiveFpsTarget) || 45, 30, 120);
        ts.adaptiveFpsBuffer = clamp(Number(ts.adaptiveFpsBuffer) || 10, 3, 30);
        ts.adaptiveScaleCooldown = clamp(Number(ts.adaptiveScaleCooldown) || 1000, 200, 5000);
        ts.fpsSmoothing = clamp(Number(ts.fpsSmoothing) || 0.2, 0.01, 1);
        ts.failsafeEnabled = !!ts.failsafeEnabled;
        ts.failsafeTriggerFps = clamp(Number(ts.failsafeTriggerFps) || 24, 10, 50);
        ts.failsafeGraceFrames = clamp(Math.round(Number(ts.failsafeGraceFrames) || 45), 10, 240);
        ts.failsafeRecoverFps = clamp(Number(ts.failsafeRecoverFps) || 34, 15, 80);
        ts.failsafeRecoverFrames = clamp(Math.round(Number(ts.failsafeRecoverFrames) || 90), 10, 360);
        ts.autoDisableCombat = !!ts.autoDisableCombat;
        ts.combatAutoAction = !!ts.combatAutoAction;
        ts.combatAutoProfile = ts.combatAutoProfile === 'performance' || ts.combatAutoProfile === 'balanced' ? ts.combatAutoProfile : 'performance';
        // Hotkeys
        ts.hotkeyEnabled = !!ts.hotkeyEnabled;
        ts.hotkeyToggleKey = String(ts.hotkeyToggleKey || 'T').toUpperCase().substring(0, 1);
        ts.hotkeyPresetCycleKey = String(ts.hotkeyPresetCycleKey || 'P').toUpperCase().substring(0, 1);
        if (!Array.isArray(ts.customPresetSlots)) ts.customPresetSlots = [null, null, null, null, null];
        ts.customPresetSlots = ts.customPresetSlots.slice(0, 5);
        while (ts.customPresetSlots.length < 5) ts.customPresetSlots.push(null);
        // Diagnostics
        ts.diagnosticsEnabled = !!ts.diagnosticsEnabled;
        ts.diagnosticsOverlayEnabled = !!ts.diagnosticsOverlayEnabled;
        ts.diagnosticsOverlayCompact = !!ts.diagnosticsOverlayCompact;
        ts.diagnosticsOverlayOpacity = clamp(Number(ts.diagnosticsOverlayOpacity) || 0.55, 0.15, 1);
        ts.diagnosticsOverlayX = clamp(Math.round(Number(ts.diagnosticsOverlayX) || 8), 0, 200);
        ts.diagnosticsOverlayY = clamp(Math.round(Number(ts.diagnosticsOverlayY) || 8), 0, 200);
        ts.menuSectionFocus = normalizeMenuSectionFocus(ts.menuSectionFocus);
    }

    function markDirty() {
        ts.dirty = true;
        ts.frameCounter = 0;
    }

    function getSerializableSettings() {
        return {
            enabled: ts.enabled,
            autoDisablePortraits: ts.autoDisablePortraits,
            autoDisableLetterbox: ts.autoDisableLetterbox,
            smoothAutoFade: ts.smoothAutoFade,
            autoFadeSpeed: ts.autoFadeSpeed,
            opacity: ts.opacity,
            strength: ts.strength,
            passes: ts.passes,
            spread: ts.spread,
            affectSides: ts.affectSides,
            sideSpread: ts.sideSpread,
            edgeClamp: ts.edgeClamp,
            scale: ts.scale,
            updateEvery: ts.updateEvery,
            disableInMenus: ts.disableInMenus,
            adaptiveQualityEnabled: ts.adaptiveQualityEnabled,
            adaptiveFpsTarget: ts.adaptiveFpsTarget,
            adaptiveFpsBuffer: ts.adaptiveFpsBuffer,
            adaptiveScaleCooldown: ts.adaptiveScaleCooldown,
            fpsSmoothing: ts.fpsSmoothing,
            failsafeEnabled: ts.failsafeEnabled,
            failsafeTriggerFps: ts.failsafeTriggerFps,
            failsafeGraceFrames: ts.failsafeGraceFrames,
            failsafeRecoverFps: ts.failsafeRecoverFps,
            failsafeRecoverFrames: ts.failsafeRecoverFrames,
            autoDisableCombat: ts.autoDisableCombat,
            combatAutoAction: ts.combatAutoAction,
            combatAutoProfile: ts.combatAutoProfile,
            hotkeyEnabled: ts.hotkeyEnabled,
            hotkeyToggleKey: ts.hotkeyToggleKey,
            hotkeyPresetCycleKey: ts.hotkeyPresetCycleKey,
            customPresetSlots: ts.customPresetSlots,
            diagnosticsEnabled: ts.diagnosticsEnabled,
            diagnosticsOverlayEnabled: ts.diagnosticsOverlayEnabled,
            diagnosticsOverlayCompact: ts.diagnosticsOverlayCompact,
            diagnosticsOverlayOpacity: ts.diagnosticsOverlayOpacity,
            diagnosticsOverlayX: ts.diagnosticsOverlayX,
            diagnosticsOverlayY: ts.diagnosticsOverlayY,
            menuSectionFocus: ts.menuSectionFocus
        };
    }

    function getDefaultSettings() {
        return {
            enabled: true,
            autoDisablePortraits: false,
            autoDisableLetterbox: false,
            smoothAutoFade: true,
            autoFadeSpeed: 0.2,
            opacity: 1,
            strength: 4,
            passes: 1,
            spread: 0.22,
            affectSides: false,
            sideSpread: 0.16,
            edgeClamp: 0.04,
            scale: 0.5,
            updateEvery: 2,
            disableInMenus: true,
            adaptiveQualityEnabled: false,
            adaptiveFpsTarget: 45,
            adaptiveFpsBuffer: 10,
            adaptiveScaleCooldown: 1000,
            fpsSmoothing: 0.2,
            failsafeEnabled: true,
            failsafeTriggerFps: 24,
            failsafeGraceFrames: 45,
            failsafeRecoverFps: 34,
            failsafeRecoverFrames: 90,
            autoDisableCombat: false,
            combatAutoAction: false,
            combatAutoProfile: 'performance',
            hotkeyEnabled: false,
            hotkeyToggleKey: 'T',
            hotkeyPresetCycleKey: 'P',
            customPresetSlots: [null, null, null, null, null],
            diagnosticsEnabled: false,
            diagnosticsOverlayEnabled: true,
            diagnosticsOverlayCompact: true,
            diagnosticsOverlayOpacity: 0.55,
            diagnosticsOverlayX: 8,
            diagnosticsOverlayY: 8,
            menuSectionFocus: 'all'
        };
    }

    function saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(getSerializableSettings()));
        } catch (err) {
            // Ignore storage errors in restricted environments.
        }
    }

    function beginMenuActionStatus() {
        ts.menuActionStatusCounter++;
        ts.menuActionStatusActiveId = ts.menuActionStatusCounter;
        return ts.menuActionStatusActiveId;
    }

    function setMenuActionStatus(message, isError, actionId) {
        if (typeof actionId === 'number' && actionId !== ts.menuActionStatusActiveId) return;
        ts.menuActionStatus = String(message || '');
        ts.menuActionStatusIsError = !!isError;
        ts.menuActionStatusUntil = Date.now() + 8000;
    }

    function getModReleaseLabel() {
        return MOD_PHASE + ' / v' + MOD_VERSION + ' / ' + MOD_BUILD_DATE;
    }

    function getMenuActionStatusText() {
        if (!ts.menuActionStatus) return 'idle';
        if (Date.now() > ts.menuActionStatusUntil) {
            ts.menuActionStatus = '';
            ts.menuActionStatusIsError = false;
            ts.menuActionStatusUntil = 0;
            return 'idle';
        }
        return (ts.menuActionStatusIsError ? 'ERROR: ' : 'OK: ') + ts.menuActionStatus;
    }

    function exportSettingsPayload() {
        const actionId = beginMenuActionStatus();
        const payload = JSON.stringify(getSerializableSettings());
        if (window.console && console.log) console.log('[Tilt Shift] Export payload: ' + payload);

        try {
            if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText(payload).then(() => {
                    setMenuActionStatus('settings copied to clipboard.', false, actionId);
                }).catch(() => {
                    setMenuActionStatus('exported, but clipboard write failed.', true, actionId);
                });
            }
        } catch (err) {
            // Ignore clipboard failures in restricted contexts.
        }

        if (typeof window.prompt === 'function') {
            window.prompt('Tilt Shift settings JSON (copy this):', payload);
            setMenuActionStatus('settings JSON ready (copy from prompt).', false, actionId);
        } else {
            setMenuActionStatus('settings exported to console output.', false, actionId);
        }
    }

    function importSettingsPayload() {
        const actionId = beginMenuActionStatus();
        if (typeof window.prompt !== 'function') {
            setMenuActionStatus('import unavailable (prompt API missing).', true, actionId);
            return false;
        }
        const input = window.prompt('Paste Tilt Shift settings JSON:');
        if (!input) {
            setMenuActionStatus('import cancelled.', false, actionId);
            return false;
        }

        try {
            const parsed = JSON.parse(input);
            if (!parsed || typeof parsed !== 'object') throw new Error('Invalid settings payload');
            Object.assign(ts, parsed);
            sanitizeSettings();
            markDirty();
            saveSettings();
            setMenuActionStatus('settings imported successfully.', false, actionId);
            return true;
        } catch (err) {
            setMenuActionStatus('import failed (invalid JSON).', true, actionId);
            if (window.console && console.error) console.error('[Tilt Shift] Failed to import settings:', err);
            return false;
        }
    }

    function resetAllSettings() {
        const actionId = beginMenuActionStatus();
        Object.assign(ts, getDefaultSettings());
        sanitizeSettings();
        markDirty();
        saveSettings();
        setMenuActionStatus('settings reset to defaults.', false, actionId);
        if (window.console && console.log) console.log('[Tilt Shift] Settings reset to defaults.');
    }

    const MENU_SECTION_ORDER = ['all', 'secGeneral', 'secPresets', 'secBlur', 'secMask', 'secPerf', 'secAutoPerf', 'secCustom', 'secHotkey', 'secDiag'];
    const MENU_SECTION_LABELS = {
        all: 'All Sections',
        secGeneral: 'General',
        secPresets: 'Presets',
        secBlur: 'Blur',
        secMask: 'Mask / Edges',
        secPerf: 'Performance',
        secAutoPerf: 'Automation',
        secCustom: 'Custom Presets',
        secHotkey: 'Hotkeys',
        secDiag: 'Diagnostics'
    };

    function normalizeMenuSectionFocus(value) {
        return MENU_SECTION_ORDER.indexOf(value) !== -1 ? value : 'all';
    }

    function getMenuSectionLabel(sectionKey) {
        return MENU_SECTION_LABELS[sectionKey] || 'All Sections';
    }

    function cycleMenuSectionFocus() {
        const currentIndex = MENU_SECTION_ORDER.indexOf(normalizeMenuSectionFocus(ts.menuSectionFocus));
        const nextIndex = (currentIndex + 1) % MENU_SECTION_ORDER.length;
        ts.menuSectionFocus = MENU_SECTION_ORDER[nextIndex];
        saveSettings();
        return ts.menuSectionFocus;
    }

    function loadSettings() {
        try {
            const str = localStorage.getItem(STORAGE_KEY);
            if (!str) return;
            const parsed = JSON.parse(str);
            if (parsed && typeof parsed === 'object') {
                Object.assign(ts, parsed);
                sanitizeSettings();
                markDirty();
            }
        } catch (err) {
            // Ignore malformed settings and keep defaults.
        }
    }

    function setSetting(key, value) {
        ts[key] = value;
        sanitizeSettings();
        markDirty();
        saveSettings();
    }

    function applyPreset(name) {
        const presets = {
            performance: {
                enabled: true,
                autoDisablePortraits: false,
                autoDisableLetterbox: false,
                smoothAutoFade: true,
                autoFadeSpeed: 0.24,
                opacity: 0.7,
                strength: 3,
                passes: 1,
                spread: 0.28,
                affectSides: false,
                sideSpread: 0.16,
                edgeClamp: 0.06,
                scale: 0.4,
                updateEvery: 3,
                disableInMenus: true
            },
            balanced: {
                enabled: true,
                autoDisablePortraits: false,
                autoDisableLetterbox: false,
                smoothAutoFade: true,
                autoFadeSpeed: 0.2,
                opacity: 0.85,
                strength: 4,
                passes: 1,
                spread: 0.32,
                affectSides: true,
                sideSpread: 0.22,
                edgeClamp: 0.08,
                scale: 0.5,
                updateEvery: 2,
                disableInMenus: true
            },
            cinematic: {
                enabled: true,
                autoDisablePortraits: false,
                autoDisableLetterbox: false,
                smoothAutoFade: true,
                autoFadeSpeed: 0.14,
                opacity: 1,
                strength: 6,
                passes: 2,
                spread: 0.35,
                affectSides: true,
                sideSpread: 0.27,
                edgeClamp: 0.12,
                scale: 0.6,
                updateEvery: 1,
                disableInMenus: true
            }
        };

        if (!presets[name]) return;
        Object.assign(ts, presets[name]);
        sanitizeSettings();
        markDirty();
        saveSettings();
    }

    function isInMenu() {
        return !!(sc && sc.model &&
            ((typeof sc.model.isPaused === 'function' && sc.model.isPaused()) ||
            (typeof sc.model.isMenu === 'function' && sc.model.isMenu())));
    }

    function isPortraitDialogueActive() {
        try {
            if (sc.model && sc.model.message && typeof sc.model.message.isActive === 'function' && sc.model.message.isActive()) return true;
            if (sc.message && typeof sc.message.isActive === 'function' && sc.message.isActive()) return true;
        } catch (err) {
            // Ignore state lookup issues and treat as inactive.
        }
        return false;
    }

    function isLetterboxActive() {
        try {
            if (sc.model && typeof sc.model.isCutscene === 'function' && sc.model.isCutscene()) return true;
            if (sc.model && typeof sc.model.isCutsceneMode === 'function' && sc.model.isCutsceneMode()) return true;
        } catch (err) {
            // Ignore state lookup issues and treat as inactive.
        }
        return false;
    }

    // Diagnostic tracking
    const tsDiagnostics = {
        lastProtectionMode: 'none',
        lastTriggerReasons: [],
        lastFrameUpdate: 0,
        lastAutoTriggered: false,
        lastCombatActive: false,
        adaptiveState: 'idle',
        failsafeState: 'idle',
        lastEffectiveAlpha: 1,
        sanityStatus: 'not-run',
        selfTestStatus: 'not-run',
        selfTestDetails: '',
        releaseReadinessStatus: 'not-run'
    };

    function updateDiagnostics() {
        const reasons = [];
        if (ts.autoDisablePortraits && isPortraitDialogueActive()) reasons.push('portrait');
        if (ts.autoDisableLetterbox && isLetterboxActive()) reasons.push('letterbox');
        tsDiagnostics.lastTriggerReasons = reasons;
        tsDiagnostics.lastFrameUpdate = ts.frameCounter;
    }

    function collectSanityIssues() {
        const issues = [];
        if (ts.scale < 0.2 || ts.scale > 1) issues.push('scale-out-of-range');
        if (ts.updateEvery < 1 || ts.updateEvery > 4) issues.push('updateEvery-out-of-range');
        if (!Array.isArray(ts.customPresetSlots) || ts.customPresetSlots.length !== 5) issues.push('customPresetSlots-shape');
        if (ts.adaptiveQualityEnabled && ts.adaptiveFpsTarget <= ts.adaptiveFpsBuffer) issues.push('adaptive-threshold-too-low');
        if (ts.failsafeEnabled && ts.failsafeRecoverFps <= ts.failsafeTriggerFps) issues.push('failsafe-recover-not-above-trigger');
        return issues;
    }

    function runSanityCheck() {
        const actionId = beginMenuActionStatus();
        const issues = collectSanityIssues();
        const status = issues.length ? 'WARN ' + issues.join(', ') : 'OK';
        tsDiagnostics.sanityStatus = status;
        if (issues.length) setMenuActionStatus('sanity warnings: ' + issues.join(', '), true, actionId);
        else setMenuActionStatus('sanity check passed.', false, actionId);
        if (window.console && console.log) console.log('[Tilt Shift] Sanity check: ' + status);
        return status;
    }

    function collectRuntimeHookFailures() {
        const failures = [];

        if (!window.__tiltShiftMenuPatched) failures.push('menu-hook');
        if (!document.__tiltShiftHotkeyListenerAttached) failures.push('hotkey-listener');
        if (!(window.ig && ig.TiltShiftAddon && ig.tiltShiftAddon && ig.tiltShiftAddon.registered)) {
            failures.push('draw-addon');
        }
        if (!(window.sc && sc.MenuModel && sc.MenuModel.prototype && sc.MenuModel.prototype.__tiltShiftMenuNamePatched)) {
            failures.push('menu-name-hook');
        }
        if (!(window.sc && sc.PauseScreenGui && sc.PauseScreenGui.prototype && sc.PauseScreenGui.prototype.__tiltShiftPauseMenuPatched)) {
            failures.push('pause-hook');
        }

        let hasSubmenu = false;
        if (window.sc && sc.MENU_SUBMENU && sc.SUB_MENU_INFO && typeof sc.MENU_SUBMENU.TILT_SHIFT === 'number') {
            const info = sc.SUB_MENU_INFO[sc.MENU_SUBMENU.TILT_SHIFT];
            hasSubmenu = !!(info && info.name === 'tilt-shift');
        }
        if (!hasSubmenu) failures.push('submenu-registration');

        return failures;
    }

    function runRuntimeSelfTest() {
        const actionId = beginMenuActionStatus();
        const failures = collectRuntimeHookFailures();
        const status = failures.length ? ('FAIL ' + failures.join(', ')) : 'PASS';
        tsDiagnostics.selfTestStatus = status;
        tsDiagnostics.selfTestDetails = failures.join(', ');
        if (failures.length) setMenuActionStatus('self-test failed: ' + failures.join(', '), true, actionId);
        else setMenuActionStatus('self-test passed.', false, actionId);
        if (window.console && console.log) console.log('[Tilt Shift] Runtime self-test: ' + status);
        return status;
    }

    function runHookRepair() {
        const actionId = beginMenuActionStatus();
        setMenuActionStatus('repair started...', false, actionId);

        try {
            registerTiltShiftAddons();
            hijackMenu();
            setupHotkeyListener();
        } catch (err) {
            setMenuActionStatus('repair failed to execute.', true, actionId);
            if (window.console && console.error) console.error('[Tilt Shift] Hook repair execution error:', err);
            return 'FAIL repair-exception';
        }

        setTimeout(() => {
            const failures = collectRuntimeHookFailures();
            const status = failures.length ? ('FAIL ' + failures.join(', ')) : 'PASS';
            tsDiagnostics.selfTestStatus = status;
            tsDiagnostics.selfTestDetails = failures.join(', ');
            if (failures.length) setMenuActionStatus('repair incomplete: ' + failures.join(', '), true, actionId);
            else setMenuActionStatus('repair successful.', false, actionId);
            if (window.console && console.log) console.log('[Tilt Shift] Hook repair verification: ' + status);
        }, 250);

        return 'PENDING';
    }

    function runReleaseReadinessCheck() {
        const actionId = beginMenuActionStatus();
        const sanityIssues = collectSanityIssues();
        const hookFailures = collectRuntimeHookFailures();

        const sanityStatus = sanityIssues.length ? ('WARN ' + sanityIssues.join(', ')) : 'OK';
        tsDiagnostics.sanityStatus = sanityStatus;

        const selfTestStatus = hookFailures.length ? ('FAIL ' + hookFailures.join(', ')) : 'PASS';
        tsDiagnostics.selfTestStatus = selfTestStatus;
        tsDiagnostics.selfTestDetails = hookFailures.join(', ');

        const ready = !sanityIssues.length && !hookFailures.length;
        const releaseStatus = ready ? 'READY' : ('NOT READY sanity=' + sanityIssues.length + ' hooks=' + hookFailures.length);
        tsDiagnostics.releaseReadinessStatus = releaseStatus;

        if (ready) setMenuActionStatus('release readiness passed.', false, actionId);
        else {
            const details = [];
            if (sanityIssues.length) details.push('sanity:' + sanityIssues.join('+'));
            if (hookFailures.length) details.push('hooks:' + hookFailures.join('+'));
            setMenuActionStatus('release readiness failed (' + details.join(' | ') + ')', true, actionId);
        }

        if (window.console && console.log) console.log('[Tilt Shift] Release readiness: ' + releaseStatus);
        return releaseStatus;
    }

    function drawDiagnosticsOverlay(ctx, inMenu) {
        if (!ts.diagnosticsEnabled || !ts.diagnosticsOverlayEnabled || inMenu) return;

        const autoText = tsDiagnostics.lastAutoTriggered
            ? (tsDiagnostics.lastTriggerReasons.join('+') || 'active')
            : 'none';
        const lines = [
            'TiltShift DIAG',
            'FPS: ' + Math.round(ts.currentFps) + ' (raw ' + Math.round(ts.currentFpsRaw) + ')',
            'Auto: ' + autoText,
            'Adaptive: ' + tsDiagnostics.adaptiveState,
            'Failsafe: ' + tsDiagnostics.failsafeState,
            'Combat: ' + (tsDiagnostics.lastCombatActive ? 'yes' : 'no'),
            'Alpha: ' + Math.round(tsDiagnostics.lastEffectiveAlpha * 100) + '%'
        ];

        const pad = ts.diagnosticsOverlayCompact ? 5 : 7;
        const lineHeight = ts.diagnosticsOverlayCompact ? 11 : 13;
        const x = ts.diagnosticsOverlayX;
        const y = ts.diagnosticsOverlayY;
        const width = ts.diagnosticsOverlayCompact ? 184 : 224;
        const height = (lines.length * lineHeight) + (pad * 2);

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0, 0, 0, ' + ts.diagnosticsOverlayOpacity + ')';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
        ctx.fillStyle = '#e8f2ff';
        ctx.font = ts.diagnosticsOverlayCompact ? '10px monospace' : '11px monospace';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x + pad, y + pad + ((i + 1) * lineHeight) - 2);
        }
        ctx.restore();
    }

    // --- Performance automation ---

    function updateFpsMonitor(deltaTime) {
        if (deltaTime > 0) {
            const instantFps = 1 / deltaTime;
            ts.currentFpsRaw = instantFps;
            const smoothing = clamp(ts.fpsSmoothing, 0.01, 1);
            ts.currentFps += (instantFps - ts.currentFps) * smoothing;
        }
    }

    function isCombatActive() {
        try {
            if (ig.game && ig.game.party && typeof ig.game.party.isInCombat === 'function') return ig.game.party.isInCombat();
            if (sc.model && typeof sc.model.isInCombat === 'function' && sc.model.isInCombat()) return true;
            if (sc.model && sc.model.combat && typeof sc.model.combat.isActive === 'function') return sc.model.combat.isActive();
        } catch (err) {
            // Ignore combat state lookup issues.
        }
        return false;
    }

    function applyAdaptiveQualityScaling() {
        if (!ts.adaptiveQualityEnabled) {
            tsDiagnostics.adaptiveState = 'disabled';
            return;
        }

        const now = Date.now();
        const timeSinceLastScale = now - ts.lastQualityScaleTime;
        if (timeSinceLastScale < ts.adaptiveScaleCooldown) return;

        const fpsTarget = ts.adaptiveFpsTarget;
        const fpsBuffer = ts.adaptiveFpsBuffer;
        const downgradeThreshold = fpsTarget - fpsBuffer;
        const upgradeThreshold = fpsTarget + fpsBuffer;

        const isFpsDegraded = ts.currentFps < downgradeThreshold;
        const isFpsRecovered = ts.currentFps > upgradeThreshold;

        if (!ts.adaptiveRestoreState && !isFpsDegraded) tsDiagnostics.adaptiveState = 'monitoring';

        if (isFpsDegraded && !ts.adaptiveRestoreState) {
            ts.adaptiveRestoreState = {
                strength: ts.strength,
                passes: ts.passes,
                updateEvery: ts.updateEvery,
                scale: ts.scale
            };
            applyPreset('performance');
            tsDiagnostics.adaptiveState = 'downgraded';
            ts.lastQualityScaleTime = now;
            if (window.console && console.log) console.log('[Tilt Shift] Adaptive quality: downgraded (FPS ' + Math.round(ts.currentFps) + ').');
        } else if (isFpsRecovered && ts.adaptiveRestoreState) {
            Object.assign(ts, ts.adaptiveRestoreState);
            ts.adaptiveRestoreState = null;
            sanitizeSettings();
            markDirty();
            tsDiagnostics.adaptiveState = 'recovered';
            ts.lastQualityScaleTime = now;
            if (window.console && console.log) console.log('[Tilt Shift] Adaptive quality: restored (FPS ' + Math.round(ts.currentFps) + ').');
        }
    }

    function applyPerformanceFailsafe() {
        if (!ts.failsafeEnabled) {
            ts.failsafeActive = false;
            ts.failsafeLowFrameCount = 0;
            ts.failsafeRecoverFrameCount = 0;
            tsDiagnostics.failsafeState = 'disabled';
            return;
        }

        if (!ts.failsafeActive) {
            if (ts.currentFps <= ts.failsafeTriggerFps) ts.failsafeLowFrameCount++;
            else ts.failsafeLowFrameCount = 0;

            if (ts.failsafeLowFrameCount >= ts.failsafeGraceFrames) {
                ts.failsafeActive = true;
                ts.failsafeRecoverFrameCount = 0;
                tsDiagnostics.failsafeState = 'active';
                if (window.console && console.warn) console.warn('[Tilt Shift] Failsafe engaged at ~' + Math.round(ts.currentFps) + ' FPS.');
            } else {
                tsDiagnostics.failsafeState = ts.failsafeLowFrameCount > 0 ? 'arming' : 'idle';
            }
            return;
        }

        if (ts.currentFps >= ts.failsafeRecoverFps) ts.failsafeRecoverFrameCount++;
        else ts.failsafeRecoverFrameCount = 0;

        if (ts.failsafeRecoverFrameCount >= ts.failsafeRecoverFrames) {
            ts.failsafeActive = false;
            ts.failsafeLowFrameCount = 0;
            ts.failsafeRecoverFrameCount = 0;
            tsDiagnostics.failsafeState = 'idle';
            if (window.console && console.log) console.log('[Tilt Shift] Failsafe released at ~' + Math.round(ts.currentFps) + ' FPS.');
        } else {
            tsDiagnostics.failsafeState = 'recovering';
        }
    }

    function handleCombatAutoBehavior(combatActive) {
        if (!ts.autoDisableCombat) return;

        const wasCombat = ts.inCombat;
        ts.inCombat = combatActive;
        tsDiagnostics.lastCombatActive = combatActive;

        if (combatActive && !wasCombat) {
            ts.combatRestoreState = {
                autoDisablePortraits: ts.autoDisablePortraits,
                autoDisableLetterbox: ts.autoDisableLetterbox,
                enabled: ts.enabled
            };

            if (ts.combatAutoAction) {
                applyPreset(ts.combatAutoProfile);
            } else {
                ts.enabled = false;
            }

            if (window.console && console.log) {
                const action = ts.combatAutoAction ? 'profile (' + ts.combatAutoProfile + ')' : 'disable';
                console.log('[Tilt Shift] Combat detected, applying auto behavior: ' + action);
            }
        } else if (!combatActive && wasCombat) {
            if (ts.combatRestoreState) {
                Object.assign(ts, ts.combatRestoreState);
                ts.combatRestoreState = null;
                sanitizeSettings();
                markDirty();
                if (window.console && console.log) console.log('[Tilt Shift] Combat ended, restoring blur state');
            }
        }
    }

    // --- Custom presets ---

    function buildAutoPresetName(slotIndex) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const strength = Math.round(ts.strength);
        const scale = Math.round(ts.scale * 100);
        return 'S' + (slotIndex + 1) + ' ' + hh + ':' + mm + ' B' + strength + ' R' + scale;
    }

    function saveCustomPreset(slotIndex, presetName) {
        if (slotIndex < 0 || slotIndex >= 5) return;

        const presetData = {
            name: presetName || buildAutoPresetName(slotIndex),
            enabled: ts.enabled,
            autoDisablePortraits: ts.autoDisablePortraits,
            autoDisableLetterbox: ts.autoDisableLetterbox,
            smoothAutoFade: ts.smoothAutoFade,
            autoFadeSpeed: ts.autoFadeSpeed,
            opacity: ts.opacity,
            strength: ts.strength,
            passes: ts.passes,
            spread: ts.spread,
            affectSides: ts.affectSides,
            sideSpread: ts.sideSpread,
            edgeClamp: ts.edgeClamp,
            scale: ts.scale,
            updateEvery: ts.updateEvery,
            disableInMenus: ts.disableInMenus,
            adaptiveQualityEnabled: ts.adaptiveQualityEnabled,
            adaptiveFpsTarget: ts.adaptiveFpsTarget,
            adaptiveFpsBuffer: ts.adaptiveFpsBuffer,
            adaptiveScaleCooldown: ts.adaptiveScaleCooldown,
            autoDisableCombat: ts.autoDisableCombat,
            combatAutoAction: ts.combatAutoAction,
            combatAutoProfile: ts.combatAutoProfile
        };

        ts.customPresetSlots[slotIndex] = presetData;
        saveSettings();

        if (window.console && console.log) console.log('[Tilt Shift] Custom preset ' + (slotIndex + 1) + ' saved: ' + presetData.name);
    }

    function loadCustomPreset(slotIndex) {
        if (slotIndex < 0 || slotIndex >= 5 || !ts.customPresetSlots[slotIndex]) return;

        const preset = ts.customPresetSlots[slotIndex];
        Object.assign(ts, preset);
        sanitizeSettings();
        markDirty();
        saveSettings();

        if (window.console && console.log) console.log('[Tilt Shift] Custom preset ' + (slotIndex + 1) + ' loaded: ' + preset.name);
    }

    function clearCustomPreset(slotIndex) {
        if (slotIndex < 0 || slotIndex >= 5) return;
        ts.customPresetSlots[slotIndex] = null;
        saveSettings();

        if (window.console && console.log) console.log('[Tilt Shift] Custom preset ' + (slotIndex + 1) + ' cleared');
    }

    // --- Hotkeys ---

    function beginHotkeyCapture(mode) {
        if (mode !== 'toggle' && mode !== 'cycle') return;
        ts.hotkeyCaptureMode = mode;
        if (window.console && console.log) console.log('[Tilt Shift] Press a key to bind ' + mode + ' hotkey (Esc to cancel).');
    }

    function applyCapturedHotkey(mode, key) {
        if (mode === 'toggle') {
            ts.hotkeyToggleKey = key;
            if (ts.hotkeyPresetCycleKey === key) ts.hotkeyPresetCycleKey = 'P';
        } else {
            ts.hotkeyPresetCycleKey = key;
            if (ts.hotkeyToggleKey === key) ts.hotkeyToggleKey = 'T';
        }
        sanitizeSettings();
        saveSettings();
    }

    function handleHotkeys(keyEvent) {
        if (!keyEvent) return;

        const key = keyEvent.key ? keyEvent.key.toUpperCase() : '';
        const now = Date.now();

        if (ts.hotkeyCaptureMode) {
            if (key === 'ESCAPE') {
                ts.hotkeyCaptureMode = null;
                if (window.console && console.log) console.log('[Tilt Shift] Hotkey capture cancelled.');
                return;
            }

            if (/^[A-Z0-9]$/.test(key)) {
                const mode = ts.hotkeyCaptureMode;
                applyCapturedHotkey(mode, key);
                ts.hotkeyCaptureMode = null;
                if (window.console && console.log) console.log('[Tilt Shift] Bound ' + mode + ' hotkey to ' + key + '.');
            }
            return;
        }

        if (!ts.hotkeyEnabled) return;
        if (isInMenu()) return;

        if (key === ts.hotkeyToggleKey && now - ts.lastHotkeyToggleTime > 200) {
            ts.enabled = !ts.enabled;
            saveSettings();
            ts.lastHotkeyToggleTime = now;
            if (window.console && console.log) console.log('[Tilt Shift] Blur ' + (ts.enabled ? 'enabled' : 'disabled') + ' via hotkey');
        }

        if (key === ts.hotkeyPresetCycleKey && now - ts.lastHotkeyCycleTime > 200) {
            const availableIndices = [];
            for (let i = 0; i < 5; i++) {
                if (ts.customPresetSlots[i]) availableIndices.push(i);
            }

            if (availableIndices.length > 0) {
                let nextIndex = availableIndices.indexOf(ts.currentCustomPresetIndex) + 1;
                if (nextIndex >= availableIndices.length) nextIndex = 0;
                ts.currentCustomPresetIndex = availableIndices[nextIndex];
                loadCustomPreset(ts.currentCustomPresetIndex);
                ts.lastHotkeyCycleTime = now;
            }
        }
    }

    // ===========================================================================
    // The render pipeline (engine-hook based — no ig.Game.prototype.draw hijack)
    // ===========================================================================

    /** Should the world render be redirected to the blur buffer this frame? */
    function shouldRunEffect() {
        if (!ts.enabled || ts.failsafeActive) return false;
        if (!ig.system || !ig.system.context) return false;
        if (ts.disableInMenus && isInMenu()) return false;
        if (ts.fadeTarget === 0 && ts.effectiveAlpha <= 0.001) return false;
        return true;
    }

    /** Ensure the downscaled work canvases exist at the given size. */
    function ensureWorkCanvases(sw, sh) {
        if (ts.canvas.width === sw && ts.canvas.height === sh) return;
        ts.canvas.width = sw;
        ts.canvas.height = sh;
        ts.scratch.width = sw;
        ts.scratch.height = sh;
        ts.mask.width = sw;
        ts.mask.height = sh;
        ts.ctx = ts.canvas.getContext('2d');
        ts.scratchCtx = ts.scratch.getContext('2d');
        ts.maskCtx = ts.mask.getContext('2d');
        ts.outputCanvas = null;
        ts.dirty = true;
    }

    /** Rebuild the top/bottom (and optional side) blur mask gradient. */
    function rebuildMask(sw, sh) {
        if (!ts.dirty && ts.lastW === sw && ts.lastH === sh && ts.lastSpread === ts.spread && ts.lastAffectSides === ts.affectSides) return;

        const mCtx = ts.maskCtx;
        mCtx.clearRect(0, 0, sw, sh);

        const vSpread = clamp(ts.spread, 0.05, 0.45);
        const hSpread = clamp(ts.sideSpread, 0.05, 0.45);
        const edgeClampPxY = Math.floor(sh * ts.edgeClamp);
        const edgeClampPxX = Math.floor(sw * ts.edgeClamp);

        const verticalGrad = mCtx.createLinearGradient(0, 0, 0, sh);
        verticalGrad.addColorStop(0, 'white');
        verticalGrad.addColorStop(vSpread, 'transparent');
        verticalGrad.addColorStop(1 - vSpread, 'transparent');
        verticalGrad.addColorStop(1, 'white');
        mCtx.fillStyle = verticalGrad;
        mCtx.fillRect(0, 0, sw, sh);

        if (edgeClampPxY > 0) {
            mCtx.fillStyle = 'white';
            mCtx.fillRect(0, 0, sw, edgeClampPxY);
            mCtx.fillRect(0, sh - edgeClampPxY, sw, edgeClampPxY);
        }

        if (ts.affectSides) {
            const horizontalGrad = mCtx.createLinearGradient(0, 0, sw, 0);
            horizontalGrad.addColorStop(0, 'white');
            horizontalGrad.addColorStop(hSpread, 'transparent');
            horizontalGrad.addColorStop(1 - hSpread, 'transparent');
            horizontalGrad.addColorStop(1, 'white');
            mCtx.fillStyle = horizontalGrad;
            mCtx.fillRect(0, 0, sw, sh);

            if (edgeClampPxX > 0) {
                mCtx.fillStyle = 'white';
                mCtx.fillRect(0, 0, edgeClampPxX, sh);
                mCtx.fillRect(sw - edgeClampPxX, 0, edgeClampPxX, sh);
            }
        }

        ts.lastW = sw;
        ts.lastH = sh;
        ts.lastSpread = ts.spread;
        ts.lastAffectSides = ts.affectSides;
        ts.dirty = false;
    }

    /** Composite the (already redirected) world frame back with the tilt-shift blur. */
    function compositeBlur() {
        const ctx = ig.system.context;
        if (!ctx) return;

        const sourceCanvas = ig.tiltShiftAddon.buffer;
        const w = ig.system.realWidth;
        const h = ig.system.realHeight;

        if (ts.fadeTarget === 0 && ts.effectiveAlpha <= 0.001) return;

        const scale = clamp(ts.scale, 0.2, 1);
        const sw = Math.max(1, Math.floor(w * scale));
        const sh = Math.max(1, Math.floor(h * scale));

        ensureWorkCanvases(sw, sh);
        rebuildMask(sw, sh);

        ts.frameCounter++;
        const updateEvery = clamp(ts.updateEvery | 0, 1, 4);
        if (ts.frameCounter % updateEvery === 0 || !ts.outputCanvas) {
            const passes = clamp(ts.passes | 0, 1, 4);
            const blurPx = Math.max(0, ts.strength) * scale;
            let readSource = sourceCanvas;

            for (let i = 0; i < passes; i++) {
                const useMain = i % 2 === 0;
                const targetCanvas = useMain ? ts.canvas : ts.scratch;
                const targetCtx = useMain ? ts.ctx : ts.scratchCtx;

                targetCtx.clearRect(0, 0, sw, sh);
                targetCtx.filter = 'blur(' + blurPx + 'px)';
                if (readSource === sourceCanvas) {
                    targetCtx.drawImage(readSource, 0, 0, sw, sh);
                } else {
                    targetCtx.drawImage(readSource, 0, 0);
                }
                targetCtx.filter = 'none';
                readSource = targetCanvas;
            }

            const finalIsMain = (passes - 1) % 2 === 0;
            const finalCanvas = finalIsMain ? ts.canvas : ts.scratch;
            const finalCtx = finalIsMain ? ts.ctx : ts.scratchCtx;

            finalCtx.globalCompositeOperation = 'destination-in';
            finalCtx.drawImage(ts.mask, 0, 0);
            finalCtx.globalCompositeOperation = 'source-over';
            ts.outputCanvas = finalCanvas;
        }

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // The world renders into our private buffer (preDraw redirect), so the
        // screen canvas underneath the composite is stale/uncleared. Paint the
        // sharp frame first, then the blurred + masked output on top: the mask's
        // transparent center then reveals the CURRENT sharp world (not the
        // previous frame), while the opaque edges show the blur.
        ctx.drawImage(sourceCanvas, 0, 0, w, h);
        ctx.globalAlpha = ts.effectiveAlpha;
        ctx.drawImage(ts.outputCanvas || ts.canvas, 0, 0, w, h);
        ctx.restore();
    }

    /**
     * The blur addon.
     *
     * preDrawOrder 999: redirect the world render into our private buffer
     *   (runs BEFORE ig.screenBlur's 1000, so we wrap everything).
     * postDrawOrder 250: composite the buffer back with the blur+mask
     *   (after ig.screenBlur's 200, before ig.gui's 500 — the HUD therefore
     *   draws sharp, natively on top).
     */
    /**
     * Define the addon classes. This must NOT run at script top level:
     * ccloader executes postload scripts before the game's module queue is
     * flushed (ig._DOMReady), so module-defined classes like `ig.GameAddon`
     * are not available yet — referencing them at load time kills the whole
     * mod. boot() calls this once the engine is ready.
     */
    function defineTiltShiftClasses() {
        if (ig.TiltShiftAddon && ig.TiltShiftDiagnosticsAddon) return;

    ig.TiltShiftAddon = ig.GameAddon.extend({
        buffer: null,
        bufferCtx: null,
        systemContext: null,
        systemCanvas: null,
        active: false,
        registered: false,
        preDrawOrder: 999,
        postDrawOrder: 250,

        init: function () {
            this.parent('TiltShift');
            this._ensureBuffer();
        },

        _ensureBuffer: function () {
            if (!ig.system) return;
            const realW = ig.system.realWidth;
            const realH = ig.system.realHeight;
            if (this.buffer && this.buffer.width === realW && this.buffer.height === realH) return;
            this.buffer = ig.$new('canvas');
            this.buffer.width = realW;
            this.buffer.height = realH;
            this.bufferCtx = ig.system.getBufferContext(this.buffer);
            this.bufferCtx.scale(ig.system.contextScale, ig.system.contextScale);
        },

        /** Runs every update tick — performance automation + the auto-fade state. */
        onPostUpdate: function () {
            if (!sc || !sc.model) return;

            updateFpsMonitor(ig.system.tick > 0 ? ig.system.tick : 1 / 60);
            applyPerformanceFailsafe();
            applyAdaptiveQualityScaling();
            handleCombatAutoBehavior(isCombatActive());

            const autoTriggered =
                (ts.autoDisablePortraits && isPortraitDialogueActive()) ||
                (ts.autoDisableLetterbox && isLetterboxActive());
            tsDiagnostics.lastAutoTriggered = autoTriggered;
            updateDiagnostics();

            const fadeTarget = autoTriggered ? 0 : 1;
            if (!ts.smoothAutoFade) {
                ts.autoFadeAlpha = fadeTarget;
            } else {
                ts.autoFadeAlpha += (fadeTarget - ts.autoFadeAlpha) * ts.autoFadeSpeed;
                if (Math.abs(fadeTarget - ts.autoFadeAlpha) < 0.005) ts.autoFadeAlpha = fadeTarget;
            }
            ts.fadeTarget = fadeTarget;
            ts.effectiveAlpha = ts.opacity * ts.autoFadeAlpha;
            tsDiagnostics.lastEffectiveAlpha = ts.effectiveAlpha;
        },

        /** Redirect the world render into our buffer. */
        onPreDraw: function () {
            this._ensureBuffer();
            this.active = shouldRunEffect();
            if (!this.active) return;
            this.systemContext = ig.system.context;
            this.systemCanvas = ig.system.canvas;
            ig.system.context = this.bufferCtx;
        },

        /** Restore the real context and composite the blurred world. */
        onPostDraw: function () {
            if (this.systemContext) {
                ig.system.context = this.systemContext;
                ig.system.canvas = this.systemCanvas;
            }
            if (!this.active) return;
            compositeBlur();
        },

        onReset: function () {
            this.systemContext = null;
            this.active = false;
        }
    });

    /** Diagnostics overlay: drawn after ig.gui (postDrawOrder 500), like the old mod. */
    ig.TiltShiftDiagnosticsAddon = ig.GameAddon.extend({
        postDrawOrder: 501,

        onPostDraw: function () {
            if (!ig.system || !ig.system.context) return;
            drawDiagnosticsOverlay(ig.system.context, isInMenu());
        }
    });
    }

    /**
     * Register both addons. ig.addGameAddon covers the normal boot path
     * (ccloader postload runs before the game initializes); if the game is
     * already live, also wire the addons into its sorted arrays.
     */
    function registerTiltShiftAddons() {
        if (ig.tiltShiftAddon && ig.tiltShiftAddon.registered) return;

        if (!ig.tiltShiftAddon) ig.tiltShiftAddon = new ig.TiltShiftAddon();
        if (!ig.tiltShiftDiagAddon) ig.tiltShiftDiagAddon = new ig.TiltShiftDiagnosticsAddon();

        ig.addGameAddon(function () {
            return ig.tiltShiftAddon;
        });
        ig.addGameAddon(function () {
            return ig.tiltShiftDiagAddon;
        });

        const game = ig.game;
        if (game && game.addons && game.addons.all) {
            const byPre = function (a, b) { return a.preDrawOrder - b.preDrawOrder; };
            const byPost = function (a, b) { return a.postDrawOrder - b.postDrawOrder; };
            const byUpd = function (a, b) { return a.postUpdateOrder - b.postUpdateOrder; };
            const byRst = function (a, b) { return a.resetOrder - b.resetOrder; };

            game.addons.all.push(ig.tiltShiftAddon, ig.tiltShiftDiagAddon);
            game.addons.postUpdate.push(ig.tiltShiftAddon);
            game.addons.postUpdate.sort(byUpd);
            game.addons.preDraw.push(ig.tiltShiftAddon);
            game.addons.preDraw.sort(byPre);
            game.addons.postDraw.push(ig.tiltShiftAddon, ig.tiltShiftDiagAddon);
            game.addons.postDraw.sort(byPost);
            game.addons.reset.push(ig.tiltShiftAddon);
            game.addons.reset.sort(byRst);
        }

        ig.tiltShiftAddon.registered = true;
        if (window.console && console.log) {
            console.log('[Tilt Shift] ' + getModReleaseLabel() + ' - addons registered (preDraw 999 / postDraw 250, GUI at 500 stays sharp).');
        }
    }

    // ===========================================================================
    // In-game settings menu (unchanged architecture; obsolete HUD rows removed)
    // ===========================================================================

    function hijackMenu() {
        if (!window.ig || !window.sc || !sc.BaseMenu || !ig.gui) {
            setTimeout(hijackMenu, 100);
            return;
        }

        if (window.__tiltShiftMenuPatched) return;

        const BaseMenu = sc.BaseMenu;
        const SectionLabel = sc.SectionLabel;
        const Label = sc.Label;
        const NumberSlider = sc.NumberSlider;
        const ButtonGroup = sc.ButtonGroup;

        sc.TiltShiftMenu = BaseMenu.extend({
            title: 'Tilt Shift',
            subMenu: true,
            scrollSpeed: 0.2,
            mouseScrollAmount: 24,
            sectionAnchors: {},
            rows: null,
            labels: {},
            controls: {},
            contents: null,
            list: null,
            buttonGroup: null,

            init() {
                this.parent();
                this.contents = new ig.GuiElementBase();
                this.list = new sc.ListBox();
                this.buttonGroup = new ButtonGroup();

                const rows = [
                    { key: 'secGeneral', type: 'SECTION', label: 'General' },
                    { key: 'enabled', type: 'CHECKBOX', label: 'Enabled' },
                    { key: 'menuSectionJump', type: 'BUTTON', label: 'Section Jump', text: 'Jump', get: () => 'Jump: ' + getMenuSectionLabel(ts.menuSectionFocus), action: () => { const nextFocus = cycleMenuSectionFocus(); this.scrollToSection(nextFocus); this.syncControlsFromSettings(); } },
                    { key: 'autoDisablePortraits', type: 'CHECKBOX', label: 'Auto Fade: Dialogue Faces' },
                    { key: 'autoDisableLetterbox', type: 'CHECKBOX', label: 'Auto Fade: Letterbox Bars' },
                    { key: 'smoothAutoFade', type: 'CHECKBOX', label: 'Smooth Auto Fade' },
                    { key: 'autoFadeSpeed', type: 'SLIDER', label: 'Auto Fade Speed %', min: 5, max: 60, requires: ['smoothAutoFade'], get: () => Math.round(ts.autoFadeSpeed * 100), set: (v) => setSetting('autoFadeSpeed', v / 100) },
                    { key: 'secPresets', type: 'SECTION', label: 'Presets' },
                    { key: 'presetPerformance', type: 'BUTTON', label: 'Preset: Performance', text: 'Apply', action: () => this.applyPresetAndRefresh('performance') },
                    { key: 'presetBalanced', type: 'BUTTON', label: 'Preset: Balanced', text: 'Apply', action: () => this.applyPresetAndRefresh('balanced') },
                    { key: 'presetCinematic', type: 'BUTTON', label: 'Preset: Cinematic', text: 'Apply', action: () => this.applyPresetAndRefresh('cinematic') },
                    { key: 'secBlur', type: 'SECTION', label: 'Blur' },
                    { key: 'opacity', type: 'SLIDER', label: 'Opacity %', min: 10, max: 100, get: () => Math.round(ts.opacity * 100), set: (v) => setSetting('opacity', v / 100) },
                    { key: 'strength', type: 'SLIDER', label: 'Strength', min: 0, max: 20, get: () => Math.round(ts.strength), set: (v) => setSetting('strength', v) },
                    { key: 'passes', type: 'SLIDER', label: 'Passes', min: 1, max: 4, get: () => ts.passes, set: (v) => setSetting('passes', v) },
                    { key: 'secMask', type: 'SECTION', label: 'Mask / Edges' },
                    { key: 'spread', type: 'SLIDER', label: 'Top/Bottom Spread %', min: 5, max: 45, get: () => Math.round(ts.spread * 100), set: (v) => setSetting('spread', v / 100) },
                    { key: 'affectSides', type: 'CHECKBOX', label: 'Affect Sides' },
                    { key: 'sideSpread', type: 'SLIDER', label: 'Side Spread %', min: 5, max: 45, requires: ['affectSides'], get: () => Math.round(ts.sideSpread * 100), set: (v) => setSetting('sideSpread', v / 100) },
                    { key: 'edgeClamp', type: 'SLIDER', label: 'Edge Clamp %', min: 0, max: 20, get: () => Math.round(ts.edgeClamp * 100), set: (v) => setSetting('edgeClamp', v / 100) },
                    { key: 'secPerf', type: 'SECTION', label: 'Performance' },
                    { key: 'scale', type: 'SLIDER', label: 'Render Scale %', min: 20, max: 100, get: () => Math.round(ts.scale * 100), set: (v) => setSetting('scale', v / 100) },
                    { key: 'updateEvery', type: 'SLIDER', label: 'Update Every N Frames', min: 1, max: 4, get: () => ts.updateEvery, set: (v) => setSetting('updateEvery', v) },
                    { key: 'disableInMenus', type: 'CHECKBOX', label: 'Disable In Menus' },
                    { key: 'secAutoPerf', type: 'SECTION', label: 'Performance Automation' },
                    { key: 'adaptiveQualityEnabled', type: 'CHECKBOX', label: 'Adaptive Quality Scaling' },
                    { key: 'adaptiveFpsTarget', type: 'SLIDER', label: 'Target FPS', min: 30, max: 120, requires: ['adaptiveQualityEnabled'], get: () => ts.adaptiveFpsTarget, set: (v) => setSetting('adaptiveFpsTarget', v) },
                    { key: 'adaptiveFpsBuffer', type: 'SLIDER', label: 'FPS Buffer (±)', min: 3, max: 30, requires: ['adaptiveQualityEnabled'], get: () => ts.adaptiveFpsBuffer, set: (v) => setSetting('adaptiveFpsBuffer', v) },
                    { key: 'adaptiveScaleCooldown', type: 'SLIDER', label: 'Scale Cooldown (ms)', min: 200, max: 5000, step: 100, requires: ['adaptiveQualityEnabled'], get: () => Math.round(ts.adaptiveScaleCooldown / 100) * 100, set: (v) => setSetting('adaptiveScaleCooldown', v) },
                    { key: 'fpsSmoothing', type: 'SLIDER', label: 'FPS Smoothing %', min: 1, max: 100, get: () => Math.round(ts.fpsSmoothing * 100), set: (v) => setSetting('fpsSmoothing', v / 100) },
                    { key: 'failsafeEnabled', type: 'CHECKBOX', label: 'FPS Failsafe (Bypass Blur)' },
                    { key: 'failsafeTriggerFps', type: 'SLIDER', label: 'Failsafe Trigger FPS', min: 10, max: 50, requires: ['failsafeEnabled'], get: () => Math.round(ts.failsafeTriggerFps), set: (v) => setSetting('failsafeTriggerFps', v) },
                    { key: 'failsafeGraceFrames', type: 'SLIDER', label: 'Failsafe Grace Frames', min: 10, max: 240, requires: ['failsafeEnabled'], get: () => ts.failsafeGraceFrames, set: (v) => setSetting('failsafeGraceFrames', v) },
                    { key: 'failsafeRecoverFps', type: 'SLIDER', label: 'Failsafe Recover FPS', min: 15, max: 80, requires: ['failsafeEnabled'], get: () => Math.round(ts.failsafeRecoverFps), set: (v) => setSetting('failsafeRecoverFps', v) },
                    { key: 'failsafeRecoverFrames', type: 'SLIDER', label: 'Failsafe Recover Frames', min: 10, max: 360, requires: ['failsafeEnabled'], get: () => ts.failsafeRecoverFrames, set: (v) => setSetting('failsafeRecoverFrames', v) },
                    { key: 'autoDisableCombat', type: 'CHECKBOX', label: 'Combat Auto-Disable' },
                    { key: 'combatAutoAction', type: 'CHECKBOX', label: 'Use Profile on Combat (else Disable)', requires: ['autoDisableCombat'] },
                    { key: 'secCustom', type: 'SECTION', label: 'Custom Presets' },
                    { key: 'customSlot1Save', type: 'BUTTON', label: 'Slot 1: ' + (ts.customPresetSlots[0] ? ts.customPresetSlots[0].name : 'Empty'), text: 'Save', action: () => { saveCustomPreset(0); this.syncControlsFromSettings(); } },
                    { key: 'customSlot1Load', type: 'BUTTON', label: '', text: 'Load', action: () => { loadCustomPreset(0); this.syncControlsFromSettings(); }, requires: () => !!ts.customPresetSlots[0] },
                    { key: 'customSlot1Clear', type: 'BUTTON', label: '', text: 'Clear', action: () => { clearCustomPreset(0); this.syncControlsFromSettings(); }, requires: () => !!ts.customPresetSlots[0] },
                    { key: 'customSlot2Save', type: 'BUTTON', label: 'Slot 2: ' + (ts.customPresetSlots[1] ? ts.customPresetSlots[1].name : 'Empty'), text: 'Save', action: () => { saveCustomPreset(1); this.syncControlsFromSettings(); } },
                    { key: 'customSlot2Load', type: 'BUTTON', label: '', text: 'Load', action: () => { loadCustomPreset(1); this.syncControlsFromSettings(); }, requires: () => !!ts.customPresetSlots[1] },
                    { key: 'customSlot2Clear', type: 'BUTTON', label: '', text: 'Clear', action: () => { clearCustomPreset(1); this.syncControlsFromSettings(); }, requires: () => !!ts.customPresetSlots[1] },
                    { key: 'customSlot3Save', type: 'BUTTON', label: 'Slot 3: ' + (ts.customPresetSlots[2] ? ts.customPresetSlots[2].name : 'Empty'), text: 'Save', action: () => { saveCustomPreset(2); this.syncControlsFromSettings(); } },
                    { key: 'customSlot3Load', type: 'BUTTON', label: '', text: 'Load', action: () => { loadCustomPreset(2); this.syncControlsFromSettings(); }, requires: () => !!ts.customPresetSlots[2] },
                    { key: 'customSlot3Clear', type: 'BUTTON', label: '', text: 'Clear', action: () => { clearCustomPreset(2); this.syncControlsFromSettings(); }, requires: () => !!ts.customPresetSlots[2] },
                    { key: 'customSlot4Save', type: 'BUTTON', label: 'Slot 4: ' + (ts.customPresetSlots[3] ? ts.customPresetSlots[3].name : 'Empty'), text: 'Save', action: () => { saveCustomPreset(3); this.syncControlsFromSettings(); } },
                    { key: 'customSlot4Load', type: 'BUTTON', label: '', text: 'Load', action: () => { loadCustomPreset(3); this.syncControlsFromSettings(); }, requires: () => !!ts.customPresetSlots[3] },
                    { key: 'customSlot4Clear', type: 'BUTTON', label: '', text: 'Clear', action: () => { clearCustomPreset(3); this.syncControlsFromSettings(); }, requires: () => !!ts.customPresetSlots[3] },
                    { key: 'customSlot5Save', type: 'BUTTON', label: 'Slot 5: ' + (ts.customPresetSlots[4] ? ts.customPresetSlots[4].name : 'Empty'), text: 'Save', action: () => { saveCustomPreset(4); this.syncControlsFromSettings(); } },
                    { key: 'customSlot5Load', type: 'BUTTON', label: '', text: 'Load', action: () => { loadCustomPreset(4); this.syncControlsFromSettings(); }, requires: () => !!ts.customPresetSlots[4] },
                    { key: 'customSlot5Clear', type: 'BUTTON', label: '', text: 'Clear', action: () => { clearCustomPreset(4); this.syncControlsFromSettings(); }, requires: () => !!ts.customPresetSlots[4] },
                    { key: 'secHotkey', type: 'SECTION', label: 'Hotkeys' },
                    { key: 'hotkeyEnabled', type: 'CHECKBOX', label: 'Enable Hotkeys' },
                    { key: 'hotkeyToggleKey', type: 'CUSTOM', label: 'Toggle Key', get: () => ts.hotkeyCaptureMode === 'toggle' ? '[PRESS KEY]' : ts.hotkeyToggleKey },
                    { key: 'hotkeyPresetCycleKey', type: 'CUSTOM', label: 'Preset Cycle Key', get: () => ts.hotkeyCaptureMode === 'cycle' ? '[PRESS KEY]' : ts.hotkeyPresetCycleKey },
                    { key: 'bindToggleKey', type: 'BUTTON', label: 'Bind Toggle Key', text: 'Bind', action: () => { beginHotkeyCapture('toggle'); this.syncControlsFromSettings(); } },
                    { key: 'bindCycleKey', type: 'BUTTON', label: 'Bind Cycle Key', text: 'Bind', action: () => { beginHotkeyCapture('cycle'); this.syncControlsFromSettings(); } },
                    { key: 'resetHotkeys', type: 'BUTTON', label: 'Reset Hotkeys', text: 'Reset', action: () => { ts.hotkeyCaptureMode = null; setSetting('hotkeyToggleKey', 'T'); setSetting('hotkeyPresetCycleKey', 'P'); this.syncControlsFromSettings(); } },
                    { key: 'hotkeyCaptureStatus', type: 'CUSTOM', label: 'Bind Status', get: () => ts.hotkeyCaptureMode ? ('waiting for ' + ts.hotkeyCaptureMode + ' key...') : 'idle' },
                    { key: 'secDiag', type: 'SECTION', label: 'Diagnostics' },
                    { key: 'diagnosticsEnabled', type: 'CHECKBOX', label: 'Enable Diagnostics Panel' },
                    { key: 'diagnosticsOverlayEnabled', type: 'CHECKBOX', label: 'Show In-game Overlay', requires: ['diagnosticsEnabled'] },
                    { key: 'diagnosticsOverlayCompact', type: 'CHECKBOX', label: 'Compact Overlay', requires: ['diagnosticsEnabled', 'diagnosticsOverlayEnabled'] },
                    { key: 'diagnosticsOverlayOpacity', type: 'SLIDER', label: 'Overlay Opacity %', min: 15, max: 100, requires: ['diagnosticsEnabled', 'diagnosticsOverlayEnabled'], get: () => Math.round(ts.diagnosticsOverlayOpacity * 100), set: (v) => setSetting('diagnosticsOverlayOpacity', v / 100) },
                    { key: 'diagnosticsOverlayX', type: 'SLIDER', label: 'Overlay X', min: 0, max: 200, requires: ['diagnosticsEnabled', 'diagnosticsOverlayEnabled'], get: () => ts.diagnosticsOverlayX, set: (v) => setSetting('diagnosticsOverlayX', v) },
                    { key: 'diagnosticsOverlayY', type: 'SLIDER', label: 'Overlay Y', min: 0, max: 200, requires: ['diagnosticsEnabled', 'diagnosticsOverlayEnabled'], get: () => ts.diagnosticsOverlayY, set: (v) => setSetting('diagnosticsOverlayY', v) },
                    { key: 'diagFps', type: 'CUSTOM', label: 'FPS', requires: ['diagnosticsEnabled'], get: () => String(Math.round(ts.currentFps)) },
                    { key: 'diagFpsRaw', type: 'CUSTOM', label: 'Raw FPS', requires: ['diagnosticsEnabled'], get: () => String(Math.round(ts.currentFpsRaw)) },
                    { key: 'diagAuto', type: 'CUSTOM', label: 'Auto Fade Trigger', requires: ['diagnosticsEnabled'], get: () => tsDiagnostics.lastAutoTriggered ? (tsDiagnostics.lastTriggerReasons.join('+') || 'active') : 'none' },
                    { key: 'diagAdaptive', type: 'CUSTOM', label: 'Adaptive State', requires: ['diagnosticsEnabled'], get: () => tsDiagnostics.adaptiveState },
                    { key: 'diagFailsafe', type: 'CUSTOM', label: 'Failsafe State', requires: ['diagnosticsEnabled'], get: () => tsDiagnostics.failsafeState },
                    { key: 'diagCombat', type: 'CUSTOM', label: 'Combat Active', requires: ['diagnosticsEnabled'], get: () => tsDiagnostics.lastCombatActive ? 'yes' : 'no' },
                    { key: 'diagAlpha', type: 'CUSTOM', label: 'Effective Alpha %', requires: ['diagnosticsEnabled'], get: () => String(Math.round(tsDiagnostics.lastEffectiveAlpha * 100)) },
                    { key: 'diagBuild', type: 'CUSTOM', label: 'Mod Build', requires: ['diagnosticsEnabled'], get: () => getModReleaseLabel() },
                    { key: 'diagSanity', type: 'CUSTOM', label: 'Sanity Status', requires: ['diagnosticsEnabled'], get: () => tsDiagnostics.sanityStatus },
                    { key: 'diagSelfTest', type: 'CUSTOM', label: 'Runtime Self-Test', requires: ['diagnosticsEnabled'], get: () => tsDiagnostics.selfTestStatus },
                    { key: 'diagReleaseReadiness', type: 'CUSTOM', label: 'Release Readiness', requires: ['diagnosticsEnabled'], get: () => tsDiagnostics.releaseReadinessStatus },
                    { key: 'runSanity', type: 'BUTTON', label: 'Sanity Check', text: 'Run', action: () => { runSanityCheck(); this.syncControlsFromSettings(); } },
                    { key: 'runSelfTest', type: 'BUTTON', label: 'Runtime Self-Test', text: 'Run', action: () => { runRuntimeSelfTest(); this.syncControlsFromSettings(); } },
                    { key: 'runReleaseReadiness', type: 'BUTTON', label: 'Release Readiness', text: 'Run', action: () => { runReleaseReadinessCheck(); this.syncControlsFromSettings(); } },
                    { key: 'runRepairHooks', type: 'BUTTON', label: 'Repair Hooks', text: 'Repair', action: () => { runHookRepair(); this.syncControlsFromSettings(); } },
                    { key: 'exportSettings', type: 'BUTTON', label: 'Export Settings', text: 'Export', action: () => { exportSettingsPayload(); this.syncControlsFromSettings(); } },
                    { key: 'importSettings', type: 'BUTTON', label: 'Import Settings', text: 'Import', action: () => { importSettingsPayload(); this.syncControlsFromSettings(); } },
                    { key: 'resetSettings', type: 'BUTTON', label: 'Reset All Settings', text: 'Reset', action: () => { resetAllSettings(); this.syncControlsFromSettings(); } },
                    { key: 'settingsActionStatus', type: 'CUSTOM', label: 'Last Action', get: () => getMenuActionStatusText() }
                ];
                this.rows = rows;

                let yPos = 0;
                let focusRow = 0;

                rows.forEach((row) => {
                    if (row.type === 'SECTION') {
                        this.sectionAnchors[row.key] = yPos;
                        yPos += 8;
                        const section = new SectionLabel(row.label);
                        section.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                        section.setPos(18, yPos);
                        this.contents.addChildGui(section);
                        yPos += 24;
                        return;
                    }

                    const label = new Label(row.label);
                    label.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                    label.setPos(18, yPos);
                    this.contents.addChildGui(label);
                    this.labels[row.key] = label;

                    let control;
                    let focusable = true;
                    if (row.type === 'CHECKBOX') {
                        control = new sc.CheckboxGui(!!ts[row.key], 30);
                        control.data = { key: row.key };
                    } else if (row.type === 'BUTTON') {
                        control = new sc.ButtonGui(typeof row.get === 'function' ? row.get() : (row.text || 'Apply'), 180);
                        control.onButtonPress = row.action;
                    } else if (row.type === 'CUSTOM') {
                        const customValue = typeof row.get === 'function' ? row.get() : (row.value || '');
                        control = new sc.TextGui(customValue, { speed: ig.TextBlock.SPEED.IMMEDIATE });
                        control.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                        focusable = false;
                    } else {
                        control = new NumberSlider((newValue) => {
                            row.set(newValue);
                        }, row.get(), row.min, row.max, this.buttonGroup);
                        control.setSize(200, 21, 9);
                    }

                    control.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                    control.setPos(320, yPos);
                    this.contents.addChildGui(control);
                    if (focusable) {
                        this.buttonGroup.addFocusGui(control, 0, focusRow);
                        focusRow++;
                    }
                    this.controls[row.key] = control;
                    yPos += 29;
                });

                const children = this.contents.hook.children;
                const last = children[children.length - 1];
                this.contents.hook.size.x = 540;
                this.contents.hook.size.y = last.pos.y + last.size.y + 16;
                this.list.setContent(this.contents);
                this.list.box.doScrollTransition(0, 0, 0);
                this.addChildGui(this.list);
                this.doStateTransition('DEFAULT');

                this.buttonGroup.addPressCallback((control) => {
                    if (control instanceof sc.CheckboxGui && control.data && control.data.key) {
                        setSetting(control.data.key, !!control.pressed);
                        this.updateDependentControls(control.data.key);
                    }
                });

                this.updateAllControlStates();
            },
            addObservers() {
                sc.Model.addObserver(sc.menu, this);
            },
            applyPresetAndRefresh(presetName) {
                applyPreset(presetName);
                this.syncControlsFromSettings();
                this.updateAllControlStates();
            },
            setRowVisibility(row, visible) {
                const label = this.labels[row.key];
                const control = this.controls[row.key];

                if (label) {
                    if (typeof label.setEnabled === 'function') label.setEnabled(visible);
                    if (label.hook) {
                        label.hook.alpha = visible ? 1 : 0;
                        label.hook.active = visible;
                    }
                }

                if (control) {
                    if (typeof control.setEnabled === 'function') control.setEnabled(visible);
                    if (control.hook) {
                        control.hook.alpha = visible ? 1 : 0;
                        control.hook.active = visible;
                    }
                }
            },
            applyMenuSectionLayout() {
                if (!this.rows || !this.contents) return;

                const focusSection = normalizeMenuSectionFocus(ts.menuSectionFocus);
                const compactMode = focusSection !== 'all';
                let yPos = 0;
                let activeSection = null;
                let lastVisibleBottom = 0;

                this.rows.forEach((row) => {
                    if (row.type === 'SECTION') {
                        activeSection = row.key;
                        const visible = !compactMode || row.key === focusSection;
                        this.setRowVisibility(row, visible);
                        const label = this.labels[row.key];
                        if (visible && label && label.hook) {
                            yPos += 8;
                            label.hook.pos.y = yPos;
                            yPos += 24;
                            lastVisibleBottom = yPos;
                        } else if (label && label.hook) {
                            label.hook.pos.y = -1000;
                        }
                        return;
                    }

                    const isUtility = row.key === 'menuSectionJump';
                    const visible = isUtility || !compactMode || activeSection === focusSection;
                    this.setRowVisibility(row, visible);

                    const label = this.labels[row.key];
                    const control = this.controls[row.key];
                    if (visible) {
                        if (label && label.hook) label.hook.pos.y = yPos;
                        if (control && control.hook) control.hook.pos.y = yPos;
                        yPos += 29;
                        lastVisibleBottom = yPos;
                    } else {
                        if (label && label.hook) label.hook.pos.y = -1000;
                        if (control && control.hook) control.hook.pos.y = -1000;
                    }
                });

                if (this.contents && this.contents.hook) {
                    this.contents.hook.size.y = Math.max(1, lastVisibleBottom + 16);
                }

                if (this.list && this.list.box) {
                    this.list.setContent(this.contents);
                    this.list.box.doScrollTransition(0, 0, 0);
                }
            },
            scrollToSection(sectionKey) {
                if (!this.list) return;
                const targetKey = normalizeMenuSectionFocus(sectionKey);
                if (targetKey === 'all') {
                    this.list.setScrollY(0, 0, this.scrollSpeed);
                    return;
                }
                if (normalizeMenuSectionFocus(ts.menuSectionFocus) !== 'all') {
                    this.list.setScrollY(0, 0, this.scrollSpeed);
                    return;
                }
                const targetY = this.sectionAnchors && typeof this.sectionAnchors[targetKey] === 'number' ? this.sectionAnchors[targetKey] : 0;
                this.list.setScrollY(Math.max(0, targetY - 10), 0, this.scrollSpeed);
            },
            syncControlsFromSettings() {
                if (!this.rows) return;
                this.rows.forEach((row) => {
                    const control = this.controls[row.key];
                    if (!control) return;
                    if (row.type === 'CHECKBOX') {
                        if (typeof control.setPressed === 'function') control.setPressed(!!ts[row.key]);
                        else control.pressed = !!ts[row.key];
                    } else if (row.type === 'SLIDER' && typeof row.get === 'function') {
                        const value = row.get();
                        if (typeof control.setExternalValue === 'function') control.setExternalValue(value);
                        else if (typeof control.setValue === 'function') control.setValue(value);
                    } else if (row.type === 'BUTTON' && typeof row.get === 'function' && typeof control.setText === 'function') {
                        control.setText(row.get());
                    } else if (row.type === 'CUSTOM') {
                        const text = typeof row.get === 'function' ? row.get() : (row.value || '');
                        if (typeof control.setText === 'function') control.setText(String(text));
                    }
                });
                this.updateAllControlStates();
                this.applyMenuSectionLayout();
            },
            evaluateRowEnabled(row) {
                if (!row.requires) return true;
                if (typeof row.requires === 'function') return !!row.requires();
                if (!Array.isArray(row.requires) || !row.requires.length) return true;
                return row.requires.every((req) => {
                    if (typeof req !== 'string') return !!req;
                    const eqPos = req.indexOf('=');
                    if (eqPos !== -1) {
                        const key = req.substring(0, eqPos);
                        const expected = req.substring(eqPos + 1);
                        return String(ts[key]) === expected;
                    }
                    return !!ts[req];
                });
            },
            updateAllControlStates() {
                if (!this.rows) return;
                this.rows.forEach((row) => {
                    const enabled = this.evaluateRowEnabled(row);
                    if (this.labels[row.key] && this.labels[row.key].setEnabled) this.labels[row.key].setEnabled(enabled);
                    if (this.controls[row.key] && this.controls[row.key].setEnabled) this.controls[row.key].setEnabled(enabled);
                });
            },
            updateDependentControls(changedKey) {
                if (!this.rows) return;
                this.rows.forEach((row) => {
                    if (!row.requires) return;
                    if (Array.isArray(row.requires)) {
                        const watchesKey = row.requires.some((req) => typeof req === 'string' && (req === changedKey || req.indexOf(changedKey + '=') === 0));
                        if (!watchesKey) return;
                    }
                    const enabled = this.evaluateRowEnabled(row);
                    if (this.labels[row.key] && this.labels[row.key].setEnabled) this.labels[row.key].setEnabled(enabled);
                    if (this.controls[row.key] && this.controls[row.key].setEnabled) this.controls[row.key].setEnabled(enabled);
                });
            },
            removeObservers() {
                sc.Model.removeObserver(sc.menu, this);
            },
            showMenu() {
                this.addObservers();
                sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
                sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
                sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup);
                ig.interact.setBlockDelay(0.2);
                if (this.list) {
                    this.list.doStateTransition('DEFAULT');
                    this.list.setScrollY(0, 0, 0);
                }
                this.applyMenuSectionLayout();
            },
            hideMenu() {
                this.removeObservers();
                sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE);
                this.exitMenu();
            },
            exitMenu() {
                sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
                sc.menu.popBackCallback();
            },
            onBackButtonPress() {
                sc.menu.popMenu();
            },
            getRepeaterValue() {
                if (sc.control.rightDown()) this.repeater.setDown('right');
                else if (sc.control.leftDown()) this.repeater.setDown('left');
                else if (sc.control.downDown()) this.repeater.setDown('down');
                else if (sc.control.upDown()) this.repeater.setDown('up');
                return this.repeater.getPressed();
            },
            update() {
                this.parent();
                if (ig.interact.isBlocked() || !this.list) return;

                if (ts.diagnosticsEnabled || !!ts.hotkeyCaptureMode || !!ts.menuActionStatus) {
                    this.syncControlsFromSettings();
                }

                if (sc.control.menuScrollUp()) {
                    this.list.scrollY(-this.mouseScrollAmount, 0, this.scrollSpeed);
                } else if (sc.control.menuScrollDown()) {
                    this.list.scrollY(this.mouseScrollAmount, 0, this.scrollSpeed);
                }

                const control = this.buttonGroup.getCurrentElement();
                const repeaterValue = this.getRepeaterValue();

                if (control && (repeaterValue === 'up' || repeaterValue === 'down')) {
                    const controlTopY = control.hook.pos.y;
                    const controlBottomY = controlTopY + control.hook.size.y;
                    const scrollTopY = this.list.getScrollY();
                    const scrollBottomY = scrollTopY + this.list.hook.size.y;

                    if (controlTopY < scrollTopY) {
                        this.list.setScrollY(controlTopY, 0, this.scrollSpeed);
                    } else if (controlBottomY > scrollBottomY) {
                        this.list.setScrollY(controlBottomY - this.list.hook.size.y + 2, 0, this.scrollSpeed);
                    }
                }

                if (control instanceof NumberSlider) control.onKeyboardInput(repeaterValue);
            },
            modelChanged() {}
        });

        const existingMenuId = Object.keys(sc.SUB_MENU_INFO || {}).find((menuId) => {
            return sc.SUB_MENU_INFO[menuId] && sc.SUB_MENU_INFO[menuId].name === 'tilt-shift';
        });
        if (typeof sc.MENU_SUBMENU.TILT_SHIFT !== 'number') {
            sc.MENU_SUBMENU.TILT_SHIFT = existingMenuId !== undefined
                ? Number(existingMenuId)
                : Object.keys(sc.MENU_SUBMENU).length;
        }
        sc.SUB_MENU_INFO[sc.MENU_SUBMENU.TILT_SHIFT] = {
            Clazz: sc.TiltShiftMenu,
            name: 'tilt-shift'
        };

        if (!sc.MenuModel.prototype.__tiltShiftMenuNamePatched) {
            sc.MenuModel.inject({
                getMenuAsName(menuId) {
                    if (menuId === sc.MENU_SUBMENU.TILT_SHIFT) return 'Tilt Shift';
                    return this.parent.apply(this, arguments);
                }
            });
            sc.MenuModel.prototype.__tiltShiftMenuNamePatched = true;
        }

        if (!sc.PauseScreenGui.prototype.__tiltShiftPauseMenuPatched) {
            sc.PauseScreenGui.inject({
                tiltShiftButton: null,
                pruneTiltShiftButtonFocusEntries() {
                    if (!this.buttonGroup || !Array.isArray(this.buttonGroup.elements) || !this.tiltShiftButton) return;
                    this.buttonGroup.elements.forEach((column) => {
                        if (!Array.isArray(column) || !column.length) return;
                        for (let i = column.length - 1; i >= 0; i--) {
                            if (column[i] === this.tiltShiftButton) column.splice(i, 1);
                        }
                    });
                },
                getPauseMenuAnchorButton() {
                    if (!this.buttonGroup || !Array.isArray(this.buttonGroup.elements)) return null;
                    for (let col = 0; col < this.buttonGroup.elements.length; col++) {
                        const column = this.buttonGroup.elements[col];
                        if (!Array.isArray(column) || !column.length) continue;
                        for (let row = 0; row < column.length; row++) {
                            const entry = column[row];
                            if (entry && entry !== this.tiltShiftButton && entry.hook) return entry;
                        }
                    }
                    return null;
                },
                init() {
                    this.parent();
                    this.tiltShiftButton = new sc.ButtonGui('Tilt Shift', sc.BUTTON_DEFAULT_WIDTH);
                    this.tiltShiftButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
                    this.tiltShiftButton.onButtonPress = () => {
                        sc.menu.setDirectMode(true, sc.MENU_SUBMENU.TILT_SHIFT);
                        sc.model.enterMenu(true);
                    };
                    this.insertChildGui(this.tiltShiftButton);
                },
                updateButtons() {
                    this.pruneTiltShiftButtonFocusEntries();

                    if (this.tiltShiftButton && this.tiltShiftButton.hook && this.tiltShiftButton.hook.parentHook) {
                        this.removeChildGui(this.tiltShiftButton);
                    }
                    this.parent();

                    if (!this.tiltShiftButton) return;
                    this.addChildGui(this.tiltShiftButton);

                    const anchorButton = this.getPauseMenuAnchorButton();
                    if (!anchorButton || !anchorButton.hook) return;

                    const firstButtonHook = anchorButton.hook;
                    this.tiltShiftButton.setPos(firstButtonHook.pos.x, firstButtonHook.pos.y + firstButtonHook.size.y + 8);
                    this.buttonGroup.insertFocusGui(this.tiltShiftButton, 0, 0);
                }
            });
            sc.PauseScreenGui.prototype.__tiltShiftPauseMenuPatched = true;
        }

        window.__tiltShiftMenuPatched = true;

        if (window.console && console.log) console.log('[Tilt Shift] Menu hook injected successfully.');
    }

    function setupHotkeyListener() {
        if (document.__tiltShiftHotkeyListenerAttached) return;

        document.addEventListener('keydown', function (e) {
            handleHotkeys(e);
        });

        document.__tiltShiftHotkeyListenerAttached = true;

        if (window.console && console.log) console.log('[Tilt Shift] ' + getModReleaseLabel() + ' - Hotkey listener attached');
    }

    function boot() {
        if (!window.ig || !ig.Game || !ig.GameAddon || !ig.addGameAddon || !ig.system || !ig.$new) {
            setTimeout(boot, 100);
            return;
        }
        loadSettings();
        sanitizeSettings();
        markDirty();
        defineTiltShiftClasses();
        registerTiltShiftAddons();
        hijackMenu();
        setupHotkeyListener();
        if (window.console && console.log) {
            console.log('[Tilt Shift] ' + getModReleaseLabel() + ' - loaded. Blur renders between the world and the HUD (addon draw hooks, no draw hijack).');
        }
    }

    boot();
})();
