const { test, expect } = require('@jest/globals')
const { assemble } = require('./assemble')
const { Instruction } = require('./Instruction')
const { Label } = require('./Label')
const { parse } = require('../parser')

test('assemble(): basic assembly and LIR output', () => {
  const parseNode = parse(`
    .org $1000
    my_routine:
    ldx #10
    @loop: dex
    bne @loop
  `)

  const lir = assemble(parseNode)
  expect(lir).toBeInstanceOf(Array)
  expect(lir.length).toEqual(5)

  const [label, ldx, localLabel, dex, bne] = lir
  let address = parseInt('1000', 16)

  expect(label).toBeInstanceOf(Label)
  expect(label.name).toEqual('my_routine')
  expect(label.local).toBe(false)
  expect(label.address).toEqual(address)

  expect(ldx).toBeInstanceOf(Instruction)
  expect(ldx.name).toEqual('ldx')
  expect(ldx.address).toEqual(address)
  address += ldx.length

  expect(localLabel).toBeInstanceOf(Label)
  expect(localLabel.name).toEqual('loop')
  expect(localLabel.local).toBe(true)
  expect(localLabel.address).toEqual(address)

  expect(dex).toBeInstanceOf(Instruction)
  expect(dex.name).toEqual('dex')
  expect(dex.address).toEqual(address)
  address += dex.length

  expect(bne).toBeInstanceOf(Instruction)
  expect(bne.name).toEqual('bne')
  expect(bne.address).toEqual(address)
})
