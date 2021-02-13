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

module.exports = { Command }
