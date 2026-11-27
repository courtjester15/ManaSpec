import globals from "globals";

export default [
  {
    files: ["src/**/*.{js,jsx}", "tools/**/*.mjs", "*.config.{js,mjs}"],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "no-dupe-keys": "warn",
      "no-duplicate-case": "warn",
      "no-undef": "warn",
      "no-unreachable": "warn",
    },
  },
  {
    files: ["src/**/*.{js,jsx}"],
    ignores: ["src/test/**"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["src/**/*.js"],
    rules: {
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
    },
  },
  {
    files: ["src/test/**/*.js", "tools/**/*.mjs", "*.config.{js,mjs}"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["src/domain/**/*.js"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/features/**", "**/persistence/**", "**/services/**", "**/test/**"],
          message: "Domain calculations should receive data from their callers.",
        }],
      }],
    },
  },
];
