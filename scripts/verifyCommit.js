// @ts-check
import { readFileSync } from 'node:fs'
import path from 'node:path'
import colors from 'picocolors'

const msgPath = path.resolve('.git/COMMIT_EDITMSG')
const msg = readFileSync(msgPath, 'utf-8').trim()

const commitRE =
  /^(?:revert: )?(?:feat|fix|docs|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release)(?:\(.+\))?: .{1,50}/

if (!commitRE.test(msg)) {
  console.error(
    `  ${colors.bgRed(colors.white(' ERROR '))} ${colors.red(
      `invalid commit message format.`,
    )}\n\n` +
      colors.red(
        `  Proper commit message format is required for automated changelog generation. Examples:\n\n`,
      ) +
      `    ${colors.green(`feat(dev): add 'comments' option`)}\n` +
      `    ${colors.green(`fix: handle events on blur (close #28)`)}\n\n` +
      colors.red(`  See .github/commit-convention.md for more details.\n`),
  )
  process.exit(1)
}
