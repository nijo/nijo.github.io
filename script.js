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
                    div.appendChild(img);}
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
            const selectedValues = Array.from(checkboxes)
                .filter(checkbox => checkbox.checked && checkbox.value !== 'all')
                .map(checkbox => checkbox.value);
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
                if (selectedField === 'all') {
                    return Object.entries(row).some(entry => String(entry[1]).toLowerCase().includes(searchQuery));
                } else {
                    return String(row[selectedField] || '').toLowerCase().includes(searchQuery);
                }
            }
        });

        SearchedData = filteredData;
        renderData(SearchedData);
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
                if(a['attackInfo'].length === 1){
                    valueA = a['attackInfo'][0]['attackDamage'].replace('+', '').replace('x', '');
                }
                else if(a['attackInfo'].length === 2){
                    valueA = a['attackInfo'][1]['attackDamage'].replace('+', '').replace('x', '');
                }
                if(b['attackInfo'].length === 1){
                    valueB = b['attackInfo'][0]['attackDamage'].replace('+', '').replace('x', '');
                }
                else if(b['attackInfo'].length === 2){
                    valueB = b['attackInfo'][1]['attackDamage'].replace('+', '').replace('x', '');
                }
                if (order === 'asc') {
                    return valueA - valueB;
                } 
                else {
                    return valueB - valueA;
                }
            });
        }
        else{
            SearchedData.sort((a, b) => {
                const valueA = (a[criteria] || '').toString().toLowerCase();
                const valueB = (b[criteria] || '').toString().toLowerCase();
                if (order === 'asc') {
                    return valueA.localeCompare(valueB);
                } 
                else {
                    return valueB.localeCompare(valueA);
                }
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