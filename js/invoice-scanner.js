const dropZone = document.getElementById("dropZone");
const invoiceInput = document.getElementById("invoiceInput");
const chooseFile = document.getElementById("chooseFile");

dropZone.addEventListener("click", () => invoiceInput.click());

chooseFile.addEventListener("click", (e) => {
  e.stopPropagation();
  invoiceInput.click();
});

// drag events
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) {
    invoiceInput.files = e.dataTransfer.files;
    showFileName(file);
    handleInvoice();
  }
});

// handle manual file input
invoiceInput.addEventListener("change", () => {
  if (invoiceInput.files.length > 0) {
    const file = invoiceInput.files[0];
    showFileName(file);
    handleInvoice();
  }
});

function showFileName(file) {
  const fileNameElement = document.getElementById("uploadedFileName");
  if (fileNameElement) {
    fileNameElement.textContent = `📄 ${file.name}`;
  }
}

// Asumsikan items sudah dideklarasikan di script.js

const itemPatterns = [
  // 1. ⚡ Paling spesifik: ShopeeFood satu baris: 2 [fs] paket nasi ayam geprek Rp61184
  /^\s*(\d+)\s+x?\s*(?:\[fs\]\s*)?(.+?)\s+Rp[\s]?([\d.,]+)/i,

  // 2. 2 x Nasi Goreng Rp 20000
  /(\d+)\s*x\s+(.+?)\s+Rp[\s]?([\d.,]+)/i,

  // 3. 2 x Ayam Geprek 15000 (tanpa Rp)
  /(\d+)\s*x\s+(.+?)\s+([\d.,]+)/i,

  // 4. GoFood satu baris: 1 Express Bowl Ayam Asam Manis Rp26.000
  /(\d+)\s+(.+?)\s+Rp[.]?[\s]?([\d.,]+)/i,

  // 5. Format dua baris: Line 1 = nama, Line 2 = qty x RpHarga
  {
    multiLine: true,
    pattern: (lines, index) => {
      const line1 = lines[index];
      const line2 = lines[index + 1];
      const qtyPriceMatch = line2?.match(/(\d+)\s*x\s*Rp[\s]?([\d.,]+)/i);
      if (line1 && qtyPriceMatch) {
        return {
          match: true,
          item: line1.trim(),
          qty: parseInt(qtyPriceMatch[1]),
          price: parseInt(qtyPriceMatch[2].replace(/\./g, "").replace(",", "")),
        };
      }
      return { match: false };
    },
  },

  // 6. ShopeeFood 3-baris
  {
    multiLine: true,
    pattern: (lines, index) => {
      const line1 = lines[index];
      const line2 = lines[index + 2];
      const qtyMatch = line1.match(/^(\d+)\s+(.+)/);
      const priceMatch = line2?.match(/@Rp[\s]?([\d.,]+)[\s]?Rp[\s]?([\d.,]+)/);
      if (qtyMatch && priceMatch) {
        return {
          match: true,
          item: qtyMatch[2].trim(),
          qty: parseInt(qtyMatch[1]),
          price: parseInt(priceMatch[2].replace(/\./g, "").replace(",", "")),
        };
      }
      return { match: false };
    },
  },
];

function handleInvoice() {
  const file = document.getElementById("invoiceInput").files[0];
  if (!file) return;

  const fileType = file.type;

  if (fileType === "application/pdf") {
    const reader = new FileReader();
    reader.onload = function () {
      const loadingTask = pdfjsLib.getDocument({ data: reader.result });
      loadingTask.promise.then((pdf) => {
        pdf.getPage(1).then((page) => {
          const scale = 3; // skala dinaikkan biar OCR lebih akurat
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          page.render(renderContext).promise.then(() => {
            // document.body.appendChild(canvas); // Bisa diaktifkan untuk debug
            const imgDataUrl = canvas.toDataURL("image/png");
            processImageOCR(imgDataUrl);
          });
        });
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    // fallback untuk jpg/png
    const reader = new FileReader();
    reader.onload = function () {
      processImageOCR(reader.result);
    };
    reader.readAsDataURL(file);
  }
}

function processImageOCR(dataUrl) {
  document.getElementById("loadingOverlay").style.display = "flex"; // Tampilkan overlay

  Tesseract.recognize(dataUrl, "eng", {
    tessedit_char_whitelist:
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZRp.xX",
    logger: (m) => console.log(m),
  })
    .then(({ data: { text } }) => {
      console.log("Hasil OCR:\n", text);
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);
      parseInvoiceLines(lines);
    })
    .catch((err) => {
      console.error("❌ OCR Error:", err);
      alert("Terjadi kesalahan saat memproses OCR. Coba lagi.");
    })
    .finally(() => {
      document.getElementById("loadingOverlay").style.display = "none"; // Sembunyikan overlay
    });
}

function parseInvoiceLines(lines) {
  console.log("🧾 Lines hasil OCR:", lines);
  items = [];

  const ignoreKeywords = [
    "subtotal",
    "total",
    "ongkir",
    "biaya layanan",
    "diskon",
    "pajak",
    "voucher",
    "pembulatan",
    "grand total",
    "jumlah",
    "harga",
    "menu",
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // ❌ Skip baris jika mengandung keyword yang harus diabaikan
    if (ignoreKeywords.some((keyword) => line.includes(keyword))) {
      console.log("🚫 Dilewati (bukan item):", lines[i]);
      continue;
    }

    let matched = false;

    for (const pattern of itemPatterns) {
      if (typeof pattern === "object" && pattern.multiLine) {
        const result = pattern.pattern(lines, i);
        if (result.match) {
          items.push({
            name: result.item,
            qty: result.qty,
            price: result.price,
            sharedBy: [],
          });
          i += pattern === specific3BarisPattern ? 2 : 1;
          matched = true;
          break;
        }
      } else {
        const match = line.match(pattern);
        if (match) {
          const [_, qty, name, price] = match;
          items.push({
            name: name.trim(),
            qty: parseInt(qty),
            price: parseInt(price.replace(/[.,]/g, "")),
            sharedBy: [],
          });
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      console.log("❌ Tidak cocok:", line);
    }
  }

  console.log("✅ Parsed items:", items);
  renderItems();
}

window.handleInvoice = handleInvoice;
