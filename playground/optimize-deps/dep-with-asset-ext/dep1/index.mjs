export default { random: Math.random() }

export const isPreBundled = import.meta.url.includes('/.vite/deps/')
