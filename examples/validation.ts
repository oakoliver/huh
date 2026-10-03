/**
 * Validation Example — @oakoliver/huh
 *
 * Inputs with validators: the form won't advance until each value is valid.
 *
 * Run:  bun examples/validation.ts
 */

import { WithAltScreen } from '@oakoliver/bubbletea';
import { NewForm, NewGroup, NewInput, ValidateMinLength, ThemeFunc, ThemeCharm } from '../src/index.js';

let email = '';
let password = '';

await NewForm(
  NewGroup(
    NewInput()
      .title('Email')
      .placeholder('you@example.com')
      .validate((s: string) => (s.includes('@') ? null : new Error('must be a valid email')))
      .value(() => email, (v) => { email = v; }),
    NewInput()
      .title('Password')
      .description('At least 8 characters.')
      .password()
      .validate(ValidateMinLength(8))
      .value(() => password, (v) => { password = v; }),
  ),
)
  .withTheme(ThemeFunc(ThemeCharm))
  .withProgramOptions(WithAltScreen())
  .run();

console.log(`Signed up as ${email}.`);
