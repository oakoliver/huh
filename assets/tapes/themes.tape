# Render from the repo root: vhs assets/tapes/themes.tape

Set Shell bash
Set FontSize 14
Set Width 1440
Set Height 480
Set Padding 24
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms

Hide
Type "export PS1='> ' && clear"
Enter
Show

Type "bun examples/themes.ts"
Sleep 300ms
Enter
Sleep 1.5s
Screenshot assets/themes.png
