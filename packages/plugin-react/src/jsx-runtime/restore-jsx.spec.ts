import { parseReactAlias } from './restore-jsx'

describe('parseReactAlias', () => {
  it('handles cjs require', () => {
    expect(parseReactAlias(`const React = require("react")`))
      .toMatchInlineSnapshot(`
      Array [
        "React",
        true,
      ]
    `)
  })

  it('handles cjs require (minified)', () => {
    expect(parseReactAlias(`var F=require('foo');var R=require('react')`))
      .toMatchInlineSnapshot(`
      Array [
        "R",
        true,
      ]
    `)
  })

  it('does not handle destructured cjs require', () => {
    expect(parseReactAlias(`var {createElement} = require("react")`))
      .toMatchInlineSnapshot(`
      Array [
        undefined,
        false,
      ]
    `)
  })

  it('handles esm import', () => {
    expect(parseReactAlias(`import React from 'react'`)).toMatchInlineSnapshot(`
      Array [
        "React",
        false,
      ]
    `)
  })

  it('handles esm import namespace', () => {
    expect(parseReactAlias(`import * as React from "react"`))
      .toMatchInlineSnapshot(`
      Array [
        "React",
        false,
      ]
    `)
  })

  it('does not handle destructured esm import', () => {
    expect(parseReactAlias(`import {createElement} from "react"`))
      .toMatchInlineSnapshot(`
      Array [
        undefined,
        false,
      ]
    `)
  })
})
