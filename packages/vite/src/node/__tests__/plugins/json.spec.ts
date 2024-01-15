import { expect, test } from 'vitest'
import { extractJsonErrorPosition } from '../../plugins/json'

const getErrorMessage = (input: string) => {
  try {
    JSON.parse(input)
    throw new Error('No error happened')
  } catch (e) {
    return e.message
  }
}

test('can extract json error position', () => {
  const cases = [
    { input: '{', expectedPosition: 0 },
    { input: '{},', expectedPosition: 1 },
    { input: '"f', expectedPosition: 1 },
    { input: '[', expectedPosition: 0 },
  ]

  for (const { input, expectedPosition } of cases) {
    expect(extractJsonErrorPosition(getErrorMessage(input), input.length)).toBe(
      expectedPosition,
    )
  }
})
