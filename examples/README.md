# Examples

Two small programs that exercise the form fields end to end, with made-up
data. Both import huh from `../src`, so they always run the code in this
checkout.

## publish-form.ts

A "Release a package" form in one group for an imaginary monorepo: a Select
of its packages, a version Input, a MultiSelect of release targets and a
Confirm. It shows the field styles of a theme and the spacing between fields.

```sh
bun examples/publish-form.ts            # Charm theme
bun examples/publish-form.ts dracula    # or catppuccin, base16, base
```

Keys: arrows to move, `/` to filter the packages, `enter` for the next field,
`x` or `space` to toggle a target, `shift+tab` to go back. When the form is
done it prints the chosen values.

## select-filter.ts

A long Select you can filter: 50 made-up document titles from a team
handbook. Move the cursor near the end, press `/` and type, e.g. `cach`: the
cursor moves to the first match and the list starts from the top, so matches
that were scrolled away above the window show up (upstream huh #804, in
1.1.0).

```sh
bun examples/select-filter.ts                 # the bundled handbook titles
bun examples/select-filter.ts some/dir        # the entries of a directory instead
bun examples/select-filter.ts some/dir .md    # only .md files, shown without the extension
```

## Requirements

- [Bun](https://bun.sh) to run the TypeScript directly.
- `npm install` in this repository first. The examples need the sibling
  versions this huh requires: `@oakoliver/lipgloss` 1.1.2 or later,
  `@oakoliver/bubbletea` 1.2.0 or later and `@oakoliver/bubbles` 1.2.2 or
  later.

Until those versions are on npm, run the examples against local builds of
the sibling repositories (checked out next to this one), without touching
`package.json` or the lockfile:

```sh
for pkg in lipgloss bubbletea bubbles; do
  (cd ../$pkg && npm run build)
  rm -rf node_modules/@oakoliver/$pkg
  mkdir -p node_modules/@oakoliver/$pkg
  cp -R ../$pkg/package.json ../$pkg/dist node_modules/@oakoliver/$pkg/
done
```

Run `npm install` again to go back to the versions from npm.

Type-check the examples with `bunx tsc -p examples/tsconfig.json`.
