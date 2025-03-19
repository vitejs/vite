// This file tests `ViteTypeOptions` in `packages/vite/types/importMeta.d.ts`
import type { ExpectFalse, ExpectTrue } from '@type-challenges/utils'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TypeOptions1 {}
interface TypeOptions2 {
  strictImportMetaEnv: unknown
}
interface TypeOptions3 {
  unknownKey: unknown
}

type IsEnabled<Opts, Key extends string> = Key extends keyof Opts ? true : false

export type cases = [
  ExpectFalse<IsEnabled<TypeOptions1, 'strictImportMetaEnv'>>,
  ExpectTrue<IsEnabled<TypeOptions2, 'strictImportMetaEnv'>>,
  ExpectFalse<IsEnabled<TypeOptions3, 'strictImportMetaEnv'>>,
]

export {}
