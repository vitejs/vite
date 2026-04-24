/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Equal, ExpectTrue } from '@type-challenges/utils'
import type { ImportGlobFunction } from '#types/importGlob'

const importGlobFunction: ImportGlobFunction = () => ({})

const importGlobEagerReturn = importGlobFunction('', {
  eager: true,
})

const importGlobNonEagerReturn = importGlobFunction('', {
  eager: false,
})

const importGlobEagerReturnWithKnownQuery = importGlobFunction('', {
  eager: true,
  query: '?raw',
})

const importGlobNonEagerReturnWithKnownQuery = importGlobFunction('', {
  eager: false,
  query: '?raw',
})

const importGlobEagerReturnWithUnknownQuery = importGlobFunction('', {
  eager: true,
  query: '?unknown',
})

const importGlobNonEagerReturnWithUnknownQuery = importGlobFunction('', {
  eager: false,
  query: '?unknown',
})

const importGlobEagerReturnWithKnownAs = importGlobFunction('', {
  eager: true,
  as: 'url',
})

const importGlobNonEagerReturnWithKnownAs = importGlobFunction('', {
  eager: false,
  as: 'url',
})

const importGlobEagerReturnWithWorkerAs = importGlobFunction('', {
  eager: true,
  as: 'worker',
})

const importGlobNonEagerReturnWithWorkerAs = importGlobFunction('', {
  eager: false,
  as: 'worker',
})

export type cases = [
  ExpectTrue<Equal<typeof importGlobEagerReturn, Record<string, unknown>>>,
  ExpectTrue<
    Equal<
      typeof importGlobNonEagerReturn,
      Record<string, () => Promise<unknown>>
    >
  >,
  ExpectTrue<
    Equal<typeof importGlobEagerReturnWithKnownQuery, Record<string, string>>
  >,
  ExpectTrue<
    Equal<
      typeof importGlobNonEagerReturnWithKnownQuery,
      Record<string, () => Promise<string>>
    >
  >,
  ExpectTrue<
    Equal<typeof importGlobEagerReturnWithUnknownQuery, Record<string, unknown>>
  >,
  ExpectTrue<
    Equal<
      typeof importGlobNonEagerReturnWithUnknownQuery,
      Record<string, () => Promise<unknown>>
    >
  >,
  ExpectTrue<
    Equal<typeof importGlobEagerReturnWithKnownAs, Record<string, string>>
  >,
  ExpectTrue<
    Equal<
      typeof importGlobNonEagerReturnWithKnownAs,
      Record<string, () => Promise<string>>
    >
  >,
  ExpectTrue<
    Equal<typeof importGlobEagerReturnWithWorkerAs, Record<string, Worker>>
  >,
  ExpectTrue<
    Equal<
      typeof importGlobNonEagerReturnWithWorkerAs,
      Record<string, () => Promise<Worker>>
    >
  >,
]

export {}
