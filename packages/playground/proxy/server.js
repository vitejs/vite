const http = require('http')

async function createServer(root, isProd) {
  http
    .createServer((req, res) => {
      res.end()
    })
    .listen(8081, () => {
      console.log('http://localhos:8081/')
    })
  http
    .createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ key: 'router' }))
    })
    .listen(8080, () => {
      console.log('http://localhos:8080/')
    })
}

exports.createServer = createServer
