const lineParser = require('./lineParser')

/**
 * Error thrown when assembly source fails to parse.
 */
class ParseError extends Error {
  /**
   * Creates a new parse error.
   * @param {array} errors An array of errors that occurred during parsing.
   */
  constructor (errors) {
    super('Failed to parse.')
    this._errors = Object.freeze(errors)
  }

  /**
   * An array of objects containing an error and the line on which it occurred.
   * @type {array}
   */
  get errors () {
    return this._errors
  }
}

/**
 * Parses the given assembly source.
 * @param {string} source The assembly source to parse.
 * @return {array} An array containing syntactically valid 6502 assembly lines
 *   in the source and their parsed representation.
 * @throws {ParseError} If any errors occur during parsing.
 */
function parse (source) {
  const parsed = []
  const parseErrors = []

  const lines = source.split('\n').map((sourceLine, index) => ({
    original: sourceLine + '\n',
    line: index + 1,
    assembly: sourceLine
      .replace(/^\s+/, '')
      .replace(/;.*/, '')
      .replace(/\s+$/, '')
  })).filter(line => line.assembly.length > 0)

  for (const line of lines) {
    try {
      const node = lineParser.parse(line.assembly)
      if (Array.isArray(node)) {
        node.forEach(n => parsed.push({ ...line, node: n }))
      } else {
        parsed.push({ ...line, node })
      }
    } catch (err) {
      parseErrors.push({ line, err })
    }
  }

  if (parseErrors.length > 0) {
    throw new ParseError(parseErrors)
  }

  return parsed
}

module.exports = { parse, ParseError }
