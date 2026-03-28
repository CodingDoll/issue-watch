import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubClient } from './github.js';
// Mock the Octokit module
vi.mock('octokit', () => {
    return {
        Octokit: vi.fn().mockImplementation(() => ({
            rest: {
                issues: {
                    listForRepo: vi.fn(),
                    get: vi.fn(),
                },
            },
        })),
    };
});
import { Octokit } from 'octokit';
const mockConfig = {
    token: 'test-token',
    defaultState: 'open',
    defaultLimit: 30,
};
describe('GitHubClient', () => {
    let mockOctokitInstance;
    beforeEach(() => {
        vi.clearAllMocks();
        mockOctokitInstance = {
            rest: {
                issues: {
                    listForRepo: vi.fn(),
                    get: vi.fn(),
                },
            },
        };
        Octokit.mockImplementation(() => mockOctokitInstance);
    });
    describe('constructor', () => {
        it('should create Octokit with auth when token is provided', () => {
            new GitHubClient(mockConfig);
            expect(Octokit).toHaveBeenCalledWith({ auth: 'test-token' });
        });
        it('should create Octokit without auth when token is empty', () => {
            const configWithoutToken = { ...mockConfig, token: '' };
            new GitHubClient(configWithoutToken);
            expect(Octokit).toHaveBeenCalledWith({});
        });
    });
    describe('listIssues', () => {
        it('should list issues from a repository', async () => {
            const mockIssues = [
                {
                    number: 1,
                    title: 'Issue 1',
                    state: 'open',
                    body: 'Body 1',
                    user: { login: 'user1' },
                    labels: [{ name: 'bug', color: 'ff0000' }],
                    assignee: null,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z',
                    closed_at: null,
                    html_url: 'https://github.com/test/repo/issues/1',
                    pull_request: undefined,
                },
                {
                    number: 2,
                    title: 'Issue 2',
                    state: 'open',
                    body: 'Body 2',
                    user: { login: 'user2' },
                    labels: [],
                    assignee: null,
                    created_at: '2024-01-02T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z',
                    closed_at: null,
                    html_url: 'https://github.com/test/repo/issues/2',
                    pull_request: undefined,
                },
            ];
            mockOctokitInstance.rest.issues.listForRepo.mockResolvedValue({
                data: mockIssues,
            });
            const client = new GitHubClient(mockConfig);
            const issues = await client.listIssues('test-owner', 'test-repo', 'open', 30);
            expect(issues).toHaveLength(2);
            expect(issues[0].number).toBe(1);
            expect(issues[1].number).toBe(2);
            expect(mockOctokitInstance.rest.issues.listForRepo).toHaveBeenCalledWith({
                owner: 'test-owner',
                repo: 'test-repo',
                state: 'open',
                per_page: 30,
                page: 1,
            });
        });
        it('should filter out pull requests', async () => {
            const mockData = [
                {
                    number: 1,
                    title: 'Issue 1',
                    state: 'open',
                    body: 'Body',
                    user: { login: 'user1' },
                    labels: [],
                    assignee: null,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z',
                    closed_at: null,
                    html_url: 'https://github.com/test/repo/issues/1',
                    pull_request: undefined,
                },
                {
                    number: 2,
                    title: 'PR 1',
                    state: 'open',
                    body: 'PR Body',
                    user: { login: 'user1' },
                    labels: [],
                    assignee: null,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z',
                    closed_at: null,
                    html_url: 'https://github.com/test/repo/pull/2',
                    pull_request: { url: 'https://api.github.com/repos/test/repo/pulls/2' },
                },
            ];
            mockOctokitInstance.rest.issues.listForRepo.mockResolvedValue({
                data: mockData,
            });
            const client = new GitHubClient(mockConfig);
            const issues = await client.listIssues('test-owner', 'test-repo', 'open', 30);
            expect(issues).toHaveLength(1);
            expect(issues[0].number).toBe(1);
        });
    });
    describe('getIssue', () => {
        it('should get a single issue by number', async () => {
            const mockIssue = {
                number: 123,
                title: 'Specific Issue',
                state: 'open',
                body: 'Issue body',
                user: { login: 'testuser' },
                labels: [{ name: 'bug', color: 'ff0000' }],
                assignee: null,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
                closed_at: null,
                html_url: 'https://github.com/test/repo/issues/123',
            };
            mockOctokitInstance.rest.issues.get.mockResolvedValue({
                data: mockIssue,
            });
            const client = new GitHubClient(mockConfig);
            const issue = await client.getIssue('test-owner', 'test-repo', 123);
            expect(issue.number).toBe(123);
            expect(issue.title).toBe('Specific Issue');
            expect(mockOctokitInstance.rest.issues.get).toHaveBeenCalledWith({
                owner: 'test-owner',
                repo: 'test-repo',
                issue_number: 123,
            });
        });
    });
});
//# sourceMappingURL=github.test.js.map