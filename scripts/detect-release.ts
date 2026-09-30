import { detectReleaseCommit } from '@vitejs/release-scripts'
import { releasePackages } from './releaseUtils.ts'

const subject = process.argv[2]
if (!subject) throw new Error('Release commit subject is required')

const release = detectReleaseCommit({
  subject,
  packages: releasePackages,
  defaultPackage: 'vite',
})

if (release) {
  console.log(
    `package=${release.pkg}\nrelease=true\ntag=${release.tag}\nversion=${release.version}`,
  )
} else {
  console.log('release=false')
}
