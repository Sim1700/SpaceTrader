/**
 * Space Trader — Cockpit controller (travel FX, cargo fly, modals)
 */
(function () {
    'use strict';

    const TIMING = {
        HUD_SLIDE_OUT: 600,
        WARP_FLASH: 800,
        PLANET_SWAP: 400,
        PLANET_BRAKE: 1400,
        HUD_SLIDE_IN_DELAY: 300,
        GLITCH_DURATION: 2000,
        ARRIVAL_PAUSE: 500,
        CARGO_FLY: 700,
    };

    const PLANET_META = {
        ziemia: { name: 'Ziemia', code: 'E-01', halo: 'rgba(34, 211, 238, 0.5)' },
        mars: { name: 'Mars', code: 'M-07', halo: 'rgba(239, 68, 68, 0.5)' },
        cybertron: { name: 'Cybertron', code: 'C-13', halo: 'rgba(168, 85, 247, 0.5)' },
    };

    const MODAL_COPY = {
        error: {
            icon: '⚠️',
            title: 'KRYTYCZNY BŁĄD',
            prefixes: {
                fuel: 'BRAK PALIWA!',
                credits: 'BRAK KREDYTÓW!',
                cargo: 'ŁADOWNIA PEŁNA!',
                default: 'OPERACJA NIEMOŻLIWA!',
            },
        },
        success: {
            icon: '✅',
            title: 'OPERACJA UDANA',
            prefixes: { default: 'SUKCES!' },
        },
        warning: {
            icon: '🚨',
            title: 'OSTRZEŻENIE SYSTEMU',
            prefixes: { default: 'ZAGROŻENIE WYKRYTE!' },
        },
        info: {
            icon: 'ℹ️',
            title: 'KOMUNIKAT',
            prefixes: { default: 'INFORMACJA' },
        },
    };

    const cockpit = document.getElementById('cockpit');
    if (!cockpit) return;

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

    let isTraveling = false;

    function delay(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
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

        if (viewportPlanetName) viewportPlanetName.textContent = meta.name;
        if (viewportPlanetCode) viewportPlanetCode.textContent = 'SECTOR ' + meta.code;

        const halo = planetDisplay && planetDisplay.querySelector('.planet-halo');
        if (halo) {
            halo.style.background = 'radial-gradient(circle, ' + meta.halo + ', transparent 70%)';
        }
    }

    function getModalPrefix(type, text) {
        const copy = MODAL_COPY[type] || MODAL_COPY.info;
        const lower = (text || '').toLowerCase();

        if (type === 'error') {
            if (lower.includes('paliw')) return copy.prefixes.fuel;
            if (lower.includes('kredyt')) return copy.prefixes.credits;
            if (lower.includes('ładown')) return copy.prefixes.cargo;
        }

        return copy.prefixes.default;
    }

    function showModal(type, text) {
        const copy = MODAL_COPY[type] || MODAL_COPY.info;

        gameModalBox.className = 'game-modal-box game-modal-' + type;
        gameModalIcon.textContent = copy.icon;
        gameModalTitle.textContent = copy.title + ': ' + getModalPrefix(type, text);
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
        const text = cockpit.dataset.flash;
        const type = cockpit.dataset.flashType || 'info';
        const isArrival = cockpit.dataset.arrival === '1';

        if (!text || isArrival) return;

        showModal(type, text);
    }

    function activateTravelFx(planetKey) {
        if (!travelFx) return;

        travelFx.classList.add('travel-fx-active');
        travelFx.classList.remove('travel-fx-ziemia-on', 'travel-fx-mars-on', 'travel-fx-cybertron-on');
        travelFx.classList.add('travel-fx-' + planetKey + '-on');
    }

    function deactivateTravelFx() {
        if (!travelFx) return;

        travelFx.classList.remove(
            'travel-fx-active',
            'travel-fx-ziemia-on',
            'travel-fx-mars-on',
            'travel-fx-cybertron-on'
        );
    }

    async function playWarpSequence(targetPlanet) {
        hudPanel.classList.add('hud-panel-slide-out');
        await delay(TIMING.HUD_SLIDE_OUT);

        activateTravelFx(targetPlanet);
        warpOverlay.classList.add('warp-overlay-active');
        starship.classList.add('starship-warp');
        planetDisplay.classList.add('planet-zoom-warp');

        await delay(TIMING.WARP_FLASH);

        setActivePlanet(targetPlanet);
        await delay(TIMING.PLANET_SWAP);

        warpOverlay.classList.remove('warp-overlay-active');
        deactivateTravelFx();
        starship.classList.remove('starship-warp');
        planetDisplay.classList.remove('planet-zoom-warp');
        planetDisplay.classList.remove('planet-zoom-arrive');
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
        const flashText = cockpit.dataset.flash;
        const flashType = cockpit.dataset.flashType || 'info';

        hudPanel.classList.remove('hud-panel-hidden', 'hud-panel-slide-out');
        hudPanel.classList.add('hud-panel-slide-in');

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
                showModal('error', 'Za mało paliwa!');
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
                showModal('error', 'Brak miejsca w ładowni!');
                return;
            }

            if (credits < price) {
                showModal('error', 'Za mało kredytów!');
                return;
            }

            flyCargoToShip(icon, button).then(function () {
                form.submit();
            });
        });
    });

    handleArrival();
    maybeShowFlashModal();
})();
