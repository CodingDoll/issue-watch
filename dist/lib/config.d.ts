export interface Config {
    token: string;
    defaultState: 'open' | 'closed' | 'all';
    defaultLimit: number;
}
export declare function getConfig(cliToken?: string): Config;
export declare function validateToken(token: string): void;
//# sourceMappingURL=config.d.ts.map