const fs = require('fs')

const csv = fs.readFileSync('instructions.csv', 'utf8')

const instructions = {}

csv.split('\n').map(line => (
  line.trim().split(',')
)).slice(1) .forEach(([
    name,
    addressingMode,
    opcode,
    bytes,
    cycles,
    pageCycles,
    branchCycles
]) => {
  if (!instructions[name]) {
    instructions[name] = {}
  }

  if (instructions[addressingMode]) {
    throw new Error(
      `Encountered duplicate mode: ${name} ${addressingMode}`
    )
  }

  instructions[name][addressingMode] = {
    opcode: parseInt(opcode, 16),
    bytes: Number(bytes),
    cycles: Number(cycles),
    pageCycles: Number(pageCycles),
    branchCycles: Number(branchCycles)
  }
})

fs.writeFileSync('./instructions.json', JSON.stringify(instructions))
