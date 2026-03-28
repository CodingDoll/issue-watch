import type { Issue } from "./github.js";
export interface ReadStatusMap {
    [issueNumber: string]: boolean;
}
export declare function formatIssues(issues: Issue[], readStatus?: ReadStatusMap, selectedIndex?: number): string;
//# sourceMappingURL=formatter.d.ts.map