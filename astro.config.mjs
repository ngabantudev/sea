// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Static by default. A civic site that prerenders is a civic site that keeps
  // working when the host, the runtime, or the maintainer goes away — see
  // DURABILITY.md, Pillar 1.
  output: "static",
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // `~` is the src root. Kept as an alias rather than relative imports so a
      // component can move between src/components/ui/ and src/components/map/
      // without rewriting every import that points at ~/lib.
      alias: {
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
