import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
	resolve: {
		alias: {
			'@app/shared': path.resolve(import.meta.dirname, '../packages/shared/src/index.ts')
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter({
				runtime: 'nodejs22.x'
			}),
			compilerOptions: {
				// Force runes mode for the project, except for libraries.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			}
		})
	]
});
