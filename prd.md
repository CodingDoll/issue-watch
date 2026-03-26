产品需求文档 (PRD) - Node.js 版
1. 项目目标
创建一个名为 issue-picket 的自动化工具，每日扫描指定的 GitHub 仓库，筛选出 Label 包含 "priority" 且 未分配（Unassigned） 的 Open Issues，生成 AI 摘要并发送邮件。
2. 技术栈
 * 运行时: Node.js (建议 v20+)
 * SDK: @octokit/rest (GitHub 官方库)
 * AI 总结: openai 或 langchain (连接 Claude/GPT)
 * 邮件发送: nodemailer
 * 任务调度: node-cron (用于定时任务)
 * 配置管理: dotenv 或 zod (进行环境变量校验)
3. 核心逻辑流
 * Fetch: 轮询 GitHub API 获取 Issues。
 * Filter: 过滤 state === 'open' && assignee === null && labels.some(l => l.name.includes('priority'))。
 * Summarize: 将 Issue Title + Body 喂给 LLM，输出 3 句以内的中文摘要。
 * Notify: 格式化为 HTML 邮件发送。
🗺️ 步骤计划文档 (Step-by-Step Plan)
你可以按顺序给 Claude Code 下达这些指令：
第一阶段：初始化与基础通信
 * 环境初始化: npm init -y 并安装依赖：@octokit/rest, dotenv, axios。
 * GitHub 认证模块: 编写一个 githubService.js，通过 process.env.GH_TOKEN 初始化 Octokit，并实现一个 getPriorityIssues(owner, repo) 函数。
 * 数据过滤: 确保函数能正确识别 unassigned 状态且包含特定关键字 label 的 Issue。
第二阶段：AI 摘要提取
 * AI 服务接入: 创建 aiService.js，配置 OpenAI/Anthropic 客户端。
 * Prompt 设计: 编写一个函数 summarizeIssue(issue)。
   * Prompt 示例: "你是一个技术专家，请用简洁的中文总结以下 Issue 的核心问题和紧急程度，不超过 100 字。"
 * 批处理逻辑: 使用 Promise.all 或串行异步调用（防止 API 限流）处理所有过滤出的 Issues。
第三阶段：邮件模板与发送
 * 邮件发送模块: 编写 mailService.js，使用 nodemailer 配置 SMTP 传输。
 * HTML 模板渲染: 编写一个生成表格或列表样式的 HTML 函数，包含 Issue 链接、标题和 AI 总结。
第四阶段：整合与自动化
 * 主程序逻辑: 编写 index.js 串联上述流程。
 * 定时任务: 添加 cron 逻辑，例如每天早上 9 点触发执行。
 * 错误处理: 增加日志记录和异常捕获，确保即使一个 Issue 总结失败，也不会中断整个流程。
