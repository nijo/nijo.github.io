<?php

//From URL to get webpage contents.
$url = "https://www.pokemon-zone.com";
//echo $url.$_GET['q'];

//Initialize a CURL session.
$ch = curl_init(); 

// Return Page contents.
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

//grab URL and pass it to the variable.
curl_setopt($ch, CURLOPT_URL, $url.$_GET['q']);

$result = curl_exec($ch);

echo $result;

?>
