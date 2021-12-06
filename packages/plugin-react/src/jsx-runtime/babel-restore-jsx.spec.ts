import babelRestoreJSX from './babel-restore-jsx'
import * as babel from '@babel/core'
import expect from 'expect'

function jsx(code: string) {
  return babel.transform(code, {
    parserOpts: { plugins: ['jsx'] },
    plugins: [babelRestoreJSX]
  })?.code
}

// Tests adapted from: https://github.com/flying-sheep/babel-plugin-transform-react-createelement-to-jsx/blob/63137b6/test/index.js
describe('babel-restore-jsx', () => {
  it('should convert 1-argument calls', () => {
    expect(jsx('React.createElement("h1")')).toMatch(`<h1 />;`)
    expect(jsx('React.createElement(Foo)')).toMatch(`<Foo />;`)
    expect(jsx('React.createElement(Foo.Bar)')).toMatch(`<Foo.Bar />;`)
    expect(jsx('React.createElement(Foo.Bar.Baz)')).toMatch(`<Foo.Bar.Baz />;`)
  })

  it('should convert effective 1-argument calls (with null or undefined)', () => {
    expect(jsx('React.createElement("h1", null)')).toMatch(`<h1 />;`)
    expect(jsx('React.createElement("h2", null, null)')).toMatch(`<h2 />;`)
    expect(jsx('React.createElement("h3", undefined)')).toMatch(`<h3 />;`)
  })

  it('should handle props without children', () => {
    expect(jsx('React.createElement("h1", {hi: there})')).toMatch(
      `<h1 hi={there} />;`
    )
    expect(jsx('React.createElement("h2", {"hi": there})')).toMatch(
      `<h2 hi={there} />;`
    )
    expect(jsx('React.createElement("h3", {hi: "there"})')).toMatch(
      `<h3 hi="there" />;`
    )
  })

  it('should handle spread props', () => {
    expect(jsx('React.createElement("h1", props)')).toMatch(
      `<h1 {...props} />;`
    )
    expect(jsx('React.createElement("h1", getProps())')).toMatch(
      `<h1 {...getProps()} />;`
    )
  })

  it('should handle mixed props', () => {
    expect(
      jsx('React.createElement("h1", _extends({ hi: "there" }, props))')
    ).toMatch(`<h1 hi="there" {...props} />;`)
    expect(
      jsx('React.createElement("h1", _extends({}, props, { hi: "there" }))')
    ).toMatch(`<h1 {...props} hi="there" />;`)
    expect(jsx('React.createElement("h1", { ...props, hi: "there" })')).toMatch(
      `<h1 {...props} hi="there" />;`
    )
  })

  it('should handle props and ignore “null”/“undefined” children', () => {
    expect(
      jsx('React.createElement("h1", {hi: there}, null, undefined)')
    ).toMatch(`<h1 hi={there} />;`)
  })

  it('should ignore “null”/“undefined” props and handle children', () => {
    expect(jsx('React.createElement("h1", null, "Header")')).toMatch(
      `<h1>Header</h1>;`
    )
    //this can be created from e.g. '<h2>Header{"harhar"}</h2>', but i think there’s no downside to merging it
    expect(jsx('React.createElement("h2", null, "Header", "harhar")')).toMatch(
      `<h2>Headerharhar</h2>;`
    )
    expect(
      jsx('React.createElement("h3", null, React.createElement("i"))')
    ).toMatch(`<h3><i /></h3>;`)
    expect(
      jsx('React.createElement("h4", null, "a", React.createElement("b"), "c")')
    ).toMatch(`<h4>a<b />c</h4>;`)
  })

  it('should handle props and children', () => {
    //we extensively tested props and children separately, so only sth. basic
    expect(jsx('React.createElement("h1", {hi: there}, "Header")')).toMatch(
      `<h1 hi={there}>Header</h1>;`
    )
  })

  it('should ignore intermingled “null”/“undefined” children', () => {
    expect(
      jsx('React.createElement("h1", null, null, "Header", undefined)')
    ).toMatch(`<h1>Header</h1>;`)
  })

  it('should handle children in nested expressions', () => {
    expect(
      jsx(
        'React.createElement("h1", null, foo ? React.createElement("p") : null)'
      )
    ).toMatch(`<h1>{foo ? <p /> : null}</h1>;`)
  })
})
