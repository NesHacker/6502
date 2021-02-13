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

/**
 * Linear intermediate representation of a command.
 */
class Command {
  /**
   * Creates a new command representation.
   * @param {object} opts Options for the command.
   * @param {object} opts.line Source line information for the command.
   * @param {string} opts.name The name of the command.
   * @param {Array<ParseNode>} opts.params The parameters to the command.
   */
  constructor ({ line, name, params }) {
    this._line = line
    this._name = name
    this._params = params
  }

  /**
   * @return {object} Line information for the command.
   */
  get line () {
    return this._line
  }

  /**
   * @return {string} The name of the command.
   */
  get name () {
    return this._name
  }

  /**
   * @return {Array<ParseNode>} The paramters for the command.
   */
  get params () {
    return this._params
  }
}

/**
 * Linear intermediate representation of an instruction.
 */
class Instruction {
  constructor ({
    info,
    localLabel,
    value,
    line
  }) {
    this._info = info
    this._line = line

    this.address = -1
    this.bytes = []
    this.value = value

    this.localLabel = localLabel

  }

  /**
   * @return {number} The address for the instruction.
   */
  get address () {
    return this._address
  }

  /**
   * Sets the program address for the instruction.
   * @param {number} addr The address to set.
   */
  set address (addr) {
    this._address = addr
  }

  /**
   * @return {string} The addressing mode for the instruction.
   */
  get addressingMode () {
    return this.info.addressingMode
  }

  /**
   * @return {Uint8Array} The bytes for the instruction.
   */
  get bytes () {
    return this._bytes
  }

  /**
   * Sets the bytes for the instruction.
   * @param {Uint8Array} bytes The bytes to set.
   */
  set bytes (bytes) {
    this._bytes = bytes
  }

  /**
   * @return {string} The hexadecimal string representation of the node's bytes.
   */
  get hex () {
    const byteToHex = b => {
      const s = b.toString(16)
      return s.length < 2 ? '0' + s : s
    }
    return this.bytes.map(byteToHex).join('').toUpperCase()
  }

  /**
   * @return {InstructionInfo} The general 6502 information for the instruction.
   */
  get info () {
    return this._info
  }

  /**
   * @return {number} The length of the instruction, in bytes.
   */
  get length () {
    return this.info.length
  }

  /**
   * @return {ParseLine} The line from which the instruction originated.
   */
  get line () {
    return this._line
  }

  /**
   * @return {string} The name of the instruction.
   */
  get name () {
    return this.info.name
  }

  /**
   * @return {number} The opcode for the instruction.
   */
  get opcode () {
    return this.info.opcode
  }

  /**
   * @return {string} The original assembly source for the instruction.
   */
  get source () {
    return this.line.assembly
  }

  /**
   * @return {ParseNode} The value for the node.
   */
  get value () {
    return this._value
  }

  set value (val) {
    this._value = val
  }
}
module.exports.Instruction = Instruction

/**
 * Linear intermediate representation of a label.
 */
class Label {
  /**
   * Creates a new linear intermediate label representation.
   * @param {object} opts
   * @param {string} opts.name The name for the label.
   * @param {boolean} opts.local `true` if the label is local, `false`
   *   otherwise.
   */
  constructor ({
    name,
    local
  }) {
    this.address = -1
    this._local = local
    this._name = name
  }

  /**
   * @return {number} The instruction address for the label.
   */
  get address () {
    return this._address
  }

  /**
   * Sets the instruction address for the label.
   * @param {number} addr The address to set.
   */
  set address (addr) {
    this._address = addr
  }

  /**
   * @return {boolean} `true` if this is a local label, `false` otherwise.
   */
  get local () {
    return this._local
  }

  /**
   * @return {string} The name of the label.
   */
  get name () {
    return this._name
  }
}
module.exports.Label = Label

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
    const { line } = node
    const { name } = node.data
    const params = node.children.map(child => assembleParseNode(child, scope))
    return new Command({ line, name, params })
  }

  static label (node, scope) {
    const { name } = node.data
    return new Label({ name, local: false })
  }

  static localLabel (node, scope) {
    const { name } = node.data
    return new Label({ name, local: true })
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
      const info = InstructionInfo.get(name, addressingMode)
      const { line } = node
      return new Instruction({ info, localLabel, line, value, })
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
    throw new AssemblyError(`Unknown parse node type "${node.type}"`, node.line)
  }
  return handler(node, scope)
}


function assignAddresses (linearForm) {
  let address = 0
  for (const lir of linearForm) {
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

