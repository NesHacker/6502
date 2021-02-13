const { test, expect } = require('@jest/globals')
const ParseNode = require('./ParseNode')
const { parse, ParseError } = require('./parser')


test('parses valid 6502 assembly', () => {
  const parseNode = parse(`
  @loop: dex
    bne @loop
    rts
  `)

  expect(parseNode).toBeInstanceOf(ParseNode)
  expect(parseNode.type).toEqual('statementList')
  expect(parseNode.children.length).toEqual(4)

  const [label, dex, bne, rts] = parseNode.children

  expect(label).toBeInstanceOf(ParseNode)
  expect(label.type).toEqual('localLabel')
  expect(label.data.name).toEqual('loop')

  expect(dex).toBeInstanceOf(ParseNode)
  expect(dex.type).toEqual('instruction')
  expect(dex.data.name).toEqual('dex')

  expect(bne).toBeInstanceOf(ParseNode)
  expect(bne.type).toEqual('instruction')
  expect(bne.data.name).toEqual('bne')

  expect(rts).toBeInstanceOf(ParseNode)
  expect(rts.type).toEqual('instruction')
  expect(rts.data.name).toEqual('rts')
})

test('parses commands', () => {
  const parseNode = parse(`.org $C000`)

  expect(parseNode).toBeInstanceOf(ParseNode)
  expect(parseNode.type).toEqual('statementList')
  expect(parseNode.children.length).toEqual(1)

  const [org] = parseNode.children
  expect(org).toBeInstanceOf(ParseNode)
  expect(org.type).toEqual('command')
  expect(org.data.name).toEqual('org')
})

test('correctly parses inline labels', () => {
  const parseNode = parse(`do_nothing: rts`)

  expect(parseNode).toBeInstanceOf(ParseNode)
  expect(parseNode.type).toEqual('statementList')
  expect(parseNode.children.length).toEqual(2)

  const [label, rts] = parseNode.children

  expect(label).toBeInstanceOf(ParseNode)
  expect(label.type).toEqual('label')
  expect(label.data.name).toEqual('do_nothing')

  expect(rts).toBeInstanceOf(ParseNode)
  expect(rts.type).toEqual('instruction')
  expect(rts.data.name).toEqual('rts')
})

test('correctly parses isolated labels', () => {
  const parseNode = parse(`
  do_nothing:
    rts
  `)

  expect(parseNode).toBeInstanceOf(ParseNode)
  expect(parseNode.type).toEqual('statementList')
  expect(parseNode.children.length).toEqual(2)

  const [label, rts] = parseNode.children

  expect(label).toBeInstanceOf(ParseNode)
  expect(label.type).toEqual('label')
  expect(label.data.name).toEqual('do_nothing')

  expect(rts).toBeInstanceOf(ParseNode)
  expect(rts.type).toEqual('instruction')
  expect(rts.data.name).toEqual('rts')
})

test('correctly parses inline local labels', () => {
  const parseNode = parse(`@loop: rts`)

  expect(parseNode).toBeInstanceOf(ParseNode)
  expect(parseNode.type).toEqual('statementList')
  expect(parseNode.children.length).toEqual(2)

  const [label, rts] = parseNode.children

  expect(label).toBeInstanceOf(ParseNode)
  expect(label.type).toEqual('localLabel')
  expect(label.data.name).toEqual('loop')

  expect(rts).toBeInstanceOf(ParseNode)
  expect(rts.type).toEqual('instruction')
  expect(rts.data.name).toEqual('rts')
})

test('correctly parses isolated local labels', () => {
  const parseNode = parse(`
  @loop:
    rts
  `)

  expect(parseNode).toBeInstanceOf(ParseNode)
  expect(parseNode.type).toEqual('statementList')
  expect(parseNode.children.length).toEqual(2)

  const [label, rts] = parseNode.children

  expect(label).toBeInstanceOf(ParseNode)
  expect(label.type).toEqual('localLabel')
  expect(label.data.name).toEqual('loop')

  expect(rts).toBeInstanceOf(ParseNode)
  expect(rts.type).toEqual('instruction')
  expect(rts.data.name).toEqual('rts')
})

test('on parse errors throws `ParseError`', () => {
  expect(() => parse('invalid @U(_))U(_)@UH')).toThrow(ParseError)
})