const relative = import.meta.glob('./**/*.js', { eager: true })
const alias = import.meta.glob('@escape_(braces)_mod/**/*.js', { eager: true })
export { relative, alias }
