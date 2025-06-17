const response = await fetch("https://www.pokemon-zone.com/api/game/game-data/");
const jsonData = await response.json();

const gens = [[1,151],[152,251],[252,386],[387,493],[494,649],[650,721],[722,809],[ 810,905],[906,1025]];
const rarityObj = {"Common": ['Diamond'], "Uncommon": ['Diamond', 'Diamond'], "Rare": ['Diamond', 'Diamond', 'Diamond'], "Double Rare": ['Diamond', 'Diamond', 'Diamond', 'Diamond'], "Art Rare": ['Star'], "Super Rare": ['Star', 'Star'], "Immersive Rare": [ 'Star', 'Star', 'Star'], "Crown Rare": ['Crown'], "Special Art Rare": ['Star', 'Star'], "Shiny": ['Shiny'], "Shiny Super Rare": ['Shiny', 'Shiny']};
var pokemonCards = jsonData.data.cards.filter(a => a.pokemon != null);
var trainerCards = jsonData.data.cards.filter(a => a.trainer != null);
var imgURLs = [];

pokemonCards.forEach (a => {
	var abilityInfo = {};
	abilityInfo.description = (a.pokemon.pokemonAbilities.length > 0)?a.pokemon.pokemonAbilities[0].description.replace(/<[^>]*>/g,''): "NA";
	abilityInfo.name = (a.pokemon.pokemonAbilities.length > 0)?a.pokemon.pokemonAbilities[0].name: "NA";

	var attackInfo = [];
	a.pokemon.pokemonAttacks.forEach(ak => {
		var attackCost = ak.attackCost;
		var attackDamage = ak.damage;
		var attackExtra = (ak.description != null)?ak.description.replace(/<[^>]*>/g,''): "NA";
		var attackName = ak.name;
		var attackSymbol = ak.damageSymbolLabel?ak.damageSymbolLabel:"NA";
		
		attackInfo.push({"attackCost": attackCost, "attackDamage": attackDamage, "attackExtra": attackExtra, "attackName": attackName, "attackSymbol": attackSymbol});
	}) 
	attackInfo = attackInfo.length==0?'NA': attackInfo;

	var cardType = "Pokemon";
	var name = a.name;
	var evolvesFrom = (a.pokemon.previousEvolution != null)?a.pokemon.previousEvolution.name:"NA";
	var evolvesInto = [...new Set (pokemonCards.filter(b=> (b.pokemon.previousEvolution != null && b.pokemon.previousEvolution.name == name)).map(b => b.name))];
	evolvesInto = evolvesInto.length!=0?evolvesInto:"NA"; 
	var hp = a.pokemon.hp;
	var info = (a.flavorText != null)?a.flavorText.replace(/<[^>]*>/g, ''):"NA";
	if(a.isPromotion) var pack = a.promotionCardSource.replace("Obtained from a ","").replace("Obtained from the ", "").split('').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
	else var pack = (a.availablePacks.length > 0)?a.availablePacks.map(b=> b.name): "NA";
	var set = a.expansion.name;
	var retreatCost = a.pokemon.retreatAmount;
	var rarity = rarityObj[a.rarityName];
	var slNo = a.expansionCollectionNumbers[0].expansionId.toUpperCase() + "-" + a.expansionCollectionNumbers[0].collectionNumber.toString().padStart (3, '0');
	var stage = a.pokemon.evolutionLabel;
	var type = a.pokemon.pokemonTypes[0];
	var weakness = (a.pokemon.weaknessType != 'UNSPECIFIED')?a.pokemon.weaknessType:"NA";
	var description = (a.description != null)?a.description.replace(/<[^>]*>/g,''):"NA";
	var pokedexId = a.pokedexNumber;
	var generation = gens.findIndex(([a,b]) => pokedexId >= a && pokedexId <= b) + 1;
	var variants = a.variants.length;
	var packPoints = a.dustCost;
	
	var URI = "Cards%2F" + slNo + ".webp";
	imgURLs.push({'getUrl': a.illustrationUrl, 'postUrl': URI});
	
	fetch("https://ptcgp-d1101-default-rtdb.firebaseio.com/cards/" + slNo + ".json", {
		method: "PATCH",
		body: JSON.stringify({"abilityInfo": abilityInfo, "attackInfo": attackInfo, "cardType": cardType, "evolvesFrom": evolvesFrom, "evolvesInto": evolvesInto, "name": name, "hp": hp, "info": info, "pack": pack, "set": set, "rarity": rarity, "retreatCost": retreatCost, "slNo": slNo, "stage": stage, "type": type, "weakness": weakness, "description": description, "pokedexId": pokedexId, "variants": variants, "packPoints": packPoints, "generation": generation})
	});
});

