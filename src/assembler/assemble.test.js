const { test, expect } = require('@jest/globals')
const { assemble } = require('./assemble')
const { Instruction } = require('./Instruction')
const { Label } = require('./Label')
const { parse } = require('../parser')
const { ByteArray } = require('./ByteArray')

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

test('assemble: .byte command', () => {
  const parseNode = parse(`
    .byte %00001111, %11110000
    .byte $ACDC, $AABBCCDD
    .byte 1, 2, 4, 8, 16, 32, 64, 128
  `)

  const lir = assemble(parseNode)
  expect(lir.length).toEqual(3)

  const [a, b, c] = lir

  expect(a).toBeInstanceOf(ByteArray)
  expect(a.length).toEqual(2)
  expect(Array.from(a.bytes)).toEqual([ 0x0F, 0xF0 ])

  expect(b).toBeInstanceOf(ByteArray)
  expect(b.length).toEqual(6)
  expect(Array.from(b.bytes)).toEqual([ 0xDC, 0xAC, 0xDD, 0xCC, 0xBB, 0xAA ])

  expect(c).toBeInstanceOf(ByteArray)
  expect(c.length).toEqual(8)
  expect(Array.from(c.bytes)).toEqual([ 1, 2, 4, 8, 16, 32, 64, 128 ])
})
