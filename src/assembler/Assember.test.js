const { test, expect } = require('@jest/globals')
const { Assembler } = require('./Assembler')

test('toHexString(): labels at address 0', () => {
  const result = Assembler.toHexString(`
    endless:
      jmp endless
  `)
  expect(result).toEqual('4C0000')
})
