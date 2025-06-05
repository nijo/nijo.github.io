let currentFilters = {
    cardType: 'all',
    rarity: 'all',
    type: 'all',
    stage: 'all',
    weakness: 'all',
    set: 'all',
    pack: 'all',
    retreatCost: 'all',
    ability: 'all'
};

let currentImageIndex = 0;
let groupedData = [];
let filteredData = [];
let SearchedData = [];
let searchQuery = "";
let defaultCriteria = 'id';
let defaultOrder = 'asc';
const sets = new Set();
const rarities = new Set();
const types = new Set();
const stages = new Set();
const weaknesses = new Set();
const cardTypes = new Set();
const packs = new Set();
const retreatCosts = new Set();
const abilities = new Set();

function populateFilterCheckboxes(filterId, options, filterType) {
    const filter = document.getElementById(filterId);
    options.forEach(option => {
        const li = document.createElement('li');
        const div = document.createElement('div');
        div.classList.add('form-check');
        const input = document.createElement('input');
        input.classList.add('form-check-input');
        input.type = 'checkbox';
        input.value = option;
        input.name = `${filterType}`;
        input.id = `${filterType}${option}`;
        input.onclick = () => getFilters(filterId, filterType, option);
        if(filterType == 'type' || filterType == 'weakness'){
            if(option != 'NA'){
                const img = document.createElement('img');
                img.src = 'Type/' + option + '.png';
                img.alt = option;
                img.for = `${filterType}${option}`;
                img.style.width ='14px';
                div.appendChild(img);
            }
            else{
                const label = document.createElement('label');
                label.innerHTML = option;
                div.appendChild(label);
            }
        }
        else if(filterType == 'rarity'){
            option = option.split(',');
            option.forEach(item => {
                const img = document.createElement('img');
                img.src = 'Rarity/' + item + '.png';
                img.alt = item;
                img.for = `${filterType}${option}`;
                img.style.width ='14px';
                div.appendChild(img);
            });
        }
        else{
            const label = document.createElement('label');
            label.innerHTML = option;
            label.for = `${filterType}${option}`;
            div.appendChild(label);
        }
        div.appendChild(input);
        li.appendChild(div);
        filter.appendChild(li);
    });
}
function getFilters(filterId, filterType, filterValue) {
    if (filterValue === 'all') {
        currentFilters[filterType] = 'all';
    } 
    else {
        const checkboxes = document.querySelectorAll(`#${filterType}Filter .form-check-input`);
        const selectedValues = Array.from(checkboxes).filter(checkbox => checkbox.checked && checkbox.value !== 'all').map(checkbox => checkbox.value);
        currentFilters[filterType] = selectedValues.length ? selectedValues : 'all';
    }
    document.getElementById(filterId).classList.remove('show');
    setFilters(currentFilters, searchQuery);
}

document.getElementById('searchInput').addEventListener('input', function() {
    searchQuery = this.value.toLowerCase();
    setFilters(currentFilters, searchQuery);
});

//Apply search and dropdown filters
function setFilters(currentFilters, searchQuery) {      
    const selectedField = document.getElementById('searchField').value;
    filteredData = groupedData.filter(row => {
        if (
            (currentFilters.set === 'all' || currentFilters.set.includes(row.set)) &&
            (currentFilters.rarity === 'all' || currentFilters.rarity.includes(row.rarity.toString())) &&
            (currentFilters.type === 'all' || currentFilters.type.includes(row.type)) &&
            (currentFilters.stage === 'all' || currentFilters.stage.includes(row.stage)) &&
            (currentFilters.weakness === 'all' || currentFilters.weakness.includes(row.weakness)) &&
            (currentFilters.cardType === 'all' || currentFilters.cardType.includes(row.cardType)) &&
            (currentFilters.pack === 'all' || currentFilters.pack.includes(row.pack)) &&
            (currentFilters.retreatCost === 'all' || currentFilters.retreatCost.includes(row.retreatCost)) &&
            (currentFilters.ability === 'all' || (currentFilters.ability.includes('Yes') && row.abilityName != ''))
        ) {
            if (selectedField === 'all') return Object.entries(row).some(entry => String(entry[1]).toLowerCase().includes(searchQuery));
            else return String(row[selectedField] || '').toLowerCase().includes(searchQuery);
        }
    });

    SearchedData = filteredData;
    renderData(SearchedData);
    showFilterAppliedPopup(SearchedData);
}

//Sort images.

