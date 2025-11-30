import fs, { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MagicString from 'magic-string'
import { defineConfig } from 'rolldown'
import { init, parse } from 'es-module-lexer'
import license from 'rollup-plugin-license'
import colors from 'picocolors'

//#region rollupLicensePlugin.ts
const injected_original_dirname$1 = 'D:\\codeRepo\\vite\\packages\\vite'
const injected_original_filename$1 =
  'D:\\codeRepo\\vite\\packages\\vite\\rollupLicensePlugin.ts'
const injected_original_import_meta_url$1 =
  'file:///D:/codeRepo/vite/packages/vite/rollupLicensePlugin.ts'
function licensePlugin(
  licenseFilePath,
  licenseTitle,
  packageName,
  additionalSection,
) {
  const originalPlugin = license({
    thirdParty(dependencies) {
      const coreLicense = fs.readFileSync(
        new URL('../../LICENSE', injected_original_import_meta_url$1),
      )
      const deps = sortDependencies(dependencies)
      const licenses = sortLicenses(
        new Set(dependencies.map((dep) => dep.license).filter(Boolean)),
      )
      let dependencyLicenseTexts = ''
      for (let i = 0; i < deps.length; i++) {
        const licenseText$1 = deps[i].licenseText
        const sameDeps = [deps[i]]
        if (licenseText$1) {
          for (let j = i + 1; j < deps.length; j++) {
            if (licenseText$1 === deps[j].licenseText) {
              sameDeps.push(...deps.splice(j, 1))
              j--
            }
          }
        }
        let text = `## ${sameDeps.map((d) => d.name).join(', ')}\n`
        const depInfos = sameDeps.map((d) => getDependencyInformation(d))
        if (
          depInfos.length > 1 &&
          depInfos.every(
            (info) =>
              info.license === depInfos[0].license &&
              info.names === depInfos[0].names,
          )
        ) {
          const { license: license$1, names } = depInfos[0]
          const repositoryText = depInfos
            .map((info) => info.repository)
            .filter(Boolean)
            .join(', ')
          if (license$1) text += `License: ${license$1}\n`
          if (names) text += `By: ${names}\n`
          if (repositoryText) text += `Repositories: ${repositoryText}\n`
        } else {
          for (let j = 0; j < depInfos.length; j++) {
            const { license: license$1, names, repository } = depInfos[j]
            if (license$1) text += `License: ${license$1}\n`
            if (names) text += `By: ${names}\n`
            if (repository) text += `Repository: ${repository}\n`
            if (j !== depInfos.length - 1) text += '\n'
          }
        }
        if (licenseText$1) {
          text +=
            '\n' +
            licenseText$1
              .trim()
              .replace(/\r\n|\r/g, '\n')
              .split('\n')
              .map((line) => `> ${line}`)
              .join('\n') +
            '\n'
        }
        if (i !== deps.length - 1) {
          text += '\n---------------------------------------\n\n'
        }
        dependencyLicenseTexts += text
      }
      const licenseText =
        `# ${licenseTitle}\n` +
        `${packageName} is released under the MIT license:\n\n` +
        coreLicense +
        `\n` +
        (additionalSection || '') +
        `# Licenses of bundled dependencies\n` +
        `The published ${packageName} artifact additionally contains code with the following licenses:\n` +
        `${licenses.join(', ')}\n\n` +
        `# Bundled dependencies:\n` +
        dependencyLicenseTexts
      const existingLicenseText = fs.readFileSync(licenseFilePath, 'utf-8')
      if (existingLicenseText !== licenseText) {
        fs.writeFileSync(licenseFilePath, licenseText)
        console.warn(
          colors.yellow(
            '\nLICENSE.md updated. You should commit the updated file.\n',
          ),
        )
      }
    },
  })
  for (const hook of ['renderChunk', 'generateBundle']) {
    const originalHook = originalPlugin[hook]
    originalPlugin[hook] = function (...args) {
      if (this.meta.watchMode) return
      return originalHook.apply(this, args)
    }
  }
  return originalPlugin
}
function sortDependencies(dependencies) {
  return dependencies.sort(({ name: nameA }, { name: nameB }) => {
    return nameA > nameB ? 1 : nameB > nameA ? -1 : 0
  })
}
function sortLicenses(licenses) {
  let withParenthesis = []
  let noParenthesis = []
  licenses.forEach((license$1) => {
    if (license$1[0] === '(') {
      withParenthesis.push(license$1)
    } else {
      noParenthesis.push(license$1)
    }
  })
  withParenthesis = withParenthesis.sort()
  noParenthesis = noParenthesis.sort()
  return [...noParenthesis, ...withParenthesis]
}
function getDependencyInformation(dep) {
  const info = {}
  const {
    license: license$1,
    author,
    maintainers,
    contributors,
    repository,
  } = dep
  if (license$1) {
    info.license = license$1
  }
  const names = new Set()
  for (const person of [author, ...maintainers, ...contributors]) {
    const name = typeof person === 'string' ? person : person?.name
    if (name) {
      names.add(name)
    }
  }
  if (names.size > 0) {
    info.names = Array.from(names).join(', ')
  }
  if (repository) {
    info.repository = normalizeGitUrl(
      typeof repository === 'string' ? repository : repository.url,
    )
  }
  return info
}
function normalizeGitUrl(url) {
  url = url
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/(^|\/)[^/]+?@/, '$1')
    .replace(/(\.[^.]+?):/, '$1/')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\//, 'https://')
  if (url.startsWith('github:')) {
    return `https://github.com/${url.slice(7)}`
  } else if (url.startsWith('gitlab:')) {
    return `https://gitlab.com/${url.slice(7)}`
  } else if (url.startsWith('bitbucket:')) {
    return `https://bitbucket.org/${url.slice(10)}`
  } else if (!url.includes(':') && url.split('/').length === 2) {
    return `https://github.com/${url}`
  } else {
    return url.includes('://') ? url : `https://${url}`
  }
}

//#endregion
//#region rolldown.config.ts
const injected_original_dirname = 'D:\\codeRepo\\vite\\packages\\vite'
const injected_original_filename =
  'D:\\codeRepo\\vite\\packages\\vite\\rolldown.config.ts'
const injected_original_import_meta_url =
  'file:///D:/codeRepo/vite/packages/vite/rolldown.config.ts'
