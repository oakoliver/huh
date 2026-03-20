/**
 * Run — convenience function to run a single field.
 * Port of charmbracelet/huh run.go
 *
 * Wraps a single field in a group and form, then runs it.
 */

import type { Field } from "./field-input.js";
import { NewGroup } from "./group.js";
import { NewForm } from "./form.js";

/**
 * Run runs a single field by wrapping it within a group and a form.
 */
export async function Run(field: Field): Promise<void> {
  const group = NewGroup(field);
  const form = NewForm(group).withShowHelp(false);
  return form.run();
}
