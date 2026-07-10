/**
 * Space Trader — Cockpit controller (travel FX, cargo fly, modals, i18n, toasts)
 */
(function () {
    'use strict';

    const TIMING = {
        HUD_SLIDE_OUT: 600,
        PLANET_FX: 2200,
        PLANET_SWAP: 400,
        PLANET_BRAKE: 1400,
        HUD_SLIDE_IN_DELAY: 300,
        GLITCH_DURATION: 2000,
        ARRIVAL_PAUSE: 500,
        CARGO_FLY: 700,
    };

    const PLANET_FX_MAP = {
        ziemia: 'fx-ziemia',
        mars: 'fx-mars',
        cybertron: 'fx-cybertron',
    };

    const PLANET_META = {
        ziemia: { code: 'E-01', halo: 'rgba(34, 211, 238, 0.5)' },
        mars: { code: 'M-07', halo: 'rgba(239, 68, 68, 0.5)' },
        cybertron: { code: 'C-13', halo: 'rgba(168, 85, 247, 0.5)' },
    };

    const cockpit = document.getElementById('cockpit');
    if (!cockpit) return;

    const i18n = window.SpaceTraderI18n;
    const toasts = window.SpaceTraderToasts;

    const hudPanel = document.getElementById('hud-panel');
    const warpOverlay = document.getElementById('warp-overlay');
    const travelFx = document.getElementById('travel-fx');
    const glitchOverlay = document.getElementById('glitch-overlay');
    const starship = document.getElementById('starship');
    const planetDisplay = document.getElementById('planet-display');
    const viewportPlanetName = document.getElementById('viewport-planet-name');
    const viewportPlanetCode = document.getElementById('viewport-planet-code');
    const cargoFlyLayer = document.getElementById('cargo-fly-layer');
    const gameModal = document.getElementById('game-modal');
    const gameModalBox = document.getElementById('game-modal-box');
    const gameModalIcon = document.getElementById('game-modal-icon');
    const gameModalTitle = document.getElementById('game-modal-title');
    const gameModalText = document.getElementById('game-modal-text');
    const gameModalClose = document.getElementById('game-modal-close');

    const MODAL_ICONS = {
        error: '⚠️',
        success: '✅',
        warning: '🚨',
        info: 'ℹ️',
    };

    let isTraveling = false;
    let aktywnaAnimacjaLotu = null;

    function delay(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function parseJsonAttr(value, fallback) {
        if (!value) return fallback;
        try {
            return JSON.parse(value);
        } catch (e) {
            return fallback;
        }
    }

    function resolveFlashText() {
        if (!i18n) return '';

        const messages = parseJsonAttr(cockpit.dataset.flashMessages, []);
        if (messages.length > 0) {
            return messages.map(function (msg) {
                return i18n.translateFlash(msg.key, msg.params || {});
            }).join(' ');
        }

        const key = cockpit.dataset.flashKey;
        if (!key) return '';

        const params = parseJsonAttr(cockpit.dataset.flashParams, {});
        return i18n.translateFlash(key, params);
    }

    function getModalPrefix(type, text) {
        if (!i18n) return '';

        const lower = (text || '').toLowerCase();

        if (type === 'error') {
            if (lower.includes('paliw') || lower.includes('fuel')) return i18n.t('modal.error_fuel');
            if (lower.includes('neokredyt') || lower.includes('neocredit')) return i18n.t('modal.error_credits');
            if (lower.includes('ładown') || lower.includes('cargo')) return i18n.t('modal.error_cargo');
            return i18n.t('modal.error_default');
        }
        if (type === 'success') return i18n.t('modal.success_default');
        if (type === 'warning') return i18n.t('modal.warning_default');
        return i18n.t('modal.info_default');
    }

    function getModalTitle(type) {
        if (!i18n) return '';
        return i18n.t('modal.' + type + '_title');
    }

    /* ── Video fallback ── */
    document.querySelectorAll('.planet-video').forEach(function (video) {
        video.addEventListener('canplay', function () {
            video.classList.add('is-playing');
        });
        video.addEventListener('error', function () {
            video.style.display = 'none';
        });
        video.play().catch(function () {
            video.style.display = 'none';
        });
    });

    function setActivePlanet(planetKey) {
        document.querySelectorAll('.planet-layer').forEach(function (layer) {
            layer.classList.toggle('planet-layer-active', layer.dataset.planet === planetKey);
        });

        const meta = PLANET_META[planetKey];
        if (!meta) return;

        if (viewportPlanetName && i18n) {
            viewportPlanetName.textContent = i18n.planetName(planetKey);
        }
        if (viewportPlanetCode && i18n) {
            viewportPlanetCode.textContent = i18n.t('ui.sector') + ' ' + meta.code;
        }

        const halo = planetDisplay && planetDisplay.querySelector('.planet-halo');
        if (halo) {
            halo.style.background = 'radial-gradient(circle, ' + meta.halo + ', transparent 70%)';
        }
    }

    function showModal(type, text) {
        gameModalBox.className = 'game-modal-box game-modal-' + type;
        gameModalIcon.textContent = MODAL_ICONS[type] || MODAL_ICONS.info;
        gameModalTitle.textContent = getModalTitle(type) + ': ' + getModalPrefix(type, text);
        gameModalText.textContent = text;

        gameModal.classList.remove('hidden');
        gameModal.setAttribute('aria-hidden', 'false');
    }

    function hideModal() {
        gameModal.classList.add('hidden');
        gameModal.setAttribute('aria-hidden', 'true');
    }

    if (gameModalClose) {
        gameModalClose.addEventListener('click', hideModal);
    }

    if (gameModal) {
        gameModal.querySelector('.game-modal-backdrop').addEventListener('click', hideModal);
    }

    function maybeShowFlashModal() {
        const text = resolveFlashText();
        const type = cockpit.dataset.flashType || 'info';
        const isArrival = cockpit.dataset.arrival === '1';

        if (!text || isArrival) return;

        showModal(type, text);
    }

    function maybeShowTransactionToast() {
        if (!toasts) return;
        toasts.showFromDataset(cockpit);
    }

    /**
     * Odpala unikalną, pełnoekranową animację lotu dla planety docelowej.
     * @param {string} nazwaPlanety - 'ziemia' | 'mars' | 'cybertron'
     */
    function odpalAnimacjeLotu(nazwaPlanety) {
        zatrzymajAnimacjeLotu();

        const sceneId = PLANET_FX_MAP[nazwaPlanety];
        if (!travelFx || !sceneId) return;

        const scene = document.getElementById(sceneId);
        if (!scene) return;

        aktywnaAnimacjaLotu = nazwaPlanety;
        travelFx.classList.add('travel-fx-active', 'travel-fx-' + nazwaPlanety);
        scene.hidden = false;
        scene.classList.add('travel-fx-scene-active');

        cockpit.classList.add('cockpit-flight', 'cockpit-flight-' + nazwaPlanety);
        starship.classList.add('starship-warp', 'starship-warp-' + nazwaPlanety);
        planetDisplay.classList.add('planet-zoom-warp');
    }

    function zatrzymajAnimacjeLotu() {
        if (!travelFx) return;

        travelFx.classList.remove(
            'travel-fx-active',
            'travel-fx-ziemia',
            'travel-fx-mars',
            'travel-fx-cybertron'
        );

        document.querySelectorAll('.travel-fx-scene').forEach(function (scene) {
            scene.hidden = true;
            scene.classList.remove('travel-fx-scene-active');
        });

        cockpit.classList.remove(
            'cockpit-flight',
            'cockpit-flight-ziemia',
            'cockpit-flight-mars',
            'cockpit-flight-cybertron'
        );

        starship.classList.remove(
            'starship-warp',
            'starship-warp-ziemia',
            'starship-warp-mars',
            'starship-warp-cybertron'
        );

        aktywnaAnimacjaLotu = null;
    }

    async function playWarpSequence(targetPlanet) {
        hudPanel.classList.add('hud-panel-slide-out');
        await delay(TIMING.HUD_SLIDE_OUT);

        odpalAnimacjeLotu(targetPlanet);
        await delay(TIMING.PLANET_FX);

        setActivePlanet(targetPlanet);
        await delay(TIMING.PLANET_SWAP);

        zatrzymajAnimacjeLotu();
        planetDisplay.classList.remove('planet-zoom-warp', 'planet-zoom-arrive');
        void planetDisplay.offsetWidth;
        planetDisplay.classList.add('planet-zoom-arrive');

        await delay(TIMING.PLANET_BRAKE);
    }

    async function playGlitchAlert() {
        glitchOverlay.classList.remove('hidden');
        glitchOverlay.classList.add('active');
        cockpit.classList.add('cockpit-glitch');

        await delay(TIMING.GLITCH_DURATION);

        glitchOverlay.classList.add('hidden');
        glitchOverlay.classList.remove('active');
        cockpit.classList.remove('cockpit-glitch');
    }

    function shipCargoBump() {
        starship.classList.remove('starship-cargo-bump');
        void starship.offsetWidth;
        starship.classList.add('starship-cargo-bump');
    }

    function flyCargoToShip(icon, fromButton) {
        return new Promise(function (resolve) {
            const shipRect = starship.getBoundingClientRect();
            const btnRect = fromButton.getBoundingClientRect();

            const flyer = document.createElement('div');
            flyer.className = 'cargo-flyer';
            flyer.textContent = icon;
            flyer.style.left = btnRect.left + btnRect.width / 2 + 'px';
            flyer.style.top = btnRect.top + btnRect.height / 2 + 'px';

            cargoFlyLayer.appendChild(flyer);

            requestAnimationFrame(function () {
                flyer.style.left = shipRect.left + shipRect.width / 2 + 'px';
                flyer.style.top = shipRect.top + shipRect.height / 2 + 'px';
                flyer.style.transform = 'translate(-50%, -50%) scale(0)';
                flyer.style.opacity = '0';
            });

            setTimeout(function () {
                flyer.remove();
                shipCargoBump();
                resolve();
            }, TIMING.CARGO_FLY);
        });
    }

    async function revealHud() {
        const flashText = resolveFlashText();
        const flashType = cockpit.dataset.flashType || 'info';

        hudPanel.classList.remove('hud-panel-hidden', 'hud-panel-slide-out');
        hudPanel.classList.add('hud-panel-slide-in');

        maybeShowTransactionToast();

        if (flashText) {
            await delay(400);
            showModal(flashType, flashText);
        }
    }

    async function handleArrival() {
        if (cockpit.dataset.arrival !== '1') return;

        const eventType = cockpit.dataset.event;
        setActivePlanet(cockpit.dataset.currentPlanet);
        planetDisplay.classList.add('planet-zoom-arrive');

        await delay(TIMING.ARRIVAL_PAUSE);

        if (eventType === 'pirates') {
            await playGlitchAlert();
        }

        await delay(TIMING.HUD_SLIDE_IN_DELAY);
        await revealHud();
    }

    async function playDepartureAndSubmit(form, targetPlanet) {
        await playWarpSequence(targetPlanet);
        form.submit();
    }

    function errMsg(key) {
        return i18n ? i18n.translateFlash(key) : key;
    }

    /* ── Travel ── */
    document.querySelectorAll('[data-travel-form]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            const button = form.querySelector('.travel-btn');
            if (!button || button.disabled || isTraveling) return;

            event.preventDefault();

            const targetPlanet = button.dataset.targetPlanet;
            const fromPlanet = cockpit.dataset.currentPlanet;
            const fuelCost = parseInt(button.dataset.fuelCost || '0', 10);
            const currentFuel = parseInt(cockpit.dataset.currentFuel || '0', 10);

            if (!targetPlanet || targetPlanet === fromPlanet) return;

            if (currentFuel < fuelCost) {
                showModal('error', errMsg('not_enough_fuel'));
                return;
            }

            isTraveling = true;
            document.querySelectorAll('.travel-btn').forEach(function (btn) {
                btn.disabled = true;
            });

            playDepartureAndSubmit(form, targetPlanet);
        });
    });

    /* ── Buy with cargo fly animation ── */
    document.querySelectorAll('[data-buy-form]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const button = form.querySelector('button[type="submit"]');
            const icon = form.dataset.icon || '📦';
            const price = parseInt(form.dataset.price || '0', 10);
            const credits = parseInt(cockpit.dataset.credits || '0', 10);
            const cargoUsed = parseInt(cockpit.dataset.cargoUsed || '0', 10);
            const cargoCapacity = parseInt(cockpit.dataset.cargoCapacity || '0', 10);

            if (cargoUsed >= cargoCapacity) {
                showModal('error', errMsg('cargo_full'));
                return;
            }

            if (credits < price) {
                showModal('error', errMsg('not_enough_credits'));
                return;
            }

            flyCargoToShip(icon, button).then(function () {
                form.submit();
            });
        });
    });

    /* ── Sell with toast preview ── */
    document.querySelectorAll('[data-sell-form]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const goodKey = form.dataset.good;
            const countEl = document.querySelector('[data-i18n-cargo-count][data-good="' + goodKey + '"]');
            const hasGood = countEl && parseInt(countEl.dataset.cargoCount || '0', 10) > 0;

            if (!hasGood) {
                showModal('error', errMsg('no_goods_to_sell'));
                return;
            }

            form.submit();
        });
    });

    document.addEventListener('st:langchange', function () {
        setActivePlanet(cockpit.dataset.currentPlanet);
    });

    function init() {
        if (cockpit.dataset.arrival !== '1') {
            maybeShowTransactionToast();
        }
        handleArrival();
        maybeShowFlashModal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