function sortImages(criteria, order) {
    if(criteria === 'hp' || criteria === 'count'){
        if (order === 'asc') {
            SearchedData.sort((a, b) => a[criteria] - b[criteria]);
        } 
        else{
            SearchedData.sort((a, b) => b[criteria] - a[criteria]);
        }
    }
    else if(criteria === 'attack'){
        SearchedData.sort((a, b) => {
            var valueA = 0;
            var valueB = 0;
            if(a['attackInfo'].length === 1)    valueA = a['attackInfo'][0]['attackDamage'].replace('+', '').replace('x', '');
            else if(a['attackInfo'].length === 2)   valueA = a['attackInfo'][1]['attackDamage'].replace('+', '').replace('x', '');
            if(b['attackInfo'].length === 1)    valueB = b['attackInfo'][0]['attackDamage'].replace('+', '').replace('x', '');
            else if(b['attackInfo'].length === 2)   valueB = b['attackInfo'][1]['attackDamage'].replace('+', '').replace('x', '');
            if (order === 'asc')    return valueA - valueB;
            else    return valueB - valueA;
        });
    }
    else{
        SearchedData.sort((a, b) => {
            const valueA = (a[criteria] || '').toString().toLowerCase();
            const valueB = (b[criteria] || '').toString().toLowerCase();
            if (order === 'asc')    return valueA.localeCompare(valueB);
            else    return valueB.localeCompare(valueA);
        });
    }
    defaultCriteria = criteria;
    defaultOrder = order;
    renderData(SearchedData);
}

function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
}

function divToggle(){
    var x = document.getElementById('Filters');
    x.style.display === 'none'?x.style.display='block':x.style.display='none';
}

document.getElementById('closeButton').onclick = closeModal;

