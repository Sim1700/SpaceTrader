/**
 * Space Trader — i18n (PL / EN)
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'st_lang';
    const CURRENCY = '₵';

    const TRANSLATIONS = {
        pl: {
            ships: {
                sokol: { name: 'Sokół', description: 'Mały i szybki' },
                gargantua: { name: 'Gargantua', description: 'Ciężki transportowiec' },
            },
            planets: {
                ziemia: 'Ziemia',
                mars: 'Mars',
                cybertron: 'Cybertron',
            },
            goods: {
                woda: 'Woda',
                krysztaly: 'Kryształy Czasu',
            },
            ui: {
                space_trader: 'Space Trader',
                command_hud: 'COMMAND HUD',
                orbital_lock: 'Orbital Lock',
                vessel: 'Statek',
                sector: 'SEKTOR',
                ship_status: '// Stan Statku',
                fuel: 'PALIWO',
                cargo: 'ŁADOWNIA',
                credits: 'NEOKREDYTY',
                market: '// Rynek',
                navigation: '// Nawigacja',
                buy_btn: 'KUP 1 SZT.',
                sell_btn: 'SPRZEDAJ 1 SZT.',
                reset_game: 'Resetuj Grę',
                locked: 'ZABLOKOWANE',
                fuel_cost: 'PALIWO',
                pcs: 'szt.',
                unit_l: 'l',
                stardate: 'Stardate 2026',
                start_subtitle: 'Wybierz statek i rozpocznij misję handlową',
                start_mission: 'ROZPOCZNIJ MISJĘ',
                confirm_reset: 'Na pewno chcesz zresetować grę?',
                select_ship_error: 'Wybierz prawidłowy statek.',
                ok_btn: 'OK [X]',
                lang_pl: 'PL',
                lang_en: 'EN',
            },
            modal: {
                error_title: 'KRYTYCZNY BŁĄD',
                success_title: 'OPERACJA UDANA',
                warning_title: 'OSTRZEŻENIE SYSTEMU',
                info_title: 'KOMUNIKAT',
                error_fuel: 'BRAK PALIWA!',
                error_credits: 'BRAK NEOKREDYTÓW!',
                error_cargo: 'ŁADOWNIA PEŁNA!',
                error_default: 'OPERACJA NIEMOŻLIWA!',
                success_default: 'SUKCES!',
                warning_default: 'ZAGROŻENIE WYKRYTE!',
                info_default: 'INFORMACJA',
            },
            flash: {
                unknown_planet: 'Nieznana planeta.',
                already_here: 'Już jesteś na tej planecie.',
                not_enough_fuel: 'Za mało paliwa!',
                unknown_good: 'Nieznany towar.',
                cargo_full: 'Brak miejsca w ładowni!',
                not_enough_credits: 'Za mało neokredytów!',
                no_goods_to_sell: 'Nie masz tego towaru na sprzedaż!',
                pirates: 'Piraci zaatakowali Twój statek! Skradziono {amount} {currency}.',
                debris_full: 'Kosmiczny odpad! Znalazłeś porzucony kontener, ale brak miejsca w ładowni.',
                debris_found: 'Kosmiczny odpad! Znajdujesz porzucony kontener i dostajesz +1 szt. Kryształów Czasu.',
                fuel_anomaly: 'Anomalia paliwowa! Silnik zassał kosmiczny pył — zyskujesz +30 l paliwa.',
                arrived: 'Dotarłeś na planetę {planet}.',
                bought: 'Kupiono 1 szt. towaru: {good}.',
                sold: 'Sprzedano 1 szt. towaru: {good} za {price} {currency}.',
            },
            glitch: '// AWARIA SYSTEMU — WYKRYTO INTRUZA PIRATÓW',
        },
        en: {
            ships: {
                sokol: { name: 'Falcon', description: 'Small and fast' },
                gargantua: { name: 'Gargantua', description: 'Heavy freighter' },
            },
            planets: {
                ziemia: 'Earth',
                mars: 'Mars',
                cybertron: 'Cybertron',
            },
            goods: {
                woda: 'Water',
                krysztaly: 'Time Crystals',
            },
            ui: {
                space_trader: 'Space Trader',
                command_hud: 'COMMAND HUD',
                orbital_lock: 'Orbital Lock',
                vessel: 'Vessel',
                sector: 'SECTOR',
                ship_status: '// Ship Status',
                fuel: 'FUEL',
                cargo: 'CARGO',
                credits: 'NEOCREDITS',
                market: '// Market',
                navigation: '// Navigation',
                buy_btn: 'BUY 1 PCS.',
                sell_btn: 'SELL 1 PCS.',
                reset_game: 'Reset Game',
                locked: 'LOCKED',
                fuel_cost: 'FUEL',
                pcs: 'pcs.',
                unit_l: 'l',
                stardate: 'Stardate 2026',
                start_subtitle: 'Choose your ship and begin the trade mission',
                start_mission: 'START MISSION',
                confirm_reset: 'Are you sure you want to reset the game?',
                select_ship_error: 'Please select a valid ship.',
                ok_btn: 'OK [X]',
                lang_pl: 'PL',
                lang_en: 'EN',
            },
            modal: {
                error_title: 'CRITICAL ERROR',
                success_title: 'OPERATION SUCCESSFUL',
                warning_title: 'SYSTEM WARNING',
                info_title: 'NOTICE',
                error_fuel: 'OUT OF FUEL!',
                error_credits: 'INSUFFICIENT NEOCREDITS!',
                error_cargo: 'CARGO BAY FULL!',
                error_default: 'OPERATION IMPOSSIBLE!',
                success_default: 'SUCCESS!',
                warning_default: 'THREAT DETECTED!',
                info_default: 'INFORMATION',
            },
            flash: {
                unknown_planet: 'Unknown planet.',
                already_here: 'You are already on this planet.',
                not_enough_fuel: 'Not enough fuel!',
                unknown_good: 'Unknown commodity.',
                cargo_full: 'No cargo space left!',
                not_enough_credits: 'Not enough neocredits!',
                no_goods_to_sell: 'You have none of this commodity to sell!',
                pirates: 'Pirates attacked your ship! Stolen {amount} {currency}.',
                debris_full: 'Space debris! You found an abandoned container, but cargo bay is full.',
                debris_found: 'Space debris! You find an abandoned container and gain +1 Time Crystal.',
                fuel_anomaly: 'Fuel anomaly! Engine siphoned cosmic dust — gained +30 l of fuel.',
                arrived: 'You have arrived at {planet}.',
                bought: 'Purchased 1 unit of: {good}.',
                sold: 'Sold 1 unit of: {good} for {price} {currency}.',
            },
            glitch: '// SYSTEM FAILURE — PIRATE INTRUSION DETECTED',
        },
    };

    let currentLang = localStorage.getItem(STORAGE_KEY) || 'pl';
    if (!TRANSLATIONS[currentLang]) {
        currentLang = 'pl';
    }

    function interpolate(text, vars) {
        if (!vars) return text;
        return text.replace(/\{(\w+)\}/g, function (_, key) {
            return vars[key] !== undefined ? String(vars[key]) : '{' + key + '}';
        });
    }

    function t(path, vars) {
        const parts = path.split('.');
        let node = TRANSLATIONS[currentLang];
        for (let i = 0; i < parts.length; i++) {
            if (!node || node[parts[i]] === undefined) return path;
            node = node[parts[i]];
        }
        if (typeof node !== 'string') return path;
        return interpolate(node, vars);
    }

    function goodName(key) {
        return t('goods.' + key);
    }

    function planetName(key) {
        return t('planets.' + key);
    }

    function formatCurrency(amount) {
        return amount + ' ' + CURRENCY;
    }

    function formatFuel(current, max) {
        return current + ' / ' + max + ' ' + t('ui.unit_l');
    }

    function formatCargo(used, capacity) {
        const pcs = t('ui.pcs');
        return used + ' / ' + capacity + ' ' + pcs;
    }

    function translateFlash(key, params) {
        const vars = Object.assign({ currency: CURRENCY }, params || {});
        if (vars.good && TRANSLATIONS[currentLang].goods[vars.good]) {
            vars.good = goodName(vars.good);
        }
        if (vars.planet && TRANSLATIONS[currentLang].planets[vars.planet]) {
            vars.planet = planetName(vars.planet);
        }
        return t('flash.' + key, vars);
    }

    function setLang(lang) {
        if (!TRANSLATIONS[lang]) return;
        currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.lang = lang;
        applyTranslations();
        document.dispatchEvent(new CustomEvent('st:langchange', { detail: { lang: lang } }));
    }

    function getLang() {
        return currentLang;
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            const key = el.dataset.i18n;
            if (key) el.textContent = t(key);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            const key = el.dataset.i18nPlaceholder;
            if (key) el.setAttribute('placeholder', t(key));
        });

        document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            const key = el.dataset.i18nTitle;
            if (key) el.setAttribute('title', t(key));
        });

        document.querySelectorAll('[data-i18n-planet]').forEach(function (el) {
            el.textContent = planetName(el.dataset.i18nPlanet);
        });

        document.querySelectorAll('[data-i18n-good]').forEach(function (el) {
            el.textContent = goodName(el.dataset.i18nGood);
        });

        document.querySelectorAll('[data-i18n-ship-name]').forEach(function (el) {
            const shipKey = el.dataset.i18nShipName;
            el.textContent = t('ships.' + shipKey + '.name');
        });

        document.querySelectorAll('[data-i18n-ship-desc]').forEach(function (el) {
            const shipKey = el.dataset.i18nShipDesc;
            el.textContent = t('ships.' + shipKey + '.description');
        });

        document.querySelectorAll('[data-i18n-market-title]').forEach(function (el) {
            const planetKey = el.dataset.i18nMarketPlanet;
            el.textContent = t('ui.market') + ' — ' + planetName(planetKey);
        });

        document.querySelectorAll('[data-i18n-fuel]').forEach(function (el) {
            const current = el.dataset.fuelCurrent;
            const max = el.dataset.fuelMax;
            el.textContent = formatFuel(current, max);
        });

        document.querySelectorAll('[data-i18n-cargo]').forEach(function (el) {
            const used = el.dataset.cargoUsed;
            const capacity = el.dataset.cargoCapacity;
            el.textContent = formatCargo(used, capacity);
        });

        document.querySelectorAll('[data-i18n-cargo-count]').forEach(function (el) {
            const count = el.dataset.cargoCount;
            el.textContent = count + ' ' + t('ui.pcs');
        });

        document.querySelectorAll('[data-i18n-credits-label]').forEach(function (el) {
            el.textContent = t('ui.credits');
        });

        document.querySelectorAll('[data-i18n-credits-value]').forEach(function (el) {
            const amount = el.dataset.creditsValue;
            el.textContent = amount + ' ' + CURRENCY;
        });

        document.querySelectorAll('[data-i18n-price]').forEach(function (el) {
            const price = el.dataset.price;
            el.textContent = price + ' ' + CURRENCY;
        });

        document.querySelectorAll('[data-i18n-sector]').forEach(function (el) {
            el.textContent = t('ui.sector') + ' ' + el.dataset.sectorCode;
        });

        document.querySelectorAll('[data-i18n-travel-status]').forEach(function (el) {
            if (el.dataset.travelLocked === '1') {
                el.textContent = t('ui.locked');
            } else {
                el.textContent = el.dataset.fuelCost + ' ' + t('ui.fuel_cost');
            }
        });

        document.querySelectorAll('[data-i18n-reset]').forEach(function (el) {
            el.textContent = t('ui.reset_game');
        });

        document.querySelectorAll('[data-i18n-confirm-reset]').forEach(function (el) {
            el.dataset.confirmMsg = t('ui.confirm_reset');
        });

        document.querySelectorAll('.lang-switch-btn').forEach(function (btn) {
            const btnLang = btn.dataset.lang;
            btn.classList.toggle('lang-switch-active', btnLang === currentLang);
            btn.setAttribute('aria-pressed', btnLang === currentLang ? 'true' : 'false');
        });

        const modalClose = document.getElementById('game-modal-close');
        if (modalClose) modalClose.textContent = t('ui.ok_btn');

        const glitchAlert = document.querySelector('.glitch-alert');
        if (glitchAlert) glitchAlert.textContent = t('glitch');
    }

    function initLangSwitcher() {
        document.querySelectorAll('.lang-switch-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setLang(btn.dataset.lang);
            });
        });
    }

    document.documentElement.lang = currentLang;

    window.SpaceTraderI18n = {
        CURRENCY: CURRENCY,
        t: t,
        getLang: getLang,
        setLang: setLang,
        applyTranslations: applyTranslations,
        goodName: goodName,
        planetName: planetName,
        formatCurrency: formatCurrency,
        formatFuel: formatFuel,
        formatCargo: formatCargo,
        translateFlash: translateFlash,
        initLangSwitcher: initLangSwitcher,
    };

    document.addEventListener('DOMContentLoaded', function () {
        applyTranslations();
        initLangSwitcher();
    });
})();
