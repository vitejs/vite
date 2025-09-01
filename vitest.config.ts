import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "$okay",
        replacement: path.resolve(__dirname, "src"),
      },
      {
        find: "$broke",
        replacement: path.resolve(__dirname, "src"),
      },
    ],
  },
});