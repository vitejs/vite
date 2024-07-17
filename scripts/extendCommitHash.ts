import fs from 'node:fs'
import { execSync } from 'node:child_process'
import colors from 'picocolors'

export default function extendLogHash(path: string) {
  let content = fs.readFileSync(path, 'utf-8')
  const base = 'https://github.com/vitejs/vite/commit/'
  const matchHashReg = new RegExp(`${base}([\\d\\w]{7})\\)`, 'g')
  console.log(colors.cyan(`\nextending commit hash in ${path}...`))
  let match
  while ((match = matchHashReg.exec(content))) {
    const shortHash = match[1]
    try {
      const longHash = execSync(`git rev-parse ${shortHash}`).toString().trim()
      content = content.replace(`${base}${shortHash}`, `${base}${longHash}`)
    } catch {}
  }
  fs.writeFileSync(path, content)
  console.log(colors.green(`${path} update success!`))
}
