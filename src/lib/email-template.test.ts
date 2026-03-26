import { describe, it, expect } from 'vitest';
import { generateEmailTemplate, type IssueSummary } from './email-template.js';

describe('generateEmailTemplate', () => {
  const mockIssues: IssueSummary[] = [
    {
      number: 123,
      title: 'Critical bug in production',
      url: 'https://github.com/test/repo/issues/123',
      summary: '这是一个严重的生产环境问题，需要立即修复。',
      labels: ['bug', 'priority', 'production'],
      createdAt: '2024-01-15',
    },
    {
      number: 124,
      title: 'Feature request: Add dark mode',
      url: 'https://github.com/test/repo/issues/124',
      summary: '用户希望在应用中添加暗黑模式支持。',
      labels: ['feature', 'enhancement'],
      createdAt: '2024-01-14',
    },
  ];

  it('should generate HTML email template with repository name', () => {
    const html = generateEmailTemplate('test/repo', mockIssues);

    expect(html).toContain('test/repo');
    expect(html).toContain('Issue Picket');
    expect(html).toContain('优先级 Issue');
  });

  it('should include issue details for each issue', () => {
    const html = generateEmailTemplate('test/repo', mockIssues);

    expect(html).toContain('#123');
    expect(html).toContain('Critical bug in production');
    expect(html).toContain('https://github.com/test/repo/issues/123');
    expect(html).toContain('这是一个严重的生产环境问题，需要立即修复。');
  });

  it('should include all labels', () => {
    const html = generateEmailTemplate('test/repo', mockIssues);

    expect(html).toContain('bug');
    expect(html).toContain('priority');
    expect(html).toContain('production');
    expect(html).toContain('feature');
    expect(html).toContain('enhancement');
  });

  it('should include creation dates', () => {
    const html = generateEmailTemplate('test/repo', mockIssues);

    expect(html).toContain('2024-01-15');
    expect(html).toContain('2024-01-14');
  });

  it('should handle empty issues array', () => {
    const html = generateEmailTemplate('test/repo', []);

    expect(html).toContain('test/repo');
    expect(html).toContain('Issue Picket');
    // Should show 0 issues
    expect(html).toContain('0');
  });

  it('should escape HTML in issue titles and summaries', () => {
    const issueWithHtml: IssueSummary = {
      number: 125,
      title: 'Bug with <script>alert("xss")</script>',
      url: 'https://github.com/test/repo/issues/125',
      summary: 'Summary with <&> special chars',
      labels: ['bug'],
      createdAt: '2024-01-13',
    };

    const html = generateEmailTemplate('test/repo', [issueWithHtml]);

    // HTML should be escaped
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;&');
    expect(html).not.toContain('<script>');
  });

  it('should include generation timestamp', () => {
    const html = generateEmailTemplate('test/repo', mockIssues);

    // Should contain a timestamp (format: YYYY/MM/DD HH:mm in Chinese locale)
    expect(html).toMatch(/\d{4}\/\d{2}\/\d{2}/);
  });
});
