import { publish } from '@vitejs/release-scripts'

publish({
  defaultPackage: 'rolldown-vite',
  provenance: true,
  packageManager: 'pnpm',
})
