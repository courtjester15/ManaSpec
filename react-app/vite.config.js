import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "canonical" ? "/ManaSpec/" : mode === "pages" ? "/ManaSpec/react-spike/" : "./",
  plugins: [react()],
  build: {
    outDir: mode === "canonical" ? "dist-canonical" : "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
}));