const pkg = JSON.parse(
  readFileSync(
    new URL('./package.json', injected_original_import_meta_url),
  ).toString(),
)
const __dirname = fileURLToPath(new URL('.', injected_original_import_meta_url))
const disableSourceMap = !!process.env.DEBUG_DISABLE_SOURCE_MAP
const envConfig = defineConfig({
  input: path.resolve(__dirname, 'src/client/env.ts'),
  platform: 'browser',
  transform: { target: 'es2020' },
  output: {
    dir: path.resolve(__dirname, 'dist'),
    entryFileNames: 'client/env.mjs',
  },
})
const clientConfig = defineConfig({
  input: path.resolve(__dirname, 'src/client/client.ts'),
  platform: 'browser',
  transform: { target: 'es2020' },
  external: ['@vite/env'],
  output: {
    dir: path.resolve(__dirname, 'dist'),
    entryFileNames: 'client/client.mjs',
  },
})
const sharedNodeOptions = defineConfig({
  platform: 'node',
  treeshake: {
    moduleSideEffects: [
      {
        test: /acorn|astring|escape-html/,
        sideEffects: false,
      },
      {
        external: true,
        sideEffects: false,
      },
    ],
    propertyReadSideEffects: false,
  },
  output: {
    dir: './dist',
    entryFileNames: `node/[name].js`,
    chunkFileNames: 'node/chunks/[name].js',
    exports: 'named',
    format: 'esm',
    externalLiveBindings: false,
  },
  onwarn(warning, warn) {
    if (warning.message.includes('Circular dependency')) {
      return
    }
    warn(warning)
  },
})
const nodeConfig = defineConfig({
  ...sharedNodeOptions,
  input: {
    index: path.resolve(__dirname, 'src/node/index.ts'),
    cli: path.resolve(__dirname, 'src/node/cli.ts'),
  },
  external: [
    /^vite\//,
    'fsevents',
    'rollup/parseAst',
    /^tsx\//,
    /^#/,
    'sugarss',
    'supports-color',
    'utf-8-validate',
    'bufferutil',
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.peerDependencies),
  ],
  plugins: [
    shimDepsPlugin({
      'postcss-load-config/src/req.js': [
        {
          src: "const { pathToFileURL } = require('node:url')",
          replacement: `const { fileURLToPath, pathToFileURL } = require('node:url')`,
        },
        {
          src: '__filename',
          replacement: 'fileURLToPath(import.meta.url)',
        },
      ],
      'postcss-import/index.js': [
        {
          src: 'const resolveId = require("./lib/resolve-id")',
          replacement: 'const resolveId = (id) => id',
        },
        {
          src: 'const loadContent = require("./lib/load-content")',
          replacement: 'const loadContent = () => ""',
        },
      ],
      'postcss-import/lib/parse-styles.js': [
        {
          src: 'const resolveId = require("./resolve-id")',
          replacement: 'const resolveId = (id) => id',
        },
      ],
    }),
    buildTimeImportMetaUrlPlugin(),
    licensePlugin(
      path.resolve(__dirname, 'LICENSE.md'),
      'Vite core license',
      'Vite',
    ),
    writeTypesPlugin(),
    enableSourceMapsInWatchModePlugin(),
    externalizeDepsInWatchPlugin(),
  ],
})
const moduleRunnerConfig = defineConfig({
  ...sharedNodeOptions,
  input: {
    'module-runner': path.resolve(__dirname, 'src/module-runner/index.ts'),
  },
  external: [
    'fsevents',
    'lightningcss',
    'rollup/parseAst',
    ...Object.keys(pkg.dependencies),
  ],
  plugins: [bundleSizeLimit(54), enableSourceMapsInWatchModePlugin()],
  output: {
    ...sharedNodeOptions.output,
    minify: {
      compress: true,
      mangle: false,
      codegen: false,
    },
  },
})
var rolldown_config_default = defineConfig([
  envConfig,
  clientConfig,
  nodeConfig,
  moduleRunnerConfig,
])
function enableSourceMapsInWatchModePlugin() {
  return {
    name: 'enable-source-maps',
    outputOptions(options) {
      if (this.meta.watchMode && !disableSourceMap) {
        options.sourcemap = 'inline'
      }
    },
  }
}
function writeTypesPlugin() {
  return {
    name: 'write-types',
    async writeBundle() {
      if (this.meta.watchMode) {
        writeFileSync(
          'dist/node/index.d.ts',
          "export * from '../../src/node/index.ts'",
        )
        writeFileSync(
          'dist/node/module-runner.d.ts',
          "export * from '../../src/module-runner/index.ts'",
        )
      }
    },
  }
}
function externalizeDepsInWatchPlugin() {
  return {
    name: 'externalize-deps-in-watch',
    options(options) {
      if (this.meta.watchMode) {
        options.external ||= []
        if (!Array.isArray(options.external))
          throw new Error('external must be an array')
        options.external = options.external.concat(
          Object.keys(pkg.devDependencies),
        )
      }
    },
  }
}
function shimDepsPlugin(deps) {
  const transformed = {}
  return {
    name: 'shim-deps',
    transform: {
      filter: { id: new RegExp(`(?:${Object.keys(deps).join('|')})$`) },
      handler(code, id) {
        const file = Object.keys(deps).find((file$1) =>
          id.replace(/\\/g, '/').endsWith(file$1),
        )
        if (!file) return
        for (const { src, replacement, pattern } of deps[file]) {
          const magicString = new MagicString(code)
          if (src) {
            const pos = code.indexOf(src)
            if (pos < 0) {
              this.error(
                `Could not find expected src "${src}" in file "${file}"`,
              )
            }
            transformed[file] = true
            magicString.overwrite(pos, pos + src.length, replacement)
          }
          if (pattern) {
            let match
            while ((match = pattern.exec(code))) {
              transformed[file] = true
              const start = match.index
              const end = start + match[0].length
              let _replacement = replacement
              for (let i = 1; i <= match.length; i++) {
                _replacement = _replacement.replace(`$${i}`, match[i] || '')
              }
              magicString.overwrite(start, end, _replacement)
            }
            if (!transformed[file]) {
              this.error(
                `Could not find expected pattern "${pattern}" in file "${file}"`,
              )
            }
          }
          code = magicString.toString()
        }
        console.log(`shimmed: ${file}`)
        return code
      },
    },
    buildEnd(err) {
      if (this.meta.watchMode) return
      if (!err) {
        for (const file in deps) {
          if (!transformed[file]) {
            this.error(
              `Did not find "${file}" which is supposed to be shimmed, was the file renamed?`,
            )
          }
        }
      }
    },
  }
}
function buildTimeImportMetaUrlPlugin() {
  const idMap = {}
  let lastIndex = 0
  const prefix = `__vite_buildTimeImportMetaUrl_`
  const keepCommentRE = /\/\*\*\s*[#@]__KEEP__\s*\*\/\s*$/
  return {
    name: 'import-meta-current-dirname',
    transform: {
      filter: { code: 'import.meta.url' },
      async handler(code, id) {
        const relativeId = path.relative(__dirname, id).replaceAll('\\', '/')
        if (!relativeId.startsWith('src/')) return
        let index
        if (idMap[id]) {
          index = idMap[id]
        } else {
          index = idMap[id] = lastIndex
          lastIndex++
        }
        await init
        const s = new MagicString(code)
        const [imports] = parse(code)
        for (const { t, ss, se } of imports) {
          if (t === 3 && code.slice(se, se + 4) === '.url') {
            if (keepCommentRE.test(code.slice(0, ss))) {
              keepCommentRE.lastIndex = 0
              continue
            }
            s.overwrite(ss, se + 4, `${prefix}${index}`)
          }
        }
        return s.hasChanged() ? s.toString() : undefined
      },
    },
    renderChunk(code, chunk, outputOptions) {
      if (!code.includes(prefix)) return
      return code.replace(
        /__vite_buildTimeImportMetaUrl_(\d+)/g,
        (_, index) => {
          const originalFile = Object.keys(idMap).find(
            (key) => idMap[key] === +index,
          )
          if (!originalFile) {
            throw new Error(
              `Could not find original file for ${prefix}${index} in ${chunk.fileName}`,
            )
          }
          const outputFile = path.resolve(outputOptions.dir, chunk.fileName)
          const relativePath = path
            .relative(path.dirname(outputFile), originalFile)
            .replaceAll('\\', '/')
          if (outputOptions.format === 'es') {
            return `new URL(${JSON.stringify(relativePath)}, import.meta.url)`
          } else if (outputOptions.format === 'cjs') {
            return `new URL(${JSON.stringify(relativePath)}, require('node:url').pathToFileURL(__filename))`
          } else {
            throw new Error(`Unsupported output format ${outputOptions.format}`)
          }
        },
      )
    },
  }
}
/**
 * Guard the bundle size
 *
 * @param limit size in kB
 */
function bundleSizeLimit(limit) {
  let size = 0
  return {
    name: 'bundle-limit',
    generateBundle(_, bundle) {
      if (this.meta.watchMode) return
      size = Buffer.byteLength(
        Object.values(bundle)
          .map((i) => ('code' in i ? i.code : ''))
          .join(''),
        'utf-8',
      )
    },
    closeBundle() {
      if (this.meta.watchMode) return
      const kb = size / 1e3
      if (kb > limit) {
        this.error(
          `Bundle size exceeded ${limit} kB, current size is ${kb.toFixed(2)}kb.`,
        )
      }
    },
  }
}

//#endregion
export { rolldown_config_default as default }
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sbGRvd24uY29uZmlnLkNxaTB2UWgwLmpzIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbInJvbGx1cExpY2Vuc2VQbHVnaW4udHMiLCJyb2xsZG93bi5jb25maWcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnXG5pbXBvcnQgbGljZW5zZSBmcm9tICdyb2xsdXAtcGx1Z2luLWxpY2Vuc2UnXG5pbXBvcnQgdHlwZSB7IERlcGVuZGVuY3kgfSBmcm9tICdyb2xsdXAtcGx1Z2luLWxpY2Vuc2UnXG5pbXBvcnQgY29sb3JzIGZyb20gJ3BpY29jb2xvcnMnXG5pbXBvcnQgdHlwZSB7IFBsdWdpbiwgUGx1Z2luQ29udGV4dCB9IGZyb20gJ3JvbGx1cCdcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbGljZW5zZVBsdWdpbihcbiAgbGljZW5zZUZpbGVQYXRoOiBzdHJpbmcsXG4gIGxpY2Vuc2VUaXRsZTogc3RyaW5nLFxuICBwYWNrYWdlTmFtZTogc3RyaW5nLFxuICBhZGRpdGlvbmFsU2VjdGlvbj86IHN0cmluZyxcbik6IFBsdWdpbiB7XG4gIGNvbnN0IG9yaWdpbmFsUGx1Z2luID0gbGljZW5zZSh7XG4gICAgdGhpcmRQYXJ0eShkZXBlbmRlbmNpZXMpIHtcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yb2xsdXAvcm9sbHVwL2Jsb2IvbWFzdGVyL2J1aWxkLXBsdWdpbnMvZ2VuZXJhdGUtbGljZW5zZS1maWxlLmpzXG4gICAgICAvLyBNSVQgTGljZW5zZWQgaHR0cHM6Ly9naXRodWIuY29tL3JvbGx1cC9yb2xsdXAvYmxvYi9tYXN0ZXIvTElDRU5TRS1DT1JFLm1kXG4gICAgICBjb25zdCBjb3JlTGljZW5zZSA9IGZzLnJlYWRGaWxlU3luYyhcbiAgICAgICAgbmV3IFVSTCgnLi4vLi4vTElDRU5TRScsIGltcG9ydC5tZXRhLnVybCksXG4gICAgICApXG5cbiAgICAgIGNvbnN0IGRlcHMgPSBzb3J0RGVwZW5kZW5jaWVzKGRlcGVuZGVuY2llcylcbiAgICAgIGNvbnN0IGxpY2Vuc2VzID0gc29ydExpY2Vuc2VzKFxuICAgICAgICBuZXcgU2V0KFxuICAgICAgICAgIGRlcGVuZGVuY2llcy5tYXAoKGRlcCkgPT4gZGVwLmxpY2Vuc2UpLmZpbHRlcihCb29sZWFuKSBhcyBzdHJpbmdbXSxcbiAgICAgICAgKSxcbiAgICAgIClcblxuICAgICAgbGV0IGRlcGVuZGVuY3lMaWNlbnNlVGV4dHMgPSAnJ1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIEZpbmQgZGVwZW5kZW5jaWVzIHdpdGggdGhlIHNhbWUgbGljZW5zZSB0ZXh0IHNvIGl0IGNhbiBiZSBzaGFyZWRcbiAgICAgICAgY29uc3QgbGljZW5zZVRleHQgPSBkZXBzW2ldLmxpY2Vuc2VUZXh0XG4gICAgICAgIGNvbnN0IHNhbWVEZXBzID0gW2RlcHNbaV1dXG4gICAgICAgIGlmIChsaWNlbnNlVGV4dCkge1xuICAgICAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IGRlcHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChsaWNlbnNlVGV4dCA9PT0gZGVwc1tqXS5saWNlbnNlVGV4dCkge1xuICAgICAgICAgICAgICBzYW1lRGVwcy5wdXNoKC4uLmRlcHMuc3BsaWNlKGosIDEpKVxuICAgICAgICAgICAgICBqLS1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGV4dCA9IGAjIyAke3NhbWVEZXBzLm1hcCgoZCkgPT4gZC5uYW1lKS5qb2luKCcsICcpfVxcbmBcbiAgICAgICAgY29uc3QgZGVwSW5mb3MgPSBzYW1lRGVwcy5tYXAoKGQpID0+IGdldERlcGVuZGVuY3lJbmZvcm1hdGlvbihkKSlcblxuICAgICAgICAvLyBJZiBhbGwgc2FtZSBkZXBlbmRlbmNpZXMgaGF2ZSB0aGUgc2FtZSBsaWNlbnNlIGFuZCBjb250cmlidXRvciBuYW1lcywgc2hvdyB0aGVtIG9ubHkgb25jZVxuICAgICAgICBpZiAoXG4gICAgICAgICAgZGVwSW5mb3MubGVuZ3RoID4gMSAmJlxuICAgICAgICAgIGRlcEluZm9zLmV2ZXJ5KFxuICAgICAgICAgICAgKGluZm8pID0+XG4gICAgICAgICAgICAgIGluZm8ubGljZW5zZSA9PT0gZGVwSW5mb3NbMF0ubGljZW5zZSAmJlxuICAgICAgICAgICAgICBpbmZvLm5hbWVzID09PSBkZXBJbmZvc1swXS5uYW1lcyxcbiAgICAgICAgICApXG4gICAgICAgICkge1xuICAgICAgICAgIGNvbnN0IHsgbGljZW5zZSwgbmFtZXMgfSA9IGRlcEluZm9zWzBdXG4gICAgICAgICAgY29uc3QgcmVwb3NpdG9yeVRleHQgPSBkZXBJbmZvc1xuICAgICAgICAgICAgLm1hcCgoaW5mbykgPT4gaW5mby5yZXBvc2l0b3J5KVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oJywgJylcblxuICAgICAgICAgIGlmIChsaWNlbnNlKSB0ZXh0ICs9IGBMaWNlbnNlOiAke2xpY2Vuc2V9XFxuYFxuICAgICAgICAgIGlmIChuYW1lcykgdGV4dCArPSBgQnk6ICR7bmFtZXN9XFxuYFxuICAgICAgICAgIGlmIChyZXBvc2l0b3J5VGV4dCkgdGV4dCArPSBgUmVwb3NpdG9yaWVzOiAke3JlcG9zaXRvcnlUZXh0fVxcbmBcbiAgICAgICAgfVxuICAgICAgICAvLyBFbHNlIHNob3cgZWFjaCBkZXBlbmRlbmN5IHNlcGFyYXRlbHlcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkZXBJbmZvcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgY29uc3QgeyBsaWNlbnNlLCBuYW1lcywgcmVwb3NpdG9yeSB9ID0gZGVwSW5mb3Nbal1cblxuICAgICAgICAgICAgaWYgKGxpY2Vuc2UpIHRleHQgKz0gYExpY2Vuc2U6ICR7bGljZW5zZX1cXG5gXG4gICAgICAgICAgICBpZiAobmFtZXMpIHRleHQgKz0gYEJ5OiAke25hbWVzfVxcbmBcbiAgICAgICAgICAgIGlmIChyZXBvc2l0b3J5KSB0ZXh0ICs9IGBSZXBvc2l0b3J5OiAke3JlcG9zaXRvcnl9XFxuYFxuICAgICAgICAgICAgaWYgKGogIT09IGRlcEluZm9zLmxlbmd0aCAtIDEpIHRleHQgKz0gJ1xcbidcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGljZW5zZVRleHQpIHtcbiAgICAgICAgICB0ZXh0ICs9XG4gICAgICAgICAgICAnXFxuJyArXG4gICAgICAgICAgICBsaWNlbnNlVGV4dFxuICAgICAgICAgICAgICAudHJpbSgpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHJcXG58XFxyL2csICdcXG4nKVxuICAgICAgICAgICAgICAuc3BsaXQoJ1xcbicpXG4gICAgICAgICAgICAgIC5tYXAoKGxpbmUpID0+IGA+ICR7bGluZX1gKVxuICAgICAgICAgICAgICAuam9pbignXFxuJykgK1xuICAgICAgICAgICAgJ1xcbidcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpICE9PSBkZXBzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICB0ZXh0ICs9ICdcXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cXG5cXG4nXG4gICAgICAgIH1cblxuICAgICAgICBkZXBlbmRlbmN5TGljZW5zZVRleHRzICs9IHRleHRcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGljZW5zZVRleHQgPVxuICAgICAgICBgIyAke2xpY2Vuc2VUaXRsZX1cXG5gICtcbiAgICAgICAgYCR7cGFja2FnZU5hbWV9IGlzIHJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZTpcXG5cXG5gICtcbiAgICAgICAgY29yZUxpY2Vuc2UgK1xuICAgICAgICBgXFxuYCArXG4gICAgICAgIChhZGRpdGlvbmFsU2VjdGlvbiB8fCAnJykgK1xuICAgICAgICBgIyBMaWNlbnNlcyBvZiBidW5kbGVkIGRlcGVuZGVuY2llc1xcbmAgK1xuICAgICAgICBgVGhlIHB1Ymxpc2hlZCAke3BhY2thZ2VOYW1lfSBhcnRpZmFjdCBhZGRpdGlvbmFsbHkgY29udGFpbnMgY29kZSB3aXRoIHRoZSBmb2xsb3dpbmcgbGljZW5zZXM6XFxuYCArXG4gICAgICAgIGAke2xpY2Vuc2VzLmpvaW4oJywgJyl9XFxuXFxuYCArXG4gICAgICAgIGAjIEJ1bmRsZWQgZGVwZW5kZW5jaWVzOlxcbmAgK1xuICAgICAgICBkZXBlbmRlbmN5TGljZW5zZVRleHRzXG5cbiAgICAgIGNvbnN0IGV4aXN0aW5nTGljZW5zZVRleHQgPSBmcy5yZWFkRmlsZVN5bmMobGljZW5zZUZpbGVQYXRoLCAndXRmLTgnKVxuICAgICAgaWYgKGV4aXN0aW5nTGljZW5zZVRleHQgIT09IGxpY2Vuc2VUZXh0KSB7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMobGljZW5zZUZpbGVQYXRoLCBsaWNlbnNlVGV4dClcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgIGNvbG9ycy55ZWxsb3coXG4gICAgICAgICAgICAnXFxuTElDRU5TRS5tZCB1cGRhdGVkLiBZb3Ugc2hvdWxkIGNvbW1pdCB0aGUgdXBkYXRlZCBmaWxlLlxcbicsXG4gICAgICAgICAgKSxcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH0sXG4gIH0pXG4gIC8vIHNraXAgZm9yIHdhdGNoIG1vZGVcbiAgZm9yIChjb25zdCBob29rIG9mIFsncmVuZGVyQ2h1bmsnLCAnZ2VuZXJhdGVCdW5kbGUnXSBhcyBjb25zdCkge1xuICAgIGNvbnN0IG9yaWdpbmFsSG9vayA9IG9yaWdpbmFsUGx1Z2luW2hvb2tdIVxuICAgIG9yaWdpbmFsUGx1Z2luW2hvb2tdID0gZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkNvbnRleHQsIC4uLmFyZ3M6IHVua25vd25bXSkge1xuICAgICAgaWYgKHRoaXMubWV0YS53YXRjaE1vZGUpIHJldHVyblxuICAgICAgcmV0dXJuIChvcmlnaW5hbEhvb2sgYXMgRnVuY3Rpb24pLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgfVxuICB9XG4gIHJldHVybiBvcmlnaW5hbFBsdWdpblxufVxuXG5mdW5jdGlvbiBzb3J0RGVwZW5kZW5jaWVzKGRlcGVuZGVuY2llczogRGVwZW5kZW5jeVtdKSB7XG4gIHJldHVybiBkZXBlbmRlbmNpZXMuc29ydCgoeyBuYW1lOiBuYW1lQSB9LCB7IG5hbWU6IG5hbWVCIH0pID0+IHtcbiAgICByZXR1cm4gbmFtZUEhID4gbmFtZUIhID8gMSA6IG5hbWVCISA+IG5hbWVBISA/IC0xIDogMFxuICB9KVxufVxuXG5mdW5jdGlvbiBzb3J0TGljZW5zZXMobGljZW5zZXM6IFNldDxzdHJpbmc+KSB7XG4gIGxldCB3aXRoUGFyZW50aGVzaXM6IHN0cmluZ1tdID0gW11cbiAgbGV0IG5vUGFyZW50aGVzaXM6IHN0cmluZ1tdID0gW11cbiAgbGljZW5zZXMuZm9yRWFjaCgobGljZW5zZSkgPT4ge1xuICAgIGlmIChsaWNlbnNlWzBdID09PSAnKCcpIHtcbiAgICAgIHdpdGhQYXJlbnRoZXNpcy5wdXNoKGxpY2Vuc2UpXG4gICAgfSBlbHNlIHtcbiAgICAgIG5vUGFyZW50aGVzaXMucHVzaChsaWNlbnNlKVxuICAgIH1cbiAgfSlcbiAgd2l0aFBhcmVudGhlc2lzID0gd2l0aFBhcmVudGhlc2lzLnNvcnQoKVxuICBub1BhcmVudGhlc2lzID0gbm9QYXJlbnRoZXNpcy5zb3J0KClcbiAgcmV0dXJuIFsuLi5ub1BhcmVudGhlc2lzLCAuLi53aXRoUGFyZW50aGVzaXNdXG59XG5cbmludGVyZmFjZSBEZXBlbmRlbmN5SW5mbyB7XG4gIGxpY2Vuc2U/OiBzdHJpbmdcbiAgbmFtZXM/OiBzdHJpbmdcbiAgcmVwb3NpdG9yeT86IHN0cmluZ1xufVxuXG5mdW5jdGlvbiBnZXREZXBlbmRlbmN5SW5mb3JtYXRpb24oZGVwOiBEZXBlbmRlbmN5KTogRGVwZW5kZW5jeUluZm8ge1xuICBjb25zdCBpbmZvOiBEZXBlbmRlbmN5SW5mbyA9IHt9XG4gIGNvbnN0IHsgbGljZW5zZSwgYXV0aG9yLCBtYWludGFpbmVycywgY29udHJpYnV0b3JzLCByZXBvc2l0b3J5IH0gPSBkZXBcblxuICBpZiAobGljZW5zZSkge1xuICAgIGluZm8ubGljZW5zZSA9IGxpY2Vuc2VcbiAgfVxuXG4gIGNvbnN0IG5hbWVzID0gbmV3IFNldDxzdHJpbmc+KClcbiAgZm9yIChjb25zdCBwZXJzb24gb2YgW2F1dGhvciwgLi4ubWFpbnRhaW5lcnMsIC4uLmNvbnRyaWJ1dG9yc10pIHtcbiAgICBjb25zdCBuYW1lID0gdHlwZW9mIHBlcnNvbiA9PT0gJ3N0cmluZycgPyBwZXJzb24gOiBwZXJzb24/Lm5hbWVcbiAgICBpZiAobmFtZSkge1xuICAgICAgbmFtZXMuYWRkKG5hbWUpXG4gICAgfVxuICB9XG4gIGlmIChuYW1lcy5zaXplID4gMCkge1xuICAgIGluZm8ubmFtZXMgPSBBcnJheS5mcm9tKG5hbWVzKS5qb2luKCcsICcpXG4gIH1cblxuICBpZiAocmVwb3NpdG9yeSkge1xuICAgIGluZm8ucmVwb3NpdG9yeSA9IG5vcm1hbGl6ZUdpdFVybChcbiAgICAgIHR5cGVvZiByZXBvc2l0b3J5ID09PSAnc3RyaW5nJyA/IHJlcG9zaXRvcnkgOiByZXBvc2l0b3J5LnVybCxcbiAgICApXG4gIH1cblxuICByZXR1cm4gaW5mb1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVHaXRVcmwodXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICB1cmwgPSB1cmxcbiAgICAucmVwbGFjZSgvXmdpdFxcKy8sICcnKVxuICAgIC5yZXBsYWNlKC9cXC5naXQkLywgJycpXG4gICAgLnJlcGxhY2UoLyhefFxcLylbXi9dKz9ALywgJyQxJykgLy8gcmVtb3ZlIFwidXNlckBcIiBmcm9tIFwic3NoOi8vdXNlckBob3N0LmNvbTouLi5cIlxuICAgIC5yZXBsYWNlKC8oXFwuW14uXSs/KTovLCAnJDEvJykgLy8gY2hhbmdlIFwiLmNvbTpcIiB0byBcIi5jb20vXCIgZnJvbSBcInNzaDovL3VzZXJAaG9zdC5jb206Li4uXCJcbiAgICAucmVwbGFjZSgvXmdpdDpcXC9cXC8vLCAnaHR0cHM6Ly8nKVxuICAgIC5yZXBsYWNlKC9ec3NoOlxcL1xcLy8sICdodHRwczovLycpXG4gIGlmICh1cmwuc3RhcnRzV2l0aCgnZ2l0aHViOicpKSB7XG4gICAgcmV0dXJuIGBodHRwczovL2dpdGh1Yi5jb20vJHt1cmwuc2xpY2UoNyl9YFxuICB9IGVsc2UgaWYgKHVybC5zdGFydHNXaXRoKCdnaXRsYWI6JykpIHtcbiAgICByZXR1cm4gYGh0dHBzOi8vZ2l0bGFiLmNvbS8ke3VybC5zbGljZSg3KX1gXG4gIH0gZWxzZSBpZiAodXJsLnN0YXJ0c1dpdGgoJ2JpdGJ1Y2tldDonKSkge1xuICAgIHJldHVybiBgaHR0cHM6Ly9iaXRidWNrZXQub3JnLyR7dXJsLnNsaWNlKDEwKX1gXG4gIH0gZWxzZSBpZiAoIXVybC5pbmNsdWRlcygnOicpICYmIHVybC5zcGxpdCgnLycpLmxlbmd0aCA9PT0gMikge1xuICAgIHJldHVybiBgaHR0cHM6Ly9naXRodWIuY29tLyR7dXJsfWBcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdXJsLmluY2x1ZGVzKCc6Ly8nKSA/IHVybCA6IGBodHRwczovLyR7dXJsfWBcbiAgfVxufVxuIiwiaW1wb3J0IHsgcmVhZEZpbGVTeW5jLCB3cml0ZUZpbGVTeW5jIH0gZnJvbSAnbm9kZTpmcydcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCBNYWdpY1N0cmluZyBmcm9tICdtYWdpYy1zdHJpbmcnXG5pbXBvcnQgdHlwZSB7IFBsdWdpbiB9IGZyb20gJ3JvbGxkb3duJ1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAncm9sbGRvd24nXG5pbXBvcnQgeyBpbml0LCBwYXJzZSB9IGZyb20gJ2VzLW1vZHVsZS1sZXhlcidcbmltcG9ydCBsaWNlbnNlUGx1Z2luIGZyb20gJy4vcm9sbHVwTGljZW5zZVBsdWdpbidcblxuY29uc3QgcGtnID0gSlNPTi5wYXJzZShcbiAgcmVhZEZpbGVTeW5jKG5ldyBVUkwoJy4vcGFja2FnZS5qc29uJywgaW1wb3J0Lm1ldGEudXJsKSkudG9TdHJpbmcoKSxcbilcbmNvbnN0IF9fZGlybmFtZSA9IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLicsIGltcG9ydC5tZXRhLnVybCkpXG5jb25zdCBkaXNhYmxlU291cmNlTWFwID0gISFwcm9jZXNzLmVudi5ERUJVR19ESVNBQkxFX1NPVVJDRV9NQVBcblxuY29uc3QgZW52Q29uZmlnID0gZGVmaW5lQ29uZmlnKHtcbiAgaW5wdXQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvY2xpZW50L2Vudi50cycpLFxuICBwbGF0Zm9ybTogJ2Jyb3dzZXInLFxuICB0cmFuc2Zvcm06IHtcbiAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICB9LFxuICBvdXRwdXQ6IHtcbiAgICBkaXI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdkaXN0JyksXG4gICAgZW50cnlGaWxlTmFtZXM6ICdjbGllbnQvZW52Lm1qcycsXG4gIH0sXG59KVxuXG5jb25zdCBjbGllbnRDb25maWcgPSBkZWZpbmVDb25maWcoe1xuICBpbnB1dDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9jbGllbnQvY2xpZW50LnRzJyksXG4gIHBsYXRmb3JtOiAnYnJvd3NlcicsXG4gIHRyYW5zZm9ybToge1xuICAgIHRhcmdldDogJ2VzMjAyMCcsXG4gIH0sXG4gIGV4dGVybmFsOiBbJ0B2aXRlL2VudiddLFxuICBvdXRwdXQ6IHtcbiAgICBkaXI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdkaXN0JyksXG4gICAgZW50cnlGaWxlTmFtZXM6ICdjbGllbnQvY2xpZW50Lm1qcycsXG4gIH0sXG59KVxuXG5jb25zdCBzaGFyZWROb2RlT3B0aW9ucyA9IGRlZmluZUNvbmZpZyh7XG4gIHBsYXRmb3JtOiAnbm9kZScsXG4gIHRyZWVzaGFrZToge1xuICAgIG1vZHVsZVNpZGVFZmZlY3RzOiBbXG4gICAgICB7XG4gICAgICAgIHRlc3Q6IC9hY29ybnxhc3RyaW5nfGVzY2FwZS1odG1sLyxcbiAgICAgICAgc2lkZUVmZmVjdHM6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgZXh0ZXJuYWw6IHRydWUsXG4gICAgICAgIHNpZGVFZmZlY3RzOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBwcm9wZXJ0eVJlYWRTaWRlRWZmZWN0czogZmFsc2UsXG4gIH0sXG4gIG91dHB1dDoge1xuICAgIGRpcjogJy4vZGlzdCcsXG4gICAgZW50cnlGaWxlTmFtZXM6IGBub2RlL1tuYW1lXS5qc2AsXG4gICAgY2h1bmtGaWxlTmFtZXM6ICdub2RlL2NodW5rcy9bbmFtZV0uanMnLFxuICAgIGV4cG9ydHM6ICduYW1lZCcsXG4gICAgZm9ybWF0OiAnZXNtJyxcbiAgICBleHRlcm5hbExpdmVCaW5kaW5nczogZmFsc2UsXG4gIH0sXG4gIG9ud2Fybih3YXJuaW5nLCB3YXJuKSB7XG4gICAgaWYgKHdhcm5pbmcubWVzc2FnZS5pbmNsdWRlcygnQ2lyY3VsYXIgZGVwZW5kZW5jeScpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgd2Fybih3YXJuaW5nKVxuICB9LFxufSlcblxuY29uc3Qgbm9kZUNvbmZpZyA9IGRlZmluZUNvbmZpZyh7XG4gIC4uLnNoYXJlZE5vZGVPcHRpb25zLFxuICBpbnB1dDoge1xuICAgIGluZGV4OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL25vZGUvaW5kZXgudHMnKSxcbiAgICBjbGk6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvbm9kZS9jbGkudHMnKSxcbiAgfSxcbiAgZXh0ZXJuYWw6IFtcbiAgICAvXnZpdGVcXC8vLFxuICAgICdmc2V2ZW50cycsXG4gICAgJ3JvbGx1cC9wYXJzZUFzdCcsXG4gICAgL150c3hcXC8vLFxuICAgIC9eIy8sXG4gICAgJ3N1Z2Fyc3MnLCAvLyBwb3N0Y3NzLWltcG9ydCAtPiBzdWdhcnNzXG4gICAgJ3N1cHBvcnRzLWNvbG9yJyxcbiAgICAndXRmLTgtdmFsaWRhdGUnLCAvLyB3c1xuICAgICdidWZmZXJ1dGlsJywgLy8gd3NcbiAgICAuLi5PYmplY3Qua2V5cyhwa2cuZGVwZW5kZW5jaWVzKSxcbiAgICAuLi5PYmplY3Qua2V5cyhwa2cucGVlckRlcGVuZGVuY2llcyksXG4gIF0sXG4gIHBsdWdpbnM6IFtcbiAgICBzaGltRGVwc1BsdWdpbih7XG4gICAgICAncG9zdGNzcy1sb2FkLWNvbmZpZy9zcmMvcmVxLmpzJzogW1xuICAgICAgICB7XG4gICAgICAgICAgc3JjOiBcImNvbnN0IHsgcGF0aFRvRmlsZVVSTCB9ID0gcmVxdWlyZSgnbm9kZTp1cmwnKVwiLFxuICAgICAgICAgIHJlcGxhY2VtZW50OiBgY29uc3QgeyBmaWxlVVJMVG9QYXRoLCBwYXRoVG9GaWxlVVJMIH0gPSByZXF1aXJlKCdub2RlOnVybCcpYCxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNyYzogJ19fZmlsZW5hbWUnLFxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICAvLyBwb3N0Y3NzLWltcG9ydCB1c2VzIHRoZSBgcmVzb2x2ZWAgZGVwIGlmIHRoZSBgcmVzb2x2ZWAgb3B0aW9uIGlzIG5vdCBwYXNzZWQuXG4gICAgICAvLyBIb3dldmVyLCB3ZSBhbHdheXMgcGFzcyB0aGUgYHJlc29sdmVgIG9wdGlvbi4gSXQgYWxzbyB1c2VzIGByZWFkLWNhY2hlYCBpZlxuICAgICAgLy8gdGhlIGBsb2FkYCBvcHRpb24gaXMgbm90IHBhc3NlZCwgYnV0IHdlIGFsc28gYWx3YXlzIHBhc3MgdGhlIGBsb2FkYCBvcHRpb24uXG4gICAgICAvLyBSZW1vdmUgdGhlc2UgdHdvIGltcG9ydHMgdG8gYXZvaWQgYnVuZGxpbmcgdGhlbS5cbiAgICAgICdwb3N0Y3NzLWltcG9ydC9pbmRleC5qcyc6IFtcbiAgICAgICAge1xuICAgICAgICAgIHNyYzogJ2NvbnN0IHJlc29sdmVJZCA9IHJlcXVpcmUoXCIuL2xpYi9yZXNvbHZlLWlkXCIpJyxcbiAgICAgICAgICByZXBsYWNlbWVudDogJ2NvbnN0IHJlc29sdmVJZCA9IChpZCkgPT4gaWQnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc3JjOiAnY29uc3QgbG9hZENvbnRlbnQgPSByZXF1aXJlKFwiLi9saWIvbG9hZC1jb250ZW50XCIpJyxcbiAgICAgICAgICByZXBsYWNlbWVudDogJ2NvbnN0IGxvYWRDb250ZW50ID0gKCkgPT4gXCJcIicsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgJ3Bvc3Rjc3MtaW1wb3J0L2xpYi9wYXJzZS1zdHlsZXMuanMnOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzcmM6ICdjb25zdCByZXNvbHZlSWQgPSByZXF1aXJlKFwiLi9yZXNvbHZlLWlkXCIpJyxcbiAgICAgICAgICByZXBsYWNlbWVudDogJ2NvbnN0IHJlc29sdmVJZCA9IChpZCkgPT4gaWQnLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KSxcbiAgICBidWlsZFRpbWVJbXBvcnRNZXRhVXJsUGx1Z2luKCksXG4gICAgbGljZW5zZVBsdWdpbihcbiAgICAgIHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdMSUNFTlNFLm1kJyksXG4gICAgICAnVml0ZSBjb3JlIGxpY2Vuc2UnLFxuICAgICAgJ1ZpdGUnLFxuICAgICksXG4gICAgd3JpdGVUeXBlc1BsdWdpbigpLFxuICAgIGVuYWJsZVNvdXJjZU1hcHNJbldhdGNoTW9kZVBsdWdpbigpLFxuICAgIGV4dGVybmFsaXplRGVwc0luV2F0Y2hQbHVnaW4oKSxcbiAgXSxcbn0pXG5cbmNvbnN0IG1vZHVsZVJ1bm5lckNvbmZpZyA9IGRlZmluZUNvbmZpZyh7XG4gIC4uLnNoYXJlZE5vZGVPcHRpb25zLFxuICBpbnB1dDoge1xuICAgICdtb2R1bGUtcnVubmVyJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9tb2R1bGUtcnVubmVyL2luZGV4LnRzJyksXG4gIH0sXG4gIGV4dGVybmFsOiBbXG4gICAgJ2ZzZXZlbnRzJyxcbiAgICAnbGlnaHRuaW5nY3NzJyxcbiAgICAncm9sbHVwL3BhcnNlQXN0JyxcbiAgICAuLi5PYmplY3Qua2V5cyhwa2cuZGVwZW5kZW5jaWVzKSxcbiAgXSxcbiAgcGx1Z2luczogW2J1bmRsZVNpemVMaW1pdCg1NCksIGVuYWJsZVNvdXJjZU1hcHNJbldhdGNoTW9kZVBsdWdpbigpXSxcbiAgb3V0cHV0OiB7XG4gICAgLi4uc2hhcmVkTm9kZU9wdGlvbnMub3V0cHV0LFxuICAgIG1pbmlmeToge1xuICAgICAgY29tcHJlc3M6IHRydWUsXG4gICAgICBtYW5nbGU6IGZhbHNlLFxuICAgICAgY29kZWdlbjogZmFsc2UsXG4gICAgfSxcbiAgfSxcbn0pXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyhbXG4gIGVudkNvbmZpZyxcbiAgY2xpZW50Q29uZmlnLFxuICBub2RlQ29uZmlnLFxuICBtb2R1bGVSdW5uZXJDb25maWcsXG5dKVxuXG4vLyAjcmVnaW9uIFBsdWdpbnNcblxuZnVuY3Rpb24gZW5hYmxlU291cmNlTWFwc0luV2F0Y2hNb2RlUGx1Z2luKCk6IFBsdWdpbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2VuYWJsZS1zb3VyY2UtbWFwcycsXG4gICAgb3V0cHV0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgICBpZiAodGhpcy5tZXRhLndhdGNoTW9kZSAmJiAhZGlzYWJsZVNvdXJjZU1hcCkge1xuICAgICAgICBvcHRpb25zLnNvdXJjZW1hcCA9ICdpbmxpbmUnXG4gICAgICB9XG4gICAgfSxcbiAgfVxufVxuXG5mdW5jdGlvbiB3cml0ZVR5cGVzUGx1Z2luKCk6IFBsdWdpbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3dyaXRlLXR5cGVzJyxcbiAgICBhc3luYyB3cml0ZUJ1bmRsZSgpIHtcbiAgICAgIGlmICh0aGlzLm1ldGEud2F0Y2hNb2RlKSB7XG4gICAgICAgIHdyaXRlRmlsZVN5bmMoXG4gICAgICAgICAgJ2Rpc3Qvbm9kZS9pbmRleC5kLnRzJyxcbiAgICAgICAgICBcImV4cG9ydCAqIGZyb20gJy4uLy4uL3NyYy9ub2RlL2luZGV4LnRzJ1wiLFxuICAgICAgICApXG4gICAgICAgIHdyaXRlRmlsZVN5bmMoXG4gICAgICAgICAgJ2Rpc3Qvbm9kZS9tb2R1bGUtcnVubmVyLmQudHMnLFxuICAgICAgICAgIFwiZXhwb3J0ICogZnJvbSAnLi4vLi4vc3JjL21vZHVsZS1ydW5uZXIvaW5kZXgudHMnXCIsXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9LFxuICB9XG59XG5cbmZ1bmN0aW9uIGV4dGVybmFsaXplRGVwc0luV2F0Y2hQbHVnaW4oKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnZXh0ZXJuYWxpemUtZGVwcy1pbi13YXRjaCcsXG4gICAgb3B0aW9ucyhvcHRpb25zKSB7XG4gICAgICBpZiAodGhpcy5tZXRhLndhdGNoTW9kZSkge1xuICAgICAgICBvcHRpb25zLmV4dGVybmFsIHx8PSBbXVxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkob3B0aW9ucy5leHRlcm5hbCkpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdleHRlcm5hbCBtdXN0IGJlIGFuIGFycmF5JylcbiAgICAgICAgb3B0aW9ucy5leHRlcm5hbCA9IG9wdGlvbnMuZXh0ZXJuYWwuY29uY2F0KFxuICAgICAgICAgIE9iamVjdC5rZXlzKHBrZy5kZXZEZXBlbmRlbmNpZXMpLFxuICAgICAgICApXG4gICAgICB9XG4gICAgfSxcbiAgfVxufVxuXG5pbnRlcmZhY2UgU2hpbU9wdGlvbnMge1xuICBzcmM/OiBzdHJpbmdcbiAgcmVwbGFjZW1lbnQ6IHN0cmluZ1xuICBwYXR0ZXJuPzogUmVnRXhwXG59XG5cbmZ1bmN0aW9uIHNoaW1EZXBzUGx1Z2luKGRlcHM6IFJlY29yZDxzdHJpbmcsIFNoaW1PcHRpb25zW10+KTogUGx1Z2luIHtcbiAgY29uc3QgdHJhbnNmb3JtZWQ6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge31cblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdzaGltLWRlcHMnLFxuICAgIHRyYW5zZm9ybToge1xuICAgICAgZmlsdGVyOiB7XG4gICAgICAgIGlkOiBuZXcgUmVnRXhwKGAoPzoke09iamVjdC5rZXlzKGRlcHMpLmpvaW4oJ3wnKX0pJGApLFxuICAgICAgfSxcbiAgICAgIGhhbmRsZXIoY29kZSwgaWQpIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IE9iamVjdC5rZXlzKGRlcHMpLmZpbmQoKGZpbGUpID0+XG4gICAgICAgICAgaWQucmVwbGFjZSgvXFxcXC9nLCAnLycpLmVuZHNXaXRoKGZpbGUpLFxuICAgICAgICApXG4gICAgICAgIGlmICghZmlsZSkgcmV0dXJuXG5cbiAgICAgICAgZm9yIChjb25zdCB7IHNyYywgcmVwbGFjZW1lbnQsIHBhdHRlcm4gfSBvZiBkZXBzW2ZpbGVdKSB7XG4gICAgICAgICAgY29uc3QgbWFnaWNTdHJpbmcgPSBuZXcgTWFnaWNTdHJpbmcoY29kZSlcblxuICAgICAgICAgIGlmIChzcmMpIHtcbiAgICAgICAgICAgIGNvbnN0IHBvcyA9IGNvZGUuaW5kZXhPZihzcmMpXG4gICAgICAgICAgICBpZiAocG9zIDwgMCkge1xuICAgICAgICAgICAgICB0aGlzLmVycm9yKFxuICAgICAgICAgICAgICAgIGBDb3VsZCBub3QgZmluZCBleHBlY3RlZCBzcmMgXCIke3NyY31cIiBpbiBmaWxlIFwiJHtmaWxlfVwiYCxcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJhbnNmb3JtZWRbZmlsZV0gPSB0cnVlXG4gICAgICAgICAgICBtYWdpY1N0cmluZy5vdmVyd3JpdGUocG9zLCBwb3MgKyBzcmMubGVuZ3RoLCByZXBsYWNlbWVudClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocGF0dGVybikge1xuICAgICAgICAgICAgbGV0IG1hdGNoXG4gICAgICAgICAgICB3aGlsZSAoKG1hdGNoID0gcGF0dGVybi5leGVjKGNvZGUpKSkge1xuICAgICAgICAgICAgICB0cmFuc2Zvcm1lZFtmaWxlXSA9IHRydWVcbiAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBtYXRjaC5pbmRleFxuICAgICAgICAgICAgICBjb25zdCBlbmQgPSBzdGFydCArIG1hdGNoWzBdLmxlbmd0aFxuICAgICAgICAgICAgICBsZXQgX3JlcGxhY2VtZW50ID0gcmVwbGFjZW1lbnRcbiAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbWF0Y2gubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBfcmVwbGFjZW1lbnQgPSBfcmVwbGFjZW1lbnQucmVwbGFjZShgJCR7aX1gLCBtYXRjaFtpXSB8fCAnJylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBtYWdpY1N0cmluZy5vdmVyd3JpdGUoc3RhcnQsIGVuZCwgX3JlcGxhY2VtZW50KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0cmFuc2Zvcm1lZFtmaWxlXSkge1xuICAgICAgICAgICAgICB0aGlzLmVycm9yKFxuICAgICAgICAgICAgICAgIGBDb3VsZCBub3QgZmluZCBleHBlY3RlZCBwYXR0ZXJuIFwiJHtwYXR0ZXJufVwiIGluIGZpbGUgXCIke2ZpbGV9XCJgLFxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29kZSA9IG1hZ2ljU3RyaW5nLnRvU3RyaW5nKClcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKGBzaGltbWVkOiAke2ZpbGV9YClcblxuICAgICAgICByZXR1cm4gY29kZVxuICAgICAgfSxcbiAgICB9LFxuICAgIGJ1aWxkRW5kKGVycikge1xuICAgICAgaWYgKHRoaXMubWV0YS53YXRjaE1vZGUpIHJldHVyblxuXG4gICAgICBpZiAoIWVycikge1xuICAgICAgICBmb3IgKGNvbnN0IGZpbGUgaW4gZGVwcykge1xuICAgICAgICAgIGlmICghdHJhbnNmb3JtZWRbZmlsZV0pIHtcbiAgICAgICAgICAgIHRoaXMuZXJyb3IoXG4gICAgICAgICAgICAgIGBEaWQgbm90IGZpbmQgXCIke2ZpbGV9XCIgd2hpY2ggaXMgc3VwcG9zZWQgdG8gYmUgc2hpbW1lZCwgd2FzIHRoZSBmaWxlIHJlbmFtZWQ/YCxcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkVGltZUltcG9ydE1ldGFVcmxQbHVnaW4oKTogUGx1Z2luIHtcbiAgY29uc3QgaWRNYXA6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fVxuICBsZXQgbGFzdEluZGV4ID0gMFxuXG4gIGNvbnN0IHByZWZpeCA9IGBfX3ZpdGVfYnVpbGRUaW1lSW1wb3J0TWV0YVVybF9gXG4gIGNvbnN0IGtlZXBDb21tZW50UkUgPSAvXFwvXFwqXFwqXFxzKlsjQF1fX0tFRVBfX1xccypcXCpcXC9cXHMqJC9cblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdpbXBvcnQtbWV0YS1jdXJyZW50LWRpcm5hbWUnLFxuICAgIHRyYW5zZm9ybToge1xuICAgICAgZmlsdGVyOiB7XG4gICAgICAgIGNvZGU6ICdpbXBvcnQubWV0YS51cmwnLFxuICAgICAgfSxcbiAgICAgIGFzeW5jIGhhbmRsZXIoY29kZSwgaWQpIHtcbiAgICAgICAgY29uc3QgcmVsYXRpdmVJZCA9IHBhdGgucmVsYXRpdmUoX19kaXJuYW1lLCBpZCkucmVwbGFjZUFsbCgnXFxcXCcsICcvJylcbiAgICAgICAgLy8gb25seSByZXBsYWNlIGltcG9ydC5tZXRhLnVybCBpbiBzcmMvXG4gICAgICAgIGlmICghcmVsYXRpdmVJZC5zdGFydHNXaXRoKCdzcmMvJykpIHJldHVyblxuXG4gICAgICAgIGxldCBpbmRleDogbnVtYmVyXG4gICAgICAgIGlmIChpZE1hcFtpZF0pIHtcbiAgICAgICAgICBpbmRleCA9IGlkTWFwW2lkXVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluZGV4ID0gaWRNYXBbaWRdID0gbGFzdEluZGV4XG4gICAgICAgICAgbGFzdEluZGV4KytcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IGluaXRcblxuICAgICAgICBjb25zdCBzID0gbmV3IE1hZ2ljU3RyaW5nKGNvZGUpXG4gICAgICAgIGNvbnN0IFtpbXBvcnRzXSA9IHBhcnNlKGNvZGUpXG4gICAgICAgIGZvciAoY29uc3QgeyB0LCBzcywgc2UgfSBvZiBpbXBvcnRzKSB7XG4gICAgICAgICAgaWYgKHQgPT09IDMgJiYgY29kZS5zbGljZShzZSwgc2UgKyA0KSA9PT0gJy51cmwnKSB7XG4gICAgICAgICAgICAvLyBpZ25vcmUgaW1wb3J0Lm1ldGEudXJsIHdpdGggLyoqICNfX0tFRVBfXyAqLyBjb21tZW50XG4gICAgICAgICAgICBpZiAoa2VlcENvbW1lbnRSRS50ZXN0KGNvZGUuc2xpY2UoMCwgc3MpKSkge1xuICAgICAgICAgICAgICBrZWVwQ29tbWVudFJFLmxhc3RJbmRleCA9IDBcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaW1wb3J0Lm1ldGEudXJsXG4gICAgICAgICAgICBzLm92ZXJ3cml0ZShzcywgc2UgKyA0LCBgJHtwcmVmaXh9JHtpbmRleH1gKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcy5oYXNDaGFuZ2VkKCkgPyBzLnRvU3RyaW5nKCkgOiB1bmRlZmluZWRcbiAgICAgIH0sXG4gICAgfSxcbiAgICByZW5kZXJDaHVuayhjb2RlLCBjaHVuaywgb3V0cHV0T3B0aW9ucykge1xuICAgICAgaWYgKCFjb2RlLmluY2x1ZGVzKHByZWZpeCkpIHJldHVyblxuXG4gICAgICByZXR1cm4gY29kZS5yZXBsYWNlKFxuICAgICAgICAvX192aXRlX2J1aWxkVGltZUltcG9ydE1ldGFVcmxfKFxcZCspL2csXG4gICAgICAgIChfLCBpbmRleCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG9yaWdpbmFsRmlsZSA9IE9iamVjdC5rZXlzKGlkTWFwKS5maW5kKFxuICAgICAgICAgICAgKGtleSkgPT4gaWRNYXBba2V5XSA9PT0gK2luZGV4LFxuICAgICAgICAgIClcbiAgICAgICAgICBpZiAoIW9yaWdpbmFsRmlsZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgQ291bGQgbm90IGZpbmQgb3JpZ2luYWwgZmlsZSBmb3IgJHtwcmVmaXh9JHtpbmRleH0gaW4gJHtjaHVuay5maWxlTmFtZX1gLFxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBvdXRwdXRGaWxlID0gcGF0aC5yZXNvbHZlKG91dHB1dE9wdGlvbnMuZGlyISwgY2h1bmsuZmlsZU5hbWUpXG4gICAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aFxuICAgICAgICAgICAgLnJlbGF0aXZlKHBhdGguZGlybmFtZShvdXRwdXRGaWxlKSwgb3JpZ2luYWxGaWxlKVxuICAgICAgICAgICAgLnJlcGxhY2VBbGwoJ1xcXFwnLCAnLycpXG5cbiAgICAgICAgICBpZiAob3V0cHV0T3B0aW9ucy5mb3JtYXQgPT09ICdlcycpIHtcbiAgICAgICAgICAgIHJldHVybiBgbmV3IFVSTCgke0pTT04uc3RyaW5naWZ5KHJlbGF0aXZlUGF0aCl9LCBpbXBvcnQubWV0YS51cmwpYFxuICAgICAgICAgIH0gZWxzZSBpZiAob3V0cHV0T3B0aW9ucy5mb3JtYXQgPT09ICdjanMnKSB7XG4gICAgICAgICAgICByZXR1cm4gYG5ldyBVUkwoJHtKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICAgICAgcmVsYXRpdmVQYXRoLFxuICAgICAgICAgICAgKX0sIHJlcXVpcmUoJ25vZGU6dXJsJykucGF0aFRvRmlsZVVSTChfX2ZpbGVuYW1lKSlgXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgb3V0cHV0IGZvcm1hdCAke291dHB1dE9wdGlvbnMuZm9ybWF0fWApXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgKVxuICAgIH0sXG4gIH1cbn1cblxuLyoqXG4gKiBHdWFyZCB0aGUgYnVuZGxlIHNpemVcbiAqXG4gKiBAcGFyYW0gbGltaXQgc2l6ZSBpbiBrQlxuICovXG5mdW5jdGlvbiBidW5kbGVTaXplTGltaXQobGltaXQ6IG51bWJlcik6IFBsdWdpbiB7XG4gIGxldCBzaXplID0gMFxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2J1bmRsZS1saW1pdCcsXG4gICAgZ2VuZXJhdGVCdW5kbGUoXywgYnVuZGxlKSB7XG4gICAgICBpZiAodGhpcy5tZXRhLndhdGNoTW9kZSkgcmV0dXJuXG5cbiAgICAgIHNpemUgPSBCdWZmZXIuYnl0ZUxlbmd0aChcbiAgICAgICAgT2JqZWN0LnZhbHVlcyhidW5kbGUpXG4gICAgICAgICAgLm1hcCgoaSkgPT4gKCdjb2RlJyBpbiBpID8gaS5jb2RlIDogJycpKVxuICAgICAgICAgIC5qb2luKCcnKSxcbiAgICAgICAgJ3V0Zi04JyxcbiAgICAgIClcbiAgICB9LFxuICAgIGNsb3NlQnVuZGxlKCkge1xuICAgICAgaWYgKHRoaXMubWV0YS53YXRjaE1vZGUpIHJldHVyblxuXG4gICAgICBjb25zdCBrYiA9IHNpemUgLyAxMDAwXG4gICAgICBpZiAoa2IgPiBsaW1pdCkge1xuICAgICAgICB0aGlzLmVycm9yKFxuICAgICAgICAgIGBCdW5kbGUgc2l6ZSBleGNlZWRlZCAke2xpbWl0fSBrQiwgY3VycmVudCBzaXplIGlzICR7a2IudG9GaXhlZChcbiAgICAgICAgICAgIDIsXG4gICAgICAgICAgKX1rYi5gLFxuICAgICAgICApXG4gICAgICB9XG4gICAgfSxcbiAgfVxufVxuXG4vLyAjZW5kcmVnaW9uXG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxNQUFNLDhCQUFpQjtBQUFBLE1BQUEsK0JBQUE7QUFBQSxNQUFBLHNDQUFBO0FBTXZCLFNBQXdCLGNBQ3RCLGlCQUNB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
