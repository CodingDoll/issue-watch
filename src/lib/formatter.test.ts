import { describe, it, expect } from 'vitest';
import { formatIssues } from './formatter.js';
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
  it('should format issues as simple format', () => {
    const result = formatIssues(mockIssues);
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

  it('should handle empty issues array', () => {
    const result = formatIssues([]);
    expect(result).toBe('');
  });
});
