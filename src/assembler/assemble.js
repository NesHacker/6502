const { AddressingMode, InstructionInfo } = require('../instructions')
const ParseNode = require('../parser/ParseNode')
const { AssemblyError } = require('./AssemblyError')
const { Scope } = require('./Scope')
const { Command } = require('./Command')
const { Instruction } = require('./Instruction')
const { Label } = require('./Label')

/**
 * A collection of recursive handlers for converting parse nodes into linear
 * intermediate forms.
 */
class ParseNodeHandler {
  /**
   * Handles assembly for statement list parse nodes.
   * @param {ParseNode} node The statement list node to assemble.
   * @param {Scope} scope The current assembly scope.
   */
  static statementList (node, scope) {
    return node.children
      .map(child => assembleParseNode(child, scope))
      .filter(r => !!r)
  }

  /**
   * Handles recursive assembly for assignment nodes.
   * @param {ParseNode} node The assignment node to assemble.
   * @param {Scope} scope The current assembly scope.
   */
  static assignment (node, scope) {
    const [idNode, valueNode] = node.children
    const id = idNode.data.value
    const value = assembleParseNode(valueNode, scope)
    if (value.isIdentifier()) {
      throw new AssemblyError(
        `'${value.data.value}' is not defined.`,
        node.line
      )
    }
    scope.constants.set(id, value)
  }

  /**
   * Handles recursive assembly for command nodes.
   * @param {ParseNode} node The node to assemble.
   * @param {Scope} scope The current assembly scope.
   */
  static command (node, scope) {
    const { line } = node
    const { name } = node.data
    const params = node.children.map(child => assembleParseNode(child, scope))
    return new Command({ line, name, params })
  }

  /**
   * Handles recursive assembly for label nodes.
   * @param {ParseNode} node The node to assemble.
   * @param {Scope} scope The current assembly scope.
   */
  static label (node, scope) {
    const { name } = node.data
    return new Label({ name, local: false })
  }

  /**
   * Handles recursive assembly for local label nodes.
   * @param {ParseNode} node The node to assemble.
   * @param {Scope} scope The current assembly scope.
   */
  static localLabel (node, scope) {
    const { name } = node.data
    return new Label({ name, local: true })
  }

  /**
   * Handles recursive assembly for instruction nodes.
   * @param {ParseNode} node The node to assemble.
   * @param {Scope} scope The current assembly scope.
   */
  static instruction (node, scope) {
    const { name, mode } = node.data
    let value, addressingMode = '', localLabel = false

    switch (mode) {
      case 'accumulator':
        addressingMode = AddressingMode.Accumulator
        break
      case 'expression':
        value = assembleParseNode(node.children[0], scope)
        if (value.isNumber()) {
          if (value.data.value <= 255) {
            addressingMode = AddressingMode.ZeroPage
          } else {
            addressingMode = AddressingMode.Absolute
          }
        } else if (value.isImmediate()) {
          addressingMode = AddressingMode.Immediate
        } else if (value.isIdentifier()) {
          // Assume it's a global label
          addressingMode = AddressingMode.Absolute
        }
        break
      case 'implicit':
        addressingMode = AddressingMode.Implicit
        break
      case 'indirect':
        addressingMode = AddressingMode.Indirect
        value = assembleParseNode(node.children[0], scope)
        break
      case 'indirectX':
        addressingMode = AddressingMode.IndirectX
        value = assembleParseNode(node.children[0], scope)
        break
      case 'indirectY':
        addressingMode = AddressingMode.IndirectY
        value = assembleParseNode(node.children[0], scope)
        break
      case 'localLabel':
        if (name === 'jmp') {
          addressingMode = AddressingMode.Absolute
        } else {
          addressingMode = AddressingMode.Relative
        }
        value = node.children[0]
        localLabel = true
        break
      case 'relative':
        addressingMode = AddressingMode.Relative
        value = assembleParseNode(node.children[0], scope)
        break
      case 'xIndex':
        value = assembleParseNode(node.children[0], scope)
        if (value.isNumber()) {
          if (value.data.value <= 255) {
            addressingMode = AddressingMode.ZeroPageX
          } else {
            addressingMode = AddressingMode.AbsoluteX
          }
        } else if (value.isImmediate()) {
          throw new AssemblyError(
            `Expected an address for x-indexed addressing mode.`,
            node.line
          )
        } else if (value.isIdentifier()) {
          // Assume it's a global label
          addressingMode = AddressingMode.AbsoluteX
        }
        break
      case 'yIndex':
        value = assembleParseNode(node.children[0], scope)
        if (value.isNumber()) {
          if (value.data.value <= 255) {
            addressingMode = AddressingMode.ZeroPageY
          } else {
            addressingMode = AddressingMode.AbsoluteY
          }
        } else if (value.isImmediate()) {
          throw new AssemblyError(
            `Expected an address for y-indexed addressing mode.`,
            node.line
          )
        } else if (value.isIdentifier()) {
          // Assume it's a global label
          addressingMode = AddressingMode.AbsoluteY
        }
        break
    }

    try {
      const info = InstructionInfo.get(name, addressingMode)
      const { line } = node
      return new Instruction({ info, localLabel, line, value, })
    } catch (err) {
      throw new AssemblyError(err.message, node.line)
    }
  }

  /**
   * Handles recursive assembly for identifier nodes.
   * @param {ParseNode} node The node to assemble.
   * @param {Scope} scope The current assembly scope.
   */
  static identifier (node, scope) {
    const { value } = node.data
    if (scope.constants.has(value)) {
      return scope.constants.get(value)
    }
    return node
  }

