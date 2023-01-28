const relative = import.meta.glob(`../{curlies}/**/*.js`, { eager: true })
const alias = import.meta.glob('@escape_{curlies}_mod/**/*.js', { eager: true })
export { relative, alias }
