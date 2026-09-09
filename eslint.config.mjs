import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // src/studio is the ported Modular Interior CAD 3D Studio codebase.
    // It has its own upstream conventions (permissive typing around the
    // Excel/CAD interop layer, generated ids in event handlers); relax the
    // house style rules here rather than mechanically rewriting a large,
    // working third-party engine for stylistic-only gain.
    files: ["src/studio/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/purity": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "prefer-const": "off",
    },
  },
]);

export default eslintConfig;
