import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getConfig, validateToken, type Config } from './config.js';

describe('getConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    delete process.env.GITHUB_TOKEN;
    delete process.env.DOLL_DEFAULT_STATE;
    delete process.env.DOLL_DEFAULT_LIMIT;
    delete process.env.DOLL_DEFAULT_FORMAT;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default config when no env vars or CLI token provided', () => {
    const config = getConfig();

    expect(config.token).toBe('');
    expect(config.defaultState).toBe('open');
    expect(config.defaultLimit).toBe(30);
    expect(config.defaultFormat).toBe('table');
  });

  it('should use CLI token when provided', () => {
    const config = getConfig('cli-token-123');

    expect(config.token).toBe('cli-token-123');
  });

  it('should prefer CLI token over env var', () => {
    process.env.GITHUB_TOKEN = 'env-token-456';
    const config = getConfig('cli-token-123');

    expect(config.token).toBe('cli-token-123');
  });

  it('should use env var token when no CLI token provided', () => {
    process.env.GITHUB_TOKEN = 'env-token-456';
    const config = getConfig();

    expect(config.token).toBe('env-token-456');
  });

  it('should use DOLL_DEFAULT_STATE env var', () => {
    process.env.DOLL_DEFAULT_STATE = 'closed';
    const config = getConfig();

    expect(config.defaultState).toBe('closed');
  });

  it('should use DOLL_DEFAULT_LIMIT env var', () => {
    process.env.DOLL_DEFAULT_LIMIT = '50';
    const config = getConfig();

    expect(config.defaultLimit).toBe(50);
  });

  it('should use DOLL_DEFAULT_FORMAT env var', () => {
    process.env.DOLL_DEFAULT_FORMAT = 'json';
    const config = getConfig();

    expect(config.defaultFormat).toBe('json');
  });

  it('should handle invalid DOLL_DEFAULT_LIMIT gracefully', () => {
    process.env.DOLL_DEFAULT_LIMIT = 'invalid';
    const config = getConfig();

    expect(config.defaultLimit).toBeNaN();
  });
});

describe('validateToken', () => {
  it('should not throw for empty token', () => {
    expect(() => validateToken('')).not.toThrow();
  });

  it('should not throw for valid token', () => {
    expect(() => validateToken('ghp_1234567890abcdef')).not.toThrow();
  });
});
