# Render from the repo root: vhs assets/tapes/validation.tape
Output assets/validation.gif

Set Shell bash
Set FontSize 16
Set Width 760
Set Height 320
Set Padding 24
Set Theme "Catppuccin Mocha"
Set TypingSpeed 70ms

Hide
Type "export PS1='> ' && clear"
Enter
Show

Type "bun examples/validation.ts"
Sleep 300ms
Enter
Sleep 1.2s
Type "ada"
Sleep 400ms
Enter
Sleep 1.5s
Type "@charm.sh"
Sleep 400ms
Enter
Sleep 700ms
Type "hunter2"
Sleep 400ms
Enter
Sleep 1.5s
Type "!"
Sleep 400ms
Enter
Sleep 1.5s
