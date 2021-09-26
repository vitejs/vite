// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior

// eslint-disable-next-line node/no-restricted-require
const execa = require('execa')

// make sure this port is unique
const port = (exports.port = 9510)

const is_windows = process.platform === 'win32'

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
  const printStreamsToConsole = (name) => {
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
    try {
      const buildProcess = execa('vite', ['build'], {
        preferLocal: true,
        cwd: root,
        stdio: 'pipe'
      })
      collectStreams('build', buildProcess)
      await buildProcess
    } catch (e) {
      collectErrorStreams('build', e)
      printStreamsToConsole('build')
      throw e
    }
  }

  // run `vite --port x` or `vite preview --port x` to start server
  const serverProcess = execa(
    'vite',
    [isProd ? 'preview' : '', '--port', `${port}`, '--strict-port'],
    {
      preferLocal: true,
      cwd: root,
      stdio: 'pipe'
    }
  )
  collectStreams('server', serverProcess)

  // close server helper, send SIGKILL to process group. give up after a timeout of 3 seconds
  const close = async () => {
    if (serverProcess) {
      const killTimeoutMsg = `server process still alive 3s after killing it`
      try {
        killProcess(serverProcess)
        await resolvedOrTimoutError(serverProcess, 3000, killTimeoutMsg)
      } catch (e) {
        if ((!is_windows && !e.killed) || e === killTimeoutMsg) {
          collectErrorStreams('server', e)
          printStreamsToConsole('server')
          console.error('failed to end vite cli process:', e)
        }
      }
    }
  }
  try {
    await resolvedOrTimoutError(
      startedOnPort(serverProcess, port),
      5000,
      `test server failed to start within 5s`
    )
  } catch (e) {
    collectErrorStreams('server', e)
    printStreamsToConsole('server')
    throw e
  }

  return { close }
}

// helper to validate that server was started on the correct port
async function startedOnPort(serverProcess, port) {
  let checkPort
  return new Promise((resolve, reject) => {
    checkPort = (data) => {
      const str = data.toString()
      // hack, console output may contain color code gibberish
      // skip gibberish between localhost: and port number
      const match = str.match(/(http:\/\/localhost:)(?:.*)(\d{4})/)
      if (match) {
        const startedPort = parseInt(match[2], 10)
        if (startedPort === port) {
          serverProcess.stdout.off('data', checkPort)
          resolve()
        } else {
          serverProcess.stdout.off('data', checkPort)
          const msg = `test server started on ${startedPort} instead of ${port}`
          reject(msg)
        }
      }
    }
    serverProcess.stdout.on('data', checkPort)
  })
}

function killProcess(childProcess) {
  childProcess.kill('SIGTERM', { forceKillAfterTimeout: 2000 })
  if (is_windows) {
    execa.commandSync(`taskkill /pid ${childProcess.pid} /T /F`)
  }
}

async function resolvedOrTimoutError(promise, ms, errorMessage) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(errorMessage), ms)
    })
  ]).finally(() => {
    clearTimeout(timer)
  })
}
