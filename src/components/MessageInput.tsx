import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [input]);

  return (
    <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end bg-gray-50 dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="发送消息给 Health Chatter..."
              disabled={disabled}
              className="flex-1 resize-none bg-transparent px-6 py-4 pr-16 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
              rows={1}
              style={{ minHeight: '56px', maxHeight: '200px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || disabled}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2.5 bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-600 dark:disabled:hover:bg-gray-600 transition-all duration-200"
            >
              {disabled ? (
                <Square size={18} className="fill-current" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </form>
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
          Health Chatter 可能会犯错。请核实重要信息。
        </div>
      </div>
    </div>
  );
};