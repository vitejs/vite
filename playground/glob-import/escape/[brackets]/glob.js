const relative = import.meta.glob('./**/*.js', { eager: true })
const alias = import.meta.glob('@escape_[brackets]_mod/**/*.js', {
  eager: true,
})
export { relative, alias }
