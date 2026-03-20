import { NewSelect, NewForm, NewGroup, NewOptions, type Form } from "./src/index.js";
import { stripAnsi } from "@oakoliver/lipgloss";
import { KeyPressMsg, KeyCode, KeyMod } from "@oakoliver/bubbletea";

function codeKeypress(code: number): KeyPressMsg {
  return new KeyPressMsg({ text: "", mod: KeyMod.None, code });
}

function batchUpdate(result: [any, any]): any {
  let [m, cmd] = result;
  if (!cmd) return m;
  const msg = cmd();
  [m, cmd] = m.update(msg);
  if (!cmd) return m;
  const msg2 = cmd();
  [m] = m.update(msg2);
  return m;
}

function viewModel(m: { view(): string }): string {
  return stripAnsi(m.view());
}

const field = NewSelect<string>()
  .options(NewOptions("Foo\nLine 2", "Bar\nLine 2", "Baz\nLine 2", "Ban\nLine 2"))
  .title("Which one?");

const f = NewForm(NewGroup(field)).withHeight(5) as Form;
f.update(f.init());

let view = viewModel(f);
console.log("=== INITIAL VIEW ===");
console.log(view);
console.log("Contains '> Foo':", view.includes("> Foo"));

// Move down
const downKey = codeKeypress(KeyCode.Down);
console.log("\n=== Down key:", downKey.toString());
let m = batchUpdate(f.update(downKey)) as Form;
view = viewModel(m);
console.log("=== AFTER DOWN VIEW ===");
console.log(view);
console.log("Contains '> Bar':", view.includes("> Bar"));

const [hoveredVal, ok] = field.hovered();
console.log("Hovered:", hoveredVal, ok);
