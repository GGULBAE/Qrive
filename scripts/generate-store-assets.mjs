import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import QRCode from "qrcode";
import sharp from "sharp";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const outputDirectory = path.join(projectRoot, "store", "assets");
const iconSvg = await readFile(
  path.join(projectRoot, "assets", "icon.svg"),
  "utf8",
);
const iconDataUri = `data:image/svg+xml;base64,${Buffer.from(iconSvg).toString("base64")}`;

const palette = {
  blue: "#0b57d0",
  blueDark: "#0842a0",
  blueSoft: "#e8f0fe",
  border: "#dfe3e7",
  green: "#188038",
  ink: "#1f1f1f",
  muted: "#5f6368",
  page: "#f8fafd",
  red: "#b3261e",
  white: "#ffffff",
};

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function text({
  x,
  y,
  value,
  size = 16,
  weight = 400,
  fill = palette.ink,
  anchor = "start",
  family = "Arial, sans-serif",
}) {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${escapeXml(value)}</text>`;
}

function qrCode(x, y, size, url) {
  const code = QRCode.create(url, { errorCorrectionLevel: "M" });
  const cells = code.modules.size;
  const quietZone = 2;
  const totalCells = cells + quietZone * 2;
  const cellSize = size / totalCells;
  let modules = `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="8" fill="#fff"/>`;

  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      if (code.modules.get(row, column)) {
        modules += `<rect x="${x + (column + quietZone) * cellSize}" y="${y + (row + quietZone) * cellSize}" width="${cellSize + 0.1}" height="${cellSize + 0.1}" fill="${palette.ink}"/>`;
      }
    }
  }

  return modules;
}

function qrButton(x, y, active = false) {
  const fill = active ? palette.blueSoft : "transparent";
  const stroke = active ? palette.blue : palette.muted;
  return `
    <circle cx="${x}" cy="${y}" r="17" fill="${fill}"/>
    <g transform="translate(${x - 10} ${y - 10}) scale(.84)" fill="${stroke}">
      <path d="M3 3h8v8H3V3Zm2 2v4h4V5H5Zm8-2h8v8h-8V3Zm2 2v4h4V5h-4ZM3 13h8v8H3v-8Zm2 2v4h4v-4H5Zm8-2h3v3h-3v-3Zm5 0h3v5h-3v-5Zm-5 5h5v3h-5v-3Zm6 1h2v2h-2v-2Z"/>
    </g>`;
}

function sharedIcon(x, y) {
  return `
    <g transform="translate(${x - 12} ${y - 12})" fill="${palette.muted}">
      <circle cx="9" cy="8" r="3.1"/>
      <circle cx="17" cy="9" r="2.7"/>
      <path d="M3 18c0-3.4 2.8-5.6 6-5.6s6 2.2 6 5.6v1H3v-1Zm12.2-4.4c3.1.2 5.3 2 5.3 4.7v.7h-3.7v-1c0-1.7-.6-3.2-1.6-4.4Z"/>
    </g>`;
}

function fileIcon(x, y, color = palette.blue) {
  return `
    <g transform="translate(${x} ${y})">
      <path d="M0 2a2 2 0 0 1 2-2h10l5 5v17a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2Z" fill="${color}"/>
      <path d="M12 0v6h5" fill="#fff" opacity=".72"/>
      <path d="M4 12h9M4 16h9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
    </g>`;
}

function folderIcon(x, y, color = "#f9ab00") {
  return `
    <path d="M${x} ${y + 5}a3 3 0 0 1 3-3h8l3 3h12a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H${x + 3}a3 3 0 0 1-3-3V${y + 5}Z" fill="${color}"/>`;
}

function browserShell() {
  return `
    <rect width="1280" height="800" fill="${palette.page}"/>
    <rect width="1280" height="72" fill="${palette.white}"/>
    <line x1="0" y1="72" x2="1280" y2="72" stroke="${palette.border}"/>
    <circle cx="28" cy="36" r="6" fill="#ea4335"/>
    <circle cx="48" cy="36" r="6" fill="#fbbc04"/>
    <circle cx="68" cy="36" r="6" fill="#34a853"/>
    <rect x="106" y="17" width="1006" height="38" rx="19" fill="#f1f3f4"/>
    ${text({ x: 136, y: 42, value: "drive.google.com/drive/my-drive", size: 14, fill: palette.muted })}
    <circle cx="1236" cy="36" r="18" fill="${palette.blue}"/>
    ${text({ x: 1236, y: 42, value: "Q", size: 16, weight: 700, fill: palette.white, anchor: "middle" })}
    <rect x="0" y="72" width="232" height="728" fill="#f6f8fc"/>
    <rect x="20" y="102" width="154" height="48" rx="18" fill="${palette.white}" filter="url(#softShadow)"/>
    <path d="M46 118v18M37 127h18" stroke="${palette.ink}" stroke-width="2" stroke-linecap="round"/>
    ${text({ x: 71, y: 133, value: "New", size: 15, weight: 600 })}
    <rect x="13" y="177" width="206" height="42" rx="21" fill="${palette.blueSoft}"/>
    <path d="M37 190h18v16H37Z" fill="${palette.blue}"/>
    ${text({ x: 69, y: 204, value: "My Drive", size: 14, weight: 600, fill: palette.blueDark })}
    ${text({ x: 69, y: 252, value: "Shared with me", size: 14, fill: palette.muted })}
    ${text({ x: 69, y: 300, value: "Recent", size: 14, fill: palette.muted })}
    ${text({ x: 69, y: 348, value: "Starred", size: 14, fill: palette.muted })}
    ${text({ x: 69, y: 396, value: "Trash", size: 14, fill: palette.muted })}
    ${text({ x: 270, y: 126, value: "My Drive", size: 25, weight: 500 })}
    <rect x="270" y="150" width="970" height="42" rx="10" fill="${palette.white}"/>
    ${text({ x: 300, y: 177, value: "Name", size: 13, weight: 600, fill: palette.muted })}
    ${text({ x: 770, y: 177, value: "Owner", size: 13, weight: 600, fill: palette.muted })}
    ${text({ x: 938, y: 177, value: "Last modified", size: 13, weight: 600, fill: palette.muted })}
    ${text({ x: 1130, y: 177, value: "File size", size: 13, weight: 600, fill: palette.muted })}
  `;
}

function fileRow({
  y,
  name,
  type = "file",
  owner = "me",
  modified,
  size = "—",
  shared = false,
  selected = false,
  active = false,
}) {
  return `
    <rect x="270" y="${y}" width="970" height="58" fill="${selected ? "#d3e3fd" : palette.white}" stroke="${selected ? palette.blue : palette.border}" stroke-width="${selected ? 2 : 1}"/>
    ${type === "folder" ? folderIcon(296, y + 17) : fileIcon(300, y + 17)}
    ${text({ x: 342, y: y + 36, value: name, size: 15, weight: selected ? 600 : 400 })}
    ${shared ? sharedIcon(622, y + 29) : ""}
    ${shared ? qrButton(670, y + 29, active) : ""}
    ${text({ x: 770, y: y + 36, value: owner, size: 14, fill: palette.muted })}
    ${text({ x: 938, y: y + 36, value: modified, size: 14, fill: palette.muted })}
    ${text({ x: 1130, y: y + 36, value: size, size: 14, fill: palette.muted })}
    ${text({ x: 1214, y: y + 37, value: "⋮", size: 22, fill: palette.muted, anchor: "middle" })}
  `;
}

function popover({ error = false } = {}) {
  const heading = error ? "QR link unavailable" : "Share as QR";
  return `
    <rect x="730" y="102" width="350" height="${error ? 290 : 650}" rx="20" fill="${palette.white}" stroke="${palette.border}" filter="url(#cardShadow)"/>
    ${text({ x: 754, y: 140, value: heading, size: 19, weight: 700 })}
    ${text({ x: 1052, y: 140, value: "×", size: 24, fill: palette.muted, anchor: "middle" })}
    ${text({ x: 754, y: 174, value: "Campaign assets", size: 15, weight: 600 })}
    ${
      error
        ? `
          <rect x="754" y="196" width="302" height="94" rx="12" fill="#fce8e6"/>
          ${text({ x: 770, y: 224, value: "No trusted link found", size: 14, weight: 700, fill: palette.red })}
          ${text({ x: 770, y: 249, value: "Qrive did not create a QR code.", size: 13, fill: palette.red })}
          ${text({ x: 770, y: 271, value: "Open the item and try again.", size: 13, fill: palette.red })}
        `
        : `
          <rect x="754" y="192" width="302" height="286" rx="16" fill="#f6f9fe"/>
          ${qrCode(785, 216, 240, "https://drive.google.com/drive/folders/1QriveStoreDemo")}
          <rect x="754" y="496" width="145" height="42" rx="21" fill="${palette.white}" stroke="#b9bec4"/>
          ${text({ x: 826, y: 522, value: "Copy link", size: 14, weight: 700, fill: palette.blue, anchor: "middle" })}
          <rect x="911" y="496" width="145" height="42" rx="21" fill="${palette.blue}"/>
          ${text({ x: 984, y: 522, value: "Save PNG", size: 14, weight: 700, fill: palette.white, anchor: "middle" })}
          ${text({ x: 754, y: 570, value: "Existing Google Drive permissions", size: 13, fill: palette.muted })}
          ${text({ x: 754, y: 590, value: "continue to apply.", size: 13, fill: palette.muted })}
          <rect x="754" y="622" width="302" height="92" rx="14" fill="${palette.blueSoft}"/>
          <circle cx="779" cy="650" r="12" fill="${palette.blue}"/>
          ${text({ x: 779, y: 655, value: "✓", size: 14, weight: 700, fill: palette.white, anchor: "middle" })}
          ${text({ x: 800, y: 649, value: "Generated locally", size: 13, weight: 700, fill: palette.blueDark })}
          ${text({ x: 800, y: 672, value: "No upload or permission change", size: 12, fill: palette.blueDark })}
        `
    }`;
}

function screenshotOne() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
      <defs>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#3c4043" flood-opacity=".16"/>
        </filter>
        <filter id="cardShadow" x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#3c4043" flood-opacity=".22"/>
        </filter>
      </defs>
      ${browserShell()}
      ${fileRow({ y: 192, name: "Campaign assets", type: "folder", modified: "Today", shared: true, selected: true, active: true })}
      ${fileRow({ y: 250, name: "Launch brief.docx", modified: "Yesterday", size: "42 KB" })}
      ${fileRow({ y: 308, name: "Event signage.pdf", modified: "Jul 20", size: "1.2 MB", shared: true })}
      ${fileRow({ y: 366, name: "Team photos", type: "folder", modified: "Jul 18" })}
      ${fileRow({ y: 424, name: "Readme.txt", modified: "Jul 16", size: "3 KB" })}
      <path d="M705 221h31" stroke="${palette.blue}" stroke-width="2" stroke-linecap="round"/>
      ${popover()}
    </svg>`;
}

