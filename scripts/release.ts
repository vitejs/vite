import fs from 'node:fs'
import { release } from '@vitejs/release-scripts'
import colors from 'picocolors'
import { ConventionalChangelog, type Preset } from 'conventional-changelog'
import createPreset, {
  DEFAULT_COMMIT_TYPES,
  // @ts-expect-error no types
} from 'conventional-changelog-conventionalcommits'
import { logRecentCommits, updateTemplateVersions } from './releaseUtils'

release({
  repo: 'vite',
  packages: ['vite', 'create-vite', 'plugin-legacy'],
  toTag: (pkg, version) =>
    pkg === 'vite' ? `v${version}` : `${pkg}@${version}`,
  logChangelog: (pkg) => logRecentCommits(pkg),
  generateChangelog: async (pkgName) => {
    if (pkgName === 'create-vite') await updateTemplateVersions()

    console.log(colors.cyan('\nGenerating changelog...'))

    const preset: Preset = await createPreset({
      types: DEFAULT_COMMIT_TYPES.map((t: any) => ({ ...t, hidden: false })),
    })
    preset.writer ??= {}
    preset.writer.headerPartial = `
## {{#if isPatch~}} <small> {{~/if~}}
{{#if @root.linkCompare~}}
  [{{version}}](
  {{~#if @root.repository~}}
    {{~#if @root.host}}
      {{~@root.host}}/
    {{~/if}}
    {{~#if @root.owner}}
      {{~@root.owner}}/
    {{~/if}}
    {{~@root.repository}}
  {{~else}}
    {{~@root.repoUrl}}
  {{~/if~}}
  /compare/{{previousTag}}...{{currentTag}})
{{~else}}
  {{~version}}
{{~/if}}
{{~#if title}} "{{title}}"
{{~/if}}
{{~#if date}} ({{date}})
{{~/if}}
{{~#if isPatch~}} </small> {{~/if}}
`.trim()
    preset.writer.mainTemplate! += '\n'

    const generator = new ConventionalChangelog()
      .readPackage(`packages/${pkgName}/package.json`)
      .config(preset)
      .options({ releaseCount: 1 })
      .commits({ path: `packages/${pkgName}` })
    if (pkgName !== 'vite') {
      generator.tags({ prefix: `${pkgName}@` })
    }

    const originalChangelog = fs.readFileSync(
      `packages/${pkgName}/CHANGELOG.md`,
      'utf-8',
    )

    const writeStream = fs.createWriteStream(`packages/${pkgName}/CHANGELOG.md`)
    for await (const chunk of generator.write()) {
      writeStream.write(chunk)
    }
    writeStream.write(originalChangelog)
  },
})
