import React, { useState, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatSession, Message } from '../types/chat';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { createDifyService } from '../config/dify';
import DifyApiService from '../services/difyApi';
import { useAuth } from '../contexts/AuthContext';
import { getSystemUserByUsername } from '../data/systemUsers';
import { cleanThinkTags, generateChatTitle, generateTimeBasedTitle } from '../utils/messageUtils';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createNewSession = (): ChatSession => ({
  id: generateId(),
  title: generateTimeBasedTitle(new Date()),
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 生成AI回复的函数
const generateAIResponse = async (
  userMessage: string, 
  sessionId: string, 
  difyService: DifyApiService | null,
  username?: string,
  onChunk?: (chunk: string) => void
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
    
    const response = responses[Math.floor(Math.random() * responses.length)] + 
           "\n\n（模拟回复 - 请在.env文件中配置VITE_DIFY_API_KEY以获得真实AI回复）";
    
    // 模拟流式输出
    if (onChunk) {
      // 清理 think 标签
      const cleanedResponse = cleanThinkTags(response);
      const words = cleanedResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      }
      return cleanedResponse;
    }
    
    return cleanThinkTags(response);
  }

  try {
    // 获取系统用户信息，以便获取病历表文件路径
    const systemUser = username ? getSystemUserByUsername(username) : null;
    const medicalRecordFile = systemUser?.medicalRecordFile;

    // 使用流式API
    if (onChunk) {
      let fullResponse = '';
      let rawContent = ''; // 累积原始内容
      let displayedContent = ''; // 已显示的内容
      
      await difyService.sendMessageStream(
        userMessage, 
        sessionId, 
        (chunk: string) => {
          rawContent += chunk; // 累积原始内容
          
          // 检查是否有未闭合的 <think> 标签
          const openThinkIndex = rawContent.lastIndexOf('<think>');
          const closeThinkIndex = rawContent.lastIndexOf('</think>');
          
          let contentToProcess = rawContent;
          
          // 如果有未闭合的 <think> 标签，暂时保留该部分
          if (openThinkIndex > closeThinkIndex && openThinkIndex !== -1) {
            // 只处理到 <think> 标签之前的内容
            contentToProcess = rawContent.substring(0, openThinkIndex);
          }
          
          // 清理完整的 think 标签
          const cleanedContent = cleanThinkTags(contentToProcess);
          
          // 计算新增的内容
          if (cleanedContent.length > displayedContent.length) {
            const newContent = cleanedContent.substring(displayedContent.length);
            displayedContent = cleanedContent;
            fullResponse = cleanedContent;
            onChunk(newContent);
          }
        },
        {
          user: username || 'anonymous',
          medicalRecordFile: medicalRecordFile
        }
      );
      
      // 处理最后可能遗留的内容
      const finalCleaned = cleanThinkTags(rawContent);
      if (finalCleaned.length > displayedContent.length) {
        const remainingContent = finalCleaned.substring(displayedContent.length);
        onChunk(remainingContent);
        fullResponse = finalCleaned;
      }
      
      return fullResponse;
    } else {
      // 如果没有提供onChunk回调，使用阻塞式API
      const response = await difyService.sendMessage(userMessage, sessionId, {
        user: username || 'anonymous',
        medicalRecordFile: medicalRecordFile
      });
      // 清理阻塞式响应中的 think 标签
      return cleanThinkTags(response.answer || "抱歉，我没有收到有效的回复。");
    }
  } catch (error) {
    console.error('Dify API调用失败:', error);
    return "抱歉，AI服务暂时不可用，请稍后重试。";
  }
};

