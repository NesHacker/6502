/**
 * Thrown when an error occurs during assembly.
 */
class AssemblyError extends Error {
  /**
   * Creates a new AssemblyError.
   * @param {string} msg The error message.
   * @param {object} lineOptions Options describing the line for the error.
   * @param {number} lineOptions.lineNumber The number of the line on which the
   *   error occurred.
   * @param {string} assembly The assembly code that caused the error.
   */
  constructor (msg, { lineNumber, assembly }) {
    super(`Assembly Error, line ${lineNumber} near "${assembly}": ${msg}`)
  }
}

module.exports = { AssemblyError }
