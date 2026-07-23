import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const typescriptFiles = ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"];
const typedConfigs = tseslint.configs.strictTypeChecked.map((config) => ({
  ...config,
  files: typescriptFiles,
}));

export default tseslint.config(
  {
    ignores: ["artifacts/**", "dist/**", "node_modules/**"],
  },
  eslint.configs.recommended,
  ...typedConfigs,
  {
    files: ["scripts/**/*.mjs", "eslint.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: typescriptFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
    },
  },
);
