import type { Config } from "./config.js";
export interface Issue {
    number: number;
    title: string;
    state: "open" | "closed";
    body: string | null;
    user: {
        login: string;
    };
    labels: Array<{
        name: string;
        color: string;
    }>;
    assignee: {
        login: string;
    } | null;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    html_url: string;
}
export declare class GitHubClient {
    private octokit;
    constructor(config: Config);
    listIssues(owner: string, repo: string, state?: "open" | "closed" | "all", limit?: number, labels?: string): Promise<Issue[]>;
    getIssue(owner: string, repo: string, issueNumber: number): Promise<Issue>;
    /**
     * Fetch priority unassigned issues from a repository.
     * Filters for open issues with "priority" label and no assignee.
     */
    getPriorityUnassignedIssues(owner: string, repo: string, limit?: number): Promise<Issue[]>;
    private handleError;
}
//# sourceMappingURL=github.d.ts.map