export const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  
  // 为每个用户创建独立的存储键
  const sessionsKey = user ? `chat-sessions-${user.id}` : 'chat-sessions-guest';
  const currentSessionKey = user ? `current-session-${user.id}` : 'current-session-guest';
  const hideMessagesKey = user ? `hide-messages-${user.id}` : 'hide-messages-guest';
  
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>(sessionsKey, []);
  const [currentSessionId, setCurrentSessionId] = useLocalStorage<string | null>(currentSessionKey, null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hideMessages, setHideMessages] = useLocalStorage<boolean>(hideMessagesKey, false);
  const difyServiceRef = useRef<DifyApiService | null>(createDifyService());

  // 使用 useMemo 来获取当前会话，确保状态更新后能立即反映
  const currentSession = React.useMemo(() => 
    sessions.find(s => s.id === currentSessionId), 
    [sessions, currentSessionId]
  );

  // 当用户切换时，重置聊天状态
  React.useEffect(() => {
    // 当用户变化时，重新初始化状态
    const newSessionsKey = user ? `chat-sessions-${user.id}` : 'chat-sessions-guest';
    const newCurrentSessionKey = user ? `current-session-${user.id}` : 'current-session-guest';
    
    // 如果键发生变化，说明用户已切换
    if (newSessionsKey !== sessionsKey || newCurrentSessionKey !== currentSessionKey) {
      // 清除当前的会话ID，让用户看到属于他们的聊天记录
      setCurrentSessionId(null);
    }
  }, [user?.id]);

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
      newSession.title = generateChatTitle(content);
      
      flushSync(() => {
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
      });
      
      setIsProcessing(true);
      
      // 生成AI回复
      setTimeout(async () => {
        try {
          // 先创建一个空的AI消息
          const aiMessage: Message = {
            id: generateId(),
            content: '',
            role: 'assistant',
            timestamp: new Date(),
          };
          
          // 立即添加空消息到会话中
          setSessions(prev => prev.map(session => 
            session.id === newSession.id 
              ? { 
                  ...session, 
                  messages: [...session.messages, aiMessage],
                  updatedAt: new Date()
                }
              : session
          ));
          
          // 使用流式响应逐步更新消息内容
          await generateAIResponse(
            content, 
            newSession.id, 
            difyServiceRef.current, 
            user?.username || 'anonymous',
            (chunk: string) => {
              // 更新消息内容
              setSessions(prev => prev.map(session => 
                session.id === newSession.id 
                  ? { 
                      ...session, 
                      messages: session.messages.map(msg => 
                        msg.id === aiMessage.id 
                          ? { ...msg, content: msg.content + chunk }
                          : msg
                      ),
                      updatedAt: new Date()
                    }
                  : session
              ));
            }
          );
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
      }, 500); // 减少延迟，让流式输出更快开始
      
      return;
    }

    // Add message to existing session
    const userMessage: Message = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    // 检查是否是对话的第一条消息，如果是则更新标题
    const isFirstMessage = currentSession?.messages.length === 0;
    const newTitle = isFirstMessage 
      ? generateChatTitle(content)
      : currentSession?.title;

    // 使用 flushSync 确保用户消息立即显示
    flushSync(() => {
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { 
              ...session, 
              title: newTitle || session.title,
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
        // 先创建一个空的AI消息
        const aiMessage: Message = {
          id: generateId(),
          content: '',
          role: 'assistant',
          timestamp: new Date(),
        };

        // 立即添加空消息到会话中
        setSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { 
                ...session, 
                messages: [...session.messages, aiMessage],
                updatedAt: new Date()
              }
            : session
        ));

        // 使用流式响应逐步更新消息内容
        await generateAIResponse(
          content, 
          currentSessionId, 
          difyServiceRef.current, 
          user?.username || 'anonymous',
          (chunk: string) => {
            // 更新消息内容
            setSessions(prev => prev.map(session => 
              session.id === currentSessionId 
                ? { 
                    ...session, 
                    messages: session.messages.map(msg => 
                      msg.id === aiMessage.id 
                        ? { ...msg, content: msg.content + chunk }
                        : msg
                    ),
                    updatedAt: new Date()
                  }
                : session
            ));
          }
        );
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
    }, 500); // 减少延迟，让流式输出更快开始
  }, [currentSessionId, setSessions, setCurrentSessionId]);

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
            
            {/* 右侧占位，保持布局平衡 */}
            <div className="w-24"></div>
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