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

function resolveTravelEvent(array &$game): ?string
{
    if (rand(1, 100) > EVENT_CHANCE) {
        return null;
    }

    $event = rand(1, 3);

    if ($event === 1) {
        $stolen = rand(100, 300);
        $actualStolen = min($stolen, $game['credits']);
        $game['credits'] -= $actualStolen;

        return 'Piraci zaatakowali Twój statek! Skradziono ' . $actualStolen . ' kredytów.';
    }

    if ($event === 2) {
        if (cargoCount($game['cargo']) >= $game['cargo_capacity']) {
            return 'Kosmiczny odpad! Znalazłeś porzucony kontener, ale brak miejsca w ładowni.';
        }

        $game['cargo']['krysztaly']++;

        return 'Kosmiczny odpad! Znajdujesz porzucony kontener i dostajesz +1 szt. Kryształów Czasu.';
    }

    $game['fuel'] += 30;

    return 'Anomalia paliwowa! Silnik zassał kosmiczny pył — zyskujesz +30 litrów paliwa.';
}

$error = null;
$message = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);

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
            $_SESSION['flash'] = 'Nieznana planeta.';
        } elseif ($targetPlanet === $game['planet']) {
            $_SESSION['flash'] = 'Już jesteś na tej planecie.';
        } else {
            $fuelCost = PLANETS[$targetPlanet]['fuel_cost'];

            if ($game['fuel'] < $fuelCost) {
                $_SESSION['flash'] = 'Za mało paliwa!';
            } else {
                $game['fuel'] -= $fuelCost;

                $messages = [];
                $eventMessage = resolveTravelEvent($game);

                if ($eventMessage !== null) {
                    $messages[] = $eventMessage;
                }

                $game['planet'] = $targetPlanet;
                $game['prices'] = generateMarketPrices($targetPlanet);
                $messages[] = 'Dotarłeś na planetę ' . PLANETS[$targetPlanet]['name'] . '.';

                $_SESSION['flash'] = implode(' ', $messages);
            }
        }
    }

    if ($action === 'buy' && isset($_POST['good'])) {
        $goodKey = $_POST['good'];

        if (!isset(GOODS[$goodKey])) {
            $_SESSION['flash'] = 'Nieznany towar.';
        } elseif (cargoCount($game['cargo']) >= $game['cargo_capacity']) {
            $_SESSION['flash'] = 'Brak miejsca w ładowni!';
        } else {
            $price = $game['prices'][$goodKey];

            if ($game['credits'] < $price) {
                $_SESSION['flash'] = 'Za mało kredytów!';
            } else {
                $game['credits'] -= $price;
                $game['cargo'][$goodKey]++;
                $_SESSION['flash'] = 'Kupiono 1 szt. towaru: ' . GOODS[$goodKey] . '.';
            }
        }
    }

    if ($action === 'sell' && isset($_POST['good'])) {
        $goodKey = $_POST['good'];

        if (!isset(GOODS[$goodKey])) {
            $_SESSION['flash'] = 'Nieznany towar.';
        } elseif (($game['cargo'][$goodKey] ?? 0) < 1) {
            $_SESSION['flash'] = 'Nie masz tego towaru na sprzedaż!';
        } else {
            $price = $game['prices'][$goodKey];
            $game['cargo'][$goodKey]--;
            $game['credits'] += $price;
            $_SESSION['flash'] = 'Sprzedano 1 szt. towaru: ' . GOODS[$goodKey] . ' za ' . $price . ' kr.';
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
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Space Trader<?= $hasActiveGame ? ' — ' . htmlspecialchars($currentPlanet['name']) : ' — Wybór statku' ?></title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container<?= $hasActiveGame ? ' container-wide' : '' ?>">
        <header class="header">
            <h1>Space Trader</h1>
            <?php if ($hasActiveGame): ?>
                <p class="subtitle">Planeta: <?= htmlspecialchars($currentPlanet['name']) ?></p>
            <?php else: ?>
                <p class="subtitle">Wybierz swój statek i rozpocznij handlową misję międzygwiezdną</p>
            <?php endif; ?>
        </header>

        <?php if ($hasActiveGame): ?>
            <?php if ($message !== null): ?>
                <div class="flash"><?= htmlspecialchars($message) ?></div>
            <?php endif; ?>

            <div class="game-grid">
                <section class="panel">
                    <h2>Twój statek</h2>
                    <ul class="info-list">
                        <li><span>Statek</span><strong><?= htmlspecialchars($game['ship_name']) ?></strong></li>
                        <li><span>Paliwo</span><strong><?= (int) $game['fuel'] ?></strong></li>
                        <li><span>Ładownia</span><strong><?= $cargoUsed ?> / <?= (int) $game['cargo_capacity'] ?></strong></li>
                        <li><span>Gotówka</span><strong><?= (int) $game['credits'] ?> kr.</strong></li>
                    </ul>

                    <h3>Ładunek</h3>
                    <ul class="cargo-list">
                        <?php foreach (GOODS as $goodKey => $goodName): ?>
                            <li>
                                <span><?= htmlspecialchars($goodName) ?></span>
                                <strong><?= (int) $game['cargo'][$goodKey] ?> szt.</strong>
                            </li>
                        <?php endforeach; ?>
                    </ul>

                    <a href="?reset=1" class="btn btn-secondary btn-block">Nowa gra</a>
                </section>

                <section class="panel">
                    <h2>Rynek</h2>
                    <p class="panel-desc">Ceny na planecie <?= htmlspecialchars($currentPlanet['name']) ?></p>

                    <?php foreach (GOODS as $goodKey => $goodName): ?>
                        <div class="market-item">
                            <div class="market-header">
                                <h3><?= htmlspecialchars($goodName) ?></h3>
                                <span class="price"><?= (int) $game['prices'][$goodKey] ?> kr.</span>
                            </div>
                            <div class="market-actions">
                                <form method="post">
                                    <input type="hidden" name="action" value="buy">
                                    <input type="hidden" name="good" value="<?= htmlspecialchars($goodKey) ?>">
                                    <button type="submit" class="btn btn-primary">Kup 1 szt.</button>
                                </form>
                                <form method="post">
                                    <input type="hidden" name="action" value="sell">
                                    <input type="hidden" name="good" value="<?= htmlspecialchars($goodKey) ?>">
                                    <button type="submit" class="btn btn-secondary">Sprzedaj 1 szt.</button>
                                </form>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </section>

                <section class="panel">
                    <h2>Nawigacja</h2>
                    <p class="panel-desc">Wybierz cel podróży</p>

                    <ul class="planet-list">
                        <?php foreach (PLANETS as $planetKey => $planet): ?>
                            <li class="planet-item<?= $planetKey === $game['planet'] ? ' planet-current' : '' ?>">
                                <div class="planet-info">
                                    <strong><?= htmlspecialchars($planet['name']) ?></strong>
                                    <span>Koszt: <?= (int) $planet['fuel_cost'] ?> paliwa</span>
                                </div>
                                <form method="post">
                                    <input type="hidden" name="action" value="travel">
                                    <input type="hidden" name="planet" value="<?= htmlspecialchars($planetKey) ?>">
                                    <button
                                        type="submit"
                                        class="btn btn-primary"
                                        <?= $planetKey === $game['planet'] ? 'disabled' : '' ?>
                                    >
                                        <?= $planetKey === $game['planet'] ? 'Jesteś tutaj' : 'Leć tutaj' ?>
                                    </button>
                                </form>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </section>
            </div>
        <?php else: ?>
            <?php if ($error !== null): ?>
                <div class="error"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>

            <form method="post" class="ship-form">
                <div class="ship-grid">
                    <?php foreach (SHIPS as $key => $ship): ?>
                        <label class="ship-card">
                            <input type="radio" name="ship" value="<?= htmlspecialchars($key) ?>" required>
                            <div class="ship-card-content">
                                <h2><?= htmlspecialchars($ship['name']) ?></h2>
                                <p class="ship-desc"><?= htmlspecialchars($ship['description']) ?></p>
                                <ul class="ship-stats">
                                    <li><span>Paliwo</span><strong><?= $ship['fuel'] ?></strong></li>
                                    <li><span>Ładownia</span><strong><?= $ship['cargo_capacity'] ?> szt.</strong></li>
                                    <li><span>Gotówka</span><strong><?= $ship['credits'] ?> kr.</strong></li>
                                </ul>
                            </div>
                        </label>
                    <?php endforeach; ?>
                </div>

                <button type="submit" class="btn btn-primary btn-large">Rozpocznij misję</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
