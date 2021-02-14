# 6502
JavaScript utilities for 6502 programming.

## Installation
`npm install @neshacker/6502-tools`

## Assembler
The package includes a basic 6502 assembler with support for basic variable
assignment, a handful of assembler commands, and all core 6502 instruction
addressing modes.

The assembler is very early in development and is not fully featured but it does
work well for some basic tasks, such as converting assembly to hex-strings for
use with a hex editor, etc. For larger tasks or projects please use a more
mature assembler such as [ca65](https://cc65.github.io/doc/ca65.html).

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

### Commands

#### `.addr`
This command set the absolute program address at the point of invocation. It is
useful for defining patch segements for ROM hacks.

```
; Set the absolute program offset to $C000
.org $C000
  lda #0      ; Address $C000
  @loop:      ; Address = $C002
  dex         ; Address = $C002
  bne @loop   ; Address = $C003, branch to @loop on zero flag
```

#### `.byte`
This defines a run of arbitrary bytes to be processed by the assembler. Useful
for defining lookup tables or text segments.

```
.byte 16, 32, 64   ; Literal bytes: $10, $20, $40
.byte "Hello"      ; Literal bytes: $48, $65, 6C, $6C, $6F
```

## License
MIT
