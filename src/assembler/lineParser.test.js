const { test, expect } = require('@jest/globals')
const { parse } = require('./lineParser')
const ParseNode = require('./ParseNode')

test('variable assignment: number', () => {
  const node = parse('foo = $1000')
  expect(node.isAssignment()).toBe(true)
  expect(node.children.length).toBe(2)
  const [id, value] = node.children
  expect(id.isIdentifier()).toBe(true)
  expect(id.data.value).toEqual('foo')
  expect(value.isNumber()).toBe(true)
  expect(value.data.value).toBe(4096)
})

test('variable assignment: identifier', () => {
  const node = parse('w = bar')
  expect(node.isAssignment()).toBe(true)
  expect(node.children.length).toBe(2)
  const [id, value] = node.children
  expect(id.isIdentifier()).toBe(true)
  expect(id.data.value).toEqual('w')
  expect(value.isIdentifier()).toBe(true)
  expect(value.data.value).toEqual('bar')
})

test('variable assignment: immediate', () => {
  const node = parse('cool = #-22')
  expect(node.isAssignment()).toBe(true)
  expect(node.children.length).toBe(2)
  const [id, imm] = node.children
  expect(id.isIdentifier()).toBe(true)
  expect(id.data.value).toEqual('cool')
  expect(imm.isImmediate()).toBe(true)
  expect(imm.data.value).toEqual(-22)
})

test('command: without params', () => {
  const node = parse('.COMMAND')
  expect(node.isCommand()).toBe(true)
  expect(node.data.name).toEqual('COMMAND')
  expect(node.children.length).toBe(0)
})

test('command: with params', () => {
  const node = parse('.example $10, #1, %-101')
  expect(node.isCommand()).toBe(true)
  expect(node.data.name).toEqual('example')
  expect(node.children.length).toEqual(3)
  const [a, b, c] = node.children
  expect(a.isNumber()).toBe(true)
  expect(a.data.value).toBe(16)
  expect(b.isImmediate()).toBe(true)
  expect(b.data.value).toBe(1)
  expect(c.isNumber()).toBe(true)
  expect(c.data.value).toBe(-5)
})

test('label', () => {
  const node = parse('my_label:')
  expect(node.isLabel()).toBe(true)
  expect(node.data.name).toEqual('my_label')
})

test('local label', () => {
  const node = parse('@jump_local:')
  expect(node.isLocalLabel()).toBe(true)
  expect(node.data.name).toEqual('jump_local')
})

test('labeled instruction', () => {
  const nodes = parse('foo: ldx #22')
  expect(Array.isArray(nodes)).toBe(true)
  const [label, instruction] = nodes
  expect(label.isLabel()).toBe(true)
  expect(instruction.isInstruction()).toBe(true)
})

test('instruction: implicit', () => {
  const node = parse('rts')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('rts')
  expect(node.data.mode).toEqual('implicit')
  expect(node.children.length).toBe(0)
})

test('instruction: accumulator', () => {
  const node = parse('lsr A')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('lsr')
  expect(node.data.mode).toEqual('accumulator')
  expect(node.children.length).toBe(0)
})

test('instruction: immediate', () => {
  const node = parse('ldx #$10')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('ldx')
  expect(node.data.mode).toEqual('expression')
  expect(node.children.length).toBe(1)
  const [expr] = node.children
  expect(expr.isImmediate()).toBe(true)
  expect(expr.data.value).toBe(16)
})

test('instruction: zero page', () => {
  const node = parse('lsr $FA')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('lsr')
  expect(node.data.mode).toEqual('expression')
  expect(node.children.length).toBe(1)
  const [expr] = node.children
  expect(expr.isNumber()).toBe(true)
  expect(expr.data.value).toBe(250)
})

test('instruction: zero page, x', () => {
  const node = parse('ADC $12, X')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('adc')
  expect(node.data.mode).toEqual('xIndex')
  expect(node.children.length).toBe(1)
  const [expr] = node.children
  expect(expr.isNumber()).toBe(true)
  expect(expr.data.value).toBe(18)
})

test('instruction: zero page, y', () => {
  const node = parse('sbc $0f, y')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('sbc')
  expect(node.data.mode).toEqual('yIndex')
  expect(node.children.length).toBe(1)
  const [expr] = node.children
  expect(expr.isNumber()).toBe(true)
  expect(expr.data.value).toBe(15)
})

test('instruction: absolute', () => {
  const node = parse('lda $030C')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('lda')
  expect(node.data.mode).toEqual('expression')
  expect(node.children.length).toBe(1)
  const [expr] = node.children
  expect(expr.isNumber()).toBe(true)
  expect(expr.data.value).toBe(780)
})

test('instruction: absolute, x', () => {
  const node = parse('sta $2007, x')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('sta')
  expect(node.data.mode).toEqual('xIndex')
  expect(node.children.length).toBe(1)
  const [expr] = node.children
  expect(expr.isNumber()).toBe(true)
  expect(expr.data.value).toBe(8199)
})

test('instruction: absolute, y', () => {
  const node = parse('stx $604c, y')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('stx')
  expect(node.data.mode).toEqual('yIndex')
  expect(node.children.length).toBe(1)
  const [expr] = node.children
  expect(expr.isNumber()).toBe(true)
  expect(expr.data.value).toBe(24652)
})

test('instruction: indirect', () => {
  const node = parse('jmp ($FFFC)')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('jmp')
  expect(node.data.mode).toEqual('indirect')
  expect(node.children.length).toBe(1)
  const [expr] = node.children
  expect(expr.isNumber()).toBe(true)
  expect(expr.data.value).toBe(65532)
})

test('instruction: indexed indirect ($--,X)', () => {
  const node = parse('dec ($CA,X)')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('dec')
  expect(node.data.mode).toEqual('indirectX')
  expect(node.children.length).toBe(1)
  const [expr] = node.children
  expect(expr.isNumber()).toBe(true)
  expect(expr.data.value).toBe(202)
})

test('instruction: indirect indexed ($--),Y', () => {
  const node = parse('inc ($CA), y')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('inc')
  expect(node.data.mode).toEqual('indirectY')
  expect(node.children.length).toBe(1)
  const [expr] = node.children
  expect(expr.isNumber()).toBe(true)
  expect(expr.data.value).toBe(202)
})

test('instruction: relative', () => {
  const node = parse('bcc *-2')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('bcc')
  expect(node.data.mode).toEqual('relative')
  expect(node.children.length).toBe(1)
  const [number] = node.children
  expect(number.isNumber()).toBe(true)
  expect(number.data.value).toBe(-2)
})

test('instruction: local label', () => {
  const node = parse('jmp @break')
  expect(node.isInstruction()).toBe(true)
  expect(node.data.name).toEqual('jmp')
  expect(node.data.mode).toEqual('localLabel')
  expect(node.children.length).toBe(1)
  const [id] = node.children
  expect(id.isIdentifier()).toBe(true)
  expect(id.data.value).toEqual('break')
})
