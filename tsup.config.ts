import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  clean: true,
  format: ["cjs", "esm"],
  dts: true,
});
