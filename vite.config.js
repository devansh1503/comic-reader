import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const virtualModuleId = 'virtual:comic-pages'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

function scanComicPages(root) {
  const registry = {}
  try {
    for (const entry of readdirSync(join(root, 'public', 'comics'), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      registry[entry.name] = readdirSync(join(root, 'public', 'comics', entry.name))
        .map((file) => file.match(/^(\d+)\.(?:png|jpe?g|webp|avif)$/i))
        .filter(Boolean)
        .map((match) => Number(match[1]))
        .sort((a, b) => a - b)
    }
  } catch {
    // A fresh project may not contain comic folders yet.
  }
  return registry
}

function comicPagesPlugin() {
  let projectRoot
  return {
    name: 'comic-pages',
    configResolved(config) { projectRoot = config.root },
    resolveId(id) { if (id === virtualModuleId) return resolvedVirtualModuleId },
    load(id) {
      if (id === resolvedVirtualModuleId) return `export default ${JSON.stringify(scanComicPages(projectRoot))}`
    },
    configureServer(server) {
      const refresh = (file) => {
        if (!file.startsWith(join(projectRoot, 'public', 'comics'))) return
        const module = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    comicPagesPlugin(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
