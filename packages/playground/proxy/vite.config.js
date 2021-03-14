module.exports = {
  server: {
    port: 3000,
    proxy: {
      '/v1': {
        target: 'http://localhost:8081',
        router: {
          'localhost:3000': 'http://localhost:8080'
        }
      }
    }
  }
}
