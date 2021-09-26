// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior

// eslint-disable-next-line node/no-restricted-require
const execa = require('execa')

// make sure this port is unique
const port = (exports.port = 9510)

const isWindows = process.platform === 'win32'

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
      await printStreamsToConsole('build')
      throw e
    }
  }

  // run `vite --port x` or `vite preview --port x` to start server
  const serverProcess = execa(
    'vite',
    [isProd ? 'preview' : '', '--port', `${port}`],
    {
      preferLocal: true,
      cwd: root,
      stdio: 'pipe'
    }
  )
  collectStreams('server', serverProcess)

  // close server helper, send SIGTERM followed by SIGKILL if needed, give up after 3sec
  const close = async () => {
    if (serverProcess) {
      let timer
      const timerPromise = new Promise(
        (_, reject) =>
          (timer = setTimeout(() => {
            reject(`server process still alive after 3s`)
          }, 3000))
      )

      serverProcess.kill('SIGTERM', { forceKillAfterTimeout: 2000 })
      if (isWindows) {
        execa.commandSync(`taskkill /pid ${serverProcess.pid} /T /F`)
      }

      try {
        await Promise.race([serverProcess, timerPromise]).finally(() => {
          clearTimeout(timer)
        })
      } catch (e) {
        if (!e.killed && !isWindows) {
          collectErrorStreams('server', e)
          console.error('failed to end vite cli process', e)
          await printStreamsToConsole('server')
        }
      }
    }
  }

  try {
    await startedOnPort(serverProcess, port, 3000)
    return {
      close
    }
  } catch (e) {
    console.error('failed to start server', e)
    try {
      await close()
    } catch (e1) {
      console.error('failed to close server process', e1)
    }
  }
}

// helper to validate that server was started on the correct port
async function startedOnPort(serverProcess, port, timeout) {
  let id
  let checkPort
  const timerPromise = new Promise(
    (_, reject) =>
      (id = setTimeout(() => {
        reject(`timeout for server start after ${timeout}`)
      }, timeout))
  )
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
          const msg = `test server started on ${startedPort} instead of ${port}`
          console.log(msg)
          reject(msg)
        }
      }
    }

    serverProcess.stdout.on('data', checkPort)
  })

  return Promise.race([timerPromise, startedPromise]).finally(() => {
    serverProcess.stdout.off('data', checkPort)
    clearTimeout(id)
  })
}