trainerCards.forEach (a => {
	var cardType = "Trainer";
	var name = a.name;
	var evolvesInto = [...new Set (pokemonCards.filter(b=> (b.pokemon.previousEvolution != null && b.pokemon.previousEvolution.name == name)).map(b => b.name))];
	evolvesInto = evolvesInto.length!=0?evolvesInto:"NA"; 
	if(a.isPromotion) var pack = a.promotionCardSource.replace("Obtained from a ","").replace("Obtained from the ", "").split('').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
	else var pack = (a.availablePacks.length > 0)?a.availablePacks.map(b=> b.name): "NA";
	var set = a.expansion.name;
	var rarity = rarityObj[a.rarityName];
	var slNo = a.expansionCollectionNumbers[0].expansionId.toUpperCase() + "-" + a. expansionCollectionNumbers[0].collectionNumber.toString().padStart (3, '0');
	var imageURL = a.illustrationUrl;
	var stage = a.trainer.trainerType;
	var description = (a.description != null)?a.description.replace(/<[^>]*>/g,''):"NA";
	var variants = a.variants.length;
	var packPoints = a.dustCost;
	
	var URI = "Cards%2F" + slNo + ".webp";
	imgURLs.push({'getUrl': a.illustrationUrl, 'postUrl': URI});
	
	fetch("https://ptcgp-d1101-default-rtdb.firebaseio.com/cards/" + slNo + ".json", {
		method: "PATCH", 
		body: JSON.stringify({"abilityInfo":"NA", "attackInfo":"NA", "cardType": cardType, "evolvesFrom": "NA", "evolvesInto": evolvesInto, "name": name, "hp" : 0, "info": "NA", "pack": pack, "set": set, "rarity": rarity, "retreatCost": 0, "slNo": slNo, "stage": stage, "type": "NA", "weakness": "NA", "description": description, "pokedexId": "NA", "variants": variants, "packPoints": packPoints, "generation": "NA"}) 
	});
});

var ability = ['Yes', 'No'];
var attack = ['Yes', 'No'];
var evolvesInto = ['Yes', 'No'];
var cardTypes = ['Pokemon', 'Trainer'];
var HPrange = {'min': 40, 'max': 190};
var packs = ["Shop", "Campaign", "Mission", "Wonder Pick", "Promo Pack"];
var sets = [];
var retreatCosts = [0, 1, 2, 3, 4]; 
var rarities = jsonData.data.rarities.filter(a => a.name != 'Special Art Rare').map(a => rarityObj[a.name]);
var stages = ['Basic', 'Stage 1', 'Stage 2', 'Fossil', 'Supporter', 'Item', 'PokemonTool'];
var types = jsonData.data.pokemonTypes.filter(a => (a.name != 'Fairy')).map(a => a.name);
var weaknesses = jsonData.data.pokemonTypes.filter(a => (a.name != 'Colorless' && a.name != 'Dragon' && a.name != 'Fairy')).map(a => a.name);
var generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];

jsonData.data.packs.filter(a => !a.name.includes('Promo Pack A Series')).forEach((a) => {
	packs.push(a.name);
	
	var URI = "Packs%2F" + a.name.replace(" ", "_") + ".webp";
	imgURLs.push({'getUrl': a.iconAssetUrl, 'postUrl': URI});
})

jsonData.data.expansions.forEach((a) => {
	sets.push(a.name);
	
	var URI = "Sets%2F" + a.name.replace(" ", "_") + ".webp";
	imgURLs.push({'getUrl': a.logoAssetUrl, 'postUrl': URI});
})
fetch("https://ptcgp-d1101-default-rtdb.firebaseio.com/filters.json", { 
	method: "PATCH", 
	body: JSON.stringify({"ability": ability, "attack": attack, "cardTypes": cardTypes, "HPrange": HPrange, "packs": packs, "sets": sets, "retreatCosts": retreatCosts, "rarities": rarities, "stages": stages, "types": types, "weaknesses": weaknesses, "generations": generations, "evolvesInto": evolvesInto}) 
});

async function fetchAndPost() {
    const responses = await Promise.all(imgURLs.map(({ getUrl }) => fetch(getUrl)));
    const data = await Promise.all(responses.map(res => res.arrayBuffer()));

    await Promise.all(
        data.map((item, index) =>
            fetch(`https://firebasestorage.googleapis.com/v0/b/ptcgp-d1101.firebasestorage.app/o/${imgURLs[index].postUrl}`, {
                method: "POST",
                body: item
            })
        )
    );
}

fetchAndPost()