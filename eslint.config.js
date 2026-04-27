import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier/flat";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "test-results/**",
      "node_modules/**",
      ".docs/**",
      "docs/**",
      ".worktrees/**",
      ".agents/**",
      ".bp/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "react-hooks/incompatible-library": "off",
      "no-else-return": ["error", { allowElseIf: false }],
      "no-param-reassign": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["src/components/ui/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-else-return": "off",
      "no-param-reassign": "off",
      "react/self-closing-comp": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  prettierConfig,
);
