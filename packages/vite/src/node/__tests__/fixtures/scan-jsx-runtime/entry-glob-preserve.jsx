const pages = import.meta.glob('./pages/*.tsx')

export const el = <div>{Object.keys(pages).length}</div>
