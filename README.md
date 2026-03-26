# doll-cli

A CLI tool for viewing GitHub issues with AI-powered summarization and categorization.

## Installation

```bash
pnpm install
pnpm build
```

## Configuration

### GitHub Authentication

Set your GitHub token:

```bash
export GITHUB_TOKEN=your_github_token_here
```

Or use the `--token` flag:

```bash
doll list owner repo --token ghp_xxx
```

### AI Configuration (OpenAI Protocol)

To use AI features (summarization and categorization), configure these environment variables:

```bash
export AI_URL=https://api.openai.com/v1/chat/completions
export AI_TOKEN=your_openai_api_key
export AI_MODEL=gpt-4  # Optional, defaults to gpt-4
```

The AI configuration supports any OpenAI-compatible API (OpenAI, Azure, local LLMs like Ollama, etc.).

## Usage

### List Issues

```bash
# List open issues
doll list facebook react

# List all issues with JSON output
doll list facebook react --state all --format json

# List closed issues with simple format
doll list facebook react --state closed --format simple

# Limit results
doll list facebook react --limit 10
```

### Show Issue Details

```bash
# Show issue details
doll show facebook react 12345
```

### AI Features

#### Summarization

Generate AI summaries of issues:

```bash
# Summarize a single issue
doll show owner repo 123 --ai-summary

# Summarize all listed issues
doll list owner repo --ai-summary
```

#### Categorization

Automatically categorize issues using AI:

```bash
# Categorize issues into Bug, Feature, Documentation, Other
doll list owner repo --ai-categorize

# Combine categorization with summarization
doll list owner repo --ai-categorize --ai-summary
```

## Output Formats

- **table** (default): Formatted table with issue details
- **json**: Raw JSON output from GitHub API
- **simple**: One issue per line

## Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --token <token>` | GitHub token | `GITHUB_TOKEN` env var |
| `-s, --state <state>` | Filter by state | `open` |
| `-l, --limit <number>` | Number of issues | `30` |
| `-f, --format <format>` | Output format | `table` |
| `--ai-summary` | Enable AI summarization | `false` |
| `--ai-categorize` | Enable AI categorization | `false` |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub personal access token |
| `AI_URL` | OpenAI-compatible API endpoint URL |
| `AI_TOKEN` | API key for the AI service |
| `AI_MODEL` | Model name (default: `gpt-4`) |

## License

ISC
