import DifyApiService from '../services/difyApi';

// 从环境变量获取API密钥
const getApiKey = (): string => {
  return import.meta.env.VITE_DIFY_API_KEY || '';
};

const getBaseUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_DIFY_BASE_URL || 'https://api.dify.ai/v1';
  
  // 在开发环境下，如果配置的是 dify.trialdata.cn，使用代理路径
  if (import.meta.env.DEV && configuredUrl.includes('dify.trialdata.cn')) {
    return '/api/dify/v1';
  }
  
  return configuredUrl;
};

// 创建Dify API服务实例
export const createDifyService = (): DifyApiService | null => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn('Dify API密钥未设置，将使用模拟响应');
    return null;
  }

  const baseUrl = getBaseUrl();
  console.log('Dify API 配置:', { baseUrl, hasApiKey: !!apiKey });

  return new DifyApiService({
    apiKey,
    baseUrl,
  });
};

// 检查API密钥是否已设置
export const isDifyConfigured = (): boolean => {
  return getApiKey().length > 0;
}; 