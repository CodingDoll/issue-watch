import chalk from "chalk";
export function formatIssues(issues, readStatus, selectedIndex) {
    return formatSimple(issues, readStatus, selectedIndex);
}
function formatSimple(issues, readStatus, selectedIndex) {
    return issues
        .map((issue, index) => {
        const isRead = readStatus?.[issue.number] ?? false;
        const stateIcon = issue.state === "open" ? chalk.green("○") : chalk.red("●");
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
//# sourceMappingURL=formatter.js.map