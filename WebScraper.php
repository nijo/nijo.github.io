<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function fetch_html($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}

function get_dom($html) {
    $dom = new DOMDocument();
    @$dom->loadHTML($html);
    return $dom;
}

function get_xpath($dom) {
    return new DOMXPath($dom);
}

$base = "https://www.pokemon-zone.com";
$main_html = fetch_html($base . "/cards/");
$main_dom = get_dom($main_html);
$xpath = get_xpath($main_dom);

// Get all card links inside div.card-grid
$links = [];
foreach ($xpath->query('//div[contains(@class,"card-grid")]//a[contains(@href, "/cards/")]') as $a) {
    $href = $a->getAttribute('href');
    if (strpos($href, '/cards/') === 0) {
        $links[] = $base . $href;
    }
}
$links = array_unique($links);

$groupedData = [];

foreach ($links as $url) {
    $card_html = fetch_html($url);
    $dom = get_dom($card_html);
    $xp = get_xpath($dom);

    // Main nodes
    $primaryDataNode = $xp->query('//*[contains(@class,"card-detail__content")]')->item(0);
    if (!$primaryDataNode) continue;

    $headerPrimaryDataNode = (new DOMXPath($primaryDataNode->ownerDocument))
        ->query('.//*[contains(@class,"card-detail__header")]', $primaryDataNode)
        ->item(0);
    if (!$headerPrimaryDataNode) continue;

    $bodyPrimaryDataNode = (new DOMXPath($primaryDataNode->ownerDocument))
        ->query('.//*[contains(@class,"card-detail__content-body")]', $primaryDataNode)
        ->item(0);
    if (!$bodyPrimaryDataNode) continue;

    $secondaryDataNode = $xp->query('//*[contains(@class,"card-detail__aside")]')->item(0);
    if (!$secondaryDataNode) continue;

    // Name
    $NameNode = (new DOMXPath($headerPrimaryDataNode->ownerDocument))
        ->query('.//h1', $headerPrimaryDataNode)
        ->item(0);
    $Name = $NameNode ? trim($NameNode->nodeValue) : '';

    // Rarity
    $Rarity = [];
    foreach ((new DOMXPath($headerPrimaryDataNode->ownerDocument))
        ->query('.//*[contains(@class,"rarity-icon__icon")]', $headerPrimaryDataNode) as $rarityNode) {
        $temp = $rarityNode->getAttribute('class');
        $pos = strpos($temp, '--');
        if ($pos !== false) {
            $r = ucfirst(substr($temp, $pos + 2));
            $Rarity[] = $r;
        }
    }

    // Type
    $Type = 'NA';
    $typeNode = (new DOMXPath($headerPrimaryDataNode->ownerDocument))
        ->query('.//*[contains(@class,"w-24px")]', $headerPrimaryDataNode)
        ->item(0);
    if ($typeNode) {
        // Find the first element child (skip text nodes)
        foreach ($typeNode->childNodes as $child) {
            if ($child instanceof DOMElement) {
                $typeClass = $child->getAttribute('class');
                $pos = strpos($typeClass, '--');
                if ($pos !== false) {
                    $Type = ucfirst(substr($typeClass, $pos + 7));
                }
                break;
            }
        }
    }

    // CardType, Stage, Evolution
    $cardType = $Stage = $evolvesFrom = '';
    $fwBoldNodes = (new DOMXPath($headerPrimaryDataNode->ownerDocument))
        ->query('.//*[contains(@class,"fw-bold")]', $headerPrimaryDataNode);
    if ($fwBoldNodes->length > 0) {
        $temp = trim($fwBoldNodes->item(0)->nodeValue); // Only trim ends
        $parts = array_map('trim', explode('|', $temp)); // Trim each part
        $cardType = isset($parts[0]) ? str_replace('Pokémon', 'Pokemon', $parts[0]) : '';
        $Stage = isset($parts[1]) ? $parts[1] : '';
        $evolvesFrom  = isset($parts[2]) ? trim(preg_replace('/\s+/', ' ', $parts[2])) : '';
        $evolvesFrom = str_replace('Evolves from ', '', $evolvesFrom);
    }

    // HP
    $HP = '';
    if ($fwBoldNodes->length > 1) {
        $HP = trim(str_replace('HP', '', $fwBoldNodes->item(1)->nodeValue));
    }

    // Weakness
    $Weakness = 'NA';
    $gap1Node = (new DOMXPath($bodyPrimaryDataNode->ownerDocument))
        ->query('.//*[contains(@class,"gap-1")]', $bodyPrimaryDataNode)
        ->item(0);
    if ($gap1Node) {
        $w24Node = (new DOMXPath($gap1Node->ownerDocument))
            ->query('.//*[contains(@class,"w-24px")]', $gap1Node)
            ->item(0);
        if ($w24Node) {
            foreach ($w24Node->childNodes as $child) {
                if ($child instanceof DOMElement) {
                    $weakClass = $child->getAttribute('class');
                    $pos = strpos($weakClass, '--');
                    if ($pos !== false) {
                        $Weakness = ucfirst(substr($weakClass, $pos + 7));
                    }
                    break;
                }
            }
        }
    } else {
        $weaknessNode = (new DOMXPath($bodyPrimaryDataNode->ownerDocument))
            ->query('.//*[contains(@class,"w-24px")]', $bodyPrimaryDataNode)
            ->item(0);
        if ($weaknessNode) {
            foreach ($weaknessNode->childNodes as $child) {
                if ($child instanceof DOMElement) {
                    $weakClass = $child->getAttribute('class');
                    $pos = strpos($weakClass, '--');
                    if ($pos !== false) {
                        $Weakness = ucfirst(substr($weakClass, $pos + 7));
                    }
                    break;
                }
            }
        }
    }

    // Retreat cost
    $retreatCostCount = 0;
    $gap2Node = (new DOMXPath($bodyPrimaryDataNode->ownerDocument))
        ->query('.//*[contains(@class,"gap-2")]', $bodyPrimaryDataNode)
        ->item(0);
    if ($gap2Node) {
        $retreatCostCount = (new DOMXPath($gap2Node->ownerDocument))
            ->query('.//*[contains(@class,"w-24px")]', $gap2Node)
            ->length;
    }

    // Info
    $Info = '';
    $infoNode = (new DOMXPath($bodyPrimaryDataNode->ownerDocument))
        ->query('.//*[contains(@class,"fst-italic")]', $bodyPrimaryDataNode)
        ->item(0);
    $Info = $infoNode ? trim(preg_replace('/\s+/', ' ', $infoNode->nodeValue)) : 'NA';
    $Info = str_replace('Pokémon', 'Pokemon', $Info);

    // Evolves Into
    $evolvesInto = [];
    $evolvesIntoNode = (new DOMXPath($bodyPrimaryDataNode->ownerDocument))
        ->query('.//div[contains(text(),"Evolves into:")]', $bodyPrimaryDataNode)
        ->item(0);

    if ($evolvesIntoNode) {
        foreach ($evolvesIntoNode->getElementsByTagName('a') as $a) {
            $evolvesInto[] = trim($a->nodeValue);
        }
    }

    // Attack Info
    $attackInfo = [];
    $attackNodes = (new DOMXPath($bodyPrimaryDataNode->ownerDocument))
        ->query('.//*[normalize-space(@class)="attack-summary-row"]', $bodyPrimaryDataNode);
    foreach ($attackNodes as $row) {
        $attackCost = [];
        $costNodes = (new DOMXPath($row->ownerDocument))
            ->query('.//*[contains(@class,"attack-summary-row__costs")]//*[contains(@class,"energy-icon")]', $row);
        foreach ($costNodes as $costNode) {
            $costClass = $costNode->getAttribute('class');
            $pos = strpos($costClass, '--');
            if ($pos !== false) {
                $attackCost[] = ucfirst(substr($costClass, $pos + 7));
            }
        }
        $attackNameNode = (new DOMXPath($row->ownerDocument))
            ->query('.//*[contains(@class,"attack-summary-row__name")]', $row)
            ->item(0);
        $attackName = $attackNameNode ? trim($attackNameNode->nodeValue) : '';
        $attackDamageNode = (new DOMXPath($row->ownerDocument))
            ->query('.//*[contains(@class,"attack-summary-row__damage")]', $row)
            ->item(0);
        $attackDamage = $attackDamageNode ? trim($attackDamageNode->nodeValue) : '';
        $attackExtraNode = (new DOMXPath($row->ownerDocument))
            ->query('.//*[contains(@class,"attack-summary-row__footer")]', $row)
            ->item(0);
        $attackExtra = $attackExtraNode ? trim($attackExtraNode->nodeValue) : '';
        $attackExtra = str_replace('Pokémon', 'Pokemon', $attackExtra);
        $attackInfo[] = [
            'attackCost' => $attackCost,
            'attackName' => $attackName,
            'attackDamage' => $attackDamage,
            'attackExtra' => $attackExtra
        ];
    }

    // Ability
    $abilityName = '';
    $abilityNode = (new DOMXPath($bodyPrimaryDataNode->ownerDocument))
        ->query('.//*[contains(@class,"ability-summary-row__name")]', $bodyPrimaryDataNode)
        ->item(0);
    if ($abilityNode) $abilityName = trim($abilityNode->nodeValue);

    $abilityDescription = '';
    $abilityDescNode = (new DOMXPath($bodyPrimaryDataNode->ownerDocument))
        ->query('.//*[contains(@class,"ability-summary-row__description")]', $bodyPrimaryDataNode)
        ->item(0);
    if ($abilityDescNode) $abilityDescription = trim($abilityDescNode->nodeValue);

    // Set
    $Set = '';
    $setNode = (new DOMXPath($secondaryDataNode->ownerDocument))
        ->query('.//*[contains(@class,"card-collection-summary__name")]', $secondaryDataNode)
        ->item(0);
    if ($setNode) $Set = trim($setNode->nodeValue);

    // Pack
    $Pack = '';
    $packNode = (new DOMXPath($secondaryDataNode->ownerDocument))
        ->query('(.//*[contains(@class,"content-box--no-border")])[2]//a', $secondaryDataNode)
        ->item(0);
    if ($packNode) $Pack = $packNode->nodeValue;

    // slNo
    $slNo = '';
    $linkNodes = $xp->query('//link');
    if ($linkNodes->length > 7) {
        $href = $linkNodes->item(7)->getAttribute('href');
        $parts = explode('/', $href);
        if (count($parts) > 5) {
            $slNo = strtoupper($parts[4]) . '-' . str_pad($parts[5], 3, '0', STR_PAD_LEFT);
        }
    }

    // Image URL
    $imgNode = $xp->query('//*[contains(@class,"game-card-image__img")]')->item(0);
    $ImageURL = $imgNode ? $imgNode->getAttribute('src') : '';
    $url = 'Images/' . $slNo . '.webp';
    file_put_contents($url, file_get_contents($ImageURL));
    $ImageURL = $url;

    // Custom pack fixes
    if ($slNo == 'A1A-065') $Pack = 'Mew Pack';
    else if ($slNo == 'A1-283') $Pack = 'Finishing Gen 1';
    else if ($slNo == 'PROMO-A-050') $Pack = 'Poke Gold Offers';
    else if ($slNo == 'PROMO-A-015') $Pack = 'Premium Shop';
    else if ($Pack == 'Celestial Guardians: Solgaleo') $Pack = 'Solgaleo';
    else if ($Pack == 'Celestial Guardians: Lunala') $Pack = 'Lunala';

    $groupedData[] = [
        'slNo' => $slNo,
        'imageURL' => $ImageURL,
        'name' => $Name,
        'rarity' => $Rarity,
        'type' => $Type,
        'cardType' => $cardType,
        'stage' => $Stage,
        'evolvesFrom' => $evolvesFrom,
        'evolvesInto' => $evolvesInto,
        'hp' => $HP,
        'weakness' => $Weakness,
        'retreatCost' => $retreatCostCount,
        'set' => $Set,
        'pack' => $Pack,
        'info' => $Info,
        'attackInfo' => $attackInfo,
        'abilityName' => $abilityName,
        'abilityDescription' => $abilityDescription
    ];
}

$url = 'https://nijojob.infinityfreeapp.com/db.php'; // <-- Change to your actual URL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($groupedData));
$response = curl_exec($ch);
echo $response;
curl_close($ch);
?>