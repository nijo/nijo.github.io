const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// --- Configuration ---
const FIREBASE_URL = process.env.FIREBASE_URL || "https://ptcgp-d1101-default-rtdb.firebaseio.com/.json";

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Helper: Build Card Object ---
function buildPokemonCard(a, pokemonCards, rarityObj, gens) {
  const abilityInfo = {
    description: (a.pokemon.pokemonAbilities.length > 0) ? a.pokemon.pokemonAbilities[0].description.replace(/<[^>]*>/g, '') : "NA",
    name: (a.pokemon.pokemonAbilities.length > 0) ? a.pokemon.pokemonAbilities[0].name : "NA"
  };

  let attackInfo = [];
  a.pokemon.pokemonAttacks.forEach(ak => {
    const attackCost = ak.attackCost;
    const attackDamage = ak.damage;
    const attackExtra = (ak.description != null) ? ak.description.replace(/<[^>]*>/g, '') : "NA";
    const attackName = ak.name;
    const attackSymbol = ak.damageSymbolLabel ? ak.damageSymbolLabel : "NA";
    attackInfo.push({ attackCost, attackDamage, attackExtra, attackName, attackSymbol });
  });
  attackInfo = attackInfo.length === 0 ? 'NA' : attackInfo;

  const cardType = "Pokemon";
  const name = a.name;
  const evolvesFrom = (a.pokemon.previousEvolution != null) ? a.pokemon.previousEvolution.name : "NA";
  let evolvesInto = [...new Set(pokemonCards.filter(b => (b.pokemon.previousEvolution != null && b.pokemon.previousEvolution.name == name)).map(b => b.name))];
  evolvesInto = evolvesInto.length !== 0 ? evolvesInto : "NA";
  const hp = a.pokemon.hp;
  const info = (a.flavorText != null) ? a.flavorText.replace(/<[^>]*>/g, '') : "NA";
  let pack;
  if (a.isPromotion) pack = a.promotionCardSource.replace("Obtained from a ", "").replace("Obtained from the ", "").split('').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  else pack = (a.availablePacks.length > 0) ? a.availablePacks.map(b => b.name) : "NA";
  const set = a.expansion.name;
  const retreatCost = a.pokemon.retreatAmount;
  const rarity = rarityObj[a.rarityName];
  const slNo = a.expansionCollectionNumbers[0].expansionId.toUpperCase() + "-" + a.expansionCollectionNumbers[0].collectionNumber.toString().padStart(3, '0');
  const stage = a.pokemon.evolutionLabel;
  const type = a.pokemon.pokemonTypes[0];
  const weakness = (a.pokemon.weaknessType != 'UNSPECIFIED') ? a.pokemon.weaknessType : "NA";
  const description = (a.description != null) ? a.description.replace(/<[^>]*>/g, '') : "NA";
  const pokedexId = a.pokedexNumber;
  const generation = gens.findIndex(([a, b]) => pokedexId >= a && pokedexId <= b) + 1;
  const variants = a.variants.length;
  const packPoints = a.dustCost;

  return {abilityInfo, attackInfo, cardType, evolvesFrom, evolvesInto, name, hp, info, pack, set, rarity, retreatCost, slNo, stage, type, weakness, description, pokedexId, variants, packPoints, generation};
}

function buildTrainerCard(a, pokemonCards, rarityObj) {
  const cardType = "Trainer";
  const name = a.name;
  let evolvesInto = [...new Set(pokemonCards.filter(b => (b.pokemon.previousEvolution != null && b.pokemon.previousEvolution.name == name)).map(b => b.name))];
  evolvesInto = evolvesInto.length !== 0 ? evolvesInto : "NA";
  let pack;
  if (a.isPromotion) pack = a.promotionCardSource.replace("Obtained from a ", "").replace("Obtained from the ", "").split('').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  else pack = (a.availablePacks.length > 0) ? a.availablePacks.map(b => b.name) : "NA";
  const set = a.expansion.name;
  const rarity = rarityObj[a.rarityName];
  const slNo = a.expansionCollectionNumbers[0].expansionId.toUpperCase() + "-" + a.expansionCollectionNumbers[0].collectionNumber.toString().padStart(3, '0');
  const stage = a.trainer.trainerType;
  const description = (a.description != null) ? a.description.replace(/<[^>]*>/g, '') : "NA";
  const variants = a.variants.length;
  const packPoints = a.dustCost;

  return {
    abilityInfo: "NA",
    attackInfo: "NA",
    cardType,
    evolvesFrom: "NA",
    evolvesInto,
    name,
    hp: 0,
    info: "NA",
    pack,
    set,
    rarity,
    retreatCost: 0,
    slNo,
    stage,
    type: "NA",
    weakness: "NA",
    description,
    pokedexId: "NA",
    variants,
    packPoints,
    generation: "NA"
  };
}

