import * as babel from '@babel/core'
import { describe, expect, it } from 'vitest'
import { restoreJSX } from './restore-jsx'

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
