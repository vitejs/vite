const pages = import.meta.glob('./pages/*.tsx')

export const el: unknown = <div>{Object.keys(pages).length}</div>
