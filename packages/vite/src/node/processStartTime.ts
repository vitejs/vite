import fs from 'node:fs/promises'
import { x } from 'tinyexec'

export async function getProcessStartTime(
  pid: number,
): Promise<string | undefined> {
  try {
    if (process.platform === 'linux') {
      const [stat, systemStat] = await Promise.all([
        fs.readFile(`/proc/${pid}/stat`, 'utf8'),
        fs.readFile('/proc/stat', 'utf8'),
      ])
      // The parenthesized process name may contain spaces and closing parentheses.
      const fields = stat
        .slice(stat.lastIndexOf(')') + 1)
        .trim()
        .split(/\s+/)
      const ticks = fields[22 - 3] // Field 22; the fields above start at field 3.
      const bootTime = /^btime (\d+)$/m.exec(systemStat)?.[1]
      if (!bootTime || !ticks || !/^\d+$/.test(ticks)) return
      // Include the boot epoch so tick values cannot match across reboots.
      return `linux:${bootTime}:${ticks}`
    }

    const isWindows = process.platform === 'win32'
    if (isWindows) {
      try {
        const { getProcessStartTime } =
          await import('napi-windows-process-start-time')
        return getProcessStartTime(pid) ?? undefined
      } catch {
        // The optional native addon may be missing or unsupported.
      }
    }
    const { stdout } = await x(
      isWindows ? 'powershell.exe' : 'ps',
      isWindows
        ? [
            '-NoLogo',
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            `(Get-Process -Id ${pid} -ErrorAction Stop).StartTime.ToUniversalTime().Ticks`,
          ]
        : ['-p', String(pid), '-o', 'lstart='],
      {
        timeout: 5000,
        throwOnError: true,
        nodeOptions: {
          windowsHide: true,
          env: { ...process.env, LC_ALL: 'C', TZ: 'UTC' },
        },
      },
    )
    const startTime = stdout.trim()
    if (!startTime || (isWindows && !/^\d+$/.test(startTime))) return
    return `${process.platform}:${startTime}`
  } catch {
    // Missing processes or unavailable OS utilities must not block startup.
    return
  }
}
