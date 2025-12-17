# Unused Dependency Cleaner

A powerful CLI tool to scan your Node.js project and identify or remove unused dependencies.

## Installation

```bash
npm install -g unused-dependency-cleaner
```

## Usage

### Scan for unused dependencies
```bash
unused-dep-clean scan
```

### Clean unused dependencies
```bash
unused-dep-clean clean
```

### Options
- `--dry-run`: Preview changes without modifying functionality.
- `--dev`: Include devDependencies in the scan.
- `--ignore <file>`: Specify a custom ignore file.

## Configuration
Create a `.unusedignore` file to exclude specific dependencies from being flagged.

## License
MIT
