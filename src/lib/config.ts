// Configuration management for doll-cli

export interface Config {
  token: string;
  defaultState: 'open' | 'closed' | 'all';
  defaultLimit: number;
  defaultFormat: 'table' | 'json' | 'simple';
}

export function getConfig(cliToken?: string): Config {
  const token = cliToken || process.env.GITHUB_TOKEN || '';

  return {
    token,
    defaultState: (process.env.DOLL_DEFAULT_STATE as 'open' | 'closed' | 'all') || 'open',
    defaultLimit: parseInt(process.env.DOLL_DEFAULT_LIMIT || '30', 10),
    defaultFormat: (process.env.DOLL_DEFAULT_FORMAT as 'table' | 'json' | 'simple') || 'table',
  };
}

export function validateToken(token: string): void {
  // Token is optional - GitHub issues can be accessed publicly without auth
  // However, authenticated requests have higher rate limits
}
