/* =========================
   COLOR PALETTE APP CORE
   ========================= */

const paletteContainer = document.getElementById("palette-container");
const categoryButtons = document.querySelectorAll("[data-category]");

let allPalettes = [];
let activeCategory = "all";
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadPalettes();
  setupCategoryFilter();
});

/* =========================
   LOAD JSON
========================= */
async function loadPalettes() {
  try {
    const res = await fetch("palettes.json");
    const data = await res.json();

    // FIX: ensure it's always an array
    allPalettes = Array.isArray(data)
      ? data
      : Object.values(data);

    renderPalettes(allPalettes);
  } catch (err) {
    console.error("Error loading JSON:", err);
  }
}

/* =========================
   RENDER PALETTES
========================= */
function renderPalettes(palettes) {
  paletteContainer.innerHTML = "";

  // FIX: safety check (prevents forEach crash)
  if (!Array.isArray(palettes)) {
    console.error("Palettes is not an array:", palettes);
    return;
  }

  palettes.forEach((palette, index) => {
    const colors = palette.colors || palette; 
    const id = palette.id || index;

    const isFavorite = favorites.includes(id);

    const paletteEl = document.createElement("div");
    paletteEl.className = "palette-card";

    paletteEl.innerHTML = `
      <div class="flex h-20 rounded overflow-hidden cursor-pointer">
        ${colors.map(color => `
          <div class="flex-1 color-box" 
               style="background:${color}" 
               data-color="${color}">
          </div>
        `).join("")}
      </div>

      <div class="flex justify-between items-center mt-2">
        <button class="copy-btn text-sm">Copy</button>

        <button class="fav-btn text-xl" data-id="${id}">
          ${isFavorite ? "★" : "☆"}
        </button>
      </div>
    `;

    paletteContainer.appendChild(paletteEl);

    /* =========================
       COPY COLORS
    ========================= */
    paletteEl.querySelector(".copy-btn").addEventListener("click", () => {
      navigator.clipboard.writeText(colors.join(", "));
      alert("Copied: " + colors.join(", "));
    });

    /* =========================
       CLICK COLOR BOX
    ========================= */
    paletteEl.querySelectorAll(".color-box").forEach(box => {
      box.addEventListener("click", () => {
        navigator.clipboard.writeText(box.dataset.color);
      });
    });

    /* =========================
       FAVORITES
    ========================= */
    paletteEl.querySelector(".fav-btn").addEventListener("click", (e) => {
      const id = palette.id || index;

      if (favorites.includes(id)) {
        favorites = favorites.filter(f => f !== id);
      } else {
        favorites.push(id);
      }

      localStorage.setItem("favorites", JSON.stringify(favorites));
      renderPalettes(filterPalettes(activeCategory));
    });
  });
}

/* =========================
   CATEGORY FILTER
========================= */
function setupCategoryFilter() {
  categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      renderPalettes(filterPalettes(activeCategory));
    });
  });
}

/* =========================
   FILTER LOGIC
========================= */
function filterPalettes(category) {
  if (category === "all") return allPalettes;

  return allPalettes.filter(p => {
    return (p.category || "").toLowerCase() === category;
  });
}