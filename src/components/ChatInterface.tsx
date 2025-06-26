import React, { useState, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Menu, ChevronLeft, ChevronRight, LogOut, User } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatSession, Message } from '../types/chat';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { createDifyService } from '../config/dify';
import DifyApiService from '../services/difyApi';
import { useAuth } from '../contexts/AuthContext';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createNewSession = (): ChatSession => ({
  id: generateId(),
  title: '新对话',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 生成AI回复的函数
const generateAIResponse = async (
  userMessage: string, 
  sessionId: string, 
  difyService: DifyApiService | null
): Promise<string> => {
  if (!difyService) {
    // 如果没有配置Dify服务，返回模拟回复
    const responses = [
      "这是一个很有趣的问题！让我来为您详细解答...",
      "根据您的描述，我认为可以从以下几个方面来看...",
      "这个问题涉及到多个方面，让我逐一为您分析...",
      "非常感谢您的提问，这确实是一个值得深入思考的话题...",
      "基于当前的信息，我建议您可以考虑以下方案...",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)] + 
           "\n\n（模拟回复 - 请在.env文件中配置VITE_DIFY_API_KEY以获得真实AI回复）";
  }

  try {
    const response = await difyService.sendMessage(userMessage, sessionId);
    return response.answer || "抱歉，我没有收到有效的回复。";
  } catch (error) {
    console.error('Dify API调用失败:', error);
    return "抱歉，AI服务暂时不可用，请稍后重试。";
  }
};

export const ChatInterface: React.FC = () => {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>('chat-sessions', []);
  const [currentSessionId, setCurrentSessionId] = useLocalStorage<string | null>('current-session-id', null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hideMessages, setHideMessages] = useLocalStorage<boolean>('hide-messages', false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const difyServiceRef = useRef<DifyApiService | null>(createDifyService());

  // 使用 useMemo 来获取当前会话，确保状态更新后能立即反映
  const currentSession = React.useMemo(() => 
    sessions.find(s => s.id === currentSessionId), 
    [sessions, currentSessionId]
  );

  const handleNewSession = useCallback(() => {
    const newSession = createNewSession();
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSidebarOpen(false);
  }, [setSessions, setCurrentSessionId]);

  const handleSessionSelect = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSidebarOpen(false);
  }, [setCurrentSessionId]);

  const handleRenameSession = useCallback((sessionId: string, newTitle: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, title: newTitle, updatedAt: new Date() }
        : session
    ));
  }, [setSessions]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (sessionId === currentSessionId) {
        setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
    // 清除Dify会话映射
    if (difyServiceRef.current) {
      difyServiceRef.current.clearConversation(sessionId);
    }
  }, [setSessions, currentSessionId, setCurrentSessionId]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!currentSessionId) {
      // Create new session if none exists
      const newSession = createNewSession();
      const userMessage: Message = {
        id: generateId(),
        content,
        role: 'user',
        timestamp: new Date(),
      };
      
      newSession.messages = [userMessage];
      newSession.title = content.length > 30 ? content.substring(0, 30) + '...' : content;
      
      flushSync(() => {
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
      });
      
      setIsProcessing(true);
      
      // 生成AI回复
      setTimeout(async () => {
        try {
          const aiResponse = await generateAIResponse(content, newSession.id, difyServiceRef.current);
          const aiMessage: Message = {
            id: generateId(),
            content: aiResponse,
            role: 'assistant',
            timestamp: new Date(),
          };
          
          setSessions(prev => prev.map(session => 
            session.id === newSession.id 
              ? { 
                  ...session, 
                  messages: [...session.messages, aiMessage],
                  updatedAt: new Date()
                }
              : session
          ));
        } catch (error) {
          console.error('AI回复生成失败:', error);
          const errorMessage: Message = {
            id: generateId(),
            content: "抱歉，生成回复时出现错误，请稍后重试。",
            role: 'assistant',
            timestamp: new Date(),
          };
          
          setSessions(prev => prev.map(session => 
            session.id === newSession.id 
              ? { 
                  ...session, 
                  messages: [...session.messages, errorMessage],
                  updatedAt: new Date()
                }
              : session
          ));
        }
        setIsProcessing(false);
      }, 1000 + Math.random() * 2000);
      
      return;
    }

    // Add message to existing session
    const userMessage: Message = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    // 使用 flushSync 确保用户消息立即显示
    flushSync(() => {
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { 
              ...session, 
              messages: [...session.messages, userMessage],
              updatedAt: new Date()
            }
          : session
      ));
    });

    setIsProcessing(true);

    // 生成AI回复
    setTimeout(async () => {
      try {
        const aiResponse = await generateAIResponse(content, currentSessionId, difyServiceRef.current);
        const aiMessage: Message = {
          id: generateId(),
          content: aiResponse,
          role: 'assistant',
          timestamp: new Date(),
        };

        setSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { 
                ...session, 
                messages: [...session.messages, aiMessage],
                updatedAt: new Date()
              }
            : session
        ));
      } catch (error) {
        console.error('AI回复生成失败:', error);
        const errorMessage: Message = {
          id: generateId(),
          content: "抱歉，生成回复时出现错误，请稍后重试。",
          role: 'assistant',
          timestamp: new Date(),
        };

        setSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { 
                ...session, 
                messages: [...session.messages, errorMessage],
                updatedAt: new Date()
              }
            : session
        ));
      }
      setIsProcessing(false);
    }, 1000 + Math.random() * 2000);
  }, [currentSessionId, setSessions, setCurrentSessionId]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    // 清理本地数据
    setSessions([]);
    setCurrentSessionId(null);
  };

  // Initialize with a session if none exists
  React.useEffect(() => {
    if (sessions.length === 0) {
      handleNewSession();
    }
  }, [sessions.length, handleNewSession]);

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={hideMessages}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <Menu size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setHideMessages(!hideMessages)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                title={hideMessages ? "展开侧边栏" : "折叠侧边栏"}
              >
                {hideMessages ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Health Chatter
            </h1>
            
            {/* 用户菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                  {user?.username}
                </span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={16} />
                    退出登录
                  </button>
                </div>
              )}
              
              {/* 点击外部关闭菜单 */}
              {showUserMenu && (
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <MessageList 
          messages={currentSession?.messages || []} 
          isProcessing={isProcessing} 
        />

        {/* Input */}
        <MessageInput onSendMessage={handleSendMessage} disabled={isProcessing} />
      </div>
    </div>
  );
};