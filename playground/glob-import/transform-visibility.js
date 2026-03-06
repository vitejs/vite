const name = 'foo'
export const globResult = import.meta.glob('./dir/*.js')
export const dynamicResult = import(`./dir/${name}.js`)
