
// =========================
// IMAGE → PALETTE ENGINE
// (PURE FUNCTION ONLY)
// =========================

function extractColors(image) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const size = 80;
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(image, 0, 0, size, size);

  const data = ctx.getImageData(0, 0, size, size).data;
  const colorMap = new Map();

  for (let i = 0; i < data.length; i += 4) {
    let r = Math.round(data[i] / 20) * 20;
    let g = Math.round(data[i + 1] / 20) * 20;
    let b = Math.round(data[i + 2] / 20) * 20;

    const key = `${r},${g},${b}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  const colors = [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([rgb]) => `rgb(${rgb})`);

  return normalize(colors);
}

// ensure 5 colors always
function normalize(colors) {
  const result = [...colors];

  while (result.length < 5) {
    result.push("rgb(200,200,200)");
  }

  return result;
}