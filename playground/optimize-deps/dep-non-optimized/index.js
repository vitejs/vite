// Scheme check that imports from different paths are resolved to the same module
const messages = []
export const add = (message) => {
  messages.push(message)
}
export const get = () => messages
