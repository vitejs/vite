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
import { mergeConfig } from '../utils'

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
  build: {
    minify: 'oxc', // `as const` is not needed
  },
  // @ts-expect-error --- invalid option should error
  unknownProperty: 1,
})

defineConfig(() => ({
  base: '',
  build: {
    minify: 'oxc', // `as const` is not needed
  },
  unknownProperty: 1, // we cannot catch invalid option for this case, ideally we should
}))

// @ts-expect-error --- nested invalid option `build.unknown` should error
defineConfig(() => ({
  base: '',
  build: {
    unknown: 1,
  },
}))

defineConfig(async () => ({
  base: '',
  build: {
    minify: 'oxc', // `as const` is not needed
  },
  unknownProperty: 1, // we cannot catch invalid option for this case, ideally we should
}))

// @ts-expect-error --- nested invalid option `build.unknown` should error
defineConfig(async () => ({
  base: '',
  build: {
    unknown: 1,
  },
}))

mergeConfig(defineConfig({}), defineConfig({}))
mergeConfig(
  // @ts-expect-error
  defineConfig(() => ({})),
  defineConfig({}),
)

export {}
