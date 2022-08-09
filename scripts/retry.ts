/**
 * Retries a command if it outputs one of these errors:
 *  · Check failed: result.second.
 *  · FATAL ERROR: v8::FromJust Maybe value is Nothing.
 *
 * Usage: npx tsx ./retry.ts [-r NUMBER] <cmd>
 *
 * Options:
 *   -r NUMBER    number of retries (default: 3)
 *
 * Arguments:
 *   cmd          command to run
 *
 * Examples:
 *   npx tsx ./retry.ts pnpm test
 *   npx tsx ./retry.ts -r 5 pnpm --color=always test
 */
import path from 'path' // eslint-disable-line
import colors from 'picocolors'
import minimist from 'minimist'
import { execa } from 'execa'

// Node errors seen in Vitest (vitejs/vite#9492)
const ERRORS = [
  'Check failed: result.second.', // nodejs/node#43617
  'FATAL ERROR: v8::FromJust Maybe value is Nothing.' // vitest-dev/vitest#1191
]

type Args = {
  command: string[]
  retries: number
}

function parseArgs(): Args {
  const baseCmd = `npx tsx ./${path.basename(__filename)}`
  const USAGE = `
${colors.bold(
  colors.white('Retries a command if it outputs one of these errors:')
)}
${ERRORS.map((error) => `  · ${colors.red(error)}`).join('\n')}

Usage: ${colors.blue(baseCmd)} ${colors.gray('[-r NUMBER]')} ${colors.gray(
    '<cmd>'
  )}

Options:
  ${colors.gray('-r NUMBER')}    number of retries (default: 3)

Arguments:
  ${colors.gray('cmd')}          command to run

Examples:
  ${colors.blue(baseCmd)} ${colors.gray(`pnpm test`)}
  ${colors.blue(baseCmd)} ${colors.gray(`-r 5 pnpm --color=always test`)}
  `
  const args = minimist(process.argv.slice(2), {
    string: ['r'],
    default: { r: 3 },
    '--': true,
    stopEarly: true
  })

  const showUsageAndExit = (msg: string) => {
    console.error(`${colors.red(msg)}\n${USAGE}`)
    process.exit(1)
  }

  if (args.r && Number.isNaN(Number(args.r))) {
    showUsageAndExit(colors.red('Invalid <r> value'))
  }
  if (!args._.length) {
    showUsageAndExit(colors.red('Missing <cmd> argument'))
  }

  return {
    retries: Number(args.r),
    command: args._
  }
}

function findError(log: string) {
  return log ? ERRORS.find((error) => log.includes(error)) ?? '' : ''
}

async function main({ command, retries }: Args) {
  // default exit code = 100, as in retries were exhausted
  let exitCode = 100

  for (let i = 0; i < retries; i++) {
    const childProc = execa(command![0], command!.slice(1), {
      reject: false,
      all: true
    })
    childProc.all!.pipe(process.stdout)
    const { all: cmdOutput } = await childProc

    const error = findError(cmdOutput ?? '')
    if (error) {
      // use GitHub Action annotation to highlight error
      console.log(`::warning::FLAKE DETECTED: ${error}`)

      console.log(
        colors.black(colors.bgRed(' FLAKE DETECTED: ')) +
          ' ' +
          colors.red(error)
      )
      console.log(
        `${colors.black(colors.bgBlue(' RETRYING: '))} ${colors.gray(
          `(${i + 1} of ${retries})`
        )} ${colors.blue(command.join(' '))}`
      )
    } else {
      exitCode = childProc.exitCode!
      break
    }
  }
  process.exit(exitCode)
}

main(parseArgs())
