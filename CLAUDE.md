# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `issuewatch`, a Node.js CLI tool for viewing GitHub issues.

## Package Manager

This project uses **pnpm** (specified as `pnpm@10.32.1` in `packageManager`).

## Common Commands

- `pnpm install` - Install dependencies
- `pnpm add <package>` - Add a dependency
- `pnpm add -D <package>` - Add a dev dependency
- `pnpm build` - Compile TypeScript
- `pnpm dev` - Run CLI in dev mode with tsx
- `pnpm test` - Run tests (vitest)
- `pnpm test -- src/lib/ai.test.ts` - Run a single test file

## Project Structure

```
/src
  /commands
    list.ts       # List issues
  /lib
    github.ts     # GitHub API client using Octokit
    config.ts     # Configuration management
    formatter.ts  # Output formatting
    state.ts      # Read/unread state management
    interactive-list.ts  # Interactive vim-style navigation
  index.ts        # CLI entry point
/bin
  issuewatch.js   # Executable wrapper
```

## Key Implementation Details

**Authentication:**
- GitHub token is optional (public repos accessible without auth)
- Token provides higher rate limits (5000/hour vs 60/hour)
- Set via `GITHUB_TOKEN` env var or `--token` flag

**Read/Unread State:**
- Persisted in `~/.issuewatch/state.json`
- Tracks which issues have been marked as read
- Used to sort issues (unread first)
- Limited to 1000 issues per repository (LRU eviction)

**Output Format:**
- Simple format only
- Shows: index, read status (✓/□), state (○/●), issue number, title
