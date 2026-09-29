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
    // Vendored agent skills and the Python service are not app code.
    ".claude/**",
    "backend/**",
    // img2threejs pipeline evidence (generator output, not app code).
    ".img2threejs/**",
    // Vendored ThreeUI adapter code (MIT), kept as published.
    "features/threeui/vendor/**",
  ]),
]);

export default eslintConfig;
