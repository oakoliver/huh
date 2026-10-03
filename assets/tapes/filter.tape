# Render from the repo root: vhs assets/tapes/filter.tape
Output assets/filter.gif

Set Shell bash
Set FontSize 16
Set Width 760
Set Height 360
Set Padding 24
Set Theme "Catppuccin Mocha"
Set TypingSpeed 60ms

Hide
Type "export PS1='> ' && clear"
Enter
Show

Type "bun examples/filter.ts"
Sleep 300ms
Enter
Sleep 1.2s
Down@250ms 4
Sleep 500ms
Type "/"
Sleep 400ms
Type@150ms "gl"
Sleep 1s
Enter
Sleep 1.5s
