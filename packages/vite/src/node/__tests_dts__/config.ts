/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Equal, ExpectTrue } from '@type-challenges/utils'
import {
  type UserConfig,
  type UserConfigExport,
  type UserConfigFn,
  type UserConfigFnObject,
  type UserConfigFnPromise,
  defineConfig,
} from '../config'
import { mergeConfig } from '../publicUtils'

const configObjectDefined = defineConfig({})
const configObjectPromiseDefined = defineConfig(Promise.resolve({}))
const configFnObjectDefined = defineConfig(() => ({}))
const configFnPromiseDefined = defineConfig(async () => ({}))
const configFnDefined = defineConfig(() =>
  // TypeScript requires both non-promise config and
  // promise config to have at least one property
  Math.random() > 0.5 ? { base: '' } : Promise.resolve({ base: '/' }),
)
const configExportDefined = defineConfig({} as UserConfigExport)

export type cases1 = [
  ExpectTrue<Equal<typeof configObjectDefined, UserConfig>>,
  ExpectTrue<Equal<typeof configObjectPromiseDefined, Promise<UserConfig>>>,
  ExpectTrue<Equal<typeof configFnObjectDefined, UserConfigFnObject>>,
  ExpectTrue<Equal<typeof configFnPromiseDefined, UserConfigFnPromise>>,
  ExpectTrue<Equal<typeof configFnDefined, UserConfigFn>>,
  ExpectTrue<Equal<typeof configExportDefined, UserConfigExport>>,
]

defineConfig({
  base: '',
  // @ts-expect-error
  unknownProperty: 1,
})

mergeConfig(defineConfig({}), defineConfig({}))
mergeConfig(
  // @ts-expect-error
  defineConfig(() => ({})),
  defineConfig({}),
)

export {}
