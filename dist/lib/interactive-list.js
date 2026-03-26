import chalk from "chalk";
import open from "open";
export class InteractiveListNavigator {
    issues;
    options;
    state;
    terminalRows;
    visibleCount;
    isRunning = false;
    constructor(issues, options) {
        this.issues = issues;
        this.options = options;
        this.terminalRows = process.stdout.rows || 24;
        // Reserve space for header, footer, and margins
        this.visibleCount = Math.max(5, this.terminalRows - 8);
        this.state = {
            selectedIndex: 0,
            viewportOffset: 0,
        };
    }
    async start() {
        if (this.issues.length === 0) {
            console.log("No issues to display.");
            return;
        }
        this.isRunning = true;
        // Setup raw mode input
        process.stdin.setRawMode(true);
        process.stdin.setEncoding("utf8");
        process.stdin.resume();
        // Handle window resize
        process.stdout.on("resize", () => {
            this.terminalRows = process.stdout.rows || 24;
            this.visibleCount = Math.max(5, this.terminalRows - 8);
            this.ensureSelectionVisible();
            this.render();
        });
        // Initial render
        this.render();
        // Setup key handler
        return new Promise((resolve) => {
            const onData = (key) => {
                const shouldContinue = this.handleKeyPress(key);
                if (!shouldContinue) {
                    process.stdin.removeListener("data", onData);
                    process.stdin.setRawMode(false);
                    process.stdin.pause();
                    this.isRunning = false;
                    this.clearScreen();
                    resolve();
                }
            };
            process.stdin.on("data", onData);
        });
    }
    handleKeyPress(key) {
        // Handle special key sequences
        if (key === "\u0003") {
            // Ctrl+C
            return false;
        }
        if (key === "\u001b") {
            // Escape key - could be start of escape sequence
            return true;
        }
        // Handle arrow keys (escape sequences)
        if (key === "\u001b[A" || key === "\u001b[OA") {
            // Up arrow
            this.moveUp();
            return true;
        }
        if (key === "\u001b[B" || key === "\u001b[OB") {
            // Down arrow
            this.moveDown();
            return true;
        }
        // Handle regular keys
        switch (key) {
            case "q":
            case "Q":
                return false;
            case "j":
            case "J":
                this.moveDown();
                break;
            case "k":
            case "K":
                this.moveUp();
                break;
            case "g":
                // Jump to top (vim-style)
                this.jumpToTop();
                break;
            case "G":
                // Jump to bottom (vim-style)
                this.jumpToBottom();
                break;
            case "o":
            case "O":
            case "\r":
            case "\n":
                // Enter or 'o' - open selected issue
                this.openSelectedIssue();
                break;
            case " ":
                // Space - page down
                this.pageDown();
                break;
            case "b":
                // 'b' - page up
                this.pageUp();
                break;
        }
        return true;
    }
    moveUp() {
        if (this.state.selectedIndex > 0) {
            this.state.selectedIndex--;
            this.ensureSelectionVisible();
            this.render();
        }
    }
    moveDown() {
        if (this.state.selectedIndex < this.issues.length - 1) {
            this.state.selectedIndex++;
            this.ensureSelectionVisible();
            this.render();
        }
    }
    jumpToTop() {
        this.state.selectedIndex = 0;
        this.state.viewportOffset = 0;
        this.render();
    }
    jumpToBottom() {
        this.state.selectedIndex = this.issues.length - 1;
        this.ensureSelectionVisible();
        this.render();
    }
    pageUp() {
        const pageSize = Math.max(1, this.visibleCount - 2);
        this.state.selectedIndex = Math.max(0, this.state.selectedIndex - pageSize);
        this.ensureSelectionVisible();
        this.render();
    }
    pageDown() {
        const pageSize = Math.max(1, this.visibleCount - 2);
        this.state.selectedIndex = Math.min(this.issues.length - 1, this.state.selectedIndex + pageSize);
        this.ensureSelectionVisible();
        this.render();
    }
    ensureSelectionVisible() {
        // If selection is above viewport, scroll up
        if (this.state.selectedIndex < this.state.viewportOffset) {
            this.state.viewportOffset = this.state.selectedIndex;
        }
        // If selection is below viewport, scroll down
        else if (this.state.selectedIndex >= this.state.viewportOffset + this.visibleCount) {
            this.state.viewportOffset = this.state.selectedIndex - this.visibleCount + 1;
        }
    }
    async openSelectedIssue() {
        const issue = this.issues[this.state.selectedIndex];
        if (!issue)
            return;
        console.log(chalk.cyan(`\nOpening: ${issue.html_url}`));
        // Mark as read
        this.options.onMarkAsRead(issue.number);
        this.options.readStatus[issue.number] = true;
        // Open in browser
        await open(issue.html_url);
        // Redraw with updated status
        this.render();
    }
    clearScreen() {
        // Clear screen and move cursor to top-left
        process.stdout.write("\x1B[2J\x1B[0;0H");
    }
    render() {
        // Clear screen
        this.clearScreen();
        // Calculate visible range
        const startIndex = this.state.viewportOffset;
        const endIndex = Math.min(startIndex + this.visibleCount, this.issues.length);
        // Header
        console.log(chalk.bold(`\nIssues for ${this.options.owner}/${this.options.repo}`));
        console.log(chalk.gray(`Showing ${startIndex + 1}-${endIndex} of ${this.issues.length} issues`));
        console.log();
        // Issue list
        for (let i = startIndex; i < endIndex; i++) {
            const issue = this.issues[i];
            const isSelected = i === this.state.selectedIndex;
            const isRead = this.options.readStatus[issue.number] ?? false;
            let line = this.formatIssueLine(issue, i, isSelected, isRead);
            if (isSelected) {
                // Highlight selected row with inverse colors
                line = chalk.inverse(line);
            }
            console.log(line);
        }
        // Scroll indicators
        if (startIndex > 0) {
            console.log(chalk.gray("  ▲ more above"));
        }
        if (endIndex < this.issues.length) {
            console.log(chalk.gray("  ▼ more below"));
        }
        // Footer help
        console.log();
        console.log(chalk.gray("  j/↓: down  k/↑: up  o/Enter: open  g: top  G: bottom  space/b: page  q: quit"));
    }
    formatIssueLine(issue, index, isSelected, isRead) {
        const stateIcon = issue.state === "open" ? chalk.green("○") : chalk.red("●");
        const readIndicator = isRead ? chalk.green("✓") : chalk.gray("○");
        const number = chalk.cyan(`#${issue.number}`);
        // Truncate title to fit terminal width
        const terminalWidth = process.stdout.columns || 80;
        const prefixLength = 15; // Account for icons, spacing, number
        const maxTitleLength = terminalWidth - prefixLength;
        let title = issue.title;
        if (title.length > maxTitleLength) {
            title = title.substring(0, maxTitleLength - 3) + "...";
        }
        return `  ${readIndicator} ${stateIcon} ${number} ${title}`;
    }
}
//# sourceMappingURL=interactive-list.js.map