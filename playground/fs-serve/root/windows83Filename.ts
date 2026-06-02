import { execSync } from 'node:child_process'
import path from 'node:path'

function getWindows83ShortName(inputPath: string): string | undefined {
  try {
    const result = execSync(
      `powershell -Command "(New-Object -ComObject Scripting.FileSystemObject).GetFile('${inputPath}').ShortPath"`,
      { encoding: 'utf-8' },
    ).trim()
    return result !== inputPath && result.includes('~') ? result : undefined
  } catch {
    return undefined
  }
}

export function getWindows83ShortNameForDotEnv(): string | undefined {
  const dotEnvPath = path.resolve(import.meta.dirname, '../root/src/.env')
  const dotEnvWindows83ShortName = getWindows83ShortName(dotEnvPath)
  if (dotEnvWindows83ShortName === undefined) {
    return undefined
  }
  return path.basename(dotEnvWindows83ShortName)
}