// --- Main Data Fetch & Transform ---
async function fetchPokemonData(exp) {
  const response = await axios.get('https://www.pokemon-zone.com/api/game/game-data/');
  const jsonData = response.data;
  const gens = [
    [1, 151], [152, 251], [252, 386], [387, 493], [494, 649],
    [650, 721], [722, 809], [810, 905], [906, 1025]
  ];
  const rarityObj = {
    "Common": ['Diamond'],
    "Uncommon": ['Diamond', 'Diamond'],
    "Rare": ['Diamond', 'Diamond', 'Diamond'],
    "Double Rare": ['Diamond', 'Diamond', 'Diamond', 'Diamond'],
    "Art Rare": ['Star'],
    "Super Rare": ['Star', 'Star'],
    "Immersive Rare": ['Star', 'Star', 'Star'],
    "Crown Rare": ['Crown'],
    "Special Art Rare": ['Star', 'Star'],
    "Shiny": ['Shiny'],
    "Shiny Super Rare": ['Shiny', 'Shiny']
  };

  let pokemonCards, trainerCards, packsData, setsData;
  if (exp) {
    pokemonCards = jsonData.data.cards.filter(a => (a.pokemon != null && a.expansionCollectionNumbers[0].expansionId == exp));
    trainerCards = jsonData.data.cards.filter(a => (a.trainer != null && a.expansionCollectionNumbers[0].expansionId == exp));
    packsData = jsonData.data.packs.filter(a => (a.sku.expansion.expansionId == exp && !a.name.includes('Promo Pack A Series')));
    setsData = jsonData.data.expansions.filter(a => a.expansionId == exp);
  } else {
    pokemonCards = jsonData.data.cards.filter(a => a.pokemon != null);
    trainerCards = jsonData.data.cards.filter(a => a.trainer != null);
    packsData = jsonData.data.packs.filter(a => !a.name.includes('Promo Pack A Series'));
    setsData = jsonData.data.expansions;
  }

  let imgURLs = [];
  const ability = ['Yes', 'No'];
  const attack = ['Yes', 'No'];
  const evolution = ['Yes', 'No'];
  const cardTypes = ['Pokemon', 'Trainer'];
  const HPrange = { 'min': 40, 'max': 190 };
  let packs = ["Shop", "Campaign", "Mission", "Wonder Pick", "Promo Pack"];
  let sets = [];
  const retreatCosts = [0, 1, 2, 3, 4];
  const rarities = jsonData.data.rarities.filter(a => a.name != 'Special Art Rare').map(a => rarityObj[a.name]);
  const stages = ['Basic', 'Stage 1', 'Stage 2', 'Fossil', 'Supporter', 'Item', 'PokemonTool'];
  const types = jsonData.data.pokemonTypes.filter(a => (a.name != 'Fairy')).map(a => a.name);
  const weaknesses = jsonData.data.pokemonTypes.filter(a => (a.name != 'Colorless' && a.name != 'Dragon' && a.name != 'Fairy')).map(a => a.name);
  const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let gameData = { "cards": {}, "filters": {} };

  // Packs and Sets
  packsData.forEach((a) => {
    packs.push(a.name);
    const URI = "Packs%2F" + a.name.replace(/ /g, "_") + ".webp";
    imgURLs.push({ 'getUrl': a.iconAssetUrl, 'postUrl': URI });
  });

  setsData.forEach((a) => {
    sets.push(a.name);
    const URI = "Sets%2F" + a.name.replace(/ /g, "_") + ".webp";
    imgURLs.push({ 'getUrl': a.logoAssetUrl, 'postUrl': URI });
  });

  gameData.filters = {
    "ability": ability,
    "attack": attack,
    "cardTypes": cardTypes,
    "HPrange": HPrange,
    "packs": packs,
    "sets": sets,
    "retreatCosts": retreatCosts,
    "rarities": rarities,
    "stages": stages,
    "types": types,
    "weaknesses": weaknesses,
    "generations": generations,
    "evolvesInto": evolution
  };

  // --- Pokemon Cards ---
  pokemonCards.forEach(a => {
    const card = buildPokemonCard(a, pokemonCards, rarityObj, gens);
    gameData.cards[card.slNo] = card;
  });

  // --- Trainer Cards ---
  trainerCards.forEach(a => {
    const card = buildTrainerCard(a, pokemonCards, rarityObj);
    gameData.cards[card.slNo] = card;
  });

  return gameData;
}

// --- Optional: Image Upload Function (not called by default) ---
async function fetchAndPost(imgURLs) {
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
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

// --- API Endpoints ---

// Get full data and PATCH to Firebase
app.get('/full', async (req, res) => {
  try {
    const data = await fetchPokemonData();
    // await fetchAndPost(imgURLs);
    await fetch(FIREBASE_URL, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get delta data and PATCH to Firebase (currently same as /full)
app.get('/delta/:exp', async (req, res) => {
  try {
    const exp = req.params.exp;
    const data = await fetchPokemonData(exp);
    // await fetchAndPost(imgURLs);
    await fetch(FIREBASE_URL, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to check server status
app.get('/test', async (req, res) => {
  try {
    res.send("Test endpoint is working!");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

exports.ptcgp = onRequest(app);
