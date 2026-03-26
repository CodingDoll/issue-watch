import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmailService, getEmailConfig } from './email.js';
import type { EmailConfig } from './email.js';

const mockEmailConfig: EmailConfig = {
  host: 'smtp.example.com',
  port: 587,
  user: 'test@example.com',
  pass: 'password123',
  from: 'sender@example.com',
  to: 'recipient@example.com',
};

describe('getEmailConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.EMAIL_FROM;
    delete process.env.EMAIL_TO;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return null when no env vars are set', () => {
    const config = getEmailConfig();
    expect(config).toBeNull();
  });

  it('should return null when some required vars are missing', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'user';
    // Missing SMTP_PASS, EMAIL_FROM, EMAIL_TO
    const config = getEmailConfig();
    expect(config).toBeNull();
  });

  it('should return config when all required env vars are set', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'password';
    process.env.EMAIL_FROM = 'sender@example.com';
    process.env.EMAIL_TO = 'recipient@example.com';

    const config = getEmailConfig();

    expect(config).not.toBeNull();
    expect(config?.host).toBe('smtp.example.com');
    expect(config?.port).toBe(587);
    expect(config?.user).toBe('test@example.com');
    expect(config?.pass).toBe('password');
    expect(config?.from).toBe('sender@example.com');
    expect(config?.to).toBe('recipient@example.com');
  });

  it('should use default port 587 when SMTP_PORT is not set', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.EMAIL_FROM = 'from@test.com';
    process.env.EMAIL_TO = 'to@test.com';
    // SMTP_PORT not set

    const config = getEmailConfig();
    expect(config?.port).toBe(587);
  });
});
