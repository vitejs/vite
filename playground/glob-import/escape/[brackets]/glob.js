const results = import.meta.glob('./**/*.js', { eager: true })
console.log('results', results)
export default results
