import { Command } from "commander";
import { getConfig, validateToken } from "../lib/config.js";
import { GitHubClient } from "../lib/github.js";
import { formatIssues } from "../lib/formatter.js";
import { markAsRead, isRead, getReadIssues, clearAllMarks, mergeWithLastArgs, } from "../lib/state.js";
import { InteractiveListNavigator } from "../lib/interactive-list.js";
export function createListCommand() {
    const command = new Command("list")
        .description("List issues from a GitHub repository")
        .argument("[owner]", "Repository owner (username or org)")
        .argument("[repo]", "Repository name")
        .option("-t, --token <token>", "GitHub personal access token")
        .option("-s, --state <state>", "Filter by state: open, closed, all", "open")
        .option("-l, --limit <number>", "Number of issues to fetch", "30")
        .option("-i, --interactive", "Enable interactive mode (press Enter to open URL)", true)
        .option("--labels <labels>", "Filter by labels (comma-separated)", "")
        .option("--unassigned", "Filter for issues without assignee", true)
        // Read/Unread options
        .option("--read", "Filter to show only read issues")
        .option("--unread", "Filter to show only unread issues")
        .option("--clear-marks", "Clear all read/unread marks for this repository")
        .action(async (owner, repo, options) => {
        try {
            // Merge with last args if owner/repo not provided
            const merged = mergeWithLastArgs(owner, repo, options);
            owner = merged.owner;
            repo = merged.repo;
            options = merged.options;
            if (!owner || !repo) {
                console.error("Error: Owner and repo are required (or use a previous session with saved args)");
                process.exit(1);
            }
            const config = getConfig(options.token);
            validateToken(config.token);
            const client = new GitHubClient(config);
            const state = options.state;
            const limit = parseInt(options.limit, 10);
            const labels = options.labels || undefined;
            // Handle clear-marks option first
            if (options.clearMarks) {
                clearAllMarks(owner, repo);
                console.log(`Cleared all read/unread marks for ${owner}/${repo}`);
                return;
            }
            if (!["open", "closed", "all"].includes(state)) {
                console.error("Error: State must be one of: open, closed, all");
                process.exit(1);
            }
            if (isNaN(limit) || limit < 1 || limit > 100) {
                console.error("Error: Limit must be a number between 1 and 100");
                process.exit(1);
            }
            let issues = await client.listIssues(owner, repo, state, limit, labels);
            // Filter for issues without assignee
            if (options.unassigned) {
                issues = issues.filter((issue) => !issue.assignee);
            }
            // Filter by read/unread status
            if (options.read) {
                const readIssueNumbers = new Set(getReadIssues(owner, repo));
                issues = issues.filter((issue) => readIssueNumbers.has(issue.number));
            }
            else if (options.unread) {
                const readIssueNumbers = new Set(getReadIssues(owner, repo));
                issues = issues.filter((issue) => !readIssueNumbers.has(issue.number));
            }
            if (issues.length === 0) {
                console.log(`No ${state} issues found in ${owner}/${repo}`);
                return;
            }
            // Build read status map for formatting
            const readStatus = {};
            for (const issue of issues) {
                readStatus[issue.number] = isRead(owner, repo, issue.number);
            }
            // Sort issues: unread first, then read
            issues.sort((a, b) => {
                const aIsRead = readStatus[a.number] ?? false;
                const bIsRead = readStatus[b.number] ?? false;
                // Unread (false) comes before read (true)
                if (aIsRead === bIsRead)
                    return 0;
                return aIsRead ? 1 : -1;
            });
            // Output issues
            const output = formatIssues(issues, readStatus);
            console.log(output);
            // Interactive mode: use vim-style navigation
            if (options.interactive && issues.length > 0) {
                const navigator = new InteractiveListNavigator(issues, {
                    owner,
                    repo,
                    readStatus,
                    onMarkAsRead: (issueNumber) => {
                        markAsRead(owner, repo, issueNumber);
                    },
                });
                await navigator.start();
            }
        }
        catch (error) {
            process.exit(1);
        }
    });
    return command;
}
//# sourceMappingURL=list.js.map