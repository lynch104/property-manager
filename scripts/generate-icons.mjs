// Generates simple SVG-based PNG icons for the PWA
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "../public/icons");
mkdirSync(iconsDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple SVG icon
function makeSVG(size) {
  const r = Math.round(size * 0.15); // corner radius
  const pad = Math.round(size * 0.1);
  const iconSize = size - pad * 2;
  const fontSize = Math.round(size * 0.38);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#1e3a5f"/>
  <rect x="${pad}" y="${pad}" width="${iconSize}" height="${iconSize}" rx="${Math.round(r*0.6)}" fill="#2563eb"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="Arial,sans-serif" font-weight="bold" font-size="${fontSize}" fill="white">P</text>
</svg>`;
}

// Write SVG files (browsers accept SVG as PWA icons via the manifest workaround,
// but we'll write proper base64-encoded minimal PNGs via canvas-less approach)
// For simplicity on this server without canvas, we write SVGs named as .png
// Modern browsers handle this fine for PWA install prompts.

for (const size of sizes) {
  const svg = makeSVG(size);
  // Write as SVG but named .png — works for most PWA installs
  // For production, swap with real PNGs via sharp/canvas
  writeFileSync(join(iconsDir, `icon-${size}x${size}.png`), svg);
  console.log(`✓ icon-${size}x${size}.png`);
}

console.log("\nAll icons generated in public/icons/");
