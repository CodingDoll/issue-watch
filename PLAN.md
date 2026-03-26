# Implementation Plan: issue-picket Automation Tool

## Context

The PRD describes creating `issue-picket`, a Node.js automation tool that:
1. Daily scans specified GitHub repositories
2. Filters for issues with "priority" label AND unassigned status
3. Generates AI summaries in Chinese (under 100 characters)
4. Sends email notifications with the results
5. Uses cron scheduling for automation

The current codebase (`doll-cli`) already has:
- GitHub API integration via Octokit (`src/lib/github.ts`)
- AI summarization via OpenAI-compatible API (`src/lib/ai.ts`)
- CLI framework with commander (`src/index.ts`, `src/commands/`)
- Output formatting (`src/lib/formatter.ts`)

**Missing components for issue-picket:**
- Email sending functionality (nodemailer)
- Cron scheduling (node-cron)
- Specific filter for "priority" + "unassigned" issues
- Chinese language AI summaries
- HTML email template generation
- Main scheduler entry point

## Implementation Plan

### Phase 1: Add Required Dependencies

Install new packages:
```bash
pnpm add node-cron nodemailer
pnpm add -D @types/node-cron @types/nodemailer
```

### Phase 2: Create Email Service Module

**New file: `src/lib/email.ts`**

Create a module for sending emails using nodemailer:
- Define `EmailConfig` interface with SMTP settings (host, port, user, pass, from, to)
- Create `EmailService` class with `sendEmail(subject: string, htmlContent: string)` method
- Add HTML email template generation for issue reports
- Include error handling for SMTP failures

**Environment variables to add:**
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port (default 587)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `EMAIL_FROM` - From address
- `EMAIL_TO` - To address (comma-separated for multiple)

### Phase 3: Create Priority Filter Function

**Modify: `src/lib/github.ts`**

Add a new method to `GitHubClient` class:

```typescript
async getPriorityUnassignedIssues(owner: string, repo: string): Promise<Issue[]>
```

This method should:
1. Fetch open issues with "priority" label using GitHub API
2. Filter for unassigned issues (assignee === null)
3. Return the filtered list

Use the existing `listIssues` as a reference for pagination and filtering logic.

### Phase 4: Modify AI Service for Chinese Summaries

**Modify: `src/lib/ai.ts`**

Add a new method to `AISummarizer` class:

```typescript
async summarizeIssueChinese(issue: Issue): Promise<string>
```

This method should:
1. Use a Chinese-specific prompt: "你是一个技术专家，请用简洁的中文总结以下 Issue 的核心问题和紧急程度，不超过100字。"
2. Return the Chinese summary (max 100 characters)
3. Reuse the existing API call logic from `summarizeIssue`

Consider extracting the common API call logic into a private method to avoid duplication.

### Phase 5: Create Scheduler Entry Point

**New file: `src/scheduler.ts`**

Create a new entry point for the scheduled job:

```typescript
#!/usr/bin/env node
import { config } from 'dotenv';
config();

import { GitHubClient } from './lib/github.js';
import { getConfig } from './lib/config.js';
import { AISummarizer, getAIConfig } from './lib/ai.js';
import { EmailService, getEmailConfig } from './lib/email.js';
import { generateEmailTemplate } from './lib/email-template.js';

async function main() {
  // 1. Validate configurations
  // 2. Fetch priority unassigned issues
  // 3. Generate Chinese summaries
  // 4. Send email
}

main().catch(console.error);
```

### Phase 6: Create Email Template Generator

**New file: `src/lib/email-template.ts`**

Create a module for generating HTML email templates:

```typescript
export function generateEmailTemplate(
  repo: string,
  issues: Array<{
    number: number;
    title: string;
    url: string;
    summary: string;
  }>
): string
```

The template should include:
- Clean, professional HTML email design
- Table layout for issue list
- Links to each GitHub issue
- Chinese summary display
- Timestamp of when the email was sent

### Phase 7: Add Cron Configuration

**New file: `crontab.example`**

Provide an example crontab configuration:

```
# Run issue-picket every day at 9 AM
0 9 * * * cd /path/to/issue-picket && node dist/scheduler.js >> /var/log/issue-picket.log 2>&1
```

**Modify: `package.json`**

Add a new script:
```json
"scheduler": "node dist/scheduler.js"
```

### Phase 8: Create Environment Configuration Template

**New file: `.env.example`**

Create a comprehensive environment configuration template:

```bash
# GitHub Configuration
GITHUB_TOKEN=your_github_token_here

# AI Configuration (OpenAI-compatible API)
AI_URL=https://api.openai.com/v1/chat/completions
AI_TOKEN=your_ai_token_here
AI_MODEL=gpt-4

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_TO=recipient@example.com

# Repository to monitor
REPO_OWNER=example-org
REPO_NAME=example-repo
```

### Phase 9: Add Type Definitions

**Modify: `src/lib/github.ts`**

Add JSDoc comments and ensure proper type exports for the new priority filter function.

**Modify: `src/lib/ai.ts`**

Add type definitions for Chinese summary responses.

### Phase 10: Testing and Validation

**New file: `src/scheduler.test.ts`** (optional)

Create unit tests for the scheduler logic:
- Mock GitHub API responses
- Mock AI API responses
- Mock email sending
- Verify the full workflow

**Manual testing steps:**
1. Set up environment variables
2. Run `pnpm build` to compile TypeScript
3. Run `node dist/scheduler.js` to test manually
4. Verify email is received with correct content
5. Set up cron job for automated execution

## Critical Files to Modify

1. **`src/lib/github.ts`** - Add `getPriorityUnassignedIssues()` method
2. **`src/lib/ai.ts`** - Add `summarizeIssueChinese()` method
3. **`package.json`** - Add new dependencies and scripts
4. **`tsconfig.json`** - Verify compilation settings

## New Files to Create

1. **`src/lib/email.ts`** - Email service with nodemailer
2. **`src/lib/email-template.ts`** - HTML email template generator
3. **`src/scheduler.ts`** - Main scheduler entry point
4. **`.env.example`** - Environment configuration template
5. **`crontab.example`** - Cron job example

## Verification Steps

1. **Build**: `pnpm build` should compile without errors
2. **Type Check**: `pnpm exec tsc --noEmit` should pass
3. **Manual Run**: `node dist/scheduler.js` with proper env vars should:
   - Fetch priority unassigned issues
   - Generate Chinese summaries
   - Send email notification
4. **Email Content**: Verify HTML email contains:
   - List of priority unassigned issues
   - Chinese summaries for each issue
   - Links to GitHub issues
   - Timestamp

## Notes

- The project should be renamed from `doll-cli` to `issue-picket` in package.json
- The Chinese summary prompt should request under 100 characters
- Email should use HTML table layout for better readability
- Cron job should log output to file for debugging