function screenshotTwo() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
      <defs>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#3c4043" flood-opacity=".16"/>
        </filter>
        <filter id="cardShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#3c4043" flood-opacity=".20"/>
        </filter>
      </defs>
      ${browserShell()}
      ${fileRow({ y: 192, name: "Campaign assets", type: "folder", modified: "Today", shared: true })}
      ${fileRow({ y: 250, name: "Launch brief.docx", modified: "Yesterday", size: "42 KB" })}
      ${fileRow({ y: 308, name: "Event signage.pdf", modified: "Jul 20", size: "1.2 MB", shared: true, selected: true, active: true })}
      ${fileRow({ y: 366, name: "Team photos", type: "folder", modified: "Jul 18" })}
      ${fileRow({ y: 424, name: "Readme.txt", modified: "Jul 16", size: "3 KB" })}
      <rect x="650" y="370" width="392" height="126" rx="18" fill="${palette.white}" stroke="${palette.border}" filter="url(#cardShadow)"/>
      <path d="M692 370 674 348 726 370Z" fill="${palette.white}"/>
      ${text({ x: 680, y: 406, value: "QR actions only on shared items", size: 19, weight: 700 })}
      ${text({ x: 680, y: 435, value: "Qrive follows Drive's existing shared indicator.", size: 14, fill: palette.muted })}
      ${text({ x: 680, y: 460, value: "It never changes access permissions.", size: 14, fill: palette.muted })}
      <rect x="291" y="532" width="730" height="110" rx="22" fill="${palette.blueSoft}"/>
      <image href="${iconDataUri}" x="320" y="555" width="64" height="64"/>
      ${text({ x: 410, y: 574, value: "One click from a shared link to a scannable QR", size: 20, weight: 700, fill: palette.blueDark })}
      ${text({ x: 410, y: 605, value: "Local processing • no OAuth • no backend", size: 15, fill: palette.blueDark })}
    </svg>`;
}

function screenshotThree() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
      <defs>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#3c4043" flood-opacity=".16"/>
        </filter>
        <filter id="cardShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#3c4043" flood-opacity=".22"/>
        </filter>
      </defs>
      ${browserShell()}
      ${fileRow({ y: 192, name: "Campaign assets", type: "folder", modified: "Today", shared: true, selected: true, active: true })}
      ${fileRow({ y: 250, name: "Launch brief.docx", modified: "Yesterday", size: "42 KB" })}
      ${fileRow({ y: 308, name: "Event signage.pdf", modified: "Jul 20", size: "1.2 MB", shared: true })}
      ${fileRow({ y: 366, name: "Team photos", type: "folder", modified: "Jul 18" })}
      ${popover({ error: true })}
      <rect x="728" y="430" width="356" height="118" rx="18" fill="${palette.blueSoft}"/>
      ${text({ x: 754, y: 466, value: "Trust before convenience", size: 19, weight: 700, fill: palette.blueDark })}
      ${text({ x: 754, y: 495, value: "No verified Drive link means no QR, copy,", size: 14, fill: palette.blueDark })}
      ${text({ x: 754, y: 519, value: "or download action.", size: 14, fill: palette.blueDark })}
    </svg>`;
}

