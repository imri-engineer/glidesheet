# Contributing to GlideSheet

Thanks for your interest in contributing!

## How to contribute

1. **Fork** this repository
2. Create a branch from `main`
3. Make your changes
4. Run tests: `bun test`
5. Run typecheck: `bun run lint`
6. Open a **Pull Request** against `main`

## Development setup

```bash
bun install
bun test          # Run tests
bun run build     # Build for production
bun run lint      # TypeScript check
```

## Guidelines

- Keep changes focused and small
- Add tests for new features
- Follow existing code patterns
- No new runtime dependencies

## Branch protection

- All changes to `main` must go through a Pull Request
- CI must pass (lint, test, build)
- At least 1 approval required

## Reporting bugs

Use the [bug report template](https://github.com/imri-engineer/glidesheet/issues/new?template=bug_report.md).
