import React, { useEffect, useRef } from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types/chat';
import { processMessageContent } from '../utils/messageUtils';

interface MessageListProps {
  messages: Message[];
  isProcessing?: boolean;
}

interface MessageContentProps {
  content: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  const { cleanedContent, hasMarkdown } = processMessageContent(content);

  // 如果内容为空，显示加载动画
  if (!content || content.trim() === '') {
    return (
      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="text-sm">正在思考...</span>
      </div>
    );
  }

  if (hasMarkdown) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定义组件样式
          h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-white">{children}</h3>,
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-white">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mb-3">
              {children}
            </pre>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic mb-3 text-gray-600 dark:text-gray-400">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
              {children}
            </td>
          ),
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    );
  }

  // 如果没有markdown格式，使用普通文本渲染
  return (
    <div className="whitespace-pre-wrap break-words">
      {cleanedContent}
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isProcessing = false 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Bot size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            你好！我是 Health Chatter
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            我是一个健康咨询AI助手，可以帮助您回答健康相关问题、提供医疗建议、协助健康管理等。请随时向我提问！
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {messages.map((message) => (
            <div key={message.id} className="group">
              <div className={`flex gap-4 ${message.role === 'assistant' ? 'items-start' : 'items-start'}`}>
                {/* Avatar */}
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center
                  ${message.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-br from-emerald-500 to-green-600'
                  }
                `}>
                  {message.role === 'user' ? (
                    <User size={18} className="text-white" />
                  ) : (
                    <Bot size={18} className="text-white" />
                  )}
                </div>

                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {message.role === 'user' ? '你' : 'Health Chatter'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                      {message.timestamp.toLocaleTimeString('zh-CN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className={`
                    prose prose-sm max-w-none leading-relaxed rounded-2xl p-4
                    ${message.role === 'user' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-800 dark:text-gray-200' 
                      : 'bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200'
                    }
                  `}>
                    <MessageContent content={message.content} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};