const fs = require('fs')
const { parse } = require('./src/assembler/lineParser')


const lines = fs.readFileSync('example.s', 'utf8').split('\n')
  .map(line => (
    line
      .replace(/^\s+/, '')
      .replace(/;.*/, '')
      .replace(/\s+$/, '')
   ))
  .filter(line => line.length > 0)

// console.log(lines)

// console.log(parse(lines[4]).mode.value)

lines.forEach((line, index) => {
  try {
    const result = parse(line)
    if (result) console.log(line, result)
  } catch (err) {
    console.log(index, line, err)
  }
})
