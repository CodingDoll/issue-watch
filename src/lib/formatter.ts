import chalk from "chalk";
import type { Issue } from "./github.js";

export interface ReadStatusMap {
  [issueNumber: string]: boolean;
}

export function formatIssues(
  issues: Issue[],
  readStatus?: ReadStatusMap,
  selectedIndex?: number,
): string {
  return formatSimple(issues, readStatus, selectedIndex);
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
