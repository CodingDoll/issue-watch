# issuewatch

A CLI tool for viewing GitHub issues.

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
issuewatch list owner repo --token ghp_xxx
```

## Usage

### List Issues

```bash
# List open issues
issuewatch list facebook react

# List all issues
issuewatch list facebook react --state all

# List closed issues
issuewatch list facebook react --state closed

# Limit results
issuewatch list facebook react --limit 10
```

## Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --token <token>` | GitHub token | `GITHUB_TOKEN` env var |
| `-s, --state <state>` | Filter by state | `open` |
| `-l, --limit <number>` | Number of issues | `30` |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub personal access token |

## License

ISC
