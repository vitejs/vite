const relative = import.meta.glob(`../[brackets]/**/*.js`, { eager: true })
const alias = import.meta.glob('@escape_[brackets]_mod/**/*.js', {
  eager: true,
})
export { relative, alias }
