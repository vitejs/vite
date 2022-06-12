import * as babel from '@babel/core'
import { describe, expect, it } from 'vitest'
import { parseReactAlias, restoreJSX } from './restore-jsx'

describe('parseReactAlias', () => {
  it('handles cjs require', () => {
    expect(parseReactAlias(`const React = require("react")`))
      .toMatchInlineSnapshot(`
        [
          "React",
          true,
        ]
      `)
  })

  it('handles cjs require (minified)', () => {
    expect(parseReactAlias(`var F=require('foo');var R=require('react')`))
      .toMatchInlineSnapshot(`
        [
          "R",
          true,
        ]
      `)
  })

  it('does not handle destructured cjs require', () => {
    expect(parseReactAlias(`var {createElement} = require("react")`))
      .toMatchInlineSnapshot(`
        [
          undefined,
          false,
        ]
      `)
  })

  it('handles esm import', () => {
    expect(parseReactAlias(`import React from 'react'`)).toMatchInlineSnapshot(`
      [
        "React",
        false,
      ]
    `)
  })

  it('handles esm import namespace', () => {
    expect(parseReactAlias(`import * as React from "react"`))
      .toMatchInlineSnapshot(`
        [
          "React",
          false,
        ]
      `)
  })

  it('does not handle destructured esm import', () => {
    expect(parseReactAlias(`import {createElement} from "react"`))
      .toMatchInlineSnapshot(`
        [
          undefined,
          false,
        ]
      `)
  })
})

async function jsx(sourceCode: string) {
  const [ast] = await restoreJSX(babel, sourceCode, 'test.js')
  if (ast == null) {
    return ast
  }
  const { code } = await babel.transformFromAstAsync(ast, null, {
    configFile: false
  })
  return code
}
// jsx(`import React__default, { PureComponent, Component, forwardRef, memo, createElement } from 'react';
// React__default.createElement(Foo)`)
// Tests adapted from: https://github.com/flying-sheep/babel-plugin-transform-react-createelement-to-jsx/blob/63137b6/test/index.js
describe('restore-jsx', () => {
  it('should trans to ', async () => {
    expect(
      await jsx(`import React__default, { PureComponent, Component, forwardRef, memo, createElement } from 'react';
      React__default.createElement(foo)`)
    ).toBeNull()
    expect(
      await jsx(`import React__default, { PureComponent, Component, forwardRef, memo, createElement } from 'react';
      React__default.createElement("h1")`)
    ).toMatch(`<h1 />;`)
    expect(
      await jsx(`import React__default, { PureComponent, Component, forwardRef, memo, createElement } from 'react';
      React__default.createElement(Foo)`)
    ).toMatch(`<Foo />;`)
    expect(
      await jsx(`import React__default, { PureComponent, Component, forwardRef, memo, createElement } from 'react';
      React__default.createElement(Foo.Bar)`)
    ).toMatch(`<Foo.Bar />;`)
    expect(
      await jsx(`import React__default, { PureComponent, Component, forwardRef, memo, createElement } from 'react';
    React__default.createElement(Foo.Bar.Baz)`)
    ).toMatch(`<Foo.Bar.Baz />;`)
  })

  it('should handle props', async () => {
    expect(
      await jsx(`import React__default, { PureComponent, Component, forwardRef, memo, createElement } from 'react';
      React__default.createElement(foo, {hi: there})`)
    ).toBeNull()
    expect(
      await jsx(`import React__default, { PureComponent, Component, forwardRef, memo, createElement } from 'react';
    React__default.createElement("h1", {hi: there})`)
    ).toMatch(`<h1 hi={there} />;`)
    expect(
      await jsx(`import React__default, { PureComponent, Component, forwardRef, memo, createElement } from 'react';
      React__default.createElement(Foo, {hi: there})`)
    ).toMatch(`<Foo hi={there} />;`)
  })
})
