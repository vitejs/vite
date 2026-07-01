import type { Equal, ExpectTrue } from '@type-challenges/utils'
import type { OutputAsset, OutputChunk } from 'rolldown'
import type { build, ViteBuildOutput } from '..'

type BuildResult = Awaited<ReturnType<typeof build>>
type SingleBuildOutput = Extract<BuildResult, { output: unknown }>
type FirstOutput = SingleBuildOutput['output'][0]

export type cases = [
  ExpectTrue<Equal<FirstOutput, OutputAsset | OutputChunk>>,
  ExpectTrue<Equal<ViteBuildOutput['output'][0], OutputAsset | OutputChunk>>,
]

export {}
