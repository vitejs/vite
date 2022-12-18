const key = 'package-a-module'

export default key

globalThis[key] ||= 0
globalThis[key]++
