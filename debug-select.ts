import { NewSelect, NewForm, NewGroup, NewOptions } from "./src/index.js";
import { stripAnsi, newStyle, stringWidth, joinHorizontal, Left } from "@oakoliver/lipgloss";

// First test the selector rendering directly
const selector = newStyle().foreground("212").setString("> ");
const selectorRendered = selector.render();
console.log("Selector render():", JSON.stringify(selectorRendered));
console.log("Selector stripped:", JSON.stringify(stripAnsi(selectorRendered)));
console.log("Selector width:", stringWidth(selectorRendered));

// Test joinHorizontal
const joined = joinHorizontal(Left, selectorRendered, "Foo");
console.log("Joined:", JSON.stringify(stripAnsi(joined)));

// Now test the actual select
const field = NewSelect<string>()
  .options(NewOptions("Foo\nLine 2", "Bar\nLine 2", "Baz\nLine 2", "Ban\nLine 2"))
  .title("Which one?");

const f = NewForm(NewGroup(field)).withHeight(5);
f.update(f.init());

const rawView = f.view();
const view = stripAnsi(rawView);
console.log("=== PRETTY VIEW ===");
console.log(view);
console.log("=== CONTAINS '> Foo'? ===", view.includes("> Foo"));