function promoTile() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
      <defs>
        <linearGradient id="promoBg" x1="24" y1="10" x2="420" y2="270" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.blueDark}"/>
          <stop offset="1" stop-color="#052e73"/>
        </linearGradient>
        <filter id="promoShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#001c48" flood-opacity=".35"/>
        </filter>
      </defs>
      <rect width="440" height="280" fill="url(#promoBg)"/>
      <circle cx="390" cy="26" r="120" fill="#5b8def" opacity=".16"/>
      <circle cx="55" cy="278" r="110" fill="#5b8def" opacity=".12"/>
      <image href="${iconDataUri}" x="36" y="36" width="76" height="76" filter="url(#promoShadow)"/>
      ${text({ x: 36, y: 157, value: "Qrive", size: 34, weight: 700, fill: palette.white })}
      ${text({ x: 36, y: 193, value: "Share the link.", size: 21, weight: 600, fill: palette.white })}
      ${text({ x: 36, y: 220, value: "Scan the QR.", size: 21, weight: 600, fill: palette.white })}
      <rect x="283" y="102" width="118" height="118" rx="18" fill="${palette.white}" filter="url(#promoShadow)"/>
      ${qrCode(295, 114, 94, "https://drive.google.com/open?id=1QrivePromo")}
      ${text({ x: 36, y: 256, value: "Local QR links for Drive", size: 13, fill: "#dbe8ff" })}
    </svg>`;
}

function marquee() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
      <defs>
        <linearGradient id="heroBg" x1="70" y1="20" x2="1330" y2="540" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.blueDark}"/>
          <stop offset="1" stop-color="#052e73"/>
        </linearGradient>
        <filter id="heroShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#001c48" flood-opacity=".38"/>
        </filter>
      </defs>
      <rect width="1400" height="560" fill="url(#heroBg)"/>
      <circle cx="1280" cy="40" r="340" fill="#75a7ff" opacity=".12"/>
      <circle cx="140" cy="600" r="300" fill="#75a7ff" opacity=".10"/>
      <image href="${iconDataUri}" x="92" y="92" width="112" height="112" filter="url(#heroShadow)"/>
      ${text({ x: 92, y: 276, value: "Qrive", size: 58, weight: 700, fill: palette.white })}
      ${text({ x: 92, y: 335, value: "QR links for shared Drive items", size: 30, weight: 600, fill: palette.white })}
      ${text({ x: 92, y: 387, value: "Generated locally. Existing permissions stay in control.", size: 20, fill: "#dbe8ff" })}
      <rect x="812" y="62" width="450" height="436" rx="34" fill="${palette.white}" filter="url(#heroShadow)"/>
      ${text({ x: 850, y: 116, value: "Share as QR", size: 24, weight: 700 })}
      ${text({ x: 850, y: 151, value: "Campaign assets", size: 17, weight: 600 })}
      <rect x="850" y="176" width="240" height="240" rx="18" fill="#f6f9fe"/>
      ${qrCode(866, 192, 208, "https://drive.google.com/drive/folders/1QriveMarquee")}
      <rect x="1110" y="206" width="116" height="42" rx="21" fill="${palette.white}" stroke="#b9bec4"/>
      ${text({ x: 1168, y: 232, value: "Copy link", size: 14, weight: 700, fill: palette.blue, anchor: "middle" })}
      <rect x="1110" y="262" width="116" height="42" rx="21" fill="${palette.blue}"/>
      ${text({ x: 1168, y: 288, value: "Save PNG", size: 14, weight: 700, fill: palette.white, anchor: "middle" })}
      ${text({ x: 1110, y: 345, value: "No OAuth", size: 14, weight: 700, fill: palette.green })}
      ${text({ x: 1110, y: 374, value: "No backend", size: 14, weight: 700, fill: palette.green })}
      ${text({ x: 850, y: 457, value: "Google Drive's existing permissions continue to apply.", size: 14, fill: palette.muted })}
    </svg>`;
}

const assets = [
  ["icon-128.png", iconSvg],
  ["screenshot-1-qr-popover-1280x800.png", screenshotOne()],
  ["screenshot-2-shared-items-1280x800.png", screenshotTwo()],
  ["screenshot-3-trusted-links-1280x800.png", screenshotThree()],
  ["small-promo-440x280.png", promoTile()],
  ["marquee-1400x560.png", marquee()],
];

await mkdir(outputDirectory, { recursive: true });
for (const [fileName, svg] of assets) {
  await sharp(Buffer.from(svg))
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .png()
    .toFile(path.join(outputDirectory, fileName));
  console.log(`Created store/assets/${fileName}.`);
}
