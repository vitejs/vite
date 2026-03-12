function html(strings: TemplateStringsArray, ...values: unknown[]) {
  return strings.join('')
}
export const result = html`<script>
  console.log('hi')
</script>`
