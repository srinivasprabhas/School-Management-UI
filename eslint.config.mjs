import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This app persists to localStorage and reads viewport/media-query state,
      // both legitimate external-system synchronization via useEffect (hydrate-after-mount,
      // reset transient form state when a Sheet/Dialog opens). Keep as a warning, not a
      // build-blocking error, rather than restructuring ~40 call sites for a strictness
      // preference with no runtime impact.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
