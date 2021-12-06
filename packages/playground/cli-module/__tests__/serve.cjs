// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior

const path = require('path')
// eslint-disable-next-line node/no-restricted-require
const execa = require('execa')
const { workspaceRoot } = require('../../testUtils')

const isWindows = process.platform === 'win32'
const port = (exports.port = 9511) // make sure this port is unique across tests with custom servers
const viteBin = path.join(workspaceRoot, 'packages', 'vite', 'bin', 'vite.js')

/**
 * @param {string} root
 * @param {boolean} isProd
 */
exports.serve = async function serve(root, isProd) {
  // collect stdout and stderr streams from child processes here to avoid interfering with regular jest output
  const streams = {
    build: { out: [], err: [] },
    server: { out: [], err: [] }
  }
  // helpers to collect streams
  const collectStreams = (name, process) => {
    process.stdout.on('data', (d) => streams[name].out.push(d.toString()))
    process.stderr.on('data', (d) => streams[name].err.push(d.toString()))
  }
  const collectErrorStreams = (name, e) => {
    e.stdout && streams[name].out.push(e.stdout)
    e.stderr && streams[name].err.push(e.stderr)
  }

  // helper to output stream content on error
  const printStreamsToConsole = async (name) => {
    const std = streams[name]
    if (std.out && std.out.length > 0) {
      console.log(`stdout of ${name}\n${std.out.join('\n')}\n`)
    }
    if (std.err && std.err.length > 0) {
      console.log(`stderr of ${name}\n${std.err.join('\n')}\n`)
    }
  }

  // only run `vite build` when needed
  if (isProd) {
    const buildCommand = `${viteBin} build`
    try {
      const buildProcess = execa.command(buildCommand, {
        cwd: root,
        stdio: 'pipe'
      })
      collectStreams('build', buildProcess)
      await buildProcess
    } catch (e) {
      console.error(`error while executing cli command "${buildCommand}":`, e)
      collectErrorStreams('build', e)
      await printStreamsToConsole('build')
      throw e
    }
  }

  // run `vite --port x` or `vite preview --port x` to start server
  const viteServerArgs = ['--port', `${port}`, '--strict-port']
  if (isProd) {
    viteServerArgs.unshift('preview')
  }
  const serverCommand = `${viteBin} ${viteServerArgs.join(' ')}`
  const serverProcess = execa.command(serverCommand, {
    cwd: root,
    stdio: 'pipe'
  })
  collectStreams('server', serverProcess)

  // close server helper, send SIGTERM followed by SIGKILL if needed, give up after 3sec
  const close = async () => {
    if (serverProcess) {
      const timeoutError = `server process still alive after 3s`
      try {
        killProcess(serverProcess)
        await resolvedOrTimeout(serverProcess, 3000, timeoutError)
      } catch (e) {
        if (e === timeoutError || (!serverProcess.killed && !isWindows)) {
          collectErrorStreams('server', e)
          console.error(
            `error while killing cli command "${serverCommand}":`,
            e
          )
          await printStreamsToConsole('server')
        }
      }
    }
  }

  try {
    await startedOnPort(serverProcess, port, 3000)
    return { close }
  } catch (e) {
    collectErrorStreams('server', e)
    console.error(`error while executing cli command "${serverCommand}":`, e)
    await printStreamsToConsole('server')
    try {
      await close()
    } catch (e1) {
      console.error(
        `error while killing cli command after failed execute "${serverCommand}":`,
        e1
      )
    }
  }
}

// helper to validate that server was started on the correct port
async function startedOnPort(serverProcess, port, timeout) {
  let checkPort
  const startedPromise = new Promise((resolve, reject) => {
    checkPort = (data) => {
      const str = data.toString()
      // hack, console output may contain color code gibberish
      // skip gibberish between localhost: and port number
      const match = str.match(/(http:\/\/localhost:)(?:.*)(\d{4})/)
      if (match) {
        const startedPort = parseInt(match[2], 10)
        if (startedPort === port) {
          resolve()
        } else {
          const msg = `server listens on port ${startedPort} instead of ${port}`
          reject(msg)
        }
      }
    }
    serverProcess.stdout.on('data', checkPort)
  })
  return resolvedOrTimeout(
    startedPromise,
    timeout,
    `failed to start within ${timeout}ms`
  ).finally(() => serverProcess.stdout.off('data', checkPort))
}

// helper function to kill process, uses taskkill on windows to ensure child process is killed too
function killProcess(serverProcess) {
  if (isWindows) {
    try {
      execa.commandSync(`taskkill /pid ${serverProcess.pid} /T /F`)
    } catch (e) {
      console.error('failed to taskkill:', e)
    }
  } else {
    serverProcess.kill('SIGTERM', { forceKillAfterTimeout: 2000 })
  }
}

// helper function that rejects with errorMessage if promise isn't settled within ms
async function resolvedOrTimeout(promise, ms, errorMessage) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(errorMessage), ms)
    })
  ]).finally(() => {
    clearTimeout(timer)
    timer = null
  })
}
