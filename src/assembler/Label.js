/**
 * Linear intermediate representation of a label.
 */
class Label {
  /**
   * Creates a new linear intermediate label representation.
   * @param {object} opts
   * @param {string} opts.name The name for the label.
   * @param {boolean} opts.local `true` if the label is local, `false`
   *   otherwise.
   */
  constructor ({
    name,
    local
  }) {
    this.address = -1
    this._local = local
    this._name = name
  }

  /**
   * @return {number} The instruction address for the label.
   */
  get address () {
    return this._address
  }

  /**
   * Sets the instruction address for the label.
   * @param {number} addr The address to set.
   */
  set address (addr) {
    this._address = addr
  }

  /**
   * @return {boolean} `true` if this is a local label, `false` otherwise.
   */
  get local () {
    return this._local
  }

  /**
   * @return {string} The name of the label.
   */
  get name () {
    return this._name
  }
}

module.exports = { Label }
