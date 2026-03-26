import { describe, it, expect } from 'vitest';
import { formatIssues, formatIssueDetail, OutputFormat } from './formatter.js';
import type { Issue } from './github.js';

// Mock issue data for testing
const mockIssues: Issue[] = [
  {
    number: 1,
    title: 'First issue',
    state: 'open',
    body: 'This is the first issue',
    user: { login: 'user1' },
    labels: [{ name: 'bug', color: 'ff0000' }],
    assignee: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    closed_at: null,
    html_url: 'https://github.com/test/repo/issues/1',
  },
  {
    number: 2,
    title: 'Second issue',
    state: 'closed',
    body: 'This is the second issue',
    user: { login: 'user2' },
    labels: [{ name: 'feature', color: '00ff00' }, { name: 'help wanted', color: 'ffff00' }],
    assignee: { login: 'assignee1' },
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    closed_at: '2024-01-05T00:00:00Z',
    html_url: 'https://github.com/test/repo/issues/2',
  },
];

describe('formatIssues', () => {
  it('should format issues as JSON', () => {
    const result = formatIssues(mockIssues, 'json' as OutputFormat);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].number).toBe(1);
    expect(parsed[1].number).toBe(2);
  });

  it('should format issues as simple format', () => {
    const result = formatIssues(mockIssues, 'simple' as OutputFormat);
    const lines = result.split('\n');
    // Format now has 3 lines: issue 1, blank line, issue 2
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines[0]).toContain('#1');
    expect(lines[0]).toContain('First issue');
    // Find the line with issue 2 (may have blank lines in between)
    const lineWithIssue2 = lines.find((line) => line.includes('#2'));
    expect(lineWithIssue2).toBeDefined();
    expect(lineWithIssue2).toContain('Second issue');
    expect(lineWithIssue2).toContain('●'); // closed state icon
  });

  it('should format issues as table (default)', () => {
    const result = formatIssues(mockIssues, 'table' as OutputFormat, 'test/repo');
    expect(result).toContain('Issues for test/repo');
    expect(result).toContain('#1');
    expect(result).toContain('First issue');
    expect(result).toContain('bug');
  });

  it('should handle empty issues array', () => {
    const result = formatIssues([], 'json' as OutputFormat);
    expect(result).toBe('[]');
  });
});

describe('formatIssueDetail', () => {
  it('should format a single issue detail', () => {
    const result = formatIssueDetail(mockIssues[0]);
    expect(result).toContain('Issue #1');
    expect(result).toContain('First issue');
    expect(result).toContain('open');
    expect(result).toContain('user1');
    expect(result).toContain('This is the first issue');
    expect(result).toContain('https://github.com/test/repo/issues/1');
  });

  it('should format closed issue correctly', () => {
    const result = formatIssueDetail(mockIssues[1]);
    expect(result).toContain('closed');
    expect(result).toContain('feature');
    expect(result).toContain('help wanted');
  });

  it('should handle issue with no body', () => {
    const issueWithoutBody = { ...mockIssues[0], body: null };
    const result = formatIssueDetail(issueWithoutBody);
    expect(result).toContain('Issue #1');
    expect(result).not.toContain('Description');
  });

  it('should handle issue with no labels', () => {
    const issueWithoutLabels = { ...mockIssues[0], labels: [] };
    const result = formatIssueDetail(issueWithoutLabels);
    expect(result).toContain('Issue #1');
    expect(result).not.toContain('Labels');
  });
});
