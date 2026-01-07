import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [
        react(),
        electron([
            {
                entry: path.resolve(__dirname, 'app/main/main.ts'),
                onstart(options) {
                    options.startup()
                },
                vite: {
                    build: {
                        outDir: path.resolve(__dirname, 'dist-electron/main'),
                        rollupOptions: {
                            external: ['electron']
                        }
                    }
                }
            },
            {
                entry: path.resolve(__dirname, 'app/preload/index.ts'),
                onstart(options) {
                    options.reload()
                },
                vite: {
                    build: {
                        outDir: path.resolve(__dirname, 'dist-electron/preload')
                    }
                }
            }
        ]),
        renderer()
    ],
    root: path.resolve(__dirname, 'app/renderer'),
    base: './',
    build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'app/renderer/src')
        }
    }
})
