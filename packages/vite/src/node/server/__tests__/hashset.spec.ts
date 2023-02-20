import { describe, expect, it } from 'vitest'

import { HashSet } from '../hashset'

describe('HashSet', () => {
  it('should initialize values', () => {
    const set = new HashSet({
      getHash: (value) => value,
      initialValues: ['a', 'b'],
    })

    expect(set.size).toBe(2)
    expect(set.has('a')).toBe(true)
    expect(set.has('b')).toBe(true)
    expect(set.has('c')).toBe(false)
    expect(set.get('a')).toBe('a')
    expect(set.get('b')).toBe('b')
    expect(set.get('c')).toBe(undefined)
  })

  it('should deduplicate', () => {
    const set = new HashSet<{ id: string }>({
      getHash: (value) => value.id,
    })

    set.add({ id: '1' })
    set.add({ id: '1' })

    expect(set.size).toBe(1)
    expect(set.has({ id: '1' })).toBe(true)
  })

  it('should update existing values', () => {
    const set = new HashSet<{
      id: string
      value: string
    }>({
      getHash: (value) => value.id,
    })

    set.add({ id: '1', value: 'a' })
    set.add({ id: '1', value: 'b' })

    expect(set.size).toBe(1)
    expect(set.has({ id: '1', value: 'a' })).toBe(true)
    expect(set.get({ id: '1', value: 'b' })?.value).toBe('b')
  })

  it('should remove values', () => {
    const set = new HashSet<{ id: string }>({
      getHash: (value) => value.id,
    })

    set.add({ id: '1' })
    set.delete({ id: '1' })

    expect(set.size).toBe(0)
    expect(set.has({ id: '1' })).toBe(false)
  })

  it('should clear values', () => {
    const set = new HashSet<{ id: string }>({
      getHash: (value) => value.id,
    })

    set.add({ id: '1' })
    set.clear()

    expect(set.size).toBe(0)
    expect(set.has({ id: '1' })).toBe(false)
  })

  it('should iterate values', () => {
    const set = new HashSet<{ id: string }>({
      getHash: (value) => value.id,
      initialValues: [{ id: '1' }, { id: '2' }],
    })

    const values = [...set.values()]
    expect(values).toEqual([{ id: '1' }, { id: '2' }])

    expect([...set]).toEqual([{ id: '1' }, { id: '2' }])
  })
})
