import { cpSync, createReadStream, existsSync } from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

// The 3D map reads the NYC building-model tiles that live in ../areas. Serve them in dev and copy them into dist on build.
const areasDir = path.resolve(__dirname, "../areas")
function nycAreas(): Plugin {
  return {
    name: "nyc-areas",
    configureServer(server) {
      server.middlewares.use("/areas", (req, res, next) => {
        const file = path.join(areasDir, decodeURIComponent((req.url ?? "").split("?")[0]))
        if (!file.startsWith(areasDir) || !existsSync(file)) return next()
        createReadStream(file).pipe(res)
      })
    },
    closeBundle() {
      if (existsSync(areasDir)) cpSync(areasDir, path.resolve(__dirname, "dist/areas"), { recursive: true })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), nycAreas()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
})
