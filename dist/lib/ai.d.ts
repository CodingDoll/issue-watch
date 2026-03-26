import type { Issue } from './github.js';
export interface AIConfig {
    url: string;
    token: string;
    model: string;
}
export declare class AISummarizer {
    private config;
    constructor(config: AIConfig);
    summarizeIssue(issue: Issue): Promise<string>;
    categorizeIssues(issues: Issue[]): Promise<Record<string, Issue[]>>;
    private classifyIssue;
    summarizeIssueChinese(issue: Issue): Promise<string>;
    private buildPrompt;
    private buildChinesePrompt;
}
export declare function getAIConfig(): AIConfig | null;
//# sourceMappingURL=ai.d.ts.map