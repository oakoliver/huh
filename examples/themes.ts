/**
 * Themes Example — @oakoliver/huh
 *
 * Renders the same form once per built-in theme, side by side, using each
 * form's real view() output.
 *
 * Run:  bun examples/themes.ts
 */

import { joinHorizontal, newStyle, Top } from '@oakoliver/lipgloss';
import {
  NewForm,
  NewGroup,
  NewSelect,
  NewConfirm,
  NewOption,
  ThemeFunc,
  ThemeCharm,
  ThemeDracula,
  ThemeCatppuccin,
  ThemeBase16,
  ThemeBase,
  type Styles,
} from '../src/index.js';

const themes: Array<[string, (isDark: boolean) => Styles]> = [
  ['Charm', ThemeCharm],
  ['Dracula', ThemeDracula],
  ['Catppuccin', ThemeCatppuccin],
  ['Base16', ThemeBase16],
  ['Base', ThemeBase],
];

const label = newStyle().bold(true).marginBottom(1);
const column = newStyle().width(30).marginRight(2);

const columns = themes.map(([name, theme]) => {
  let shell = 'fish';
  let ok = true;
  const form = NewForm(
    NewGroup(
      NewSelect<string>()
        .title('Shell')
        .options([NewOption('Bash', 'bash'), NewOption('Zsh', 'zsh'), NewOption('Fish', 'fish')])
        .value(() => shell, (v) => { shell = v; }),
      NewConfirm()
        .title('Install completions?')
        .value(() => ok, (v) => { ok = v; }),
    ),
  )
    .withTheme(ThemeFunc(theme))
    .withShowHelp(false)
    .withWidth(28);
  form.init();
  return column.render(label.render(name) + '\n' + form.view());
});

console.log('\n' + joinHorizontal(Top, ...columns) + '\n');
