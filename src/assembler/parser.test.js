const { test, expect } = require('@jest/globals')
const { parse, ParseError } = require('./parser')

/*
test('parses valid 6502 macro assembly', () => {
  const result = parse(`
    lda #22 ; comments be gone, yo
    ; this should be stripped!
    @loop: ldx $20
  `)
  expect(result).toEqual([
    {
      original: '    lda #22 ; comments be gone, yo\n',
      lineNumber: 2,
      assembly: 'lda #22',
      node: {
        type: 'instruction',
        name: 'lda',
        mode: {
          type: 'addressingMode',
          mode: 'expression',
          value: {
            type: 'immediate',
            number: {
              type: 'number',
              base: 10,
              value: 22
            }
          }
        }
      }
    },
    {
      original: '    @loop: ldx $20\n',
      lineNumber: 4,
      assembly: '@loop: ldx $20',
      node: {
        type: 'label',
        name: 'loop',
        local: true
      }
    },
    {
      original: '    @loop: ldx $20\n',
      lineNumber: 4,
      assembly: '@loop: ldx $20',
      node: {
        type: 'instruction',
        name: 'ldx',
        mode: {
          type: 'addressingMode',
          mode: 'expression',
          value: {
            type: 'number',
            base: 16,
            value: 32
          }
        }
      }
    }
  ])
})
*/

test('on parse errors throws `ParseError`', () => {
  expect(() => parse('invalid @U(_))U(_)@UH')).toThrow(ParseError)
})