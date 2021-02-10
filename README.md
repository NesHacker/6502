# 6502
JavaScript utilities for 6502 programming.

## Installation
`npm install @neshacker/6502-tools`

## Assembler
The package includes a basic 6502 assembler with support for basic constant
assignment, the `.org` command, and all core 6502 instructions and addressing
modes.

The assembler is very early in development and is not fully featured but it does
work well for some basic tasks, such as converting assembly to hex-strings for
use with a hex editor, etc. For larger tasks or projects we suggest you use
[ca65](https://cc65.github.io/doc/ca65.html).

### API Reference

#### `Assembler.inspect(source)`
Parses and assembles the given source into a linear intermediate representation
then outputs the results of the parse to the console.

```js
const { Assembler } = require('@neshacker/6502-tools')
const source = `
  my_routine = $ACDC
  .org $BD17
  another_routine:
    lda #22
    jsr my_routine
    rts
`
// Assemble and inspect the source
Assembler.inspect(source)
```
```
BD17 another_routine:
BD17 A916        lda #22
BD19 20DCAC      jsr my_routine
BD1C 60          rts
```

#### `Assembler.inspectFile(path)`
Same as `Assember.inspect` but instead converts the source found in the file
with the given path.

#### `Assembler.toHexString(source)`
Converts the given assembly source into a string of hexadecimal digits for use
with a hex editor.

```js
const { Assembler } = require('@neshacker/6502-tools')
const source = `
  my_routine = $ACDC
  .org $BD17
  another_routine:
    lda #22
    jsr my_routine
    rts
`
// Assemble and inspect the source
Assembler.toHexString(source)
```
```
A91620DCAC60
```

#### `Assembler.fileToHexString(source)`
Same as `Assembler.toHexString` but instead converts the source found in the
file with the given path.


## License
MIT
