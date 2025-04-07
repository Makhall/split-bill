// Asumsikan items sudah dideklarasikan di script.js

const itemPatterns = [
  // Contoh: 2 x Ayam Geprek 15.000
  /(\d+)\s*x\s+(.+?)\s+([\d,.]+)/i,

  // Contoh: 2 x Nasi Goreng Rp 20.000
  /(\d+)\s*x\s+(.+?)\s+Rp[\s]?([\d,.]+)/i,

  // Format dua baris (ShopeeFood): Line1 = nama, Line2 = @Rp xxx Rp yyy
  {
    multiLine: true,
    pattern: (lines, index) => {
      const line1 = lines[index];
      const line2 = lines[index + 2];
      const qtyMatch = line1.match(/^(\d+)\s+(.+)/);
      const priceMatch = line2?.match(/@Rp[\s]?([\d,.]+)[\s]?Rp[\s]?([\d,.]+)/);

      if (qtyMatch && priceMatch) {
        return {
          match: true,
          item: qtyMatch[2].trim(),
          qty: parseInt(qtyMatch[1]),
          price: parseInt(priceMatch[2].replace(/\./g, "").replace(",", ".")),
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
          const scale = 2;
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
  Tesseract.recognize(dataUrl, "eng", {
    logger: (m) => console.log(m),
  }).then(({ data: { text } }) => {
    console.log("Hasil OCR:\n", text);
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    parseInvoiceLines(lines);
  });
}

function parseInvoiceLines(lines) {
  console.log("Lines hasil OCR:", lines);
  items = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

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
          i += 2; // skip dua baris tambahan setelah match 3-baris
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

  console.log("Parsed items:", items);
  renderItems();
}

window.handleInvoice = handleInvoice;
