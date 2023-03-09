import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

export default {
  load() {
    const path = fileURLToPath(new URL('./links.json', import.meta.url))
    const data = fs.readFileSync(path, 'utf-8')
    return JSON.parse(data)
  },
}
