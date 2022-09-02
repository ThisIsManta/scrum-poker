import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// See https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	root: './edge',
	build: {
		outDir: '../docs',
		assetsDir: './',
		sourcemap: process.env.NODE_ENV === 'production',
		chunkSizeWarningLimit: Infinity,
	},
	resolve: {
		alias: {
			'@mui/icons': '@mui/icons/esm',
		},
	},
	experimental: {
		// See https://vitejs.dev/guide/build.html#advanced-base-options
		renderBuiltUrl: (fileName, { hostType }) => {
			if (hostType === 'html') {
				// Avoid the leading / in the paths because it will not work when deploying to GitHub Pages
				return fileName
			} else {
				return { relative: true }
			}
		},
	},
})
