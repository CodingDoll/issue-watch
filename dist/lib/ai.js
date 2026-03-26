export class AISummarizer {
    config;
    constructor(config) {
        this.config = config;
    }
    async summarizeIssue(issue) {
        const prompt = this.buildPrompt(issue);
        try {
            const response = await fetch(this.config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.token}`,
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that summarizes GitHub issues. Provide a concise 2-3 sentence summary of the issue, highlighting the main problem or request.',
                        },
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    max_tokens: 200,
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`AI API error: ${response.status} - ${error}`);
            }
            const data = await response.json();
            return data.choices?.[0]?.message?.content?.trim() || 'No summary available';
        }
        catch (error) {
            throw new Error(`Failed to summarize issue: ${error.message}`);
        }
    }
    async categorizeIssues(issues) {
        const categories = {
            'Bug': [],
            'Feature': [],
            'Documentation': [],
            'Other': [],
        };
        for (const issue of issues) {
            const category = await this.classifyIssue(issue);
            if (categories[category]) {
                categories[category].push(issue);
            }
            else {
                categories['Other'].push(issue);
            }
        }
        return categories;
    }
    async classifyIssue(issue) {
        const prompt = `Classify this GitHub issue into one of these categories: Bug, Feature, Documentation, or Other.

Issue Title: ${issue.title}
Issue Body: ${issue.body?.slice(0, 500) || 'No description'}

Respond with only the category name (Bug, Feature, Documentation, or Other).`;
        try {
            const response = await fetch(this.config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.token}`,
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    max_tokens: 50,
                }),
            });
            if (!response.ok) {
                return 'Other';
            }
            const data = await response.json();
            const result = data.choices?.[0]?.message?.content?.trim() || 'Other';
            const validCategories = ['Bug', 'Feature', 'Documentation'];
            return validCategories.includes(result) ? result : 'Other';
        }
        catch {
            return 'Other';
        }
    }
    async summarizeIssueChinese(issue) {
        const prompt = this.buildChinesePrompt(issue);
        try {
            const response = await fetch(this.config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.token}`,
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个技术专家，擅长分析GitHub Issue并提炼关键信息。请用简洁的中文总结问题的核心和紧急程度。',
                        },
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    max_tokens: 150,
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`AI API error: ${response.status} - ${error}`);
            }
            const data = await response.json();
            const summary = data.choices?.[0]?.message?.content?.trim() || '无法生成摘要';
            // Ensure summary is under 100 characters
            return summary.length > 100 ? summary.substring(0, 97) + '...' : summary;
        }
        catch (error) {
            throw new Error(`Failed to summarize issue in Chinese: ${error.message}`);
        }
    }
    buildPrompt(issue) {
        return `Please summarize this GitHub issue in 2-3 sentences:

Title: ${issue.title}

Description:
${issue.body || 'No description provided'}

Key Details:
- Issue #${issue.number}
- State: ${issue.state}
- Author: @${issue.user.login}
- Labels: ${issue.labels.map(l => l.name).join(', ') || 'None'}`;
    }
    buildChinesePrompt(issue) {
        return `请分析以下GitHub Issue，用不超过100字的中文总结核心问题和紧急程度：

标题: ${issue.title}

描述:
${issue.body || '无描述'}

关键信息:
- Issue编号: #${issue.number}
- 状态: ${issue.state}
- 作者: @${issue.user.login}
- 标签: ${issue.labels.map(l => l.name).join(', ') || '无'}`;
    }
}
export function getAIConfig() {
    const url = process.env.AI_URL || '';
    const token = process.env.AI_TOKEN || '';
    const model = process.env.AI_MODEL || 'gpt-4';
    if (!url || !token) {
        return null;
    }
    return { url, token, model };
}
//# sourceMappingURL=ai.js.map