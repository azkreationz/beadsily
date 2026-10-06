-- Migration 0003: Email Subscribers Table for Teaser Landing Page
-- Author: Oscar (oscar-muwid2fm), Backend Data & Inventory Engineer
-- Target: Cloudflare D1 (SQLite)

CREATE TABLE IF NOT EXISTS email_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL DEFAULT 'teaser_landing_page',
  confirmed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  ip_country TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON email_subscribers(email);
