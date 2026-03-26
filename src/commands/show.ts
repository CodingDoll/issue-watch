import { Command } from 'commander';
import { getConfig, validateToken } from '../lib/config.js';
import { GitHubClient } from '../lib/github.js';
import { formatIssueDetail } from '../lib/formatter.js';
import { AISummarizer, getAIConfig } from '../lib/ai.js';
import { markAsRead, isRead, mergeWithLastArgs } from '../lib/state.js';

export function createShowCommand(): Command {
  const command = new Command('show')
    .description('Show details of a specific GitHub issue')
    .argument('[owner]', 'Repository owner (username or org)')
    .argument('[repo]', 'Repository name')
    .argument('<number>', 'Issue number')
    .option('-t, --token <token>', 'GitHub personal access token')
    .option('--ai-summary', 'Enable AI summarization for the issue (requires AI config)')
    .action(async (owner, repo, issueNumber, options) => {
      try {
        // Merge with last args if owner/repo not provided
        const merged = mergeWithLastArgs(owner, repo, options);
        owner = merged.owner;
        repo = merged.repo;

        if (!owner || !repo) {
          console.error("Error: Owner and repo are required (or use a previous session with saved args)");
          process.exit(1);
        }

        const config = getConfig(options.token);
        validateToken(config.token);

        const client = new GitHubClient(config);
        const number = parseInt(issueNumber, 10);

        if (isNaN(number) || number < 1) {
          console.error('Error: Issue number must be a positive integer');
          process.exit(1);
        }

        const issue = await client.getIssue(owner, repo, number);

        // Automatically mark as read when viewing
        const wasAlreadyRead = isRead(owner, repo, number);
        markAsRead(owner, repo, number);

        // Get current read status for display
        const readStatus = true; // Just marked as read

        // AI Summary
        if (options.aiSummary) {
          const aiConfig = getAIConfig();
          if (!aiConfig) {
            console.error('Error: AI features require AI_URL and AI_TOKEN environment variables');
            console.error('Set AI_URL, AI_TOKEN, and optionally AI_MODEL environment variables');
            process.exit(1);
          }

          console.log('Generating AI summary...\n');
          const aiSummarizer = new AISummarizer(aiConfig);
          try {
            const summary = await aiSummarizer.summarizeIssue(issue);
            console.log(formatIssueDetail(issue, readStatus));
            console.log('\n' + '='.repeat(60));
            console.log('🤖 AI Summary:');
            console.log('='.repeat(60));
            console.log(summary);
            console.log('='.repeat(60) + '\n');
          } catch (err: any) {
            console.error(`Failed to generate AI summary: ${err.message}`);
            console.log(formatIssueDetail(issue, readStatus));
            process.exit(1);
          }
          return;
        }

        console.log(formatIssueDetail(issue, readStatus));
      } catch (error) {
        process.exit(1);
      }
    });

  return command;
}
