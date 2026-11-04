import { version } from 'some-pkg/package.json' with { type: 'json' }

export default { define: { VERSION: JSON.stringify(version) } }
