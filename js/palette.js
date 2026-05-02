// =========================
// STATE
// =========================
let palette = [];
let selectedColorIndex = null;

const PALETTE_SIZE = 5;

// =========================
// DOM ELEMENTS
// =========================
const uploadBtn = document.getElementById("uploadBtn");
const imageUpload = document.getElementById("imageUpload");
const previewContainer = document.getElementById("imagePreviewContainer");
const uploadedImage = document.getElementById("uploadedImage");
const removeImageBtn = document.getElementById("removeImageBtn");

// =========================
// INIT
// =========================
window.addEventListener("DOMContentLoaded", () => {
  generatePalette();
});

// =========================
// REMOVE IMAGE
// =========================
function removeImage() {
  uploadedImage.src = "";
  imageUpload.value = "";
  previewContainer.classList.add("hidden");
  generatePalette();
}

removeImageBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  removeImage();
});

// =========================
// UPLOAD HANDLER
// =========================
uploadBtn?.addEventListener("click", () => {
  imageUpload.click();
});

imageUpload?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please upload an image file.");
    return;
  }

  const reader = new FileReader();

  reader.onload = (event) => {
    uploadedImage.src = event.target.result;
    previewContainer.classList.remove("hidden");

    uploadedImage.onload = () => {
      extractColors(uploadedImage);
    };
  };

  reader.readAsDataURL(file);
});

// =========================
// IMAGE → PALETTE
// =========================
function extractColors(image) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const size = 100;
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(image, 0, 0, size, size);

  const data = ctx.getImageData(0, 0, size, size).data;
  const colorMap = new Map();

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = Math.round(r / 25) * 25;
    g = Math.round(g / 25) * 25;
    b = Math.round(b / 25) * 25;

    const key = `${r},${g},${b}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  palette = [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, PALETTE_SIZE)
    .map(([rgb]) => ({
      hex: rgbToHex(rgb),
      locked: false
    }));

  renderPalette();
}

// =========================
// RGB → HEX
// =========================
function rgbToHex(rgb) {
  const [r, g, b] = rgb.split(",").map(Number);
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
}

// =========================
// GENERATE PALETTE
// =========================
function generatePalette() {
  const baseHue = Math.floor(Math.random() * 360);

  const hsl = [
    { h: baseHue, s: 70, l: 50 },
    { h: baseHue + 30, s: 65, l: 55 },
    { h: baseHue + 60, s: 60, l: 45 },
    { h: baseHue + 180, s: 50, l: 40 },
    { h: baseHue + 210, s: 55, l: 60 }
  ];

  if (palette.length === 0) {
    palette = hsl.map(c => ({
      hex: hslToHex(c.h, c.s, c.l),
      locked: false
    }));
    renderPalette();
    return;
  }

  palette = palette.map((color, i) => {
    if (color.locked) return color;

    return {
      hex: hslToHex(hsl[i].h, hsl[i].s, hsl[i].l),
      locked: false
    };
  });

  renderPalette();
}

// =========================
// HSL → HEX
// =========================
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);

  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color =
      l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

// =========================
// MODAL
// =========================
function openModal(index) {
  selectedColorIndex = index;

  const hex = palette[index].hex;

  document.getElementById("colorModal").classList.remove("hidden");
  document.getElementById("colorPicker").value = hex;

  updateModal(hex);
}

function updateModal(hex) {
  document.getElementById("modalColor").style.background = hex;
  document.getElementById("modalHex").textContent = hex.toUpperCase();

  const ratio = getContrast(hex);
  const level = getWCAG(ratio);
  const note = getPairsWith(hex);

  document.getElementById("contrastValue").innerHTML = `
    <div class="contrast-row">
      <span class="contrast-ratio">${ratio.toFixed(2)}:1</span>
      <span class="wcag-badge wcag-${level.toLowerCase().replace(" ", "-")}">
        ${level}
      </span>
    </div>
    <div class="contrast-note">${note}</div>
  `;
}

// =========================
// COPY HEX (FIXED)
// =========================
function copyFromModal(button) {
  const hexElement = document.getElementById("modalHex");
  const hexValue = hexElement.textContent.trim();

  if (!hexValue) return;

  navigator.clipboard.writeText(hexValue)
    .then(() => {
      button.textContent = "Hex Copied!";

      // change text color only (cleaner UI)
      button.classList.remove("text-white");
      button.classList.add("text-green-500");

      setTimeout(() => {
        button.textContent = "Copy HEX";
        button.classList.remove("text-green-500");
        button.classList.add("text-white");
      }, 2000);
    })
    .catch(err => {
      console.error("Failed to copy:", err);
    });
}

function closeModal() {
  document.getElementById("colorModal").classList.add("hidden");
  selectedColorIndex = null;
}

// =========================
// CONTRAST SYSTEM
// =========================
function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

function luminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrast(hex) {
  const { r, g, b } = hexToRgb(hex);
  const l1 = luminance(r, g, b);
  const l2 = 1;

  return (Math.max(l1, l2) + 0.05) /
         (Math.min(l1, l2) + 0.05);
}

function getWCAG(ratio) {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

function getPairsWith(hex) {
  const { r, g, b } = hexToRgb(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 160
    ? "Pairs well with dark text / muted tones"
    : "Pairs well with light text / bold accents";
}

// =========================
// RENDER PALETTE (UPDATED UI)
// =========================
function renderPalette() {
  const container = document.getElementById("palette");
  container.innerHTML = "";

  palette.forEach((color, i) => {
    const card = document.createElement("div");

    // ✅ make relative for positioning
    card.className = `color-card relative ${color.locked ? "locked" : ""}`;
    card.style.background = color.hex;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".lock-btn")) return;
      openModal(i);
    });

    // =========================
    // HEX LABEL (TAILWIND + AUTO CONTRAST)
    // =========================
    const hexLabel = document.createElement("div");

    hexLabel.className = `
      absolute bottom-2 left-2
      text-sm font-semibold px-2 py-1 rounded
      backdrop-blur-sm
    `;

    const { r, g, b } = hexToRgb(color.hex);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    if (brightness > 160) {
      hexLabel.classList.add("text-black", "bg-white/60");
    } else {
      hexLabel.classList.add("text-white", "bg-black/40");
    }

    hexLabel.textContent = color.hex.toUpperCase();

    // =========================
    // LOCK BUTTON
    // =========================
    const lockBtn = document.createElement("button");
    lockBtn.className = "lock-btn";
    lockBtn.innerHTML = color.locked ? "🔒" : "🔓";

    lockBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      palette[i].locked = !palette[i].locked;
      renderPalette();
    });

    card.appendChild(hexLabel);
    card.appendChild(lockBtn);
    container.appendChild(card);
  });
}

// =========================
// EVENTS
// =========================
document.getElementById("generateBtn").addEventListener("click", generatePalette);

document.getElementById("unlockBtn").addEventListener("click", () => {
  palette = palette.map(c => ({ ...c, locked: false }));
  renderPalette();
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    generatePalette();
  }
});

document.getElementById("colorPicker")?.addEventListener("input", (e) => {
  const hex = e.target.value;

  if (selectedColorIndex !== null) {
    palette[selectedColorIndex].hex = hex;
    renderPalette();
    updateModal(hex);
  }
});