  /**
   * Handles recursive assembly for immediate nodes.
   * @param {ParseNode} node The node to assemble.
   * @param {Scope} scope The current assembly scope.
   */
  static immediate (node, scope) {
    if (node.data.value > 255) {
      throw new AssemblyError(
        `Immediate values must be between 0 and 255.`,
        node.line
      )
    }
    return node
  }

  /**
   * Handles recursive assembly for number nodes.
   * @param {ParseNode} node The node to assemble.
   * @param {Scope} scope The current assembly scope.
   */
  static number (node, scope) {
    return node
  }
}

/**
 * Attempts to translate a 6502 assembly parse node into a linear intermediate
 * form.
 * @param {ParseNode} node The parse node to translate.
 * @param {Scope} scope The current scope for use with translation.
 */
function assembleParseNode (node, scope) {
  if (!scope) {
    scope = new Scope()
  }
  const handler = ParseNodeHandler[node.type]
  if (!handler) {
    throw new AssemblyError(`Unknown parse node type "${node.type}"`, node.line)
  }
  return handler(node, scope)
}

/**
 * Attempts to assign addresses to the given list of linear intermediate forms
 * models.
 * @param {Array} linearForms An array containing the linear forms for whcih to
 *   assign addresses.
 */
function assignAddresses (linearForms) {
  let address = 0
  for (const lir of linearForms) {
    if (lir instanceof Command) {
      if (lir.name !== 'org') {
        throw new AssemblyError(`Unknown command ".${lir.name}"`, lir.line)
      }
      if (lir.params.length !== 1 || !lir.params[0].isNumber()) {
        throw new AssemblyError(
          `.org expects a single numeric command`,
          lir.line
        )
      }
      address = lir.params[0].data.value
    } else if (lir instanceof Label) {
      lir.address = address
    } else if (lir instanceof Instruction) {
      lir.address = address
      address += lir.length
    }
  }
}

/**
 * Resolves labels to concrete addresses for an instruction. If the label is
 * not found in the given label maps or the instruction does not reference the
 * label then this function has no effect.
 * @param {object} labelMaps Object containing the local and global label maps.
 * @param {Map<string,number>} local Map from local label name to address.
 * @param {Map<string,number>} global Map from global label name to address.
 * @param {Instruction} instruction The instruction to for which to resolve
 *   label references.
 */
function resolveLabels ({ local, global }, instruction) {
  const { addressingMode, localLabel, value } = instruction

  if (!value || !value.isIdentifier()) {
    return
  }

  const id = value.data.value
  const labelAddress = localLabel ? local.get(id) : global.get(id)

  if (!labelAddress) {
    return
  }

  if (
    addressingMode === 'absolute' ||
    addressingMode === 'absolute_x' ||
    addressingMode === 'absolute_y'
  ) {
    instruction.value = new ParseNode('number', [], { value: labelAddress })
    instruction.value.line = value.line
  }

  if (addressingMode === 'relative') {
    // NOTE: Don't adjust for instruction length offset when calculating the
    // relative address for the local label. We automatically adjust all
    // relative addresses as the last step in `buildInstruction`
    const relativeAddress = (labelAddress - instruction.address)
    instruction.value = new ParseNode('number', [], { value: relativeAddress})
    instruction.value.line = value.line
  }
}

/**
 * Attempts to build the byte array for the given instruction. Instructions that
 * reference undefined labels cannot be built and this method will have no
 * effect (leaving the byte array for the instruction empty).
 * @param {Instruction} instruction The instruction to build.
 */
function buildInstruction (instruction) {
  const { addressingMode, opcode, value } = instruction

  if (
    addressingMode === 'implied' ||
    addressingMode === 'accumulator'
  ) {
    instruction.bytes = [opcode]
    return
  }

  if (!value) {
    throw new AssemblyError(
      'Internal error: expected instruction to have value',
      instruction.line
    )
  }

  if (value.isIdentifier()) {
    return
  }

  const param = value.data.value

  switch (addressingMode) {
    case 'zero_page':
    case 'immediate':
    case 'zero_page_x':
    case 'zero_page_y':
    case 'indirect_x':
    case 'indirect_x':
    case 'indirect_y':
    case 'indirect_y':
      instruction.bytes = new Uint8Array([
        opcode,
        param
      ])
      break
    case 'relative':
      instruction.bytes = new Uint8Array([
        opcode,
        param - instruction.length
      ])
      break
    case 'indirect':
    case 'absolute':
    case 'absolute_x':
    case 'absolute_y':
      instruction.bytes = new Uint8Array([
        opcode,
        param & 0x00FF,
        (param & 0xFF00) >> 8
      ])
      break
  }
}

module.exports.buildInstruction = buildInstruction

/**
 * Converts a parsed assembly program into a linear intermediate represenation
 * that can be converted into final forms (e.g. object files, bytes, etc.)
 * @param {ParseNode} rootNode The root parse node of the instructions to
 *   assemble.
 * @return {Array} An array containing a linerar representation of the assembly.
 */
function assemble (rootNode) {
  // Recursively construct the linear representation of the given root node
  const scope = new Scope()
  const linearForm = assembleParseNode(rootNode, scope)

  // Execute commands and assign addresses to labels and instructions
  assignAddresses(linearForm)

  // Build a map of all local and global labels
  const labelScope = { local: new Map(), global: new Map() }
  linearForm.filter(lir => lir instanceof Label).forEach(label => {
    const map = label.local ? labelScope.local : labelScope.global
    map.set(label.name, label.address)
  })

  // Perform label substitutions & build instruction bytes (where applicable)
  linearForm.filter(lir => lir instanceof Instruction).forEach(inst => {
    resolveLabels(labelScope, inst)
    buildInstruction(inst)
  })

  // Return the final assembled form
  return linearForm.filter(lir => (
    (lir instanceof Instruction) || (lir instanceof Label)
  ))
}

module.exports.assemble = assemble
