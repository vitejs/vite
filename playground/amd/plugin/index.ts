import workerUrl from './worker?url&no-inline'

export default function pluginMain() {
  console.log('workerUrl', workerUrl)
  return 'OK'
}
