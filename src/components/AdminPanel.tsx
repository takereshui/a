import { useEffect, useState } from 'react';
import { Home, Settings as SettingsIcon, Plus, Edit2, Trash2, X, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Prompt, ApiSettings } from '../types';

interface AdminPanelProps {
  onLogout: () => void;
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'prompts' | 'api'>('prompts');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [apiSettings, setApiSettings] = useState<ApiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [promptsResult, apiResult] = await Promise.all([
        supabase.from('prompts').select('*').order('created_at', { ascending: false }),
        supabase.from('api_settings').select('*').maybeSingle(),
      ]);

      if (promptsResult.error) throw promptsResult.error;
      if (apiResult.error) throw apiResult.error;

      setPrompts(promptsResult.data || []);
      setApiSettings(apiResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openPromptModal(prompt?: Prompt) {
    setEditingPrompt(prompt || null);
    setShowPromptModal(true);
  }

  function closePromptModal() {
    setShowPromptModal(false);
    setEditingPrompt(null);
  }

  async function handleDeletePrompt(id: string) {
    if (!confirm('确定要删除这个模板吗？')) return;

    try {
      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) throw error;
      setPrompts(prompts.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('删除失败');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
          <div className="flex gap-3">
            {activeTab === 'prompts' && (
              <button
                onClick={() => setShowApiModal(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <SettingsIcon size={18} />
                API设置
              </button>
            )}
            <button
              onClick={onLogout}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <Home size={18} />
              返回首页
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">对话模板管理</h2>
            <button
              onClick={() => openPromptModal()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              添加模板
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">标题</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">描述</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prompts.map((prompt) => (
                  <tr key={prompt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{prompt.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{prompt.description}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          prompt.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {prompt.is_active ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openPromptModal(prompt)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(prompt.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showPromptModal && (
        <PromptModal
          prompt={editingPrompt}
          onClose={closePromptModal}
          onSave={() => {
            closePromptModal();
            loadData();
          }}
        />
      )}

      {showApiModal && (
        <ApiSettingsModal
          settings={apiSettings}
          onClose={() => setShowApiModal(false)}
          onSave={() => {
            setShowApiModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

interface PromptModalProps {
  prompt: Prompt | null;
  onClose: () => void;
  onSave: () => void;
}

function PromptModal({ prompt, onClose, onSave }: PromptModalProps) {
  const [title, setTitle] = useState(prompt?.title || '');
  const [description, setDescription] = useState(prompt?.description || '');
  const [systemPrompt, setSystemPrompt] = useState(prompt?.system_prompt || '');
  const [isActive, setIsActive] = useState(prompt?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (prompt) {
        const { error } = await supabase
          .from('prompts')
          .update({
            title,
            description,
            system_prompt: systemPrompt,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prompt.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('prompts').insert({
          title,
          description,
          system_prompt: systemPrompt,
          is_active: isActive,
        });

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {prompt ? '编辑模板' : '添加模板'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">系统提示词</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={6}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              启用此模板
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ApiSettingsModalProps {
  settings: ApiSettings | null;
  onClose: () => void;
  onSave: () => void;
}

function ApiSettingsModal({ settings, onClose, onSave }: ApiSettingsModalProps) {
  const [apiUrl, setApiUrl] = useState(settings?.api_url || '');
  const [apiKey, setApiKey] = useState(settings?.api_key || '');
  const [defaultModel, setDefaultModel] = useState(settings?.default_model || '');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: defaultModel,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        setTestResult({ success: true, message: '连接成功！API配置正确。' });
      } else {
        const errorText = await response.text();
        setTestResult({ success: false, message: `连接失败: ${response.status} - ${errorText}` });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `连接错误: ${error instanceof Error ? error.message : '未知错误'}`
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (settings) {
        const { error } = await supabase
          .from('api_settings')
          .update({
            api_url: apiUrl,
            api_key: apiKey,
            default_model: defaultModel,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('api_settings').insert({
          api_url: apiUrl,
          api_key: apiKey,
          default_model: defaultModel,
        });

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving API settings:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">API设置</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API地址</label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.siliconflow.cn/v1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API密钥</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">默认模型</label>
            <input
              type="text"
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              placeholder="deepseek-ai/DeepSeek-V3.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.message}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !apiUrl || !apiKey || !defaultModel}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              <Zap size={16} />
              {testing ? '测试中...' : '测试连接'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}