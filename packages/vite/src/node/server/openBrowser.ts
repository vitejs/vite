/**
 * The following is modified based on source found in
 * https://github.com/facebook/create-react-app
 *
 * MIT Licensed
 * Copyright (c) 2015-present, Facebook, Inc.
 * https://github.com/facebook/create-react-app/blob/master/LICENSE
 *
 */

import { join } from 'node:path'
import { exec } from 'node:child_process'
import type { ExecOptions } from 'node:child_process'
import open from 'open'
import type { Options } from 'open'
import spawn from 'cross-spawn'
import colors from 'picocolors'
import type { Logger } from '../logger'
import { VITE_PACKAGE_DIR } from '../constants'

/**
 * Reads the BROWSER environment variable and decides what to do with it.
 */
export function openBrowser(
  url: string,
  opt: string | true,
  logger: Logger,
): void {
  // The browser executable to open.
  // See https://github.com/sindresorhus/open#app for documentation.
  const browser = typeof opt === 'string' ? opt : process.env.BROWSER || ''
  if (browser.toLowerCase().endsWith('.js')) {
    executeNodeScript(browser, url, logger)
  } else if (browser.toLowerCase() !== 'none') {
    const browserArgs = process.env.BROWSER_ARGS
      ? process.env.BROWSER_ARGS.split(' ')
      : []
    startBrowserProcess(browser, browserArgs, url, logger)
  }
}

function executeNodeScript(scriptPath: string, url: string, logger: Logger) {
  const extraArgs = process.argv.slice(2)
  const child = spawn(process.execPath, [scriptPath, ...extraArgs, url], {
    stdio: 'inherit',
  })
  child.on('close', (code) => {
    if (code !== 0) {
      logger.error(
        colors.red(
          `\nThe script specified as BROWSER environment variable failed.\n\n${colors.cyan(
            scriptPath,
          )} exited with code ${code}.`,
        ),
        { error: null },
      )
    }
  })
}

const supportedChromiumBrowsers = [
  'Google Chrome Canary',
  'Google Chrome Dev',
  'Google Chrome Beta',
  'Google Chrome',
  'Microsoft Edge',
  'Brave Browser',
  'Vivaldi',
  'Chromium',
]

async function startBrowserProcess(
  browser: string | undefined,
  browserArgs: string[],
  url: string,
  logger: Logger,
) {
  // If we're on OS X, the user hasn't specifically
  // requested a different browser, we can try opening
  // a Chromium browser with AppleScript. This lets us reuse an
  // existing tab when possible instead of creating a new one.
  const preferredOSXBrowser =
    browser === 'google chrome' ? 'Google Chrome' : browser
  const shouldTryOpenChromeWithAppleScript =
    process.platform === 'darwin' &&
    (!preferredOSXBrowser ||
      supportedChromiumBrowsers.includes(preferredOSXBrowser))

  if (shouldTryOpenChromeWithAppleScript) {
    try {
      const ps = await execAsync('ps cax')
      const openedBrowser =
        preferredOSXBrowser && ps.includes(preferredOSXBrowser)
          ? preferredOSXBrowser
          : supportedChromiumBrowsers.find((b) => ps.includes(b))
      if (openedBrowser) {
        // Try our best to reuse existing tab with AppleScript
        await execAsync(
          `osascript openChrome.applescript "${url}" "${openedBrowser}"`,
          {
            cwd: join(VITE_PACKAGE_DIR, 'bin'),
          },
        )
        return true
      }
    } catch {
      // Ignore errors
    }
  }

  // Another special case: on OS X, check if BROWSER has been set to "open".
  // In this case, instead of passing the string `open` to `open` function (which won't work),
  // just ignore it (thus ensuring the intended behavior, i.e. opening the system browser):
  // https://github.com/facebook/create-react-app/pull/1690#issuecomment-283518768
  if (process.platform === 'darwin' && browser === 'open') {
    browser = undefined
  }

  // Fallback to open
  // (It will always open new tab)
  try {
    const options: Options = browser
      ? { app: { name: browser, arguments: browserArgs } }
      : {}

    new Promise((_, reject) => {
      open(url, options)
        .then((subprocess) => {
          subprocess.on('error', reject)
        })
        .catch(reject)
    }).catch((err) => {
      logger.error(err.stack || err.message)
    })

    return true
  } catch {
    return false
  }
}

function execAsync(command: string, options?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout) => {
      if (error) {
        reject(error)
      } else {
        resolve(stdout.toString())
      }
    })
  })
}
