<?php
	$myfile = fopen("PokemonData.json", "w") or die("Unable to open file!");
	$txt = file_get_contents('php://input');
	$data = json_decode($txt, TRUE);
	try {
		for ($x = 0; $x < count($data); $x++) {
			$url =  'Images/'.$data[$x]['slNo'].'.webp';
			//file_put_contents($url, file_get_contents($data[$x]['ImageURL']));
			$data[$x]['ImageURL'] = $url;
			echo $url;
		}
	}
	catch (Exception $e) {
		echo 'Caught exception: ',  $e->getMessage(), "\n";
	}
	fwrite($myfile, json_encode($data));
	fclose($myfile);
?>