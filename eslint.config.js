import js from "@eslint/js";
import globals from "globals";
// Removed: import reactHooks from "eslint-plugin-react-hooks"; - Included in react/recommended
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react"; // Added
import prettierConfig from "eslint-config-prettier"; // Added

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".git"] }, // Added node_modules, .git
  js.configs.recommended, // Moved base JS config out
  ...tseslint.configs.recommended, // Spread TS configs
  {
    // React specific config object
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin, // Use imported plugin
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module", // Added: standard for React/Vite
      globals: {
        ...globals.browser,
        ...globals.es2020, // Added modern globals
      },
      parserOptions: {
        // Added: For JSX
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      // Added: React plugin settings
      react: {
        version: "detect", // Automatically detect React version
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules, // Add React recommended rules
      ...reactPlugin.configs["jsx-runtime"].rules, // Add rules for new JSX runtime
      // Removed: ...reactHooks.configs.recommended.rules, - Included in react/recommended
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ], // Changed to warn, allow unused args starting with _
      // Add other custom rules here if needed
    },
  },
  prettierConfig // Added: MUST be last to override other formatting rules
);
