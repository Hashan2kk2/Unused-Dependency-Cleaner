# Unused Dependency Cleaner

A powerful, AST-based CLI tool to scan your Node.js project and strictly identify or remove unused NPM dependencies. It helps reduce `node_modules` bloat and keep your `package.json` clean.

![npm](https://img.shields.io/npm/v/unused-dep-cleaner)
![license](https://img.shields.io/npm/l/unused-dep-cleaner)
![downloads](https://img.shields.io/npm/dt/unused-dep-cleaner)
![TypeScript](https://img.shields.io/badge/built%20with-TypeScript-blue)
![stars](https://img.shields.io/github/stars/hashan2kk2/Unused-Dependency-Cleaner)

<br />

## Why use this?

Over time, projects accumulate dependencies that are no longer used. "Unused Dependency Cleaner" analyzes your source code to find which packages are actually imported or required, and which ones are just taking up space.

Unlike simple regex-based tools, this tool uses **AST (Abstract Syntax Tree) parsing** via Babel to accurately detect:
- ES6 Imports (`import x from 'y'`)
- CommonJS Requires (`require('y')`)
- Dynamic Imports (`import('y')`)
- Export from (`export * from 'y'`)

## Features

-  **Deep Scanning**: Parses `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs` files.
-  **Safe Cleaning**: Backs up your `package.json` before making changes.
-  **Dry Run**: Preview what will be removed without touching files.
-  **Configurable**: Ignore specific packages via `.unusedignore`.
-  **DevDependencies**: Option to include or exclude development dependencies.
-  **Smart Detection**: Automatically handles standard imports, scoped packages, and type definitions (`@types/pkg`).

## Installation

Install globally to use it on any project:

```bash
npm install -g unused-dependency-cleaner
```

Or run it directly with `npx`:

```bash
npx unused-dependency-cleaner scan
```

## Usage

Navigate to your project root (where `package.json` is located) and run:

### 1. Scan for Unused Dependencies
This simply lists dependencies that appear to be unused.

```bash
unused-dep-clean scan
```

**Options:**
- `--dev`:  Also check `devDependencies`.
- `--verbose`: Show detailed debug logs.
- `--ignore <file>`: Use a custom ignore file.

### 2. Remove Unused Dependencies
Automatically removes unused packages from `package.json`.

```bash
# Remove ALL unused dependencies
unused-dep-clean clean

# Remove a SINGLE unused dependency
unused-dep-clean clean <package-name>
```

**Options:**
- `--dry-run`:  **Recommended first.**  Simulate the removal and show what would happen.
- `--dev`:  Clean `devDependencies` too.

### Example Workflow

```bash
# 1. Check what's unused
unused-dep-clean scan

# 2. Preview cleanup (Safe)
unused-dep-clean clean --dry-run

# 3. Perform cleanup
unused-dep-clean clean

# 4. Re-install to update lockfile
npm install
```

## Configuration

You can create a `.unusedignore` file in your project root to prevent specific packages from being flagged as unused. This is useful for:
- Global shims or polyfills not imported directly.
- Binary-only packages (like CLI tools used in scripts).
- Framework plugins loaded via string config (e.g., eslint plugins).

**Example `.unusedignore`:**

```text
# Ignore build tools
typescript
ts-node

# Ignore types
@types/node
@types/jest

# Ignore webpack loaders
check-loader
css-loader
```

By default, the tool has a small internal list of sensible ignores (like `typescript`), but providing a file gives you full control.

## How it Works

1. **Read**: Parses your `package.json` to get the list of declared dependencies.
2. **Glob**: Finds all source code files in your directory (respecting `.gitignore`).
3. **Parse**: Uses `@babel/parser` to turn each file into an AST.
4. **Traverse**: Walks the AST to find every `ImportDeclaration` and `CallExpression` (for `require`/`import()`).
5. **Compare**: Matches found imports against your `package.json`.
6. **Report**: Flags any dependency that clearly wasn't imported.

## Development

If you want to contribute or modify the tool:

1. Clone the repo.
2. Install dependencies: `npm install`.
3. Build: `npm run build`.
4. Test locally: `node dist/index.js scan`.

## License

MIT © Hashan2kk2
