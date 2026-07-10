/**
 * Space Trader — Cockpit cinematic controller
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
        TOTAL_DEPARTURE: 2400,
    };

    const PLANET_META = {
        ziemia: { name: 'Ziemia', code: 'E-01', halo: 'rgba(34, 211, 238, 0.5)' },
        mars: { name: 'Mars', code: 'M-07', halo: 'rgba(239, 68, 68, 0.5)' },
        cybertron: { name: 'Cybertron', code: 'C-13', halo: 'rgba(168, 85, 247, 0.5)' },
    };

    const cockpit = document.getElementById('cockpit');
    if (!cockpit) return;

    const hudPanel = document.getElementById('hud-panel');
    const warpOverlay = document.getElementById('warp-overlay');
    const glitchOverlay = document.getElementById('glitch-overlay');
    const starship = document.getElementById('starship');
    const planetDisplay = document.getElementById('planet-display');
    const flashMessage = document.getElementById('flash-message');
    const viewportPlanetName = document.getElementById('viewport-planet-name');
    const viewportPlanetCode = document.getElementById('viewport-planet-code');

    let isTraveling = false;

    /* ── Video fallback handling ── */
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

    function getPlanetLayer(planetKey) {
        return document.querySelector('.planet-layer[data-planet="' + planetKey + '"]');
    }

    function setActivePlanet(planetKey) {
        document.querySelectorAll('.planet-layer').forEach(function (layer) {
            layer.classList.toggle('planet-layer-active', layer.dataset.planet === planetKey);
        });

        const meta = PLANET_META[planetKey];
        if (meta) {
            if (viewportPlanetName) viewportPlanetName.textContent = meta.name;
            if (viewportPlanetCode) viewportPlanetCode.textContent = 'SECTOR ' + meta.code;

            const halo = planetDisplay && planetDisplay.querySelector('.planet-halo');
            if (halo) {
                halo.style.background = 'radial-gradient(circle, ' + meta.halo + ', transparent 70%)';
            }
        }
    }

    function delay(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    async function playWarpSequence(targetPlanet) {
        /* 1. HUD slides out */
        hudPanel.classList.add('hud-panel-slide-out');

        await delay(TIMING.HUD_SLIDE_OUT);

        /* 2. Warp drive activation */
        warpOverlay.classList.add('warp-overlay-active');
        starship.classList.add('starship-warp');
        planetDisplay.classList.add('planet-zoom-warp');

        await delay(TIMING.WARP_FLASH);

        /* 3. Swap planet background during flash */
        setActivePlanet(targetPlanet);

        await delay(TIMING.PLANET_SWAP);

        /* 4. Deactivate warp, brake at destination */
        warpOverlay.classList.remove('warp-overlay-active');
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

    async function revealHud() {
        const flashText = cockpit.dataset.flash;
        if (flashText && flashMessage) {
            flashMessage.textContent = flashText;
            flashMessage.classList.remove('hidden');
        }

        hudPanel.classList.remove('hud-panel-hidden', 'hud-panel-slide-out');
        hudPanel.classList.add('hud-panel-slide-in');
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

    /* ── Travel form interception ── */
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
                form.submit();
                return;
            }

            isTraveling = true;
            document.querySelectorAll('.travel-btn').forEach(function (btn) {
                btn.disabled = true;
            });

            playDepartureAndSubmit(form, targetPlanet);
        });
    });

    handleArrival();
})();
