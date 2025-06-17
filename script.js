let currentFilters = {
    cardType: 'all',
    rarity: 'all',
    type: 'all',
    stage: 'all',
    weakness: 'all',
    set: 'all',
    pack: 'all',
    retreatCost: 'all',
    ability: 'all',
    generation: 'all',
    attack: 'all',
    evolution: 'all'
};

let currentImageIndex = 0;
let groupedData = [];
let filteredData = [];
let SearchedData = [];
let searchQuery = "";
let defaultCriteria = 'slNo';
let defaultOrder = 'asc';
let flag = false;

async function loadData(flag) {
    const response = await fetch("https://ptcgp-d1101-default-rtdb.firebaseio.com/.json");
    const jsonData = await response.json();
    groupedData = Object.values(jsonData);
    
    if(flag != true){
        SearchedData = Object.values(groupedData[0]);
        
        populateFilterCheckboxes('setFilter', groupedData[1].sets, 'set');
        populateFilterCheckboxes('rarityFilter', groupedData[1].rarities, 'rarity');
        populateFilterCheckboxes('typeFilter', groupedData[1].types, 'type');
        populateFilterCheckboxes('stageFilter', groupedData[1].stages, 'stage');
        populateFilterCheckboxes('weaknessFilter', groupedData[1].weaknesses, 'weakness');
        populateFilterCheckboxes('cardTypeFilter', groupedData[1].cardTypes, 'cardType');
        populateFilterCheckboxes('packFilter', groupedData[1].packs, 'pack');
        populateFilterCheckboxes('retreatCostFilter', groupedData[1].retreatCosts, 'retreatCost');
        populateFilterCheckboxes('abilityFilter', groupedData[1].ability, 'ability');
        populateFilterCheckboxes('generationFilter', groupedData[1].generations, 'generation');
        populateFilterCheckboxes('attackFilter', groupedData[1].attack, 'attack');
        populateFilterCheckboxes('evolutionFilter', groupedData[1].evolvesInto, 'evolution');

        renderData(Object.values(groupedData[0]));
    }
    else{
        setFilters(currentFilters, searchQuery, flag)
    }
}

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
        input.slNo = `${filterType}${option}`;
        input.onclick = () => getFilters(filterId, filterType, option);
        if(filterType == 'type' || filterType == 'weakness'){
            if(option != 'NA'){
                const img = document.createElement('img');
                img.src = 'https://firebasestorage.googleapis.com/v0/b/ptcgp-d1101.firebasestorage.app/o/Types%2F' + option + '.png?alt=media';
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
            option.forEach(item => {
                const img = document.createElement('img');
                img.src = 'https://firebasestorage.googleapis.com/v0/b/ptcgp-d1101.firebasestorage.app/o/Rarities%2F' + item + '.png?alt=media';
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
    filteredData = Object.values(groupedData[0]).filter(row => {
        if (
            (currentFilters.set === 'all' || currentFilters.set.includes(row.set)) &&
            (currentFilters.rarity === 'all' || currentFilters.rarity.includes(row.rarity.toString())) &&
            (currentFilters.type === 'all' || currentFilters.type.includes(row.type)) &&
            (currentFilters.stage === 'all' || currentFilters.stage.includes(row.stage)) &&
            (currentFilters.weakness === 'all' || currentFilters.weakness.includes(row.weakness)) &&
            (currentFilters.cardType === 'all' || currentFilters.cardType.includes(row.cardType)) &&
            (currentFilters.pack === 'all' || currentFilters.pack.some(item => row.pack.includes(item))) &&
            (currentFilters.retreatCost === 'all' || currentFilters.retreatCost.includes(row.retreatCost.toString())) &&
            (currentFilters.generation === 'all' || currentFilters.generation.includes(row.generation.toString())) &&
            (currentFilters.attack === 'all' || (currentFilters.attack.includes('Yes') && row.attackInfo != 'NA') || (currentFilters.attack.includes('No') && row.attackInfo == 'NA')) &&
            (currentFilters.ability === 'all' || (currentFilters.ability.includes('Yes') && row.abilityInfo.name != 'NA') || (currentFilters.ability.includes('No') && row.abilityInfo.name == 'NA')) &&
            (currentFilters.evolution === 'all' || (currentFilters.evolution.includes('Yes') && row.evolvesInto != 'NA') || (currentFilters.evolution.includes('No') && row.evolvesInto == 'NA'))
        ) {
            if (selectedField === 'all') return Object.entries(row).some(entry => String(entry[1]).toLowerCase().includes(searchQuery));
            else return String(row[selectedField] || '').toLowerCase().includes(searchQuery);
        }
    });
    SearchedData = filteredData;
    renderData(SearchedData);
    if(flag != true){
        showFilterAppliedPopup(SearchedData);
    }
}

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
    var type = '';
    var weakness = '';
    var attacks = '';
    modalImage.src = `https://firebasestorage.googleapis.com/v0/b/ptcgp-d1101.firebasestorage.app/o/Cards%2F${pokemon.slNo}.webp?alt=media`;
    modalImage.alt = pokemon.name;
    if(pokemon.attackInfo != 'NA' && pokemon.attackInfo.length != 0){
        attacks = pokemon.attackInfo.map(function(a) {
            return `<li><strong data-bs-toggle="tooltip" data-bs-html="true" title="${a.attackExtra ? '<em>' + a.attackExtra + '</em>' : ''}">
            ${a.attackExtra ? '<u>' + a.attackName + '</u>' : a.attackName}</strong> - ${a.attackDamage || '00'} (${a.attackCost.map(b => `<img src="https://firebasestorage.googleapis.com/v0/b/ptcgp-d1101.firebasestorage.app/o/Types%2F${b}.png?alt=media" style="width:14px">`).join('')})</li>`;
        }).join('');
    }
    const rarity = pokemon.rarity.map(a => `<img src="https://firebasestorage.googleapis.com/v0/b/ptcgp-d1101.firebasestorage.app/o/Rarities%2F${a}.png?alt=media" style="width:14px">`).join('');
    var evolvesInto = '';
    var temp = JSON.parse(JSON.stringify(pokemon.evolvesInto));
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
        type = `<img src="https://firebasestorage.googleapis.com/v0/b/ptcgp-d1101.firebasestorage.app/o/Types%2F${pokemon.type}.png?alt=media" alt="${pokemon.type}" style="width: 14px;">`;
    }
    if(pokemon.weakness == 'NA' || pokemon.weakness == ''){
        weakness = `<label>${pokemon.weakness}</label>`;
    }
    else{
        weakness = `<img src="https://firebasestorage.googleapis.com/v0/b/ptcgp-d1101.firebasestorage.app/o/Types%2F${pokemon.weakness}.png?alt=media" alt="${pokemon.weakness}" style="width: 14px;">`;
    }
    modalDescription.innerHTML = `
        <div class="row"><div class='col'><strong data-bs-toggle="tooltip" data-bs-html="true" title="<em>${pokemon.info}</em>">${pokemon.name}</strong></div></div>
        <div class="row"><div class='col-5'><strong>slNo:</strong></div><div class='col-7'>${pokemon.slNo}</div></div>
        <div class="row"><div class='col-5'><strong>Rarity:</strong></div><div class='col-7'>${rarity}</div></div>
        <div class="row"><div class='col-5'><strong>Type:</strong></div><div class='col-7'>${type}</div></div>
        <div class="row"><div class='col-5'><strong>HP:</strong></div><div class='col-7'>${pokemon.hp}</div></div>
        <div class="row"><div class='col-5'><strong>Stage:</strong></div><div class='col-7'><span data-bs-toggle="tooltip" data-bs-html="true" title="<em>Evolves From: ${pokemon.evolvesFrom}</em> || <em>Evolves To: ${evolvesInto}</em>">${pokemon.stage}</span></div></div>
        <div class="row"><div class='col-5'><strong>Card Type:</strong></div><div class='col-7'>${pokemon.cardType}</div></div>
        <div class="row"><div class='col-5'><strong>Weakness:</strong></div><div class='col-7'>${weakness}</div></div>
        <div class="row"><div class='col-5'><strong>Retreat Cost:</strong></div><div class='col-7'>${pokemon.retreatCost}</div></div>
        <div class="row"><div class='col-5'><strong>Set:</strong></div><div class='col-7'>${pokemon.set}</div></div>
        <div class="row"><div class='col-5'><strong>Pack:</strong></div><div class='col-7'>${pokemon.pack}</div></div>
        ${pokemon.abilityInfo.name ? `<div class="row"><div class='col-5'><strong>Ability:</strong></div><div class='col-7'><span data-bs-toggle="tooltip" data-bs-html="true" title="<em>${pokemon.abilityInfo.description}</em>">${pokemon.abilityInfo.name}</span></div></div>` : ''}
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

function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
}

document.getElementById('closeButton').onclick = closeModal;
document.getElementById('nextButton').onclick = showNextImage;
document.getElementById('prevButton').onclick = showPreviousImage;

document.addEventListener("DOMContentLoaded", () => {
    loadData();
});
