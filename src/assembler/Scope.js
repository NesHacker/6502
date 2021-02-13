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

module.exports = { Scope }
