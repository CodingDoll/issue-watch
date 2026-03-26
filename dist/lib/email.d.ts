export interface EmailConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    to: string;
}
export declare class EmailService {
    private transporter;
    private config;
    constructor(config: EmailConfig);
    sendEmail(subject: string, htmlContent: string): Promise<void>;
    verifyConnection(): Promise<boolean>;
}
export declare function getEmailConfig(): EmailConfig | null;
//# sourceMappingURL=email.d.ts.map