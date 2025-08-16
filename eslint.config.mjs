import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    ignores: ["**/node_modules/**", ".next/**", "dist/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "@next/next": nextPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
