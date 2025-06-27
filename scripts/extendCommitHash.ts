import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { styleText } from 'node:util'

export default function extendCommitHash(path: string): void {
  let content = fs.readFileSync(path, 'utf-8')
  const base = 'https://github.com/vitejs/vite/commit/'
  const matchHashReg = new RegExp(`${base}(\\w{7})\\)`, 'g')
  console.log(styleText('cyan', `\nextending commit hash in ${path}...`))
  let match
  while ((match = matchHashReg.exec(content))) {
    const shortHash = match[1]
    try {
      const longHash = execSync(`git rev-parse "${shortHash}^{commit}"`)
        .toString()
        .trim()
      content = content.replace(`${base}${shortHash}`, `${base}${longHash}`)
    } catch {}
  }
  fs.writeFileSync(path, content)
  console.log(styleText('green', `${path} update success!`))
}
