import type { Issue } from "./github.js";
export type OutputFormat = "table" | "json" | "simple";
export interface ReadStatusMap {
    [issueNumber: string]: boolean;
}
export declare function formatIssues(issues: Issue[], format: OutputFormat, repoContext?: string, readStatus?: ReadStatusMap, selectedIndex?: number): string;
export declare function formatIssueDetail(issue: Issue, isRead?: boolean): string;
//# sourceMappingURL=formatter.d.ts.map