async function loadData(flag) {
    try {
        const response = await fetch("https://ptcgp-d1101-default-rtdb.firebaseio.com/.json");
        const jsondata = await response.json();
        const data = Object.values(jsondata);
        data.forEach(row => {
            const [id, name, rarity, pack, type, imageUrl, stage, hp, weakness, evolvesFrom, evolvesInto, cardType, retreatCost, set, info, abilityName, abilityDescription, attackInfo, count] = [ row.slNo, row.name, row.rarity, row.pack, row.type, row.imageURL, row.stage, row.hp, row.weakness, row.evolvesFrom, row.evolvesInto, row.cardType, row.retreatCost, row.set, row.info, row.abilityName, row.abilityDescription, row.attackInfo, row.count ];
            groupedData.push({ id, name, pack, rarity, type, imageUrl, stage, hp, weakness, evolvesFrom, evolvesInto, cardType, retreatCost, set, info, abilityName, abilityDescription, attackInfo, count });
        });
        
        renderData(groupedData);
        
        if(flag != true){
            SearchedData = groupedData;
            groupedData.forEach(row => {
                const [id, name, rarity, pack, type, imageUrl, stage, hp, weakness, evolvesFrom, evolvesInto, cardType, retreatCost, set, info, abilityName, abilityDescription, attackInfo, count] = [ row.id, row.name, row.rarity, row.pack, row.type, row.imageUrl, row.stage, row.hp, row.weakness, row.evolvesFrom, row.evolvesInto, row.cardType, row.retreatCost, row.set, row.info, row.abilityName, row.abilityDescription, row.attackInfo, row.count];
                if (set) sets.add(set);
                if (rarity.toString()) rarities.add(rarity.toString());
                if (type) types.add(type);
                if (stage) stages.add(stage);
                if (weakness) weaknesses.add(weakness);
                if (cardType) cardTypes.add(cardType);
                if (pack) packs.add(pack);
                if (retreatCost) retreatCosts.add(retreatCost);
                abilities.add('Yes');
            });
            
            populateFilterCheckboxes('setFilter', sets, 'set');
            populateFilterCheckboxes('rarityFilter', rarities, 'rarity');
            populateFilterCheckboxes('typeFilter', types, 'type');
            populateFilterCheckboxes('stageFilter', stages, 'stage');
            populateFilterCheckboxes('weaknessFilter', weaknesses, 'weakness');
            populateFilterCheckboxes('cardTypeFilter', cardTypes, 'cardType');
            populateFilterCheckboxes('packFilter', packs, 'pack');
            populateFilterCheckboxes('retreatCostFilter', retreatCosts, 'retreatCost');
            populateFilterCheckboxes('abilityFilter', abilities, 'ability');
        }
    } 
    catch (e) {
        alert("Failed to load data" + e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadData();
});
//Toggle filters
function divToggle(){
    var x = document.getElementById('Filters');
    x.style.display === 'none'?x.style.display='block':x.style.display='none';
}

// Modal section
function openModal(index) {
    const pokemon = SearchedData[index];
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalDescription = document.getElementById('modalDescription');
    let type = '';
    let weakness = '';
    modalImage.src = pokemon.imageUrl;
    modalImage.alt = pokemon.name;
    const attacks = pokemon.attackInfo.map(function(a) {
        return `<li><strong data-bs-toggle="tooltip" data-bs-html="true" title="${a.attackExtra ? '<em>' + a.attackExtra + '</em>' : ''}">
        ${a.attackExtra ? '<u>' + a.attackName + '</u>' : a.attackName}</strong> - ${a.attackDamage || '00'} (${a.attackCost.map(b => `<img src="Type/${b}.png" style="width:14px">`).join('')})</li>`;
    }).join('');
    const rarity = pokemon.rarity.map(a => `<img src="Rarity/${a}.png" style="width:14px">`).join('');
    let evolvesInto = '';
    let temp = JSON.parse(JSON.stringify(pokemon.evolvesInto));
    if (temp && temp.length !== 0) {
        if (Array.isArray(temp)) {
            evolvesInto = temp.join(', ');
        } 
        else {
            evolvesInto = temp;
        }
    }
    if(pokemon.type == 'NA' || pokemon.type == ''){
        type = `<label>${pokemon.type}</label>`;            
    }
    else{
        type = `<img src="Type/${pokemon.type}.png" alt="${pokemon.type}" style="width: 14px;">`;
    }
    if(pokemon.weakness == 'NA' || pokemon.weakness == ''){
        weakness = `<label>${pokemon.weakness}</label>`;
    }
    else{
        weakness = `<img src="Type/${pokemon.weakness}.png" alt="${pokemon.weakness}" style="width: 14px;">`;
    }
    modalDescription.innerHTML = `
        <div class="row"><div class='col'><strong data-bs-toggle="tooltip" data-bs-html="true" title="<em>${pokemon.info}</em>">${pokemon.name}</strong></div></div>
        <div class="row"><div class='col-5'><strong>ID:</strong></div><div class='col-7'>${pokemon.id}</div></div>
        <div class="row"><div class='col-5'><strong>Rarity:</strong></div><div class='col-7'>${rarity}</div></div>
        <div class="row"><div class='col-5'><strong>Type:</strong></div><div class='col-7'>${type}</div></div>
        <div class="row"><div class='col-5'><strong>HP:</strong></div><div class='col-7'>${pokemon.hp}</div></div>
        <div class="row"><div class='col-5'><strong>Stage:</strong></div><div class='col-7'><span data-bs-toggle="tooltip" data-bs-html="true" title="<em>Evolves From: ${pokemon.evolvesFrom}</em> || <em>Evolves To: ${evolvesInto}</em>">${pokemon.stage}</span></div></div>
        <div class="row"><div class='col-5'><strong>Card Type:</strong></div><div class='col-7'>${pokemon.cardType}</div></div>
        <div class="row"><div class='col-5'><strong>Weakness:</strong></div><div class='col-7'>${weakness}</div></div>
        <div class="row"><div class='col-5'><strong>Retreat Cost:</strong></div><div class='col-7'>${pokemon.retreatCost}</div></div>
        <div class="row"><div class='col-5'><strong>Set:</strong></div><div class='col-7'>${pokemon.set}</div></div>
        <div class="row"><div class='col-5'><strong>Pack:</strong></div><div class='col-7'>${pokemon.pack}</div></div>
        ${pokemon.abilityName ? `<div class="row"><div class='col-5'><strong>Ability:</strong></div><div class='col-7'><span data-bs-toggle="tooltip" data-bs-html="true" title="<em>${pokemon.abilityDescription}</em>">${pokemon.abilityName}</span></div></div>` : ''}
        <div class="row"><div class='col-5'><strong>Attacks:</strong></div><div class='col-7'>${attacks}</div></div>
        `;

    if(window.innerWidth < 1000) modal.style.display = 'block';
    else modal.style.display = 'flex';

    modalImage.style.height = modalImage.naturalHeight.toString() + 'px';
    modalImage.style.width = modalImage.naturalWidth.toString() + 'px';
    modalDescription.style.height = modalImage.naturalHeight.toString() + 'px';
    modalDescription.style.width = (modalImage.naturalWidth * 1.25).toString() + 'px';
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
    if(pokemon.abilityName == '') document.querySelector('#modalDescription .row:last-child .col-7').style.height = ((512/14.5)*2.5).toString() + 'px';
    currentImageIndex = index;
}

function showNextImage() {
    currentImageIndex = (currentImageIndex + 1);
    openModal(currentImageIndex);
}

function showPreviousImage() {
    currentImageIndex = (currentImageIndex - 1);
    openModal(currentImageIndex);
}

document.getElementById('nextButton').onclick = showNextImage;
document.getElementById('prevButton').onclick = showPreviousImage;

function showFilterAppliedPopup(SearchedData) {
    // Remove existing popup if any
    const existing = document.getElementById('filterAppliedPopup');
    if (existing) existing.remove();

    // Create popup div
    const total = SearchedData.length;
    const obtained = SearchedData.filter(row => row.count > 0).length;
    const playable = SearchedData.filter(row => row.count > 1).length;
    const tradeable = SearchedData.filter(row => row.count > 2).length;

    const popup = document.createElement('div');
    popup.id = 'filterAppliedPopup';
    popup.innerText = 'Total: ' + total + '\nObtained: ' + obtained + '\nPlayable: ' + playable + '\nTradeable: ' + tradeable;
    popup.style.position = 'fixed';
    popup.style.top = '30px';
    popup.style.right = '30px';
    popup.style.background = '#007bff';
    popup.style.color = '#fff';
    popup.style.padding = '16px 32px';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    popup.style.zIndex = '9999';
    popup.style.fontSize = '1.2rem';
    popup.style.opacity = '0.95';
    document.body.appendChild(popup);

    // Handler to close popup when clicking outside
    document.addEventListener('mousedown', (event) => {
        if (!popup.contains(event.target)) {
            popup.remove();
            document.removeEventListener('mousedown', arguments.callee);
        }
    });
}
