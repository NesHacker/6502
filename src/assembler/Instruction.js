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
    return Array.from(this.bytes)
      .map(b => b.toString(16))
      .map(s => s.length < 2 ? `0${s}` : s)
      .join('')
      .toUpperCase()
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
