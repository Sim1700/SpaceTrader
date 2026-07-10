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

const START_PLANET = 'Ziemia';

$error = null;

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
            'cargo' => [],
        ];

        header('Location: index.php');
        exit;
    }
}

$hasActiveGame = isset($_SESSION['game']);
$game = $hasActiveGame ? $_SESSION['game'] : null;
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Space Trader<?= $hasActiveGame ? ' — ' . htmlspecialchars($game['planet']) : ' — Wybór statku' ?></title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>Space Trader</h1>
            <?php if ($hasActiveGame): ?>
                <p class="subtitle">Planeta: <?= htmlspecialchars($game['planet']) ?></p>
            <?php else: ?>
                <p class="subtitle">Wybierz swój statek i rozpocznij handlową misję międzygwiezdną</p>
            <?php endif; ?>
        </header>

        <?php if ($hasActiveGame): ?>
            <div class="status-panel">
                <div class="status-item">
                    <span class="label">Statek</span>
                    <span class="value"><?= htmlspecialchars($game['ship_name']) ?></span>
                </div>
                <div class="status-item">
                    <span class="label">Paliwo</span>
                    <span class="value"><?= (int) $game['fuel'] ?></span>
                </div>
                <div class="status-item">
                    <span class="label">Ładownia</span>
                    <span class="value"><?= count($game['cargo']) ?> / <?= (int) $game['cargo_capacity'] ?></span>
                </div>
                <div class="status-item">
                    <span class="label">Gotówka</span>
                    <span class="value"><?= (int) $game['credits'] ?> kr.</span>
                </div>
            </div>

            <div class="notice">
                <p>Gra została zainicjowana. Kolejne kroki rozbudują ten ekran.</p>
                <a href="?reset=1" class="btn btn-secondary">Nowa gra</a>
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
