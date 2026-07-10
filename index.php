<?php

declare(strict_types=1);

session_start();

const SHIPS = [
    'sokol' => [
        'name' => 'Sokół',
        'description' => 'Mały i szybki',
        'fuel' => 150,
        'cargo_capacity' => 10,
        'credits' => 1000,
    ],
    'gargantua' => [
        'name' => 'Gargantua',
        'description' => 'Ciężki transportowiec',
        'fuel' => 80,
        'cargo_capacity' => 30,
        'credits' => 1000,
    ],
];

const PLANETS = [
    'ziemia' => [
        'name' => 'Ziemia',
        'fuel_cost' => 20,
    ],
    'mars' => [
        'name' => 'Mars',
        'fuel_cost' => 20,
    ],
    'cybertron' => [
        'name' => 'Cybertron',
        'fuel_cost' => 40,
    ],
];

const GOODS = [
    'woda' => 'Woda',
    'krysztaly' => 'Kryształy Czasu',
];

const PRICE_RANGES = [
    'ziemia' => [
        'woda' => [10, 20],
        'krysztaly' => [200, 300],
    ],
    'mars' => [
        'woda' => [80, 120],
        'krysztaly' => [100, 150],
    ],
    'cybertron' => [
        'woda' => [40, 60],
        'krysztaly' => [30, 60],
    ],
];

const START_PLANET = 'ziemia';
const EVENT_CHANCE = 30;

const PLANET_MEDIA = [
    'ziemia' => [
        'video' => 'assets/video/ziemia.mp4',
        'accent' => 'cyan',
        'code' => 'E-01',
    ],
    'mars' => [
        'video' => 'assets/video/mars.mp4',
        'accent' => 'red',
        'code' => 'M-07',
    ],
    'cybertron' => [
        'video' => 'assets/video/cybertron.mp4',
        'accent' => 'purple',
        'code' => 'C-13',
    ],
];

function generateMarketPrices(string $planetKey): array
{
    $prices = [];

    foreach (PRICE_RANGES[$planetKey] as $goodKey => [$min, $max]) {
        $prices[$goodKey] = rand($min, $max);
    }

    return $prices;
}

function cargoCount(array $cargo): int
{
    return array_sum($cargo);
}

function initCargo(): array
{
    return array_fill_keys(array_keys(GOODS), 0);
}

function setFlash(string $message, string $type): void
{
    $_SESSION['flash'] = $message;
    $_SESSION['flash_type'] = $type;
}

function resolveTravelEvent(array &$game): ?array
{
    if (rand(1, 100) > EVENT_CHANCE) {
        return null;
    }

    $event = rand(1, 3);

    if ($event === 1) {
        $stolen = rand(100, 300);
        $actualStolen = min($stolen, $game['credits']);
        $game['credits'] -= $actualStolen;

        return [
            'type' => 'pirates',
            'message' => 'Piraci zaatakowali Twój statek! Skradziono ' . $actualStolen . ' kredytów.',
        ];
    }

    if ($event === 2) {
        if (cargoCount($game['cargo']) >= $game['cargo_capacity']) {
            return [
                'type' => 'debris',
                'message' => 'Kosmiczny odpad! Znalazłeś porzucony kontener, ale brak miejsca w ładowni.',
            ];
        }

        $game['cargo']['krysztaly']++;

        return [
            'type' => 'debris',
            'message' => 'Kosmiczny odpad! Znajdujesz porzucony kontener i dostajesz +1 szt. Kryształów Czasu.',
        ];
    }

    $game['fuel'] += 30;

    return [
        'type' => 'fuel',
        'message' => 'Anomalia paliwowa! Silnik zassał kosmiczny pył — zyskujesz +30 litrów paliwa.',
    ];
}

$error = null;
$message = $_SESSION['flash'] ?? null;
$flashType = $_SESSION['flash_type'] ?? 'info';
$flashEvent = $_SESSION['flash_event'] ?? null;
$arrivalAnimation = !empty($_SESSION['flash_arrival']);
unset($_SESSION['flash'], $_SESSION['flash_type'], $_SESSION['flash_event'], $_SESSION['flash_arrival']);

