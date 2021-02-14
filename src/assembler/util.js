/**
 * Converts an array of bytes into a string of hexadecimal digits.
 * @param {Uint8Array} uint8Bytes Bytes to convert.
 * @return {string} The hexadecimal string representation of the bytes.
 */
function bytesToHex (uint8Bytes) {
  return Array.from(uint8Bytes)
    .map(b => b.toString(16))
    .map(s => s.length < 2 ? `0${s}` : s)
    .join('')
    .toUpperCase()
}

module.exports.bytesToHex = bytesToHex
