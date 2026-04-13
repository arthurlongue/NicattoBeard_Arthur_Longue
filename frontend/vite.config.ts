import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

const parsePort = (value: string | undefined, fallbackPort: number, label: string) => {
	if (!value) {
		return fallbackPort
	}

	const parsedPort = Number(value)

	if (Number.isInteger(parsedPort) && parsedPort >= 1 && parsedPort <= 65535) {
		return parsedPort
	}

	throw new Error(`Invalid ${label}: "${value}"`)
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "")
	const frontendPort = parsePort(env.FRONTEND_PORT, 5173, "FRONTEND_PORT")
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
			strictPort: false,
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
			strictPort: false,
		},
	}
})
