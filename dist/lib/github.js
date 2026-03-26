import { Octokit } from "octokit";
export class GitHubClient {
    octokit;
    constructor(config) {
        // Token is optional - GitHub issues are publicly accessible
        // Authenticated requests have higher rate limits (5000/hour vs 60/hour for unauthenticated)
        this.octokit = new Octokit(config.token ? { auth: config.token } : {});
    }
    async listIssues(owner, repo, state = "open", limit = 30, labels) {
        try {
            const issues = [];
            let page = 1;
            const perPage = Math.min(limit, 100); // GitHub max is 100 per page
            // Keep fetching pages until we have enough actual issues (after PR filtering)
            while (issues.length < limit) {
                const { data } = await this.octokit.rest.issues.listForRepo({
                    owner,
                    repo,
                    state,
                    per_page: perPage,
                    page,
                    labels,
                });
                // Filter out pull requests, keeping only actual issues
                const issuesOnly = data.filter((item) => !item.pull_request);
                // Add to our collection, but don't exceed the limit
                const remaining = limit - issues.length;
                issues.push(...issuesOnly.slice(0, remaining));
                // If we got fewer items than requested, we've reached the end
                if (data.length < perPage) {
                    break;
                }
                page++;
            }
            return issues;
        }
        catch (error) {
            this.handleError(error, `${owner}/${repo}`);
            throw error;
        }
    }
    async getIssue(owner, repo, issueNumber) {
        try {
            const { data } = await this.octokit.rest.issues.get({
                owner,
                repo,
                issue_number: issueNumber,
            });
            return data;
        }
        catch (error) {
            this.handleError(error, `${owner}/${repo}#${issueNumber}`);
            throw error;
        }
    }
    /**
     * Fetch priority unassigned issues from a repository.
     * Filters for open issues with "priority" label and no assignee.
     */
    async getPriorityUnassignedIssues(owner, repo, limit = 30) {
        try {
            const issues = [];
            let page = 1;
            const perPage = Math.min(limit, 100);
            while (issues.length < limit) {
                const { data } = await this.octokit.rest.issues.listForRepo({
                    owner,
                    repo,
                    state: "open",
                    labels: "priority",
                    per_page: perPage,
                    page,
                });
                // Filter out pull requests and issues with assignees
                const priorityUnassigned = data.filter((item) => !item.pull_request && !item.assignee);
                const remaining = limit - issues.length;
                issues.push(...priorityUnassigned.slice(0, remaining));
                if (data.length < perPage) {
                    break;
                }
                page++;
            }
            return issues;
        }
        catch (error) {
            this.handleError(error, `${owner}/${repo}`);
            throw error;
        }
    }
    handleError(error, context) {
        if (error.status === 401) {
            console.error("Authentication failed. Check your GitHub token.");
        }
        else if (error.status === 404) {
            console.error(`Repository or issue not found: ${context}`);
        }
        else if (error.status === 403) {
            console.error("GitHub API rate limit exceeded or access forbidden.");
        }
        else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
            console.error("Network error. Check your connection.");
        }
        else {
            console.error(`Error: ${error.message || "Unknown error"}`);
        }
    }
}
//# sourceMappingURL=github.js.map