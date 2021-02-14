const { AssemblyError } = require("../AssemblyError")

/**
 * Executes the `.org` command and returns the new instruction address generated
 * by the command.
 * @param {Command} command The org command to execute.
 * @return {number} The new instruction address.
 */
function org (command) {
  const { params } = command
  if (params.length !== 1 || !params[0].isNumber()) {
    throw new AssemblyError(`.org expects a single numeric command`, command.line)
  }
  return params[0].data.value
}

module.exports = { org }
