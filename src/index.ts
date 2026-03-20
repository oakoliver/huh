/**
 * @oakoliver/huh — Interactive terminal forms and prompts.
 * TypeScript port of charmbracelet/huh (zero dependencies beyond own ecosystem).
 *
 * Re-exports all public API.
 */

// -- Core types --
export type { Field, FieldPosition } from "./field-input.js";
export { nextID, isFirst, isLast, NextField, PrevField } from "./field-input.js";
export type { NextFieldMsg, PrevFieldMsg } from "./field-input.js";
export { isNextFieldMsg, isPrevFieldMsg } from "./field-input.js";

// -- Accessor --
export type { Accessor } from "./accessor.js";
export { EmbeddedAccessor, PointerAccessor } from "./accessor.js";

// -- Option --
export { type Option, NewOption, NewOptions } from "./option.js";

// -- Eval --
export {
  Eval,
  updateFieldMsg,
  isUpdateFieldMsg,
  isUpdateTitleMsg,
  isUpdateDescriptionMsg,
  isUpdatePlaceholderMsg,
  isUpdateSuggestionsMsg,
  isUpdateOptionsMsg,
} from "./eval.js";
export type {
  UpdateTitleMsg,
  UpdateDescriptionMsg,
  UpdatePlaceholderMsg,
  UpdateSuggestionsMsg,
  UpdateOptionsMsg,
  UpdateFieldMsg,
} from "./eval.js";

// -- Selector --
export { Selector } from "./selector.js";

// -- Validation --
export { ValidateNotEmpty, ValidateMinLength, ValidateMaxLength, ValidateLength } from "./validate.js";
export type { ValidateFunc } from "./validate.js";

// -- Wrap --
export { wrap } from "./wrap.js";

// -- KeyMap --
export type {
  InputKeyMap,
  TextKeyMap,
  SelectKeyMap,
  MultiSelectKeyMap,
  FilePickerKeyMap,
  NoteKeyMap,
  ConfirmKeyMap,
  KeyMap,
} from "./keymap.js";
export { NewDefaultKeyMap } from "./keymap.js";

// -- Theme --
export type {
  TextInputStyles,
  FieldStyles,
  GroupStyles,
  FormStyles,
  Styles,
  Theme,
} from "./theme.js";
export {
  ThemeFuncImpl,
  ThemeFunc,
  ThemeBase,
  ThemeCharm,
  ThemeDracula,
  ThemeBase16,
  ThemeCatppuccin,
} from "./theme.js";

// -- Layout --
export type { Layout, LayoutForm, LayoutGroup } from "./layout.js";
export {
  layoutDefault,
  layoutStack,
  layoutColumns,
  layoutGrid,
} from "./layout.js";

// -- Fields --
export { Input, NewInput } from "./field-input.js";
export { Text, NewText } from "./field-text.js";
export { Select, NewSelect } from "./field-select.js";
export { MultiSelect, NewMultiSelect } from "./field-multiselect.js";
export { Confirm, NewConfirm } from "./field-confirm.js";
export { Note, NewNote } from "./field-note.js";
export { FilePicker, NewFilePicker } from "./field-filepicker.js";

// -- Group --
export { Group, NewGroup, nextGroup, prevGroup } from "./group.js";
export { isNextGroupMsg, isPrevGroupMsg } from "./group.js";
export type { NextGroupMsg, PrevGroupMsg } from "./group.js";

// -- Form --
export { Form, NewForm, FormState, ErrUserAborted, ErrTimeout } from "./form.js";

// -- Run --
export { Run } from "./run.js";

// -- Accessibility --
export { writeLine, readLine, prompt } from "./accessibility.js";
