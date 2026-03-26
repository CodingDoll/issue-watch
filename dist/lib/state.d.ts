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
export declare function loadState(): StateData;
export declare function saveState(state: StateData, skipCleanup?: boolean): void;
export declare function markAsRead(owner: string, repo: string, issueNumber: number): void;
export declare function markAsUnread(owner: string, repo: string, issueNumber: number): void;
export declare function isRead(owner: string, repo: string, issueNumber: number): boolean;
export declare function getReadIssues(owner: string, repo: string): number[];
export declare function getUnreadIssues(owner: string, repo: string, allIssueNumbers: number[]): number[];
export declare function clearAllMarks(owner: string, repo: string): void;
export declare function saveLastArgs(args: LastCommandArgs): void;
export declare function loadLastArgs(): LastCommandArgs | null;
export declare function mergeWithLastArgs(owner: string, repo: string, options: any): {
    owner: string;
    repo: string;
    options: any;
};
//# sourceMappingURL=state.d.ts.map