import { createVueApp, createReactApp } from './main'
import { renderToString } from '@vue/server-renderer'
import ReacDOMServer from 'react-dom/server'

interface Manifest {
  [key: string]: string[]
}

export async function render(
  url: string,
  manifest: Manifest
): Promise<[string, string]> {
  if (url.startsWith('/vue')) {
    return renderVue(manifest)
  } else if (url.startsWith('/react')) {
    return renderReact()
  } else {
    return [`<a href="/vue">Vue</a> <a href="/react">React</a>`, ``]
  }
}

async function renderReact(): Promise<[string, string]> {
  const app = await createReactApp()
  return [ReacDOMServer.renderToString(app), ``]
}

async function renderVue(manifest: Manifest): Promise<[string, string]> {
  const ctx: any = {}
  const app = await createVueApp()
  const html = await renderToString(app, ctx)
  const preloadLinks = renderPreloadLinks(ctx.modules, manifest)
  return [html, preloadLinks]
}

function renderPreloadLinks(modules: Set<string>, manifest: Manifest): string {
  let links = ''
  const seen = new Set()
  modules.forEach((id) => {
    const files = manifest[id]
    if (files) {
      files.forEach((file) => {
        if (!seen.has(file)) {
          seen.add(file)
          links += renderPreloadLink(file)
        }
      })
    }
  })
  return links
}

function renderPreloadLink(file: string): string {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" crossorigin href="${file}">`
  } else if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`
  } else {
    // TODO
    return ''
  }
}
