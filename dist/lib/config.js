// Configuration management for doll-cli
export function getConfig(cliToken) {
    const token = cliToken || process.env.GITHUB_TOKEN || '';
    return {
        token,
        defaultState: process.env.DOLL_DEFAULT_STATE || 'open',
        defaultLimit: parseInt(process.env.DOLL_DEFAULT_LIMIT || '30', 10),
        defaultFormat: process.env.DOLL_DEFAULT_FORMAT || 'table',
    };
}
export function validateToken(token) {
    // Token is optional - GitHub issues can be accessed publicly without auth
    // However, authenticated requests have higher rate limits
}
//# sourceMappingURL=config.js.map