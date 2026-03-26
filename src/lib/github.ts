import { Octokit } from "octokit";
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

export class GitHubClient {
  private octokit: Octokit;

  constructor(config: Config) {
    // Token is optional - GitHub issues are publicly accessible
    // Authenticated requests have higher rate limits (5000/hour vs 60/hour for unauthenticated)
    this.octokit = new Octokit(config.token ? { auth: config.token } : {});
  }

  async listIssues(
    owner: string,
    repo: string,
    state: "open" | "closed" | "all" = "open",
    limit: number = 30,
    labels?: string,
  ): Promise<Issue[]> {
    try {
      const issues: Issue[] = [];
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
        const issuesOnly = data.filter(
          (item: any) => !item.pull_request,
        ) as Issue[];

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
    } catch (error: any) {
      this.handleError(error, `${owner}/${repo}`);
      throw error;
    }
  }

  async getIssue(
    owner: string,
    repo: string,
    issueNumber: number,
  ): Promise<Issue> {
    try {
      const { data } = await this.octokit.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });

      return data as Issue;
    } catch (error: any) {
      this.handleError(error, `${owner}/${repo}#${issueNumber}`);
      throw error;
    }
  }

  /**
   * Fetch priority unassigned issues from a repository.
   * Filters for open issues with "priority" label and no assignee.
   */
  async getPriorityUnassignedIssues(
    owner: string,
    repo: string,
    limit: number = 30,
  ): Promise<Issue[]> {
    try {
      const issues: Issue[] = [];
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
        const priorityUnassigned = data.filter(
          (item: any) => !item.pull_request && !item.assignee,
        ) as Issue[];

        const remaining = limit - issues.length;
        issues.push(...priorityUnassigned.slice(0, remaining));

        if (data.length < perPage) {
          break;
        }

        page++;
      }

      return issues;
    } catch (error: any) {
      this.handleError(error, `${owner}/${repo}`);
      throw error;
    }
  }

  private handleError(error: any, context: string): void {
    if (error.status === 401) {
      console.error("Authentication failed. Check your GitHub token.");
    } else if (error.status === 404) {
      console.error(`Repository or issue not found: ${context}`);
    } else if (error.status === 403) {
      console.error("GitHub API rate limit exceeded or access forbidden.");
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      console.error("Network error. Check your connection.");
    } else {
      console.error(`Error: ${error.message || "Unknown error"}`);
    }
  }
}
