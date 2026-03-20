import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    globals: false,
    pool: "forks",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts"],
      exclude: ["lib/db.ts", "lib/email.ts", "lib/auth.ts", "lib/audio-context.tsx"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "tailwindcss": path.resolve(__dirname, "node_modules/tailwindcss"),
    },
  },
});
