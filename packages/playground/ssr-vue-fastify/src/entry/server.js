import { createApp } from '../main'
import { renderToString } from '@vue/server-renderer'
import devalue from '@nuxt/devalue'

export async function render (req, url, manifest, ssrDataKey) {
  const { ctx, app, router } = createApp(req)
  
  app.config.globalProperties[ssrDataKey] = req[ssrDataKey]

  router.push(url)

  await router.isReady()

  const html = await renderToString(app, ctx)
  const preloadLinks = renderPreloadLinks(ctx.modules, manifest)

  return [html, preloadLinks]
}

function renderPreloadLinks (modules, manifest) {
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

function renderPreloadLink(file) {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" crossorigin href="${file}">`
  } else if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`
  } else {
    // TODO
    return ''
  }
}
