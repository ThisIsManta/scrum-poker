import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// See https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	root: './edge',
	build: {
		outDir: '../docs',
		sourcemap: process.env.NODE_ENV === 'production',
		chunkSizeWarningLimit: Infinity,
	},
	resolve: {
		alias: {
			'@mui/icons': '@mui/icons/esm',
		},
	},
})
