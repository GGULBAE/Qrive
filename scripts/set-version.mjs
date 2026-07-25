import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error("Usage: pnpm release:version <major.minor.patch>");
}

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const files = ["package.json", "manifest.json"];

for (const file of files) {
  const filePath = path.join(projectRoot, file);
  const contents = await readFile(filePath, "utf8");
  const versionPattern = /("version"\s*:\s*")[^"]+(")/;
  if (!versionPattern.test(contents)) {
    throw new Error(`Could not find a version field in ${file}.`);
  }
  await writeFile(
    filePath,
    contents.replace(versionPattern, `$1${version}$2`),
  );
}

console.log(`Updated package.json and manifest.json to ${version}.`);
