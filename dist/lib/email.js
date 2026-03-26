import nodemailer from 'nodemailer';
export class EmailService {
    transporter;
    config;
    constructor(config) {
        this.config = config;
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465,
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });
    }
    async sendEmail(subject, htmlContent) {
        try {
            await this.transporter.sendMail({
                from: this.config.from,
                to: this.config.to,
                subject,
                html: htmlContent,
            });
            console.log(`Email sent successfully to ${this.config.to}`);
        }
        catch (error) {
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
    async verifyConnection() {
        try {
            await this.transporter.verify();
            return true;
        }
        catch {
            return false;
        }
    }
}
export function getEmailConfig() {
    const host = process.env.SMTP_HOST || '';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';
    const from = process.env.EMAIL_FROM || '';
    const to = process.env.EMAIL_TO || '';
    if (!host || !user || !pass || !from || !to) {
        return null;
    }
    return { host, port, user, pass, from, to };
}
//# sourceMappingURL=email.js.map