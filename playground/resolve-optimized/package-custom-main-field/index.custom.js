const key = 'package-custom-main-field'

export default key

globalThis[key] ||= 0
globalThis[key]++
