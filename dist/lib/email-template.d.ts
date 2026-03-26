export interface IssueSummary {
    number: number;
    title: string;
    url: string;
    summary: string;
    labels: string[];
    createdAt: string;
}
export declare function generateEmailTemplate(repo: string, issues: IssueSummary[]): string;
//# sourceMappingURL=email-template.d.ts.map