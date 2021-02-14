const { InstructionInfo } = require("../instructions")
const { ParseLine } = require("../parser")
const ParseNode = require("../parser/ParseNode")
const { bytesToHex } = require("./util")

/**
 * Linear intermediate representation of an instruction.
 */
class Instruction {
  /**
   * Creates a new instruction.
   * @param {object} opts Options for the instruction.
   * @param {InstructionInfo} opts.info The 6502 instruction information.
   * @param {boolean} opts.localLabel Whether or not this instruction references
   *  a local label.
   * @param {ParseNode} opts.value The value for the instruction.
   * @param {ParseLine} opts.line The source line that generated the
   *  instruction.
   */
  constructor ({ info, localLabel, value, line }) {
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
    return bytesToHex(this.bytes)
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

module.exports = { Instruction }
