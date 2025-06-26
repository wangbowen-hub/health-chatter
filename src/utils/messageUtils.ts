/**
 * 清理消息内容，去除 <think></think> 标签及其内容
 * @param content 原始消息内容
 * @returns 清理后的内容
 */
export const cleanThinkTags = (content: string): string => {
  // 使用正则表达式去除 <think></think> 标签及其内容
  // 支持多行匹配，包括标签内的换行符
  // 使用非贪婪匹配和更严格的模式
  const thinkTagRegex = /<think>[\s\S]*?<\/think>/gim;
  
  // 调试日志
  if (content.includes('<think>')) {
    console.log('Original content contains <think> tags:', content);
  }
  
  const cleaned = content.replace(thinkTagRegex, '');
  
  // 如果还有残留的 think 标签，尝试更激进的清理
  if (cleaned.includes('<think>') || cleaned.includes('</think>')) {
    // 处理可能不完整的标签
    const partialCleaned = cleaned
      .replace(/<think>[\s\S]*/i, '') // 移除从 <think> 开始到结尾的所有内容
      .replace(/[\s\S]*<\/think>/i, ''); // 移除从开头到 </think> 的所有内容
    
    console.log('Partial tags detected, aggressive cleaning applied');
    return partialCleaned.trim();
  }
  
  if (content !== cleaned) {
    console.log('Cleaned content:', cleaned);
  }
  
  return cleaned.trim();
};

/**
 * 检查消息是否包含 markdown 内容
 * @param content 消息内容
 * @returns 是否包含 markdown 格式
 */
export const hasMarkdownContent = (content: string): boolean => {
  // 检查常见的 markdown 格式标记
  const markdownPatterns = [
    /#{1,6}\s/,           // 标题 # ## ###
    /\*\*.*?\*\*/,        // 粗体 **text**
    /\*.*?\*/,            // 斜体 *text*
    /`.*?`/,              // 行内代码 `code`
    /```[\s\S]*?```/,     // 代码块 ```code```
    /\[.*?\]\(.*?\)/,     // 链接 [text](url)
    /^\s*[-*+]\s/m,       // 无序列表 - * +
    /^\s*\d+\.\s/m,       // 有序列表 1. 2. 3.
    /^\s*>\s/m,           // 引用 >
    /^\s*\|.*\|/m,        // 表格 |column|
    /!\[.*?\]\(.*?\)/,    // 图片 ![alt](url)
  ];
  
  return markdownPatterns.some(pattern => pattern.test(content));
};

/**
 * 处理消息内容，清理思考标签并判断是否需要 markdown 渲染
 * @param content 原始消息内容
 * @returns 处理结果对象
 */
export const processMessageContent = (content: string): {
  cleanedContent: string;
  hasMarkdown: boolean;
} => {
  const cleanedContent = cleanThinkTags(content);
  const hasMarkdown = hasMarkdownContent(cleanedContent);
  
  return {
    cleanedContent,
    hasMarkdown,
  };
};

// 生成对话标题的函数
export const generateChatTitle = (content: string, options?: {
  maxLength?: number;
  includeEmoji?: boolean;
}): string => {
  const { maxLength = 30, includeEmoji = true } = options || {};
  
  // 移除多余的空白字符
  const cleanContent = content.trim().replace(/\s+/g, ' ');
  
  // 尝试提取问句作为标题
  const questionMatch = cleanContent.match(/[^。？！]*[？]/);
  if (questionMatch) {
    const question = questionMatch[0];
    return question.length > maxLength 
      ? question.substring(0, maxLength - 3) + '...'
      : question;
  }
  
  // 尝试提取第一句话
  const firstSentence = cleanContent.match(/^[^。！？]+/)?.[0] || cleanContent;
  
  // 根据内容类型添加表情符号
  let emoji = '';
  if (includeEmoji) {
    if (/健康|医|病|症状|疼|痛|药/.test(cleanContent)) {
      emoji = '🏥 ';
    } else if (/饮食|吃|喝|营养/.test(cleanContent)) {
      emoji = '🍎 ';
    } else if (/运动|锻炼|健身/.test(cleanContent)) {
      emoji = '💪 ';
    } else if (/睡|眠|休息/.test(cleanContent)) {
      emoji = '😴 ';
    } else if (/心理|情绪|压力|焦虑/.test(cleanContent)) {
      emoji = '🧠 ';
    }
  }
  
  const title = firstSentence.length > maxLength 
    ? firstSentence.substring(0, maxLength - 3) + '...'
    : firstSentence;
    
  return emoji + title;
};

// 根据时间生成友好的标题
export const generateTimeBasedTitle = (date: Date = new Date()): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return '刚刚的对话';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前的对话`;
  } else if (diffInMinutes < 24 * 60) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}小时前的对话`;
  } else {
    return date.toLocaleString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' 的对话';
  }
}; 