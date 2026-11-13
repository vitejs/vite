import style from './index.css?inline'
import template from './index.html?raw'
import lessStyle from './index.less?inline'
import sassStyle from './index.scss?inline'

export default function render(req, res, next) {
  if (req.url !== '/') return next()

  const html = template.replace(
    '<!--head-->',
    `<style>${style}${sassStyle}${lessStyle}</style>`,
  )
  res.setHeader('Content-Type', 'text/html')
  res.end(html)
}
