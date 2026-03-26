# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `doll-cli`, a Node.js CLI tool for viewing GitHub issues with AI-powered summarization and categorization.

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
    list.ts       # List issues with --ai-summary and --ai-categorize flags
    show.ts       # Show single issue with --ai-summary flag
  /lib
    github.ts     # GitHub API client using Octokit
    config.ts     # Configuration management
    formatter.ts  # Output formatting (table, json, simple)
    ai.ts         # AI summarization and categorization (OpenAI-compatible API)
    email.ts      # SMTP email service for scheduler notifications
    email-template.ts # HTML email templates for issue digests
  scheduler.ts    # Standalone cron-based scheduler for monitoring priority issues
  index.ts        # CLI entry point
/bin
  doll.js         # Executable wrapper
```

## Key Implementation Details

**Authentication:**
- GitHub token is optional (public repos accessible without auth)
- Token provides higher rate limits (5000/hour vs 60/hour)
- Set via `GITHUB_TOKEN` env var or `--token` flag

**AI Features:**
- Configured via `AI_URL`, `AI_TOKEN`, and optional `AI_MODEL` env vars
- Works with any OpenAI-compatible API (OpenAI, Azure, Ollama, etc.)
- `--ai-summary`: Generates 2-3 sentence summaries of issues
- `--ai-categorize`: Classifies issues as Bug, Feature, Documentation, or Other
- Includes Chinese language summarization (`summarizeIssueChinese`) for email digests

**Scheduler (Issue Picket):**
- A cron-based monitoring system for priority unassigned issues
- Fetches open issues with "priority" label and no assignee
- Sends email digests with AI-generated Chinese summaries
- Run once: `node dist/scheduler.js`
- Run with cron: `node dist/scheduler.js --cron`
- Environment variables required: `REPO_OWNER`, `REPO_NAME`, `CRON_SCHEDULE` (default: `0 9 * * *`), plus AI and SMTP config

**Output Formats:**
- `table` (default): Formatted table with columns: #, Title, Labels, State, Author, Assignee
- `json`: Raw JSON from GitHub API
- `simple`: One issue per line
