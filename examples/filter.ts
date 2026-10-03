/**
 * Filter Example — @oakoliver/huh
 *
 * A Select with a scrollable viewport; press / to filter the options.
 *
 * Run:  bun examples/filter.ts
 */

import { WithAltScreen } from '@oakoliver/bubbletea';
import { NewForm, NewGroup, NewSelect, NewOption, ThemeFunc, ThemeCharm } from '../src/index.js';

let language = '';

const languages = [
  'TypeScript', 'Go', 'Rust', 'Python', 'Ruby', 'Elixir', 'Haskell',
  'Kotlin', 'Swift', 'Zig', 'OCaml', 'Clojure', 'Gleam', 'Crystal',
];

await NewForm(
  NewGroup(
    NewSelect<string>()
      .title('Pick a language')
      .description('Press / to filter.')
      .options(languages.map((l) => NewOption(l, l)))
      .height(8)
      .value(() => language, (v) => { language = v; }),
  ),
)
  .withTheme(ThemeFunc(ThemeCharm))
  .withProgramOptions(WithAltScreen())
  .run();

console.log(`You picked ${language}.`);
