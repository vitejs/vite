import somePkg from 'some-pkg/package.json' with { type: 'json' }
import data, { default as dataAlias } from './data.json' with { type: 'json' }

export default {
  define: {
    VERSION: JSON.stringify(data.version + dataAlias.version + somePkg.version),
  },
}
