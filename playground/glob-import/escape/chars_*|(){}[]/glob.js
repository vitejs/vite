const relative = import.meta.glob('./**/*.js', { eager: true })
const alias = import.meta.glob('@escape_chars_*|(){}[]_mod/**/*.js', {
  eager: true
})
export { relative, alias }
