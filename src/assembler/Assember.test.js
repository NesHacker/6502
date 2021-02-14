const { test, expect } = require('@jest/globals')
const { Assembler } = require('./Assembler')

test('toHexString(): labels at address 0', () => {
  const result = Assembler.toHexString(`
    endless:
      jmp endless
  `)
  expect(result).toEqual('4C0000')
})

test('toHexString(): .byte command', () => {
  const result = Assembler.toHexString(`.byte 2, 4, 6, 8, 10`)
  expect(result).toEqual('020406080A')
})
