const fs = require('fs')
const { localLabel } = require('./src/assembler/ParseNode')
const { assemble, toHexString, Instruction } = require('./src/assembler')
const { parse } = require('./src/assembler/parser')

/**
 * Basic 6502 Assembler.
 * @author Ryan Sandor Richards
 */
class Assembler {
  /**
   * Converts the assembly source file at the given path to a string of
   * hexadecimal digits for use with hex editors.
   * @param {string} path Path to the assembly source file.
   */
  static fileToHexString (path) {
    const source = fs.readFileSync(path, 'utf8')
    return this.toHexString(source)
  }

  /**
   * Converts the given 6502 assembly source into a string of hexadecimal digits
   * for use with hex editors.
   * @param {string} source Assembly source to convert to a byte string.
   * @return {string} A string representation of the assembled bytes for the
   *   given source.
   */
  static toHexString (source) {
    return assemble(parse(source))
      .filter(lir => Array.isArray(lir.bytes))
      .map(lir => lir.toByteString())
      .join('')
  }

  /**
   * Parses and assembles the given 6502 assembly source and outputs the result
   * to the console.
   * @param {string} source Assembly source to inspect.
   */
  static inspect (source) {
    const root = parse(source)
    assemble(root).forEach(lir => {
      const address = toHexString(lir.address)
      if (lir instanceof Instruction) {
        console.log(address, lir.hex, '\t', lir.source)
      } else {
        console.log(address, (lir.local ? '@' : '') + lir.name + ':')
      }
    })
  }

  /**
   * Parses and assembles the 6502 assembly source file at the given path and
   * outputs the result to the console.
   * @param {string} path Path to the assembly source file.
   */
  static inspectFile (path) {
    const source = fs.readFileSync(path, 'utf8')
    this.inspect(source)
  }
}

module.exports = {
  Assembler
}
