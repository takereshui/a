import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { initializeUser } from '../lib/userTracking';
import { Prompt, Message, Conversation } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatPageProps {
  prompt: Prompt;
  onBack: () => void;
}

export function ChatPage({ prompt, onBack }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function loadConversationHistory(convId: string) {
    try {
      const { data: historyMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (historyMessages) {
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  }

  async function initChat() {
    try {
      const uid = await initializeUser();
      setUserId(uid);

      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', uid)
        .eq('prompt_id', prompt.id)
        .order('updated_at', { ascending: false })
        .maybeSingle();

      let convId: string;

      if (existingConversation) {
        convId = existingConversation.id;
        await loadConversationHistory(convId);
      } else {
        const { data: conversation, error } = await supabase
          .from('conversations')
          .insert({
            user_id: uid,
            prompt_id: prompt.id,
            title: prompt.title,
          })
          .select()
          .single();

        if (error) throw error;
        convId = conversation.id;
      }

      setConversationId(convId);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  }

  async function handleSend() {
    if (!input.trim() || !conversationId || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      const { data: savedUserMsg, error: userMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: userMessage,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      setMessages((prev) => [...prev, savedUserMsg]);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: prompt.system_prompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const assistantContent = data.choices[0].message.content;

      const { data: savedAssistantMsg, error: assistantMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantContent,
        })
        .select()
        .single();

      if (assistantMsgError) throw assistantMsgError;

      setMessages((prev) => [...prev, savedAssistantMsg]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('发送消息失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{prompt.title}</h1>
            <p className="text-sm text-gray-500">{prompt.description}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}