if (isset($_GET['reset'])) {
    unset($_SESSION['game']);
    header('Location: index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ship'])) {
    $shipKey = $_POST['ship'];

    if (!isset(SHIPS[$shipKey])) {
        $error = 'Wybierz prawidłowy statek.';
    } else {
        $ship = SHIPS[$shipKey];

        $_SESSION['game'] = [
            'ship_key' => $shipKey,
            'ship_name' => $ship['name'],
            'fuel' => $ship['fuel'],
            'cargo_capacity' => $ship['cargo_capacity'],
            'credits' => $ship['credits'],
            'planet' => START_PLANET,
            'cargo' => initCargo(),
            'prices' => generateMarketPrices(START_PLANET),
        ];

        header('Location: index.php');
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_SESSION['game'], $_POST['action'])) {
    $game = &$_SESSION['game'];
    $action = $_POST['action'];

    if ($action === 'travel' && isset($_POST['planet'])) {
        $targetPlanet = $_POST['planet'];

        if (!isset(PLANETS[$targetPlanet])) {
            setFlash('Nieznana planeta.', 'error');
        } elseif ($targetPlanet === $game['planet']) {
            setFlash('Już jesteś na tej planecie.', 'error');
        } else {
            $fuelCost = PLANETS[$targetPlanet]['fuel_cost'];

            if ($game['fuel'] < $fuelCost) {
                setFlash('Za mało paliwa!', 'error');
            } else {
                $game['fuel'] -= $fuelCost;

                $messages = [];
                $eventResult = resolveTravelEvent($game);
                $flashTypeTravel = 'success';

                if ($eventResult !== null) {
                    $messages[] = $eventResult['message'];
                    $_SESSION['flash_event'] = $eventResult['type'];
                    if ($eventResult['type'] === 'pirates') {
                        $flashTypeTravel = 'warning';
                    }
                } else {
                    $_SESSION['flash_event'] = 'travel';
                }

                $game['planet'] = $targetPlanet;
                $game['prices'] = generateMarketPrices($targetPlanet);
                $messages[] = 'Dotarłeś na planetę ' . PLANETS[$targetPlanet]['name'] . '.';

                setFlash(implode(' ', $messages), $flashTypeTravel);
                $_SESSION['flash_arrival'] = true;
            }
        }
    }

    if ($action === 'buy' && isset($_POST['good'])) {
        $goodKey = $_POST['good'];

        if (!isset(GOODS[$goodKey])) {
            setFlash('Nieznany towar.', 'error');
        } elseif (cargoCount($game['cargo']) >= $game['cargo_capacity']) {
            setFlash('Brak miejsca w ładowni!', 'error');
        } else {
            $price = $game['prices'][$goodKey];

            if ($game['credits'] < $price) {
                setFlash('Za mało kredytów!', 'error');
            } else {
                $game['credits'] -= $price;
                $game['cargo'][$goodKey]++;
                setFlash('Kupiono 1 szt. towaru: ' . GOODS[$goodKey] . '.', 'success');
            }
        }
    }

    if ($action === 'sell' && isset($_POST['good'])) {
        $goodKey = $_POST['good'];

        if (!isset(GOODS[$goodKey])) {
            setFlash('Nieznany towar.', 'error');
        } elseif (($game['cargo'][$goodKey] ?? 0) < 1) {
            setFlash('Nie masz tego towaru na sprzedaż!', 'error');
        } else {
            $price = $game['prices'][$goodKey];
            $game['cargo'][$goodKey]--;
            $game['credits'] += $price;
            setFlash('Sprzedano 1 szt. towaru: ' . GOODS[$goodKey] . ' za ' . $price . ' kr.', 'success');
        }
    }

    header('Location: index.php');
    exit;
}

$hasActiveGame = isset($_SESSION['game']);
$game = $hasActiveGame ? $_SESSION['game'] : null;

if ($hasActiveGame) {
    if (!isset($game['prices'])) {
        $_SESSION['game']['prices'] = generateMarketPrices($game['planet']);
        $game = $_SESSION['game'];
    }

    if (!isset($game['cargo']['woda'])) {
        $_SESSION['game']['cargo'] = initCargo();
        $game = $_SESSION['game'];
    }

    $currentPlanet = PLANETS[$game['planet']];
    $cargoUsed = cargoCount($game['cargo']);
    $cargoPercent = $game['cargo_capacity'] > 0
        ? min(100, (int) round(($cargoUsed / $game['cargo_capacity']) * 100))
        : 0;
    $fuelMax = max(SHIPS[$game['ship_key']]['fuel'], (int) $game['fuel']);
    $fuelPercent = $fuelMax > 0
        ? min(100, (int) round($game['fuel'] / $fuelMax * 100))
        : 0;
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Space Trader<?= $hasActiveGame ? ' — ' . htmlspecialchars($currentPlanet['name']) : '' ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
                    },
                },
            },
        };
    </script>
    <link rel="stylesheet" href="style.css">
