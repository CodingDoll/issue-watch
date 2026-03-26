import chalk from "chalk";
import Table from "cli-table3";
import type { Issue } from "./github.js";

export type OutputFormat = "table" | "json" | "simple";

export interface ReadStatusMap {
  [issueNumber: string]: boolean;
}

export function formatIssues(
  issues: Issue[],
  format: OutputFormat,
  repoContext?: string,
  readStatus?: ReadStatusMap,
  selectedIndex?: number,
): string {
  switch (format) {
    case "json":
      return JSON.stringify(issues, null, 2);
    case "simple":
      return formatSimple(issues, readStatus, selectedIndex);
    case "table":
    default:
      return formatTable(issues, repoContext, readStatus);
  }
}

function formatTable(
  issues: Issue[],
  repoContext?: string,
  readStatus?: ReadStatusMap,
): string {
  const table = new Table({
    head: ["", "#", "Title", "Labels", "Author", "Assignee"],
    colWidths: [3, 8, 41, 16, 14, 14],
    wordWrap: true,
  });

  for (const issue of issues) {
    const labels =
      issue.labels.length > 0
        ? issue.labels.map((l) => l.name).join(", ")
        : "-";
    const assignee = issue.assignee ? `@${issue.assignee.login}` : "-";
    const isRead = readStatus?.[issue.number] ?? false;
    const readIndicator = isRead ? chalk.green("✓") : chalk.gray("○");

    table.push([
      readIndicator,
      chalk.cyan(`#${issue.number}`),
      issue.title,
      labels,
      chalk.yellow(`@${issue.user.login}`),
      assignee,
    ]);
  }

  const header = repoContext
    ? chalk.bold(`\nIssues for ${repoContext}:\n`)
    : "";
  return header + table.toString();
}

function formatSimple(issues: Issue[], readStatus?: ReadStatusMap, selectedIndex?: number): string {
  return issues
    .map((issue, index) => {
      const isRead = readStatus?.[issue.number] ?? false;
      const stateIcon =
        issue.state === "open" ? chalk.green("○") : chalk.red("●");
      const readIndicator = isRead ? chalk.green("✓") : chalk.gray("□");
      const idx = chalk.gray(`[${index + 1}]`);
      const number = chalk.cyan(`#${issue.number}`);
      let line = `${idx} ${readIndicator} ${stateIcon} ${number}: ${issue.title}\n`;

      // Apply highlighting if this row is selected
      if (selectedIndex !== undefined && index === selectedIndex) {
        line = chalk.inverse(line);
      }

      return line;
    })
    .join("────────────────────────────────────────────────────────\n");
}

export function formatIssueDetail(issue: Issue, isRead?: boolean): string {
  const stateColor = issue.state === "open" ? chalk.green : chalk.red;
  const readStatusText = isRead
    ? chalk.green("✓ Read")
    : chalk.gray("○ Unread");
  const lines: string[] = [
    "",
    chalk.bold(`Issue #${issue.number}: ${issue.title}`),
    "",
    `  State:    ${stateColor(issue.state)}`,
    `  Status:   ${readStatusText}`,
    `  Author:   @${issue.user.login}`,
    `  Created:  ${formatDate(issue.created_at)}`,
    `  Updated:  ${formatDate(issue.updated_at)}`,
    `  URL:      ${issue.html_url}`,
    "",
  ];

  if (issue.labels.length > 0) {
    lines.push(`  Labels:   ${issue.labels.map((l) => l.name).join(", ")}`);
    lines.push("");
  }

  if (issue.body) {
    lines.push(chalk.bold("Description:"));
    lines.push("");
    const bodyLines = issue.body.split("\n").map((line) => `  ${line}`);
    lines.push(...bodyLines);
    lines.push("");
  }

  return lines.join("\n");
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
