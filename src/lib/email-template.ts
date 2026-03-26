export interface IssueSummary {
  number: number;
  title: string;
  url: string;
  summary: string;
  labels: string[];
  createdAt: string;
}

export function generateEmailTemplate(
  repo: string,
  issues: IssueSummary[]
): string {
  const now = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const issuesHtml = issues
    .map(
      (issue) => `
    <tr style="border-bottom: 1px solid #e1e4e8;">
      <td style="padding: 16px; vertical-align: top;">
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
          <a href="${issue.url}" style="color: #0366d6; text-decoration: none;">#${issue.number} ${escapeHtml(issue.title)}</a>
        </div>
        <div style="color: #586069; font-size: 12px; margin-bottom: 8px;">
          创建时间: ${issue.createdAt} | 标签: ${issue.labels.length > 0 ? issue.labels.join(', ') : '无'}
        </div>
        <div style="background-color: #f6f8fa; border-radius: 6px; padding: 12px; border-left: 3px solid #0366d6;">
          <div style="color: #24292e; font-size: 14px; line-height: 1.5;">
            <strong>AI 摘要:</strong> ${escapeHtml(issue.summary)}
          </div>
        </div>
      </td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Issue Picket 报告 - ${repo}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #24292e; background-color: #f6f8fa; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">
    <tr>
      <td style="padding: 32px 24px; border-bottom: 1px solid #e1e4e8;">
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #24292e;">
          📬 Issue Picket 每日报告
        </h1>
        <p style="margin: 0; color: #586069; font-size: 14px;">
          仓库: <strong>${repo}</strong> | 生成时间: ${now}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 16px 24px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
              <strong style="color: #856404;">筛选条件:</strong>
              <span style="color: #856404;">状态: Open | 标签: priority | 未分配</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
          🔍 发现 ${issues.length} 个优先级 Issue
        </h2>
        ${issues.length > 0 ? `<table width="100%" cellpadding="0" cellspacing="0">${issuesHtml}</table>` : '<p style="color: #586069; text-align: center; padding: 40px;">今日没有符合条件的 Issue 🎉</p>'}
      </td>
    </tr>
    <tr>
      <td style="padding: 24px; border-top: 1px solid #e1e4e8; text-align: center; color: #586069; font-size: 12px;">
        <p style="margin: 0;">此邮件由 Issue Picket 自动生成 | <a href="https://github.com/your-org/issue-picket" style="color: #0366d6;">GitHub</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const div = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => div[m as keyof typeof div]);
}
