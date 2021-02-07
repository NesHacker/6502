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
  const result = parse('ror')
  expect(result).toEqual({
    type: 'instruction',
    name: 'ror',
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
})

test('instruction: zero page, y', () => {
})

test('instruction: absolute', () => {
})

test('instruction: absolute, x', () => {
})

test('instruction: absolute, y', () => {
})

test('instruction: indirect', () => {
})

test('instruction: indexed indirect ($FF,X)', () => {
})

test('instruction: indirect indexed ($AA),Y', () => {
})
