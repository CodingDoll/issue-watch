import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AISummarizer, getAIConfig, type AIConfig } from './ai.js';
import type { Issue } from './github.js';

// Mock Issue data
const mockIssue: Issue = {
  number: 123,
  title: 'Test Issue Title',
  state: 'open',
  body: 'This is a detailed description of the issue. It contains important information about the bug.',
  user: { login: 'testuser' },
  labels: [{ name: 'bug', color: 'ff0000' }],
  assignee: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  closed_at: null,
  html_url: 'https://github.com/test/repo/issues/123',
};

const mockAIConfig: AIConfig = {
  url: 'https://api.openai.com/v1/chat/completions',
  token: 'test-token',
  model: 'gpt-4',
};

describe('getAIConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AI_URL;
    delete process.env.AI_TOKEN;
    delete process.env.AI_MODEL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return null when AI_URL is not set', () => {
    process.env.AI_TOKEN = 'token';
    const config = getAIConfig();
    expect(config).toBeNull();
  });

  it('should return null when AI_TOKEN is not set', () => {
    process.env.AI_URL = 'https://api.example.com';
    const config = getAIConfig();
    expect(config).toBeNull();
  });

  it('should return config when both AI_URL and AI_TOKEN are set', () => {
    process.env.AI_URL = 'https://api.example.com';
    process.env.AI_TOKEN = 'my-token';
    const config = getAIConfig();

    expect(config).not.toBeNull();
    expect(config?.url).toBe('https://api.example.com');
    expect(config?.token).toBe('my-token');
    expect(config?.model).toBe('gpt-4'); // default
  });

  it('should use AI_MODEL when provided', () => {
    process.env.AI_URL = 'https://api.example.com';
    process.env.AI_TOKEN = 'my-token';
    process.env.AI_MODEL = 'gpt-3.5-turbo';
    const config = getAIConfig();

    expect(config?.model).toBe('gpt-3.5-turbo');
  });
});

describe('AISummarizer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('summarizeIssue', () => {
    it('should successfully summarize an issue', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is a test summary of the issue.',
            },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const summarizer = new AISummarizer(mockAIConfig);
      const summary = await summarizer.summarizeIssue(mockIssue);

      expect(summary).toBe('This is a test summary of the issue.');
      expect(fetch).toHaveBeenCalledWith(
        mockAIConfig.url,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle API error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Rate limit exceeded'),
      });

      const summarizer = new AISummarizer(mockAIConfig);

      await expect(summarizer.summarizeIssue(mockIssue)).rejects.toThrow(
        'Failed to summarize issue: AI API error: undefined - Rate limit exceeded'
      );
    });

    it('should handle network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const summarizer = new AISummarizer(mockAIConfig);

      await expect(summarizer.summarizeIssue(mockIssue)).rejects.toThrow(
        'Failed to summarize issue: Network error'
      );
    });

    it('should return default message when no content in response', async () => {
      const mockResponse = {
        choices: [{ message: { content: '' } }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const summarizer = new AISummarizer(mockAIConfig);
      const summary = await summarizer.summarizeIssue(mockIssue);

      expect(summary).toBe('No summary available');
    });
  });

  describe('categorizeIssues', () => {
    it('should categorize issues into categories', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Bug' } }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const summarizer = new AISummarizer(mockAIConfig);
      const issues = [mockIssue, { ...mockIssue, number: 124 }];
      const categories = await summarizer.categorizeIssues(issues);

      expect(categories['Bug']).toHaveLength(2);
      expect(categories['Feature']).toHaveLength(0);
      expect(categories['Documentation']).toHaveLength(0);
      expect(categories['Other']).toHaveLength(0);
    });

    it('should place issues in Other for invalid categories', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'InvalidCategory' } }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const summarizer = new AISummarizer(mockAIConfig);
      const issues = [mockIssue];
      const categories = await summarizer.categorizeIssues(issues);

      expect(categories['Other']).toHaveLength(1);
    });
  });

  describe('summarizeIssueChinese', () => {
    it('should generate Chinese summary', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '这是一个测试摘要，描述了一个重要的bug问题需要尽快修复。',
            },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const summarizer = new AISummarizer(mockAIConfig);
      const summary = await summarizer.summarizeIssueChinese(mockIssue);

      expect(summary).toContain('测试摘要');
      expect(summary.length).toBeLessThanOrEqual(100);
    });

    it('should truncate long summaries', async () => {
      const longSummary = '这是一个很长的摘要'.repeat(20);
      const mockResponse = {
        choices: [{ message: { content: longSummary } }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const summarizer = new AISummarizer(mockAIConfig);
      const summary = await summarizer.summarizeIssueChinese(mockIssue);

      expect(summary.length).toBeLessThanOrEqual(100);
      expect(summary.endsWith('...')).toBe(true);
    });
  });
});
