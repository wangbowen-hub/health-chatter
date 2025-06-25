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

class DifyApiService {
  private config: DifyConfig;
  private conversationMap: Map<string, string> = new Map();

  constructor(config: DifyConfig) {
    this.config = {
      baseUrl: 'https://api.dify.ai/v1',
      ...config
    };
  }

  async sendMessage(
    query: string, 
    sessionId: string, 
    options: {
      responseMode?: 'blocking' | 'streaming';
      user?: string;
      inputs?: Record<string, unknown>;
    } = {}
  ): Promise<DifyResponse> {
    const {
      responseMode = 'blocking',
      user = 'default-user',
      inputs = {}
    } = options;

    const conversationId = this.conversationMap.get(sessionId);

    const requestBody: DifyMessage = {
      query,
      response_mode: responseMode,
      user,
      inputs,
      ...(conversationId && { conversation_id: conversationId })
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
    } = {}
  ): Promise<void> {
    const {
      user = 'default-user',
      inputs = {}
    } = options;

    const conversationId = this.conversationMap.get(sessionId);

    const requestBody: DifyMessage = {
      query,
      response_mode: 'streaming',
      user,
      inputs,
      ...(conversationId && { conversation_id: conversationId })
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
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.event === 'message') {
                onChunk(data.answer);
                // 保存conversation_id
                if (data.conversation_id) {
                  this.conversationMap.set(sessionId, data.conversation_id);
                }
              }
            } catch {
              // 忽略解析错误的数据行
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
  }

  updateConfig(config: Partial<DifyConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export default DifyApiService; 