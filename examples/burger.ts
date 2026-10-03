/**
 * Burger Example — @oakoliver/huh
 *
 * A multi-step order form in the spirit of charmbracelet/huh's burger demo:
 * a Select, a MultiSelect with a limit, an Input with validation, a Text
 * area, and a Confirm, split across groups.
 *
 * Run:  bun examples/burger.ts
 */

import {
  NewForm,
  NewGroup,
  NewSelect,
  NewMultiSelect,
  NewInput,
  NewText,
  NewConfirm,
  NewOption,
  ThemeCharm,
  ThemeFunc,
} from '../src/index.js';
import { WithAltScreen } from '@oakoliver/bubbletea';

let burger = '';
let toppings: string[] = [];
let name = '';
let instructions = '';
let discount = false;

const form = NewForm(
  NewGroup(
    NewSelect<string>()
      .title('Charmburger™')
      .description('Choose your burger')
      .options([
        NewOption('Charmburger Classic', 'classic'),
        NewOption('Chickwich', 'chickwich'),
        NewOption('Fishburger', 'fishburger'),
        NewOption('Charmpossible™ Burger', 'charmpossible'),
      ])
      .value(() => burger, (v) => { burger = v; }),

    NewMultiSelect<string>()
      .title('Toppings')
      .description('Choose up to 4.')
      .options([
        NewOption('Lettuce', 'lettuce'),
        NewOption('Tomatoes', 'tomatoes'),
        NewOption('Charm Sauce', 'charm sauce'),
        NewOption('Jalapeños', 'jalapeños'),
        NewOption('Cheese', 'cheese'),
        NewOption('Vegan Cheese', 'vegan cheese'),
        NewOption('Nutella', 'nutella'),
      ])
      .limit(4)
      .value(() => toppings, (v) => { toppings = v; }),
  ),

  NewGroup(
    NewInput()
      .title("What's your name?")
      .placeholder('Margaret Thatcher')
      .validate((s: string) => (s.trim() === '' ? new Error('Sorry, we need a name.') : null))
      .value(() => name, (v) => { name = v; }),

    NewText()
      .title('Special Instructions')
      .placeholder('Just put it in the mailbox please')
      .charLimit(400)
      .lines(3)
      .value(() => instructions, (v) => { instructions = v; }),

    NewConfirm()
      .title('Would you like 15% off?')
      .affirmative('Yes!')
      .negative('No.')
      .value(() => discount, (v) => { discount = v; }),
  ),
)
  .withTheme(ThemeFunc(ThemeCharm))
  .withProgramOptions(WithAltScreen());

await form.run();

const extras = toppings.length > 0 ? ` with ${toppings.join(', ')}` : '';
console.log(`\nOne ${burger}${extras} for ${name}${discount ? ', 15% off' : ''}. Thanks!`);
