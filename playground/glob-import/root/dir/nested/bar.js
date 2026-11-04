const modules = import.meta.glob('../*.json', { eager: true })

export const msg = 'bar'
export { modules }
