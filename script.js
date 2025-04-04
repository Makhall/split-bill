document.getElementById('add-person').addEventListener('click', function() {
    let newPerson = document.createElement('div');
    newPerson.classList.add('person');
    newPerson.innerHTML = `
        <input type="text" placeholder="Person Name" class="person-name">
        <div class="items"></div>
        <button class="text-link add-item">+ Add Item</button>
        <button class="remove-person">Remove Person</button>
    `;
    document.getElementById('people').appendChild(newPerson);
});

document.getElementById('people').addEventListener('click', function(event) {
    if (event.target.classList.contains('add-item')) {
        let itemsContainer = event.target.previousElementSibling;
        let newItem = document.createElement('div');
        newItem.classList.add('item');
        newItem.innerHTML = `
            <input type="text" placeholder="Item Name" class="item-name">
            <input type="number" placeholder="Price" class="item-price">
            <input type="number" placeholder="Qty" class="item-qty" value="1">
            <button class="remove-item">X</button>
        `;
        itemsContainer.appendChild(newItem);
    }
    if (event.target.classList.contains('remove-item')) {
        event.target.parentElement.remove();
    }
    if (event.target.classList.contains('remove-person')) {
        event.target.parentElement.remove();
    }
});

document.getElementById('add-cost').addEventListener('click', function() {
    let newCost = document.createElement('div');
    newCost.classList.add('cost-item');
    newCost.innerHTML = `
        <input type="text" placeholder="Cost Description" class="cost-description">
        <input type="number" placeholder="Amount" class="cost-amount">
        <button class="remove-cost">X</button>
    `;
    document.getElementById('other-costs').appendChild(newCost);
});

document.getElementById('calculate').addEventListener('click', function() {
    let people = document.querySelectorAll('.person');
    let total = 0;

    people.forEach(person => {
        let items = person.querySelectorAll('.item');
        let personTotal = 0;
        
        items.forEach(item => {
            let price = parseFloat(item.querySelector('.item-price').value) || 0;
            let qty = parseInt(item.querySelector('.item-qty').value) || 1;
            personTotal += price * qty;
        });
        total += personTotal;
    });

    document.querySelectorAll('.cost-amount').forEach(cost => {
        total += parseFloat(cost.value) || 0;
    });
    
    let globalDiscount = parseFloat(document.getElementById('global-discount').value) || 0;
    let discountType = document.getElementById('discount-type').value;
    
    if (discountType === "percentage") {
        total = total - (total * (globalDiscount / 100));
    } else {
        total = total - globalDiscount;
    }

    document.getElementById('total-amount').textContent = total.toFixed(2);
});