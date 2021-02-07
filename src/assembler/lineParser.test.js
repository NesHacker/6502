const { test, expect } = require('@jest/globals')
const { parse } = require('./lineParser')
const ParseNode = require('./ParseNode')

test('variable assignment: address', () => {
  expect(parse('foo = $1000')).toEqual({
    type: 'assignment',
    identifier: 'foo',
    value: { type: 'number', base: 16, value: 4096 }
  })
})

test('variable assignment: identifier', () => {
  expect(parse('foo = bar')).toEqual({
    type: 'assignment',
    identifier: 'foo',
    value: { type: 'identifier', value: 'bar' }
  })
})

test('variable assignment: immediate', () => {
  expect(parse('foo = #%10000001')).toEqual({
    type: 'assignment',
    identifier: 'foo',
    value: {
      type: 'immediate',
      number: {
        type: 'number',
        base: 2,
        value: 129
      }
    }
  })
})

test('command: without params', () => {
  expect(parse('.NES_HACKER')).toEqual({
    type: 'command',
    name: 'NES_HACKER',
    params: []
  })
})

test('command: with params', () => {
  const result = parse('.HELLO(#1, $2, foo)')
  expect(result).toEqual({
    type: 'command',
    name: 'HELLO',
    params: [
      {
        type: 'immediate',
        number: {
          type: 'number',
          base: 10,
          value: 1
        },
      },
      {
        type: 'number',
        base: 16,
        value: 2
      },
      {
        type: 'identifier',
        value: 'foo'
      }
    ]
  })
})

test('instruction: implicit', () => {
  const result = parse('rts')
  expect(result).toEqual({
    type: 'instruction',
    name: 'rts',
    mode: {
      type: 'addressingMode',
      mode: 'implicit',
      value: ''
    }
  })
})

test('instruction: accumulator', () => {
  const result = parse('lsr A')
  expect(result).toEqual({
    type: 'instruction',
    name: 'lsr',
    mode: {
      type: 'addressingMode',
      mode: 'accumulator',
      value: 'A'
    }
  })
})

test('instruction: immediate', () => {
  const result = parse('ldx #$10')
  expect(result).toEqual({
    type: 'instruction',
    name: 'ldx',
    mode: {
      type: 'addressingMode',
      mode: 'expression',
      value: {
        type: 'immediate',
        number: {
          type: 'number',
          base: 16,
          value: 16
        }
      }
    }
  })
})

test('instruction: zero page', () => {
  const result = parse('lsr $FA')
  expect(result).toEqual({
    type: 'instruction',
    name: 'lsr',
    mode: {
      type: 'addressingMode',
      mode: 'expression',
      value: {
        type: 'number',
        base: 16,
        value: 250
      }
    }
  })
})

test('instruction: zero page, x', () => {
  const result = parse('ADC $12, X')
  expect(result).toEqual({
    type: 'instruction',
    name: 'adc',
    mode: {
      type: 'addressingMode',
      mode: 'xIndex',
      value: {
        type: 'number',
        base: 16,
        value: 18
      }
    }
  })
})

test('instruction: zero page, y', () => {
  const result = parse('sbc $0f, y')
  expect(result).toEqual({
    type: 'instruction',
    name: 'sbc',
    mode: {
      type: 'addressingMode',
      mode: 'yIndex',
      value: {
        type: 'number',
        base: 16,
        value: 15
      }
    }
  })
})

test('instruction: relative', () => {
  const result = parse('bcc *-2')
  expect(result).toEqual({
    type: 'instruction',
    name: 'bcc',
    mode: {
      type: 'addressingMode',
      mode: 'relative',
      value: -2
    }
  })
})

test('instruction: absolute', () => {
  const result = parse('lda $030C')
  expect(result).toEqual({
    type: 'instruction',
    name: 'lda',
    mode: {
      type: 'addressingMode',
      mode: 'expression',
      value: {
        type: 'number',
        base: 16,
        value: 780
      }
    }
  })
})

test('instruction: absolute, x', () => {
  const result = parse('sta $2007, x')
  expect(result).toEqual({
    type: 'instruction',
    name: 'sta',
    mode: {
      type: 'addressingMode',
      mode: 'xIndex',
      value: {
        type: 'number',
        base: 16,
        value: 8199
      }
    }
  })
})

test('instruction: absolute, y', () => {
  const result = parse('stx $604c, y')
  expect(result).toEqual({
    type: 'instruction',
    name: 'stx',
    mode: {
      type: 'addressingMode',
      mode: 'yIndex',
      value: {
        type: 'number',
        base: 16,
        value: 24652
      }
    }
  })
})

test('instruction: indirect', () => {
  const result = parse('jmp ($FFFC)')
  expect(result).toEqual({
    type: 'instruction',
    name: 'jmp',
    mode: {
      type: 'addressingMode',
      mode: 'indirect',
      value: {
        type: 'number',
        base: 16,
        value: 65532
      }
    }
  })
})

test('instruction: indexed indirect ($FF,X)', () => {
  const result = parse('dec ($CA,X)')
  expect(result).toEqual({
    type: 'instruction',
    name: 'dec',
    mode: {
      type: 'addressingMode',
      mode: 'indexedIndirect',
      value: {
        type: 'number',
        base: 16,
        value: 202
      }
    }
  })
})

test('instruction: indirect indexed ($AA),Y', () => {
  const result = parse('inc ($CA), y')
  expect(result).toEqual({
    type: 'instruction',
    name: 'inc',
    mode: {
      type: 'addressingMode',
      mode: 'indirectIndexed',
      value: {
        type: 'number',
        base: 16,
        value: 202
      }
    }
  })
})
