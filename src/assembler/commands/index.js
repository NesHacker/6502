const { byte } = require('./byte')
const { org } = require('./org')
const { AssemblyError } = require('../AssemblyError')

/**
 * Master list of all command executors.
 * @type {object}
 */
const commandExecutors = {
  'byt': byte,
  'byte': byte,
  'org': org
}

/**
 * Executes the given command and returns the result.
 * @param {Command} command The command to execute.
 */
function executeCommand (command) {
  const { line, name } = command
  const executor = commandExecutors[name]
  if (!executor) {
    throw new AssemblyError(`Invalid command "${name}.`, line)
  }
  return executor(command)
}

module.exports = { executeCommand }