</head>
<body class="h-screen overflow-hidden bg-black font-mono text-slate-100 antialiased">

<?php if ($hasActiveGame): ?>
    <div
        id="cockpit"
        class="cockpit relative flex h-screen w-screen"
        data-current-planet="<?= htmlspecialchars($game['planet']) ?>"
        data-current-fuel="<?= (int) $game['fuel'] ?>"
        data-credits="<?= (int) $game['credits'] ?>"
        data-cargo-used="<?= $cargoUsed ?>"
        data-cargo-capacity="<?= (int) $game['cargo_capacity'] ?>"
        data-arrival="<?= $arrivalAnimation ? '1' : '0' ?>"
        data-event="<?= htmlspecialchars($flashEvent ?? '') ?>"
        data-flash="<?= htmlspecialchars($message ?? '') ?>"
        data-flash-type="<?= htmlspecialchars($flashType) ?>"
    >
        <!-- ═══ LEFT: SPACE VIEWPORT (55%) ═══ -->
        <section id="space-viewport" class="viewport relative w-[55%] overflow-hidden">
            <div class="viewport-vignette pointer-events-none absolute inset-0 z-20"></div>
            <div class="viewport-scanlines pointer-events-none absolute inset-0 z-20"></div>

            <?php foreach (PLANET_MEDIA as $planetKey => $media): ?>
                <div
                    class="planet-layer<?= $planetKey === $game['planet'] ? ' planet-layer-active' : '' ?>"
                    data-planet="<?= htmlspecialchars($planetKey) ?>"
                >
                    <video
                        class="planet-video"
                        autoplay
                        loop
                        muted
                        playsinline
                        preload="metadata"
                    >
                        <source src="<?= htmlspecialchars($media['video']) ?>" type="video/mp4">
                    </video>
                    <div class="planet-fallback planet-fallback-<?= htmlspecialchars($planetKey) ?>"></div>
                    <div class="planet-atmosphere planet-atmosphere-<?= htmlspecialchars($media['accent']) ?>"></div>
                </div>
            <?php endforeach; ?>

            <div id="planet-display" class="planet-display planet-zoom-idle">
                <div class="planet-halo"></div>
            </div>

            <div id="starship" class="starship" aria-hidden="true">
                <div class="starship-hull"></div>
                <div class="starship-cockpit"></div>
                <div class="starship-wing starship-wing-l"></div>
                <div class="starship-wing starship-wing-r"></div>
                <div class="starship-thruster"></div>
            </div>

            <div id="warp-overlay" class="warp-overlay warp-overlay-generic" aria-hidden="true">
                <div class="warp-radial-blur"></div>
                <div class="warp-flash"></div>
                <div class="warp-lens-flare"></div>
                <div class="warp-streaks">
                    <span></span><span></span><span></span><span></span><span></span><span></span>
                </div>
            </div>

            <div id="cargo-fly-layer" class="cargo-fly-layer" aria-hidden="true"></div>

            <div id="glitch-overlay" class="glitch-overlay hidden" aria-hidden="true">
                <div class="glitch-scanlines"></div>
                <div class="glitch-noise"></div>
                <p class="glitch-alert">// SYSTEM FAILURE — PIRATE INTRUSION DETECTED</p>
            </div>

            <div class="viewport-hud pointer-events-none absolute bottom-8 left-8 z-30">
                <p class="text-[10px] uppercase tracking-[0.35em] text-cyan-400/60">Orbital Lock</p>
                <h2 id="viewport-planet-name" class="mt-1 text-2xl font-bold tracking-widest text-white">
                    <?= htmlspecialchars($currentPlanet['name']) ?>
                </h2>
                <p id="viewport-planet-code" class="mt-1 text-xs text-cyan-300/50">
                    SECTOR <?= htmlspecialchars(PLANET_MEDIA[$game['planet']]['code']) ?>
                </p>
            </div>

            <div class="viewport-hud pointer-events-none absolute right-8 top-8 z-30 text-right">
                <p class="text-[10px] uppercase tracking-[0.35em] text-fuchsia-400/60">Vessel</p>
                <p class="mt-1 text-sm font-semibold text-fuchsia-200"><?= htmlspecialchars($game['ship_name']) ?></p>
            </div>
        </section>

        <!-- ═══ RIGHT: GLASS HUD PANEL (45%) ═══ -->
        <aside
            id="hud-panel"
            class="hud-panel hud-panel-glass flex w-[45%] flex-col<?= $arrivalAnimation ? ' hud-panel-hidden' : '' ?>"
        >
            <header class="flex items-center justify-between border-b border-cyan-500/20 px-10 py-8">
                <div>
                    <p class="text-sm uppercase tracking-[0.4em] text-cyan-400/60">Space Trader</p>
                    <h1 class="mt-2 text-2xl font-bold tracking-widest text-white">COMMAND HUD</h1>
                </div>
                <div class="hud-status-dot animate-pulse"></div>
            </header>

            <div class="flex-1 overflow-y-auto px-10 py-8">
                <!-- Stats -->
                <section class="mb-12">
                    <h2 class="mb-6 text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">// Ship Status</h2>

                    <div class="mb-8 space-y-2">
                        <div class="flex justify-between text-base">
                            <span class="text-cyan-400/80">FUEL</span>
                            <span class="text-lg font-semibold text-cyan-200"><?= (int) $game['fuel'] ?> / <?= $fuelMax ?> L</span>
                        </div>
                        <div class="hud-bar-track hud-bar-track-lg">
                            <div class="hud-bar-fill hud-bar-cyan" style="width:<?= $fuelPercent ?>%"></div>
                        </div>
                    </div>

                    <div class="mb-8 space-y-2">
                        <div class="flex justify-between text-base">
                            <span class="text-emerald-400/80">CARGO</span>
                            <span class="text-lg font-semibold text-emerald-200"><?= $cargoUsed ?> / <?= (int) $game['cargo_capacity'] ?></span>
                        </div>
                        <div class="hud-bar-track hud-bar-track-lg">
                            <div class="hud-bar-fill hud-bar-green" style="width:<?= $cargoPercent ?>%"></div>
                        </div>
                    </div>

                    <div class="rounded-xl border-2 border-fuchsia-500/30 bg-fuchsia-950/15 px-6 py-5">
                        <div class="flex items-end justify-between">
                            <span class="text-sm uppercase tracking-widest text-fuchsia-400/70">Credits</span>
                            <span class="text-4xl font-bold text-fuchsia-200 hud-glow-pink"><?= (int) $game['credits'] ?></span>
                        </div>
                    </div>

                    <ul class="mt-6 space-y-3">
                        <?php foreach (GOODS as $goodKey => $goodName): ?>
                            <li class="flex justify-between border-b border-white/10 py-3 text-base">
                                <span class="text-slate-400"><?= htmlspecialchars($goodName) ?></span>
                                <span class="text-lg font-semibold text-emerald-300"><?= (int) $game['cargo'][$goodKey] ?> szt.</span>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </section>

                <!-- Market -->
                <section class="mb-12">
                    <h2 class="mb-6 text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">// Market — <?= htmlspecialchars($currentPlanet['name']) ?></h2>

                    <?php
                    $goodIcons = ['woda' => '💧', 'krysztaly' => '💎'];
                    foreach (GOODS as $goodKey => $goodName):
                    ?>
                        <div class="mb-6 rounded-xl border border-white/10 bg-black/40 p-6" data-market-item="<?= htmlspecialchars($goodKey) ?>">
                            <div class="mb-4 flex items-center justify-between">
                                <span class="flex items-center gap-3 text-xl font-semibold text-white">
                                    <span class="text-3xl"><?= $goodIcons[$goodKey] ?></span>
                                    <?= htmlspecialchars($goodName) ?>
                                </span>
                                <span class="rounded-lg border-2 border-fuchsia-500/40 px-4 py-1 text-lg font-bold text-fuchsia-300">
                                    <?= (int) $game['prices'][$goodKey] ?> kr
                                </span>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <form method="post" class="buy-form" data-buy-form data-good="<?= htmlspecialchars($goodKey) ?>" data-icon="<?= $goodIcons[$goodKey] ?>" data-price="<?= (int) $game['prices'][$goodKey] ?>">
                                    <input type="hidden" name="action" value="buy">
                                    <input type="hidden" name="good" value="<?= htmlspecialchars($goodKey) ?>">
                                    <button type="submit" class="hud-btn hud-btn-cyan hud-btn-lg w-full">KUP 1 SZT.</button>
                                </form>
                                <form method="post">
                                    <input type="hidden" name="action" value="sell">
                                    <input type="hidden" name="good" value="<?= htmlspecialchars($goodKey) ?>">
                                    <button type="submit" class="hud-btn hud-btn-pink hud-btn-lg w-full">SPRZEDAJ 1 SZT.</button>
                                </form>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </section>

                <!-- Navigation -->
                <section>
                    <h2 class="mb-6 text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">// Navigation</h2>
                    <div class="space-y-3">
                        <?php foreach (PLANETS as $planetKey => $planet): ?>
                            <form method="post" class="travel-form" data-travel-form>
                                <input type="hidden" name="action" value="travel">
                                <input type="hidden" name="planet" value="<?= htmlspecialchars($planetKey) ?>">
                                <button
                                    type="submit"
                                    class="travel-btn hud-nav-btn hud-nav-btn-lg w-full<?= $planetKey === $game['planet'] ? ' hud-nav-active' : '' ?>"
                                    data-target-planet="<?= htmlspecialchars($planetKey) ?>"
                                    data-fuel-cost="<?= (int) $planet['fuel_cost'] ?>"
                                    data-planet-name="<?= htmlspecialchars($planet['name']) ?>"
                                    <?= $planetKey === $game['planet'] ? 'disabled' : '' ?>
                                >
                                    <span class="flex items-center justify-between">
                                        <span class="text-lg"><?= htmlspecialchars($planet['name']) ?></span>
                                        <span class="text-sm opacity-60">
                                            <?= $planetKey === $game['planet'] ? 'LOCKED' : $planet['fuel_cost'] . ' FUEL' ?>
                                        </span>
                                    </span>
                                </button>
                            </form>
                        <?php endforeach; ?>
                    </div>
                </section>
            </div>

            <footer class="border-t border-cyan-500/20 px-10 py-6">
                <a
                    href="?reset=1"
                    class="block w-full rounded-lg border-2 border-red-500/40 py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-red-400 transition hover:border-red-400 hover:bg-red-950/30 hover:text-red-300"
                    onclick="return confirm('Na pewno chcesz zresetować grę?');"
                >Resetuj Grę</a>
            </footer>
        </aside>

        <!-- ═══ PEŁNOEKRANOWE EFEKTY LOTU (per planeta) ═══ -->
        <div id="travel-fx" class="travel-fx" aria-hidden="true">
            <!-- ZIEMIA: atmosfera, chmury, para -->
            <div id="fx-ziemia" class="travel-fx-scene fx-ziemia" hidden>
                <div class="fx-ziemia-sky"></div>
                <div class="fx-ziemia-clouds">
                    <div class="fx-cloud fx-cloud-1 animate-pulse"></div>
                    <div class="fx-cloud fx-cloud-2 animate-pulse"></div>
                    <div class="fx-cloud fx-cloud-3 animate-pulse"></div>
                    <div class="fx-cloud fx-cloud-4 animate-pulse"></div>
                    <div class="fx-cloud fx-cloud-5 animate-pulse"></div>
                    <div class="fx-cloud fx-cloud-6 animate-pulse"></div>
                </div>
                <div class="fx-ziemia-vapor">
                    <span></span><span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span><span></span>
                </div>
                <div class="fx-ziemia-glow"></div>
            </div>

            <!-- MARS: burza piaskowa, smugi, cząsteczki -->
            <div id="fx-mars" class="travel-fx-scene fx-mars" hidden>
                <div class="fx-mars-sky"></div>
                <div class="fx-mars-particles">
                    <span></span><span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span><span></span>
                </div>
                <div class="fx-mars-streaks">
                    <span></span><span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span><span></span>
                </div>
                <div class="fx-mars-wind"></div>
            </div>

            <!-- CYBERTRON: glitch CRT, siatka, matrix -->
            <div id="fx-cybertron" class="travel-fx-scene fx-cybertron" hidden>
                <div class="fx-cyber-grid"></div>
                <div class="fx-cyber-matrix">
                    <span></span><span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span><span></span>
                </div>
                <div class="fx-cyber-crt"></div>
                <div class="fx-cyber-glitch-rgb"></div>
                <div class="fx-cyber-scanlines"></div>
                <div class="fx-cyber-barrier"></div>
            </div>
        </div>

        <!-- ═══ CYBERPUNK MODAL ═══ -->
        <div id="game-modal" class="game-modal hidden" role="dialog" aria-modal="true" aria-hidden="true">
            <div class="game-modal-backdrop"></div>
            <div id="game-modal-box" class="game-modal-box">
                <p id="game-modal-icon" class="game-modal-icon"></p>
                <h2 id="game-modal-title" class="game-modal-title"></h2>
                <p id="game-modal-text" class="game-modal-text"></p>
                <button id="game-modal-close" type="button" class="game-modal-btn">OK [X]</button>
            </div>
        </div>
    </div>
    <script src="assets/js/cockpit.js"></script>

