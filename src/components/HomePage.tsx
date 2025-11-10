import { useEffect, useState } from 'react';
import { Coffee } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';
import { PromptCard } from './PromptCard';

interface HomePageProps {
  onPromptSelect: (prompt: Prompt) => void;
  onLoginClick: () => void;
}

export function HomePage({ onPromptSelect, onLoginClick }: HomePageProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrompts();
  }, []);

  async function loadPrompts() {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coffee className="text-orange-600" size={32} strokeWidth={2} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">热水的茶壶</h1>
              <p className="text-sm text-gray-500">嗅点热茶 品下人生</p>
            </div>
          </div>
          <button
            onClick={onLoginClick}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            登录
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            选择一个对话模板开始
          </h2>
          <p className="text-gray-600 text-lg">
            点击下方的模板卡片,开启你的AI对话之旅
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">加载中...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onClick={() => onPromptSelect(prompt)}
              />
            ))}
          </div>
        )}

        {!loading && prompts.length === 0 && (
          <div className="text-center text-gray-500">暂无可用模板</div>
        )}
      </main>
    </div>
  );
}