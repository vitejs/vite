const relative = import.meta.glob('./**/*.js', { eager: true })
const alias = import.meta.glob('@escape_+plus_mod/**/*.js', { eager: true })
export { relative, alias }
