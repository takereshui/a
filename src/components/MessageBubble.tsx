import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-3xl rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-orange-600 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 whitespace-pre-wrap break-words">
            {message.content}
          </div>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="复制"
            >
              {copied ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <Copy size={16} className="text-gray-400" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}