import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    reactRouter(),
  ],
  // Pre-declare agar dep optimizer mem-bundle semuanya dalam SATU pass.
  // Tanpa ini @mantine/core (ditemukan belakangan) memicu pass kedua dan
  // menghasilkan dua copy React di browser (Invalid hook call).
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router',
      'react-router-dom',
      '@mantine/core',
      '@mantine/hooks',
      'lucide-react',
    ],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./app", import.meta.url)),
    },
    // Cegah dua copy React saat dep optimizer mem-bundle @mantine/core
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET ?? "https://sambasku-staging.iamutaki.com",
        changeOrigin: true,
      },
    },
  },
});
