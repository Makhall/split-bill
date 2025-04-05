let items = [];
let people = [];

function addItem() {
  const name = document.getElementById("itemName").value;
  const qty = parseInt(document.getElementById("itemQty").value);
  const price = parseFloat(document.getElementById("itemPrice").value);

  if (!name || !qty || !price) return;

  items.push({ name, qty, price, sharedBy: [] });
  document.getElementById("itemName").value = "";
  document.getElementById("itemQty").value = 1;
  document.getElementById("itemPrice").value = "";
  renderItems();
}

function addPerson() {
  const name = document.getElementById("personName").value.trim();
  if (!name) return;
  people.push(name);
  document.getElementById("personName").value = "";
  renderPeople();
  renderItems();
}

function toggleShare(itemIndex, person) {
  const shared = items[itemIndex].sharedBy;
  const idx = shared.indexOf(person);
  if (idx >= 0) shared.splice(idx, 1);
  else shared.push(person);
  renderItems();
}

function editItem(index) {
  const item = items[index];
  const newQty = prompt(`Ubah qty untuk ${item.name}:`, item.qty);
  const newPrice = prompt(`Ubah harga untuk ${item.name}:`, item.price);
  if (newQty !== null && newPrice !== null) {
    const qty = parseInt(newQty);
    const price = parseFloat(newPrice);
    if (!isNaN(qty) && !isNaN(price)) {
      items[index].qty = qty;
      items[index].price = price;
      renderItems();
    }
  }
}

function renderItems() {
  const list = document.getElementById("itemList");
  list.innerHTML = "";
  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${item.name}</strong> (${item.qty} x <span class="rupiah">${formatRupiah(item.price)}</span>)`;

    const btns = document.createElement("div");
    btns.className = "pill-container";
    people.forEach((p) => {
      const btn = document.createElement("button");
      btn.textContent = p;
      btn.className = item.sharedBy.includes(p) ? "selected" : "";
      btn.onclick = () => toggleShare(index, p);
      btns.appendChild(btn);
    });

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️ Edit";
    editBtn.onclick = () => editItem(index);
    editBtn.style.marginTop = "6px";
    editBtn.style.background = "#ffa726";

    li.appendChild(btns);
    li.appendChild(editBtn);
    list.appendChild(li);
  });
}

function renderPeople() {
  const div = document.getElementById("personList");
  div.innerHTML = "";
  people.forEach((p) => {
    const span = document.createElement("span");
    span.textContent = p;
    span.className = "pill";
    div.appendChild(span);
  });
}

function showSummary() {
  const summary = {};
  people.forEach((p) => (summary[p] = 0));

  let subtotal = 0;
  items.forEach((item) => {
    const total = item.qty * item.price;
    subtotal += total;
    const share = item.sharedBy.length > 0 ? total / item.sharedBy.length : 0;
    item.sharedBy.forEach((p) => {
      summary[p] += share;
    });
  });

  const extras = ["delivery", "service", "packing", "tax", "discount"];
  let extraTotal = 0;
  extras.forEach((key) => {
    const val = document.getElementById(key).value;
    let amount = 0;
    if (val.includes("%")) {
      amount = (subtotal * parseFloat(val) / 100);
    } else {
      amount = parseFloat(val) || 0;
    }
    if (key === "discount") extraTotal -= amount;
    else extraTotal += amount;
  });

  const finalTotal = subtotal + extraTotal;
  const ratio = finalTotal / subtotal;

  Object.keys(summary).forEach((p) => {
    summary[p] *= ratio;
  });

  const ul = document.getElementById("summaryList");
  ul.innerHTML = "";
  Object.entries(summary).forEach(([name, total]) => {
    const li = document.createElement("li");
    li.innerHTML = `${name}: <span class="rupiah">${formatRupiah(Math.round(total))}</span>`;
    ul.appendChild(li);
  });
}

function formatRupiah(number) {
  return number.toLocaleString("id-ID");
}
