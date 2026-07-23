import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import sharp from "sharp";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const sourcePath = path.join(projectRoot, "assets", "icon.svg");
const outputDirectory = path.join(projectRoot, "assets", "icons");
const sizes = [16, 32, 48, 128];

export async function generateIcons() {
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all(
    sizes.map(async (size) => {
      await sharp(sourcePath)
        .resize(size, size)
        .png({ compressionLevel: 9, palette: true })
        .toFile(path.join(outputDirectory, `icon-${String(size)}.png`));
    }),
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateIcons();
  console.log(`Generated ${String(sizes.length)} extension icons.`);
}
