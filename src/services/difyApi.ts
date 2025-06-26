export interface DifyConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface DifyMessage {
  query: string;
  response_mode: 'blocking' | 'streaming';
  conversation_id?: string;
  user: string;
  inputs?: Record<string, unknown>;
  files?: Array<{
    type: string;
    transfer_method: string;
    upload_file_id: string;
  }>;
}

export interface DifyResponse {
  event: string;
  task_id: string;
  id: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: {
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      total_price: string;
      currency: string;
      latency: number;
    };
    retriever_resources?: Array<{
      position: number;
      dataset_id: string;
      dataset_name: string;
      document_id: string;
      document_name: string;
      segment_id: string;
      score: number;
      content: string;
    }>;
  };
  created_at: number;
}

export interface DifyFileUploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_at: number;
}

class DifyApiService {
  private config: DifyConfig;
  private conversationMap: Map<string, string> = new Map();
  private userFileMap: Map<string, string> = new Map(); // 存储用户上传的文件ID

  constructor(config: DifyConfig) {
    this.config = {
      baseUrl: 'https://api.dify.ai/v1',
      ...config
    };
  }

  // 上传文件到 Dify
  async uploadFile(filePath: string, userId: string): Promise<string | null> {
    try {
      // 处理文件路径，确保正确的相对路径
      let fullPath = filePath;
      if (filePath.startsWith('/')) {
        fullPath = filePath.substring(1);
      }
      
      // 构建完整的URL（相对于应用根目录）
      const fileUrl = `${window.location.origin}/${fullPath}`;
      
      // 先尝试获取文件
      const response = await fetch(fileUrl);
      if (!response.ok) {
        console.error(`无法读取文件: ${fileUrl}`);
        return null;
      }
      
      const blob = await response.blob();
      const fileName = fullPath.split('/').pop() || 'medical_record.pdf';
      
      // 创建FormData
      const formData = new FormData();
      formData.append('file', new File([blob], fileName, { type: 'application/pdf' }));
      formData.append('user', userId);
      
      // 上传文件到Dify
      const uploadResponse = await fetch(`${this.config.baseUrl}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`文件上传失败: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
      }

      const result: DifyFileUploadResponse = await uploadResponse.json();
      console.log(`文件上传成功: ${fileName}, ID: ${result.id}`);
      return result.id;
      
    } catch (error) {
      console.error('文件上传失败:', error);
      // 如果是开发环境，返回一个模拟的文件ID
      if (import.meta.env.DEV) {
        console.warn('开发模式：返回模拟文件ID');
        return 'mock-file-id-' + Date.now();
      }
      return null;
    }
  }

  async sendMessage(
    query: string, 
    sessionId: string, 
    options: {
      responseMode?: 'blocking' | 'streaming';
      user?: string;
      inputs?: Record<string, unknown>;
      medicalRecordFile?: string; // 新增：病历表文件路径
    } = {}
  ): Promise<DifyResponse> {
    const {
      responseMode = 'blocking',
      user = 'default-user',
      inputs = {},
      medicalRecordFile
    } = options;

    const conversationId = this.conversationMap.get(sessionId);
    const isNewConversation = !conversationId;
    
    let fileId: string | null = null;
    
    // 如果是新会话且有病历表文件，先上传文件
    if (isNewConversation && medicalRecordFile) {
      const cachedFileId = this.userFileMap.get(`${sessionId}-${user}`);
      if (cachedFileId) {
        fileId = cachedFileId;
      } else {
        fileId = await this.uploadFile(medicalRecordFile, user);
        if (fileId) {
          this.userFileMap.set(`${sessionId}-${user}`, fileId);
        }
      }
    }

    const requestBody: DifyMessage = {
      query,
      response_mode: responseMode,
      user,
      inputs,
      ...(conversationId && { conversation_id: conversationId }),
      ...(fileId && { 
        files: [{
          type: 'document',
          transfer_method: 'local_file',
          upload_file_id: fileId
        }]
      })
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Dify API错误: ${response.status} ${response.statusText}`);
      }

      const data: DifyResponse = await response.json();
      
      // 保存conversation_id以便后续使用
      if (data.conversation_id) {
        this.conversationMap.set(sessionId, data.conversation_id);
      }

      return data;
    } catch (error) {
      console.error('Dify API调用失败:', error);
      throw error;
    }
  }

  async sendMessageStream(
    query: string,
    sessionId: string,
    onChunk: (chunk: string) => void,
    options: {
      user?: string;
      inputs?: Record<string, unknown>;
      medicalRecordFile?: string; // 新增：病历表文件路径
    } = {}
  ): Promise<void> {
    const {
      user = 'default-user',
      inputs = {},
      medicalRecordFile
    } = options;

    const conversationId = this.conversationMap.get(sessionId);
    const isNewConversation = !conversationId;
    
    let fileId: string | null = null;
    
    // 如果是新会话且有病历表文件，先上传文件
    if (isNewConversation && medicalRecordFile) {
      const cachedFileId = this.userFileMap.get(`${sessionId}-${user}`);
      if (cachedFileId) {
        fileId = cachedFileId;
      } else {
        fileId = await this.uploadFile(medicalRecordFile, user);
        if (fileId) {
          this.userFileMap.set(`${sessionId}-${user}`, fileId);
        }
      }
    }

    const requestBody: DifyMessage = {
      query,
      response_mode: 'streaming',
      user,
      inputs,
      ...(conversationId && { conversation_id: conversationId }),
      ...(fileId && { 
        files: [{
          type: 'document',
          transfer_method: 'local_file',
          upload_file_id: fileId
        }]
      })
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Dify API错误: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 按行分割处理
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一行（可能不完整）

        for (const line of lines) {
          if (line.trim() === '') continue; // 跳过空行
          
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            
            // 处理特殊的结束标记
            if (dataStr === '[DONE]') {
              continue;
            }
            
            try {
              const data = JSON.parse(dataStr);
              
              // 根据不同的事件类型处理
              if (data.event === 'message' || data.event === 'agent_message') {
                if (data.answer !== undefined && data.answer !== '') {
                  onChunk(data.answer);
                }
                // 保存conversation_id
                if (data.conversation_id) {
                  this.conversationMap.set(sessionId, data.conversation_id);
                }
              } else if (data.event === 'message_end') {
                // 消息结束事件
                if (data.conversation_id) {
                  this.conversationMap.set(sessionId, data.conversation_id);
                }
              } else if (data.event === 'error') {
                // 错误事件
                throw new Error(data.message || 'Stream error');
              }
            } catch (e) {
              // 忽略解析错误的数据行
              console.warn('解析SSE数据失败:', dataStr, e);
            }
          }
        }
      }
      
      // 处理剩余的buffer
      if (buffer.trim()) {
        if (buffer.startsWith('data: ')) {
          const dataStr = buffer.slice(6);
          if (dataStr !== '[DONE]') {
            try {
              const data = JSON.parse(dataStr);
              if ((data.event === 'message' || data.event === 'agent_message') && data.answer) {
                onChunk(data.answer);
              }
            } catch (e) {
              console.warn('解析最后的SSE数据失败:', dataStr, e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Dify流式API调用失败:', error);
      throw error;
    }
  }

  clearConversation(sessionId: string): void {
    this.conversationMap.delete(sessionId);
    // 清除该会话相关的所有文件ID缓存
    const keysToDelete: string[] = [];
    this.userFileMap.forEach((_, key) => {
      if (key.startsWith(`${sessionId}-`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.userFileMap.delete(key));
  }

  updateConfig(config: Partial<DifyConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export default DifyApiService; 