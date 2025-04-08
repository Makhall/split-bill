let items = [];
let people = [];
let itemIdCounter = 0;
let currentEditIndex = null;

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
  currentEditIndex = index;
  const item = items[index];

  document.getElementById("modalName").value = item.name;
  document.getElementById("modalQty").value = item.qty;
  document.getElementById("modalPrice").value = item.price;
  document.getElementById("editModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("editModal").style.display = "none";
}

function confirmEdit() {
  const name = document.getElementById("modalName").value.trim();
  const qty = parseInt(document.getElementById("modalQty").value);
  const price = parseFloat(document.getElementById("modalPrice").value);

  if (name && !isNaN(qty) && !isNaN(price)) {
    items[currentEditIndex].name = name;
    items[currentEditIndex].qty = qty;
    items[currentEditIndex].price = price;

    renderItems();
    closeModal();
  }
}

function removeItem(index) {
  if (confirm("Yakin ingin menghapus item ini?")) {
    items.splice(index, 1);
    renderItems();
  }
}

function renderItems() {
  const list = document.getElementById("itemList");
  list.innerHTML = ""; // Bersihkan isi list

  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "item";

    li.innerHTML = `
      <span><strong>${item.name}</strong> (${
      item.qty
    } x <span class="rupiah">${formatRupiah(item.price)}</span>)</span>
      <button onclick="removeItem(${index})" class="delete-button">🗑️</button>
      <button onclick="editItem(${index})" class="edit-button">✏️</button>
    `;

    // Tambahkan tombol share per orang
    const btns = document.createElement("div");
    btns.className = "pill-container";
    people.forEach((p) => {
      const btn = document.createElement("button");
      btn.textContent = p;
      btn.className = item.sharedBy.includes(p) ? "selected" : "";
      btn.onclick = () => toggleShare(index, p);
      btns.appendChild(btn);
    });

    li.appendChild(btns);
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
  const loadingText = document.getElementById("loadingText");
  loadingText.style.display = "inline";

  setTimeout(() => {
    try {
      const summary = {};
      people.forEach((p) => (summary[p] = 0));

      let subtotal = 0;
      items.forEach((item) => {
        const total = item.qty * item.price;
        subtotal += total;
        const share =
          item.sharedBy.length > 0 ? total / item.sharedBy.length : 0;
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
          amount = (subtotal * parseFloat(val)) / 100;
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
        li.innerHTML = `${name}: <span class="rupiah">${formatRupiah(
          Math.round(total)
        )}</span>`;
        ul.appendChild(li);
      });
    } catch (e) {
      console.error("Terjadi kesalahan:", e);
    } finally {
      loadingText.style.display = "none";
    }
  }, 100); // Delay agar animasi loading terlihat
}

function formatRupiah(number) {
  return number.toLocaleString("id-ID");
}

function resetAll() {
  // Reset input
  document.getElementById("itemName").value = "";
  document.getElementById("itemQty").value = "1";
  document.getElementById("itemPrice").value = "";
  document.getElementById("personName").value = "";
  document.getElementById("delivery").value = "";
  document.getElementById("service").value = "";
  document.getElementById("packing").value = "";
  document.getElementById("tax").value = "";
  document.getElementById("discount").value = "";

  // Reset list
  document.getElementById("itemList").innerHTML = "";
  document.getElementById("personList").innerHTML = "";
  document.getElementById("summaryList").innerHTML = "";

  // Reset variabel global jika ada
  items = [];
  people = [];
  itemIdCounter = 0;
}
