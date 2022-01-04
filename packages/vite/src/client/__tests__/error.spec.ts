import type { StackLineInfo, StackLineResult } from '../error';
import { getStackLineInformation } from '../error';


describe('getStackLineInformation', () => {
    describe('chrome', () => {
        test('should parse stack line', () => {
            const input = '    at a (http://domain.com/script.js:1:11764)'
            const result = getStackLineInformation(input)

            expect(result).toStrictEqual({
                input,
                varName: 'a',
                url: 'http://domain.com/script.js',
                line: 1,
                column: 11764,
                vendor: 'chrome'
            })
        })

        test('should parse stack line with eval', () => {
            const input = '    at Object.eval (eval at <anonymous> (http://domain.com/script.js:1:11764), <anonymous>:35:3729)'
            const result = getStackLineInformation(input)

            expect(result).toStrictEqual({
                input,
                varName: 'Object.eval',
                url: 'http://domain.com/script.js',
                line: 1,
                column: 11764,
                vendor: 'chrome'
            })
        })
    })

    describe('firefox', () => {
        test('should parse stack line', () => {
            const input = 'a@(http://domain.com/script.js:1:11764)'
            const result = getStackLineInformation(input)

            expect(result).toStrictEqual({
                input,
                varName: 'a',
                url: 'http://domain.com/script.js',
                line: 1,
                column: 11764,
                vendor: 'firefox'
            })
        })

        test('should parse stack line with eval', () => {
            const input = 'Object.eval@http://domain.com/script.js line 1 > eval line 1 > eval:35:3729'
            const result = getStackLineInformation(input)

            expect(result).toStrictEqual({
                input,
                varName: 'Object.eval',
                url: 'http://domain.com/script.js',
                line: 1,
                column: 0,
                vendor: 'firefox'
            })
        })
    })
})

// describe()