import { escapeHtml } from './utils'

const pathRenderers = {
  '/': renderRoot,
  '/circular-dep': renderCircularDep,
}

export async function render(url, rootDir) {
  const pathname = url.replace(/#[^#]*$/, '').replace(/\?[^?]*$/, '')
  const renderer = pathRenderers[pathname]
  if (renderer) {
    return await renderer(rootDir)
  }
  return '404'
}

async function renderRoot(rootDir) {
  const paths = Object.keys(pathRenderers).filter((key) => key !== '/')
  return `
    <ul>
      ${paths
        .map(
          (path) =>
            `<li><a href="${escapeHtml(path)}">${escapeHtml(path)}</a></li>`,
        )
        .join('\n')}
    </ul>
  `
}

async function renderCircularDep(rootDir) {
  const { getValueAB } = await import('./circular-dep-init/circular-dep-init')
  return `<div class="circ-dep-init">${escapeHtml(getValueAB())}</div>`
}
