#!/usr/bin/env node
import { config } from 'dotenv';
config();
import { GitHubClient } from './lib/github.js';
import { getConfig } from './lib/config.js';
import { AISummarizer, getAIConfig } from './lib/ai.js';
import { EmailService, getEmailConfig } from './lib/email.js';
import { generateEmailTemplate } from './lib/email-template.js';
import cron from 'node-cron';
function getSchedulerConfig() {
    return {
        repoOwner: process.env.REPO_OWNER || '',
        repoName: process.env.REPO_NAME || '',
        cronSchedule: process.env.CRON_SCHEDULE || '0 9 * * *',
    };
}
function validateConfig() {
    const schedulerConfig = getSchedulerConfig();
    const emailConfig = getEmailConfig();
    const aiConfig = getAIConfig();
    const errors = [];
    if (!schedulerConfig.repoOwner) {
        errors.push('REPO_OWNER environment variable is required');
    }
    if (!schedulerConfig.repoName) {
        errors.push('REPO_NAME environment variable is required');
    }
    if (!emailConfig) {
        errors.push('Email configuration is incomplete. Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO');
    }
    if (!aiConfig) {
        errors.push('AI configuration is incomplete. Required: AI_URL, AI_TOKEN');
    }
    if (errors.length > 0) {
        console.error('Configuration errors:');
        errors.forEach(err => console.error(`  - ${err}`));
        process.exit(1);
    }
}
async function processIssues() {
    console.log('Starting issue-picket scan...');
    console.log(`Time: ${new Date().toISOString()}`);
    const schedulerConfig = getSchedulerConfig();
    const config = getConfig();
    const emailConfig = getEmailConfig();
    const aiConfig = getAIConfig();
    // Initialize clients
    const githubClient = new GitHubClient(config);
    const aiSummarizer = new AISummarizer(aiConfig);
    const emailService = new EmailService(emailConfig);
    const { repoOwner, repoName } = schedulerConfig;
    console.log(`Fetching priority unassigned issues from ${repoOwner}/${repoName}...`);
    // Fetch priority unassigned issues
    const issues = await githubClient.getPriorityUnassignedIssues(repoOwner, repoName, 30);
    console.log(`Found ${issues.length} priority unassigned issues`);
    if (issues.length === 0) {
        console.log('No issues to process. Sending "all clear" notification...');
        await emailService.sendEmail(`[Issue Picket] ${repoOwner}/${repoName} - 今日无优先级Issue`, `<!DOCTYPE html>
<html><body style="font-family: sans-serif; padding: 20px;">
  <h2>📬 Issue Picket 每日报告</h2>
  <p>仓库: <strong>${repoOwner}/${repoName}</strong></p>
  <p>今日没有发现符合筛选条件的优先级 Issue（Open + priority标签 + 未分配）。</p>
  <p style="color: #28a745;">🎉 一切都很好！</p>
</body></html>`);
        console.log('All-clear email sent successfully');
        return;
    }
    // Generate AI summaries for each issue
    console.log('Generating AI summaries in Chinese...');
    const issueSummaries = [];
    for (const issue of issues) {
        try {
            console.log(`  Processing #${issue.number}: ${issue.title.substring(0, 50)}...`);
            const summary = await aiSummarizer.summarizeIssueChinese(issue);
            issueSummaries.push({
                number: issue.number,
                title: issue.title,
                url: issue.html_url,
                summary,
                labels: issue.labels.map(l => l.name),
                createdAt: new Date(issue.created_at).toLocaleDateString('zh-CN'),
            });
        }
        catch (error) {
            console.error(`  Failed to summarize issue #${issue.number}: ${error.message}`);
            // Continue with other issues even if one fails
            issueSummaries.push({
                number: issue.number,
                title: issue.title,
                url: issue.html_url,
                summary: 'AI摘要生成失败，请查看原始Issue',
                labels: issue.labels.map(l => l.name),
                createdAt: new Date(issue.created_at).toLocaleDateString('zh-CN'),
            });
        }
    }
    // Generate and send email
    console.log('Generating email template...');
    const htmlContent = generateEmailTemplate(`${repoOwner}/${repoName}`, issueSummaries);
    console.log('Sending email notification...');
    await emailService.sendEmail(`[Issue Picket] ${repoOwner}/${repoName} - 发现 ${issueSummaries.length} 个优先级Issue`, htmlContent);
    console.log('Issue-picket scan completed successfully');
}
async function main() {
    console.log('Issue Picket - GitHub Priority Issue Monitor');
    console.log('===========================================\n');
    // Validate all configurations before starting
    validateConfig();
    const schedulerConfig = getSchedulerConfig();
    // Check if running in cron mode or one-time mode
    const isCronMode = process.argv.includes('--cron');
    if (isCronMode) {
        console.log(`Starting in cron mode with schedule: ${schedulerConfig.cronSchedule}`);
        // Validate cron expression
        if (!cron.validate(schedulerConfig.cronSchedule)) {
            console.error(`Invalid cron schedule: ${schedulerConfig.cronSchedule}`);
            process.exit(1);
        }
        // Schedule the job
        cron.schedule(schedulerConfig.cronSchedule, async () => {
            console.log(`\n[${new Date().toISOString()}] Cron job triggered`);
            try {
                await processIssues();
            }
            catch (error) {
                console.error(`Cron job failed: ${error.message}`);
            }
        });
        console.log('Cron job scheduled. Press Ctrl+C to stop.');
        // Keep the process running
        setInterval(() => { }, 1000 * 60 * 60);
    }
    else {
        console.log('Running one-time scan...\n');
        try {
            await processIssues();
            process.exit(0);
        }
        catch (error) {
            console.error(`Error: ${error.message}`);
            process.exit(1);
        }
    }
}
main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
//# sourceMappingURL=scheduler.js.map