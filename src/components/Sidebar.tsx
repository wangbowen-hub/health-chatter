import React, { useState } from 'react';
import { Plus, MessageSquare, Edit3, Trash2, X, Check } from 'lucide-react';
import { ChatSession } from '../types/chat';
import { UserProfile } from './UserProfile';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  isOpen,
  onClose,
  isCollapsed,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('zh-CN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 bg-gray-100 dark:bg-gray-900 transform transition-all duration-300 ease-in-out flex flex-col
        ${isCollapsed ? 'w-16' : 'w-80'}
        ${isOpen || isCollapsed ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {isCollapsed ? (
          /* Collapsed state */
          <div className="flex flex-col items-center py-4 space-y-4">
                         <button
               onClick={onNewSession}
               className="p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
               title="新对话"
             >
              <Plus size={20} />
            </button>
            
            {/* Current session indicator */}
            {currentSessionId && (
              <div className="w-8 h-1 bg-blue-500 rounded-full"></div>
            )}
            
            {/* Show history count */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {sessions.length}
            </div>
          </div>
        ) : (
          /* Expanded state */
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={onNewSession}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <Plus size={16} />
                新对话
              </button>
              <button
                onClick={onClose}
                className="md:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* User Profile */}
            <UserProfile />

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`
                      group relative rounded-xl cursor-pointer transition-all duration-200
                                          ${currentSessionId === session.id 
                      ? 'bg-white dark:bg-gray-800 shadow-sm' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700/80'
                    }
                    `}
                    onClick={() => currentSessionId !== session.id && onSessionSelect(session.id)}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <MessageSquare size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      {editingId === session.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {session.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(session.updatedAt)}
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(session);
                              }}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                              }}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};