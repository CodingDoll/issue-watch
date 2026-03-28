import type { Issue } from "./github.js";
import { ReadStatusMap } from "./formatter.js";
export interface InteractiveListOptions {
    owner: string;
    repo: string;
    readStatus: ReadStatusMap;
    onMarkAsRead: (issueNumber: number) => void;
}
export declare class InteractiveListNavigator {
    private issues;
    private options;
    private state;
    private terminalRows;
    private visibleCount;
    private isRunning;
    constructor(issues: Issue[], options: InteractiveListOptions);
    start(): Promise<void>;
    private handleKeyPress;
    private moveUp;
    private moveDown;
    private jumpToTop;
    private jumpToBottom;
    private pageUp;
    private pageDown;
    private ensureSelectionVisible;
    private openSelectedIssue;
    private clearScreen;
    private render;
    private formatIssueLine;
}
//# sourceMappingURL=interactive-list.d.ts.map