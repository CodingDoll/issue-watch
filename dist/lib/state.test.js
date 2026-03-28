import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadState, saveState, markAsRead, markAsUnread, isRead, getReadIssues, getUnreadIssues, clearAllMarks, } from './state.js';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
const TEST_STATE_DIR = join(homedir(), '.issuewatch');
const TEST_STATE_FILE = join(TEST_STATE_DIR, 'state.json');
const OLD_STATE_DIR = join(homedir(), '.doll-cli');
const OLD_STATE_FILE = join(OLD_STATE_DIR, 'state.json');
describe('state module', () => {
    beforeEach(() => {
        // Clean up any existing state before each test (both old and new paths)
        if (existsSync(TEST_STATE_FILE)) {
            unlinkSync(TEST_STATE_FILE);
        }
        if (existsSync(OLD_STATE_FILE)) {
            unlinkSync(OLD_STATE_FILE);
        }
    });
    afterEach(() => {
        // Clean up after tests (both old and new paths)
        if (existsSync(TEST_STATE_FILE)) {
            unlinkSync(TEST_STATE_FILE);
        }
        if (existsSync(OLD_STATE_FILE)) {
            unlinkSync(OLD_STATE_FILE);
        }
    });
    describe('loadState and saveState', () => {
        it('should return empty object when no state file exists', () => {
            const state = loadState();
            expect(state).toEqual({});
        });
        it('should save and load state correctly', () => {
            const testState = {
                'test-owner/test-repo': {
                    '123': { read: true, readAt: '2024-01-15T10:30:00Z' },
                    '456': { read: false, readAt: '2024-01-15T11:00:00Z' },
                },
            };
            saveState(testState);
            const loaded = loadState();
            expect(loaded).toEqual(testState);
        });
    });
    describe('markAsRead', () => {
        it('should mark an issue as read', () => {
            markAsRead('test-owner', 'test-repo', 123);
            const state = loadState();
            const repoKey = 'test-owner/test-repo';
            expect(state[repoKey]).toBeDefined();
            expect(state[repoKey]['123']).toBeDefined();
            expect(state[repoKey]['123'].read).toBe(true);
            expect(state[repoKey]['123'].readAt).toBeDefined();
        });
        it('should handle multiple issues in same repo', () => {
            markAsRead('test-owner', 'test-repo', 123);
            markAsRead('test-owner', 'test-repo', 456);
            const state = loadState();
            const repoKey = 'test-owner/test-repo';
            expect(state[repoKey]['123'].read).toBe(true);
            expect(state[repoKey]['456'].read).toBe(true);
        });
        it('should handle issues in different repos', () => {
            markAsRead('owner1', 'repo1', 123);
            markAsRead('owner2', 'repo2', 456);
            const state = loadState();
            expect(state['owner1/repo1']['123'].read).toBe(true);
            expect(state['owner2/repo2']['456'].read).toBe(true);
        });
    });
    describe('markAsUnread', () => {
        it('should mark an issue as unread', () => {
            // First mark as read
            markAsRead('test-owner', 'test-repo', 123);
            // Then mark as unread
            markAsUnread('test-owner', 'test-repo', 123);
            const state = loadState();
            expect(state['test-owner/test-repo']['123'].read).toBe(false);
        });
    });
    describe('isRead', () => {
        it('should return false for issues never marked', () => {
            const result = isRead('test-owner', 'test-repo', 999);
            expect(result).toBe(false);
        });
        it('should return true for read issues', () => {
            markAsRead('test-owner', 'test-repo', 123);
            const result = isRead('test-owner', 'test-repo', 123);
            expect(result).toBe(true);
        });
        it('should return false for explicitly unread issues', () => {
            markAsRead('test-owner', 'test-repo', 123);
            markAsUnread('test-owner', 'test-repo', 123);
            const result = isRead('test-owner', 'test-repo', 123);
            expect(result).toBe(false);
        });
        it('should handle different repos independently', () => {
            markAsRead('owner1', 'repo1', 123);
            expect(isRead('owner1', 'repo1', 123)).toBe(true);
            expect(isRead('owner2', 'repo2', 123)).toBe(false);
        });
    });
    describe('getReadIssues', () => {
        it('should return empty array when no issues read', () => {
            const result = getReadIssues('test-owner', 'test-repo');
            expect(result).toEqual([]);
        });
        it('should return only read issue numbers', () => {
            markAsRead('test-owner', 'test-repo', 123);
            markAsRead('test-owner', 'test-repo', 456);
            markAsUnread('test-owner', 'test-repo', 789);
            const result = getReadIssues('test-owner', 'test-repo');
            expect(result).toContain(123);
            expect(result).toContain(456);
            expect(result).not.toContain(789);
        });
    });
    describe('getUnreadIssues', () => {
        it('should return all issues when none are read', () => {
            const allIssues = [1, 2, 3];
            const result = getUnreadIssues('test-owner', 'test-repo', allIssues);
            expect(result).toEqual([1, 2, 3]);
        });
        it('should exclude read issues', () => {
            markAsRead('test-owner', 'test-repo', 2);
            const allIssues = [1, 2, 3];
            const result = getUnreadIssues('test-owner', 'test-repo', allIssues);
            expect(result).toEqual([1, 3]);
        });
    });
    describe('clearAllMarks', () => {
        it('should remove all marks for a repo', () => {
            markAsRead('test-owner', 'test-repo', 123);
            markAsRead('test-owner', 'test-repo', 456);
            clearAllMarks('test-owner', 'test-repo');
            expect(isRead('test-owner', 'test-repo', 123)).toBe(false);
            expect(isRead('test-owner', 'test-repo', 456)).toBe(false);
            expect(getReadIssues('test-owner', 'test-repo')).toEqual([]);
        });
        it('should not affect other repos', () => {
            markAsRead('owner1', 'repo1', 123);
            markAsRead('owner2', 'repo2', 456);
            clearAllMarks('owner1', 'repo1');
            expect(isRead('owner1', 'repo1', 123)).toBe(false);
            expect(isRead('owner2', 'repo2', 456)).toBe(true);
        });
    });
});
//# sourceMappingURL=state.test.js.map