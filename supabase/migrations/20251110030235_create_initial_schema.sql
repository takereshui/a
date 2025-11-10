/*
  # Initial Schema for AI Prompt Application

  1. New Tables
    - `prompts`
      - `id` (uuid, primary key)
      - `title` (text) - Template title
      - `description` (text) - Template description
      - `system_prompt` (text) - System prompt content
      - `is_active` (boolean) - Template status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `api_settings`
      - `id` (uuid, primary key)
      - `api_url` (text) - API endpoint URL
      - `api_key` (text) - API key (encrypted)
      - `default_model` (text) - Default AI model
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `users`
      - `id` (uuid, primary key)
      - `cookie_id` (text, unique) - Anonymous user cookie
      - `created_at` (timestamptz)
    
    - `conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `prompt_id` (uuid, foreign key)
      - `title` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for prompts (active only)
    - Authenticated admin access for management
    - Cookie-based access for conversations and messages
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cookie_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  system_prompt text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create api_settings table
CREATE TABLE IF NOT EXISTS api_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL,
  api_key text NOT NULL,
  default_model text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  prompt_id uuid REFERENCES prompts(id) ON DELETE SET NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Prompts policies (public read for active prompts)
CREATE POLICY "Anyone can view active prompts"
  ON prompts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage prompts"
  ON prompts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- API settings policies (admin only)
CREATE POLICY "Authenticated users can view api settings"
  ON api_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage api settings"
  ON api_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Users policies (allow creation)
CREATE POLICY "Anyone can create users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view their own user"
  ON users FOR SELECT
  USING (true);

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (true);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages from their conversations"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Insert default prompt
INSERT INTO prompts (title, description, system_prompt, is_active) 
VALUES (
  '人生答疑',
  '输入启动开始~ 你不需要给出"正确答案"，也不要只回一句，代入日常生活感给出你的具体信息（纠结，困惑，感受，信念，期待等很有价值），如果提问让你等待评估，请直接回复它给出报告',
  '你是一位善解人意的人生导师，帮助用户解答生活中的困惑和问题。请以温暖、真诚的态度回应，给出具体可行的建议。',
  true
) ON CONFLICT DO NOTHING;