-- In-App Notifications Table
-- Run this in Supabase SQL Editor

-- Notifications table - stores all notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'general', -- 'article', 'question_paper', 'general'
    content_id TEXT,
    content_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read notifications
CREATE POLICY "Allow public read" ON notifications
    FOR SELECT USING (true);

-- Allow authenticated users to mark as read
CREATE POLICY "Allow update" ON notifications
    FOR UPDATE USING (true);

-- Allow service role to insert
CREATE POLICY "Allow insert" ON notifications
    FOR INSERT WITH CHECK (true);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
