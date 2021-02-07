;
; calculateBuyMaximum
; Address:  06:BDA0 (01BDB0)
;
; For the selected consumable item in a shop, this helper determines a maximum
; for how many can be bought. It limits the maximum based on available inventory
; space and party gold. If the player cannot fit another item or does not have
; enough gold to buy the item then this sets the maximum to 1. The result of
; the routine is stored at `$0D`.
;
; I wrote the algorithm to do this in JavaScript first and hand compiled it here
; for fun. The original code I wrote is in `calculateBuyMaximum.js` and
; sprinkled throughout the implementation below in the form of comments.
;
.PATCH($01BDB0, $BDA0)
  ; External references
  calculateTotal = $BF90
  cmpTotalToGold = $BEB0

calculateBuyMaximum:
  ; // Determine based on inventory count
  ; let max = 99 - inventoryCount
  lda #$63                ; A9 63
  ldx $030C               ; AE 0C 03
  sec                     ; 38
  sbc $6020, x            ; FD 20 60
  sta $04                 ; 85 04

  ; let total = price * max
  jsr calculateTotal      ; 20 90 BF

  ; // If they have enough gold, then this is the maximum
  ; if (total <= gold) {
  ;   return max
  ; }
  jsr cmpTotalToGold      ; 20 B0 BE
  beq *+2                  ; F0 02
  bcs *+9                  ; B0 09
  lda $04                 ; A5 04
  bne *+2                  ; D0 02
  lda #1                  ; A9 01
  sta $0D                 ; 85 0D
  rts                     ; 60

  ; // Use a binary search to find the maximum the party can afford

  ; let left = 0
  lda #$00                ; A9 00
  sta $02                 ; 85 02

  ; let right = max - 1
  ldx $04                 ; A6 04
  dex                     ; CA
  stx $03                 ; 86 03

  ; while (left < right) {
@loop:
  lda $02                 ; A5 02
  cmp $03                 ; C5 03
  bcs @break              ; B0 1F

  ;   max = (left + right) >> 1
  clc                     ; 18
  adc $03                 ; 65 03
  lsr                     ; 4A
  sta $04                 ; 85 04

  ;   total = price * max
  jsr calculateTotal      ; 20 90 BF

  ;   if (total < gold)
  ;     left = max + 1
  jsr cmpTotalToGold      ; 20 B0 BE
  bcs *+8                 ; B0 08
  ldx $04                 ; A6 04
  inx                     ; E8
  stx $02                 ; 86 02
  jmp @loop               ; 4C C7 BD

  ;   else if (total > gold)
  ;     right = max
  beq *+7                 ; F0 07
  lda $04                 ; A5 04
  sta $03                 ; 85 03
  jmp @loop               ; 4C C7 BD

  ;   else
  ;     break
@break:

  ; // Return the maximum
  ; return max > 0 ? max : 1
  lda $04                 ; A5 04
  bne *+2                  ; D0 02
  lda #1                  ; A9 01
  sta $0D                 ; 85 0D
  rts                     ; 60
.ENDPATCH
