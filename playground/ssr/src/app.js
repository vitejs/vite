import { escapeHtml } from './utils'

const pathRenderers = {
  '/': renderRoot,
  '/circular-dep': renderCircularDep,
  '/circular-import': renderCircularImport,
  '/forked-deadlock-static-imports': renderForkedDeadlockStaticImports,
  '/forked-deadlock-dynamic-imports': renderForkedDeadlockDynamicImports,
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

async function renderCircularImport(rootDir) {
  const { logA } = await import('./circular-import/index.js')
  return `<div class="circ-import">${escapeHtml(logA())}</div>`
}

async function renderForkedDeadlockStaticImports(rootDir) {
  const { commonModuleExport } = await import('./forked-deadlock/common-module')
  commonModuleExport()
  return `<div class="forked-deadlock-static-imports">rendered</div>`
}

async function renderForkedDeadlockDynamicImports(rootDir) {
  const { commonModuleExport } = await import(
    './forked-deadlock/dynamic-imports/common-module'
  )
  await commonModuleExport()
  return `<div class="forked-deadlock-dynamic-imports">rendered</div>`
}
