# @oakoliver/huh

Interactive terminal forms and prompts for TypeScript. A pure TypeScript port of [charmbracelet/huh](https://github.com/charmbracelet/huh) with zero external dependencies.

Built on top of [@oakoliver/bubbletea](https://www.npmjs.com/package/@oakoliver/bubbletea), [@oakoliver/bubbles](https://www.npmjs.com/package/@oakoliver/bubbles), and [@oakoliver/lipgloss](https://www.npmjs.com/package/@oakoliver/lipgloss).

## Features

- 7 field types: Input, Text, Select, MultiSelect, Confirm, Note, FilePicker
- Composable forms with Groups and multi-step navigation
- 5 built-in themes: Charm, Base, Dracula, Base16, Catppuccin
- Dynamic fields via `Eval` — update titles, descriptions, options at runtime
- Validation, filtering, accessible mode, keyboard navigation
- Full Elm Architecture integration (update/view cycle)
- ESM and CommonJS builds with full TypeScript declarations

## Install

```bash
npm install @oakoliver/huh
```

## Quick Start

```typescript
import {
  NewForm, NewGroup, NewInput, NewSelect, NewConfirm,
  NewOption, Run, ThemeCharm,
} from '@oakoliver/huh';

const name = { value: '' };
const color = { value: '' };
const confirm = { value: false };

const form = NewForm(
  NewGroup(
    NewInput()
      .title('Name')
      .description('What is your name?')
      .placeholder('John Doe')
      .value(name),

    NewSelect<string>()
      .title('Favorite Color')
      .options([
        NewOption('Red', 'red'),
        NewOption('Blue', 'blue'),
        NewOption('Green', 'green'),
      ])
      .value(color),

    NewConfirm()
      .title('Are you sure?')
      .affirmative('Yes')
      .negative('No')
      .value(confirm),
  ),
).theme(ThemeCharm());

await Run(form);

console.log(`Hello ${name.value}, you like ${color.value}!`);
```

## Fields

### Input

Single-line text input with placeholder, character limit, and validation.

```typescript
import { NewInput, ValidateNotEmpty } from '@oakoliver/huh';

const email = { value: '' };

NewInput()
  .title('Email')
  .description('Enter your email address')
  .placeholder('user@example.com')
  .charLimit(100)
  .validate(ValidateNotEmpty('email is required'))
  .value(email);
```

### Text

Multi-line text area with character limit and configurable height.

```typescript
import { NewText, ValidateMaxLength } from '@oakoliver/huh';

const bio = { value: '' };

NewText()
  .title('Bio')
  .description('Tell us about yourself')
  .placeholder('Write something...')
  .charLimit(500)
  .lines(5)
  .validate(ValidateMaxLength(500))
  .value(bio);
```

### Select

Single-choice selection with scrollable viewport and optional filtering.

```typescript
import { NewSelect, NewOption } from '@oakoliver/huh';

const lang = { value: '' };

NewSelect<string>()
  .title('Language')
  .description('Pick your primary language')
  .options([
    NewOption('TypeScript', 'ts'),
    NewOption('Go', 'go'),
    NewOption('Rust', 'rust'),
    NewOption('Python', 'py'),
  ])
  .height(5)
  .filtering(true)
  .value(lang);
```

### MultiSelect

Multiple-choice selection with optional limit and filtering.

```typescript
import { NewMultiSelect, NewOption } from '@oakoliver/huh';

const tools = { value: [] as string[] };

NewMultiSelect<string>()
  .title('Tools')
  .description('Select your tools (max 3)')
  .options([
    NewOption('VS Code', 'vscode'),
    NewOption('Vim', 'vim'),
    NewOption('Emacs', 'emacs'),
    NewOption('Helix', 'helix'),
  ])
  .limit(3)
  .height(6)
  .value(tools);
```

### Confirm

Yes/no confirmation prompt.

```typescript
import { NewConfirm } from '@oakoliver/huh';

const proceed = { value: false };

NewConfirm()
  .title('Continue?')
  .description('This will overwrite existing files')
  .affirmative('Yes')
  .negative('No')
  .value(proceed);
```

### Note

Read-only informational panel with optional title and height.

```typescript
import { NewNote } from '@oakoliver/huh';

NewNote()
  .title('Welcome')
  .description('This wizard will help you set up your project.\nPress Enter to continue.');
```

### FilePicker

File system browser with extension filtering and directory toggle.

```typescript
import { NewFilePicker } from '@oakoliver/huh';

const file = { value: '' };

NewFilePicker()
  .title('Config File')
  .description('Select a configuration file')
  .allowedTypes(['.json', '.yaml', '.toml'])
  .showHidden(false)
  .showDirectories(true)
  .height(10)
  .value(file);
```

## Forms and Groups

Compose fields into multi-step forms using Groups:

```typescript
import { NewForm, NewGroup, NewInput, NewSelect, NewOption } from '@oakoliver/huh';

const form = NewForm(
  // Step 1
  NewGroup(
    NewInput().title('Name').value(name),
    NewInput().title('Email').value(email),
  ).title('Personal Info'),

  // Step 2
  NewGroup(
    NewSelect<string>()
      .title('Plan')
      .options([NewOption('Free', 'free'), NewOption('Pro', 'pro')])
      .value(plan),
  ).title('Subscription'),
);
```

## Themes

```typescript
import {
  ThemeCharm, ThemeBase, ThemeDracula,
  ThemeBase16, ThemeCatppuccin, ThemeFunc,
} from '@oakoliver/huh';

// Use a built-in theme
const form = NewForm(...groups).theme(ThemeCharm());

// Use a custom theme function
const form = NewForm(...groups).theme(ThemeFunc(myCustomTheme));
```

## Dynamic Fields with Eval

Update field properties at runtime based on form state:

```typescript
import { NewInput, NewSelect, NewOption, Eval } from '@oakoliver/huh';

const role = { value: '' };
const dept = { value: '' };

NewSelect<string>()
  .title('Department')
  .optionsFunc(
    () => role.value === 'engineer'
      ? [NewOption('Backend', 'be'), NewOption('Frontend', 'fe')]
      : [NewOption('Sales', 'sales'), NewOption('Marketing', 'mkt')],
    role,
  )
  .value(dept);
```

## Validation

```typescript
import { ValidateNotEmpty, ValidateMinLength, ValidateMaxLength, ValidateLength } from '@oakoliver/huh';

NewInput()
  .title('Username')
  .validate(ValidateNotEmpty('username is required'))
  .value(username);

NewInput()
  .title('Password')
  .validate(ValidateMinLength(8))
  .value(password);

// Custom validation
NewInput()
  .title('Email')
  .validate((s: string) => {
    if (!s.includes('@')) return 'must be a valid email';
    return null;
  })
  .value(email);
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` | Submit field / Next group |
| `Shift+Tab` | Previous field |
| `Tab` | Next field |
| `Esc` | Abort form |
| `Up/Down` | Navigate options (Select/MultiSelect) |
| `Space` | Toggle selection (MultiSelect) |
| `/` | Start filtering (Select/MultiSelect) |
| `Ctrl+A` | Toggle all (MultiSelect) |

## Part of the Charm Ecosystem for TypeScript

| Package | Description |
|---------|-------------|
| [@oakoliver/lipgloss](https://www.npmjs.com/package/@oakoliver/lipgloss) | CSS-like terminal styling |
| [@oakoliver/glamour](https://www.npmjs.com/package/@oakoliver/glamour) | Stylesheet-based markdown rendering |
| [@oakoliver/bubbletea](https://www.npmjs.com/package/@oakoliver/bubbletea) | Elm Architecture TUI framework |
| [@oakoliver/bubbles](https://www.npmjs.com/package/@oakoliver/bubbles) | Pre-built TUI components |
| [@oakoliver/glow](https://www.npmjs.com/package/@oakoliver/glow) | Terminal markdown reader |
| **@oakoliver/huh** | **Interactive terminal forms (you are here)** |

## License

MIT - See [LICENSE](./LICENSE) for details.

Based on [charmbracelet/huh](https://github.com/charmbracelet/huh) by Charm.
