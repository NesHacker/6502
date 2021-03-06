/**
 * 6502 macro assembly parse tree data structure. Parse nodes are generated by
 * the line parser and are used as the primary program immediate form during
 * assembly.
 */
module.exports = class ParseNode {
  /**
   * Creates a parse node representing a variable assignment.
   * @param {ParseNode} id Node for the identifier to be assigned.
   * @param {ParseNode} value Node for the value to be assigned.
   * @return {ParseNode} The parse node.
   */
  static assignment (id, value) {
    return new ParseNode('assignment', [id, value])
  }

  /**
   * Creates a parse node reprensenting a command invocation.
   * @param {string} name The name of the command.
   * @param {ParseNode} params Node for the parameter expression list.
   * @return {ParseNode} The parse node.
   */
  static command (name, params) {
    const children = params ? params.children : []
    return new ParseNode('command', children, { name })
  }

  /**
   * Creates a parse node representing an expression list.
   * @param {Array<ParseNode>} expressions The expression nodes for the list.
   * @return {ParseNode} The parse node.
   */
  static expressionList (expressions) {
    return new ParseNode('expressionList', expressions)
  }

  /**
   * Creates a parse now representing an identifier.
   * @param {string} value String value for the identifier.
   * @return {ParseNode} The parse node.
   */
  static identifier (value) {
    return new ParseNode('identifier', [], { value })
  }

  /**
   * Creates a parse node representing an immediate.
   * @param {ParseNode} numberNode The number node for the immediate.
   * @return {ParseNode} The parse node.
   */
  static immediate (numberNode) {
    const { value } = numberNode.data
    return new ParseNode('immediate', [], { value: value })
  }

  /**
   * Creates a parse node representing an instruction.
   * @param {string} name Name of the instruction.
   * @param {string} mode Addressing mode for the instruction.
   * @param {ParseNode} [expression] Optional sub-expression node for the
   *  instruction.
   * @return {ParseNode} The parse node.
   */
  static instruction (name, mode, expression) {
    const children = expression ? [expression] : []
    return new ParseNode('instruction', children, { name, mode })
  }

  /**
   * Creates a parse node representing a label.
   * @param {ParseNode} name The identifier node for the label.
   * @return {ParseNode} The parse node.
   */
  static label (name) {
    return new ParseNode('label', [], { name: name.data.value })
  }

  /**
   * Creates a parse node representing a local label.
   * @param {ParseNode} name The identifier node for the label.
   * @return {ParseNode} The parse node.
   */
  static localLabel (name) {
    return new ParseNode('localLabel', [], { name: name.data.value })
  }

  /**
   * Creates a parse node representing a number.
   * @param {number} base The base for the number.
   * @param {string} valueText The text for the value of the number.
   * @return {ParseNode} The parse node.
   */
  static number (base, valueText) {
    const value = parseInt(valueText, base)
    return new ParseNode('number', [], { value })
  }

  /**
   * Creates a parse node representing a list of statements.
   * @param {Array<ParseNode>} children Nodes for the statement list.
   */
  static statementList (children) {
    return new ParseNode('statementList', children)
  }

  /**
   * Creates a parse node representing a string literal.
   * @param {string} value The value of the string literal.
   */
  static stringLiteral (value) {
    return new ParseNode('stringLiteral', [], { value })
  }

  /**
   * Creates a new parse node.
   * @param {string} type The node's type.
   * @param {Array<ParseNode>} [children] Array of children for the node.
   * @param {object} [data] Optional data for the node.
   */
  constructor (type, children = [], data = {}) {
    this._type = type
    this._children = children
    this._data = data
    this._line = null
  }

  /**
   * @return {Array<ParseNode>} The children of the parse node.
   */
  get children () {
    return this._children
  }

  /**
   * @return {object} The data for the parse node.
   */
  get data () {
    return this._data
  }

  /**
   * @return {ParseLine} Information about the line that generated this node.
   */
  get line () {
    return this._line
  }

  /**
   * Set the line information for the parse node.
   * @param {ParseLine} val The line information to set.
   */
  set line (val) {
    this._line = val
  }

  /**
   * @return {string} The type of parse node.
   */
  get type () {
    return this._type
  }


  /**
   * @return {boolean} `true` if the parse node represents an assignment
   *   statement, `false` otherwise.
   */
  isAssignment () {
    return this.type === 'assignment'
  }

  /**
   * @return `true` if the parse node represents a command statement, `false`
   *   otherwise.
   */
  isCommand () {
    return this.type === 'command'
  }

  /**
   * @return `true` if the parse node represents an expression list, `false`
   *   otherwise.
   */
  isExpressionList () {
    return this.type === 'expressionList'
  }

  /**
   * @return `true` if the parse node represents an identifier, `false`
   *   otherwise.
   */
  isIdentifier () {
    return this.type === 'identifier'
  }

  /**
   * @return `true` if the parse node represents an immediate, `false`
   *   otherwise.
   */
  isImmediate () {
    return this.type === 'immediate'
  }

  /**
   * @return `true` if the parse node represents an instruction, `false`
   *   otherwise.
   */
  isInstruction () {
    return this.type === 'instruction'
  }

  /**
   * @return `true` if the parse node represents a label, `false` otherwise.
   */
  isLabel () {
    return this.type === 'label'
  }

  /**
   * @return `true` if the parse node represents a local label, `false`
   *   otherwise.
   */
  isLocalLabel () {
    return this.type === 'localLabel'
  }

  /**
   * @return `true` if the parse node represents a number, `false` otherwise.
   */
  isNumber () {
    return this.type === 'number'
  }

  /**
   * @return `true` if the node represents a string literal, `false` otherwise.
   */
  isStringLiteral () {
    return this.type === 'stringLiteral'
  }
}

