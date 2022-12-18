const key = 'package-custom-condition'

export default key

globalThis[key] ||= 0
globalThis[key]++
