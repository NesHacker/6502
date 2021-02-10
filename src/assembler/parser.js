const lineParser = require('./lineParser')
const ParseNode = require('./ParseNode')

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

module.exports.ParseError = ParseError

/**
 * Information about a parsed line.
 */
class ParseLine {
  /**
   * Creates a new parse line.
   * @param {object} params The parameters for the parse line.
   * @param {string} params.assembly The macro assembly for the line.
   * @param {number} params.lineNumber The number for the line.
   * @param {string} params.original The original source for the line.
   */
  constructor ({ assembly, lineNumber, original }) {
    this._data = { original, lineNumber, assembly }
  }

  /**
   * @return {string} The original text for the line.
   */
  get original () {
    return this._data.original
  }

  /**
   * @return {number} The line number in the original source.
   */
  get lineNumber () {
    return this._data.lineNumber
  }

  /**
   * @return {string} The stripped macro assembly for the line.
   */
  get assembly () {
    return this._data.assembly
  }
}

module.exports.ParseLine = ParseLine

/**
 * Recursively sets the parse line for a node and all its children.
 * @param {ParseLine} line The parse line to set.
 * @param {ParseNode} node The parse node for which to set the line.
 */
function setNodeLine (line, node) {
  node.line = line
  node.children.forEach(child => setNodeLine(line, child))
}

/**
 * Parses the given assembly source.
 * @param {string} source The assembly source to parse.
 * @return {Array<ParseNode>} An array of nodes parsed from the lines of the
 *   given source.
 * @throws {ParseError} If any errors occur during parsing.
 */
function parse (source) {
  const parsed = []
  const parseErrors = []

  const lines = source.split('\n').map((sourceLine, index) => (new ParseLine({
    original: sourceLine + '\n',
    lineNumber: index + 1,
    assembly: sourceLine
      .replace(/^\s+/, '')
      .replace(/;.*/, '')
      .replace(/\s+$/, '')
  }))).filter(line => line.assembly.length > 0)

  for (const line of lines) {
    try {
      const node = lineParser.parse(line.assembly)
      if (Array.isArray(node)) {
        node.forEach(n => {
          n.line = line
          setNodeLine(line, n)
        })
      } else {
        setNodeLine(line, node)
        parsed.push(node)
      }
    } catch (err) {
      parseErrors.push({ line, err })
    }
  }

  if (parseErrors.length > 0) {
    throw new ParseError(parseErrors)
  }

  return ParseNode.statementList(parsed)
}

module.exports.parse = parse
