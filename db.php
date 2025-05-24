<?php

header('Content-Type: application/json');

$conn = new mysqli('sql106.infinityfree.com', 'if0_38631777', '6AVQS6uzmFR9Gv', 'if0_38631777_pokemon');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    if (isset($_POST['slNo']) && isset($_POST['count'])) {
        // Update Count field for a given slNo
        parse_str(file_get_contents("php://input"), $_PUT);
        $slNo = $_POST['slNo'] ?? '';
        $count = $_POST['count'] ?? '';
        if ($slNo === '' || $count === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Missing slNo or count']);
            exit;
        }
        $stmt = $conn->prepare("UPDATE pokemon_cards SET Count=? WHERE slNo=?");
        $stmt->bind_param("is", $count, $slNo);
        $stmt->execute();
        echo json_encode(['status' => 'success']);
        $stmt->close();
        $conn->close();
        exit;
    }
    // Insert JSON data (array of cards)
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }
    $stmt = $conn->prepare("INSERT INTO pokemon_cards 
        (slNo, ImageURL, Name, Rarity, Type, cardType, Stage, evolvesFrom, evolvesInto, HP, Weakness, retreatCost, `Set`, Pack, Info, attackInfo, abilityName, abilityDescription)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            ImageURL=VALUES(ImageURL),
            Name=VALUES(Name),
            Rarity=VALUES(Rarity),
            Type=VALUES(Type),
            cardType=VALUES(cardType),
            Stage=VALUES(Stage),
            evolvesFrom=VALUES(evolvesFrom),
            evolvesInto=VALUES(evolvesInto),
            HP=VALUES(HP),
            Weakness=VALUES(Weakness),
            retreatCost=VALUES(retreatCost),
            `Set`=VALUES(`Set`),
            Pack=VALUES(Pack),
            Info=VALUES(Info),
            attackInfo=VALUES(attackInfo),
            abilityName=VALUES(abilityName),
            abilityDescription=VALUES(abilityDescription)
    ");
    foreach ($data as $row) {
        $rarity = json_encode($row['Rarity']);
        $attackInfo = json_encode($row['attackInfo']);
        $evolvesInto = json_encode($row['evolvesInto']);
        $stmt->bind_param(
            "ssssssssssssssssss",
            $row['slNo'],
            $row['ImageURL'],
            $row['Name'],
            $rarity,
            $row['Type'],
            $row['cardType'],
            $row['Stage'],
            $row['evolvesFrom'],
            $evolvesInto,
            $row['HP'],
            $row['Weakness'],
            $row['retreatCost'],
            $row['Set'],
            $row['Pack'],
            $row['Info'],
            $attackInfo,
            $row['abilityName'],
            $row['abilityDescription']
        );
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => $stmt->error]);
            $stmt->close();
            $conn->close();
            exit;
        }
    }
    echo json_encode(['status' => 'success']);
    $stmt->close();
    $conn->close();
    exit;
}

if ($method === 'GET') {
    if (isset($_GET['custom_where'])) {
        $sql = "SELECT SUM(Count) AS sum, Count(Count) AS cnt FROM pokemon_cards WHERE ".trim($_GET['custom_where']);
        $res = $conn->query($sql);
        if ($res && $row = $res->fetch_assoc()) {
            echo json_encode(['count' => $row['cnt'], 'sum' => $row['sum']]);
        } else {
            echo json_encode(['error' => 'Query failed']);
        }
        $conn->close();
        exit;
    }
    // Otherwise, return all data
    $sql = "SELECT * FROM pokemon_cards ORDER BY slNo ASC";
    $result = $conn->query($sql);
    $out = [];
    while ($row = $result->fetch_assoc()) {
        // Decode JSON fields
        if (isset($row['Rarity'])) $row['Rarity'] = json_decode($row['Rarity'], true);
        if (isset($row['evolvesInto'])) $row['evolvesInto'] = json_decode($row['evolvesInto'], true);
        if (isset($row['attackInfo'])) $row['attackInfo'] = json_decode($row['attackInfo'], true);
        $out[] = $row;
    }
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
    $conn->close();
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>