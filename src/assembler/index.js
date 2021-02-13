const { AddressingMode, InstructionInfo } = require('./instructions')
const { parse } = require('./parser')
const ParseNode = require('./ParseNode')

/**
 * Thrown when an error occurs during assembly.
 */
class AssemblyError extends Error {
  /**
   * Creates a new AssemblyError.
   * @param {string} msg The error message.
   * @param {object} lineOptions Options describing the line for the error.
   * @param {number} lineOptions.lineNumber The number of the line on which the
   *   error occurred.
   * @param {string} assembly The assembly code that caused the error.
   */
  constructor (msg, { lineNumber, assembly }) {
    super(`Assembly Error, line ${lineNumber} near "${assembly}": ${msg}`)
  }
}
module.exports.AssemblyError = AssemblyError

/**
 * Basic structure for holding variable scope during assembly. Currently the
 * assembler only supports a single global scope. In the future this structure
 * can be made recursive if we wish to add user controlled scoping (e.g .SCOPE
 * command, etc.).
 */
class Scope {
  constructor () {
    this.constants = new Map()
  }
}

class Command {
  constructor (name, params) {
    this.name = name
    this.params = params
  }
}

class Instruction {
  constructor ({
    addressingMode,
    info,
    localLabel,
    name,
    value,
    source,
  }) {
    this.address = -1
    this.addressingMode = addressingMode
    this.bytes = []
    this.length = info.length
    this.localLabel = localLabel
    this.name = name
    this.opcode = info.opcode
    this.source = source
    this.value = value
  }

  toByteString () {
    return this.bytes.map(b => {
      const s = b.toString(16)
      return s.length < 2 ? '0' + s : s
    }).join('').toUpperCase()
  }
}

class Label {
  constructor (name, local = false) {
    this.name = name
    this.local = local
    this.address = -1
  }
}

/**
 * A collection of recursive handlers for converting parse nodes into linear
 * intermediate forms.
 */
class ParseNodeHandler {
  static statementList (node, scope) {
    return node.children
      .map(child => assembleParseNode(child, scope))
      .filter(r => !!r)
  }

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

  static command (node, scope) {
    const params = node.children.map(child => assembleParseNode(child, scope))
    return new Command(node.data.name, params)
  }

  static label (node, scope) {
    const { name } = node.data
    return new Label(name, false)
  }

  static localLabel (node, scope) {
    const { name } = node.data
    return new Label(name, true)
  }

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
      return new Instruction({
        addressingMode,
        info: InstructionInfo.get(name, addressingMode),
        localLabel,
        name,
        source: node.line.assembly,
        value,
      })
    } catch (err) {
      throw new AssemblyError(err.message, node.line)
    }
  }

  static identifier (node, scope) {
    const { value } = node.data
    if (scope.constants.has(value)) {
      return scope.constants.get(value)
    }
    return node
  }

  static immediate (node, scope) {
    if (node.data.value > 255) {
      throw new AssemblyError(
        `Immediate values must be between 0 and 255.`,
        node.line
      )
    }
    return node
  }

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
    throw new Error(`Encountered unknown ParseNode type '${node.type}'.`)
  }
  return handler(node, scope)
}


function assignAddresses (linearForm) {
  let address = 0
  for (const lir of linearForm) {
    if (lir instanceof Command) {
      if (lir.name !== 'org') {
        throw new Error(`Unknown command .${lir.name}`)
      }
      if (lir.params.length !== 1 || !lir.params[0].isNumber()) {
        throw new Error(`.org expects a single numeric command`)
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
    console.log(instruction)
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
      instruction.bytes = [opcode, param]
      break
    case 'relative':
      instruction.bytes = [opcode, param - instruction.length]
      break
    case 'indirect':
    case 'absolute':
    case 'absolute_x':
    case 'absolute_y':
      instruction.bytes = [opcode, param & 0x00FF, (param & 0xFF00) >> 8]
      break
  }
}

/**
 * Converts a number to a hexadecimal string of bytes.
 * @param {number} number The number to convert.
 * @return {string} A hex string.
 */
function toHexString (number) {
  const hex = number.toString(16)
  return `${hex % 2 === 1 ? '0' : ''}${hex}`.toUpperCase()
}
module.exports.toHexString = toHexString

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

