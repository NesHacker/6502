const fs = require('fs')
const { parse } = require('./src/assembler/parser')


const source = fs.readFileSync('example.s', 'utf8')
console.log(parse(source))

// lines.forEach((line, index) => {
//   try {
//     const result = parse(line)
//     if (result) console.log(line, result)
//   } catch (err) {
//     console.log(index, line, err)
//   }
// })
