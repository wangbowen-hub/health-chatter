import DifyApiService from '../services/difyApi';

// 从环境变量获取API密钥
const getApiKey = (): string => {
  return import.meta.env.VITE_DIFY_API_KEY || '';
};

const getBaseUrl = (): string => {
  return import.meta.env.VITE_DIFY_BASE_URL || 'https://api.dify.ai/v1';
};

// 创建Dify API服务实例
export const createDifyService = (): DifyApiService | null => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn('Dify API密钥未设置，将使用模拟响应');
    return null;
  }

  return new DifyApiService({
    apiKey,
    baseUrl: getBaseUrl(),
  });
};

// 检查API密钥是否已设置
export const isDifyConfigured = (): boolean => {
  return getApiKey().length > 0;
}; 