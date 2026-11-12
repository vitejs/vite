import { spawn } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs/promises'
import { expect, onTestFinished, test } from 'vitest'
import { getProcessStartTime } from '../processStartTime'

async function startChild(title = 'vite-starttime') {
  const child = spawn(
    process.execPath,
    [
      '-e',
      `process.title = ${JSON.stringify(title)};
       setInterval(() => {}, 1000);
       process.send('ready');`,
    ],
    { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] },
  )
  const exited = once(child, 'exit')
  onTestFinished(async () => {
    if (child.exitCode == null && child.signalCode == null) child.kill()
    await exited
  })
  await once(child, 'message')
  const pid = child.pid
  if (pid === undefined) throw new Error('Child process did not start')
  return { child, pid, exited }
}

test('reads a stable start time for the current process', async () => {
  const startTime = await getProcessStartTime(process.pid)
  expect(startTime).toBeTypeOf('string')
  expect(await getProcessStartTime(process.pid)).toBe(startTime)
})

test('reads a child start time until the process exits', async () => {
  const { child, pid, exited } = await startChild()
  const startTime = await getProcessStartTime(pid)
  expect(startTime).toBeTypeOf('string')
  expect(await getProcessStartTime(pid)).toBe(startTime)

  child.kill()
  await exited
  expect(await getProcessStartTime(pid)).toBeUndefined()
})

test.runIf(process.platform === 'linux')(
  'reads Linux start time with parentheses and a newline in the process name',
  async () => {
    const title = 'node )\n(worker'
    const { pid } = await startChild(title)
    expect(await fs.readFile(`/proc/${pid}/comm`, 'utf8')).toBe(`${title}\n`)
    const startTime = await getProcessStartTime(pid)
    expect(startTime).toMatch(/^linux:\d+:\d+$/)
    expect(await getProcessStartTime(pid)).toBe(startTime)
  },
)
