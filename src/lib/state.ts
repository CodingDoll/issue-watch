import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface IssueReadState {
  read: boolean;
  readAt: string;
}

export interface RepoState {
  [issueNumber: string]: IssueReadState;
}

export interface StateData {
  [repoKey: string]: RepoState;
}

export interface LastCommandArgs {
  owner?: string;
  repo?: string;
  state?: string;
  limit?: number;
  format?: string;
  labels?: string;
  timestamp: string;
}

const STATE_DIR = join(homedir(), '.doll-cli');
const STATE_FILE = join(STATE_DIR, 'state.json');
const ARGS_FILE = join(STATE_DIR, 'last-args.json');

// Maximum number of issues to track per repository (LRU cache size)
const MAX_REPO_ISSUES = 1000;

function getStatePath(): string {
  return STATE_FILE;
}

/**
 * Cleanup old entries when the repo exceeds MAX_REPO_ISSUES.
 * Removes oldest entries based on readAt timestamp (LRU eviction).
 */
function cleanupOldEntries(repoState: RepoState): RepoState {
  const entries = Object.entries(repoState);

  if (entries.length <= MAX_REPO_ISSUES) {
    return repoState;
  }

  // Sort by readAt timestamp (oldest first)
  const sortedEntries = entries.sort((a, b) => {
    const timeA = new Date(a[1].readAt).getTime();
    const timeB = new Date(b[1].readAt).getTime();
    return timeA - timeB;
  });

  // Keep only the most recent MAX_REPO_ISSUES entries
  const entriesToKeep = sortedEntries.slice(-MAX_REPO_ISSUES);

  // Rebuild the repo state object
  const newRepoState: RepoState = {};
  for (const [issueNumber, state] of entriesToKeep) {
    newRepoState[issueNumber] = state;
  }

  return newRepoState;
}

export function loadState(): StateData {
  try {
    if (!existsSync(STATE_FILE)) {
      return {};
    }
    const data = readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(data) as StateData;
  } catch {
    return {};
  }
}

export function saveState(state: StateData, skipCleanup = false): void {
  try {
    if (!existsSync(STATE_DIR)) {
      mkdirSync(STATE_DIR, { recursive: true });
    }

    // Cleanup old entries for each repo before saving
    if (!skipCleanup) {
      for (const repoKey of Object.keys(state)) {
        state[repoKey] = cleanupOldEntries(state[repoKey]);
      }
    }

    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

function getRepoKey(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

export function markAsRead(owner: string, repo: string, issueNumber: number): void {
  const state = loadState();
  const repoKey = getRepoKey(owner, repo);

  if (!state[repoKey]) {
    state[repoKey] = {};
  }

  state[repoKey][issueNumber.toString()] = {
    read: true,
    readAt: new Date().toISOString(),
  };

  saveState(state);
}

export function markAsUnread(owner: string, repo: string, issueNumber: number): void {
  const state = loadState();
  const repoKey = getRepoKey(owner, repo);

  if (!state[repoKey]) {
    state[repoKey] = {};
  }

  state[repoKey][issueNumber.toString()] = {
    read: false,
    readAt: new Date().toISOString(),
  };

  saveState(state);
}

export function isRead(owner: string, repo: string, issueNumber: number): boolean {
  const state = loadState();
  const repoKey = getRepoKey(owner, repo);

  if (!state[repoKey]) {
    return false;
  }

  const issueState = state[repoKey][issueNumber.toString()];
  return issueState?.read === true;
}

export function getReadIssues(owner: string, repo: string): number[] {
  const state = loadState();
  const repoKey = getRepoKey(owner, repo);

  if (!state[repoKey]) {
    return [];
  }

  return Object.entries(state[repoKey])
    .filter(([, issueState]) => issueState.read)
    .map(([issueNumber]) => parseInt(issueNumber, 10));
}

export function getUnreadIssues(owner: string, repo: string, allIssueNumbers: number[]): number[] {
  const readIssues = new Set(getReadIssues(owner, repo));
  return allIssueNumbers.filter((num) => !readIssues.has(num));
}

export function clearAllMarks(owner: string, repo: string): void {
  const state = loadState();
  const repoKey = getRepoKey(owner, repo);

  if (state[repoKey]) {
    delete state[repoKey];
    saveState(state);
  }
}

// Last command arguments persistence
export function saveLastArgs(args: LastCommandArgs): void {
  try {
    if (!existsSync(STATE_DIR)) {
      mkdirSync(STATE_DIR, { recursive: true });
    }
    writeFileSync(ARGS_FILE, JSON.stringify(args, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save last args:', error);
  }
}

export function loadLastArgs(): LastCommandArgs | null {
  try {
    if (!existsSync(ARGS_FILE)) {
      return null;
    }
    const data = readFileSync(ARGS_FILE, 'utf-8');
    return JSON.parse(data) as LastCommandArgs;
  } catch {
    return null;
  }
}

// Helper to merge last args with current options
export function mergeWithLastArgs(
  owner: string,
  repo: string,
  options: any
): { owner: string; repo: string; options: any } {
  const lastArgs = loadLastArgs();

  // If user provided owner/repo, save them for next time
  if (owner && repo) {
    const argsToSave: LastCommandArgs = {
      owner,
      repo,
      state: options.state,
      limit: options.limit,
      format: options.format,
      labels: options.labels,
      timestamp: new Date().toISOString(),
    };
    saveLastArgs(argsToSave);
    return { owner, repo, options };
  }

  // If no owner/repo provided but we have saved args, use them
  if (!owner && !repo && lastArgs?.owner && lastArgs?.repo) {
    console.log(`Using last repository: ${lastArgs.owner}/${lastArgs.repo}`);
    return {
      owner: lastArgs.owner,
      repo: lastArgs.repo,
      options: {
        ...options,
        state: options.state || lastArgs.state,
        limit: options.limit || lastArgs.limit,
        format: options.format || lastArgs.format,
        labels: options.labels || lastArgs.labels,
      },
    };
  }
  return { owner, repo, options };
}