<?php else: ?>
    <div class="start-screen relative flex min-h-screen items-center justify-center overflow-x-hidden overflow-y-auto py-12">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,211,238,0.06)_0%,_transparent_70%)]"></div>

        <div class="relative z-10 w-full max-w-6xl px-10">
            <header class="mb-16 text-center">
                <p class="text-sm uppercase tracking-[0.5em] text-cyan-500/60">Stardate 2026</p>
                <h1 class="mt-6 text-7xl font-bold tracking-[0.25em] text-white sm:text-8xl">SPACE TRADER</h1>
                <p class="mt-6 text-xl text-slate-500">Wybierz statek i rozpocznij misję handlową</p>
            </header>

            <?php if ($error !== null): ?>
                <div class="mb-10 rounded-lg border border-red-500/40 bg-red-950/20 px-6 py-5 text-center text-lg text-red-300">
                    <?= htmlspecialchars($error) ?>
                </div>
            <?php endif; ?>

            <form method="post" class="space-y-12">
                <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <?php foreach (SHIPS as $key => $ship): ?>
                        <label class="cursor-pointer">
                            <input type="radio" name="ship" value="<?= htmlspecialchars($key) ?>" class="peer sr-only" required>
                            <div class="start-ship-card rounded-2xl border border-white/10 bg-slate-950/60 p-10 transition peer-checked:border-cyan-400/60 peer-checked:shadow-[0_0_50px_rgba(34,211,238,0.2)] hover:border-white/20">
                                <h2 class="text-3xl font-bold tracking-widest text-cyan-200"><?= htmlspecialchars($ship['name']) ?></h2>
                                <p class="mt-3 text-lg text-slate-500"><?= htmlspecialchars($ship['description']) ?></p>
                                <ul class="mt-8 space-y-4 text-lg">
                                    <li class="flex justify-between rounded-lg bg-black/30 px-5 py-3 text-cyan-400/70"><span>FUEL</span><span class="font-bold text-cyan-200"><?= $ship['fuel'] ?></span></li>
                                    <li class="flex justify-between rounded-lg bg-black/30 px-5 py-3 text-emerald-400/70"><span>CARGO</span><span class="font-bold text-emerald-200"><?= $ship['cargo_capacity'] ?></span></li>
                                    <li class="flex justify-between rounded-lg bg-black/30 px-5 py-3 text-fuchsia-400/70"><span>CREDITS</span><span class="font-bold text-fuchsia-200"><?= $ship['credits'] ?></span></li>
                                </ul>
                            </div>
                        </label>
                    <?php endforeach; ?>
                </div>
                <button type="submit" class="start-btn hud-btn hud-btn-cyan w-full py-8 text-xl tracking-[0.3em]">
                    ROZPOCZNIJ MISJĘ
                </button>
            </form>

            <footer class="mt-16 text-center">
                <a href="?reset=1" class="text-base uppercase tracking-widest text-red-500/50 transition hover:text-red-400">Resetuj Grę</a>
            </footer>
        </div>
    </div>
<?php endif; ?>

</body>
</html>
