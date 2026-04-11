import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "")
	const frontendPort = Number(env.PORT || 5173)
	const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:3001"

	return {
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		server: {
			host: "0.0.0.0",
			port: frontendPort,
			strictPort: true,
			proxy: {
				"/api": {
					target: apiProxyTarget,
					changeOrigin: true,
				},
			},
		},
		preview: {
			host: "0.0.0.0",
			port: frontendPort,
			strictPort: true,
		},
	}
})
