import { createStart } from './facade.js'
import { middleware } from './middleware.js'

export function start() {
  return { ...createStart(), middleware }
}
