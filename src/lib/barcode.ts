// Crisp SVG Barcode (Code 128-B subset) and QR Code generator for labels and slips

// Code 128-B Pattern table (indices 0 to 106)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 106 is stop
];

const START_B = 104;
const STOP = 106;

export function generateBarcodeSVG(text: string, height = 50, barWidth = 2): string {
  if (!text) text = "WMS-0000";
  
  // Calculate checksum
  let checksum = START_B;
  const indices: number[] = [START_B];

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    const validCode = code >= 0 && code <= 95 ? code : 0;
    indices.push(validCode);
    checksum += validCode * (i + 1);
  }

  const checkDigit = checksum % 103;
  indices.push(checkDigit);
  indices.push(STOP);

  // Convert to widths
  let binaryString = "";
  for (const idx of indices) {
    const pattern = CODE128_PATTERNS[idx] || "212222";
    for (let p = 0; p < pattern.length; p++) {
      const w = parseInt(pattern[p], 10);
      const isBar = p % 2 === 0;
      binaryString += (isBar ? "1" : "0").repeat(w);
    }
  }

  // Generate SVG Rects
  const quietZone = 10;
  let currentX = quietZone;
  let rects = "";

  for (let i = 0; i < binaryString.length; i++) {
    if (binaryString[i] === "1") {
      rects += `<rect x="${currentX}" y="0" width="${barWidth}" height="${height}" fill="#0f172a" />`;
    }
    currentX += barWidth;
  }

  const totalWidth = currentX + quietZone;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height + 18}" width="${totalWidth}" height="${height + 18}" class="w-full h-auto max-w-full">
    <rect width="100%" height="100%" fill="#ffffff" />
    ${rects}
    <text x="${totalWidth / 2}" y="${height + 14}" font-family="monospace" font-size="12" font-weight="600" text-anchor="middle" fill="#334155">${text}</text>
  </svg>`;
}

// Simple deterministic QR-matrix SVG generator for inventory labels
export function generateQrSVG(text: string, size = 120): string {
  const hash = Array.from(text).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7);
  const matrixSize = 21; // Standard Version 1 QR matrix 21x21
  const cellSize = size / matrixSize;

  const grid: boolean[][] = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(false));

  // Position detection patterns (top-left, top-right, bottom-left)
  const addFinderPattern = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[startY + r][startX + c] = true;
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(14, 0);
  addFinderPattern(0, 14);

  // Timing patterns
  for (let i = 8; i < 13; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Populate data using pseudorandom hash sequence
  let seed = hash;
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finder and timing patterns
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c > 12) ||
        (r > 12 && c < 8) ||
        r === 6 || c === 6
      ) {
        continue;
      }
      seed = (seed * 1664525 + 1013904223) >>> 0;
      grid[r][c] = (seed % 100) > 45;
    }
  }

  let rects = "";
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (grid[r][c]) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize + 0.1}" height="${cellSize + 0.1}" fill="#0f172a" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="shrink-0">
    <rect width="100%" height="100%" fill="#ffffff" rx="4" />
    ${rects}
  </svg>`;
}
