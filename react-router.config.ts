import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  // @cloudflare/vite-plugin mengarahkan output vite ke dist/,
  // RR perlu diberi tahu agar server-manifest ditemukan di dist/client.
  buildDirectory: "dist",
  // Wajib untuk integrasi @cloudflare/vite-plugin v1.x: RR memakai
  // Vite Environment API sehingga mengikuti outDir environment "ssr".
  future: {
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
