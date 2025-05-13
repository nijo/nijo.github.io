<?php

$json = file_get_contents("https://nijojob.infinityfreeapp.com/PokemonData.json");
$html = ob_get_clean();
$html = str_replace(" ", "", $html):
header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
echo json_encode($json);
?>