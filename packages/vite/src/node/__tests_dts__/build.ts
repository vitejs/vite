import type { Equal, ExpectTrue } from '@type-challenges/utils'
import type { OutputAsset, OutputChunk, RolldownWatcher } from 'rolldown'
import type { build, BuildOutput, BuildResult, createBuilder } from '../build'

type BuildReturn = Awaited<ReturnType<typeof build>>
type Builder = Awaited<ReturnType<typeof createBuilder>>
type BuilderBuildReturn = Awaited<ReturnType<Builder['build']>>

type SingleBuildOutput = Exclude<BuildReturn, BuildOutput[] | RolldownWatcher>
type BuilderSingleBuildOutput = Exclude<
  BuilderBuildReturn,
  BuildOutput[] | RolldownWatcher
>

export type cases = [
  ExpectTrue<Equal<BuildReturn, BuildResult>>,
  ExpectTrue<Equal<BuilderBuildReturn, BuildResult>>,
  ExpectTrue<Equal<SingleBuildOutput['output'][0], OutputChunk | OutputAsset>>,
  ExpectTrue<
    Equal<BuilderSingleBuildOutput['output'][0], OutputChunk | OutputAsset>
  >,
]

export {}
