import fs from 'fs'

export function readJsonFile(file: string, throwError?: boolean): any {
  let content: string
  try {
    content = fs.readFileSync(file, 'utf8')
  } catch (e) {
    if (throwError) throw e
    return
  }
  return JSON.parse(content)
}
