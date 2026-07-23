import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import archiver from "archiver";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const distributionDirectory = path.join(projectRoot, "dist");
const artifactsDirectory = path.join(projectRoot, "artifacts");
const packageJson = JSON.parse(
  await readFile(path.join(projectRoot, "package.json"), "utf8"),
);
const archivePath = path.join(
  artifactsDirectory,
  `qrive-v${String(packageJson.version)}.zip`,
);
const fixedDate = new Date("2000-01-01T00:00:00.000Z");

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory);
  const files = [];
  for (const entry of entries.sort()) {
    const absolutePath = path.join(directory, entry);
    const relativePath = path.posix.join(prefix, entry);
    if ((await stat(absolutePath)).isDirectory()) {
      files.push(...(await listFiles(absolutePath, relativePath)));
    } else {
      files.push({ absolutePath, relativePath });
    }
  }
  return files;
}

await mkdir(artifactsDirectory, { recursive: true });
const output = createWriteStream(archivePath);
const archive = archiver("zip", { zlib: { level: 9 } });

const completed = new Promise((resolve, reject) => {
  output.on("close", resolve);
  output.on("error", reject);
  archive.on("error", reject);
});

archive.pipe(output);
for (const file of await listFiles(distributionDirectory)) {
  archive.append(await readFile(file.absolutePath), {
    date: fixedDate,
    mode: 0o644,
    name: file.relativePath,
  });
}
await archive.finalize();
await completed;

console.log(`Created ${path.relative(projectRoot, archivePath)}.`);
