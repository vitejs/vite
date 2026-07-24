/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Equal, ExpectTrue } from '@type-challenges/utils'
import {
  type EnvironmentOptions,
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
  server: {
    proxy: {
      '/test': {
        bypass: () => false,
      },
    },
  },
  // @ts-expect-error --- invalid option should error
  unknownProperty: 1,
})

defineConfig(() => ({
  base: '',
  build: {
    minify: 'oxc' as const, // ideally we don't want to require `as const` here
  },
  server: {
    proxy: {
      '/test': {
        bypass: () => false as const, // ideally we don't want to require `as const` here
      },
    },
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
    minify: 'oxc' as const, // ideally we don't want to require `as const` here
  },
  server: {
    proxy: {
      '/test': {
        bypass: () => false as const, // ideally we don't want to require `as const` here
      },
    },
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

defineConfig({
  // @ts-expect-error --- `requestEntrypoints` is not a top-level option
  requestEntrypoints: ['ssr'],
})

type IsAssignable<T, U> = T extends U ? true : false

export type requestEntrypointsCases = [
  // allowed on a server environment (record form)
  ExpectTrue<
    Equal<
      IsAssignable<
        {
          consumer: 'server'
          requestEntrypoints: { ssr: { type: 'fetchable' } }
        },
        EnvironmentOptions
      >,
      true
    >
  >,
  // allowed when `consumer` is left to default (server for non-client environments)
  ExpectTrue<
    Equal<
      IsAssignable<{ requestEntrypoints: string[] }, EnvironmentOptions>,
      true
    >
  >,
  // rejected on a client environment
  ExpectTrue<
    Equal<
      IsAssignable<
        { consumer: 'client'; requestEntrypoints: string[] },
        EnvironmentOptions
      >,
      false
    >
  >,
]

export {}
