/*
  # Create Notification System Tables

  1. New Tables
    - `notifications` - Store all notifications for users
      - `id` (uuid, primary key)
      - `user_id` (text) - Recipient username
      - `type` (text) - 'message', 'dm', 'update', 'feedback_reply'
      - `title` (text) - Notification title
      - `body` (text) - Notification message
      - `from_user` (text) - Who sent the notification
      - `data` (jsonb) - Extra data (chat_id, message_id, etc)
      - `is_read` (boolean)
      - `created_at` (timestamp)
      
    - `notification_preferences` - User notification settings
      - `user_id` (text, primary key)
      - `push_enabled` (boolean)
      - `email_enabled` (boolean)
      - `dm_notifications` (boolean)
      - `public_chat_notifications` (boolean)
      - `admin_updates` (boolean)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Users can only read their own notifications
    - Users can update their own preferences
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  from_user text,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id text PRIMARY KEY,
  push_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT false,
  dm_notifications boolean DEFAULT true,
  public_chat_notifications boolean DEFAULT false,
  admin_updates boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = current_setting('app.current_user'));

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = current_setting('app.current_user'))
  WITH CHECK (user_id = current_setting('app.current_user'));

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = current_setting('app.current_user'));

CREATE POLICY "Users can read own notification preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = current_setting('app.current_user'));

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = current_setting('app.current_user'))
  WITH CHECK (user_id = current_setting('app.current_user'));

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user'));

CREATE INDEX IF NOT EXISTS notifications_user_id_created_at 
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_id_is_read 
  ON notifications(user_id, is_read);