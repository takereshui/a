export interface Prompt {
  id: string;
  title: string;
  description: string;
  system_prompt: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiSettings {
  id: string;
  api_url: string;
  api_key: string;
  default_model: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  cookie_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  prompt_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}