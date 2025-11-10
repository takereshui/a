import { Tag } from 'lucide-react';
import { Prompt } from '../types';

interface PromptCardProps {
  prompt: Prompt;
  onClick: () => void;
}

export function PromptCard({ prompt, onClick }: PromptCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-orange-400 group"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
        {prompt.title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed mb-4">
        {prompt.description}
      </p>
      <button className="flex items-center gap-2 text-orange-600 font-medium text-sm border border-orange-600 px-4 py-2 rounded hover:bg-orange-600 hover:text-white transition-colors">
        <Tag size={16} />
        开始对话
      </button>
    </div>
  );
}