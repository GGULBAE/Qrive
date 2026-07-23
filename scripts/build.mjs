import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { build, context } from "esbuild";

import { generateIcons } from "./generate-icons.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const distributionDirectory = path.join(projectRoot, "dist");
const watch = process.argv.includes("--watch");

async function copyStaticFiles() {
  await generateIcons();
  await Promise.all([
    cp(
      path.join(projectRoot, "manifest.json"),
      path.join(distributionDirectory, "manifest.json"),
    ),
    cp(
      path.join(projectRoot, "_locales"),
      path.join(distributionDirectory, "_locales"),
      { recursive: true },
    ),
    cp(
      path.join(projectRoot, "assets", "icons"),
      path.join(distributionDirectory, "icons"),
      { recursive: true },
    ),
  ]);

  const manifestPath = path.join(distributionDirectory, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function prepareDistributionDirectory() {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedDistribution = path.resolve(distributionDirectory);
  if (!resolvedDistribution.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("Refusing to clean a distribution directory outside the project.");
  }
  await rm(resolvedDistribution, { force: true, recursive: true });
  await mkdir(resolvedDistribution, { recursive: true });
  await copyStaticFiles();
}

const buildOptions = {
  bundle: true,
  entryPoints: [path.join(projectRoot, "src", "content-script.ts")],
  format: "iife",
  legalComments: "eof",
  outfile: path.join(distributionDirectory, "content-script.js"),
  platform: "browser",
  target: ["chrome109"],
};

await prepareDistributionDirectory();

if (watch) {
  const buildContext = await context(buildOptions);
  await buildContext.watch();
  console.log("Watching TypeScript sources. Reload the extension after a rebuild.");
} else {
  await build(buildOptions);
  console.log("Built unpacked extension in dist/.");
}
