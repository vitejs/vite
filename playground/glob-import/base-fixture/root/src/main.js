const modules = import.meta.glob('../external/*.js', {
  eager: true,
  base: '/',
})

document.querySelector('.result').textContent = JSON.stringify(
  Object.fromEntries(Object.entries(modules).map(([k, v]) => [k, v.msg])),
  null,
  2,
)
