/**
 * Utility class to generate intermediate form nodes during parsing of 6502
 * assembly.
 */
module.exports = class ParseNode {
  /**
   * Generates a node representing a variable assignment.
   * @param {object} identifier The identifier node for the left hand side of
   *   the assignment statement.
   * @param {object} value An expression node value for the assignment.
   * @return {object} An assignment node.
   */
  static assignment (identifier, value) {
    return { type: 'assignment', identifier: identifier.value, value }
  }

  static command (name, params = []) {
    return { type: 'command', name: name, params }
  }

  static addressingMode (mode, value) {
    return { type: 'addressingMode', mode, value }
  }

  static identifier (text) {
    const value = text.length == 1 ? text[0] : text[0] + text[1].join('')
    return { type: 'identifier', value }
  }

  static immediate (number) {
    return { type: 'immediate', number }
  }

  static instruction (name, mode) {
    return { type: 'instruction', name, mode }
  }

  static label (name, params = {}) {
    return { type: 'label', name, params }
  }

  static number (base, digits) {
    const value = parseInt(digits.join(''), base)
    return { type: 'number', base, value }
  }
}