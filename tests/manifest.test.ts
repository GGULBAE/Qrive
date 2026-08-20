import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

interface ExtensionManifest {
  readonly content_scripts: ReadonlyArray<{
    readonly js: readonly string[];
    readonly matches: readonly string[];
    readonly run_at?: string;
  }>;
  readonly default_locale?: string;
  readonly manifest_version: number;
  readonly permissions?: readonly string[];
  readonly version: string;
}

interface PackageManifest {
  readonly packageManager: string;
  readonly version: string;
}

function readJson(relativePath: string): unknown {
  const filePath = path.resolve(process.cwd(), relativePath);
  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}

describe("extension manifest", () => {
  const manifest = readJson("manifest.json") as ExtensionManifest;
  const packageManifest = readJson("package.json") as PackageManifest;

  it("is a version-synchronized Manifest V3 extension", () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.version).toBe(packageManifest.version);
    expect(packageManifest.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
  });

  it("limits its static content script to Google Drive", () => {
    expect(manifest.content_scripts).toEqual([
      {
        matches: ["https://drive.google.com/*"],
        js: ["content-script.js"],
        run_at: "document_start",
      },
    ]);
    expect(manifest.permissions).toBeUndefined();
  });

  it("declares the locale required by its locale catalogs", () => {
    expect(manifest.default_locale).toBe("en");
    expect(() => readJson("_locales/en/messages.json")).not.toThrow();
    expect(() => readJson("_locales/ko/messages.json")).not.toThrow();
  });
});
