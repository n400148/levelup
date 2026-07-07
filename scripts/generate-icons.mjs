import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../public/icons/", import.meta.url));
mkdirSync(OUT, { recursive: true });

// Full-bleed icon: dark card + gradient "LC" mark + circuit accent.
function svgFull() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c97c4a"/>
      <stop offset="100%" stop-color="#dda06b"/>
    </linearGradient>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1a15"/>
      <stop offset="100%" stop-color="#0d0b08"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g stroke="url(#g)" stroke-width="2" opacity="0.35" fill="none">
    <path d="M 60 340 L 150 340 L 180 300 L 210 380 L 240 260 L 270 340 L 452 340"/>
  </g>
  <text x="256" y="300" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="220" text-anchor="middle" fill="url(#g)" letter-spacing="-8">LC</text>
</svg>`;
}

// Maskable icon needs the mark within the ~80% safe zone circle.
function svgMaskable() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c97c4a"/>
      <stop offset="100%" stop-color="#dda06b"/>
    </linearGradient>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1a15"/>
      <stop offset="100%" stop-color="#0d0b08"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <text x="256" y="300" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="170" text-anchor="middle" fill="url(#g)" letter-spacing="-6">LC</text>
</svg>`;
}

const jobs = [
  { name: "icon-192.png", svg: svgFull(), size: 192 },
  { name: "icon-512.png", svg: svgFull(), size: 512 },
  { name: "maskable-512.png", svg: svgMaskable(), size: 512 },
  { name: "apple-touch-icon.png", svg: svgFull(), size: 180 },
];

for (const job of jobs) {
  await sharp(Buffer.from(job.svg)).resize(job.size, job.size).png().toFile(OUT + job.name);
  console.log("wrote", job.name);
}

const PUBLIC = fileURLToPath(new URL("../public/", import.meta.url));
await sharp(Buffer.from(svgFull())).resize(32, 32).png().toFile(PUBLIC + "favicon-32.png");
await sharp(Buffer.from(svgFull())).resize(16, 16).png().toFile(PUBLIC + "favicon-16.png");
console.log("wrote favicons");
