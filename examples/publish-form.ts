/**
 * publish-form — a multi-field form in one group: a Select of packages, a
 * version Input, a MultiSelect of release targets and a Confirm. The project
 * and its packages are made up.
 *
 *   bun examples/publish-form.ts [theme]
 *
 * theme: charm (default), dracula, catppuccin, base16 or base.
 */
import {
  NewForm, NewGroup, NewInput, NewSelect, NewMultiSelect, NewConfirm, NewOption,
  ThemeFunc, ThemeBase, ThemeCharm, ThemeDracula, ThemeCatppuccin, ThemeBase16,
  type Styles,
} from "../src/index.ts";

const themes: Record<string, (isDark: boolean) => Styles> = {
  charm: ThemeCharm,
  dracula: ThemeDracula,
  catppuccin: ThemeCatppuccin,
  base16: ThemeBase16,
  base: ThemeBase,
};

const themeName = process.argv[2] ?? "charm";
const theme = themes[themeName];
if (!theme) {
  console.error(`unknown theme "${themeName}"; pick one of: ${Object.keys(themes).join(", ")}`);
  process.exit(1);
}

let pkg = "";
let version = "";
let targets: string[] = [];
let ship = true;

// The packages of an imaginary "Nimbus" monorepo and their current versions.
const packages = [
  ["@nimbus/core", "3.4.1"],
  ["@nimbus/cli", "3.4.0"],
  ["@nimbus/router", "2.9.2"],
  ["@nimbus/store", "2.1.0"],
  ["@nimbus/forms", "1.8.5"],
  ["@nimbus/charts", "1.2.3"],
  ["@nimbus/i18n", "1.0.7"],
  ["@nimbus/testing", "0.9.0"],
  ["@nimbus/devtools", "0.6.2"],
  ["@nimbus/create-app", "0.4.1"],
].map(([name, current]) => NewOption(`${name.padEnd(20)}  v${current}`, name));

const form = NewForm(
  NewGroup(
    NewSelect<string>()
      .title("Package")
      .description("Which package are you releasing?")
      .options(packages)
      .height(12)
      .value(() => pkg, (v) => (pkg = v)),
    NewInput()
      .title("Version")
      .placeholder("1.0.0")
      .value(() => version, (v) => (version = v)),
    NewMultiSelect<string>()
      .title("Targets")
      .description("Where should it go?")
      .options([
        NewOption("npm registry", "npm"),
        NewOption("GitHub release", "github"),
        NewOption("Changelog entry", "changelog"),
        NewOption("Docs site", "docs"),
        NewOption("Container image", "image"),
      ])
      .height(7)
      .value(() => targets, (v) => (targets = v)),
    NewConfirm()
      .title("Publish now?")
      .affirmative("Ship it")
      .negative("Not yet")
      .value(() => ship, (v) => (ship = v)),
  )
    .title("Release a package")
    .description("Bump the version and ship it."),
)
  .withTheme(ThemeFunc(theme))
  .withWidth(96);

await form.run();
console.log({ package: pkg, version, targets, ship });
